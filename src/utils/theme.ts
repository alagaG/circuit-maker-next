export interface Color {
  name: string
  value: string
  isLight: boolean
}

export const black : Color = {
  name: "black",
  value: "#000000",
  isLight: false
}

export interface ColorTheme {
  name: string
  author: string
  isLight: boolean
  background: string
  currentLine: string
  foreground: string
  comment: string
  colors?: Map<string, Color>
}