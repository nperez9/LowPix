'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { getEllipsePixels, getLinePixels, getRectPixels, renderPreviewPixels } from '@/lib/drawing';
import { useCanvasRenderer } from '@/hooks/useCanvasRenderer';
import type { Background, PixelBuffer, Tool } from '@/types';

type CanvasProps = {
  buffer: PixelBuffer;
  version: number;
  width: number;
  height: number;
  zoom: number;
  tool: Tool;
  color: string;
  showGrid: boolean;
  fillShape: boolean;
  background: Background;
  onBeginStroke: () => void;
  onPaintPixel: (x: number, y: number, color: string | null) => void;
  onEndStroke: () => void;
  onFloodFill: (x: number, y: number, color: string) => void;
  onCommitPixels: (pixels: [number, number][], color: string | null) => void;
  onColorPick: (color: string | null) => void;
  onZoom: (direction: 1 | -1, originX?: number, originY?: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
};

type MouseState = {
  down: boolean;
  button: number;
  startGX: number;
  startGY: number;
  lastGX: number;
  lastGY: number;
};

export const Canvas: React.FC<CanvasProps> = ({
  buffer, version, width, height, zoom, tool, color,
  showGrid, fillShape, background,
  onBeginStroke, onPaintPixel, onEndStroke,
  onFloodFill, onCommitPixels, onColorPick, onZoom,
  scrollContainerRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<MouseState>({
    down: false, button: 0, startGX: 0, startGY: 0, lastGX: 0, lastGY: 0,
  });
  const spaceDownRef = useRef(false);
  const panStartRef = useRef<{ scrollX: number; scrollY: number; mouseX: number; mouseY: number } | null>(null);

  useCanvasRenderer(canvasRef, buffer, width, height, zoom, showGrid, background, version);

  const getGridCoords = useCallback(
    (e: MouseEvent | React.MouseEvent): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0];
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / zoom);
      const y = Math.floor((e.clientY - rect.top) / zoom);
      return [
        Math.max(0, Math.min(width - 1, x)),
        Math.max(0, Math.min(height - 1, y)),
      ];
    },
    [zoom, width, height],
  );

  const clearOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
  }, []);

  const drawShapePreview = useCallback(
    (gx: number, gy: number) => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const ctx = overlay.getContext('2d');
      if (!ctx) return;
      const ms = mouseRef.current;
      let pixels: [number, number][] = [];
      const drawColor = ms.button === 2 ? null : color;

      if (tool === 'line') {
        pixels = getLinePixels(ms.startGX, ms.startGY, gx, gy);
      } else if (tool === 'rect') {
        pixels = getRectPixels(ms.startGX, ms.startGY, gx, gy, fillShape);
      } else if (tool === 'ellipse') {
        pixels = getEllipsePixels(ms.startGX, ms.startGY, gx, gy, fillShape);
      }

      renderPreviewPixels(ctx, pixels, drawColor ?? 'rgba(128,128,128,0.5)', zoom);
      if (drawColor === null) {
        // For eraser shapes, use a dashed indicator instead
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.fillStyle = 'rgba(255,100,100,0.35)';
        for (const [px, py] of pixels) {
          ctx.fillRect(px * zoom, py * zoom, zoom, zoom);
        }
      }
    },
    [tool, color, fillShape, zoom],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 && e.button !== 2) return;
      e.preventDefault();

      if (spaceDownRef.current) {
        const sc = scrollContainerRef.current;
        if (sc) {
          panStartRef.current = {
            scrollX: sc.scrollLeft,
            scrollY: sc.scrollTop,
            mouseX: e.clientX,
            mouseY: e.clientY,
          };
        }
        return;
      }

      const [gx, gy] = getGridCoords(e);
      mouseRef.current = { down: true, button: e.button, startGX: gx, startGY: gy, lastGX: gx, lastGY: gy };

      const drawColor = e.button === 2 ? null : color;

      if (tool === 'pencil' || tool === 'eraser') {
        onBeginStroke();
        onPaintPixel(gx, gy, tool === 'eraser' ? null : drawColor);
      } else if (tool === 'fill') {
        if (drawColor) onFloodFill(gx, gy, drawColor);
      } else if (tool === 'eyedropper') {
        const idx = gy * width + gx;
        onColorPick(buffer[idx]);
      } else if (['line', 'rect', 'ellipse'].includes(tool)) {
        drawShapePreview(gx, gy);
      }
    },
    [
      getGridCoords, tool, color, buffer, width,
      onBeginStroke, onPaintPixel, onFloodFill, onColorPick, drawShapePreview,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (spaceDownRef.current && panStartRef.current) {
        const sc = scrollContainerRef.current;
        if (sc) {
          sc.scrollLeft = panStartRef.current.scrollX - (e.clientX - panStartRef.current.mouseX);
          sc.scrollTop = panStartRef.current.scrollY - (e.clientY - panStartRef.current.mouseY);
        }
        return;
      }

      if (!mouseRef.current.down) return;

      const [gx, gy] = getGridCoords(e);
      const ms = mouseRef.current;

      if (gx === ms.lastGX && gy === ms.lastGY) return;

      const drawColor = ms.button === 2 ? null : color;

      if (tool === 'pencil' || tool === 'eraser') {
        // Interpolate to avoid gaps when moving fast
        const linePixels = getLinePixels(ms.lastGX, ms.lastGY, gx, gy);
        for (const [px, py] of linePixels) {
          onPaintPixel(px, py, tool === 'eraser' ? null : drawColor);
        }
      } else if (['line', 'rect', 'ellipse'].includes(tool)) {
        drawShapePreview(gx, gy);
      }

      mouseRef.current.lastGX = gx;
      mouseRef.current.lastGY = gy;
    },
    [getGridCoords, tool, color, onPaintPixel, drawShapePreview],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (panStartRef.current) {
        panStartRef.current = null;
        return;
      }
      if (!mouseRef.current.down) return;

      const [gx, gy] = getGridCoords(e);
      const ms = mouseRef.current;
      const drawColor = ms.button === 2 ? null : color;

      if (tool === 'pencil' || tool === 'eraser') {
        onEndStroke();
      } else if (tool === 'line') {
        clearOverlay();
        onCommitPixels(getLinePixels(ms.startGX, ms.startGY, gx, gy), drawColor);
      } else if (tool === 'rect') {
        clearOverlay();
        onCommitPixels(getRectPixels(ms.startGX, ms.startGY, gx, gy, fillShape), drawColor);
      } else if (tool === 'ellipse') {
        clearOverlay();
        onCommitPixels(getEllipsePixels(ms.startGX, ms.startGY, gx, gy, fillShape), drawColor);
      }

      mouseRef.current.down = false;
    },
    [getGridCoords, tool, color, fillShape, onEndStroke, onCommitPixels, clearOverlay],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      onZoom(e.deltaY < 0 ? 1 : -1);
    },
    [onZoom],
  );

  // Cancel pan/stroke on mouse leave
  const handleMouseLeave = useCallback(() => {
    if (panStartRef.current) panStartRef.current = null;
  }, []);

  // Space key for pan mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        spaceDownRef.current = true;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDownRef.current = false;
        panStartRef.current = null;
        if (canvasRef.current) canvasRef.current.style.cursor = '';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const cw = width * zoom;
  const ch = height * zoom;

  const cursorMap: Record<Tool, string> = {
    pencil: 'crosshair',
    eraser: 'cell',
    fill: 'cell',
    line: 'crosshair',
    rect: 'crosshair',
    ellipse: 'crosshair',
    eyedropper: 'crosshair',
  };

  return (
    <div className="relative select-none" style={{ width: cw, height: ch }}>
      <canvas
        ref={canvasRef}
        width={cw}
        height={ch}
        style={{ display: 'block', cursor: cursorMap[tool] }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
      />
      <canvas
        ref={overlayRef}
        width={cw}
        height={ch}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
