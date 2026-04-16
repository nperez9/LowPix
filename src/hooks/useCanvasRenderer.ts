'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { Background, PixelBuffer } from '@/types';

const CHECKER_LIGHT = '#CCCCCC';
const CHECKER_DARK = '#999999';

export function useCanvasRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  buffer: PixelBuffer,
  width: number,
  height: number,
  zoom: number,
  showGrid: boolean,
  background: Background,
  version: number, // dependency to trigger re-render when buffer mutated in place
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = width * zoom;
    const ch = height * zoom;

    ctx.clearRect(0, 0, cw, ch);

    // Background
    if (background === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cw, ch);
    } else {
      // Checkerboard
      const cs = Math.max(2, Math.floor(zoom / 2));
      for (let py = 0; py < ch; py += cs) {
        for (let px = 0; px < cw; px += cs) {
          const even = (Math.floor(px / cs) + Math.floor(py / cs)) % 2 === 0;
          ctx.fillStyle = even ? CHECKER_LIGHT : CHECKER_DARK;
          ctx.fillRect(px, py, cs, cs);
        }
      }
    }

    // Pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = buffer[y * width + x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
      }
    }

    // Grid lines
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, ch);
      }
      for (let y = 0; y <= height; y++) {
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(cw, y * zoom);
      }
      ctx.stroke();
    }
  }, [canvasRef, buffer, width, height, zoom, showGrid, background, version]);
}
