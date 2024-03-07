import { Circle, Layer, Stage } from "react-konva";
import CircuitShape from "./circuits/circuit_shape";
import { circuitAND, inputCircuit as circuitInput, outputCircuit as circuitOutput } from "@/lib/circuit-maker/circuit";

export default function Canvas() {
  const state = {
    x: 0,
    y: 0,
    isDragging: false,
  }

  return (
    <Stage 
    x={state.x}
    y={state.y}
    width={window.innerWidth} 
    height={window.innerHeight}
    draggable
    onDragStart={() => {
      state.isDragging = true
    }}
    onDragEnd={(e) => {
      state.isDragging = false
      state.x = e.target.x()
      state.y = e.target.y()
    }}
    >
      <Layer>
        <Circle x={0} y={0} radius={20} fill="red" />
        <Circle x={0} y={window.innerHeight} radius={20} fill="red" />
        <Circle x={window.innerWidth} y={0} radius={20} fill="red" />
        <Circle x={window.innerWidth} y={window.innerHeight} radius={20} fill="red" />
      </Layer>
      <Layer>
        <CircuitShape 
          circuit={ circuitOutput }
          x={100}
          y={100}
          width={100}
          height={60}
          stroke="black"
          />
      </Layer>
    </Stage>
  )
}