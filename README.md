# lowpix — Pixel Art Editor

A fast, minimal, browser-based pixel art editor. No accounts, no server, no bloat. Draw, export, done.

```
npm run dev   # start dev server at localhost:3000
npm run build # production build
```

---

## Summary

lowpix is a single-page app built on **Next.js 16 / App Router**, **TypeScript**, and **Tailwind CSS 4**. All rendering happens on an HTML5 `<canvas>`. Pixel data lives entirely in the browser — nothing is sent to a server.

The editor supports 7 drawing tools, a 32-slot color palette, undo/redo with 50 steps, PNG export at up to 16× scale, and keyboard shortcuts for every action.

**Stack at a glance:**

| Concern | Solution |
|---------|----------|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript (strict) |
| Styles | Tailwind CSS 4 |
| Rendering | HTML5 Canvas API (imperative, no WebGL) |
| State | React hooks + refs (no external state lib) |
| Lint/Format | Biome |
| Backend | None — fully client-side |

---

## File Map

```
src/
  app/
    page.tsx                Entry point — renders <PixelEditor />
    layout.tsx              Sets <html> metadata and full-height body
    globals.css             Minimal reset + Tailwind import

  types/
    index.ts                Shared types: PixelBuffer, Tool, CanvasConfig, DEFAULT_PALETTE

  lib/
    drawing.ts              Pure pixel-math utilities (line, rect, ellipse algorithms)

  hooks/
    usePixelCanvas.ts       Core state: pixel buffer, undo/redo, all drawing ops
    useCanvasRenderer.ts    Syncs pixel buffer → <canvas> on every change

  components/
    PixelEditor.tsx         Root component — owns all state, wires everything together
    Canvas.tsx              Interactive canvas — mouse events, shape preview overlay
    Toolbar.tsx             Left sidebar — tool buttons, grid toggle, undo/redo
    ColorPicker.tsx         Active color — swatch, native color wheel, hex input
    Palette.tsx             32-slot palette grid — click to pick, right-click to edit
    ExportMenu.tsx          PNG export dropdown (1×, 2×, 4×, 8×, 16×)
    CanvasSizeDialog.tsx    First-load modal — preset sizes or custom up to 128×128
```

---

## Deep Dive

### `types/index.ts`

The core data model is intentionally small:

```ts
type PixelBuffer = (string | null)[];
// Flat array, length = width × height.
// Each slot is a '#RRGGBB' hex string, or null (transparent).
// Index formula: buffer[y * width + x]

type CanvasConfig = {
  width: number;   // grid columns
  height: number;  // grid rows
  zoom: number;    // display pixels per grid cell (e.g. zoom=32 → 32px/cell)
};

type Tool = 'pencil' | 'eraser' | 'fill' | 'line' | 'rect' | 'ellipse' | 'eyedropper';
```

Using a flat array instead of a 2D array keeps all operations O(1) by index and makes copying cheap (`[...buffer]`).

`DEFAULT_PALETTE` is a hardcoded array of 32 hex strings — NES/GameBoy-inspired colors. It's the only "data" in the codebase.

---

### `lib/drawing.ts`

Pure functions that turn two points into a list of grid coordinates. No side effects, no React, no canvas — just math.

#### `getLinePixels(x0, y0, x1, y1)`

**Bresenham's line algorithm.** Steps along the steeper axis, deciding at each pixel whether to step in the other axis based on cumulative error. Produces a connected 1px-wide line with no diagonal gaps, regardless of angle or length.

```
(0,0) → (4,2):   [(0,0),(1,0),(2,1),(3,1),(4,2)]
```

Used both for the Line tool and to **interpolate pencil strokes** — when the mouse moves several grid cells in one event, `getLinePixels(lastPos, currentPos)` fills the gap so no pixels are skipped.

#### `getRectPixels(x0, y0, x1, y1, filled)`

- **Filled:** nested loop over the bounding box.
- **Stroked:** iterates the four edges only, deduplicating corners.

#### `getEllipsePixels(x0, y0, x1, y1, filled)`

The bounding box defines center `(cx, cy)` and radii `(rx, ry)`.

