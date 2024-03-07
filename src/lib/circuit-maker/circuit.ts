export interface CircuitIO {
	executed: boolean
	value: boolean
} 

export interface CircuitIOAccess {
	(): CircuitIO
}

export interface ExecutionOptions {
	step?: boolean
}

export const defaultOptions : ExecutionOptions = {
	step: false
}

export abstract class Circuit {
	protected processInput: CircuitIOAccess[]
	protected processOutput: CircuitIO[]
	protected executed: boolean
	public id : number
	public index : number

	constructor() {
		this.id = -1
		this.index = 0
		this.processInput = []
		this.processOutput = []
		this.executed = false
	}

	abstract execute(options?: ExecutionOptions) : void

	abstract getOrderTree(): OrderTreeNode[]

	abstract getInputSize(): number

	abstract getOutputSize(): number

  abstract getType(): string

	setInput(index: number, value: CircuitIOAccess) {
		this.processInput[index] = value
	}

	setInputs(values: CircuitIOAccess[]) {
		values.forEach((value, index) => {
			this.processInput[index] = value
		})
	}

	setInputValues(inputs: boolean[]): void {
		inputs.forEach((inputValue, index) => {
			const input = this.processInput[index]()
			input.executed = true
			input.value = inputValue
		})
	}

	abstract hasSameType(other: Circuit): boolean

	getOutput(index: number = 0): CircuitIO {
		return this.processOutput[index]
	}

	getOutputs(): CircuitIO[] {
		return [...this.processOutput]
	}

	isComplex(): boolean {
		return false 
	}

	createInput() : IOCircuit {
		return inputCircuit.clone() as IOCircuit
	}

	createOutput() : IOCircuit {
		return outputCircuit.clone() as IOCircuit
	}

	isReady(): boolean {
		return this.executed
	}

	getIOData(): string {
		return "INPUT\n"+
		this.processInput.map((access) => { 
			const input = access()
			return `{ executed: ${input.executed}, value: ${input.value} }`
		 })+"\n"+
		"OUTPUT\n"+
		this.processOutput.map((output) => {
			return `{ executed: ${output.executed}, value: ${output.value} }`
		})
	}

	getIdentification(): string {
		return `${this.getType()}#${this.index}`
	}

	compareIO(): boolean {
		return this.processInput[0]() === this.processOutput[0]
	}

	abstract clone(): Circuit
}

export class IOCircuit extends Circuit {
	private io: boolean

	constructor(io: boolean|number) {
		super()
		this.io = Boolean(io)
		this.processOutput = [ { executed: false, value: Boolean(0) } ]
		this.processInput = [ () => this.processOutput[0] ]
	}

	execute(): void {
		const { executed:inExecuted, value:inValue } = this.processInput[0]()
		if (!inExecuted) return
		this.processOutput[0].executed = inExecuted
		this.processOutput[0].value = inValue
		this.executed = inExecuted
	}

	getOrderTree(): OrderTreeNode[] {
		return [ { 
			instance: {
				id: this.id,
				index: this.index,
				type: this.getType()
			}
		} ]
	}

	hasSameType(other: Circuit): boolean {
		return other instanceof IOCircuit && this.isInput() === other.isInput()
	}

  getType(): string {
		return this.isInput() ? 'Input' : 'Output' 
	}

	getInputSize(): number {
		return 1
	}

	getOutputSize(): number {
		return 1
	}

	isInput(): boolean {
		return this.io
	}

	isOutput(): boolean {
		return !this.io
	}

	clone(): IOCircuit {
		return new IOCircuit(this.io)
	}

}

export const inputCircuit = new IOCircuit(1)
export const outputCircuit = new IOCircuit(0)

export interface LogicGateFunction {
	(...input: boolean[]) : boolean
}

export const logicBuffer : LogicGateFunction = (a: boolean) => a
export const logicNOT : LogicGateFunction = (a: boolean) => !a
export const logicAND : LogicGateFunction = (a: boolean, b: boolean) => a && b
export const logicNAND : LogicGateFunction = (a: boolean, b: boolean) => !(a && b)
export const logicOR : LogicGateFunction = (a: boolean, b: boolean) => a || b
export const logicNOR : LogicGateFunction = (a: boolean, b: boolean) => !(a || b)
export const logicXOR : LogicGateFunction = (a: boolean, b: boolean) => !(a && b) && (a || b)
export const logicXNOR : LogicGateFunction = (a: boolean, b: boolean) => !(!(a && b) && (a || b))

