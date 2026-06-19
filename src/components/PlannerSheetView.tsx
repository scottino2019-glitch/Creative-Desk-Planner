/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { PlannerSheet, Sticker, BackPattern, FontStyle, PresetColor } from '../types';
import { COLORS } from '../data';
import NotepadSheet from './NotepadSheet';
import AgendaSheet from './AgendaSheet';
import ChecklistSheet from './ChecklistSheet';
import CalendarSheet from './CalendarSheet';
import { 
  RotateCw, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Palette, 
  Type, 
  Grid, 
  Trash, 
  Scissors, 
  Sparkles,
  Info,
  SlidersHorizontal,
  RefreshCw,
  Share2
} from 'lucide-react';

interface PlannerSheetViewProps {
  sheet: PlannerSheet;
  onUpdateSheet: (updatedSheet: PlannerSheet) => void;
  onDeleteSheet: () => void;
  onShareSheet?: () => void;
  activeStickerId: string | null;
  setActiveStickerId: (id: string | null) => void;
  showDevControls: boolean;
}

export default function PlannerSheetView({
  sheet,
  onUpdateSheet,
  onDeleteSheet,
  onShareSheet,
  activeStickerId,
  setActiveStickerId,
  showDevControls,
}: PlannerSheetViewProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [showStickerTips, setShowStickerTips] = useState(true);

  // Dynamic font link loading
  useEffect(() => {
    const fontName = sheet.customFontName?.trim();
    if (fontName) {
      const fontId = `custom-font-link-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        const formattedName = fontName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('+');
        link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [sheet.customFontName]);

  // Helper inside the font definitions
  const getFontFamilyClass = (f: FontStyle) => {
    switch (f) {
      case 'fredoka': return 'font-fredoka tracking-wide';
      case 'caveat': return 'font-caveat text-xl leading-relaxed';
      case 'playfair': return 'font-playfair tracking-normal';
      default: return 'font-sans';
    }
  };

  const getFontFamilyStyle = (): React.CSSProperties => {
    if (sheet.customFontName && sheet.customFontName.trim()) {
      return { fontFamily: `'${sheet.customFontName.trim()}', sans-serif` };
    }
    switch (sheet.font) {
      case 'fredoka': return { fontFamily: '"Fredoka", sans-serif' };
      case 'caveat': return { fontFamily: '"Caveat", cursive' };
      case 'playfair': return { fontFamily: '"Playfair Display", serif' };
      default: return { fontFamily: '"Inter", sans-serif' };
    }
  };

  const getThemeColor = () => {
    if (sheet.customAccentColor) return sheet.customAccentColor;
    const found = COLORS.find((c) => c.accentTailwind === sheet.colorTheme || c.id === sheet.colorTheme);
    return found ? found.accentHex : '#ec4899'; // Fallback highlight pink
  };

  const getPaperBgHex = () => {
    if (sheet.customPaperColor) return sheet.customPaperColor;
    const found = COLORS.find((c) => c.accentTailwind === sheet.colorTheme || c.id === sheet.colorTheme);
    return found ? found.lightBgHex : '#fff1f2';
  };

  const accentColor = getThemeColor();
  const fontFamilyClass = getFontFamilyClass(sheet.font);

  const baseSize = sheet.baseFontSize || 16;
  const fontSizes = {
    title: Math.round(baseSize * 1.5), // e.g. 24px
    subtitle: Math.round(baseSize * 0.85), // e.g. 14px
    label: Math.round(baseSize * 0.7), // e.g. 11px
    value: Math.round(baseSize * 1.0), // e.g. 16px
    item: Math.round(baseSize * 0.85), // e.g. 14px
  };

  const sheetRef = useRef(sheet);
  useEffect(() => {
    sheetRef.current = sheet;
  }, [sheet]);

  // Sticker dragging and positioning logic
  const handleStickerDragStart = (
    e: React.MouseEvent | React.TouchEvent,
    stickerId: string
  ) => {
    setActiveStickerId(stickerId);
    
    if (!paperRef.current) return;
    const rect = paperRef.current.getBoundingClientRect();
    const sticker = sheetRef.current.stickers.find((s) => s.id === stickerId);
    if (!sticker) return;

    // Support both mouse dragging and mobile touch dragging
    const getClientCoords = (evt: MouseEvent | TouchEvent) => {
      if ('touches' in evt) {
        if (evt.touches.length > 0) {
          return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
        }
      } else {
        return { x: (evt as MouseEvent).clientX, y: (evt as MouseEvent).clientY };
      }
      return null;
    };

    const initialCoords = getClientCoords(e.nativeEvent);
    if (!initialCoords) return;

    // Stop propagation so we do not drag pages or trigger unexpected behaviors
    e.stopPropagation();

    const onMove = (moveEvt: MouseEvent | TouchEvent) => {
      // Prevent browser default panning or scrolling on mobile touch dragging
      if (moveEvt.cancelable) {
        moveEvt.preventDefault();
      }
      const currentCoords = getClientCoords(moveEvt);
      if (!currentCoords || !paperRef.current) return;

      // Calculate coordinates relative to the paper bounding container
      const relativeX = ((currentCoords.x - rect.left) / rect.width) * 100;
      const relativeY = ((currentCoords.y - rect.top) / rect.height) * 100;

      // Constrain stickers inside boundaries, allowing slight overflow for stylish edge looks (-5% to 105%)
      const nextX = Math.round(Math.max(-5, Math.min(105, relativeX)));
      const nextY = Math.round(Math.max(-5, Math.min(105, relativeY)));

      // Update sticker coordinates
      const currentSheet = sheetRef.current;
      const updatedStickers = currentSheet.stickers.map((s) =>
        s.id === stickerId ? { ...s, x: nextX, y: nextY } : s
      );
      
      onUpdateSheet({
        ...currentSheet,
        stickers: updatedStickers,
      });
    };

    const onStop = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onStop);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onStop);
    };

    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('mouseup', onStop);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onStop);
  };

  // Sticker updates (Rotate, scale, delete)
  const handleStickerRotate = (e: React.MouseEvent, stickerId: string) => {
    e.stopPropagation();
    const updated = sheet.stickers.map((s) => {
      if (s.id === stickerId) {
        // Rotate in +15 deg steps
        const nextRotation = (s.rotation + 15) % 360;
        return { ...s, rotation: nextRotation };
      }
      return s;
    });
    onUpdateSheet({ ...sheet, stickers: updated });
  };

  const handleStickerScale = (e: React.MouseEvent, stickerId: string, direction: 'up' | 'down') => {
    e.stopPropagation();
    const updated = sheet.stickers.map((s) => {
      if (s.id === stickerId) {
        const diff = direction === 'up' ? 0.15 : -0.15;
        const nextScale = Math.max(0.5, Math.min(2.5, s.scale + diff));
        return { ...s, scale: parseFloat(nextScale.toFixed(2)) };
      }
      return s;
    });
    onUpdateSheet({ ...sheet, stickers: updated });
  };

  const handleStickerDelete = (e: React.MouseEvent, stickerId: string) => {
    e.stopPropagation();
    const updated = sheet.stickers.filter((s) => s.id !== stickerId);
    onUpdateSheet({ ...sheet, stickers: updated });
    if (activeStickerId === stickerId) setActiveStickerId(null);
  };

  // Subcomponent modifications
  const handleUpdateNotepadNotes = (text: string) => {
    if (!sheet.notepadContent) return;
    onUpdateSheet({
      ...sheet,
      notepadContent: { ...sheet.notepadContent, notesText: text },
    });
  };

  const handleUpdateNotepadItems = (items: any[]) => {
    if (!sheet.notepadContent) return;
    onUpdateSheet({
      ...sheet,
      notepadContent: { ...sheet.notepadContent, items },
    });
  };

  const handleUpdateAgendaData = (agendaData: any) => {
    onUpdateSheet({ ...sheet, agendaData });
  };

  const handleUpdateListCategories = (listCategories: any[]) => {
    onUpdateSheet({ ...sheet, listCategories });
  };

  const handleUpdateCalendarData = (calendarData: any) => {
    onUpdateSheet({ ...sheet, calendarData });
  };

  // Set page headers
  const handleTitleChange = (val: string) => {
    onUpdateSheet({ ...sheet, title: val });
  };

  const handleSubtitleChange = (val: string) => {
    onUpdateSheet({ ...sheet, subtitle: val });
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6" id={`sheet-wrapper-${sheet.id}`}>
      {/* 📒 Core customizable paper card */}
      <div 
        className="flex-1 flex flex-col items-center p-0 sm:p-4" 
        id={`sheet-export-wrapper-parent-${sheet.id}`}
      >
        <div 
          id={`sheet-export-wrapper-${sheet.id}`}
          className="flex flex-col items-center w-full"
        >
          {/* Authentic physical spiral wire header */}
          <div className="flex justify-center gap-2 md:gap-4 -mb-[14px] px-8 relative z-20 w-fit pointer-events-none select-none">
            {Array.from({ length: 14 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center">
                {/* Vertical steel binders */}
                <div className="w-2.5 h-7 bg-linear-to-b from-gray-400 via-stone-200 to-gray-500 rounded-full shadow-md border border-gray-400/50" />
                {/* Inner ring hold punches */}
                <div className="w-[7px] h-[7px] bg-neutral-800 rounded-full -mt-2.5 opacity-80" />
              </div>
            ))}
          </div>

          {/* Dynamic sheet container */}
          <div
            ref={paperRef}
            id={`sheet-paper-${sheet.id}`}
            onClick={() => setActiveStickerId(null)} // click paper to deselect sticker controls
            className={`w-full max-w-2xl min-h-[500px] md:min-h-[700px] border-2 rounded-2xl p-4 md:p-8 relative shadow-xl overflow-hidden ${
              sheet.bgPattern === 'ruled' ? 'pattern-ruled' : ''
            } ${sheet.bgPattern === 'grid' ? 'pattern-grid' : ''} ${
              sheet.bgPattern === 'dotted' ? 'pattern-dotted' : ''
            }`}
            style={{
              backgroundColor: getPaperBgHex(),
              borderColor: accentColor,
              boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03), inset 0 0 40px rgba(255, 255, 255, 0.6), 0 0 0 10px rgba(255, 255, 255, 0.1)`,
              ...getFontFamilyStyle()
            }}
          >
          {/* Aesthetic notebook tear-off margin line left */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[1px] bg-red-300 opacity-60 z-10 pointer-events-none" />

          {/* Aesthetic ribbon/tape background header wrapper */}
          <div className="relative mb-6 pb-4 border-b border-gray-300/60 z-10 pl-4">
            <input
              type="text"
              value={sheet.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="font-extrabold bg-transparent border-none focus:ring-0 focus:outline-none p-0 w-full text-neutral-800 placeholder:text-neutral-400/70 select-text"
              placeholder="Inserisci Titolo Foglio..."
              style={{ color: accentColor, fontSize: `${fontSizes.title}px` }}
              id={`sheet-title-input-${sheet.id}`}
            />
            <input
              type="text"
              value={sheet.subtitle || ''}
              onChange={(e) => handleSubtitleChange(e.target.value)}
              className="font-semibold opacity-60 bg-transparent border-none mt-1 focus:ring-0 focus:outline-none p-0 w-full text-neutral-600 placeholder:text-neutral-400/80"
              placeholder="Inserisci un simpatico sottotitolo opzionale..."
              style={{ fontSize: `${fontSizes.subtitle}px` }}
              id={`sheet-subtitle-input-${sheet.id}`}
            />
          </div>

          {/* Sheet Type Content Area */}
          <div className="relative z-10 select-text">
            {sheet.type === 'blocknote' && sheet.notepadContent && (
              <NotepadSheet
                notesText={sheet.notepadContent.notesText}
                items={sheet.notepadContent.items}
                accentColor={accentColor}
                fontFamilyClass=""
                fontSizes={fontSizes}
                onChangeNotes={handleUpdateNotepadNotes}
                onChangeItems={handleUpdateNotepadItems}
              />
            )}

            {sheet.type === 'agenda' && sheet.agendaData && (
              <AgendaSheet
                data={sheet.agendaData}
                accentColor={accentColor}
                fontFamilyClass=""
                fontSizes={fontSizes}
                onChangeData={handleUpdateAgendaData}
              />
            )}

            {sheet.type === 'list' && sheet.listCategories && (
              <ChecklistSheet
                categories={sheet.listCategories}
                accentColor={accentColor}
                fontFamilyClass=""
                fontSizes={fontSizes}
                onChangeCategories={handleUpdateListCategories}
              />
            )}

            {sheet.type === 'calendar' && sheet.calendarData && (
              <CalendarSheet
                data={sheet.calendarData}
                accentColor={accentColor}
                fontFamilyClass=""
                fontSizes={fontSizes}
                onChangeData={handleUpdateCalendarData}
              />
            )}
          </div>

          {/* Render and interact with overlays active stickers on the sheet */}
          {sheet.stickers.map((st) => {
            const isSelected = activeStickerId === st.id;
            
            return (
              <div
                key={st.id}
                id={`placed-sticker-${st.id}`}
                className={`absolute z-30 select-none group/sticker transition-shadow ${
                  isSelected ? 'ring-2 ring-dashed rounded-lg p-1' : ''
                }`}
                style={{
                  left: `${st.x}%`,
                  top: `${st.y}%`,
                  transform: `translate(-50%, -50%) scale(${st.scale}) rotate(${st.rotation}deg)`,
                  borderColor: isSelected ? accentColor : 'transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStickerId(st.id);
                }}
              >
                {/* Sticker Render Style depending on type */}
                <div
                  onMouseDown={(e) => handleStickerDragStart(e, st.id)}
                  onTouchStart={(e) => handleStickerDragStart(e, st.id)}
                  className="cursor-grab active:cursor-grabbing font-bold select-none p-1.5 flex items-center justify-center pointer-events-auto"
                >
                  {st.type === 'emoji' ? (
                    <span className="text-3xl md:text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] leading-none select-none">
                      {st.content}
                    </span>
                  ) : (
                    // Washi tape / Badge banner shape
                    <div
                      className="px-3.5 py-1 text-[11px] md:text-xs font-bold leading-none text-white tracking-wider rounded-md uppercase shadow-md select-none transform border border-white/20 whitespace-nowrap"
                      style={{
                        backgroundColor: st.color || accentColor,
                        transform: 'skewX(-4deg)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      {st.content}
                    </div>
                  )}
                </div>

                {/* Sticker Interactive control tools (Shown when selected/active) */}
                {isSelected && (
                  <div 
                    className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white border border-gray-200/80 shadow-xl px-2.5 py-1.5 rounded-full flex gap-2 items-center z-45 scale-100 md:scale-110 origin-bottom backdrop-blur-md pointer-events-auto"
                    onClick={(e) => e.stopPropagation()} // prevent deselect
                    onMouseDown={(e) => e.stopPropagation()} // prevent drag trigger or text select
                    onTouchStart={(e) => e.stopPropagation()} // prevent drag trigger or touch gestures
                  >
                    {/* Scale tools */}
                    <button
                      onClick={(e) => handleStickerScale(e, st.id, 'down')}
                      className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:scale-90 flex items-center justify-center font-black text-sm cursor-pointer text-stone-800 transition-all select-none"
                      title="Rimpicciolisci (-) "
                      id={`scale-down-st-${st.id}`}
                    >
                      -
                    </button>
                    <button
                      onClick={(e) => handleStickerScale(e, st.id, 'up')}
                      className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:scale-90 flex items-center justify-center font-black text-sm cursor-pointer text-stone-800 transition-all select-none"
                      title="Ingrandisci (+)"
                      id={`scale-up-st-${st.id}`}
                    >
                      +
                    </button>

                    <span className="w-[1px] h-4 bg-gray-200" />

                    {/* Rotation triggers */}
                    <button
                      onClick={(e) => handleStickerRotate(e, st.id)}
                      className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 active:scale-90 flex items-center justify-center cursor-pointer text-stone-800 transition-all select-none"
                      title="Ruota di 15°"
                      id={`rotate-st-${st.id}`}
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    <span className="w-[1px] h-4 bg-gray-200" />

                    {/* Delete trigger */}
                    <button
                      onClick={(e) => handleStickerDelete(e, st.id)}
                      className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 active:scale-90 flex items-center justify-center text-red-600 font-extrabold cursor-pointer transition-all select-none"
                      title="Stacca Sticker"
                      id={`delete-st-${st.id}`}
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Elegant retro badge mark in bottom-right margin line of printable block */}
          <div className="absolute bottom-5 right-6 text-[8px] md:text-[9px] text-neutral-400 select-none pointer-events-none uppercase font-mono tracking-widest pl-4">
            Custom Desk Planner • Creative Studio
          </div>
        </div>
      </div>
    </div>

    {/* 🧭 Customizable Control Ribbon Sidebar */}
    <div className="w-full xl:w-80 flex flex-col gap-4 flex-shrink-0 relative z-20" id="sheet-controls-panel">
        
        {/* Style and decorations controls panel */}
        <div className="bg-white border border-[#2D241E]/15 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-2 mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#2D241E]/80 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-orange-500" />
              <span>Stile e Decorazione</span>
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Personalizza la carta, i colori e la tipografia di questo foglio.</p>
          </div>

          <div className="space-y-4" id="theme-settings-tab">
            {/* Reset overrides option */}
            <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200 shadow-3xs">
              <span className="text-[11px] font-bold text-stone-600">Personalizzazione Libera</span>
              <button
                type="button"
                onClick={() => {
                  onUpdateSheet({
                    ...sheet,
                    customPaperColor: undefined,
                    customAccentColor: undefined,
                    customFontName: undefined,
                    baseFontSize: 16,
                    font: 'inter',
                    colorTheme: 'lavender'
                  });
                }}
                className="flex items-center gap-1 text-[10px] bg-white border border-stone-300 py-1 px-2.5 rounded-lg text-stone-700 hover:text-stone-950 font-bold hover:bg-stone-100 transition-all select-none cursor-pointer"
                title="Ripristina valori predefiniti"
                id="reset-theme-overrides-btn"
              >
                <RefreshCw className="w-3 h-3 text-stone-500" />
                <span>Reset Completo</span>
              </button>
            </div>

            {/* Wallpaper Pattern select */}
            <div>
              <label className="text-[10px] font-bold text-[#2D241E]/50 block mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                <Grid className="w-4 h-4 text-[#FF6B6B]" />
                <span>Rigatura e Quadretti</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'blank', label: 'Liscio ⚪', desc: 'Senza linee' },
                  { id: 'ruled', label: 'Righe 📑', desc: 'Righe azzurre' },
                  { id: 'grid', label: 'Quadretti 🟦', desc: 'Quadretti grigi' },
                  { id: 'dotted', label: 'Puntini 💬', desc: 'Bento puntinato' }
                ].map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => onUpdateSheet({ ...sheet, bgPattern: pat.id as BackPattern })}
                    className={`text-xs py-2 px-2 rounded-xl text-left border cursor-pointer transition-all ${
                      sheet.bgPattern === pat.id
                        ? 'border-[#2D241E] bg-[#FAF9F6]/80 text-[#2D241E] font-bold ring-2 ring-[#2D241E]/10 shadow-3xs'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                    }`}
                    id={`pattern-select-btn-${pat.id}`}
                  >
                    <div className="font-bold">{pat.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5 leading-tight font-medium">{pat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Classical Theme Presets */}
            <div>
              <label className="text-[10px] font-bold text-[#2D241E]/50 block mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                <Palette className="w-4 h-4 text-[#4ECDC4]" />
                <span>Seleziona Combinazione Base</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((col) => {
                  const isSelected = sheet.colorTheme === col.id || sheet.colorTheme === col.accentTailwind;
                  return (
                    <button
                      key={col.id}
                      onClick={() =>
                        onUpdateSheet({
                          ...sheet,
                          colorTheme: col.id,
                          paperColor: col.lightBgHex,
                          customPaperColor: undefined,
                          customAccentColor: undefined,
                        })
                      }
                      className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer ${
                        isSelected && !sheet.customPaperColor && !sheet.customAccentColor
                          ? 'border-[#2D241E] ring-2 ring-[#FF6B6B]/60 bg-white scale-102 shadow-xs'
                          : 'border-gray-200 bg-white/70 hover:scale-[1.02]'
                      }`}
                      title={col.name}
                      id={`color-preset-btn-${col.id}`}
                    >
                      <div
                        className="w-full flex-1 rounded-md"
                        style={{ backgroundColor: col.lightBgHex, border: `1px solid ${col.accentHex}40` }}
                      />
                      <span className="text-[9px] font-extrabold text-neutral-600 truncate max-w-full leading-none mt-1">
                        {col.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Classical fonts preset */}
            <div>
              <label className="text-[10px] font-bold text-[#2D241E]/50 block mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                <Type className="w-4 h-4 text-[#9B72CF]" />
                <span>Stili Rapidi Preimpostati</span>
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'fredoka', label: 'Fredoka Rinfrescante 🎈', desc: 'Moderno, tondo e gioioso', font: 'font-fredoka' },
                  { id: 'caveat', label: 'Caveat Scrittura a mano ✍️', desc: 'Stile blocknote scritto a penna', font: 'font-caveat' },
                  { id: 'playfair', label: 'Playfair Display Elegante 📖', desc: 'Noblesse e classico per agende', font: 'font-playfair' },
                  { id: 'inter', label: 'Inter Sans Essenziale 📱', desc: 'Minimo, ordinato ed equilibrato', font: 'font-inter' }
                ].map((fontItem) => (
                  <button
                    key={fontItem.id}
                    onClick={() => {
                      onUpdateSheet({ 
                        ...sheet, 
                        font: fontItem.id as FontStyle,
                        customFontName: undefined 
                      });
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border cursor-pointer transition-all ${
                      sheet.font === fontItem.id && !sheet.customFontName
                        ? 'border-[#2D241E] bg-[#FAF9F6]/80 block ring-2 ring-[#2D241E]/10 shadow-3xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    id={`font-preset-btn-${fontItem.id}`}
                  >
                    <div className={`text-sm font-bold text-gray-800 ${fontItem.font}`}>{fontItem.label}</div>
                    <div className="text-[10px] text-gray-400 font-medium leading-normal mt-0.5">{fontItem.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Sizing engine */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-3xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                  <span>Dimensione dei Testi</span>
                </span>
                <span className="text-[10px] bg-orange-50 text-orange-700 font-extrabold px-2 py-0.5 rounded-full border border-orange-100">
                  {baseSize}px
                </span>
              </div>
              <div className="flex gap-3 items-center">
                <button
                  type="button"
                  onClick={() => onUpdateSheet({ ...sheet, baseFontSize: Math.max(10, baseSize - 1) })}
                  className="w-8 h-8 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 font-extrabold text-lg rounded-lg flex items-center justify-center transition-all select-none cursor-pointer active:scale-90"
                  title="Rimpicciolisci font"
                  id="font-size-minus-btn"
                >
                  -
                </button>
                <input 
                  type="range" 
                  min="10" 
                  max="28" 
                  value={baseSize} 
                  onChange={(e) => onUpdateSheet({ ...sheet, baseFontSize: parseInt(e.target.value) })}
                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  id="font-size-slider"
                />
                <button
                  type="button"
                  onClick={() => onUpdateSheet({ ...sheet, baseFontSize: Math.min(28, baseSize + 1) })}
                  className="w-8 h-8 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 font-extrabold text-lg rounded-lg flex items-center justify-center transition-all select-none cursor-pointer active:scale-90"
                  title="Ingrandisci font"
                  id="font-size-plus-btn"
                >
                  +
                </button>
              </div>
            </div>

            {/* Dynamic Google Font Input & Suggested fonts */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-3xs space-y-3">
              <label className="text-[10px] font-bold text-[#2D241E]/50 block flex items-center gap-1.5 uppercase tracking-widest">
                <Type className="w-4 h-4 text-purple-500" />
                <span>Carattere Google Fonts Libero</span>
              </label>
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={sheet.customFontName || ''} 
                  onChange={(e) => onUpdateSheet({ ...sheet, customFontName: e.target.value })}
                  placeholder="Scrivi es. Patrick Hand, Shadows Into Light..."
                  className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 focus:border-[#2D241E] focus:outline-none transition-all placeholder:italic"
                  id="custom-google-font-input"
                />
                <div className="flex flex-wrap gap-1">
                  {[
                    'Patrick Hand',
                    'Shadows Into Light',
                    'Playpen Sans',
                    'Pacifico',
                    'Montserrat',
                    'Cinzel',
                    'Indie Flower',
                    'Architects Daughter',
                    'Dosis',
                    'Fredoka'
                  ].map((gFont) => {
                    const isActive = sheet.customFontName === gFont;
                    return (
                      <button
                        key={gFont}
                        type="button"
                        onClick={() => onUpdateSheet({ ...sheet, customFontName: gFont })}
                        className={`text-[9px] px-2 py-1 rounded-md border font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-purple-600 text-white border-transparent shadow'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                        id={`font-suggest-btn-${gFont.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {gFont}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Advanced Custom Color pickers */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-3xs space-y-3.5">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tavolozza Colori</span>
              </div>

              {/* Sfondo Carta */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">✍️ Sfondo Carta</span>
                  <span className="text-[10px] font-mono text-gray-400 font-bold px-1.5 py-0.5 bg-gray-50 rounded uppercase">
                    {sheet.customPaperColor || getPaperBgHex()}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded-xl border border-gray-300 overflow-hidden flex-shrink-0 cursor-pointer shadow-3xs">
                    <input 
                      type="color" 
                      value={sheet.customPaperColor || getPaperBgHex()} 
                      onChange={(e) => onUpdateSheet({ ...sheet, customPaperColor: e.target.value })} 
                      className="absolute inset-0 w-16 h-16 -m-4 cursor-pointer p-0 border-0"
                      id="custom-paper-color-picker"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={sheet.customPaperColor || ''} 
                    onChange={(e) => onUpdateSheet({ ...sheet, customPaperColor: e.target.value })}
                    placeholder={getPaperBgHex()}
                    className="flex-1 text-xs border border-gray-200 focus:border-stone-400 focus:outline-none rounded-lg p-1.5 font-mono uppercase font-bold"
                    id="custom-paper-color-hex"
                  />
                </div>
              </div>

              {/* Colore di Evidenziazione */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">📌 Dettagli e Borchia</span>
                  <span className="text-[10px] font-mono text-gray-400 font-bold px-1.5 py-0.5 bg-gray-50 rounded uppercase">
                    {sheet.customAccentColor || accentColor}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded-xl border border-gray-300 overflow-hidden flex-shrink-0 cursor-pointer shadow-3xs">
                    <input 
                      type="color" 
                      value={sheet.customAccentColor || accentColor} 
                      onChange={(e) => onUpdateSheet({ ...sheet, customAccentColor: e.target.value })} 
                      className="absolute inset-0 w-16 h-16 -m-4 cursor-pointer p-0 border-0"
                      id="custom-accent-color-picker"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={sheet.customAccentColor || ''} 
                    onChange={(e) => onUpdateSheet({ ...sheet, customAccentColor: e.target.value })}
                    placeholder={accentColor}
                    className="flex-1 text-xs border border-gray-200 focus:border-stone-400 focus:outline-none rounded-lg p-1.5 font-mono uppercase font-bold"
                    id="custom-accent-color-hex"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delete and Share entire sheet option */}
          <div className="mt-6 border-t border-gray-100 pt-4 flex gap-2 flex-col">
            {onShareSheet && (
              <button
                onClick={onShareSheet}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl py-2.5 transition-colors cursor-pointer"
                id="share-sheet-action-btn"
              >
                <Share2 className="w-4 h-4" />
                <span>Esporta come Mini App</span>
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm('Sei sicuro di voler eliminare definitivamente questo planner dal tuo tavolo da lavoro?')) {
                  onDeleteSheet();
                }
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl py-2.5 transition-colors cursor-pointer"
              id="delete-sheet-action-btn"
            >
              <Trash className="w-4 h-4" />
              <span>Elimina questo foglio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