- **Filled:** scanline approach — for each row `y`, compute the x-span using the ellipse equation `x = rx * sqrt(1 - (dy/ry)²)`. Fill the span. A `+0.5` bias on the radius makes 1-pixel ellipses fill correctly.
- **Outlined:** parametric — step through angles 0–2π with enough steps to guarantee pixel adjacency (`steps = 2π * max(rx, ry) * 2`), rounding each `(cos θ, sin θ)` point to the nearest integer. Duplicates are deduplicated via a `Set`.

Degenerate cases (rx=0, ry=0, or one axis is zero) produce a point or a line.

#### `renderPreviewPixels(ctx, pixels, color, zoom)`

Helper used by Canvas's overlay canvas — clears and redraws a list of pixels in a given color at the current zoom level.

---

### `hooks/usePixelCanvas.ts`

The most important hook. Manages the pixel buffer and undo/redo history without putting the buffer in React state (which would re-allocate on every paint event).

#### Buffer strategy

```ts
const bufferRef = useRef<PixelBuffer>(createEmptyBuffer(width, height));
const [version, setVersion] = useState(0);
const forceUpdate = () => setVersion(v => v + 1);
```

`bufferRef.current` is always the authoritative, current buffer. It can be read synchronously at any time with no stale-closure risk. `version` is a counter that exists purely to trigger React re-renders — it carries no data.

Why not put the buffer in `useState`? Because during a pencil drag, `paintPixel` can be called dozens of times per second. Each call would queue a state update. React would batch them but you'd still allocate a new array per event, and each call inside the event handler would read a stale snapshot of the buffer. The ref avoids both problems: mutations are synchronous and sequential, and the renderer reads the latest value on the next animation frame.

#### Undo/redo

```ts
const pastRef  = useRef<PixelBuffer[]>([]);  // states that undo goes back to
const futureRef = useRef<PixelBuffer[]>([]); // states that redo goes forward to
```

History stores **snapshots of the buffer**, not diffs. For a 128×128 canvas at 50 steps, that's at most 50 × 16,384 × ~20 bytes ≈ ~16 MB worst-case. Acceptable.

**Undo:** pop from `past`, push current buffer to `future`, set as current.  
**Redo:** pop from `future`, push current buffer to `past`, set as current.

#### Stroke batching

Without special handling, a pencil drag would create one undo entry per pixel — pressing Ctrl+Z would undo one pixel at a time.

The solution: `preStrokeRef` saves the buffer state at `beginStroke()` (mousedown). During the drag, `paintPixel()` mutates `bufferRef` and triggers re-renders but does **not** touch history. At `endStroke()` (mouseup), the pre-stroke snapshot is pushed to `past`. One drag = one undo step.

```
mousedown → beginStroke() → saves buffer snapshot
mousemove → paintPixel() × N → mutates buffer, forceUpdate each time
mouseup   → endStroke()  → pushes snapshot to past, clears future
```

For fill and shapes, `commit(newBuffer)` is used instead — it pushes the current buffer to `past` then replaces it atomically.

---

### `hooks/useCanvasRenderer.ts`

A `useEffect` that redraws the entire canvas whenever the buffer, zoom, grid visibility, or background changes.

```ts
useEffect(() => {
  // 1. Clear
  // 2. Draw background (checkerboard or white)
  // 3. Draw pixels
  // 4. Draw grid lines
}, [buffer, width, height, zoom, showGrid, background, version]);
```

`version` is in the dependency array specifically because `buffer` is a ref value — same reference between renders unless explicitly replaced. `version` increments on every mutation, so the effect always re-fires.

**Checkerboard:** rendered at `cs = max(2, floor(zoom/2))` pixels per checker square, so it scales with zoom and is always visible but never overwhelming.

**Grid lines:** drawn as a single `beginPath()` with all vertical then all horizontal lines, stroked once. Skipped when `zoom < 4` (cells too small to see lines).

**Why imperative, not declarative?** A 128×128 canvas at zoom=4 is 512×512 pixels — 262,144 cells. Drawing each as a React element would be thousands of DOM nodes. The canvas approach is a single buffer write.

