import { Context } from "konva/lib/Context";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { Circuit, LogicGate, SimpleCircuit, circuitBuffer, circuitNAND, circuitNOR, circuitNOT, circuitOutput, circuitXNOR, circuitInput, logicGateAND, logicGateBuffer, logicGateNAND, logicGateNOR, logicGateNOT, logicGateOR, logicGateXNOR, logicGateXOR } from "./circuit";
import { isNegativeLogicGateType } from "./utils";
import { DrawScheme } from ".";
import { Vector2d } from "konva/lib/types";

const ioWidthPercent = 0.2
const bodyWidthPercent = 0.6

interface CircuitDrawFunction {
  (context: Context, shape: Shape<ShapeConfig>, negate: boolean): void
}

interface IORect {
  width: number
  height: number
}

function drawInterface(context: Context, shape: Shape<ShapeConfig>, rect: IORect, io: 'INPUT'|'OUTPUT'|'NOT_OUTPUT') {
  const { width, height } = rect
  const ioWidth = Math.ceil(width * ioWidthPercent)
  const bodyYMiddle = Math.floor(height * 0.5)
  const bodyRectXEnd = Math.floor(width * (bodyWidthPercent + ioWidthPercent))

  switch (io) {
    case 'INPUT':
      context.moveTo(0, bodyYMiddle)
      context.lineTo(ioWidth, bodyYMiddle)
      break
    case 'OUTPUT':
      context.moveTo(bodyRectXEnd, bodyYMiddle)
      context.lineTo(Math.floor(bodyRectXEnd + ioWidth), bodyYMiddle)
      break
    case 'NOT_OUTPUT':
      const ioHalfWidth = ioWidth * 0.5
      const notRadius = ioHalfWidth * 0.5
      const outputBeginning = bodyRectXEnd + ioHalfWidth
      
      context.moveTo(bodyRectXEnd + ioHalfWidth, bodyYMiddle)
      context.arc(bodyRectXEnd + notRadius, bodyYMiddle, notRadius, 0, Math.PI * 2)
      context.moveTo(outputBeginning, bodyYMiddle)
      context.lineTo(outputBeginning + ioHalfWidth, bodyYMiddle)
  }
  context.strokeShape(shape)
}

export function drawIO(context: Context, shape: Shape<ShapeConfig>, negate: boolean = false) {
  const { width, height } = shape.getSelfRect() 

  const bodyX = width * ioWidthPercent
  const bodyY = 0
  const bodyWidth = width * bodyWidthPercent
  const bodyHeight = height

  const bodyMiddleX = bodyX + bodyWidth * 0.5
  const bodyMiddleY = bodyY + bodyHeight * 0.5
  const bodyRectXEnd = bodyX + bodyWidth
  const bodyRectYEnd = bodyY + bodyHeight
  context.beginPath()
  context.moveTo(bodyMiddleX, bodyY)
  context.lineTo(bodyX, bodyMiddleY)
  context.lineTo(bodyMiddleX, bodyRectYEnd)
  context.lineTo(bodyRectXEnd, bodyMiddleY)
  context.closePath()
  context.fillStrokeShape(shape)

  drawInterface(context, shape, { width, height }, negate ? 'INPUT' : 'OUTPUT')
}

export function drawBuffer(context: Context, shape: Shape<ShapeConfig>, negate: boolean = false) {
  const { width, height } = shape.getSelfRect() 

  const bodyX = Math.floor(width * ioWidthPercent)
  const bodyY = 0
  const bodyWidth = Math.floor(width * bodyWidthPercent)
  const bodyHeight = height

  context.beginPath()
  context.moveTo(bodyX, bodyY)
  context.lineTo(bodyX, bodyY + bodyHeight)
  context.lineTo(bodyX + bodyWidth, Math.floor(bodyY + bodyHeight * 0.5))
  context.closePath()
  context.fillStrokeShape(shape)

  drawInterface(context, shape, { width, height }, 'INPUT')
  drawInterface(context, shape, { width, height }, negate ? 'NOT_OUTPUT' : 'OUTPUT')
}

