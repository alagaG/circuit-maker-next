'use client'

import { DrawScheme } from "@/lib/circuit-maker";
import { ShapeRect, drawConnection, drawCircuit } from "@/lib/circuit-maker/drawing";
import BoardStyle from "@/utils/board_style";
import { ShapeConfig } from "konva/lib/Shape";
import { Group, Shape, Text } from "react-konva";

interface CircuitProps extends ShapeConfig {
  circuit: string
  style: BoardStyle
  ioValue?: boolean
  scheme?: DrawScheme
}

export default function CircuitShape(props: CircuitProps) {
  const { circuit, stroke, ioValue: ioValue, scheme } = props
  const x = props.x ? props.x : 0
  const y = props.y ? props.y : 0
  const width = props.width ? props.width : 0
  const height = props.height ? props.height : 0

  return (
    <Group>
      <Shape 
        { ...props }
        strokeWidth={ 2.5 }
        sceneFunc={ (ctx, shape) => { drawCircuit(circuit, ctx, shape, scheme) } }
      />
      {
        ioValue !== undefined ? 
        <Text text={Number(ioValue).toString()} 
        width={ width * 0.5 }
        height={ height * 0.5 }
        x={ (x + width / 4) }
        y={ (y + height / 4) }
        align="center"
        verticalAlign="middle"
        fontSize={ height * 0.35 }
        textDecoration="bold"
        fill={ stroke ? String(stroke) : "black" }
        /> : null
      }
    </Group>
  )
}