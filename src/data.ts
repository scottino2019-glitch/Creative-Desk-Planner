/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlannerSheet, PresetColor, StickerPreset } from './types';

export const COLORS: PresetColor[] = [
  {
    id: 'lavender',
    name: 'Lavanda Soft',
    bgClass: 'bg-[#E2D4F0]/90 hover:bg-[#D4C0E8]/90',
    borderClass: 'border-[#B39CD0]',
    accentHex: '#9B72CF',
    lightBgHex: '#F6F2FC',
    accentTailwind: 'purple'
  },
  {
    id: 'pink',
    name: 'Rose Water',
    bgClass: 'bg-[#FEE3EC]/90 hover:bg-[#FDC8D9]/90',
    borderClass: 'border-[#F8BBD0]',
    accentHex: '#E07A5F',
    lightBgHex: '#FFF5F7',
    accentTailwind: 'pink'
  },
  {
    id: 'mint',
    name: 'Soft Sage green',
    bgClass: 'bg-[#E8F5E9]/90 hover:bg-[#C8E6C9]/90',
    borderClass: 'border-[#A3D9A5]',
    accentHex: '#588157',
    lightBgHex: '#F4FAF4',
    accentTailwind: 'emerald'
  },
  {
    id: 'yellow',
    name: 'Calda Vanilla',
    bgClass: 'bg-[#FFFDE7]/90 hover:bg-[#FFF9C4]/90',
    borderClass: 'border-[#FFE082]',
    accentHex: '#D4A373',
    lightBgHex: '#FFFDF0',
    accentTailwind: 'amber'
  },
  {
    id: 'sky',
    name: 'Onda Turchese',
    bgClass: 'bg-[#E0F7FA]/90 hover:bg-[#B2EBF2]/90',
    borderClass: 'border-[#4ECDC4]',
    accentHex: '#2A9D8F',
    lightBgHex: '#F2FCFE',
    accentTailwind: 'sky'
  },
  {
    id: 'peach',
    name: 'Pescato Caldo',
    bgClass: 'bg-[#FFE0B2]/90 hover:bg-[#FFCC80]/90',
    borderClass: 'border-[#FCA311]',
    accentHex: '#E76F51',
    lightBgHex: '#FFF8F0',
    accentTailwind: 'orange'
  },
  {
    id: 'rose',
    name: 'Sunset Coral',
    bgClass: 'bg-[#FFEBEE]/90 hover:bg-[#FFCDD2]/90',
    borderClass: 'border-[#FF6B6B]',
    accentHex: '#FF6B6B',
    lightBgHex: '#FFF5F5',
    accentTailwind: 'rose'
  },
  {
    id: 'vintage',
    name: 'Quercia Carbone',
    bgClass: 'bg-[#F4F1ED]/90 hover:bg-[#EAE5E0]/90',
    borderClass: 'border-[#2D241E]/30',
    accentHex: '#2D241E',
    lightBgHex: '#FAF9F6',
    accentTailwind: 'stone'
  }
];

