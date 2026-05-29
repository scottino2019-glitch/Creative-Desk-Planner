/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NotepadItem, FontStyle } from '../types';
import { Plus, Trash2, Check, Pencil, CheckSquare, Square } from 'lucide-react';

interface NotepadSheetProps {
  notesText: string;
  items: NotepadItem[];
  accentColor: string;
  fontFamilyClass: string;
  onChangeNotes: (text: string) => void;
  onChangeItems: (items: NotepadItem[]) => void;
  fontSizes?: {
    title: number;
    subtitle: number;
    label: number;
    value: number;
    item: number;
  };
}

export default function NotepadSheet({
  notesText,
  items,
  accentColor,
  fontFamilyClass,
  onChangeNotes,
  onChangeItems,
  fontSizes,
}: NotepadSheetProps) {
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem: NotepadItem = {
      id: `item_${Date.now()}`,
      text: newItemText.trim(),
      done: false,
    };
    onChangeItems([...items, newItem]);
    setNewItemText('');
  };

  const handleToggleItem = (id: string) => {
    onChangeItems(
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    onChangeItems(items.filter((item) => item.id !== id));
  };

  const handleTextChange = (id: string, newText: string) => {
    onChangeItems(
      items.map((item) => (item.id === id ? { ...item, text: newText } : item))
    );
  };

  return (
    <div className={`space-y-6 ${fontFamilyClass}`}>
      {/* Dynamic Text Notes Area */}
      <div>
        <label 
          className="block text-xs font-semibold tracking-wider uppercase opacity-60 mb-2"
          style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
        >
          📝 Note Libere <span className="no-export opacity-80">(Fai clic per scrivere)</span>
        </label>
        <textarea
          value={notesText}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="Scrivi qui i tuoi pensieri liberi, idee folli o ispirazioni..."
          className="w-full bg-transparent border-none placeholder-gray-400 focus:ring-0 focus:outline-none resize-none leading-relaxed min-h-[180px] cursor-text"
          style={{ 
            fontFamily: 'inherit',
            fontSize: fontSizes ? `${fontSizes.value}px` : undefined,
            lineHeight: '1.6',
          }}
          id="notepad-free-textarea"
        />
      </div>

      {/* Interactive Micro Checklist */}
      <div className="border-t border-dashed border-gray-300/40 pt-4 mt-2">
        <h4 
          className="text-sm font-semibold mb-3 flex items-center gap-2" 
          style={{ 
            color: accentColor,
            fontSize: fontSizes ? `${fontSizes.item}px` : undefined 
          }}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Micro Checklist Integrata</span>
        </h4>

        {/* List of custom items */}
        {items.length === 0 ? (
          <p 
            className="text-sm text-gray-400 italic py-2"
            style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
          >
            La checklist è vuota. Aggiungi il tuo primo punto qui sotto!
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div
                key={item.id}
                id={`notepad-item-${item.id}`}
                className="flex items-center justify-between gap-2 group bg-white/30 hover:bg-white/60 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200/50 transition-all duration-200"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleItem(item.id)}
                    className="focus:outline-none flex-shrink-0 transition-transform active:scale-95 animate-none"
                    id={`toggle-item-${item.id}`}
                  >
                    {item.done ? (
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center transition-colors shadow-xs"
                        style={{ backgroundColor: accentColor, color: 'white' }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-gray-300 hover:border-gray-400 bg-white" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleTextChange(item.id, e.target.value)}
                    className={`bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0 w-full text-sm ${
                      item.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'
                    }`}
                    style={{ 
                      fontFamily: 'inherit',
                      fontSize: fontSizes ? `${fontSizes.item}px` : undefined
                    }}
                    id={`input-item-text-${item.id}`}
                  />
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 rounded-md hover:bg-red-50 transition-all cursor-pointer"
                  title="Elimina punto"
                  id={`delete-item-${item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input form for adding checklist items */}
        <form onSubmit={handleAddItem} className="flex gap-2" id="add-notepad-item-form">
          <input
            type="text"
            placeholder="Aggiungi punto di interesse..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="flex-1 text-sm bg-white/80 border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-stone-200 rounded-lg px-3 py-1.5 outline-none transition-all placeholder:text-gray-400"
            style={{ 
              fontFamily: 'inherit',
              fontSize: fontSizes ? `${fontSizes.item}px` : undefined 
            }}
            id="new-notepad-item-input"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 font-medium text-xs px-3 py-1.5 rounded-lg text-white shadow-sm transition-transform active:scale-95 hover:opacity-95 cursor-pointer"
            style={{ 
              backgroundColor: accentColor,
              fontSize: fontSizes ? `${fontSizes.item}px` : undefined
            }}
            id="new-notepad-item-submit"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi</span>
          </button>
        </form>
      </div>
    </div>
  );
}
