'use client'

import { ColorTheme } from "@/utils/theme";
import { ShapeConfig } from "konva/lib/Shape";
import { Group, Rect, Text } from "react-konva";

interface ThemeExampleProps extends ShapeConfig {
  theme: ColorTheme
}

export default function ThemeExample({ theme, x=0, y=0, width=0, height=0 }: ThemeExampleProps) {
  return (
    <Group
      x={ x }
      y={ y }
    >
      <Text
        height={height * 0.3}
        text={ theme.name }
        fontSize={ height * 0.3 }
        fill={ theme.foreground }
      />
      <Group
        y={ height * 0.3 }
      >
        {
          [ theme.background, theme.currentLine, theme.comment, theme.foreground ].map((color, index) => {
            return <Rect 
              key={index}
              x={ (width * 0.2 + 2) * index }
              width={width * 0.2}
              height={height * 0.2}
              fill={ color }
              stroke="black"
              strokeWidth={0.1}
            />
          })
        }
      </Group>
      <Group
        y={ height * 0.3 * 2 }
      >
        {
          theme.colors ?
          Array.from(theme.colors!.values()).map((color, index) => {
            return (
              <Rect 
                key={ index }
                width={width * 0.2} 
                height={height * 0.2}
                x={ (width * 0.2 + 2) * index }
                y={0}
                fill={ color.value }
                stroke="black"
                strokeWidth={0.1}
              />
            )
          }) : null
        }
      </Group>
    </Group>
  )
}