export const STICKER_PRESETS: StickerPreset[] = [
  // Emojis Cute
  { id: 'st_star', type: 'emoji', content: '⭐', label: 'Stella' },
  { id: 'st_heart', type: 'emoji', content: '❤️', label: 'Cuore' },
  { id: 'st_idea', type: 'emoji', content: '💡', label: 'Idea' },
  { id: 'st_coffee', type: 'emoji', content: '☕', label: 'Caffè' },
  { id: 'st_plant', type: 'emoji', content: '🌿', label: 'Foglia' },
  { id: 'st_bell', type: 'emoji', content: '🚨', label: 'Urgente' },
  { id: 'st_gym', type: 'emoji', content: '🏋️', label: 'Gym' },
  { id: 'st_party', type: 'emoji', content: '🥳', label: 'Festa' },
  { id: 'st_cart', type: 'emoji', content: '🛒', label: 'Spesa' },
  { id: 'st_pizza', type: 'emoji', content: '🍕', label: 'Cibo' },
  { id: 'st_target', type: 'emoji', content: '🎯', label: 'Obiettivo' },
  { id: 'st_palette', type: 'emoji', content: '🎨', label: 'Arte' },
  { id: 'st_sun', type: 'emoji', content: '☀️', label: 'Sole' },
  { id: 'st_sparkles', type: 'emoji', content: '✨', label: 'Magia' },
  { id: 'st_books', type: 'emoji', content: '📚', label: 'Studio' },
  { id: 'st_flight', type: 'emoji', content: '✈️', label: 'Viaggi' },

  // Badges Washi Tapes & Labels
  { id: 'st_b_todo', type: 'badge', content: 'DA FARE', label: 'Da Fare', defaultColor: '#f59e0b' },
  { id: 'st_b_done', type: 'badge', content: 'COMPLETATO ✅', label: 'Completato', defaultColor: '#10b981' },
  { id: 'st_b_urnget', type: 'badge', content: 'URGENTE 🚨', label: 'Urgente', defaultColor: '#ef4444' },
  { id: 'st_b_memo', type: 'badge', content: 'PROMEMORIA', label: 'Promemoria', defaultColor: '#3b82f6' },
  { id: 'st_b_focus', type: 'badge', content: 'CONCENTRAZIONE', label: 'Focus', defaultColor: '#8b5cf6' },
  { id: 'st_b_relax', type: 'badge', content: 'TEMPO LIBERO 🍹', label: 'Relax', defaultColor: '#06b6d4' },
  { id: 'st_b_weekend', type: 'badge', content: 'FINE SETTIMANA', label: 'Weekend', defaultColor: '#ec4899' },
  { id: 'st_b_important', type: 'badge', content: 'IMPORTANTE ⭐', label: 'Importante', defaultColor: '#f97316' }
];

