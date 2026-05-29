/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AgendaData, FontStyle } from '../types';
import { Smile, Sun, Trophy, Trash, Plus, Check } from 'lucide-react';

interface AgendaSheetProps {
  data: AgendaData;
  accentColor: string;
  fontFamilyClass: string;
  onChangeData: (data: AgendaData) => void;
  fontSizes?: {
    title: number;
    subtitle: number;
    label: number;
    value: number;
    item: number;
  };
}

export default function AgendaSheet({
  data,
  accentColor,
  fontFamilyClass,
  onChangeData,
  fontSizes,
}: AgendaSheetProps) {
  
  const handleUpdateFocus = (text: string) => {
    onChangeData({ ...data, focusOfTheDay: text });
  };

  const handleUpdateSlot = (index: number, text: string) => {
    const updatedSlots = [...data.slots];
    updatedSlots[index] = { ...updatedSlots[index], text };
    onChangeData({ ...data, slots: updatedSlots });
  };

  const handleWaterClick = (index: number) => {
    // If user clicks slot 3, setting intake to 3 (which is index + 1)
    // If user clicks current value, toggle down by one
    const newVal = index + 1 === data.waterIntake ? index : index + 1;
    onChangeData({ ...data, waterIntake: newVal });
  };

  const toggleRoutine = (key: 'stretchReached' | 'readingReached' | 'exerciseReached') => {
    onChangeData({ ...data, [key]: !data[key] });
  };

  const handleSelectMood = (mood: 'happy' | 'chill' | 'motivated' | 'tired') => {
    onChangeData({ ...data, mood: data.mood === mood ? null : mood });
  };

  return (
    <div className={`space-y-6 ${fontFamilyClass}`} id="agenda-sheet-content">
      {/* 🌟 Focus block */}
      <div className="bg-white/40 border border-gray-200/50 rounded-xl p-3 shadow-2xs backdrop-blur-xs">
        <label 
          className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70 flex items-center gap-1.5" 
          style={{ 
            color: accentColor,
            fontSize: fontSizes ? `${fontSizes.label}px` : undefined 
          }}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>🎯 Focus della Giornata</span>
        </label>
        <textarea
          value={data.focusOfTheDay}
          onChange={(e) => handleUpdateFocus(e.target.value)}
          placeholder="Missione di oggi..."
          className="w-full bg-transparent border-none placeholder-gray-400 focus:ring-0 focus:outline-none text-sm font-semibold resize-none h-[48px] py-1 leading-snug cursor-text"
          style={{ 
            fontFamily: 'inherit',
            fontSize: fontSizes ? `${fontSizes.value}px` : undefined
          }}
          id="agenda-focus-textarea"
        />
      </div>

      {/* Hourly Schedule Slots */}
      <div className="space-y-2">
        <label 
          className="block text-xs font-semibold tracking-wider uppercase opacity-60 mb-1.5 flex items-center gap-1"
          style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>⏱️ Tabella di Marcia (Ogni Ora)</span>
        </label>
        <div className="space-y-1.5 bg-white/20 p-2.5 rounded-xl border border-gray-200/30">
          {data.slots.map((slot, index) => (
            <div 
              key={slot.time} 
              className="flex items-center gap-2 border-b border-gray-200/40 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0"
              id={`agenda-slot-row-${index}`}
            >
              <span 
                className="text-xs font-bold text-gray-500 w-12 text-center bg-white/60 py-0.5 rounded-sm border border-gray-200/40 shadow-3xs select-none"
                style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
              >
                {slot.time}
              </span>
              <input
                type="text"
                value={slot.text}
                onChange={(e) => handleUpdateSlot(index, e.target.value)}
                placeholder="Nessun impegno segnato... clicca per aggiungere"
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-sm placeholder:text-gray-400 text-gray-700 font-medium"
                style={{ 
                  fontFamily: 'inherit',
                  fontSize: fontSizes ? `${fontSizes.value}px` : undefined
                }}
                id={`agenda-slot-input-${index}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Grid of habits and items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed border-gray-300/60 pt-4">
        {/* Routines / Habit trackers */}
        <div className="space-y-2">
          <label 
            className="block text-xs font-bold tracking-wider uppercase opacity-60"
            style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
          >
            🌿 Abitudini del Giorno
          </label>
          <div className="space-y-2 bg-white/40 p-3 rounded-xl border border-gray-200/50 shadow-3xs">
            <button
              onClick={() => toggleRoutine('stretchReached')}
              className="w-full flex items-center justify-between text-left text-xs font-semibold p-1.5 rounded-lg hover:bg-white/60 transition-colors"
              style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
              id="routine-stretch-btn"
            >
              <span>🧘 Stretching / Yoga</span>
              <div 
                className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors shadow-3xs"
                style={{ 
                  backgroundColor: data.stretchReached ? accentColor : 'transparent',
                  borderColor: data.stretchReached ? accentColor : '#cbd5e1',
                  color: data.stretchReached ? 'white' : 'transparent' 
                }}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </button>
            <button
              onClick={() => toggleRoutine('readingReached')}
              className="w-full flex items-center justify-between text-left text-xs font-semibold p-1.5 rounded-lg hover:bg-white/60 transition-colors"
              style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
              id="routine-reading-btn"
            >
              <span>📚 Lettura (15+ min)</span>
              <div 
                className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors shadow-3xs"
                style={{ 
                  backgroundColor: data.readingReached ? accentColor : 'transparent',
                  borderColor: data.readingReached ? accentColor : '#cbd5e1',
                  color: data.readingReached ? 'white' : 'transparent' 
                }}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </button>
            <button
              onClick={() => toggleRoutine('exerciseReached')}
              className="w-full flex items-center justify-between text-left text-xs font-semibold p-1.5 rounded-lg hover:bg-white/60 transition-colors"
              style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
              id="routine-workout-btn"
            >
              <span>🏋️‍♂️ Allenamento / Gym</span>
              <div 
                className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors shadow-3xs"
                style={{ 
                  backgroundColor: data.exerciseReached ? accentColor : 'transparent',
                  borderColor: data.exerciseReached ? accentColor : '#cbd5e1',
                  color: data.exerciseReached ? 'white' : 'transparent' 
                }}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>

        {/* Water tracker */}
        <div className="space-y-2">
          <label 
            className="block text-xs font-bold tracking-wider uppercase opacity-60"
            style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
          >
            💧 Idratazione (Bicchieri d'Acqua)
          </label>
          <div className="bg-white/40 p-3 rounded-xl border border-gray-200/50 shadow-3xs flex flex-col justify-between h-[106px]">
            <div className="flex justify-between items-center px-1">
              <span 
                className="text-[10px] font-bold text-gray-500"
                style={{ fontSize: fontSizes ? `${Math.round(fontSizes.label * 1.1)}px` : undefined }}
              >
                Obiettivo: 8 bicchieri
              </span>
              <span 
                className="text-xs font-bold" 
                style={{ 
                  color: accentColor,
                  fontSize: fontSizes ? `${fontSizes.item}px` : undefined 
                }}
              >
                {data.waterIntake} / 8
              </span>
            </div>
            <div className="flex gap-1.5 justify-between">
              {Array.from({ length: 8 }).map((_, i) => {
                const filled = i < data.waterIntake;
                return (
                  <button
                    key={i}
                    onClick={() => handleWaterClick(i)}
                    className="group focus:outline-none select-none transition-transform active:scale-90"
                    title={`Bicchiere ${i + 1}`}
                    id={`water-glass-btn-${i}`}
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      className={`w-6 h-6 transition-all duration-300 ${
                        filled 
                          ? 'fill-blue-500 stroke-blue-600 drop-shadow-xs scale-105' 
                          : 'fill-transparent stroke-gray-400 hover:stroke-blue-400 hover:scale-105'
                      }`}
                      style={{ 
                        strokeWidth: '1.5px',
                        fill: filled ? '#1d4ed8' : 'none'
                      }}
                    >
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mood Pins bottom line */}
      <div className="border-t border-dashed border-gray-300/60 pt-4">
        <label 
          className="block text-xs font-bold tracking-wider uppercase opacity-60 mb-2.5"
          style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
        >
          🎭 Umore della Giornata
        </label>
        <div className="flex gap-2 flex-wrap justify-between" id="agenda-mood-bar">
          {(['happy', 'chill', 'motivated', 'tired'] as const).map((mObj) => {
            const isSelected = data.mood === mObj;
            let emoji = '😊';
            let label = 'Felice';
            let activeColor = 'bg-green-500 text-white shadow-green-200';
            let inactiveHover = 'hover:bg-green-50 text-green-700 border-green-200';
            
            if (mObj === 'chill') {
              emoji = '😎';
              label = 'Rilassato';
              activeColor = 'bg-cyan-500 text-white shadow-cyan-200';
              inactiveHover = 'hover:bg-cyan-50 text-cyan-700 border-cyan-200';
            } else if (mObj === 'motivated') {
              emoji = '🔥';
              label = 'Carico';
              activeColor = 'bg-amber-500 text-white shadow-amber-200';
              inactiveHover = 'hover:bg-amber-50 text-amber-700 border-amber-200';
            } else if (mObj === 'tired') {
              emoji = '🥱';
              label = 'Stanco';
              activeColor = 'bg-indigo-500 text-white shadow-indigo-200';
              inactiveHover = 'hover:bg-indigo-50 text-indigo-700 border-indigo-200';
            }

            return (
              <button
                key={mObj}
                onClick={() => handleSelectMood(mObj)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 cursor-pointer shadow-3xs ${
                  isSelected 
                    ? `${activeColor} scale-105 border-transparent shadow` 
                    : `bg-white/80 text-gray-600 border-gray-200 ${inactiveHover}`
                }`}
                style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
                id={`mood-btn-${mObj}`}
              >
                <span className="text-sm">{emoji}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
