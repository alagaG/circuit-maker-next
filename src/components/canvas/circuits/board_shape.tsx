'use client'

import { RunnerResult, View } from "@/lib/circuit-maker";
import { Connection, OrderNode, circuitInput } from "@/lib/circuit-maker/circuit";
import { MutableRefObject, RefObject, useEffect, useRef, useState } from "react";
import { Circle, Group, Layer, Rect, Text } from "react-konva";
import CircuitShape from "./circuit_shape";
import { isIO, isInput } from "@/lib/circuit-maker/utils";
import { KonvaEventObject } from "konva/lib/Node";
import BoardStyle, { StyleMode } from "@/utils/board_style";
import { ShapeConfig } from "konva/lib/Shape";
import dynamic from "next/dynamic";

interface CircuitViewProps extends ShapeConfig {
  style: BoardStyle
  boardView: CircuitViewBoard
}

export interface CircuitViewBoard {
  view: View,
  runner?: RunnerResult
}

const horizontalPadding = 16
const verticalPadding = 20
const barHeight = verticalPadding
const barVerticalPadding = 2
const barHorizontalPadding = horizontalPadding / 2

export default function BoardShape({ boardView, style, x=0, y=0 }: CircuitViewProps) {
  const [ selfStyle, setSelfStyle ] = useState(BoardStyle.from(style))
  const { view, runner } = boardView
  const { type, order } = view

  if (selfStyle.theme !== style.theme) {
    setSelfStyle(BoardStyle.from(style))
  }

  const gridCellSize = style.getCellSize()
  const circuitScale = gridCellSize * 4
  const circuitWidth = circuitScale
  const circuitHeight = circuitScale * 0.6
  const circuitHorizontalGap = gridCellSize
  const circuitVerticalGap = gridCellSize

  let nodes : Map<string, OrderNode[]> = new Map() 
  let connections : Connection[] = []
  let previous = [ ...order.outputs ]
  while (previous.length > 0) {
    const current = previous.shift()!

    const typeList = nodes.has(current.type) ? nodes.get(current.type)! : []
    if (!typeList.some((n) => n.id === current.id)) typeList.push(current)
    nodes.set(current.type, typeList)

    const { previous: previousNodes } = current
    if (previousNodes !== undefined) {
      previousNodes.forEach((connection, inputPort) => {
        const { port: outputPort, node } = connection
        connections.push({
          output: {
            type: node.type,
            index: node.index,
            port: outputPort
          },
          input: {
            type: current.type,
            index: current.index,
            port: inputPort
          }
        })
        previous.push(node)
      })
    }
  }

  const orderedNodes = Array.from(nodes.values())
    .flat()
    .sort((a, b) => a.id - b.id)

  let layers : OrderNode[][] = new Array(order.depth).fill(undefined).map(() => new Array<OrderNode>())
  let currentLayerIdx = 0
  let currentLayer = layers[currentLayerIdx]
  orderedNodes.forEach((node) => {
    const connectionsAsInput = connections.filter((connection) => connection.input.type === node.type && connection.input.index === node.index)
    const connectionsAsOutput = connections.filter((connection) => connection.output.type === node.type && connection.output.index === node.index)
    
    const isInput = connectionsAsInput.length === 0
    const inWrongLayer = currentLayer.some((n) => connectionsAsInput.some((connection) => connection.output.type === n.type && connection.output.index === n.index))
    const isOutput = connectionsAsOutput.length === 0
    if (!isInput && inWrongLayer) {
      currentLayer = layers[isOutput ? (layers.length - 1) : ++currentLayerIdx]
    }
    currentLayer.push(node)
  })

  const widerLayer = layers.reduce((last, layer) => layer.length > last.length ? layer : last)

  const innerWidth = layers.length * (circuitWidth + circuitHorizontalGap) - circuitHorizontalGap
  const innerHeight = widerLayer.length * (circuitHeight + circuitVerticalGap) - circuitVerticalGap
  const width = innerWidth + horizontalPadding * 2
  const height = innerHeight + verticalPadding * 2 + barHeight

  const styleButtonsRadius = (barHeight - barVerticalPadding * 3) / 2
  const styleButtonsWidth = (styleButtonsRadius + barHorizontalPadding) * 3 + horizontalPadding + barHorizontalPadding

  const onColorRectClick = () => setSelfStyle(selfStyle.nextColor())
  const onModeRectClick = () => setSelfStyle(selfStyle.nextMode())

  return (
    <Group
      x={x}
      y={y}
    >
      <Rect 
        x={0} 
        y={0} 
        width={width} 
        height={height}
        fill={selfStyle.getBackground()}
        shadowColor={"black"}
        shadowOffsetY={ 2.5 }
        shadowBlur={ 8 }
        shadowOpacity={ 0.25 }
        cornerRadius={10}/>
      <Group
        x={horizontalPadding}
        y={verticalPadding + barHeight}>
        {
          layers.map((layer, layerIndex) => {
            return layer.map((node, nodeIndex) => {
              const leftHeight = (circuitHeight + circuitVerticalGap / layer.length) - (circuitHeight + circuitVerticalGap * (layer.length - 1))
              const y = (innerHeight / (layer.length + 1)) * (nodeIndex + 1) + leftHeight + (circuitVerticalGap * (nodeIndex - 1))
              const ioValue = isIO(node.type) ? Boolean(isInput(node.type) ? runner?.input[node.index] : runner?.output[node.index]) : undefined
              const colorScheme = selfStyle.getColorScheme()
              return (
                <CircuitShape 
                key={ node.id } 
                circuit={ node.type } 
                style={ selfStyle }
                x = { layerIndex * (circuitWidth + circuitHorizontalGap) }
                y = { y }
                width={circuitWidth}
                height={circuitHeight}
                fill={colorScheme.fill}
                stroke={colorScheme.stroke}
                strokeWidth={2}
                ioValue={ioValue}
                />
              )
            })
          })
        }
      </Group>
      <Group
        draggable
        onDragMove={(event: KonvaEventObject<DragEvent>) => {
          const { target } = event
          const parent = target.getParent()!
          parent.setPosition({
            x: Math.floor((parent.x() + target.x()) / 16) * 16,
            y: Math.floor((parent.y() + target.y()) / 16) * 16,
          })
          target.setPosition({ x: 0, y: 0 })
        }}>
        <Rect 
          x={ 0 }
          y={ 0 }
          width={ width }
          height={ barHeight }
          fill={ selfStyle.getCurrentLine() }
          shadowColor="black"
          shadowBlur={ 5 }
          shadowOpacity={ 0.3 }
          shadowOffsetY={ 2.5 }
          cornerRadius={[ 10, 10, 0, 0 ]}
        />
        <Group
          x={ horizontalPadding }
          y={ 0 }>
          <Circle 
            x={ styleButtonsRadius }
            y={ barHeight / 2 }
            radius={ styleButtonsRadius }
            fill={selfStyle.getColor()}
            onClick={onColorRectClick}
          />
          <Group
            x={ styleButtonsRadius + (barHorizontalPadding * 2) }
            y={ 0 }
            onClick={ onModeRectClick }>
            <Circle 
              x={ styleButtonsRadius }
              y={ barHeight / 2 }
              radius={ styleButtonsRadius }
              fill={selfStyle.getForeground()}
            />
            <Text 
              text={ String(selfStyle.getMode() + 1) }
              textDecoration="bold"
              x={0}
              y={ barVerticalPadding * 2}
              width={ styleButtonsRadius * 2 }
              height={ styleButtonsRadius * 2 }
              align="center"
              verticalAlign="middle"
              fill={ selfStyle.getBackground() }
            />
          </Group>
        </Group>
        <Text 
          text={`${type}${runner ? ` : ${runner.input}` : ''}`} 
          x={ styleButtonsWidth }
          y={ (verticalPadding) / 2 - 4 }
          fill={selfStyle.isLight() ? selfStyle.getBackground() : selfStyle.getBackgroundContrast() }
          fontStyle="bold"/>
      </Group>
    </Group>
  )
}