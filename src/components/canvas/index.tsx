'use client'

import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import CircuitShape from "./circuits/circuit_shape";
import { OrderNode, circuitAND, circuitBuffer, circuitInput, circuitNAND, inputCircuit as inputCircuit, outputCircuit as outputCircuit } from "@/lib/circuit-maker/circuit";
import { BoardView } from "@/lib/circuit-maker";
import BoardShape, { CircuitViewBoard } from "./circuits/board_shape";
import BoardStyle, { StyleMode } from "@/utils/board_style";
import { ComponentProps, LegacyRef, ReactElement, ReactPropTypes, useEffect, useRef, useState } from "react";
import { KonvaEventObject } from "konva/lib/Node";
import { Line as LineClass } from "konva/lib/shapes/Line";
import { Stage as StageClass } from "konva/lib/Stage";
import dynamic from "next/dynamic";

const ThemeExample = dynamic(() => import("@/components/canvas/theme"), {
  ssr: false
})

interface CanvasProps {
  style: BoardStyle
  boardView: BoardView
  showTheme?: boolean
}

export default function Canvas({ style, boardView, showTheme=false }: CanvasProps) {
  const [ size, setSize ] = useState({ x: window.innerWidth, y: window.innerHeight })
  const [ scale, setScale ] = useState(1.0)
  const viewsState : CircuitViewBoard[] = [ 
    ...boardView.views.map((view) => {
      return { view }
    }),
    ...boardView.runners.map((runner) => {
      return { view: boardView.views.find((view) => view.type === runner.type)!, runner }
    })
  ] 

  const gridCellSize = style.getCellSize()
  const scaledWidth = size.x / scale
  const scaledHeight = size.y / scale
  const columnCount = Math.floor(scaledWidth / gridCellSize)
  const lineCount = Math.floor(scaledHeight / gridCellSize)
  
  const onDragMove = (event: KonvaEventObject<DragEvent>) => {
    const target = event.currentTarget
    if (!(target instanceof StageClass)) return 

    const offset = target.getAbsolutePosition()
    const gridOffset = { 
      x: -(Math.floor(offset.x / gridCellSize) * gridCellSize),
      y: -(Math.floor(offset.y / gridCellSize) * gridCellSize)
    }
    const lineLayer = target.getChildren()[0]
    const children = lineLayer.getChildren()

    const lineEnd = gridOffset.x + scaledWidth
    for (let i=0; i<lineCount; i++) {
      const line = children[i] as LineClass
      const y = gridOffset.y + i * gridCellSize
      line.points([ gridOffset.x, y, lineEnd, y ])
      line.strokeWidth(y === 0 ? 1.0 : 0.5)
    }

    const lastColumnIndex = lineCount + columnCount
    const columnEnd = gridOffset.y + scaledHeight
    for (let i=lineCount; i<lastColumnIndex; i++) {
      const column = children[i] as LineClass
      const x = gridOffset.x + (i - lineCount) * gridCellSize
      column.points([ x, gridOffset.y, x, columnEnd ])
      column.strokeWidth(x === 0 ? 1.0 : 0.5)
    }
  }

  const onWheel = (event: KonvaEventObject<WheelEvent>) => {
    const target = event.currentTarget
    if (!(target instanceof StageClass)) return

    const zoomStep = 0.1 * -Math.sign(event.evt.deltaY)
    const zoomLimit = style.getZoomLimit()
    setScale(Math.min(zoomLimit.max, Math.max(zoomLimit.min, scale + zoomStep)))
  }

  useEffect(() => {
    console.log(scale)
    window.addEventListener('resize', (event: UIEvent) => {
      setSize({ x: window.innerWidth, y: window.innerHeight })
    })
  })

  return (
    <Stage
      width={scaledWidth * scale} 
      height={scaledHeight * scale}
      scaleX={scale}
      scaleY={scale}
      draggable
      onDragMove={ onDragMove }
      onWheel={ onWheel }
    >
      <Layer>
        {
          new Array(lineCount).fill(0).map((_, index) => {
            const y = index * gridCellSize
            return (
              <Line
                key={ `LINE-${index}` }
                points={ [0, y, size.x, y] }
                stroke={ style.getCurrentLine() }
                strokeWidth={0.5}
              />
            )
          })
        }
        {
          new Array(columnCount).fill(0).map((_, index) => {
            const x = index * gridCellSize
            return (
              <Line
                key={ `COLUMN-${index}` }
                points={ [x, 0, x, size.y] }
                stroke={ style.getCurrentLine() }
                strokeWidth={0.5}
              />
            )
          })
        }
      </Layer>
      <Layer>
        {
          viewsState.map((viewState, index) => {
            return <BoardShape 
              key={ `VIEW-${index}` } style={style} boardView={viewState} 
              y={ index * gridCellSize * 2 }
            />
          })
        }
      </Layer>
      <Layer>
        { showTheme ? <ThemeExample theme={style.theme} x={0} y={0} width={gridCellSize * 8} height={gridCellSize * 8} /> : null }
      </Layer> 
    </Stage>
  )
}