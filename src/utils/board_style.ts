import { Color, ColorTheme, black } from "./theme"

export enum StyleMode {
  FillOnly,
  StrokeOnly,
  StrokeFirst,
  FillFirst,
  FillStroke
}

export interface ColorScheme {
  stroke?: string
  fill?: string
}

export interface Grid {
  readonly cellSize: number
  readonly stroke: number
  readonly zoomLimit: ZoomLimit
}

interface ZoomLimit {
  readonly min: number
    readonly max: number
}

export default class BoardStyle {
  readonly theme: ColorTheme
  private readonly grid: Grid
  private readonly mode: StyleMode
  private readonly color: Color

  constructor(mode: StyleMode, theme: ColorTheme, grid: Grid, color?: string) {
    this.mode = mode
    this.theme = theme
    this.grid = grid
    this.color = color 
      ? this.theme.colors ? this.theme.colors.get(color) ?? this.theme.colors.values().next().value : black 
      : black
  }

  static from(style: BoardStyle): BoardStyle {
    return new BoardStyle(style.mode, style.theme, style.grid, style.color.name)
  }

  setMode(mode: StyleMode): BoardStyle {
    return new BoardStyle(mode, this.theme, this.grid, this.color.name)
  }

  setTheme(theme: ColorTheme): BoardStyle {
    return new BoardStyle(this.mode, theme, this.grid, this.color.name)
  }

  nextMode(): BoardStyle {
    return new BoardStyle((this.mode + 1) % 5, this.theme, this.grid, this.color.name)
  }

  setColor(color: string): BoardStyle {
    return new BoardStyle(this.mode, this.theme, this.grid, color)
  }

  setGrid(grid: Grid): BoardStyle {
    return new BoardStyle(this.mode, this.theme, grid, this.color.name)
  }

  nextColor(): BoardStyle {
    const colors = Array.from<string>(this.theme.colors?.keys() ?? [])
    if (colors.length === 0) return this

    const currentColorIndex = colors.indexOf(this.color.name)
    const nextColorIndex = (currentColorIndex + 1 + colors.length) % colors.length
    const nextColor = colors[nextColorIndex] ?? "black"
    return new BoardStyle(this.mode, this.theme, this.grid, nextColor)
  }

  isLight(): boolean {
    return this.theme.isLight
  }

  getMode(): StyleMode {
    return this.mode
  }

  getBackground(): string {
    return this.theme.background
  }

  getCurrentLine(): string {
    return this.theme.currentLine
  }
  
  getComment(): string {
    return this.theme.comment
  }

  getForeground(): string {
    return this.theme.foreground
  }

  getColor(): string {
    return this.color.value
  }

  getColors(): Color[] {
    return Array.from(this.theme.colors?.values() ?? [])
  }

  getCellSize(): number {
    return this.grid.cellSize
  }

  getStroke(): number {
    return this.grid.stroke
  }

  getZoomLimit(): ZoomLimit {
    return this.grid.zoomLimit
  }

  getColorScheme(): ColorScheme {
    switch (this.mode) {
      case StyleMode.FillOnly: 
        return { fill: this.color.value, }
      case StyleMode.StrokeOnly: 
        return { stroke: this.color.value }
      case StyleMode.FillFirst:
        return { fill: this.color.value, stroke: this.getColorContrast() }
      case StyleMode.StrokeFirst: 
        return { stroke: this.color.value, fill: this.getColorContrast() }
      case StyleMode.FillStroke:
        return { fill: this.color.value, stroke: this.color.value }
    }
  }

  getColorOrDefault(color: string, def: string = "#000000") {
    return this.theme.colors?.get(color) ?? def
  }

  getBackgroundContrast() {
    return this.theme.isLight ? this.theme.comment : this.theme.foreground
  }

  getColorContrast() {
    return this.color.isLight ? this.theme.foreground : this.theme.comment
  }
}