export interface LogicGate {
	readonly type: string
	readonly inputSize: number
	readonly process: LogicGateFunction
}

export const logicGateBuffer : LogicGate = { type: "Buffer", inputSize: 1, process: logicBuffer }
export const logicGateNOT : LogicGate = { type: "NOT", inputSize: 1, process: logicNOT }
export const logicGateAND : LogicGate = { type: "AND", inputSize: 2, process: logicAND }
export const logicGateNAND : LogicGate = { type: "NAND", inputSize: 2, process: logicNAND }
export const logicGateOR : LogicGate = { type: "OR", inputSize: 2, process: logicOR }
export const logicGateNOR : LogicGate = { type: "NOR", inputSize: 2, process: logicNOR }
export const logicGateXOR : LogicGate = { type: "XOR", inputSize: 2, process: logicXOR }
export const logicGateXNOR : LogicGate = { type: "XNOR", inputSize: 2, process: logicXNOR }

export interface Connection {
	readonly output: CircuitIOCredential
	readonly input: CircuitIOCredential
}

export class SimpleCircuit extends Circuit {
	private gate : LogicGate

	constructor(gate: LogicGate) {
		super()
		this.gate = gate
		this.processInput = new Array<CircuitIOAccess>(gate.inputSize).fill(() => inputCircuit.clone().getOutput())
		this.processOutput = new Array<CircuitIO>(1).fill(outputCircuit.clone().getOutput())
	}

	execute(options?: ExecutionOptions) : void {
		const { step:steps } = options || defaultOptions

		this.processOutput[0].value = this.gate.process(...this.processInput.map((access) => access().value))
		this.executed = this.processInput.every((access) => access().executed )
		this.processOutput[0].executed = this.executed
		if (this.executed && steps) console.log(`${this.getType()} | (${this.processInput.map(i => Number(i().value))}) > (${this.getOutputs().map(o => Number(o.value))})`)
	}

	getOrderTree(): OrderTreeNode[] {
		return [ { 
			instance: {
			id: this.id,
			index: this.index,
			type: this.getType()
		} } ]
	}

	hasSameType(other: Circuit): boolean {
		return other instanceof SimpleCircuit && this.gate.type === other.gate.type
	}

	getGate(): LogicGate {
		return this.gate
	}

  getType(): string {
		return this.gate.type
	}

	getInputSize(): number {
		return this.gate.inputSize
	}

	getOutputSize(): number {
		return 1
	}

	clone(): SimpleCircuit {
		return new SimpleCircuit(this.gate)
	}

}

export const circuitBuffer = new SimpleCircuit(logicGateBuffer)
export const circuitNOT = new SimpleCircuit(logicGateNOT)
export const circuitAND = new SimpleCircuit(logicGateAND)
export const circuitNAND = new SimpleCircuit(logicGateNAND)
export const circuitOR = new SimpleCircuit(logicGateOR)
export const circuitNOR = new SimpleCircuit(logicGateNOR)
export const circuitXOR = new SimpleCircuit(logicGateXOR)
export const circuitXNOR = new SimpleCircuit(logicGateXNOR)
export const defaultCircuits = [
  circuitBuffer, circuitNOT, circuitAND, circuitNAND,
  circuitOR, circuitNOR, circuitXOR, circuitXNOR
]

export default class Board {
	private readonly simpleCircuitsList : Map<string, SimpleCircuit>
	private readonly complexCircuitsList : Map<string, ComplexCircuit>
	private readonly builders : Map<string, CircuitSchema>

	constructor(builders: Map<string, CircuitSchema>) {
		this.builders = builders
		this.simpleCircuitsList = new Map<string, SimpleCircuit>(defaultCircuits.map((circuit) => [ circuit.getGate().type, circuit ]))
        
		this.complexCircuitsList = new Map()
		builders.forEach((schema) => {
			this.complexCircuitsList.set(schema.type, new ComplexCircuit(this, schema))
		})
	}

