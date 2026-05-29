/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PlannerSheet, Sticker, SheetType, NotepadItem, AgendaData, ListCategory, CalendarData } from './types';
import { INITIAL_PLANNER_SHEETS, STICKER_PRESETS, COLORS } from './data';
import PlannerSheetView from './components/PlannerSheetView';
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  BookOpen, 
  Download, 
  Plus, 
  Scissors, 
  HelpCircle,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  Smile,
  Share2,
  ExternalLink,
  Copy,
  Check,
  X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import LZString from 'lz-string';

const STORAGE_KEY = 'creative_desk_planner_sheets_v2';

export default function App() {
  const [sheets, setSheets] = useState<PlannerSheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string>('');
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  // Sticker drawer states
  const [customBadgeText, setCustomBadgeText] = useState('');
  const [customBadgeColor, setCustomBadgeColor] = useState('#f59e0b'); // amber default
  
  // App system states
  const [isExporting, setIsExporting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deskTheme, setDeskTheme] = useState<'wooden' | 'corkboard' | 'minimal pastel'>('wooden');
  
  // Interactive mini-app mode state
  const [miniAppSheet, setMiniAppSheet] = useState<PlannerSheet | null>(null);
  const [isMiniAppMode, setIsMiniAppMode] = useState(false);
  const currentMiniAppSheetRef = useRef<PlannerSheet | null>(null);

  // Custom modal state for sharing to prevent navigator.clipboard sandbox issues
  const [shareModalConfig, setShareModalConfig] = useState<{ isOpen: boolean; url: string; copied: boolean }>({
    isOpen: false,
    url: '',
    copied: false,
  });

  // Load state from local storage and URL hash
  useEffect(() => {
    // 1. Load active desk sheets from localStorage first to prevent empty states
    let loadedSheets: PlannerSheet[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          loadedSheets = parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved sheets', e);
    }

    // Fallback to presets if nothing found
    if (loadedSheets.length === 0) {
      loadedSheets = [...INITIAL_PLANNER_SHEETS];
    }

    // Force unique sheets by ID to strictly avoid duplicated templates or dual listings
    const uniqueSheetsMap = new Map<string, PlannerSheet>();
    loadedSheets.forEach((sheet) => {
      if (sheet && sheet.id) {
        uniqueSheetsMap.set(sheet.id, sheet);
      }
    });
    const uniqueSheets = Array.from(uniqueSheetsMap.values());

    setSheets(uniqueSheets);
    if (uniqueSheets.length > 0) {
      setActiveSheetId(uniqueSheets[0].id);
    }

    // 2. Separate check function for mini app mode URL hashes
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#mini-app=')) {
        try {
          const compressed = hash.replace('#mini-app=', '');
          const json = LZString.decompressFromBase64(compressed);
          if (json) {
            const data = JSON.parse(json);
            setMiniAppSheet(data);
            currentMiniAppSheetRef.current = data;
            setIsMiniAppMode(true);
            return true;
          }
        } catch (e) {
          console.error('Failed to parse shareable mini-app link', e);
        }
      } else {
        setIsMiniAppMode(false);
        setMiniAppSheet(null);
      }
      return false;
    };

    handleHashCheck();

    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  // Save sheets in localStorage whenever they change
  useEffect(() => {
    if (sheets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
    }
  }, [sheets]);

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  // Sheet operations (Update, Add, Delete, Reset)
  const handleUpdateSheet = (updated: PlannerSheet) => {
    setSheets(sheets.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleAddFieldSheet = (type: SheetType) => {
    let title = '';
    let subtitle = '';
    let templateData: Partial<PlannerSheet> = {};

    const colors = ['purple', 'pink', 'emerald', 'amber', 'sky', 'rose', 'peach', 'stone'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const chosenColorObj = COLORS.find((c) => c.accentTailwind === randomColor) || COLORS[0];

    if (type === 'blocknote') {
      title = 'Note & Idee 🗒️';
      subtitle = 'Uno spazio tutto mio per ghiribizzi';
      templateData = {
        notepadContent: {
          notesText: 'Scrivi pure liberamente qui...\n- Aggiungi pensieri\n- Trascina sticker per decorare!',
          items: [
            { id: `n_${Date.now()}_1`, text: 'Compilare l\'agenda di oggi', done: false },
            { id: `n_${Date.now()}_2`, text: 'Pausa caffè rigenerante ☕', done: true }
          ]
        }
      };
    } else if (type === 'agenda') {
      title = 'La mia Giornata ☀️';
      subtitle = 'Organizzazione oraria e rituali sani';
      templateData = {
        agendaData: {
          focusOfTheDay: 'Qual è il traguardo principale di oggi?',
          slots: [
            { time: '08:00', text: 'Colazione & Caffè lofi ☕' },
            { time: '10:00', text: 'Studio / Lavoro focalizzato 📚' },
            { time: '12:00', text: 'Organizzazione e riordino della stanza 🧹' },
            { time: '14:00', text: 'Stesura appunti o compiti' },
            { time: '16:00', text: 'Passeggiata rigenerante o allenamento 🚶‍♀️' },
            { time: '18:00', text: 'Cena rinfrescante e relax totalizzante 🍹' }
          ],
          waterIntake: 2,
          stretchReached: false,
          readingReached: false,
          exerciseReached: false,
          mood: null
        }
      };
    } else if (type === 'list') {
      title = 'Lista di Robe 🗒️';
      subtitle = 'La mia lavagna a colonne per to-do';
      templateData = {
        listCategories: [
          {
            id: `l_${Date.now()}_cat1`,
            title: '🎯 Obiettivi Urgenti',
            color: 'pink',
            items: [
              { id: `l_${Date.now()}_t1`, text: 'Preparare materiali per domani', completed: false, priority: 'high' }
            ]
          },
          {
            id: `l_${Date.now()}_cat2`,
            title: '🛍️ Spesa & Chores',
            color: 'sky',
            items: [
              { id: `l_${Date.now()}_t2`, text: 'Latte d\'avena biologico', completed: true, priority: 'low' }
            ]
          }
        ]
      };
    } else if (type === 'calendar') {
      const today = new Date();
      title = 'Mese Creativo 📅';
      subtitle = 'Calendario interattivo e traguardi';
      templateData = {
        calendarData: {
          month: today.getMonth(),
          year: today.getFullYear(),
          monthlyGoal: 'Vivere in armonia e dedicarsi alle proprie passioni!',
          events: [
            { day: today.getDate(), text: 'Oggi: Pianificazione creativa ✨', color: '#ec4899' }
          ]
        }
      };
    }

    const newSheet: PlannerSheet = {
      id: `sheet_${Date.now()}`,
      type,
      title,
      subtitle,
      font: 'fredoka',
      colorTheme: randomColor,
      bgPattern: 'ruled',
      paperColor: chosenColorObj.lightBgHex,
      stickers: [],
      createdAt: Date.now(),
      ...templateData
    };

    setSheets([newSheet, ...sheets]);
    setActiveSheetId(newSheet.id);
  };

  const handleDeleteSheet = () => {
    if (sheets.length <= 1) {
      alert("Devi avere almeno un planner attivo sul tuo tavolo da lavoro!");
      return;
    }
    const idx = sheets.findIndex((s) => s.id === activeSheetId);
    const updated = sheets.filter((s) => s.id !== activeSheetId);
    setSheets(updated);
    
    // Choose the next sheet as active
    const nextActiveIdx = idx === 0 ? 0 : idx - 1;
    setActiveSheetId(updated[nextActiveIdx].id);
  };

  const handleResetRestoreDefaults = () => {
    if (window.confirm("Vuoi azzerare il tuo lavoro e ripristinare i 4 planner dimostrativi originali sulla scrivania?")) {
      setSheets(INITIAL_PLANNER_SHEETS);
      setActiveSheetId(INITIAL_PLANNER_SHEETS[0].id);
      setActiveStickerId(null);
    }
  };

  // Sticker instantiation (drawer trigger)
  const handlePlaceSticker = (type: 'emoji' | 'badge' | 'text', content: string, customColor?: string) => {
    if (!activeSheet) {
      alert("Seleziona prima un foglio sul tuo tavolo per incollarci gli sticker!");
      return;
    }

    // Spawn sticker close to top-center of sheet container
    const newSticker: Sticker = {
      id: `sticker_${Date.now()}`,
      type,
      content,
      color: customColor,
      x: 50 + Math.floor(Math.random() * 20 - 10), // jitter
      y: 15 + Math.floor(Math.random() * 10 - 5),
      scale: 1.0,
      rotation: Math.floor(Math.random() * 30 - 15) // small rotation angle
    };

    const updatedStickers = [...activeSheet.stickers, newSticker];
    handleUpdateSheet({
      ...activeSheet,
      stickers: updatedStickers
    });

    // Make newly pasted sticker active so handles show up instantly!
    setActiveStickerId(newSticker.id);
  };

  const handlePlaceCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBadgeText.trim()) return;
    handlePlaceSticker('badge', customBadgeText.trim().toUpperCase(), customBadgeColor);
    setCustomBadgeText('');
  };

  // Capture current sheet and render local printable PDF
  const handleDownloadPDF = async () => {
    const targetSheet = isMiniAppMode ? miniAppSheet : activeSheet;
    if (!targetSheet) return;
    
    // Deselect any active sticker handles so dashed borders are not baked into PDF
    setActiveStickerId(null);
    await new Promise((resolve) => setTimeout(resolve, 150));

    const element = document.getElementById(`sheet-export-wrapper-${targetSheet.id}`);
    if (!element) {
      alert("Impossibile individuare il guscio cartaceo tracciabile del planner.");
      return;
    }

    // Helper functions to parse and convert OKLAB/OKLCH color strings to RGB/RGBA
    const oklabToRgb = (l: number, a: number, labB: number, alpha: number = 1): string => {
      // W3C standard conversion: OKLAB -> LMS -> Linear sRGB -> Gamma sRGB
      const l_ = l + 0.3963377774 * a + 0.2158037573 * labB;
      const m_ = l - 0.1055613458 * a - 0.0638541728 * labB;
      const s_ = l - 0.0894841775 * a - 1.2914855414 * labB;

      const l_cube = l_ * l_ * l_;
      const m_cube = m_ * m_ * m_;
      const s_cube = s_ * s_ * s_;

      const r_lin = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
      const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
      const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

      const gamma = (v: number) => {
        if (v <= 0.0031308) return 12.92 * v;
        return 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
      };

      const finalR = Math.min(255, Math.max(0, Math.round(gamma(r_lin) * 255)));
      const finalG = Math.min(255, Math.max(0, Math.round(gamma(g_lin) * 255)));
      const finalB = Math.min(255, Math.max(0, Math.round(gamma(b_lin) * 255)));

      return alpha === 1 ? `rgb(${finalR}, ${finalG}, ${finalB})` : `rgba(${finalR}, ${finalG}, ${finalB}, ${alpha})`;
    };

    const colorReplaceUnsupported = (value: string): string => {
      if (typeof value !== 'string') return value;
      let result = value;

      // Replace oklch(...)
      if (result.includes('oklch')) {
        const oklchRegex = /oklch\(\s*([0-9.]+%?)(?:\s+|\s*,\s*)([0-9.]+)(?:\s+|\s*,\s*)([0-9.]+)(?:\s*(?:\/|,)\s*([0-9.]+%?))?\s*\)/gi;
        result = result.replace(oklchRegex, (match, lStr, cStr, hStr, aStr) => {
          try {
            const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
            const c = parseFloat(cStr);
            const h = parseFloat(hStr);
            const hRad = (h * Math.PI) / 180;
            const a = c * Math.cos(hRad);
            const b = c * Math.sin(hRad);
            let alpha = 1;
            if (aStr) {
              alpha = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
            }
            return oklabToRgb(l, a, b, alpha);
          } catch (e) {
            console.error("Errore conversione oklch:", match, e);
            return 'rgba(0,0,0,0)';
          }
        });
      }

      // Replace oklab(...)
      if (result.includes('oklab')) {
        const oklabRegex = /oklab\(\s*([0-9.]+%?)(?:\s+|\s*,\s*)([0-9.-]+)(?:\s+|\s*,\s*)([0-9.-]+)(?:\s*(?:\/|,)\s*([0-9.]+%?))?\s*\)/gi;
        result = result.replace(oklabRegex, (match, lStr, aStr, bStr, alphaStr) => {
          try {
            const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
            const a = parseFloat(aStr);
            const b = parseFloat(bStr);
            let alpha = 1;
            if (alphaStr) {
              alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
            }
            return oklabToRgb(l, a, b, alpha);
          } catch (e) {
            console.error("Errore conversione oklab:", match, e);
            return 'rgba(0,0,0,0)';
          }
        });
      }

      return result;
    };

    // Save initial system getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    
    // Inject custom getComputedStyle mapping that intercepts OKLCH styles on the fly
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = originalGetComputedStyle.call(window, elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          const val = (target as any)[prop];
          if (typeof val === 'function') {
            const bound = val.bind(target);
            if (prop === 'getPropertyValue') {
              return (propertyName: string) => {
                const res = bound(propertyName);
                return typeof res === 'string' ? colorReplaceUnsupported(res) : res;
              };
            }
            return bound;
          }
          if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
            return colorReplaceUnsupported(val);
          }
          return val;
        }
      }) as any;
    };

    // Create a temporary stylesheet to force A4 desktop proportions during html2canvas capture on small screens
    const styleEl = document.createElement('style');
    styleEl.id = `temp-pdf-export-style-${targetSheet.id}`;
    styleEl.innerHTML = `
      #sheet-export-parent,
      #sheet-export-wrapper-parent-${targetSheet.id} {
        width: 1120px !important;
        max-width: 1120px !important;
        min-width: 1120px !important;
        padding: 40px !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        transform: none !important;
        background: #ffffff !important;
      }
      #sheet-export-wrapper-${targetSheet.id} {
        width: 100% !important;
        max-width: 1120px !important;
        min-width: 1120px !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
      }
      #sheet-paper-${targetSheet.id} {
        width: 100% !important;
        max-width: 1120px !important;
        min-width: 1120px !important;
        min-height: 1580px !important;
        padding: 80px 60px !important;
        box-sizing: border-box !important;
        border-width: 2px !important;
        border-radius: 40px !important;
        box-shadow: none !important;
      }
      
      /* Hide ALL UI elements and interaction labels */
      button, select, form, nav, header, 
      .no-export, .sticker-controls, #sheet-controls-panel, #desk-global-actions,
      [role="button"], .lucide-trash, .lucide-trash-2, .lucide-plus, .lucide-x,
      .lucide-rotate-cw, .lucide-chevron-up, .lucide-chevron-down {
        display: none !important;
      }

      /* Clean inputs: remove borders, shadows and hide placeholders */
      input, textarea {
        border: none !important;
        outline: none !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      
      input::placeholder, textarea::placeholder {
        color: transparent !important;
      }

      /* Hide any scrollbars if they appear */
      * { scrollbar-width: none !important; }
      *::-webkit-scrollbar { display: none !important; }
    `;
    document.head.appendChild(styleEl);

    // Give a short delay for elements to recalculate size rules before taking screenshot
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      setIsExporting(true);
      
      const element = document.getElementById(`sheet-export-wrapper-${targetSheet.id}`);
      if (!element) throw new Error("Export wrapper not found");

      const canvas = await html2canvas(element, {
        scale: 2.5, // Even higher density for legibility
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: 1120,
        height: element.offsetHeight,
        windowWidth: 1120,
        windowHeight: element.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Margins
      const margin = 10; // 10mm margins on all sides
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      // Calculate scaled aspect ratio fit
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasHeight / canvasWidth;
      
      let targetWidth = availableWidth;
      let targetHeight = targetWidth * ratio;

      // If it's too tall for the page, scale it down further to fit height
      if (targetHeight > availableHeight) {
        targetHeight = availableHeight;
        targetWidth = targetHeight / ratio;
      }

      // Center exactly on page
      const printLeft = (pdfWidth - targetWidth) / 2;
      const printTop = (pdfHeight - targetHeight) / 2;

      pdf.addImage(imgData, 'PNG', printLeft, printTop, targetWidth, targetHeight, undefined, 'FAST');
      
      const filename = targetSheet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'agenda_planner';
      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error("html2pdf capturing error:", err);
      alert("Si è verificato un errore durante l'impaginazione locale del PDF. Riprova.");
    } finally {
      setIsExporting(false);
      // Restore native getComputedStyle behavior
      window.getComputedStyle = originalGetComputedStyle;
      // Remove temporary styles
      const sty = document.getElementById(`temp-pdf-export-style-${targetSheet.id}`);
      if (sty) sty.remove();
    }
  };

  const handleShareSheet = () => {
    if (!activeSheet) return;
    try {
      const json = JSON.stringify(activeSheet);
      const compressed = LZString.compressToBase64(json);
      
      let origin = window.location.origin;
      // Convert development URL to public shared preview app URL to avoid 403 authorization error for other recipients!
      if (origin.includes('ais-dev-')) {
        origin = origin.replace('ais-dev-', 'ais-pre-');
      }
      // Force the root path "/" instead of window.location.pathname because the production shared app is
      // served statically only at root ("/"), and any other subpath will produce a 404 Page Not Found error.
      const shareUrl = `${origin}/#mini-app=${compressed}`;
      
      setShareModalConfig({
        isOpen: true,
        url: shareUrl,
        copied: false,
      });
    } catch (e) {
      console.error('Error generating share link', e);
      alert("Si è verificato un errore durante la generazione della mini-app.");
    }
  };

  const handleExitMiniApp = () => {
    if (miniAppSheet) {
      // Decompress & clone the shared mini-app sheet as an active workspace sheet
      const uniqueId = `sheet_clone_${Date.now()}`;
      const clonedSheet: PlannerSheet = {
        ...miniAppSheet,
        id: uniqueId,
        title: miniAppSheet.title ? `${miniAppSheet.title} (Copia)` : 'Mio Foglio Clonato 📝',
        createdAt: Date.now()
      };

      // Add to workspace sheet list and save immediately to persist
      setSheets((prevSheets) => {
        const merged = [clonedSheet, ...prevSheets];
        const map = new Map<string, PlannerSheet>();
        merged.forEach((s) => {
          if (s && s.id) map.set(s.id, s);
        });
        const finalSheets = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSheets));
        return finalSheets;
      });

      // Point active selection to newly imported sheet
      setActiveSheetId(uniqueId);
    }

    // Empty the hash to transition back cleanly
    window.location.hash = '';
    setIsMiniAppMode(false);
    setMiniAppSheet(null);
  };

  const handleExportStandaloneHTML = () => {
    const targetSheet = isMiniAppMode ? miniAppSheet : activeSheet;
    if (!targetSheet) return;

    const sheetJson = JSON.stringify(targetSheet);
    const theme = deskTheme;

    let themeStyles = '';
    if (theme === 'wooden') {
      themeStyles = `
        background-color: #2D241E;
        background-image: 
          radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(45,36,30,0.3) 1px, transparent 1px);
        background-size: 20px 20px, 60px 100%;
      `;
    } else if (theme === 'corkboard') {
      themeStyles = `
        background-color: #D9C3B0;
        background-image: radial-gradient(#2D241E 1px, transparent 1.5px);
        background-size: 10px 10px;
      `;
    } else {
      themeStyles = `
        background-color: #F6F5F2;
        background-image: radial-gradient(rgba(45, 36, 30, 0.08) 1.5px, transparent 1.5px);
        background-size: 28px 28px;
      `;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Atelier Standalone - \${targetSheet.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Fredoka:wght@300..700&family=Inter:wght@100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">
  
  <script>
    window.tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            fredoka: ['Fredoka', 'sans-serif'],
            caveat: ['Caveat', 'cursive'],
            playfair: ['Playfair Display', 'serif'],
          }
        }
      }
    }
  </script>

  <style>
    .pattern-ruled {
      background-image: linear-gradient(rgba(45, 36, 30, 0.06) 1px, transparent 1px);
      background-size: 100% 27px;
    }
    .pattern-grid {
      background-image: linear-gradient(rgba(45, 36, 30, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(45, 36, 30, 0.05) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .pattern-dotted {
      background-image: radial-gradient(rgba(45, 36, 30, 0.08) 1.5px, transparent 1.5px);
      background-size: 20px 20px;
    }
    [x-cloak] { display: none !important; }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    
    /* Touch optimization */
    input, textarea { font-size: 16px !important; }
  </style>
</head>
<body 
  style="\${themeStyles.replace(/\\s+/g, ' ')}"
  class="min-h-screen py-4 md:py-12 px-2 md:px-4 flex flex-col items-center justify-start md:justify-center font-sans select-none overflow-x-hidden"
>

  <div 
    x-data="initApp()" 
    x-cloak
    class="w-full max-w-4xl flex flex-col gap-4 md:gap-6 animate-fade-in text-[#2D241E]"
  >
    <!-- Standalone Header Bar -->
    <div class="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-[#2D241E]/10 shadow-sm">
      <div class="flex items-center gap-3 text-left">
        <div class="w-8 h-8 md:w-9 md:h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-xs">
          <i data-lucide="book-open" class="w-4 h-4 text-white"></i>
        </div>
        <div>
          <h1 class="text-xs md:text-base font-extrabold text-[#2D241E] uppercase tracking-tight font-sans">Atelier stand-alone</h1>
          <p class="text-[10px] md:text-xs text-stone-500 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <span>Mini Agenda Autonoma</span>
            <span class="hidden xs:flex text-emerald-500 items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>• Interattiva Offline</span>
            </span>
          </p>
        </div>
      </div>
      
      <!-- Top buttons -->
      <div class="flex flex-wrap gap-2 justify-center items-center">
        <!-- Accent Picker -->
        <div class="flex gap-1 items-center bg-stone-150/70 p-1 rounded-xl border border-[#2D241E]/10 mr-1">
          <span class="hidden xs:inline text-[9px] font-extrabold uppercase px-1.5 text-stone-500 font-sans">Colore:</span>
          <input type="color" x-model="customColor" @input="updateAccent()" class="w-5 h-5 md:w-6 md:h-6 p-0 border-0 bg-transparent rounded cursor-pointer">
        </div>
        
        <!-- Save state -->
        <span class="hidden sm:flex text-[10px] bg-emerald-50 text-emerald-700 px-3 py-2 border border-emerald-100 rounded-xl font-bold uppercase tracking-wider items-center gap-1 z-10 shadow-3xs">
          <i data-lucide="check" class="w-3.5 h-3.5 stroke-[2.5]"></i>
          <span>Salvato locale</span>
        </span>
        
        <button
          @click="generatePDF()"
          class="flex items-center gap-1.5 bg-[#FF6B6B] text-white px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-wider hover:bg-[#FF8787] transition-all cursor-pointer shadow-xs"
        >
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Save PDF</span>
        </button>
      </div>
    </div>

    <!-- Main Workspace Area -->
    <div class="flex flex-col xl:flex-row gap-6">
      
      <!-- Notebook Paper Component -->
      <div 
        class="flex-1 flex flex-col items-center p-0 sm:p-4 bg-white/10 sm:bg-white/20 rounded-3xl sm:border border-[#2D241E]/5 backdrop-blur-2xs overflow-visible" 
        id="sheet-export-container"
      >
        <div 
          id="sheet-export-wrapper"
          class="flex flex-col items-center w-full"
        >
          <!-- Spiral steel ring binders -->
          <div class="flex justify-center gap-1.5 md:gap-3.5 -mb-[14px] px-8 relative z-20 w-fit pointer-events-none select-none">
            <template x-for="idx in Array.from({length: 14}).map((_, i) => i)">
              <div class="flex flex-col items-center">
                <div class="w-2.5 h-7 bg-gradient-to-b from-gray-400 via-stone-200 to-gray-500 rounded-full shadow-md border border-gray-400/50"></div>
                <div class="w-[7px] h-[7px] bg-neutral-800 rounded-full -mt-2.5 opacity-80"></div>
              </div>
            </template>
          </div>

          <!-- Sheet Body Paper -->
          <div
            id="sheet-paper-root"
            @click="activeStickerId = null"
            :class="{
              'pattern-ruled': sheet.bgPattern === 'ruled',
              'pattern-grid': sheet.bgPattern === 'grid',
              'pattern-dotted': sheet.bgPattern === 'dotted'
            }"
            class="w-full max-w-2xl min-h-[500px] md:min-h-[700px] border-2 rounded-2xl p-4 md:p-8 relative shadow-xl overflow-hidden transition-all duration-300"
            :style="{
              backgroundColor: getPaperBgHex(),
              borderColor: accentColor,
              fontFamily: getFontFamily(),
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), inset 0 0 40px rgba(255, 255, 255, 0.6)'
            }"
          >
          <!-- Aesthetic notebook tear-off margin line -->
          <div class="absolute left-6 md:left-8 top-0 bottom-0 w-[1px] bg-red-300 opacity-60 z-10 pointer-events-none"></div>

          <!-- Title inputs -->
          <div class="relative mb-6 pb-4 border-b border-gray-300/60 z-10 pl-4 text-left">
            <input
              type="text"
              x-model="sheet.title"
              class="font-extrabold bg-transparent border-none p-0 w-full outline-none"
              :style="{ color: accentColor, fontSize: '24px' }"
              placeholder="Titolo Agenda..."
              @input="saveState()"
            >
            <input
              type="text"
              x-model="sheet.subtitle"
              class="font-semibold opacity-60 bg-transparent border-none mt-1 p-0 w-full outline-none text-neutral-600"
              style="font-size: 14px;"
              placeholder="Inserisci un sottotitolo..."
              @input="saveState()"
            >
          </div>

          <!-- Dynamic Type layouts -->
          <div class="relative z-10 text-left">
            
            <!-- BLOCKNOTE type -->
            <div x-show="sheet.type === 'blocknote'" class="space-y-6">
              <div>
                <label class="block text-xs font-semibold tracking-wider uppercase opacity-60 mb-2">
                  📝 Note Libere (Clicca per scrivere)
                </label>
                <textarea
                  x-model="sheet.notepadContent.notesText"
                  placeholder="Scrivi qui i tuoi pensieri liberi..."
                  class="w-full bg-transparent border-none placeholder-gray-400 focus:ring-0 focus:outline-none resize-none leading-relaxed min-h-[180px] cursor-text outline-none"
                  style="font-family: inherit; font-size: inherit; line-height: 1.6;"
                  @input="saveState()"
                ></textarea>
              </div>

              <!-- Micro Checklist -->
              <div class="border-t border-dashed border-gray-300/40 pt-4 mt-2">
                <h4 class="text-sm font-semibold mb-3 flex items-center gap-2" :style="{ color: accentColor }">
                  <i data-lucide="check-square" class="w-4 h-4"></i>
                  <span>Micro Checklist Integrata</span>
                </h4>
                
                <div class="space-y-2 mb-4">
                  <template x-for="(item, idx) in sheet.notepadContent.items" :key="item.id">
                    <div class="flex items-center justify-between gap-2 group bg-white/30 hover:bg-white/60 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200/50 transition-all">
                      <div class="flex items-center gap-2.5 flex-1 min-w-0">
                        <button @click="item.done = !item.done; saveState();" class="focus:outline-none">
                          <template x-if="item.done">
                            <div class="w-5 h-5 rounded-md flex items-center justify-center text-white" :style="{ backgroundColor: accentColor }">
                              <i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>
                            </div>
                          </template>
                          <template x-if="!item.done">
                            <div class="w-5 h-5 rounded-md border-2 border-gray-300 bg-white"></div>
                          </template>
                        </button>
                        <input type="text" x-model="item.text" :class="item.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'" class="bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0 w-full text-sm font-family-inherit outline-none" @input="saveState()">
                      </div>
                      <button @click="deleteNotepadItem(item.id)" class="text-stone-400 hover:text-red-500 p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </template>
                </div>
                
                <!-- Add form -->
                <div class="flex gap-2">
                  <input type="text" x-model="newNotepadItem" @keydown.enter.prevent="addNotepadItem()" placeholder="Aggiungi punto di interesse..." class="flex-1 text-sm bg-white border border-gray-200 focus:border-gray-300 rounded-lg px-3 py-1.5 outline-none font-sans font-medium">
                  <button @click="addNotepadItem()" class="flex items-center justify-center gap-1.5 text-xs px-4 py-1.5 rounded-lg text-white font-bold" :style="{ backgroundColor: accentColor }">
                    <i data-lucide="plus" class="w-4 h-4 font-bold"></i>
                    <span>Aggiungi</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- AGENDA type -->
            <div x-show="sheet.type === 'agenda'" class="space-y-6">
              <div class="bg-white/40 border border-gray-200/50 rounded-xl p-3 shadow-2xs">
                <label class="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70 flex items-center gap-1.5" :style="{ color: accentColor }">
                  <i data-lucide="trophy" class="w-3.5 h-3.5"></i>
                  <span>🎯 Focus della Giornata</span>
                </label>
                <textarea x-model="sheet.agendaData.focusOfTheDay" placeholder="Qual è la tua priorità assoluta di oggi..." class="w-full bg-transparent border-none placeholder-gray-400 focus:ring-0 focus:outline-none text-sm font-semibold h-[48px] py-1 resize-none outline-none" @input="saveState()"></textarea>
              </div>

              <!-- Slots -->
              <div class="space-y-2">
                <label class="block text-xs font-semibold tracking-wider uppercase opacity-60 mb-1.5 flex items-center gap-1">
                  <i data-lucide="sun" class="w-3.5 h-3.5"></i>
                  <span>⏱️ Tabella di Marcia (Ogni Ora)</span>
                </label>
                <div class="space-y-1.5 bg-white/20 p-2.5 rounded-xl border border-gray-200/30 font-sans">
                  <template x-for="(slot, idx) in sheet.agendaData.slots" :key="idx">
                    <div class="flex items-center gap-2 border-b border-gray-200/40 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0">
                      <span class="text-[10px] font-extrabold px-2 py-1 bg-white/70 border border-stone-200/60 rounded-md font-mono w-14 text-center select-none" :style="{ color: accentColor }">
                        <span x-text="slot.time"></span>
                      </span>
                      <input type="text" x-model="slot.text" placeholder="Cosa hai programmato per questo orario?" class="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium p-0" @input="saveState()">
                    </div>
                  </template>
                </div>
              </div>

              <!-- Habits and Mood -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed border-gray-300/40 pt-4 font-sans focus-within:none">
                <div class="space-y-4">
                  <!-- Water intake -->
                  <div>
                    <label class="block text-[11px] font-extrabold uppercase tracking-wider opacity-60 mb-1.5">
                      💧 Registro Idrico (Bicchieri d'Acqua)
                    </label>
                    <div class="flex items-center gap-2 bg-white/30 border border-gray-200/30 p-2 rounded-xl">
                      <template x-for="glass in [0,1,2,3,4,5,6,7]" :key="glass">
                        <button @click="toggleWater(glass)" class="focus:outline-none transition-transform active:scale-90 duration-155">
                          <span x-show="sheet.agendaData.waterIntake > glass" class="text-xl filter drop-shadow-xs">🥛</span>
                          <span x-show="sheet.agendaData.waterIntake <= glass" class="text-xl filter grayscale opacity-30 select-none">🥛</span>
                        </button>
                      </template>
                      <span class="text-xs font-bold ml-1 text-stone-500 font-mono" x-text="sheet.agendaData.waterIntake + '/8'"></span>
                    </div>
                  </div>

                  <!-- Routine -->
                  <div>
                    <label class="block text-[11px] font-extrabold uppercase tracking-wider opacity-60 mb-1.5">
                      🌿 Rituali Sani & Abitudini
                    </label>
                    <div class="space-y-1.5 bg-white/30 p-2 rounded-xl border border-gray-200/30 font-sans font-medium text-stone-600">
                      <div class="flex items-center justify-between">
                        <span class="text-xs">🧘‍♀️ Stretching / Yoga</span>
                        <button @click="sheet.agendaData.stretchReached = !sheet.agendaData.stretchReached; saveState();" class="w-5 h-5 rounded border-2 border-stone-350 bg-white flex items-center justify-center">
                          <template x-if="sheet.agendaData.stretchReached">
                            <div class="w-full h-full text-white flex items-center justify-center p-0.5" :style="{ backgroundColor: accentColor }">
                              <i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>
                            </div>
                          </template>
                        </button>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs">📖 Lettura Libri (15m+)</span>
                        <button @click="sheet.agendaData.readingReached = !sheet.agendaData.readingReached; saveState();" class="w-5 h-5 rounded border-2 border-stone-350 bg-white flex items-center justify-center">
                          <template x-if="sheet.agendaData.readingReached">
                            <div class="w-full h-full text-white flex items-center justify-center p-0.5" :style="{ backgroundColor: accentColor }">
                              <i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>
                            </div>
                          </template>
                        </button>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs">🏃 Allenamento / Fitness</span>
                        <button @click="sheet.agendaData.exerciseReached = !sheet.agendaData.exerciseReached; saveState();" class="w-5 h-5 rounded border-2 border-stone-350 bg-white flex items-center justify-center">
                          <template x-if="sheet.agendaData.exerciseReached">
                            <div class="w-full h-full text-white flex items-center justify-center p-0.5" :style="{ backgroundColor: accentColor }">
                              <i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>
                            </div>
                          </template>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Mood -->
                <div>
                  <label class="block text-[11px] font-extrabold uppercase tracking-wider opacity-60 mb-1.5 text-stone-500">
                    🎭 Umore del Giorno (Mood)
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <template x-for="m in [
                      { key: 'happy', label: 'Felice 😊' },
                      { key: 'chill', label: 'Rilassato 😎' },
                      { key: 'motivated', label: 'Grintoso 🔥' },
                      { key: 'tired', label: 'Stanco 😴' }
                    ]" :key="m.key">
                      <button 
                        @click="sheet.agendaData.mood = sheet.agendaData.mood === m.key ? null : m.key; saveState();"
                        :class="sheet.agendaData.mood === m.key ? 'ring-2 ring-stone-850 font-extrabold shadow-3xs' : 'opacity-85'"
                        class="flex items-center justify-center gap-1.5 px-3 py-2 border border-stone-200/55 rounded-xl text-xs transition-all bg-white hover:bg-neutral-50"
                        x-text="m.label"
                      ></button>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- LISTS type -->
            <div x-show="sheet.type === 'list'" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <template x-for="(cat, catIdx) in sheet.listCategories" :key="cat.id">
                  <div class="bg-white/40 border border-[#2D241E]/10 rounded-xl p-3 shadow-2xs relative">
                    <div class="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-200/55">
                      <input type="text" x-model="cat.title" class="font-extrabold text-xs uppercase tracking-wider bg-transparent border-none p-0 outline-none w-3/4" :style="{ color: accentColor }" @input="saveState()">
                      <button @click="deleteListCategory(cat.id)" class="text-stone-400 hover:text-red-500 p-0.5">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>

                    <!-- Column Items -->
                    <div class="space-y-1.5 mb-3 min-h-[40px] font-sans">
                      <template x-for="(item, itemIdx) in cat.items" :key="item.id">
                        <div class="flex items-center justify-between gap-1 group/item hover:bg-white/40 px-2 py-1 rounded transition-colors font-sans font-medium">
                          <div class="flex items-center gap-2 flex-1 min-w-0">
                            <button @click="item.completed = !item.completed; saveState();" class="focus:outline-none">
                              <template x-if="item.completed">
                                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i>
                              </template>
                              <template x-if="!item.completed">
                                <i data-lucide="circle" class="w-4 h-4 text-stone-300"></i>
                              </template>
                            </button>
                            <input type="text" x-model="item.text" :class="item.completed ? 'line-through text-stone-450 opacity-60' : 'text-stone-700 font-semibold'" class="text-xs bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0 w-full outline-none font-sans font-medium" @input="saveState()">
                          </div>

                          <!-- Tags and action -->
                          <div class="flex items-center gap-1 select-none">
                            <span :class="{
                              'bg-red-50 text-red-700 border-red-100': item.priority === 'high',
                              'bg-amber-50 text-amber-700 border-amber-100': item.priority === 'medium',
                              'bg-stone-50 text-stone-600 border-stone-100': item.priority === 'low'
                            }" class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border scale-90" x-text="item.priority"></span>
                            <button @click="deleteListItem(cat, item.id)" class="text-stone-300 hover:text-red-500 transition-colors">
                              <i data-lucide="trash" class="w-3 h-3 text-stone-400"></i>
                            </button>
                          </div>
                        </div>
                      </template>
                    </div>

                    <!-- Add list item -->
                    <form @submit.prevent="addListItem(cat)" class="flex gap-1 font-sans">
                      <input type="text" placeholder="Aggiungi punto..." x-model="newListItemText[cat.id]" class="flex-1 text-[11px] bg-white border border-gray-100 rounded px-2 py-1 outline-none font-medium">
                      <select x-model="newListItemPriority[cat.id]" class="text-[10px] bg-white border border-gray-100 rounded px-1 text-stone-500 font-sans font-black tracking-wider py-1 outline-none">
                        <option value="medium">MED</option>
                        <option value="high">HIGH</option>
                        <option value="low">LOW</option>
                      </select>
                      <button type="submit" class="p-1 px-2 rounded text-white cursor-pointer" :style="{ backgroundColor: accentColor }">
                        <i data-lucide="plus" class="w-3.5 h-3.5 font-bold"></i>
                      </button>
                    </form>
                  </div>
                </template>
              </div>

              <!-- Add column -->
              <div class="flex gap-2 border-t border-dashed border-gray-300/40 pt-4 font-sans">
                <input type="text" x-model="newListCategoryName" placeholder="Crea nuova colonna di to-do..." class="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none font-medium">
                <button @click="addListCategory()" class="text-white text-xs px-4 py-2 rounded-lg flex items-center font-bold gap-1.5 shadow-3xs cursor-pointer" :style="{ backgroundColor: accentColor }">
                  <i data-lucide="plus" class="w-4 h-4"></i>
                  <span>Aggiungi Colonna</span>
                </button>
              </div>
            </div>

            <!-- CALENDAR type -->
            <div x-show="sheet.type === 'calendar'" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white/40 border border-[#2D241E]/10 rounded-xl p-3 shadow-2xs font-sans">
                  <div class="flex justify-between items-center mb-3 select-none">
                    <button @click="prevMonth()" class="p-1 hover:bg-stone-150 rounded-lg transition-colors cursor-pointer">
                      <i data-lucide="chevron-left" class="w-4 h-4 text-stone-600"></i>
                    </button>
                    <span class="font-extrabold text-xs uppercase tracking-wider text-stone-700" x-text="MONTHS_IT[sheet.calendarData.month] + ' ' + sheet.calendarData.year"></span>
                    <button @click="nextMonth()" class="p-1 hover:bg-stone-150 rounded-lg transition-colors cursor-pointer">
                      <i data-lucide="chevron-right" class="w-4 h-4 text-stone-600"></i>
                    </button>
                  </div>

                  <!-- Week days -->
                  <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-stone-400 mb-1.5 font-mono uppercase tracking-[0.1em] select-none">
                    <span>Lun</span><span>Mar</span><span>Mer</span><span>Gio</span><span>Ven</span><span>Sab</span><span>Dom</span>
                  </div>

                  <!-- Days grid -->
                  <div class="grid grid-cols-7 gap-1 select-none">
                    <template x-for="o in Array.from({length: getFirstDayOffset()}).map((_, i) => i)" :key="'offset-'+o">
                      <div class="aspect-square"></div>
                    </template>
                    <template x-for="day in Array.from({length: getDaysInMonth()}).map((_, i) => i + 1)" :key="day">
                      <button 
                        @click="selectedDay = day"
                        :class="{
                          'ring-2 ring-stone-850 font-extrabold': selectedDay === day,
                          'bg-white text-stone-850 shadow-3xs': selectedDay !== day && !hasEvent(day),
                          'text-white font-extrabold': selectedDay !== day && hasEvent(day)
                        }"
                        :style="hasEvent(day) ? { backgroundColor: accentColor } : {}"
                        class="aspect-square text-[11px] rounded-lg border border-gray-100 flex items-center justify-center font-bold relative transition-colors cursor-pointer"
                      >
                        <span x-text="day"></span>
                        <span x-show="eventsForDayCount(day) > 1" class="absolute bottom-0.5 w-1 h-1 bg-white rounded-full"></span>
                      </button>
                    </template>
                  </div>
                </div>

                <!-- Events details -->
                <div class="space-y-4 font-sans">
                  <div class="bg-[#F8F9FA]/85 p-3 rounded-xl border border-stone-200">
                    <label class="block text-[9px] font-extrabold uppercase tracking-wider text-stone-400 mb-1 font-sans">🎯 Obiettivo Mensile</label>
                    <input type="text" x-model="sheet.calendarData.monthlyGoal" placeholder="Quale traguardo importante hai per questo mese?" class="w-full bg-transparent border-none p-0 outline-none focus:ring-0 text-xs text-stone-700 font-extrabold placeholder:text-stone-400 font-sans" @input="saveState()">
                  </div>

                  <div class="bg-white/40 border border-[#2D241E]/10 rounded-xl p-3 shadow-2xs font-sans">
                    <label class="text-xs font-bold uppercase tracking-wider block mb-2 opacity-70 flex items-center gap-1.5 text-stone-700 font-sans">
                      <i data-lucide="calendar-check" class="w-3.5 h-3.5"></i>
                      <span>Eventi del Giorno (<span x-text="selectedDay"></span>/ <span x-text="sheet.calendarData.month+1"></span>)</span>
                    </label>

                    <div class="space-y-1.5 mb-3 min-h-[40px] font-sans">
                      <template x-for="(ev, idx) in sheet.calendarData.events.filter(e => e.day === selectedDay)" :key="idx">
                        <div class="flex items-center justify-between gap-1 group hover:bg-white/50 px-2 py-1 rounded transition-colors border border-transparent hover:border-gray-100 font-sans font-medium text-stone-750">
                          <div class="flex items-center gap-2 min-w-0">
                            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: ev.color || accentColor }"></span>
                            <span class="text-xs font-semibold text-stone-700" x-text="ev.text"></span>
                          </div>
                          <button @click="deleteCalendarEvent(ev)" class="text-stone-300 hover:text-red-500 cursor-pointer">
                            <i data-lucide="trash" class="w-3.5 h-3.5 text-stone-400"></i>
                          </button>
                        </div>
                      </template>
                      <p x-show="sheet.calendarData.events.filter(e => e.day === selectedDay).length === 0" class="text-xs text-stone-400 italic py-2 font-sans font-semibold">Nessun promemoria configurato per oggi.</p>
                    </div>

                    <!-- Add Event form -->
                    <form @submit.prevent="addCalendarEvent()" class="flex gap-1.5 font-sans">
                      <input type="text" x-model="newCalendarEventText" placeholder="Aggiungi appuntamento..." class="flex-1 text-xs bg-white border border-gray-150 rounded px-2 font-sans py-1 outline-none font-medium">
                      <input type="color" x-model="newCalendarEventColor" class="w-7 h-7 p-0 bg-transparent border-0 rounded cursor-pointer select-none">
                      <button type="submit" class="p-1 px-2.5 rounded text-white" :style="{ backgroundColor: accentColor }">
                        <i data-lucide="plus" class="w-3.5 h-3.5 font-bold"></i>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Stickers Render engine overlays -->
          <template x-for="st in sheet.stickers" :key="st.id">
            <div 
              :id="'placed-sticker-' + st.id"
              @click.stop="activeStickerId = (activeStickerId === st.id) ? null : st.id"
              :style="{
                left: st.x + '%',
                top: st.y + '%',
                transform: 'translate(-50%, -50%) scale(' + st.scale + ') rotate(' + st.rotation + 'deg)'
              }"
              :class="activeStickerId === st.id ? 'ring-2 ring-dashed rounded-lg p-1' : ''"
              class="absolute z-30 select-none group border-stone-850"
              style="border-color: rgba(0,0,0,0.1);"
              @mousedown="startDragSticker($event, st)"
              @touchstart="startDragSticker($event, st)"
            >
              <div class="pointer-events-auto">
                <template x-if="st.type === 'emoji'">
                  <span class="text-3xl filter drop-shadow-md leading-none select-none" x-text="st.content"></span>
                </template>
                <template x-if="st.type !== 'emoji'">
                  <div 
                    :style="{ backgroundColor: st.color || accentColor }"
                    class="px-3.5 py-1 text-[11px] font-bold text-white tracking-wider rounded-md uppercase shadow-md select-none transform border border-white/20 whitespace-nowrap"
                    style="transform: skewX(-4deg); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"
                    x-text="st.content"
                  ></div>
                </template>
              </div>

              <!-- Inline rotate/resize controls overlay -->
              <div x-show="activeStickerId === st.id" class="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#2D241E]/95 text-white p-1 rounded-xl shadow-lg border border-stone-700 flex gap-1 z-40 items-center scale-90 pointer-events-auto select-none" @mousedown.stop @touchstart.stop>
                <button @click.stop="rotateSticker(st)" class="p-1 hover:bg-[#FF6B6B]/25 rounded text-white" title="Ruota">
                  <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
                </button>
                <button @click.stop="scaleSticker(st, 'up')" class="p-1.5 hover:bg-[#FF6B6B]/25 rounded text-white font-extrabold text-[10px]" title="Ingrandisci">+</button>
                <button @click.stop="scaleSticker(st, 'down')" class="p-1.5 hover:bg-[#FF6B6B]/25 rounded text-white font-extrabold text-[10px]" title="Rimpicciolisci">-</button>
                <div class="h-4 w-[1px] bg-stone-700"></div>
                <button @click.stop="deleteSticker(st)" class="p-1 hover:bg-red-500/30 rounded text-red-400" title="Elimina">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5 text-stone-400"></i>
                </button>
              </div>
            </div>
          </template>

        </div>
      </div>

      <!-- Standing Sticker Toolbox Sidebars -->
      <div class="w-full xl:w-72 flex flex-col gap-4 font-sans text-left">
        <div class="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-[#2D241E]/10 shadow-sm font-sans focus-within:none">
          <h3 class="text-xs font-extrabold text-[#2D241E] uppercase tracking-wider mb-3 flex items-center gap-1.5 font-sans">
            <i data-lucide="smile" class="w-4 h-4 text-stone-600"></i>
            <span>🎨 Applica Adesivi (Stickers)</span>
          </h3>

          <!-- Grid of Emojis -->
          <div class="grid grid-cols-4 gap-2 mb-4 select-none">
            <template x-for="emo in presetEmojis" :key="emo">
              <button 
                @click="addPresetEmoji(emo)"
                class="text-2xl p-2 bg-white hover:bg-amber-100/40 border border-[#2D241E]/5 hover:border-amber-300 rounded-xl transition-all cursor-pointer shadow-3xs hover:scale-105 active:scale-95 text-center"
                x-text="emo"
              ></button>
            </template>
          </div>

          <!-- Add custom Washi Tape Badges -->
          <div class="border-t border-dashed border-gray-300/50 pt-3">
            <label class="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 font-sans">🏷️ Crea Nastro Adesivo Custom</label>
            <div class="flex gap-1.5 font-sans">
              <input type="text" x-model="customBadgeText" placeholder="URGENTE..." class="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none font-bold uppercase placeholder:text-stone-300">
              <input type="color" x-model="customBadgeColor" class="w-7 h-7 p-0 bg-transparent border-0 rounded cursor-pointer select-none">
              <button @click="addCustomBadge()" class="p-1 px-3 bg-[#2D241E] hover:bg-[#443831] text-white rounded-lg text-xs font-black uppercase transition-all shadow-3xs cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Helpful instructions -->
        <div class="bg-[#2D241E] text-[#DCCDBC] p-5 rounded-3xl border border-stone-800 shadow-sm space-y-2.5">
          <h4 class="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest font-sans">💡 CONSIGLI UTILI stand-alone</h4>
          <p class="text-[11px] leading-relaxed opacity-90 font-sans">
            • Puoi <b>trascinare liberamente</b> gli adesivi posizionati sulla carta per ricollocarli!
          </p>
          <p class="text-[11px] leading-relaxed opacity-90 font-sans">
            • Cliccando su un adesivo posizionato puoi <b>ruotarlo, scalarlo o eliminarlo</b> con i comandi rapidi.
          </p>
          <p class="text-[11px] leading-relaxed opacity-90 font-sans">
            • Questa applicazione salva istantaneamente modifiche nel browser: puoi chiuderla o riaprirla senza perdere dati!
          </p>
        </div>
      </div>

    </div>

  </div>

  <script>
    function initApp() {
      return {
        sheet: ${sheetJson},
        activeStickerId: null,
        newNotepadItem: '',
        newListCategoryName: '',
        newListItemText: {},
        newListItemPriority: {},
        newCalendarEventText: '',
        newCalendarEventColor: '#a855f7',
        selectedDay: new Date().getDate(),
        
        customColor: '',
        
        presetEmojis: ['⭐', '❤️', '💡', '🔥', '📌', '✨', '✅', '❌', '🎉', '📅', '☕', '💤', '🍕', '🍰', '🌸', '🐾'],
        customBadgeText: '',
        customBadgeColor: '#f59e0b',
        MONTHS_IT: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
        
        init() {
          // Check localStorage saved state
          const storageKey = 'mini_app_standalone_sheet_v4_' + this.sheet.id;
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try {
              this.sheet = JSON.parse(saved);
            } catch(e) {
              console.error('Failed to load local saved state', e);
            }
          }

          this.customColor = this.getThemeColor();
          
          this.$watch('sheet', value => {
            localStorage.setItem(storageKey, JSON.stringify(value));
          }, { deep: true });
          
          this.$nextTick(() => { window.lucide.createIcons(); });
        },
        
        saveState() {
          const storageKey = 'mini_app_standalone_sheet_v4_' + this.sheet.id;
          localStorage.setItem(storageKey, JSON.stringify(this.sheet));
        },
        
        getThemeColor() {
          if (this.sheet.customAccentColor) return this.sheet.customAccentColor;
          const colors = {
            purple: '#a855f7',
            pink: '#ec4899',
            emerald: '#10b981',
            amber: '#f59e0b',
            sky: '#0ea5e9',
            rose: '#f43f5e',
            peach: '#f97316',
            stone: '#78716c'
          };
          return colors[this.sheet.colorTheme] || '#ec4899';
        },
        
        getPaperBgHex() {
          if (this.sheet.customPaperColor) return this.sheet.customPaperColor;
          const colorsLight = {
            purple: '#faf5ff',
            pink: '#fff1f2',
            emerald: '#ecfdf5',
            amber: '#fefbeb',
            sky: '#f0f9ff',
            rose: '#fff1f2',
            peach: '#fff7ed',
            stone: '#f5f5f4'
          };
          return colorsLight[this.sheet.colorTheme] || '#fafafa';
        },
        
        getFontFamily() {
          if (this.sheet.customFontName && this.sheet.customFontName.trim()) {
            return "'" + this.sheet.customFontName.trim() + "', sans-serif";
          }
          const fonts = {
            fredoka: '"Fredoka", sans-serif',
            caveat: '"Caveat", cursive',
            playfair: '"Playfair Display", serif',
            inter: '"Inter", sans-serif'
          };
          return fonts[this.sheet.font] || '"Inter", sans-serif';
        },
        
        get accentColor() {
          return this.getThemeColor();
        },
        
        updateAccent() {
          this.sheet.customAccentColor = this.customColor;
          this.saveState();
        },
        
        // Notepad methods
        addNotepadItem() {
          if (!this.newNotepadItem.trim()) return;
          if (!this.sheet.notepadContent) {
            this.sheet.notepadContent = { notesText: '', items: [] };
          }
          this.sheet.notepadContent.items.push({
            id: 'item_' + Date.now(),
            text: this.newNotepadItem.trim(),
            done: false
          });
          this.newNotepadItem = '';
          this.saveState();
          this.$nextTick(() => { window.lucide.createIcons(); });
        },
        
        deleteNotepadItem(id) {
          this.sheet.notepadContent.items = this.sheet.notepadContent.items.filter(i => i.id !== id);
          this.saveState();
        },
        
        // Agenda methods
        toggleWater(glass) {
          const newVal = glass + 1 === this.sheet.agendaData.waterIntake ? glass : glass + 1;
          this.sheet.agendaData.waterIntake = newVal;
          this.saveState();
        },
        
        // Checklist List methods
        addListCategory() {
          if (!this.newListCategoryName.trim()) return;
          const colKeys = ['pink', 'lavender', 'mint', 'yellow', 'sky', 'rose', 'peach'];
          const randomCol = colKeys[Math.floor(Math.random() * colKeys.length)];
          if (!this.sheet.listCategories) this.sheet.listCategories = [];
          this.sheet.listCategories.push({
            id: 'cat_' + Date.now(),
            title: this.newListCategoryName.trim(),
            color: randomCol,
            items: []
          });
          this.newListCategoryName = '';
          this.saveState();
          this.$nextTick(() => { window.lucide.createIcons(); });
        },
        
        deleteListCategory(id) {
          this.sheet.listCategories = this.sheet.listCategories.filter(c => c.id !== id);
          this.saveState();
        },
        
        addListItem(cat) {
          const text = this.newListItemText[cat.id] || '';
          if (!text.trim()) return;
          const prio = this.newListItemPriority[cat.id] || 'medium';
          cat.items.push({
            id: 'task_' + Date.now(),
            text: text.trim(),
            completed: false,
            priority: prio
          });
          this.newListItemText[cat.id] = '';
          this.newListItemPriority[cat.id] = 'medium';
          this.saveState();
          this.$nextTick(() => { window.lucide.createIcons(); });
        },
        
        deleteListItem(cat, itemId) {
          cat.items = cat.items.filter(i => i.id !== itemId);
          this.saveState();
        },
        
        // Calendar methods
        getDaysInMonth() {
          if (!this.sheet.calendarData) return 31;
          return new Date(this.sheet.calendarData.year, this.sheet.calendarData.month + 1, 0).getDate();
        },
        
        getFirstDayOffset() {
          if (!this.sheet.calendarData) return 0;
          const rawOffset = new Date(this.sheet.calendarData.year, this.sheet.calendarData.month, 1).getDay();
          return rawOffset === 0 ? 6 : rawOffset - 1;
        },
        
        prevMonth() {
          let m = this.sheet.calendarData.month - 1;
          let y = this.sheet.calendarData.year;
          if (m < 0) { m = 11; y -= 1; }
          this.sheet.calendarData.month = m;
          this.sheet.calendarData.year = y;
          this.saveState();
          this.$nextTick(() => { window.lucide.createIcons(); });
        },
        
        nextMonth() {
          let m = this.sheet.calendarData.month + 1;
          let y = this.sheet.calendarData.year;
          if (m > 11) { m = 0; y += 1; }
          this.sheet.calendarData.month = m;
          this.sheet.calendarData.year = y;
          this.saveState();
          this.$nextTick(() => { window.lucide.createIcons(); });
        },
        
        hasEvent(d) {
          if (!this.sheet.calendarData || !this.sheet.calendarData.events) return false;
          return this.sheet.calendarData.events.some(e => e.day === d);
        },
        
        eventsForDayCount(d) {
          if (!this.sheet.calendarData || !this.sheet.calendarData.events) return 0;
          return this.sheet.calendarData.events.filter(e => e.day === d).length;
        },
        
        addCalendarEvent() {
          if (!this.newCalendarEventText.trim()) return;
          if (!this.sheet.calendarData.events) this.sheet.calendarData.events = [];
          this.sheet.calendarData.events.push({
            day: this.selectedDay,
            text: this.newCalendarEventText.trim(),
            color: this.newCalendarEventColor
          });
          this.newCalendarEventText = '';
          this.saveState();
          this.$nextTick(() => { window.lucide.createIcons(); });
        },
        
        deleteCalendarEvent(ev) {
          this.sheet.calendarData.events = this.sheet.calendarData.events.filter(e => e !== ev);
          this.saveState();
        },
        
        // Stickers handling
        addPresetEmoji(emoji) {
          if (!this.sheet.stickers) this.sheet.stickers = [];
          this.sheet.stickers.push({
            id: 'st_' + Date.now() + Math.random().toString(36).substring(2, 5),
            type: 'emoji',
            content: emoji,
            x: 50,
            y: 50,
            scale: 1.0,
            rotation: 0
          });
          this.activeStickerId = 'st_' + Date.now();
          this.saveState();
          this.$nextTick(() => { window.lucide.createIcons(); });
        },
        
        addCustomBadge() {
          if (!this.customBadgeText.trim()) return;
          if (!this.sheet.stickers) this.sheet.stickers = [];
          this.sheet.stickers.push({
            id: 'st_' + Date.now() + Math.random().toString(36).substring(2, 5),
            type: 'badge',
            content: this.customBadgeText.trim().toUpperCase(),
            color: this.customBadgeColor,
            x: 50,
            y: 50,
            scale: 1.0,
            rotation: 0
          });
          this.customBadgeText = '';
          this.saveState();
          this.$nextTick(() => { window.lucide.createIcons(); });
        },
        
        rotateSticker(st) {
          st.rotation = (st.rotation + 15) % 360;
          this.saveState();
        },
        
        scaleSticker(st, direction) {
          const diff = direction === 'up' ? 0.15 : -0.15;
          st.scale = Math.max(0.5, Math.min(2.5, parseFloat((st.scale + diff).toFixed(2))));
          this.saveState();
        },
        
        deleteSticker(st) {
          this.sheet.stickers = this.sheet.stickers.filter(s => s.id !== st.id);
          this.saveState();
          if (this.activeStickerId === st.id) this.activeStickerId = null;
        },
        
        startDragSticker(e, st) {
          this.activeStickerId = st.id;
          const paper = document.getElementById('sheet-paper-root');
          if (!paper) return;
          const rect = paper.getBoundingClientRect();
          const clientX = e.clientX || (e.touches && e.touches[0].clientX);
          const clientY = e.clientY || (e.touches && e.touches[0].clientY);
          
          const onMove = (moveEvt) => {
            if (moveEvt.cancelable) {
              moveEvt.preventDefault();
            }
            const currentX = moveEvt.clientX || (moveEvt.touches && moveEvt.touches[0].clientX);
            const currentY = moveEvt.clientY || (moveEvt.touches && moveEvt.touches[0].clientY);
            if (!currentX || !currentY) return;
            
            const relativeX = ((currentX - rect.left) / rect.width) * 100;
            const relativeY = ((currentY - rect.top) / rect.height) * 100;
            
            st.x = Math.max(-5, Math.min(105, Math.round(relativeX)));
            st.y = Math.max(-5, Math.min(105, Math.round(relativeY)));
          };
          
          const onStop = () => {
            this.saveState();
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onStop);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onStop);
          };
          
          document.addEventListener('mousemove', onMove, { passive: false });
          document.addEventListener('mouseup', onStop);
          document.addEventListener('touchmove', onMove, { passive: false });
          document.addEventListener('touchend', onStop);
        },
        
        async generatePDF() {
          this.activeStickerId = null;
          await new Promise(r => setTimeout(r, 150));
          
          const element = document.getElementById('sheet-export-wrapper');
          if(!element) return;
          
          const styleEl = document.createElement('style');
          styleEl.id = 'temp-alpine-pdf-style';
          styleEl.innerHTML = \`
            #sheet-export-parent,
            #sheet-export-wrapper {
              width: 1120px !important;
              max-width: 1120px !important;
              min-width: 1120px !important;
              padding: 40px !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
              transform: none !important;
              background: #ffffff !important;
            }
            #sheet-paper-root {
              width: 100% !important;
              max-width: 1120px !important;
              min-width: 1120px !important;
              min-height: 1580px !important;
              padding: 80px 60px !important;
              box-sizing: border-box !important;
              border-radius: 40px !important;
              box-shadow: none !important;
            }
            button, select, form, nav, header, .no-export, .sticker-controls, #sheet-controls-panel { display: none !important; }
            input, textarea { border: none !important; background: transparent !important; outline: none !important; box-shadow: none !important; }
            input::placeholder, textarea::placeholder { color: transparent !important; }
            * { scrollbar-width: none !important; }
            *::-webkit-scrollbar { display: none !important; }
          \`;
          document.head.appendChild(styleEl);
          await new Promise(r => setTimeout(r, 500));
          
          try {
            const canvas = await html2canvas(element, {
              scale: 2.5,
              backgroundColor: '#ffffff',
              useCORS: true,
              logging: false,
              width: 1120,
              height: element.offsetHeight,
              windowWidth: 1120,
              windowHeight: element.offsetHeight,
              scrollX: 0,
              scrollY: 0,
              x: 0,
              y: 0
            });
            
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const margin = 10;
            const availableWidth = pdfWidth - (margin * 2);
            const availableHeight = pdfHeight - (margin * 2);
            
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasHeight / canvasWidth;
            
            let targetWidth = availableWidth;
            let targetHeight = targetWidth * ratio;
            
            if (targetHeight > availableHeight) {
              targetHeight = availableHeight;
              targetWidth = targetHeight / ratio;
            }
            
            const printLeft = (pdfWidth - targetWidth) / 2;
            const printTop = (pdfHeight - targetHeight) / 2;
            
            pdf.addImage(imgData, 'PNG', printLeft, printTop, targetWidth, targetHeight, undefined, 'FAST');
            const filename = this.sheet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'agenda_planner';
            pdf.save(filename + '.pdf');
          } finally {
            const sty = document.getElementById('temp-alpine-pdf-style');
            if (sty) sty.remove();
          }
        }
      }
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetSheet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'agenda_planner'}_standalone.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareModalConfig.url);
        setShareModalConfig(prev => ({ ...prev, copied: true }));
        setTimeout(() => {
          setShareModalConfig(prev => ({ ...prev, copied: false }));
        }, 2000);
      } else {
        // Fallback for sandboxed or insecure contexts
        const input = document.getElementById('share-url-input') as HTMLInputElement;
        if (input) {
          input.select();
          input.setSelectionRange(0, 99999); // Mobile
          document.execCommand('copy');
          setShareModalConfig(prev => ({ ...prev, copied: true }));
          setTimeout(() => {
            setShareModalConfig(prev => ({ ...prev, copied: false }));
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Copy to clipboard fallback failed', err);
    }
  };

  if (isMiniAppMode && miniAppSheet) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 overflow-x-hidden"
        style={{
          backgroundColor: '#F6F5F2',
          backgroundImage: 'radial-gradient(rgba(45, 36, 30, 0.08) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="w-full max-w-4xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-[#2D241E]/10 shadow-sm animate-fade-in gap-4 sm:gap-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-[#FF6B6B] rounded-lg md:rounded-xl flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xs md:text-base font-bold text-[#2D241E] uppercase tracking-tight">Atelier Interactive</h1>
                <p className="text-[10px] md:text-xs text-[#2D241E]/60 font-bold uppercase tracking-widest leading-none">Studio Studio Studio</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#FF6B6B] text-white px-3 py-2 md:px-4 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-wider hover:bg-[#FF8787] transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Salva PDF</span>
                <span className="xs:hidden">PDF</span>
              </button>
              <button 
                onClick={handleExitMiniApp}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#2D241E] text-white px-3 py-2 md:px-4 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-wider hover:bg-[#443831] transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Crea la Tua</span>
                <span className="xs:hidden">Nuova</span>
              </button>
            </div>
          </div>

          <div className="animate-fade-in shadow-2xl rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm">
            <PlannerSheetView
              sheet={miniAppSheet}
              onUpdateSheet={(updated) => {
                setMiniAppSheet(updated);
                currentMiniAppSheetRef.current = updated;
              }}
              onDeleteSheet={handleExitMiniApp}
              activeStickerId={activeStickerId}
              setActiveStickerId={setActiveStickerId}
              showDevControls={false}
            />
          </div>

          <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] py-4">
            Generato con Atelier Planner Design Studio • Creative Studio
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex flex-col overflow-x-hidden pb-12 select-none`}
      style={{
        backgroundColor: deskTheme === 'wooden' ? '#2D241E' : deskTheme === 'corkboard' ? '#C09267' : '#F6F5F2',
        // Perfect textured workspace backdrop with geometric alignment and subtle grains
        backgroundImage: 
          deskTheme === 'wooden' 
            ? `radial-gradient(ellipse at center, rgba(45, 36, 30, 0.5) 0%, rgba(20, 15, 12, 0.95) 100%), url('https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2000&auto=format&fit=crop')`
            : deskTheme === 'corkboard'
              ? `radial-gradient(ellipse at center, rgba(192, 146, 103, 0.25) 0%, rgba(100, 70, 45, 0.95) 100%), url('https://images.unsplash.com/photo-1601662528567-526cd06f6582?q=80&w=1200&auto=format&fit=crop')`
              : 'radial-gradient(rgba(45, 36, 30, 0.08) 1.5px, transparent 1.5px)',
        backgroundSize: deskTheme === 'minimal pastel' || deskTheme === 'pastel' ? '28px 28px' : 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
      id="scrivania-root"
    >
      
      {/* 🧭 Top Panel - High-Contrast Architectural Studio Header */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b-2 border-[#2D241E]/10 shadow-sm py-4 px-4 md:px-8 relative z-30 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-[#FF6B6B] rounded-xl flex items-center justify-center shadow-xs transition-transform hover:rotate-6">
              <BookOpen className="w-5 h-5 md:w-5.5 md:h-5.5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm md:text-xl font-bold tracking-tight text-[#2D241E] uppercase flex items-center gap-1.5 font-sans">
                <span>Atelier Planner</span>
                <span className="text-[9px] md:text-[10px] bg-[#2D241E] text-[#FFF9C4] px-1.5 md:py-0.5 rounded-md font-bold tracking-widest">DESIGN</span>
              </h1>
              <p className="hidden xs:block text-[9px] md:text-xs text-[#2D241E]/60 font-semibold font-sans tracking-wide">
                Blocchetti, Agende e Calendari personalizzabili
              </p>
            </div>
          </div>

          {/* Action buttons and workspace controls */}
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end" id="desk-global-actions">
            
            {/* Theme switcher */}
            <div className="flex items-center bg-[#2D241E]/5 p-1 rounded-xl border border-[#2D241E]/10 text-xs font-bold gap-1 text-[#2D241E]">
              <span className="hidden sm:inline px-1.5 text-[9px] uppercase text-[#2D241E]/50 tracking-widest font-extrabold">Tavolo:</span>
              {(['wooden', 'corkboard', 'pastel'] as const).map((th) => (
                <button
                  key={th}
                  onClick={() => setDeskTheme(th === 'pastel' ? 'minimal pastel' : th)}
                  className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer text-[10px] md:text-[11px] uppercase tracking-wider font-bold ${
                    (th === 'pastel' && deskTheme === 'minimal pastel') || (deskTheme === th)
                      ? 'bg-[#2D241E] text-white shadow-xs'
                      : 'hover:bg-black/5 hover:text-[#2D241E] text-[#2D241E]/60'
                  }`}
                  id={`theme-btn-${th}`}
                >
                  {th === 'wooden' ? 'Legno' : th === 'corkboard' ? 'Sughero' : 'Studio'}
                </button>
              ))}
            </div>

            {/* Print & PDF downloads */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className={`flex items-center justify-center gap-1.5 bg-[#FF6B6B] hover:bg-[#FF8787] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs cursor-pointer transition-transform active:scale-95 disabled:opacity-40 select-none`}
              id="export-pdf-global-btn"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Stampa...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Esporta PDF</span>
                </>
              )}
            </button>

            {/* Quick help button toggler */}
            <button
              onClick={() => setHelpOpen(!helpOpen)}
              className="p-2.5 hover:bg-[#2D241E]/5 rounded-xl border border-[#2D241E]/10 text-[#2D241E] hover:text-[#2D241E] bg-white cursor-pointer transition-colors"
              title="Manuale Istruzioni"
              id="help-toggle-btn"
            >
              <HelpCircle className="w-4.5 h-4.5 stroke-[2.2]" />
            </button>

            {/* Wipe factory restore */}
            <button
              onClick={handleResetRestoreDefaults}
              className="p-2.5 hover:bg-red-50 rounded-xl border border-red-200 text-red-500 bg-white cursor-pointer transition-colors"
              title="Ripristina demo originali"
              id="reset-desk-btn"
            >
              <RotateCcw className="w-4.5 h-4.5 stroke-[2.2]" />
            </button>
          </div>

        </div>
      </header>

      {/* 📖 Manual instructions container */}
      {helpOpen && (
        <section className="bg-amber-50 border-b-2 border-amber-200 py-4 px-6 text-xs text-amber-900 select-text animate-fade-in-down" id="help-drawer-section">
          <div className="max-w-4xl mx-auto flex justify-between items-start gap-4">
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-amber-950 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Benvenuto nel tuo Designer di Scrivania Planner!</span>
              </h4>
              <p>Questa applicazione re-immagina la pianificazione manuale cartacea sul tuo schermo con simulazione fisica ed esportazione scalabile:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>Crea Nuovi Planner:</strong> Usa la barra "I Miei Blocchi" sotto per creare agende quotidiane, blocknote unghie, liste e calendari mensili.</li>
                <li><strong>Aggiungi gli Sticker:</strong> Apri il cassetto sinistro, sfoglia gli sticker carini o scrivi un nastro personalizzato (es: "URGENTE") e incollalo!</li>
                <li><strong>Manipolazione libera:</strong> Clicca su uno sticker applicato per farlo illuminare: potrai ingrandirlo <code>(+)</code>, rimpicciolirlo <code>(-)</code>, ruotarlo di 15 gradi <code>(🔄)</code> o lanciarlo/eliminarlo <code>(×)</code>. Puoi anche afferrarlo e trascinarlo in ogni angolo del foglio!</li>
                <li><strong>Esportazione PDF stampabile:</strong> Clicca "Scarica PDF". L'app spegnerà temporaneamente i contorni grafici per garantirti una stampa nitida su formato A4 da conservare sulla tua vera scrivania di casa!</li>
              </ul>
            </div>
            <button 
              onClick={() => setHelpOpen(false)}
              className="bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg font-bold text-amber-950 cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </section>
      )}
      <section className="w-full py-4 md:py-6 px-4 md:px-8 max-w-7xl mx-auto select-none">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#FFF9C4] flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse"></span>
              <span>📂 Planner sul Tavolo</span>
              <span className="text-white/60 font-mono text-[9px] md:text-[10px]">({sheets.length})</span>
            </h3>
            
            {/* Quick adding buttons bar */}
            <div className="flex items-center gap-2 flex-wrap" id="sheet-creator-triggers">
              <span className="text-[10px] uppercase text-[#FFF]/60 mr-1.5 font-bold tracking-widest font-mono">Aggiungi Elemento:</span>
              <button
                onClick={() => handleAddFieldSheet('blocknote')}
                className="bg-white/10 hover:bg-white/20 text-[#FFF9C4] hover:text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/15 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                id="add-sheet-blocknote-btn"
              >
                <FileText className="w-3.5 h-3.5 text-[#FFE66D]" />
                <span>Blocknote 🗒️</span>
              </button>
              <button
                onClick={() => handleAddFieldSheet('agenda')}
                className="bg-white/10 hover:bg-white/20 text-[#FFF9C4] hover:text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/15 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                id="add-sheet-agenda-btn"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#B8D8BA]" />
                <span>Agenda ☀️</span>
              </button>
              <button
                onClick={() => handleAddFieldSheet('list')}
                className="bg-white/10 hover:bg-white/20 text-[#FFF9C4] hover:text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/15 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                id="add-sheet-list-btn"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#F8BBD0]" />
                <span>Lista 📝</span>
              </button>
              <button
                onClick={() => handleAddFieldSheet('calendar')}
                className="bg-white/10 hover:bg-white/20 text-[#FFF9C4] hover:text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/15 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                id="add-sheet-calendar-btn"
              >
                <Calendar className="w-3.5 h-3.5 text-[#4ECDC4]" />
                <span>Calendario 📅</span>
              </button>
            </div>
          </div>

          {/* Slots / Tabs Carousel */}
          <div className="flex gap-3.5 items-center overflow-x-auto pb-2 scrollbar-thin" id="desk-sheets-tabs-carousel">
            {sheets.map((sh, idx) => {
              const active = sh.id === activeSheetId;
              
              // Map types to beautiful visuals
              let icon = <FileText className="w-3.5 h-3.5 text-[#FFE66D]" />;

              if (sh.type === 'agenda') {
                icon = <BookOpen className="w-3.5 h-3.5 text-[#B8D8BA]" />;
              } else if (sh.type === 'list') {
                icon = <CheckSquare className="w-3.5 h-3.5 text-[#F8BBD0]" />;
              } else if (sh.type === 'calendar') {
                icon = <Calendar className="w-3.5 h-3.5 text-[#4ECDC4]" />;
              }

              const colPreset = COLORS.find((col) => col.id === sh.colorTheme || col.accentTailwind === sh.colorTheme) || COLORS[0];

              return (
                <button
                  key={sh.id}
                  onClick={() => {
                    setActiveSheetId(sh.id);
                    setActiveStickerId(null); // reset selector
                  }}
                  className={`flex flex-col text-left px-5 py-3 rounded-xl border transition-all duration-300 min-w-[#160px] max-w-[#220px] flex-shrink-0 cursor-pointer shadow-md transform ${
                    active 
                      ? 'bg-white border-[#2D241E] scale-102 ring-2 ring-[#FF6B6B]/50' 
                      : 'bg-[#2D241E]/55 text-stone-200 hover:text-white hover:bg-[#2D241E]/75 border-white/10 hover:scale-[1.01]'
                  }`}
                  id={`sheet-tab-${sh.id}`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {icon}
                    <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-60 font-mono">
                      {sh.type === 'blocknote' ? 'FOGLIO' : sh.type}
                    </span>
                  </div>
                  <span className={`text-xs font-bold truncate max-w-full uppercase tracking-wide ${active ? 'text-[#2D241E] font-extrabold' : 'text-stone-300'}`}>
                    {sh.title || 'Senza Titolo'}
                  </span>
                  
                  {/* Miniature decorative highlight indicator bar */}
                  <div 
                    className="w-full h-1 rounded-full mt-2" 
                    style={{ backgroundColor: colPreset.accentHex }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 💻 Main Virtual Desk Canvas workspace */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 md:gap-8 items-start relative z-10" id="scrivania-main-deck">
        
        {/* 🎨 Sticker Cabinet Sidebar Panel */}
        <aside className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-[#2D241E]/15 w-full flex-shrink-0 relative lg:sticky lg:top-6 z-10 order-2 lg:order-1" id="sticker-cabinet-aside">
          
          <div className="mb-4 pb-2 border-b border-[#2D241E]/10 flex justify-between items-center lg:block">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest text-[#2D241E]/80 font-sans flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-[#FF6B6B]" />
                <span>Cassetto Sticker</span>
              </h3>
              <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Clicca per incollare sul foglio</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Presets - Emojis cute */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#2D241E]/40 block mb-2 font-mono">⭐ Icone & Emojis</span>
              <div className="flex lg:grid lg:grid-cols-4 gap-2 bg-gray-55 p-2 rounded-xl border border-gray-100 overflow-x-auto lg:overflow-y-auto lg:max-h-[220px] scrollbar-thin" id="emojis-sticker-drawer">
                {STICKER_PRESETS.filter((p) => p.type === 'emoji').map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handlePlaceSticker('emoji', st.content)}
                    className="aspect-square min-w-[44px] md:min-w-0 text-2xl md:text-3xl hover:scale-125 transition-transform cursor-pointer hover:bg-white rounded-lg p-1 text-center select-none active:scale-95 flex items-center justify-center shadow-3xs hover:shadow-2xs"
                    title={st.label}
                    id={`sticker-pickup-${st.id}`}
                  >
                    {st.content}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets - Washi ribbon badges */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#2D241E]/40 block mb-2 font-mono">🏷️ Nastri & Badge Predefiniti</span>
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[160px] pb-1 lg:pb-0 scrollbar-thin" id="badges-sticker-drawer">
                {STICKER_PRESETS.filter((p) => p.type === 'badge').map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handlePlaceSticker('badge', st.content, st.defaultColor)}
                    className="flex-shrink-0 lg:w-full text-left bg-white hover:bg-neutral-50 px-3 py-2 rounded-lg border border-gray-100 hover:border-[#2D241E]/30 transition-all cursor-pointer flex items-center gap-3 lg:justify-between text-xs font-bold text-[#2D241E] font-sans"
                    id={`sticker-pickup-${st.id}`}
                  >
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase whitespace-nowrap tracking-wider shadow-3xs" 
                      style={{ backgroundColor: st.defaultColor }}
                    >
                      {st.content}
                    </span>
                    <span className="hidden md:inline text-[9px] text-gray-400 font-mono font-medium uppercase tracking-wider">Aggiungi</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Custom Badge ribbon drawer */}
            <div className="border-t border-dashed border-[#2D241E]/15 pt-4">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#2D241E]/40 block mb-2 font-mono">🏷️ Crea Nastro Scritto</span>
              
              <form onSubmit={handlePlaceCustomBadge} className="flex flex-col sm:flex-row lg:flex-col gap-2" id="custom-ribbon-form">
                <input
                  type="text"
                  maxLength={16}
                  placeholder="Es: DENTISTA"
                  value={customBadgeText}
                  onChange={(e) => setCustomBadgeText(e.target.value)}
                  className="flex-1 text-xs bg-gray-50 border border-gray-150 focus:border-[#2D241E] focus:ring-2 focus:ring-stone-100 rounded-lg px-2.5 py-2.5 outline-none uppercase font-bold text-[#2D241E]/90 placeholder:text-gray-400"
                  id="custom-badge-input"
                />

                {/* Color picking dot triggers */}
                <div className="flex gap-1.5 justify-between items-center bg-gray-50 px-2.5 py-2 border border-gray-150 rounded-lg">
                  <span className="hidden sm:inline lg:inline text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Mix:</span>
                  <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    {['#f43f5e', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899', '#2D241E'].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setCustomBadgeColor(hex)}
                        className={`w-4 h-4 rounded-full block border transition-transform flex-shrink-0 ${
                          customBadgeColor === hex ? 'scale-115 border-gray-700 ring-2 ring-white shadow-md' : 'border-transparent hover:scale-110'
                        }`}
                        style={{ backgroundColor: hex }}
                        id={`custom-badge-color-btn-${hex.replace('#', '')}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!customBadgeText.trim()}
                  className="bg-[#2D241E] hover:bg-[#443831] disabled:opacity-40 text-white font-bold py-2.5 px-4 rounded-lg cursor-pointer transition-transform active:scale-95 shadow-xs text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  id="custom-badge-submit"
                >
                  <Plus className="w-4 h-4" />
                  <span>Stacca Adesivo</span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* 📒 Render Active Sheet View Canvas on Desk */}
        <section id="desk-sheet-display-container" className="order-1 lg:order-2 w-full overflow-visible flex justify-center">
          {activeSheet ? (
            <PlannerSheetView
              sheet={activeSheet}
              onUpdateSheet={handleUpdateSheet}
              onDeleteSheet={handleDeleteSheet}
              onShareSheet={handleShareSheet}
              activeStickerId={activeStickerId}
              setActiveStickerId={setActiveStickerId}
              showDevControls={false}
            />
          ) : (
            <div className="w-full text-center py-20 bg-stone-900/30 rounded-2xl border border-dashed border-white/20">
              <p className="text-gray-300 font-semibold px-4">Tavolo vuoto! Aggiungi un foglio dai pulsanti sopra.</p>
            </div>
          )}
        </section>

      </main>

      {/* 🚀 Beautiful Custom Share Modal */}
      {shareModalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="share-modal-overlay">
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl p-6 md:p-8 border border-[#2D241E]/15 shadow-2xl relative animate-scale-up select-text text-[#2D241E] max-h-[92vh] overflow-y-auto" 
            id="share-modal-container"
          >
            {/* Close button */}
            <button
              onClick={() => setShareModalConfig(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-2 hover:bg-[#2D241E]/5 rounded-xl transition-colors cursor-pointer text-[#2D241E]/60 hover:text-[#2D241E]"
              id="close-share-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-[#FF6B6B]/10 rounded-full flex items-center justify-center text-[#FF6B6B] animate-bounce">
                <Share2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="max-w-md">
                <h3 className="font-extrabold text-lg uppercase tracking-tight text-[#2D241E] font-sans">
                  Pronto per Condividere il tuo Planner!
                </h3>
                <p className="text-xs text-[#2D241E]/60 mt-1.5 font-sans leading-relaxed">
                  Esporta la tua agenda interattiva con le tue personalizzazioni, colori, note e adesivi! Scegli il metodo perfetto qui sotto.
                </p>
              </div>

              {/* ✨ SOLUZIONE PER L'ERRORE 403 / 404 */}
              <div className="w-full text-left bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-[11px] text-[#064e3b] leading-relaxed font-sans">
                <div className="flex gap-2.5 items-start">
                  <span className="text-base select-none">✨</span>
                  <div>
                    <h5 className="font-black text-emerald-900 uppercase tracking-wide text-[10px] mb-1">Come risolvere gli errori 403 e 404</h5>
                    <p className="mb-2 text-emerald-800">
                      I link che iniziano con <code className="bg-emerald-100 text-emerald-900 px-1 rounded">ais-dev-</code> sono privati e danno <b>errore 403</b> ad altre persone. 
                      Per questo motivo, l'app converte automaticamente il tuo link all'indirizzo pubblico della tua anteprima (<code className="bg-emerald-100 text-emerald-900 px-1 rounded">ais-pre-</code>).
                    </p>
                    <div className="bg-white/80 border border-emerald-100 p-2.5 rounded-lg text-emerald-950 mb-2">
                      <p className="font-extrabold text-[10px] uppercase text-emerald-800 tracking-wider mb-1">🔴 Se riscontri "Errore 404 (Page Not Found)" sul link pubblico:</p>
                      <p className="italic text-emerald-900">
                        Significa che Google non ha ancora caricato la tua app su internet! 
                        Per attivarla, ti basta fare clic sul pulsante blu <b>"Share"</b> (o <b>"Condividi"</b>) che trovi in alto a destra nell'interfaccia di questa scheda di AI Studio. Cosi facendo Google attiverà la pagina e il link copiato qui sotto funzionerà alla perfezione per chiunque!
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-800">
                      💡 <b>Alternativa immediata:</b> Se preferisci non pubblicare nulla su internet o inviare l'agenda in totale sicurezza e offline, scarica il file con l'opzione <b>Salva App Offline (.html)</b>. Potrai inviarlo su WhatsApp, e-mail o usarlo in locale su qualsiasi dispositivo senza configurazioni!
                    </p>
                  </div>
                </div>
              </div>

              {/* Split Action Panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-1 select-none text-left">
                {/* Panel 2: Cloud Link - STRONGLY PREFERRED NOW */}
                <div className="border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between items-stretch bg-[#FAF9F6]/50 hover:bg-white transition-all ring-2 ring-emerald-500/20 shadow-xs">
                  <div>
                    <h4 className="text-xs font-black uppercase text-emerald-600 tracking-wider mb-1 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Link Cloud Pubblico (Niente 403)</span>
                    </h4>
                    <p className="text-[10px] text-stone-600 font-medium leading-relaxed font-sans mb-3">
                      Questo link è pubblico. Invialo a chi vuoi: caricherà la tua esatta configurazione con i tuoi adesivi sulla sua scrivania virtuale per iniziare a scrivere!
                    </p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleCopyLink}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        shareModalConfig.copied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      id="modal-copy-btn"
                    >
                      {shareModalConfig.copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Copiato!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copia Link</span>
                        </>
                      )}
                    </button>
                    <a
                      href={shareModalConfig.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-stone-50 hover:bg-stone-100 p-2.5 rounded-xl border border-stone-200 flex items-center justify-center text-[#2D241E]"
                      id="modal-open-tab-btn"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Panel 1: Standalone Download as alternative */}
                <div className="border border-stone-200 rounded-2xl p-4 flex flex-col justify-between items-stretch bg-stone-50/50 hover:bg-stone-50 transition-colors">
                  <div>
                    <h4 className="text-xs font-black uppercase text-stone-600 tracking-wider mb-1 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      <span>Scarica App Offline (.html)</span>
                    </h4>
                    <p className="text-[10px] text-stone-500 font-medium leading-relaxed font-sans mb-3">
                      Genera un file <b>.html</b> autonomo contenente il tuo planner. Basta aprirlo con doppio clic su qualsiasi computer o smartphone, totalmente offline!
                    </p>
                  </div>
                  <button
                    onClick={handleExportStandaloneHTML}
                    className="w-full bg-stone-600 hover:bg-stone-500 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    id="modal-export-standalone-btn"
                  >
                    <Download className="w-4 h-4" />
                    <span>Salva App Offline</span>
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="w-full text-left bg-stone-50 border border-stone-200 p-4 rounded-2xl text-xs text-stone-600 leading-relaxed font-sans">
                <span className="font-extrabold text-[10px] text-[#2D241E] uppercase tracking-wider block mb-1">💡 COSA OFFRONO QUESTE MINI APP INTERATTIVE?</span>
                <p>• <b>Grafica e Decorazioni</b>: Integrano le tue esatte impostazioni di sfondi, colori e stili.</p>
                <p>• <b>Interazione Completa</b>: Checkbox, note libere, idratazione giornaliera e stickers dinamici trascinabili funzionano offline.</p>
                <p>• <b>Autosalvataggio Locale</b>: Salvano in tempo reale ogni cambiamento direttamente sul browser di chi la usa!</p>
              </div>

              {/* Bottom Actions */}
              <div className="w-full mt-2">
                <button
                  onClick={() => setShareModalConfig(prev => ({ ...prev, isOpen: false }))}
                  className="w-full bg-stone-100 hover:bg-stone-150 py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-colors cursor-pointer border border-stone-200 text-[#2D241E]"
                  id="modal-dismiss-btn"
                >
                  Chiudi Schermata Di Condivisione
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
