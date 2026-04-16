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

export const DEFAULT_PALETTE: string[] = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00',
  '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#7F0000', '#7F7F00', '#007F00', '#007F7F',
  '#00007F', '#7F007F', '#FF7F00', '#FF007F',
  '#7FFF00', '#00FF7F', '#007FFF', '#7F00FF',
  '#FF7F7F', '#7FFF7F', '#7F7FFF', '#FFFF7F',
  '#FF7FFF', '#7FFFFF', '#3F3F3F', '#7F7F7F',
  '#BFBFBF', '#E8D4B0', '#6B4226', '#2D4A22',
];