	run(id: string, input: boolean[]|number[], options?: ExecutionOptions): number[] {
		const circuit = this.getCircuitCopy(id)
		if (circuit === undefined) throw new Error("Circuit not found")
		if (circuit.getInputSize() !== input.length) throw new Error("Input size mismatch")
		circuit.setInputs(input.map((value) => () =>{ return { executed: true, value: Boolean(value) } }))
		circuit.execute(options)
		return circuit.getOutputs().map((output) => Number(output.value))
	}

	runMultiple(id: string, inputs: number[][], options?: ExecutionOptions): number[][] {
		return inputs.map((input) => this.run(id, input, options))
	}

	getOrderTree(id: string): OrderTreeNode[] {
		const circuit = this.getCircuitCopy(id)
		if (circuit === undefined) throw new Error("Circuit not found") 
		return circuit.getOrderTree()
	}

	getCircuitCopy(id: string): Circuit|undefined {
		const circuitMap = this.simpleCircuitsList.has(id) ? this.simpleCircuitsList : this.complexCircuitsList
		if (circuitMap.has(id)) return circuitMap.get(id)!.clone()
		return undefined
	}

	getCircuitSchema(id: string): CircuitSchema {
		return this.builders.get(id)!
	}

	static createFromList(schemaList: CircuitSchema[]) : Board {
		return new Board(new Map(schemaList.map((schema) => [ schema.type, schema ])))
	}
}

export interface CircuitIOCredential {
  readonly type: string,
  readonly index: number,
  readonly port: number
}

export interface CircuitSchema {
	readonly type: string,
	readonly inputSize: number,
	readonly outputSize: number,
	readonly instances: string[],
	readonly connections: {
		readonly input: CircuitIOCredential,
		readonly output: CircuitIOCredential
	}[]
}

export interface ICircuitStructure {
	readonly builderId: string
	readonly input: number
	readonly output: number
	readonly instances: Circuit[]
	readonly circuits: Map<string, Circuit[]>
	readonly references: Connection[]
}

export interface OrderTreeNode {
	readonly instance: {
		index: number,
		id: number,
		type: string
	},
	readonly previous?: {
		readonly port: number
		readonly node: OrderTreeNode
	}[]
}

export class ComplexCircuit extends Circuit {
	private readonly board: Board
	private readonly structure: ICircuitStructure

	constructor(board: Board, schema: CircuitSchema) {
		super()
		this.processInput = new Array<CircuitIOAccess>(schema.inputSize).fill(() => { return { executed: false, value: Boolean(0) } })
		this.processOutput = new Array<CircuitIO>(schema.outputSize)
		this.board = board
		this.structure = this.buildSchema(schema)
	}