export function drawAND(context: Context, shape: Shape<ShapeConfig>, negate: boolean = false) {
  const rect = shape.getSelfRect() 
  const { width, height } = rect

  const bodyX = width * ioWidthPercent
  const bodyY = 0
  const bodyWidth = width * bodyWidthPercent
  const bodyHeight = height

  const bodyXMiddle = bodyX + bodyWidth * 0.5
  const bodyYMiddle = bodyY + bodyHeight * 0.5
  const bodyRectXEnd = bodyX + bodyWidth
  const bodyRectYEnd = bodyY + bodyHeight
  const bodyXCurve = bodyX + bodyWidth * 0.975

  context.beginPath()
  context.moveTo(bodyX, bodyY)
  context.lineTo(bodyX, bodyRectYEnd)
  context.lineTo(bodyXMiddle, bodyRectYEnd)
  context.bezierCurveTo(bodyXMiddle, bodyRectYEnd, bodyXCurve, bodyRectYEnd - 5, bodyRectXEnd, bodyYMiddle)
  context.bezierCurveTo(bodyRectXEnd, bodyYMiddle, bodyXCurve, bodyY + 5, bodyXMiddle, bodyY)
  context.closePath()
  context.fillStrokeShape(shape)

  drawInterface(context, shape, { width, height: height * 0.5 }, 'INPUT')
  drawInterface(context, shape, { width, height: height * 1.5 }, 'INPUT')
  drawInterface(context, shape, { width, height }, negate ? 'NOT_OUTPUT' : 'OUTPUT')
}

export function drawOR(context: Context, shape: Shape<ShapeConfig>, negate: boolean = false) {
  const { width, height } = shape.getSelfRect() 

  const bodyX = width * ioWidthPercent
  const bodyY = 0
  const bodyWidth = width * bodyWidthPercent
  const bodyHeight = height

  const bodyXMiddle = bodyX + bodyWidth * 0.5
  const bodyYMiddle = bodyY + bodyHeight * 0.5
  const bodyRectXEnd = bodyX + bodyWidth
  const bodyRectYEnd = bodyY + bodyHeight
  const bodyCurveMiddle = bodyX + bodyWidth * 0.15
  const bodyCurveEnd = bodyX + bodyWidth * 0.3

  context.beginPath()
  context.moveTo(bodyX, bodyY)
  context.bezierCurveTo(bodyX, bodyY, bodyCurveMiddle, bodyY + 5, bodyCurveEnd, bodyYMiddle)
  context.bezierCurveTo(bodyCurveEnd, bodyYMiddle, bodyCurveMiddle, bodyRectYEnd - 5, bodyX, bodyRectYEnd)
  context.bezierCurveTo(bodyX, bodyRectYEnd, bodyXMiddle, bodyRectYEnd + 5, bodyRectXEnd, bodyYMiddle)
  context.bezierCurveTo(bodyRectXEnd, bodyYMiddle, bodyXMiddle, bodyY - 5, bodyX, bodyY)
  context.closePath()
  context.fillStrokeShape(shape)

  const inputWidth = width * 1.58
  drawInterface(context, shape, { width: inputWidth, height: height * 0.5 }, 'INPUT')
  drawInterface(context, shape, { width: inputWidth, height: height * 1.5 }, 'INPUT')
  drawInterface(context, shape, { width, height }, negate ? 'NOT_OUTPUT' : 'OUTPUT')
}

