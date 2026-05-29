/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ListCategory, ListItem, FontStyle } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, AlertTriangle, ArrowRightLeft, ChevronsUpDown } from 'lucide-react';

interface ChecklistSheetProps {
  categories: ListCategory[];
  accentColor: string;
  fontFamilyClass: string;
  onChangeCategories: (categories: ListCategory[]) => void;
  fontSizes?: {
    title: number;
    subtitle: number;
    label: number;
    value: number;
    item: number;
  };
}

export default function ChecklistSheet({
  categories,
  accentColor,
  fontFamilyClass,
  onChangeCategories,
  fontSizes,
}: ChecklistSheetProps) {
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newTaskTexts, setNewTaskTexts] = useState<Record<string, string>>({});
  const [newTaskPriorities, setNewTaskPriorities] = useState<Record<string, 'low' | 'medium' | 'high'>>({});

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;
    const colors = ['pink', 'lavender', 'mint', 'yellow', 'sky', 'rose', 'peach'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newCategory: ListCategory = {
      id: `cat_${Date.now()}`,
      title: newCatTitle.trim(),
      color: randomColor,
      items: [],
    };
    onChangeCategories([...categories, newCategory]);
    setNewCatTitle('');
  };

  const handleDeleteCategory = (catId: string) => {
    onChangeCategories(categories.filter((cat) => cat.id !== catId));
  };

  const handleUpdateCategoryTitle = (catId: string, title: string) => {
    onChangeCategories(
      categories.map((cat) => (cat.id === catId ? { ...cat, title } : cat))
    );
  };

  const handleAddTask = (catId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = newTaskTexts[catId] || '';
    if (!text.trim()) return;
    const priority = newTaskPriorities[catId] || 'medium';

    const newTask: ListItem = {
      id: `task_${Date.now()}`,
      text: text.trim(),
      completed: false,
      priority,
    };

    onChangeCategories(
      categories.map((cat) => {
        if (cat.id === catId) {
          return { ...cat, items: [...cat.items, newTask] };
        }
        return cat;
      })
    );

    // reset inputs for this category
    setNewTaskTexts({ ...newTaskTexts, [catId]: '' });
    setNewTaskPriorities({ ...newTaskPriorities, [catId]: 'medium' });
  };

  const handleToggleTask = (catId: string, taskId: string) => {
    onChangeCategories(
      categories.map((cat) => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: cat.items.map((it) =>
              it.id === taskId ? { ...it, completed: !it.completed } : it
            ),
          };
        }
        return cat;
      })
    );
  };

  const handleDeleteTask = (catId: string, taskId: string) => {
    onChangeCategories(
      categories.map((cat) => {
        if (cat.id === catId) {
          return { ...cat, items: cat.items.filter((it) => it.id !== taskId) };
        }
        return cat;
      })
    );
  };

  const handleMoveTaskToOtherCategory = (fromCatId: string, item: ListItem, toCatId: string) => {
    onChangeCategories(
      categories.map((cat) => {
        if (cat.id === fromCatId) {
          return { ...cat, items: cat.items.filter((it) => it.id !== item.id) };
        }
        if (cat.id === toCatId) {
          return { ...cat, items: [...cat.items, item] };
        }
        return cat;
      })
    );
  };

  return (
    <div className={`space-y-6 ${fontFamilyClass}`} id="checklist-sheet-content">
      {/* List Categories Grids */}
      {categories.length === 0 ? (
        <div 
          className="text-center py-6 bg-white/30 rounded-xl border border-dashed border-gray-300"
          style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
        >
          <p className="text-gray-400 italic">Nessuna lista creata. Aggiungine una qui sotto!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="checklist-categories-list">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white/40 border border-gray-200/50 rounded-xl p-4 shadow-3xs flex flex-col justify-between"
              id={`cat-card-${category.id}`}
            >
              {/* Category Header */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-3 border-b border-gray-200/40 pb-2">
                  <input
                    type="text"
                    value={category.title}
                    onChange={(e) => handleUpdateCategoryTitle(category.id, e.target.value)}
                    className="font-bold text-sm bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full text-gray-800"
                    style={{ 
                      fontFamily: 'inherit',
                      fontSize: fontSizes ? `${fontSizes.item}px` : undefined 
                    }}
                    id={`cat-title-input-${category.id}`}
                  />
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 hover:text-red-500 rounded-md hover:bg-red-50/50 transition-colors cursor-pointer text-gray-400"
                    title="Elimina lista"
                    id={`delete-cat-${category.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Checklist Items */}
                <div className="space-y-1.5 mb-4 max-h-[220px] overflow-y-auto pr-1">
                  {category.items.length === 0 ? (
                    <p 
                      className="text-xs text-gray-400 italic py-3 text-center"
                      style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
                    >
                      Nessuna cosa da fare in questa lista.
                    </p>
                  ) : (
                    category.items.map((item) => {
                      // priority badge styles
                      let pStyle = 'bg-sky-100 text-sky-700';
                      let pLabel = 'Bassa';
                      if (item.priority === 'high') {
                        pStyle = 'bg-rose-100 text-rose-700 font-semibold';
                        pLabel = 'Alta';
                      } else if (item.priority === 'medium') {
                        pStyle = 'bg-amber-100 text-amber-700';
                        pLabel = 'Media';
                      }

                      const otherCategories = categories.filter((c) => c.id !== category.id);

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 bg-white/70 hover:bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 shadow-3xs group transition-all duration-200"
                          id={`cat-item-${item.id}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleTask(category.id, item.id)}
                              className="focus:outline-none cursor-pointer text-gray-400 flex-shrink-0 transition-transform active:scale-90"
                              id={`check-task-${item.id}`}
                            >
                              {item.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                              )}
                            </button>
                            <span
                              className={`text-xs ${
                                item.completed ? 'line-through text-gray-400 font-normal' : 'text-gray-700 font-medium'
                              } truncate`}
                              style={{ 
                                fontFamily: 'inherit',
                                fontSize: fontSizes ? `${fontSizes.item}px` : undefined 
                              }}
                            >
                              {item.text}
                            </span>
                          </div>

                          {/* Controls & Badges */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span 
                              className={`text-[9px] px-1.5 py-0.5 rounded-full select-none ${pStyle}`}
                              style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
                            >
                              {pLabel}
                            </span>
                            
                            {/* Fast-move item dropdown */}
                            {otherCategories.length > 0 && (
                              <div className="relative group/move">
                                <button 
                                  className="opacity-0 group-hover:opacity-60 hover:opacity-100 p-0.5 hover:bg-gray-100 rounded text-gray-500 cursor-pointer transition-opacity" 
                                  title="Sposta lista"
                                  id={`move-dropdown-trigger-${item.id}`}
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                                <div className="hidden group-hover/move:block absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-32 text-left">
                                  <div className="text-[10px] px-2 py-0.5 text-gray-400 uppercase font-bold tracking-wider">Sposta in:</div>
                                  {otherCategories.map((other) => (
                                    <button
                                      key={other.id}
                                      onClick={() => handleMoveTaskToOtherCategory(category.id, item, other.id)}
                                      className="w-full text-[11px] px-2.5 py-1 text-gray-600 hover:bg-amber-50 hover:text-amber-800 font-medium text-left truncate block cursor-pointer"
                                      id={`move-item-${item.id}-to-${other.id}`}
                                    >
                                      {other.title}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => handleDeleteTask(category.id, item.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer text-gray-400 transition-opacity"
                              title="Elimina impegno"
                              id={`delete-task-${item.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Add Task bar within Category */}
              <form onSubmit={(e) => handleAddTask(category.id, e)} className="mt-2 space-y-1.5" id={`add-task-form-${category.id}`}>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Nuovo impegno..."
                    value={newTaskTexts[category.id] || ''}
                    onChange={(e) => setNewTaskTexts({ ...newTaskTexts, [category.id]: e.target.value })}
                    className="flex-1 text-xs bg-white/70 border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-stone-200 rounded-lg px-2.5 py-1 outline-none transition-all placeholder:text-gray-400"
                    style={{ 
                      fontFamily: 'inherit',
                      fontSize: fontSizes ? `${fontSizes.item}px` : undefined 
                    }}
                    id={`task-input-${category.id}`}
                  />
                  <select
                    value={newTaskPriorities[category.id] || 'medium'}
                    onChange={(e) => setNewTaskPriorities({ ...newTaskPriorities, [category.id]: e.target.value as any })}
                    className="text-[10px] bg-white border border-gray-200 rounded-lg px-1 py-1 outline-none font-bold text-gray-600 focus:border-gray-300"
                    style={{ fontSize: fontSizes ? `${fontSizes.label}px` : undefined }}
                    id={`task-priority-select-${category.id}`}
                  >
                    <option value="low">Bassa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                  <button
                    type="submit"
                    className="p-1 px-2 text-white rounded-lg flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:opacity-90"
                    style={{ backgroundColor: accentColor }}
                    id={`task-submit-btn-${category.id}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Append New List Card Column Form */}
      <div className="border-t border-dashed border-gray-300/60 pt-4">
        <form onSubmit={handleAddCategory} className="flex gap-2 max-w-sm" id="create-category-col-form">
          <input
            type="text"
            placeholder="Nuova lista..."
            value={newCatTitle}
            onChange={(e) => setNewCatTitle(e.target.value)}
            className="flex-1 text-xs bg-white/80 border border-gray-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 rounded-lg px-3 py-1.5 outline-none transition-all"
            style={{ 
              fontFamily: 'inherit',
              fontSize: fontSizes ? `${fontSizes.item}px` : undefined 
            }}
            id="create-category-input"
          />
          <button
            type="submit"
            className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95"
            style={{ fontSize: fontSizes ? `${fontSizes.item}px` : undefined }}
            id="create-category-submit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuova Lista</span>
          </button>
        </form>
      </div>
    </div>
  );
}