---

### `components/Canvas.tsx`

The interactive layer. Translates mouse events into grid coordinates, manages the overlay canvas for shape previews, and handles pan and zoom.

#### Coordinate mapping

```ts
const gx = Math.floor((e.clientX - rect.left) / zoom);
const gy = Math.floor((e.clientY - rect.top) / zoom);
```

Clamped to `[0, width-1]` and `[0, height-1]`.

#### Mouse event flow

```
mousedown
  → pencil/eraser: beginStroke(), paintPixel(gx, gy)
  → fill:          floodFill(gx, gy, color)
  → eyedropper:    onColorPick(buffer[idx])
  → line/rect/ellipse: draw initial preview on overlay

mousemove (only if down)
  → pencil/eraser: getLinePixels(last→current) → paintPixel each
  → shapes:        clear overlay, redraw preview from startPos→currentPos

mouseup
  → pencil/eraser: endStroke()
  → shapes:        clear overlay, commit final pixels to buffer
```

#### Overlay canvas

Two `<canvas>` elements are stacked with `position: absolute`. The main canvas holds committed pixels. The overlay canvas holds the in-progress shape preview (line, rect, ellipse). The overlay has `pointer-events: none` so mouse events fall through to the main canvas.

On `mouseup`, the overlay is cleared and the shape is committed to the real buffer. This means the preview **never mutates the buffer** — cancelling mid-drag (e.g. pressing Escape, though not yet implemented) would automatically discard it.

#### Right-click as eraser

`e.button === 2` sets `drawColor = null`. Right-clicking with any draw tool erases. This is a standard pixel-editor convention.

#### Pan (Space+drag)

`spaceDownRef` tracks whether Space is held. On `mousedown` while Space is held, the scroll position of the container is saved. On `mousemove`, the container's `scrollLeft`/`scrollTop` is updated to mirror the mouse delta. The `scrollContainerRef` is passed down from `PixelEditor` to avoid DOM traversal.

#### Zoom (scroll wheel)

`onWheel` calls `onZoom(±1)` which doubles or halves the zoom level in `PixelEditor`, clamped to `[1, 64]`.

---

### `components/PixelEditor.tsx`

The root. Holds all application state and passes it down. Nothing is in a global store — this is intentional for simplicity.

**State owned here:**
- `canvasSize` (width, height)
- `zoom`
- `tool`
- `color` (active foreground color)
- `palette` (32 mutable slots)
- `showGrid`
- `fillShape` (filled vs stroked for rect/ellipse)
- `background` (transparent checkerboard vs solid white)
- `showDialog` (whether CanvasSizeDialog is visible)

`usePixelCanvas` is called here and its methods are passed as callbacks to `Canvas`.

**Keyboard shortcuts** are registered in a single `useEffect` with a `window` listener. Skipped when an `<input>` is focused:

| Key | Action |
|-----|--------|
| `P` | Pencil |
| `E` | Eraser |
| `F` | Fill |
| `L` | Line |
| `R` | Rectangle |
| `O` | Ellipse |
| `I` | Eyedropper |
| `G` | Toggle grid |
| `+` / `-` | Zoom in/out |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

**Layout:** three-column flex inside a full-viewport flex column. The canvas area is `overflow-auto` so large canvases scroll; a centering inner div keeps small canvases centered.

---

### `components/Toolbar.tsx`

A vertical strip of icon buttons on the left edge. Each button maps to a `Tool` value. The active tool gets an indigo highlight. A divider separates drawing tools from utility buttons (grid toggle, undo/redo).

The fill/stroke toggle (`▪`/`▫`) only renders when the active tool is `line`, `rect`, or `ellipse` — it's contextual.

---

### `components/ColorPicker.tsx`

Two inputs wired to the same color state:

1. **Native color input** (`<input type="color">`) — hidden, triggered by clicking the swatch. Provides the OS color picker (wheel, sliders, etc.) for free.
2. **Hex text input** — shows `#RRGGBB` without the `#`. Committed on blur or Enter. Validated with a regex; invalid input reverts to the current color.

Both inputs normalize their output to uppercase hex.

---

