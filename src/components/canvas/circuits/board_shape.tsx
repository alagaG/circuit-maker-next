'use client'

import { RunnerResult, View } from "@/lib/circuit-maker";
import { Connection, OrderNode } from "@/lib/circuit-maker/circuit";
import { MutableRefObject, RefObject, useEffect, useRef, useState } from "react";
import { Circle, Group, Layer, Rect, Shape, Text } from "react-konva";
import CircuitShape from "./circuit_shape";
import { getSimpleTypeInput, isIO, isInput, isSimpleType } from "@/lib/circuit-maker/utils";
import { KonvaEventObject } from "konva/lib/Node";
import BoardStyle, { StyleMode } from "@/utils/board_style";
import { ShapeConfig } from "konva/lib/Shape";
import dynamic from "next/dynamic";
import { drawConnection } from "@/lib/circuit-maker/drawing";

interface CircuitViewProps extends ShapeConfig {
  style: BoardStyle
  boardView: CircuitViewBoard
}

export interface CircuitViewBoard {
  view: View,
  runner?: RunnerResult
}

const innerHorizontalMargin = 16
const innerVerticalMargin = 20
const barHeight = innerVerticalMargin
const barVerticalPadding = 2
const barHorizontalPadding = innerHorizontalMargin / 2

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
  const circuitHeight = Math.floor(circuitScale * 0.6)
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
      previousNodes.forEach((connection, index) => {
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
            port: index
          }
        })
        previous.push(node)
      })
    }
  }

  const orderedNodes = Array.from(nodes.values())
    .flat()
    .sort((a, b) => a.id - b.id)

  let layers : OrderNode[][] = new Array([], [], [])
  let currentLayer = layers[0]
  orderedNodes.forEach((node) => {
    const connectionsAsInput = connections.filter((connection) => connection.input.type === node.type && connection.input.index === node.index)
    const connectionsAsOutput = connections.filter((connection) => connection.output.type === node.type && connection.output.index === node.index)
    
    const isInput = connectionsAsInput.length === 0
    const isOutput = connectionsAsOutput.length === 0
    
    if (isInput) currentLayer = layers[0]
    else if (isOutput) currentLayer = layers[layers.length - 1]
    else { 
      currentLayer = layers[layers.length - 2]
      const inWrongLayer = currentLayer.some((n) => connectionsAsInput.some((connection) => connection.output.type === n.type && connection.output.index === n.index))
      if (inWrongLayer) {
        currentLayer = []
        layers.push(layers[layers.length - 1])
        layers[layers.length - 2] = currentLayer
      }
    }

    currentLayer.push(node)
  })

  const widerLayer = layers.reduce((last, layer) => layer.length > last.length ? layer : last)
  const widerLayerLength = widerLayer.length 
  const layersLength = layers.length
  
  const layersWidth = layersLength * (circuitWidth + circuitHorizontalGap) - circuitHorizontalGap
  const layersHeight = widerLayerLength * (circuitHeight + circuitVerticalGap) - circuitVerticalGap
  const layersLeftWidth = gridCellSize - (layersWidth % gridCellSize)
  const innerWidth = layersWidth + layersLeftWidth
  const innerHeight = layersHeight + gridCellSize - (layersHeight % gridCellSize)

  const layersData = layers.map((layer, layerIndex) => {
    const layerHeight = layer.length * (circuitHeight + circuitVerticalGap) - circuitVerticalGap
    return {
      x: layerIndex * (circuitWidth + circuitHorizontalGap),
      height: layerHeight,
      leftHeight: layersHeight - layerHeight,
      gapCount: layer.length - 1,
    }
  })

  const horizontalPadding = innerHorizontalMargin * 2
  const verticalPadding = innerVerticalMargin * 2 + barHeight
  const fixedHorizontalPadding = horizontalPadding + gridCellSize - (horizontalPadding % gridCellSize)
  const fixedVerticalPadding = verticalPadding + gridCellSize - (verticalPadding % gridCellSize)
  const width = innerWidth + fixedHorizontalPadding
  const height = innerHeight + fixedVerticalPadding

  const colorScheme = selfStyle.getColorScheme()

  const styleButtonsRadius = (barHeight - barVerticalPadding * 3) / 2
  const styleButtonsWidth = (styleButtonsRadius + barHorizontalPadding) * 3 + innerHorizontalMargin + barHorizontalPadding
  
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
        x={(fixedHorizontalPadding + layersLeftWidth) / 2}
        y={fixedVerticalPadding}>
        {
          layers.map((layer, layerIndex) => {
            const { x, leftHeight } = layersData[layerIndex] 
            return layer.map((node, nodeIndex) => {
              const y = nodeIndex * (circuitHeight + circuitVerticalGap) - circuitVerticalGap + (leftHeight / 2)
              const ioValue = isIO(node.type) ? Boolean(isInput(node.type) ? runner?.input[node.index] : runner?.output[node.index]) : undefined              
              return (
                  <CircuitShape 
                    key={ node.id } 
                    circuit={ node.type } 
                    style={ selfStyle }
                    x = { x }
                    y = { y }
                    width={circuitWidth}
                    height={circuitHeight}
                    fill={colorScheme.fill}
                    stroke={colorScheme.stroke}
                    strokeWidth={2}
                    ioValue={ioValue}
                    scheme={view.schemas.get(node.type)}
                  />
              )
            })
          })
        }
      </Group>
      <Group
        x={(fixedHorizontalPadding + layersLeftWidth) / 2}
        y={fixedVerticalPadding}>
        {
          connections.map((connection, index) => {
            const { output, input } = connection
            const { type:outputType, index:outputIndex, port:outputPort } = output
            const { type:inputType, index:inputIndex, port:inputPort } = input

            const outputLayerIndex = layers.findIndex((layer) => layer.some((node) => node.type === outputType && node.index === outputIndex))
            const inputLayerIndex = layers.findIndex((layer) => layer.some((node) => node.type === inputType && node.index === inputIndex))
            const outputLayer = layers[outputLayerIndex]
            const inputLayer = layers[inputLayerIndex]
            const outputLayerData = layersData[outputLayerIndex]
            const inputLayerData = layersData[inputLayerIndex]
            const outputIndexInLayer = outputLayer.findIndex((node) => node.type === outputType && node.index === outputIndex)
            const inputIndexInLayer = inputLayer.findIndex((node) => node.type === inputType && node.index === inputIndex)

            const outputPortCount = isSimpleType(outputType) ? 1 : view.schemas.get(outputType)!.output
            const inputPortCount = isSimpleType(inputType) ? getSimpleTypeInput(inputType) : view.schemas.get(inputType)!.input
            const outputCircuitY = outputIndexInLayer * (circuitHeight + circuitVerticalGap) - circuitVerticalGap + (outputLayerData.leftHeight / 2)
            const inputCircuitY = inputIndexInLayer * (circuitHeight + circuitVerticalGap) - circuitVerticalGap   + (inputLayerData.leftHeight / 2)

            const outputX = outputLayerData.x + circuitWidth + 2
            const outputLeftHeight = circuitHeight / (2 * outputPortCount)
            const outputY = outputCircuitY + (circuitHeight / (2 * outputPortCount) * (outputPort)) + (outputLeftHeight * outputPort) + outputLeftHeight
            const inputLeftHeight = circuitHeight / (2 * inputPortCount)
            const inputX = circuitHorizontalGap + (circuitHorizontalGap + circuitWidth) * (inputLayerIndex - outputLayerIndex - 1) - 4
            const inputY = -outputY + inputCircuitY + (circuitHeight / (2 * inputPortCount) * (inputPort)) + (inputLeftHeight * inputPort) + inputLeftHeight
            
            const blockingLayers = layers
              .filter((_, index) => index > outputLayerIndex && index < inputLayerIndex)
            const hasBlockingLayer = blockingLayers.length > 0
            let divisions : [ number, number ][] = []
            if (hasBlockingLayer) {
              let lastBlocker = inputLayer
              blockingLayers.forEach((blocker, index) => {
                const blockerStartPosition = circuitHorizontalGap / 2 + (circuitWidth + circuitHorizontalGap) * index
                const blockerEndPosition = blockerStartPosition + circuitWidth + (circuitHorizontalGap) * (index + 1)
                const blockerStart = blockerStartPosition / inputX
                const blockerEnd = blockerEndPosition / inputX
                const blockerPassage = blocker.length >= lastBlocker.length ? blocker.length / (lastBlocker.length + 1) : 1
                divisions.push([ blockerStart, blockerPassage ], [ blockerEnd, blockerPassage ])
                lastBlocker = blocker
              })
              divisions.push([ divisions[divisions.length - 1][0], 1 ])
            } else {
              divisions.push(
                [ 0.5, 0 ],
                [ 0.5, 1 ]
              )
            }

            return (
              <Shape 
                key={index}
                x={outputX}
                y={outputY}
                width={inputX}
                height={inputY}
                sceneFunc={ (ctx, shape) => drawConnection(ctx, shape, divisions) }
                stroke={colorScheme.stroke}
                strokeWidth={2}
              />
            )
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
          x={ innerHorizontalMargin }
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
          y={ (innerVerticalMargin) / 2 - 4 }
          fill={selfStyle.isLight() ? selfStyle.getBackground() : selfStyle.getBackgroundContrast() }
          fontStyle="bold"/>
      </Group>
    </Group>
  )
}