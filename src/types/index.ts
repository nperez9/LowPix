export type PixelBuffer = (string | null)[];

export type CanvasConfig = {
  width: number;
  height: number;
  zoom: number; // pixels per grid cell
};

export type Tool =
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'line'
  | 'rect'
  | 'ellipse'
  | 'eyedropper';

export type Background = 'transparent' | 'white';