### `components/Palette.tsx`

A 4-column grid of 32 color swatches. 

- **Left-click:** sets that color as active.
- **Right-click:** opens a hidden `<input type="color">` overlaid on the swatch, allowing the palette slot to be replaced with a custom color.

The active color gets a white `ring` outline. Color comparison is case-insensitive (`.toUpperCase()` on both sides).

---

### `components/ExportMenu.tsx`

A dropdown button. Clicking "Export" opens a menu with 5 scale options. Each option:

1. Creates an offscreen `<canvas>` at `width * scale` × `height * scale`
2. Iterates the buffer, filling each cell as a scaled rectangle
3. Calls `.toDataURL('image/png')` and triggers a download via a synthetic `<a>` click

Transparent pixels (null in the buffer) are simply skipped — the canvas default is `rgba(0,0,0,0)`, so they export as transparent. No manual alpha manipulation needed.

The menu closes when clicking outside (tracked via a `mousedown` listener on `document`).

---

### `components/CanvasSizeDialog.tsx`

A centered modal shown on first load (and when "New" is clicked). Five preset sizes plus a custom option. Custom shows two number inputs clamped to `[1, 128]`.

On confirm, `PixelEditor` calls `reset(w, h)` from `usePixelCanvas` (clears the buffer and history) and computes a default zoom to fit the canvas at ~512px:

```ts
zoom = Math.max(1, Math.floor(512 / Math.max(width, height)))
// 8×8   → zoom 64  (512px canvas)
// 16×16 → zoom 32
// 32×32 → zoom 16
// 64×64 → zoom 8
// 128×128 → zoom 4
```

---

## Data Flow

```
CanvasSizeDialog
  → onConfirm(w, h) → PixelEditor sets size, resets buffer

PixelEditor
  owns: zoom, tool, color, palette, showGrid, fillShape, background
  uses: usePixelCanvas(width, height) → buffer, version, drawing ops

PixelEditor → Canvas
  passes: buffer, version, zoom, tool, color, showGrid, fillShape, background
  passes: onBeginStroke, onPaintPixel, onEndStroke, onFloodFill, onCommitPixels
  passes: onColorPick (eyedropper → sets PixelEditor.color)
  passes: onZoom (wheel → sets PixelEditor.zoom)

Canvas → useCanvasRenderer
  passes: buffer, version, zoom, showGrid, background → renders to <canvas>

Canvas (overlay)
  draws shape previews directly, imperatively, no state involved

PixelEditor → Toolbar
  passes: tool, canUndo, canRedo + callbacks

PixelEditor → ColorPicker + Palette
  passes: color, palette + callbacks → updates PixelEditor.color / palette

PixelEditor → ExportMenu
  passes: buffer, width, height (read-only, triggers download)
```

---

## Extending the Editor

### Adding a new tool

1. Add the tool name to the `Tool` union in `types/index.ts`
2. Add a button in `Toolbar.tsx` with an icon and keyboard shortcut
3. Handle `mousedown`/`mousemove`/`mouseup` for the new tool in `Canvas.tsx`
4. Add the keyboard shortcut to the `toolKeys` map in `PixelEditor.tsx`
5. If the tool modifies the buffer atomically, call `commit(newBuffer)` from `usePixelCanvas`
6. If it's a stroke-based tool, use `beginStroke()` / `paintPixel()` / `endStroke()`

### Adding layers

The `PixelBuffer` type would become `PixelBuffer[]`. The renderer would composite layers in order, with the bottom-most layer rendered first. Each layer needs its own undo stack, or the undo stack needs to track which layer changed.

### Adding animation frames

Each frame is a `PixelBuffer`. The editor would need a frame list UI (similar to Palette) and a way to step between frames. Export would produce a sprite sheet or GIF.

---

## Roadmap

- [ ] Symmetry mode (horizontal / vertical mirror drawing)
- [ ] Layers with opacity
- [ ] Animation frames + GIF export
- [ ] Save/load as `.pxart` JSON
- [ ] Tile preview (repeating canvas)
- [ ] GLSL shader editor applied on top of canvas (CRT glow, palette swap, etc.)
