import { Context } from "konva/lib/Context";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { Circuit, LogicGate, SimpleCircuit, circuitBuffer, circuitInput, circuitNAND, circuitNOR, circuitNOT, circuitOutput, circuitXNOR, inputCircuit, logicGateAND, logicGateBuffer, logicGateNAND, logicGateNOR, logicGateNOT, logicGateOR, logicGateXNOR, logicGateXOR, outputCircuit } from "./circuit";
import { isNegativeLogicGateType } from "./utils";

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
  const ioWidth = width * ioWidthPercent
  const bodyYMiddle = height * 0.5
  const bodyRectXEnd = width * (bodyWidthPercent + ioWidthPercent)

  switch (io) {
    case 'INPUT':
      context.moveTo(0, bodyYMiddle)
      context.lineTo(ioWidth, bodyYMiddle)
      break
    case 'OUTPUT':
      context.moveTo(bodyRectXEnd, bodyYMiddle)
      context.lineTo(bodyRectXEnd + ioWidth, bodyYMiddle)
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

  const bodyRectXEnd = bodyX + bodyWidth
  const bodyRectYEnd = bodyY + bodyHeight
  context.beginPath()
  context.moveTo(bodyX, bodyY)
  context.lineTo(bodyX, bodyRectYEnd)
  context.lineTo(bodyRectXEnd, bodyRectYEnd)
  context.lineTo(bodyRectXEnd, bodyY)
  context.closePath()
  context.fillStrokeShape(shape)

  drawInterface(context, shape, { width, height }, negate ? 'INPUT' : 'OUTPUT')
}

export function drawBuffer(context: Context, shape: Shape<ShapeConfig>, negate: boolean = false) {
  const { width, height } = shape.getSelfRect() 

  const bodyX = width * ioWidthPercent
  const bodyY = 0
  const bodyWidth = width * bodyWidthPercent
  const bodyHeight = height

  context.beginPath()
  context.moveTo(bodyX, bodyY)
  context.lineTo(bodyX, bodyY + bodyHeight)
  context.lineTo(bodyX + bodyWidth, bodyY + bodyHeight * 0.5)
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

export function drawGate(circuit: Circuit|string, context: Context, shape: Shape<ShapeConfig>) {
  const type = circuit instanceof Circuit ? circuit.getType() : circuit
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

export function drawConnection(context: Context, rect: ShapeRect) {
  const { x, y, width, height } = rect

  const middleLineX = x + width * 0.5
  const lineRectYEnd = y + height

  context.beginPath()
  context.moveTo(x, y)
  context.lineTo(middleLineX, y)
  context.lineTo(middleLineX, lineRectYEnd)
  context.lineTo(x, lineRectYEnd)
  context.closePath()
  context.stroke()
}