export function drawXOR(context: Context, shape: Shape<ShapeConfig>, negate: boolean = false) {
  const { width, height } = shape.getSelfRect() 

  const bodyX = width * ioWidthPercent
  const bodyY = 0
  const bodyWidth = width * bodyWidthPercent
  const bodyHeight = height

  const bodyXMiddle = bodyX + bodyWidth * 0.5
  const bodyYMiddle = bodyY + bodyHeight * 0.5
  const bodyRectXEnd = bodyX + bodyWidth
  const bodyRectYEnd = bodyY + bodyHeight
  const bodyCurveMiddle = bodyX + bodyWidth * 0.15
  const bodyCurveEnd = bodyX + bodyWidth * 0.3

  context.beginPath()
  context.moveTo(bodyX, bodyY)
  context.bezierCurveTo(bodyX, bodyY, bodyCurveMiddle, bodyY + 5, bodyCurveEnd, bodyYMiddle)
  context.bezierCurveTo(bodyCurveEnd, bodyYMiddle, bodyCurveMiddle, bodyRectYEnd - 5, bodyX, bodyRectYEnd)
  context.bezierCurveTo(bodyX, bodyRectYEnd, bodyXMiddle, bodyRectYEnd + 5, bodyRectXEnd, bodyYMiddle)
  context.bezierCurveTo(bodyRectXEnd, bodyYMiddle, bodyXMiddle, bodyY - 5, bodyX, bodyY)
  context.closePath()
  context.fillStrokeShape(shape)

  const lineX = bodyX * 0.5
  const lineY = bodyY * 0.5
  const lineCurveMiddle = bodyCurveMiddle - lineX
  const lineCurveEnd = bodyCurveEnd - lineX
  context.moveTo(lineX, lineY)
  context.bezierCurveTo(lineX, lineY, lineCurveMiddle, bodyY + 5, lineCurveEnd, bodyYMiddle)
  context.bezierCurveTo(lineCurveEnd, bodyYMiddle, lineCurveMiddle, bodyRectYEnd - 5, lineX, bodyRectYEnd)
  context.strokeShape(shape)

  const inputWidth = width * 1.58
  drawInterface(context, shape, { width: inputWidth, height: height * 0.5 }, 'INPUT')
  drawInterface(context, shape, { width: inputWidth, height: height * 1.5 }, 'INPUT')
  drawInterface(context, shape, { width, height }, negate ? 'NOT_OUTPUT' : 'OUTPUT')
}

export function drawComplex(context: Context, shape: Shape<ShapeConfig>, scheme: DrawScheme) {
  const { width, height } = shape.getSelfRect() 

  const bodyX = width * ioWidthPercent
  const bodyY = 0
  const bodyWidth = width * bodyWidthPercent
  const bodyHeight = height

  const bodyRectXEnd = bodyX + bodyWidth
  const bodyRectYEnd = bodyY + bodyHeight
  context.beginPath()
  context.moveTo(bodyX, bodyY)
  context.lineTo(bodyX, bodyRectYEnd)
  context.lineTo(bodyRectXEnd, bodyRectYEnd)
  context.lineTo(bodyRectXEnd, bodyY)
  context.closePath()
  context.fillStrokeShape(shape)

  const { input, output } = scheme
  const inputHeight = height / input
  for(let i=0; i<input; i++) {
    drawInterface(context, shape, { width, height: inputHeight * (1 + i * input) }, 'INPUT')
  }

  for(let i=0; i<output; i++) {
    drawInterface(context, shape, { width, height: inputHeight * (1 + i * output) }, 'OUTPUT')
  }
}

export function drawCircuit(circuit: Circuit|string, context: Context, shape: Shape<ShapeConfig>, scheme?: DrawScheme) {
  if (scheme) return drawComplex(context, shape, scheme)

  const type = circuit instanceof Circuit ? circuit.getType() : circuit as string
  const negate = isNegativeLogicGateType(type)

  let drawFunction : CircuitDrawFunction|undefined = undefined
  switch (type) {
    case circuitInput.getType():
    case circuitOutput.getType():
      drawFunction = drawIO
      break
    case logicGateBuffer.type:
    case logicGateNOT.type:
      drawFunction = drawBuffer
      break
    case logicGateOR.type:
    case logicGateNOR.type:
      drawFunction = drawOR
      break
    case logicGateAND.type:
    case logicGateNAND.type:
      drawFunction = drawAND
      break
    case logicGateXOR.type:
    case logicGateXNOR.type:
      drawFunction = drawXOR
      break
  }

  if (drawFunction !== undefined) drawFunction(context, shape, negate)
}

export interface ShapeRect {
  x: number
  y: number
  width: number
  height: number
}

export function drawConnection(context: Context, shape: Shape<ShapeConfig>, divisions: [ number, number ][]) {
  const width = shape.width()
  const height = shape.height()

  let lastPosition = [ 0, 0 ]
  context.moveTo(0, 0)
  divisions.concat([[ 1, 1 ]]).forEach(([ x, y ]) => {
    const [ lastX, lastY ] = lastPosition
    const newX = width * x
    const newY = height * y
    context.lineTo(newX, lastY)
    context.lineTo(newX, newY)
    lastPosition = [ newX, newY ]
  })
  context.strokeShape(shape)
}