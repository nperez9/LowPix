"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { version as AppVersion } from "../../package.json";
import { Canvas } from "./Canvas";
import { CanvasSizeDialog } from "./CanvasSizeDialog";
import { ColorPicker } from "./ColorPicker";
import { ExportMenu } from "./ExportMenu";
import { Palette } from "./Palette";
import { Toolbar } from "./Toolbar";
import { usePixelCanvas } from "@/hooks/usePixelCanvas";
import { PALETTE_PRESETS } from "@/config/palettes";
import type { Background, PixelBuffer, Tool } from "@/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 64;

function getDefaultZoom(w: number, h: number): number {
  return Math.max(1, Math.floor(512 / Math.max(w, h)));
}

export const PixelEditor: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showDialog, setShowDialog] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 16, height: 16 });
  const [zoom, setZoom] = useState(32);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#000000");
  const [palette, setPalette] = useState<string[]>(PALETTE_PRESETS[0].colors);
  const [showGrid, setShowGrid] = useState(true);
  const [fillShape, setFillShape] = useState(false);
  const [background, setBackground] = useState<Background>("transparent");

  const { width, height } = canvasSize;
  const {
    buffer,
    version,
    canUndo,
    canRedo,
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
  } = usePixelCanvas(width, height);

  const handleCanvasCreate = useCallback(
    (w: number, h: number) => {
      setCanvasSize({ width: w, height: h });
      setZoom(getDefaultZoom(w, h));
      setPalette(PALETTE_PRESETS[0].colors);
      reset(w, h);
      setShowDialog(false);
    },
    [reset],
  );

  const handleCommitPixels = useCallback(
    (pixels: [number, number][], drawColor: string | null) => {
      const buf = [...getBuffer()];
      for (const [x, y] of pixels) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          buf[y * width + x] = drawColor;
        }
      }
      commit(buf);
    },
    [getBuffer, commit, width, height],
  );

  const handleColorPick = useCallback((picked: string | null) => {
    if (picked) setColor(picked);
    setTool("pencil");
  }, []);

  const handleZoom = useCallback((direction: 1 | -1) => {
    setZoom((z) => {
      const next = direction > 0 ? z * 2 : Math.floor(z / 2);
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    });
  }, []);

  const handlePaletteChange = useCallback((index: number, newColor: string) => {
    setPalette((prev) => {
      const next = [...prev];
      next[index] = newColor;
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const toolKeys: Record<string, Tool> = {
      p: "pencil",
      e: "eraser",
      f: "fill",
      l: "line",
      r: "rect",
      o: "ellipse",
      i: "eyedropper",
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Skip when typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      )
        return;

      const key = e.key.toLowerCase();
      const meta = e.metaKey || e.ctrlKey;

      if (meta && key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (meta && (key === "y" || (e.shiftKey && key === "z"))) {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && key === "s") {
        e.preventDefault();
        // Export at 1x via a synthetic click isn't easy here; handled by ExportMenu
        return;
      }

      if (!meta) {
        if (toolKeys[key]) {
          setTool(toolKeys[key]);
          return;
        }
        if (key === "g") {
          setShowGrid((v) => !v);
          return;
        }
        if (key === "+" || key === "=") {
          handleZoom(1);
          return;
        }
        if (key === "-") {
          handleZoom(-1);
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, handleZoom]);

  if (showDialog) {
    return <CanvasSizeDialog onConfirm={handleCanvasCreate} />;
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-indigo-400 font-bold text-lg tracking-tight">
            lowpix{" "}
            <span className="text-neutral-600 text-xs font-normal">
              v{AppVersion}
            </span>
          </span>
          <span className="text-neutral-600 text-sm">
            {width}×{height}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Background toggle */}
          <button
            title="Toggle background"
            onClick={() =>
              setBackground((b) =>
                b === "transparent" ? "white" : "transparent",
              )
            }
            className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
          >
            {background === "transparent" ? "⬜ Transparent" : "⬜ White"}
          </button>
          {/* Zoom indicator */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom(-1)}
              className="w-6 h-6 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors text-sm flex items-center justify-center"
            >
              −
            </button>
            <span className="text-neutral-400 text-xs w-10 text-center">
              {zoom}px
            </span>
            <button
              onClick={() => handleZoom(1)}
              className="w-6 h-6 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors text-sm flex items-center justify-center"
            >
              +
            </button>
          </div>
          {/* New canvas */}
          <button
            onClick={() => setShowDialog(true)}
            className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-neutral-800 transition-colors"
          >
            New
          </button>
          <ExportMenu buffer={buffer} width={width} height={height} />
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left toolbar */}
        <Toolbar
          tool={tool}
          fillShape={fillShape}
          showGrid={showGrid}
          onToolChange={setTool}
          onFillShapeToggle={() => setFillShape((v) => !v)}
          onGridToggle={() => setShowGrid((v) => !v)}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        {/* Canvas area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-neutral-950"
          style={{
            backgroundImage:
              "radial-gradient(circle, #1a1a2e 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <div className="flex items-center justify-center min-h-full min-w-max p-8">
            <Canvas
              buffer={buffer}
              version={version}
              width={width}
              height={height}
              zoom={zoom}
              tool={tool}
              color={color}
              showGrid={showGrid}
              fillShape={fillShape}
              background={background}
              onBeginStroke={beginStroke}
              onPaintPixel={paintPixel}
              onEndStroke={endStroke}
              onFloodFill={floodFill}
              onCommitPixels={handleCommitPixels}
              onColorPick={handleColorPick}
              onZoom={handleZoom}
              scrollContainerRef={scrollContainerRef}
            />
          </div>
        </div>

        {/* Right panel */}
        <aside className="w-52 shrink-0 border-l border-neutral-800 bg-neutral-900 overflow-y-auto flex flex-col">
          <ColorPicker color={color} onChange={setColor} />
          <Palette
            palette={palette}
            activeColor={color}
            onColorSelect={setColor}
            onPaletteChange={handlePaletteChange}
            onPresetSelect={setPalette}
          />
        </aside>
      </div>

      {/* Mobile hint */}
      <div className="md:hidden px-4 py-2 bg-neutral-900 border-t border-neutral-800 text-neutral-500 text-xs text-center">
        Best experienced on desktop
      </div>
    </div>
  );
};
