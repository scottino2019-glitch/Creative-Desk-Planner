/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CalendarData, CalendarEvent, FontStyle } from '../types';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarCheck, Sparkles } from 'lucide-react';

interface CalendarSheetProps {
  data: CalendarData;
  accentColor: string;
  fontFamilyClass: string;
  onChangeData: (data: CalendarData) => void;
  fontSizes?: {
    title: number;
    subtitle: number;
    label: number;
    value: number;
    item: number;
  };
}

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export default function CalendarSheet({
  data,
  accentColor,
  fontFamilyClass,
  onChangeData,
  fontSizes,
}: CalendarSheetProps) {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [newEventText, setNewEventText] = useState('');
  const [newEventColor, setNewEventColor] = useState('#a855f7'); // default soft purple

  const daysInMonth = new Date(data.year, data.month + 1, 0).getDate();
  
  // Get weekday of the first day of the month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // Converting to Monday-based system where 1=Monday, 2=Tuesday... 7=Sunday
  const getFirstDayOffset = () => {
    const rawOffset = new Date(data.year, data.month, 1).getDay(); // Sunday is 0
    if (rawOffset === 0) return 6; // Sunday is index 6
    return rawOffset - 1; // convert to Lun=0, Mar=1...
  };

  const offset = getFirstDayOffset();

  const handlePrevMonth = () => {
    let nextMonth = data.month - 1;
    let nextYear = data.year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    }
    onChangeData({
      ...data,
      month: nextMonth,
      year: nextYear,
      events: data.events.filter((ev) => false), // Optional: purge or keep. Let's keep, filters are done by day.
    });
  };

  const handleNextMonth = () => {
    let nextMonth = data.month + 1;
    let nextYear = data.year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    onChangeData({
      ...data,
      month: nextMonth,
      year: nextYear,
    });
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventText.trim()) return;

    const newEvent: CalendarEvent = {
      day: selectedDay,
      text: newEventText.trim(),
      color: newEventColor,
    };

    onChangeData({
      ...data,
      events: [...data.events, newEvent],
    });
    setNewEventText('');
  };

  const handleDeleteEvent = (indexToDelete: number) => {
    onChangeData({
      ...data,
      events: data.events.filter((_, idx) => idx !== indexToDelete),
    });
  };

  const handleUpdateMonthlyGoal = (val: string) => {
    onChangeData({
      ...data,
      monthlyGoal: val,
    });
  };

  // Get events for specific day
  const getDayEvents = (day: number) => {
    return data.events.filter((e) => e.day === day);
  };

  return (
    <div className={`space-y-5 ${fontFamilyClass}`} id="calendar-sheet-content">
      {/* 🎯 Obiettivo Mensile Box */}
      <div className="bg-white/45 border border-dashed border-gray-300 rounded-xl p-3 flex gap-2 items-start shadow-3xs">
        <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1">
          <label 
            className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block"
            style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
          >
            🎯 Obiettivo d'Insieme del Mese
          </label>
          <input
            type="text"
            value={data.monthlyGoal}
            onChange={(e) => handleUpdateMonthlyGoal(e.target.value)}
            placeholder="Scrivi qui il tuo traguardo o mantra mensile..."
            className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-xs font-bold text-gray-700 placeholder:text-gray-400 mt-0.5"
            style={{ 
              fontFamily: 'inherit',
              fontSize: fontSizes ? `${fontSizes.item}px` : undefined 
            }}
            id="monthly-goal-input"
          />
        </div>
      </div>

      {/* Calendar Month Header Controller */}
      <div className="flex items-center justify-between px-1" id="calendar-month-controller">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-white/60 bg-white/20 rounded-lg border border-gray-200/40 cursor-pointer shadow-3xs hover:scale-105 transition-transform"
          title="Mese precedente"
          id="prev-month-btn"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="text-center">
          <h3 
            className="font-extrabold text-base tracking-tight capitalize text-gray-800" 
            style={{ fontSize: fontSizes ? `${fontSizes.title}px` : undefined }}
            id="calendar-month-title"
          >
            {MONTHS_IT[data.month]} {data.year}
          </h3>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-white/60 bg-white/20 rounded-lg border border-gray-200/40 cursor-pointer shadow-3xs hover:scale-105 transition-transform"
          title="Mese successivo"
          id="next-month-btn"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Weekdays Names bar */}
      <div className="grid grid-cols-7 text-center gap-1">
        {WEEKDAYS.map((day) => (
          <span 
            key={day} 
            className="text-[10px] font-bold text-gray-400 uppercase select-none"
            style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 bg-white/20 p-1.5 rounded-xl border border-gray-200/20" id="calendar-days-grid">
        {/* Leading empty cells */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square bg-transparent/5 rounded-md" />
        ))}

        {/* Dynamic Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const isSelected = selectedDay === dayNum;
          const dayEvents = getDayEvents(dayNum);
          const hasEvents = dayEvents.length > 0;

          return (
            <button
              key={dayNum}
              onClick={() => setSelectedDay(dayNum)}
              className={`aspect-square relative rounded-lg flex flex-col justify-between p-1.5 text-xs font-bold transition-all duration-200 cursor-pointer border shadow-3xs ${
                isSelected
                  ? 'bg-amber-100 text-amber-900 border-amber-300 scale-102 ring-2 ring-amber-200/50'
                  : 'bg-white/75 hover:bg-white hover:scale-102 text-gray-700 border-gray-100'
              }`}
              style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
              id={`calendar-day-cell-${dayNum}`}
            >
              <span>{dayNum}</span>
              
              {/* Reminder Dots indicator inside cell */}
              {hasEvents && (
                <div className="flex gap-0.5 justify-center items-center w-full mt-0.5 overflow-x-hidden">
                  {dayEvents.slice(0, 3).map((ev, idx) => (
                    <span
                      key={idx}
                      className="w-1.5 h-1.5 rounded-full block border border-white/40 flex-shrink-0"
                      style={{ backgroundColor: ev.color }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[7px] text-gray-400 font-extrabold leading-none">+</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Agenda Drawer Popover (Very cozy sticky look) */}
      <div 
        className="bg-white/40 border border-gray-200/50 rounded-xl p-4 shadow-2xs backdrop-blur-xs flex flex-col justify-between"
        id={`day-agenda-drawer-${selectedDay}`}
      >
        <div className="border-b border-gray-200 pb-2 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4" style={{ color: accentColor }} />
            <span 
              className="text-xs font-bold text-gray-700"
              style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
            >
              Impegni del giorno: {selectedDay} {MONTHS_IT[data.month]}
            </span>
          </div>
          <span 
            className="text-[10px] px-2 py-0.5 bg-white border border-gray-100 text-gray-400 font-bold rounded-full select-none shadow-3xs"
            style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
          >
            {getDayEvents(selectedDay).length} eventi
          </span>
        </div>

        {/* Existing event logs for the day */}
        <div className="space-y-1.5 mb-4 max-h-[120px] overflow-y-auto pr-1">
          {getDayEvents(selectedDay).length === 0 ? (
            <p 
              className="text-xs text-gray-400 italic text-center py-2"
              style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
            >
              La tua agenda è libera per oggi! Aggiungi un impegno qui sotto.
            </p>
          ) : (
            data.events.map((ev, originalIndex) => {
              if (ev.day !== selectedDay) return null;
              return (
                <div
                  key={originalIndex}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white shadow-3xs border border-gray-100"
                  id={`day-event-${originalIndex}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full block border border-white" style={{ backgroundColor: ev.color }} />
                    <span 
                      className="text-xs font-semibold text-gray-700 leading-snug"
                      style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
                    >
                      {ev.text}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(originalIndex)}
                    className="p-1 hover:text-red-500 rounded hover:bg-red-50/50 text-gray-400 transition-colors"
                    title="Rimuovi impegno"
                    id={`delete-event-btn-${originalIndex}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Fast Event Adding field */}
        <form onSubmit={handleAddEvent} className="flex gap-1.5" id={`add-event-form-${selectedDay}`}>
          <input
            type="text"
            placeholder="Es. Scontro alle 15:00, Pilates, Pratica..."
            value={newEventText}
            onChange={(e) => setNewEventText(e.target.value)}
            className="flex-1 text-xs bg-white border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-50 rounded-lg px-2.5 py-1.5 outline-none transition-all placeholder:text-gray-400 font-medium"
            style={{ 
              fontFamily: 'inherit',
              fontSize: fontSizes ? `${fontSizes.item}px` : undefined
            }}
            id="new-event-input"
          />
          
          {/* Pastel highlight color indicators */}
          <div className="flex gap-1 items-center bg-white px-2 border border-gray-200 rounded-lg">
            {['#f43f5e', '#3b82f6', '#10b981', '#a855f7', '#f59e0b'].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setNewEventColor(hex)}
                className={`w-3.5 h-3.5 rounded-full block border transition-transform ${
                  newEventColor === hex ? 'scale-125 border-gray-600 shadow' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: hex }}
                title="Scegli colore highlight"
                id={`event-color-btn-${hex.replace('#', '')}`}
              />
            ))}
          </div>

          <button
            type="submit"
            className="p-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-bold flex items-center justify-center cursor-pointer shadow-3xs transition-transform active:scale-95"
            id="submit-event-btn"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
