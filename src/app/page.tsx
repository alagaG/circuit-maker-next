'use client'

import BoardManager from "@/lib/circuit-maker";
import { OrderNode } from "@/lib/circuit-maker/circuit";
import BoardStyle, { StyleMode } from "@/utils/board_style";
import { hexToRGB, hexToRGB8 } from "@/utils/colors";
import { ayuLightTheme, darkThemes, lightThemes } from "@/utils/themes";
import dynamic from "next/dynamic";
import { ButtonHTMLAttributes, ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";

const Canvas = dynamic(() => import("@/components/canvas"), {
  ssr: false
})

export default function Home() {
  const darkMode = useRef(false)
  const boardManager = useRef<BoardManager>(new BoardManager())
  const themeIndex = useRef(0)
  const textAreaReference = useRef("")
  const parsingReference = useRef({ success: true })

  useEffect(() => {
    darkMode.current = window.matchMedia("(prefers-color-scheme: dark)").matches
  }, [])
  
  const [ style, setStyle ] = useState<BoardStyle>(new BoardStyle(StyleMode.StrokeOnly, darkMode.current ? lightThemes[0] : darkThemes[0], { cellSize: 16, stroke: 0.5, zoomLimit: { min: 1, max: 2.5 } }, 'pink'))
  const [ view, setView ] = useState(boardManager.current.getView())
  
  const onParseButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    const result = boardManager.current.parse(textAreaReference.current)
    parsingReference.current = result
    setView(boardManager.current.getView())
    
    if (!result.success) {
      console.log(result.errors)
    }
  }

  const onTextAreaChanged = (event: ChangeEvent<HTMLTextAreaElement>) => {
    textAreaReference.current = event.target.value
  }

  const onDarkModeButtonClick = () => {
    themeIndex.current = 0
    darkMode.current = !darkMode.current
    setStyle(style.setTheme(darkMode.current ? darkThemes[themeIndex.current] : lightThemes[themeIndex.current]))
  }

  const onThemeButtonClick = () => { 
    const themes = darkMode.current ? darkThemes : lightThemes
    themeIndex.current = (themeIndex.current + 1) % themes.length; 
    setStyle(style.setTheme(themes[themeIndex.current])) }
  const onColorButtonClick = () => setStyle(style.nextColor())

  const mainStyle = {
    backgroundColor: style.getBackground()
  }

  const backgroundRGB = hexToRGB8(style.getBackground())!
  const backgroundStyle = { 
    backgroundColor: `rgb(${backgroundRGB.r} ${backgroundRGB.g} ${backgroundRGB.b} / 0.15)`
  }

  const foregroundRGB = hexToRGB8(style.isLight() ? style.getForeground() : style.getCurrentLine())!
  const panelStyle = {
    backgroundColor: `rgb(${foregroundRGB.r} ${foregroundRGB.g} ${foregroundRGB.b})`
  }

  const darkModeButtonStyle = {
    backgroundColor: style.isLight() ? "white" : "black"
  }
  const themeButtonStyle = {
    backgroundImage: `conic-gradient(${style.getColors().map(c => c.value).join(', ')})`
  }

  return (
    <main style={ mainStyle }>
      <aside style={backgroundStyle} className="absolute w-full h-1/2 md:w-2/5 md:h-full px-8 py-4 z-10 -translate-y-[50%] hover:translate-y-0 md:translate-y-0 md:-translate-x-[95%] hover:translate-x-0 focus-within:translate-x-0 backdrop-blur-sm shadow-xl shadow-black/50 transition-transform duration-200 ease-out">
        <div className="flex flex-col gap-2 size-full text-xl">
          <div className="flex gap-2">
            <button style={ darkModeButtonStyle } onClick={ onDarkModeButtonClick } className="size-[32px] rounded-full shadow-inner shadow-black/50" />
            <button style={ themeButtonStyle } onClick={ onThemeButtonClick } className="size-[32px] rounded-full shadow-inner shadow-black/50" />
            <button style={ { backgroundColor: style.getColor() } } onClick={ onColorButtonClick } className="size-[32px] rounded-full shadow-inner shadow-black/50" />
          </div>
          <textarea style={ { ...panelStyle, fontFamily: "Consolas" }} onChange={ onTextAreaChanged } className="size-full p-2 resize-none text-nowrap rounded-md focus:outline-none shadow-inner shadow-black/40 backdrop-blur-sm scrollbar"></textarea>   
          <button style={panelStyle} onClick={ onParseButtonClick } className="p-1 rounded-md">Parse</button>
        </div>
      </aside>
      <Canvas style={ style } boardView={ view } showTheme />
    </main>
  );
}
