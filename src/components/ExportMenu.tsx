'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { PixelBuffer } from '@/types';

type ExportMenuProps = {
  buffer: PixelBuffer;
  width: number;
  height: number;
};

const SCALES = [
  { label: '1× (native)', scale: 1 },
  { label: '2×', scale: 2 },
  { label: '4×', scale: 4 },
  { label: '8×', scale: 8 },
  { label: '16×', scale: 16 },
];

function exportPNG(buffer: PixelBuffer, width: number, height: number, scale: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = buffer[y * width + x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  const link = document.createElement('a');
  link.download = `pixel-art-${width}x${height}@${scale}x.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ buffer, width, height }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Export
        <span className="text-xs opacity-70">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden min-w-44 z-40">
          <p className="text-neutral-500 text-xs px-3 pt-3 pb-1 font-medium uppercase tracking-wider">
            Export as PNG
          </p>
          {SCALES.map(({ label, scale }) => (
            <button
              key={scale}
              onClick={() => {
                exportPNG(buffer, width, height, scale);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              {label}
              <span className="text-neutral-500 text-xs ml-2">
                {width * scale}×{height * scale}px
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
