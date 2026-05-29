/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SheetType = 'blocknote' | 'agenda' | 'list' | 'calendar';

export type FontStyle = 'inter' | 'fredoka' | 'caveat' | 'playfair';

export type BackPattern = 'blank' | 'ruled' | 'grid' | 'dotted';

export interface Sticker {
  id: string;
  type: string; // 'emoji' | 'badge' | 'text'
  content: string; // emoji character or text content
  color?: string; // custom color of badge/text
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  scale: number; // size multiplier (e.g. 1.0)
  rotation: number; // degrees (e.g. 0 to 360)
}

export interface NotepadItem {
  id: string;
  text: string;
  done: boolean;
}

export interface AgendaTimeSlot {
  time: string;
  text: string;
}

export interface AgendaData {
  focusOfTheDay: string;
  slots: AgendaTimeSlot[];
  waterIntake: number; // 0 to 8 icons
  stretchReached: boolean;
  readingReached: boolean;
  exerciseReached: boolean;
  mood: 'happy' | 'chill' | 'motivated' | 'tired' | null;
}

export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface ListCategory {
  id: string;
  title: string;
  color: string;
  items: ListItem[];
}

export interface CalendarEvent {
  day: number;
  text: string;
  color: string; // e.g. '#f43f5e', '#a855f7'
}

export interface CalendarData {
  month: number; // 0-based index
  year: number;
  events: CalendarEvent[]; // list of event entries
  monthlyGoal: string;
}

export interface PlannerSheet {
  id: string;
  type: SheetType;
  title: string;
  subtitle?: string;
  font: FontStyle;
  colorTheme: string; // tailwind color class prefix or specific hex code
  bgPattern: BackPattern;
  paperColor: string; // hex code or bg-class
  stickers: Sticker[];
  createdAt: number;

  // Customizable parameters to address user feedback
  baseFontSize?: number; // base text font size in pixels (e.g., 12 to 24px)
  customPaperColor?: string; // hex string chosen via color picker
  customAccentColor?: string; // hex string chosen via color picker
  customFontName?: string; // name of any google font loaded on-the-fly
  
  // Specific data configurations for each planner type
  notepadContent?: {
    notesText: string;
    items: NotepadItem[];
  };
  agendaData?: AgendaData;
  listCategories?: ListCategory[];
  calendarData?: CalendarData;
}

export interface PresetColor {
  id: string;
  name: string;
  bgClass: string;
  borderClass: string;
  accentHex: string;
  lightBgHex: string;
  accentTailwind: string;
}

export interface StickerPreset {
  id: string;
  type: 'emoji' | 'badge' | 'text';
  content: string;
  label: string;
  defaultColor?: string;
}
