interface RGBColor {
  r: number
  g: number
  b: number
  a: number
}

const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
export function hexToRGB8(hex: string): RGBColor|null {
  const result = hexRegex.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1.0
  } : null;
}

export function hexToRGB(hex: string): RGBColor|null {
  const rbg = hexToRGB8(hex);
  return rbg ? {
    r: rbg.r / 255,
    g: rbg.g / 255,
    b: rbg.b / 255,
    a: rbg.a
  } : null
}