	private buildSchema(schema: CircuitSchema): ICircuitStructure {
		const { type: type, inputSize, outputSize, instances: instancesName, connections } = schema

		let tempInstances : Circuit[] = []
		let tempCircuits : Map<string, Circuit[]> = new Map<string, Circuit[]>(
			instancesName.map((id) : [ string, Circuit[] ] => [ id, new Array<Circuit>() ])
		)
		
		for(let index=0; index < inputSize; index++) {
			const instance = this.createInput()
			instance.index = index
			instance.setInput(0, this.processInput[index])
			tempInstances.push(instance)
			
      const inputName = inputCircuit.getType()
			let instanceList = (tempCircuits.has(inputName)) ? tempCircuits.get(inputName)! : new Array<Circuit>()
			instanceList.push(instance)
			tempCircuits.set(inputName, instanceList)
		}

		for(let idx=0; idx < outputSize; idx++) {
			const instance = this.createOutput()
			instance.index = idx
			this.processOutput[idx] = instance.getOutput()
			tempInstances.push(instance)
			
      const outputName = outputCircuit.getType()
			let instanceList = (tempCircuits.has(outputName)) ? tempCircuits.get(outputName)! : new Array<Circuit>()
			instanceList.push(instance)
			tempCircuits.set(outputName, instanceList)
		}

		instancesName.forEach((id) => {
			const circuit = this.board.getCircuitCopy(id)
			if (circuit === undefined) throw new Error("Circuit not found")
			tempInstances.push(circuit)

			let instanceList = tempCircuits.get(id)
			if (instanceList === undefined) throw new Error("Circuit not found")
			circuit.index = instanceList.length
      instanceList.push(circuit)
			tempCircuits.set(id, instanceList)
		})

    tempInstances.forEach((circuit, index) => {
			circuit.id = index
		})

		let tempConnections : Connection[] = []
		connections.forEach((connection) => {
			const { type:inputType, index:inputIndex, port:inputPort } = connection.input
			const { type:outputType, index:outputIndex, port:outputPort } = connection.output
			
			const inputList = tempCircuits.get(inputType)
			if (inputList === undefined) throw new Error("Input circuit not found")
      if (inputIndex < 0 || inputIndex >= inputList.length) throw new Error("Input circuit index out of bounds")
			const inputInstance = inputList[inputIndex]
    
    const outputList = tempCircuits.get(outputType)
    if (outputList === undefined) throw new Error("Output circuit not found")
    if (outputIndex < 0 || outputIndex >= outputList.length) throw new Error("Output circuit index out of bounds")
			const outputInstance = outputList[outputIndex]

			if (inputPort < 0 || inputPort >= inputInstance.getInputSize()) throw new Error("Input index out of bounds")
			if (outputPort < 0 || outputPort >= outputInstance.getOutputSize()) throw new Error("Output index out of bounds")

			inputInstance.setInput(inputPort, () => outputInstance.getOutput(outputPort))
			tempConnections.push(connection)
		})

		let structure : ICircuitStructure = {
			builderId: type,
			input: inputSize,
			output: outputSize,
			instances: tempInstances,
			circuits: tempCircuits,
			references: tempConnections
		}
		return structure
	}

	execute(): void {
		const inputs = this.getCircuits().get(inputCircuit.getType())!
		this.processInput.forEach((input, index) => { 
			inputs[index].setInput(0, input)
		})

		const orderRoot = this.getOrderTree()
		const executionRecursion = function(node: OrderTreeNode, instances: Circuit[]) {
			if (node.previous) node.previous.forEach((n) => executionRecursion(n.node, instances))
			const instance = instances[node.instance.id]
			instance.execute()
		}
		orderRoot.forEach((n) => executionRecursion(n, this.getInstances()))


		if (!this.isReady()) throw new Error("Circuit not fully connected")
		const outputs = this.getCircuits().get('Output')
		if (outputs === undefined) throw new Error("Missing OUTPUTs")
	}

	hasSameType(other: Circuit): boolean {
		return other instanceof ComplexCircuit && this.structure.builderId === other.structure.builderId
	}

	getOrderTree(): OrderTreeNode[] {
		const baseInstances = this.getInstances().filter((circuit) => circuit.hasSameType(outputCircuit))
		
		const treeBuilderRecursion = (current: Circuit) : OrderTreeNode => {
      const references = this.getReferences().filter((reference) => {
        const inputInstance = this.getCircuits().get(reference.input.type)![reference.input.index]
        return inputInstance === current
      }) 
			return {
				instance: {
					id: current.id,
					index: current.index,
					type: current.getType()
				},
				previous: references.map((reference) => { return {
					port: reference.input.port,
					node: treeBuilderRecursion(this.getCircuits().get(reference.output.type)![reference.output.index])} 
				})
			}
		}

		return baseInstances.map((instance) => treeBuilderRecursion(instance))
	}

	isReady(): boolean {
		return this.getInstances().every((circuit) => circuit.isReady())
	}

	getInputSize(): number {
		return this.structure.input
	}
	getOutputSize(): number {
		return this.structure.output
	}

	getInstances(): Circuit[] {
		return this.structure.instances
	}

	getCircuits(): Map<string, Circuit[]> {
		return this.structure.circuits
	}

	getReferences(): Connection[] {
		return this.structure.references
	}

	isComplex(): boolean {
		return true
	}

	clone(): ComplexCircuit {
		return new ComplexCircuit(this.board, this.board.getCircuitSchema(this.structure.builderId))
	}

	getType(): string {
		return this.structure.builderId
	}

}