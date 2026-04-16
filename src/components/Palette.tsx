'use client';

import React, { useState } from 'react';

type PaletteProps = {
  palette: string[];
  activeColor: string;
  onColorSelect: (color: string) => void;
  onPaletteChange: (index: number, color: string) => void;
};

export const Palette: React.FC<PaletteProps> = ({ palette, activeColor, onColorSelect, onPaletteChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setEditingIndex(index);
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    onPaletteChange(index, e.target.value.toUpperCase());
  };

  return (
    <div className="p-3">
      <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-2">Palette</p>
      <div className="grid grid-cols-4 gap-1">
        {palette.map((c, i) => (
          <div key={i} className="relative">
            <button
              title={c}
              onClick={() => onColorSelect(c)}
              onContextMenu={e => handleRightClick(e, i)}
              className={`w-full aspect-square rounded transition-transform hover:scale-110 ${
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
