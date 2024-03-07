'use client'

import { ShapeRect, drawConnection, drawGate } from "@/lib/circuit-maker/drawing";
import { Circuit } from "@/lib/circuit-maker/circuit";
import { ShapeConfig } from "konva/lib/Shape";
import { Shape } from "react-konva";

interface CircuitProps extends ShapeConfig {
  circuit: Circuit
}

export default function CircuitShape(props: CircuitProps) {
  const { circuit } = props

  return (
    <Shape 
      { ...props }
      sceneFunc={ (ctx, shape) => drawGate(circuit, ctx, shape) }
    />
  )
}