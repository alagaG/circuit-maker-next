import { Color, ColorTheme } from "./theme"


export const draculaTheme : ColorTheme = {
  name: "Dracula",
  isLight: false,
  background: "#282A36",
  currentLine: "#44475A",
  comment: "#6272A4",
  foreground: "#F8F8F2",
  colors: new Map<string, Color>([
    { name: "orange", value: "#FFB86C", isLight: false } as Color,
    { name: "yellow", value: "#F1FA8C", isLight: false } as Color,
    { name: "green",  value: "#50FA7B", isLight: false } as Color,
    { name: "cyan",   value: "#8BE9FD", isLight: false } as Color,
    { name: "purple", value: "#BD93F9", isLight: false } as Color,
    { name: "pink",   value: "#FF79C6", isLight: false } as Color,
    { name: "red",    value: "#FF5555", isLight: false } as Color,
  ].map((color) => [ color.name, color ]))
}

export const ayuLightTheme : ColorTheme = {
  name: "Ayu Light",
  isLight: true,
  background: "#FCFCFC",
  currentLine: "#5C6166",
  comment: "#787B80",
  foreground: "#8A9199",
  colors: new Map<string, Color>([
    { name: "red",    value: "#F07171", isLight: false } as Color,
    { name: "purple", value: "#A37ACC", isLight: false } as Color,
    { name: "gray",   value: "#787B80", isLight: false } as Color,
    { name: "cyan",   value: "#55B4D4", isLight: false } as Color,
    { name: "blue",   value: "#399EE6", isLight: false } as Color,
    { name: "green",  value: "#4CBF99", isLight: false } as Color,
    { name: "lime",   value: "#86B300", isLight: false } as Color,
    { name: "yellow", value: "#F2AE49", isLight: false } as Color,
    { name: "orange", value: "#FA8D3E", isLight: false } as Color,
  ].map((color) => [ color.name, color ]))
}

export const ayuMirageTheme : ColorTheme = {
  name: "Ayu Mirage",
  isLight: false,
  background: "#1F2430",
  currentLine: "#171B24",
  foreground: "#B8CFE6",
  comment: "#707A8C",
  colors: new Map<string, Color>([
    { name: "red",     value: "#F28779", isLight: false } as Color,
    { name: "orange",  value: "#FFAD66", isLight: false } as Color,
    { name: "yellow",  value: "#FFD173", isLight: false } as Color,
    { name: "lime",    value: "#D5FF80", isLight: false } as Color,
    { name: "green",   value: "#95E6CB", isLight: false } as Color,
    { name: "blue",    value: "#73D0FF", isLight: false } as Color,
    { name: "cyan",    value: "#5CCFE6", isLight: false } as Color,
    { name: "purple",  value: "#DFBFFF", isLight: false } as Color,
    { name: "gray",    value: "#B8CFE6", isLight: false } as Color,
  ].map((color) => [ color.name, color ]))
}

const themes = [
  ayuLightTheme, ayuMirageTheme,
  draculaTheme
]

export const lightThemes = themes.filter((theme) => theme.isLight)
export const darkThemes = themes.filter((theme) => !theme.isLight)