export const INITIAL_PLANNER_SHEETS: PlannerSheet[] = [
  {
    id: 'sheet_agenda',
    type: 'agenda',
    title: 'Giornata Produttiva ☀️',
    subtitle: 'La mia agenda strategica giornaliera',
    font: 'fredoka',
    colorTheme: 'lavender',
    bgPattern: 'ruled',
    paperColor: '#faf5ff',
    stickers: [
      { id: 's1', type: 'badge', content: 'CONCENTRAZIONE', color: '#8b5cf6', x: 74, y: 3, scale: 1.1, rotation: -4 },
      { id: 's2', type: 'emoji', content: '☕', x: 2, y: 38, scale: 1.3, rotation: 12 },
      { id: 's3', type: 'emoji', content: '✨', x: 88, y: 32, scale: 1.0, rotation: 5 }
    ],
    createdAt: Date.now() - 100000,
    agendaData: {
      focusOfTheDay: 'Completare il piano di design dell\'app e fare esercizio!',
      slots: [
        { time: '08:00', text: 'Meditazione ed espresso aromatizzato' },
        { time: '09:00', text: 'Allineamento team e revisione prototipi' },
        { time: '11:00', text: 'Stesura codice frontend ed export pdf' },
        { time: '13:00', text: 'Pausa pranzo salutare' },
        { time: '15:00', text: 'Inserimento stickers e logiche interattive' },
        { time: '17:00', text: 'Allenamento a corpo libero o corsa lenta' },
        { time: '19:00', text: 'Cena rinfrescante e lettura' }
      ],
      waterIntake: 5,
      stretchReached: true,
      readingReached: true,
      exerciseReached: true,
      mood: 'motivated'
    }
  },
  {
    id: 'sheet_list',
    type: 'list',
    title: 'Cose Da Fare 📝',
    subtitle: 'La mia lista organizzata con priorità',
    font: 'caveat',
    colorTheme: 'pink',
    bgPattern: 'grid',
    paperColor: '#fdf2f8',
    stickers: [
      { id: 's20', type: 'badge', content: 'DA FARE', color: '#ec4899', x: 76, y: 7, scale: 1.2, rotation: 6 },
      { id: 's21', type: 'emoji', content: '🌿', x: 86, y: 22, scale: 1.4, rotation: -15 }
    ],
    createdAt: Date.now() - 50000,
    listCategories: [
      {
        id: 'cat_work',
        title: '💼 Lavoro & Progetti',
        color: 'pink',
        items: [
          { id: 't1', text: 'Implementare esportazione PDF con jsPDF', completed: true, priority: 'high' },
          { id: 't2', text: 'Aggiungere stickers ruotabili e ridimensionabili', completed: false, priority: 'high' },
          { id: 't3', text: 'Creare tavolozza di colori super sfiziosa', completed: true, priority: 'medium' }
        ]
      },
      {
        id: 'cat_personal',
        title: '🌱 Vita Personale',
        color: 'lavender',
        items: [
          { id: 't4', text: 'Comprare piante grasse per la scrivania', completed: false, priority: 'low' },
          { id: 't5', text: 'Bere almeno 2.5 Litri di acqua fresca', completed: true, priority: 'high' },
          { id: 't6', text: 'Compilare l\'agenda di domani sera', completed: false, priority: 'medium' }
        ]
      }
    ]
  },
  {
    id: 'sheet_notes',
    type: 'blocknote',
    title: 'Ghiribizzi & Idee ✨',
    subtitle: 'Spazio libero per pensieri, poesie e progetti',
    font: 'caveat',
    colorTheme: 'yellow',
    bgPattern: 'ruled',
    paperColor: '#fffbeb',
    stickers: [
      { id: 's30', type: 'emoji', content: '💡', x: 80, y: 4, scale: 1.5, rotation: 10 },
      { id: 's31', type: 'badge', content: 'RELAX 🍹', color: '#06b6d4', x: 5, y: 92, scale: 1.1, rotation: -8 }
    ],
    createdAt: Date.now() - 30000,
    notepadContent: {
      notesText: `Benvenuto nella tua Scrivania Planner! 📒🎨

Questo è il tuo blocknote interattivo. Puoi cliccare in qualsiasi punto qui sotto per scrivere a mano libera, oppure puoi personalizzare il foglio usando i selettori sopra:
- Scegli lo stile della carta (righe, quadretti, puntini o liscia).
- Cambia il font (Fredoka tondo e carino, Caveat stile scrittura a mano, o Playfair elegante).
- Trascina i tuoi sticker preferiti presi dal cassetto di sinistra e posizionali ovunque! Puoi ruotarli, rimpiccolirli o ingrandirli per dare sfogo alla tua fantasia.

Buona pianificazione! ✨☕🌱`,
      items: [
        { id: 'n1', text: 'Innaffiare le orchidee', done: true },
        { id: 'n2', text: 'Ascoltare un nuovo album lofi cozy', done: false },
        { id: 'n3', text: 'Configurare la griglia del calendario mensile', done: true }
      ]
    }
  },
  {
    id: 'sheet_calendar',
    type: 'calendar',
    title: 'Agenda Mensile 📅',
    subtitle: 'Vista d\'insieme dei miei impegni principali',
    font: 'playfair',
    colorTheme: 'sky',
    bgPattern: 'dotted',
    paperColor: '#f0f9ff',
    stickers: [
      { id: 's40', type: 'badge', content: 'PROMEMORIA', color: '#3b82f6', x: 1, y: 2, scale: 1.1, rotation: -5 },
      { id: 's41', type: 'emoji', content: '🎯', x: 85, y: 5, scale: 1.3, rotation: 12 }
    ],
    createdAt: Date.now(),
    calendarData: {
      month: 4, // May
      year: 2026,
      monthlyGoal: 'Dedicare almeno un\'ora al giorno alla creatività artistica 🎨',
      events: [
        { day: 5, text: '🎉 Compleanno della nonna!', color: '#f43f5e' },
        { day: 15, text: '🚀 Lancio app Creative Desk!', color: '#a855f7' },
        { day: 22, text: '🍿 Serata Cinema e pizza', color: '#f59e0b' },
        { day: 29, text: '⭐ Oggi: Verifica e deploy', color: '#10b981' }
      ]
    }
  }
];
