'use client';

import React, { useState } from 'react';
import { PALETTE_PRESETS } from '@/config/palettes';

type PaletteProps = {
  palette: string[];
  activeColor: string;
  onColorSelect: (color: string) => void;
  onPaletteChange: (index: number, color: string) => void;
  onPresetSelect: (colors: string[]) => void;
};

export const Palette: React.FC<PaletteProps> = ({
  palette,
  activeColor,
  onColorSelect,
  onPaletteChange,
  onPresetSelect,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setEditingIndex(index);
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    onPaletteChange(index, e.target.value.toUpperCase());
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PALETTE_PRESETS.find(p => p.id === e.target.value);
    if (preset) onPresetSelect([...preset.colors]);
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Palette</p>
        <select
          onChange={handlePresetChange}
          defaultValue="NES"
          className="bg-neutral-800 text-neutral-300 text-xs rounded px-1.5 py-0.5 border border-neutral-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {PALETTE_PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {palette.map((c, i) => (
          <div key={i} className="relative">
            <button
              title={c}
              onClick={() => onColorSelect(c)}
              onContextMenu={e => handleRightClick(e, i)}
              className={`w-full aspect-square rounded-sm transition-transform hover:scale-110 ${
                activeColor.toUpperCase() === c.toUpperCase()
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900'
                  : ''
              }`}
              style={{ backgroundColor: c }}
            />
            {editingIndex === i && (
              <input
                type="color"
                defaultValue={c}
                autoFocus
                onChange={e => handleNativeChange(e, i)}
                onBlur={() => setEditingIndex(null)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
