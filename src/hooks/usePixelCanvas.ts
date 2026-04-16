'use client';

import { useCallback, useRef, useState } from 'react';
import type { PixelBuffer } from '@/types';

const MAX_HISTORY = 50;

export function createEmptyBuffer(width: number, height: number): PixelBuffer {
  return new Array(width * height).fill(null);
}

export function usePixelCanvas(width: number, height: number) {
  // bufferRef is the authoritative source — always current
  const bufferRef = useRef<PixelBuffer>(createEmptyBuffer(width, height));
  // version drives re-renders
  const [version, setVersion] = useState(0);
  const forceUpdate = useCallback(() => setVersion(v => v + 1), []);

  // History (refs to avoid stale closures)
  const pastRef = useRef<PixelBuffer[]>([]);
  const futureRef = useRef<PixelBuffer[]>([]);

  // Stroke tracking: save buffer at stroke start for single undo entry
  const preStrokeRef = useRef<PixelBuffer | null>(null);

  const getBuffer = useCallback(() => bufferRef.current, []);

  const getPixelColor = useCallback(
    (x: number, y: number): string | null => {
      if (x < 0 || x >= width || y < 0 || y >= height) return null;
      return bufferRef.current[y * width + x];
    },
    [width, height],
  );

  /** Call before starting a pencil/eraser stroke */
  const beginStroke = useCallback(() => {
    preStrokeRef.current = [...bufferRef.current];
  }, []);

  /** Paint a single pixel without committing to history */
  const paintPixel = useCallback(
    (x: number, y: number, color: string | null) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const next = [...bufferRef.current];
      next[y * width + x] = color;
      bufferRef.current = next;
      forceUpdate();
    },
    [width, height, forceUpdate],
  );

  /** Call on mouse-up to commit stroke as one undo step */
  const endStroke = useCallback(() => {
    if (!preStrokeRef.current) return;
    pastRef.current = [...pastRef.current, preStrokeRef.current].slice(-MAX_HISTORY);
    futureRef.current = [];
    preStrokeRef.current = null;
    // buffer is already up to date; just clear future
    forceUpdate();
  }, [forceUpdate]);

  /** Commit a new buffer directly (for fill, shapes) */
  const commit = useCallback(
    (newBuffer: PixelBuffer) => {
      pastRef.current = [...pastRef.current, [...bufferRef.current]].slice(-MAX_HISTORY);
      futureRef.current = [];
      bufferRef.current = newBuffer;
      forceUpdate();
    },
    [forceUpdate],
  );

  /** Flood fill */
  const floodFill = useCallback(
    (x: number, y: number, fillColor: string) => {
      const buf = bufferRef.current;
      const targetColor = buf[y * width + x];
      if (targetColor === fillColor) return;

      const newBuffer = [...buf];
      const queue: [number, number][] = [[x, y]];
      const visited = new Set<number>();

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
        const i = cy * width + cx;
        if (visited.has(i) || newBuffer[i] !== targetColor) continue;
        visited.add(i);
        newBuffer[i] = fillColor;
        queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }

      commit(newBuffer);
    },
    [width, height, commit],
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const past = [...pastRef.current];
    const prev = past.pop()!;
    futureRef.current = [bufferRef.current, ...futureRef.current].slice(0, MAX_HISTORY);
    pastRef.current = past;
    bufferRef.current = prev;
    forceUpdate();
  }, [forceUpdate]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const [next, ...future] = futureRef.current;
    pastRef.current = [...pastRef.current, bufferRef.current].slice(-MAX_HISTORY);
    futureRef.current = future;
    bufferRef.current = next;
    forceUpdate();
  }, [forceUpdate]);

  /** Reset buffer when canvas size changes */
  const reset = useCallback(
    (w: number, h: number) => {
      bufferRef.current = createEmptyBuffer(w, h);
      pastRef.current = [];
      futureRef.current = [];
      forceUpdate();
    },
    [forceUpdate],
  );

  return {
    buffer: bufferRef.current,
    version,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    getBuffer,
    getPixelColor,
    beginStroke,
    paintPixel,
    endStroke,
    commit,
    floodFill,
    undo,
    redo,
    reset,
  };
}
