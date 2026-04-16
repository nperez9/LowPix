'use client';

import React, { useEffect, useRef, useState } from 'react';

type ColorPickerProps = {
  color: string;
  onChange: (color: string) => void;
};

function normalizeHex(hex: string): string | null {
  const clean = hex.replace('#', '').toUpperCase();
  if (/^[0-9A-F]{6}$/.test(clean)) return `#${clean}`;
  if (/^[0-9A-F]{3}$/.test(clean)) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`;
  }
  return null;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [hexInput, setHexInput] = useState(color.slice(1));
  const nativeRef = useRef<HTMLInputElement>(null);

  // Sync hex input when color prop changes
  useEffect(() => {
    setHexInput(color.slice(1).toUpperCase());
  }, [color]);

  const handleHexCommit = () => {
    const normalized = normalizeHex(hexInput);
    if (normalized) {
      onChange(normalized);
    } else {
      setHexInput(color.slice(1).toUpperCase());
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.toUpperCase());
  };

  return (
    <div className="p-3 border-b border-neutral-800">
      <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-2">Color</p>

      {/* Swatch + native picker trigger */}
      <div className="flex gap-2 items-center mb-3">
        <button
          title="Open color picker"
          className="w-10 h-10 rounded-lg border-2 border-neutral-700 shrink-0 shadow-inner"
          style={{ backgroundColor: color }}
          onClick={() => nativeRef.current?.click()}
        />
        <input
          ref={nativeRef}
          type="color"
          value={color}
          onChange={handleNativeChange}
          className="sr-only"
          tabIndex={-1}
        />
        <div className="flex-1">
          <div className="flex items-center bg-neutral-800 rounded-lg px-2 h-10 gap-1">
            <span className="text-neutral-500 text-sm">#</span>
            <input
              id="hex-input"
              type="text"
              maxLength={6}
              value={hexInput}
              onChange={e => setHexInput(e.target.value.toUpperCase())}
              onBlur={handleHexCommit}
              onKeyDown={e => { if (e.key === 'Enter') handleHexCommit(); }}
              className="bg-transparent text-white text-sm font-mono focus:outline-none min-w-0 w-full"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
