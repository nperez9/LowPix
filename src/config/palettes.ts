export type PalettePreset = {
  id: string;
  name: string;
  colors: string[];
};

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'default',
    name: 'Default',
    colors: [
      '#000000', '#FFFFFF', '#FF0000', '#00FF00',
      '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#7F0000', '#7F7F00', '#007F00', '#007F7F',
      '#00007F', '#7F007F', '#FF7F00', '#FF007F',
      '#7FFF00', '#00FF7F', '#007FFF', '#7F00FF',
      '#FF7F7F', '#7FFF7F', '#7F7FFF', '#FFFF7F',
      '#FF7FFF', '#7FFFFF', '#3F3F3F', '#7F7F7F',
      '#BFBFBF', '#E8D4B0', '#6B4226', '#2D4A22',
    ],
  },
  {
    id: 'nes',
    name: 'NES',
    colors: [
      // Grays
      '#000000', '#3D3D3D', '#7C7C7C', '#BCBCBC',
      // White → reds
      '#FFFFFF', '#AB0000', '#F80000', '#AB2300',
      // Oranges
      '#BC3C00', '#F85000', '#7C3800', '#5C4B00',
      // Yellows → greens
      '#7C6400', '#D8F878', '#004B00', '#007C00',
      // Greens → teals
      '#007C28', '#004B2B', '#00F8C8', '#006870',
      // Cyans → blue
      '#7CF8F8', '#BCF8F8', '#003D5C', '#0000AB',
      // Blues → purples
      '#0000F8', '#7C7CE7', '#3700AB', '#7800F8',
      // Violets → pinks
      '#5C007C', '#BC00BC', '#F80084', '#AB0047',
    ],
  },
  {
    id: 'gameboy',
    name: 'Game Boy',
    // Original DMG 4-shade green palette, mirrored across 32 slots
    colors: [
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F',
    ],
  },
  {
    id: 'gameboy-color',
    name: 'Game Boy Color',
    // 4 characteristic GBC color ramps: green, warm, orange, blue
    colors: [
      '#071821', '#306850', '#86C06C', '#E0F8CF',
      '#1F1505', '#5A3921', '#A0785A', '#D4B896',
      '#5C1A00', '#B94B00', '#FF8400', '#FFDB00',
      '#00187C', '#0058B4', '#37A2DC', '#B2DCEF',
    ],
  },
  {
    id: 'virtual-boy',
    name: 'Virtual Boy',
    // 8-shade red/black ramp, mirrored across 32 slots
    colors: [
      '#000000', '#130000', '#260000', '#390000',
      '#740000', '#A80000', '#D40000', '#FF0000',
    ],
  },
  {
    id: 'pico8',
    name: 'PICO-8',
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751',
      '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436',
      '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ],
  },
];
