'use client';

import React, { useState } from 'react';

type CanvasSizeDialogProps = {
  onConfirm: (width: number, height: number) => void;
};

const PRESETS = [
  { label: '8 × 8', w: 8, h: 8 },
  { label: '16 × 16', w: 16, h: 16 },
  { label: '32 × 32', w: 32, h: 32 },
  { label: '64 × 64', w: 64, h: 64 },
  { label: '128 × 128', w: 128, h: 128 },
];

export const CanvasSizeDialog: React.FC<CanvasSizeDialogProps> = ({ onConfirm }) => {
  const [selected, setSelected] = useState<number | null>(1); // index into PRESETS
  const [customW, setCustomW] = useState('64');
  const [customH, setCustomH] = useState('64');

  const isCustom = selected === null;

  const handleConfirm = () => {
    if (isCustom) {
      const w = Math.min(128, Math.max(1, parseInt(customW) || 64));
      const h = Math.min(128, Math.max(1, parseInt(customH) || 64));
      onConfirm(w, h);
    } else {
      const p = PRESETS[selected!];
      onConfirm(p.w, p.h);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-8 w-80 shadow-2xl">
        <h2 className="text-white text-lg font-semibold mb-1">New Canvas</h2>
        <p className="text-neutral-400 text-sm mb-6">Choose a canvas size to get started</p>

        <div className="grid grid-cols-1 gap-2 mb-4">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setSelected(i)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                selected === i
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {p.label}
            </button>
          ))}

          <button
            onClick={() => setSelected(null)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
              isCustom
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            Custom
          </button>
        </div>

        {isCustom && (
          <div className="flex gap-3 mb-4">
            <label className="flex-1">
              <span className="text-neutral-400 text-xs block mb-1">Width</span>
              <input
                type="number"
                min={1}
                max={128}
                value={customW}
                onChange={e => setCustomW(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </label>
            <label className="flex-1">
              <span className="text-neutral-400 text-xs block mb-1">Height</span>
              <input
                type="number"
                min={1}
                max={128}
                value={customH}
                onChange={e => setCustomH(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </label>
          </div>
        )}

        <button
          onClick={handleConfirm}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Create Canvas
        </button>
      </div>
    </div>
  );
};
