/** Bresenham's line algorithm */
export function getLinePixels(
  x0: number, y0: number,
  x1: number, y1: number,
): [number, number][] {
  const pixels: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0, y = y0;

  for (;;) {
    pixels.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return pixels;
}

export function getRectPixels(
  x0: number, y0: number,
  x1: number, y1: number,
  filled: boolean,
): [number, number][] {
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
  const pixels: [number, number][] = [];

  if (filled) {
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++)
        pixels.push([x, y]);
  } else {
    for (let x = minX; x <= maxX; x++) {
      pixels.push([x, minY]);
      if (maxY !== minY) pixels.push([x, maxY]);
    }
    for (let y = minY + 1; y < maxY; y++) {
      pixels.push([minX, y]);
      if (maxX !== minX) pixels.push([maxX, y]);
    }
  }
  return pixels;
}

export function getEllipsePixels(
  x0: number, y0: number,
  x1: number, y1: number,
  filled: boolean,
): [number, number][] {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = Math.abs(x1 - x0) / 2;
  const ry = Math.abs(y1 - y0) / 2;

  const set = new Set<string>();
  const pixels: [number, number][] = [];

  const add = (x: number, y: number) => {
    const k = `${x},${y}`;
    if (!set.has(k)) { set.add(k); pixels.push([x, y]); }
  };

  if (rx < 0.5 || ry < 0.5) {
    // Degenerate: line or single pixel
    if (rx < 0.5 && ry < 0.5) {
      add(Math.round(cx), Math.round(cy));
    } else if (rx < 0.5) {
      for (let y = Math.round(cy - ry); y <= Math.round(cy + ry); y++)
        add(Math.round(cx), y);
    } else {
      for (let x = Math.round(cx - rx); x <= Math.round(cx + rx); x++)
        add(x, Math.round(cy));
    }
    return pixels;
  }

  if (filled) {
    const minY = Math.floor(cy - ry);
    const maxY = Math.ceil(cy + ry);
    for (let py = minY; py <= maxY; py++) {
      const dy = py - cy;
      const xSpan = rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2));
      const minX = Math.round(cx - xSpan);
      const maxX = Math.round(cx + xSpan);
      for (let px = minX; px <= maxX; px++) add(px, py);
    }
  } else {
    // Parametric outline with enough steps to avoid gaps
    const steps = Math.ceil(2 * Math.PI * Math.max(rx, ry) * 2);
    for (let i = 0; i <= steps; i++) {
      const angle = (2 * Math.PI * i) / steps;
      add(Math.round(cx + rx * Math.cos(angle)), Math.round(cy + ry * Math.sin(angle)));
    }
  }

  return pixels;
}

/** Draw preview pixels on an overlay canvas context */
export function renderPreviewPixels(
  ctx: CanvasRenderingContext2D,
  pixels: [number, number][],
  color: string | null,
  zoom: number,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!color) return;
  ctx.fillStyle = color;
  for (const [x, y] of pixels) {
    ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
  }
}
