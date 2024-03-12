import { Circuit, CircuitIOCredential, LogicGate, OrderGraph, OrderNode, circuitAND, circuitBuffer, circuitInput, circuitNAND, circuitNOR, circuitNOT, circuitOR, circuitOutput, circuitXNOR, circuitXOR, defaultCircuits, logicGateAND, logicGateBuffer, logicGateInput, logicGateNAND, logicGateNOR, logicGateNOT, logicGateOR, logicGateOutput, logicGateXNOR, logicGateXOR } from "./circuit"

export const positiveLogicGates = [
  logicGateInput, logicGateBuffer, logicGateAND, logicGateOR, logicGateXOR
]
export const negativeLogicGates = [
  logicGateOutput, logicGateNOT, logicGateNAND, logicGateNOR, logicGateXNOR
]

export const positiveCircuits = [
  circuitInput, circuitBuffer, circuitAND, circuitOR, circuitXOR
]
export const negativeCircuits = [
  circuitOutput, circuitNOT, circuitNAND, circuitNOR, circuitXNOR
]

export function printOrderTree(treeRoot: OrderNode[]) {
	let queue : OrderNode[][] = []
	let next : OrderNode[] = []
	console.log(">", treeRoot.map(n => `${n.type}#${n.index}`))
	treeRoot.forEach((n) => {
		if (n.previous) next.push(...n.previous.map(n => n.node))
	})
	queue.push(next)
	while(queue.length > 0) {
		const current = queue.shift()!
		console.log(">", current.map(n => `${n.type}#${n.index}`))
		next = []
		current.forEach((n) => {
			if (n.previous) next.push(...n.previous.map(n => n.node))
		})
		if (next.length > 0) queue.push(next)
	}
}

export function isInput(type: string): boolean {
  return circuitInput.getType() === type
}

export function isOutput(type: string): boolean {
  return circuitOutput.getType() === type
}

export function isIO(type: string): boolean {
  return isInput(type) || isOutput(type)
}

export function isNegativeLogicGateType(type: string): boolean {
  return !positiveLogicGates.some((gate) => gate.type === type)
}

export function isNegativeLogicGate(logicGate: LogicGate): boolean {
  return !positiveLogicGates.some((gate) => gate.type === logicGate.type)
}

export function isNegativeCircuit(circuit: Circuit): boolean {
  return !positiveCircuits.some((positiveCircuit) => positiveCircuit.hasSameType(circuit))
}

export function isSimpleType(type: string): boolean {
  return defaultCircuits.some((circuit) => circuit.getType() === type)
}

export function getSimpleTypeInput(type: string): number {
  return defaultCircuits.find((circuit) => circuit.getType() === type)?.getGate().inputSize ?? 0
}

const circuitNameRegex = /(\w+)#(\d+)(?:-(\d+))?/
export function matchCircuitName(name:string): RegExpMatchArray|null {
  return name.match(circuitNameRegex)
}

export function isCircuitName(name:string): boolean {
  return name.match(circuitNameRegex) !== null
}

export function parseCircuitName(name:string): CircuitIOCredential|undefined {
  const match : (string | number)[]|undefined = name.match(circuitNameRegex)?.map((groupValue, index) => {
    switch(index){
      case 2: return parseInt(groupValue)
      case 3: return parseInt(groupValue) || 0
      default: return groupValue
    }
  })
  return match ? { type: match[1] as string, index: match[2] as number, port: match[3] as number } : undefined 
}

export function isDefaultCircuit(name: string): boolean {
  return defaultCircuits.map((circuit) => circuit.getGate().type).includes(name)
}