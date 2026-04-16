'use client';

import React from 'react';
import type { Tool } from '@/types';

type ToolbarProps = {
  tool: Tool;
  fillShape: boolean;
  showGrid: boolean;
  onToolChange: (t: Tool) => void;
  onFillShapeToggle: () => void;
  onGridToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

type ToolDef = { id: Tool; label: string; shortcut: string; icon: string };

const TOOLS: ToolDef[] = [
  { id: 'pencil', label: 'Pencil', shortcut: 'P', icon: '✏️' },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: '◻' },
  { id: 'fill', label: 'Fill', shortcut: 'F', icon: '🪣' },
  { id: 'eyedropper', label: 'Eyedropper', shortcut: 'I', icon: '💉' },
  { id: 'line', label: 'Line', shortcut: 'L', icon: '╱' },
  { id: 'rect', label: 'Rectangle', shortcut: 'R', icon: '▭' },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: '◯' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  tool, fillShape, showGrid,
  onToolChange, onFillShapeToggle, onGridToggle,
  onUndo, onRedo, canUndo, canRedo,
}) => {
  const shapeTools = new Set<Tool>(['line', 'rect', 'ellipse']);

  return (
    <aside className="flex flex-col items-center gap-1 bg-neutral-900 border-r border-neutral-800 px-2 py-3 w-14 shrink-0">
      {TOOLS.map(t => (
        <button
          key={t.id}
          title={`${t.label} (${t.shortcut})`}
          onClick={() => onToolChange(t.id)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
            tool === t.id
              ? 'bg-indigo-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          {t.icon}
        </button>
      ))}

      <div className="w-8 border-t border-neutral-700 my-1" />

      {/* Fill/stroke toggle for shape tools */}
      {shapeTools.has(tool) && (
        <button
          title={fillShape ? 'Filled (click to stroke)' : 'Stroke (click to fill)'}
          onClick={onFillShapeToggle}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          {fillShape ? '▪' : '▫'}
        </button>
      )}

      {/* Grid toggle */}
      <button
        title="Toggle Grid (G)"
        onClick={onGridToggle}
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm transition-colors ${
          showGrid
            ? 'text-indigo-400 hover:bg-neutral-800'
            : 'text-neutral-600 hover:text-white hover:bg-neutral-800'
        }`}
      >
        ⊞
      </button>

      <div className="flex-1" />

      {/* Undo / Redo */}
      <button
        title="Undo (Ctrl+Z)"
        onClick={onUndo}
        disabled={!canUndo}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ↩
      </button>
      <button
        title="Redo (Ctrl+Y)"
        onClick={onRedo}
        disabled={!canRedo}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ↪
      </button>
    </aside>
  );
};
