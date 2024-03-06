export interface ICircuitInterface {
	executed: boolean
	value: boolean
} 

export interface ICircuitInterfaceAccess {
	(): ICircuitInterface
}

export interface IExecutionOptions {
	step?: boolean
}

export const DEFAULT_OPTIONS : IExecutionOptions = {
	step: false
}

export abstract class Circuit {
	protected processInput: ICircuitInterfaceAccess[]
	protected processOutput: ICircuitInterface[]
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

	abstract execute(options?: IExecutionOptions) : void

	abstract getOrderTree(): IOrderTreeNode[]

	abstract getInputSize(): number

	abstract getOutputSize(): number

	setInput(index: number, value: ICircuitInterfaceAccess) {
		this.processInput[index] = value
	}

	setInputs(values: ICircuitInterfaceAccess[]) {
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

	getOutput(index: number = 0): ICircuitInterface {
		return this.processOutput[index]
	}

	getOutputs(): ICircuitInterface[] {
		return [...this.processOutput]
	}

	isComplex(): boolean {
		return false 
	}

	createInput() : IOCircuit {
		return INPUT.clone() as IOCircuit
	}

	createOutput() : IOCircuit {
		return OUTPUT.clone() as IOCircuit
	}

	isReady(): boolean {
		return this.executed
	}

	getIO(): string {
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
		return `${this.getName()}#${this.id}`
	}

	compareIO(): boolean {
		return this.processInput[0]() === this.processOutput[0]
	}

	abstract getName(): string

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

	getOrderTree(): IOrderTreeNode[] {
		return [ { 
			instance: {
				id: this.id,
				index: this.index,
				name: this.getName()
			}
		} ]
	}

	hasSameType(other: Circuit): boolean {
		return other instanceof IOCircuit && this.isInput() === other.isInput()
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

	getName(): string {
		return this.isInput() ? "INPUT" : "OUTPUT" 
	}

}

export const INPUT = new IOCircuit(1)
export const OUTPUT = new IOCircuit(0)

export interface ILogicGateFunction {
	(...input: boolean[]) : boolean
}

export interface ILogicGate {
	readonly id: string
	readonly inputSize: number
	readonly process: ILogicGateFunction
}

const ANDFunction : ILogicGateFunction = (a: boolean, b: boolean) => a && b
const ORFunction : ILogicGateFunction = (a: boolean, b: boolean) => a || b
const NOTFuntion : ILogicGateFunction = (a: boolean) => !a

const AND : ILogicGate = { id: "AND", inputSize: 2, process: ANDFunction }
const OR : ILogicGate = { id: "OR", inputSize: 2, process: ORFunction }
const NOT : ILogicGate = { id: "NOT", inputSize: 1, process: NOTFuntion }

export interface ICircuitReference {
	readonly output: {
		readonly instance: Circuit
		readonly port: number,
	}
	readonly input: {
		readonly instance: Circuit
		readonly port: number,
	}
}

export class SimpleCircuit extends Circuit {
	private gate : ILogicGate

	constructor(gate: ILogicGate) {
		super()
		this.gate = gate
		this.processInput = new Array<ICircuitInterfaceAccess>(gate.inputSize).fill(() => INPUT.clone().getOutput())
		this.processOutput = new Array<ICircuitInterface>(1).fill(OUTPUT.clone().getOutput())
	}

	addReference(reference: ICircuitReference) : void {
		const { port:inIndex } = reference.output
		const { port:outIndex, instance:other } = reference.input
		const inputSize = this.getInputSize()

		if (inIndex < 0 || inIndex >= inputSize) throw new Error("Input index out of bounds")
		if (outIndex < 0 || outIndex >= other.getOutputSize()) throw new Error("Output index out of bounds")

		this.setInput(inIndex, () => other.getOutput(outIndex))
	}

	execute(options?: IExecutionOptions) : void {
		const { step:steps } = options || DEFAULT_OPTIONS

		this.processOutput[0].value = this.gate.process(...this.processInput.map((access) => access().value))
		this.executed = this.processInput.every((access) => access().executed )
		this.processOutput[0].executed = this.executed
		if (this.executed && steps) console.log(`${this.getName()} | (${this.processInput.map(i => Number(i().value))}) > (${this.getOutputs().map(o => Number(o.value))})`)
	}

	getOrderTree(): IOrderTreeNode[] {
		return [ { 
			instance: {
			id: this.id,
			index: this.index,
			name: this.getName()
		} } ]
	}

	hasSameType(other: Circuit): boolean {
		return other instanceof SimpleCircuit && this.gate.id === other.gate.id
	}

	getGate(): ILogicGate {
		return this.gate
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

	getName(): string {
		return this.gate.id
	}

}

const ANDCircuit = new SimpleCircuit(AND)
const ORCircuit = new SimpleCircuit(OR)
const NOTCircuit = new SimpleCircuit(NOT)
const DEFAULT_CIRCUITS : Map<string, SimpleCircuit> = new Map([
	["AND", ANDCircuit], 
	["OR", ORCircuit], 
	["NOT", NOTCircuit]
])

export class Board {
	private readonly simpleCircuitsList : Map<string, SimpleCircuit>
	private readonly complexCircuitsList : Map<string, ComplexCircuit>
	private readonly builders : Map<string, ICircuitSchema>

	constructor(builders: Map<string, ICircuitSchema>) {
		this.builders = builders
		this.simpleCircuitsList = DEFAULT_CIRCUITS
        
		this.complexCircuitsList = new Map()
		builders.forEach((schema) => {
			this.complexCircuitsList.set(schema.name, new ComplexCircuit(this, schema))
		})
	}

	run(id: string, input: boolean[]|number[], options?: IExecutionOptions): number[] {
		const circuit = this.getCircuit(id)
		if (circuit === undefined) throw new Error("Circuit not found")
		if (circuit.getInputSize() !== input.length) throw new Error("Input size mismatch")
		circuit.setInputs(input.map((value) => () =>{ return { executed: true, value: Boolean(value) } }))
		circuit.execute(options)
		return circuit.getOutputs().map((output) => Number(output.value))
	}

	runMultiple(id: string, inputs: number[][], options?: IExecutionOptions): number[][] {
		return inputs.map((input) => this.run(id, input, options))
	}

	getOrderTree(id: string): IOrderTreeNode[] {
		const circuit = this.getCircuit(id)
		if (circuit === undefined) throw new Error("Circuit not found") 
		return circuit.getOrderTree()
	}

	getCircuit(id: string): Circuit|undefined {
		const circuitMap = this.simpleCircuitsList.has(id) ? this.simpleCircuitsList : this.complexCircuitsList
		if (circuitMap.has(id)) return circuitMap.get(id)!.clone()
		return undefined
	}

	getCircuitSchema(id: string): ICircuitSchema {
		return this.builders.get(id)!
	}

	static createFromList(schemaList: ICircuitSchema[]) : Board {
		return new Board(new Map(schemaList.map((schema) => [ schema.name, schema ])))
	}
}

export interface ICircuitSchema {
	readonly name: string,
	readonly inputSize: number,
	readonly outputSize: number,
	readonly instances: string[],
	readonly references: {
		readonly input: {
			readonly name: string,
			readonly id: number,
			readonly port: number
		},
		readonly output: {
			readonly name: string,
			readonly id: number,
			readonly port: number
		}
	}[]
}

export interface ICircuitStructure {
	readonly builderId: string
	readonly input: number
	readonly output: number
	readonly instances: Circuit[]
	readonly circuits: Map<string, Circuit[]>
	readonly references: ICircuitReference[]
}

export interface IOrderTreeNode {
	readonly instance: {
		index: number,
		id: number,
		name: string
	},
	readonly previous?: {
		readonly port: number
		readonly node: IOrderTreeNode
	}[]
}

export class ComplexCircuit extends Circuit {
	private readonly board: Board
	private readonly structure: ICircuitStructure

	constructor(board: Board, schema: ICircuitSchema) {
		super()
		this.processInput = new Array<ICircuitInterfaceAccess>(schema.inputSize).fill(() => { return { executed: false, value: Boolean(0) } })
		this.processOutput = new Array<ICircuitInterface>(schema.outputSize)
		this.board = board
		this.structure = this.buildSchema(schema)
	}

	private buildSchema(schema: ICircuitSchema): ICircuitStructure {
		const { name: id, inputSize, outputSize, instances: instancesName, references } = schema

		let instances : Circuit[] = []
		let circuits : Map<string, Circuit[]> = new Map<string, Circuit[]>(
			instancesName.map((id) : [ string, Circuit[] ] => [ id, new Array<Circuit>() ])
		)
		
		for(let idx=0; idx < inputSize; idx++) {
			const instance = this.createInput()
			instance.index = idx
			instance.setInput(0, this.processInput[idx])
			instances.push(instance)
			
			let instanceList = (circuits.has("INPUT")) ? circuits.get("INPUT")! : new Array<Circuit>()
			instanceList.push(instance)
			
			circuits.set("INPUT", instanceList)
		}

		for(let idx=0; idx < outputSize; idx++) {
			const instance = this.createOutput()
			instance.index = idx
			this.processOutput[idx] = instance.getOutput()
			instances.push(instance)
			
			let instanceList = (circuits.has("OUTPUT")) ? circuits.get("OUTPUT")! : new Array<Circuit>()
			instanceList.push(instance)

			circuits.set("OUTPUT", instanceList)
		}

		instancesName.forEach((id) => {
			const circuit = this.board.getCircuit(id)
			if (circuit === undefined) throw new Error("Circuit not found")
			instances.push(circuit)

			let instanceList = circuits.get(id)
			if (instanceList === undefined) throw new Error("Circuit not found")
			circuit.index = instanceList.length

			instanceList.push(circuit)
			circuits.set(id, instanceList)
		})

		let instancesReferences : ICircuitReference[] = []
		references.forEach((ref) => {
			const { name:inName, id:inId, port:inPort } = ref.input
			const { name:outName, id:outId, port:outPort } = ref.output

			if (inId < 0 || inId >= circuits.size) throw new Error("Input circuit index out of bounds")
			if (outId < 0 || outId >= circuits.size) throw new Error("Output circuit index out of bounds")
			
			const inputList = circuits.get(inName)
			if (inputList === undefined) throw new Error("Input circuit not found")
			const inputInstance = inputList[inId]

			const outputList = circuits.get(outName)
			if (outputList === undefined) throw new Error("Output circuit not found")
			const outputInstance = outputList[outId]

			if (inPort < 0 || inPort >= inputInstance.getInputSize()) throw new Error("Input index out of bounds")
			if (outPort < 0 || outPort >= outputInstance.getOutputSize()) throw new Error("Output index out of bounds")

			inputInstance.setInput(inPort, () => outputInstance.getOutput(outPort))
			instancesReferences.push({ 
				input: { 
					instance: inputInstance, 
					port: inPort 
				}, 
				output: { 
					instance: outputInstance, 
					port: outPort } 
				})
		})

		instances.forEach((circuit, index) => {
			circuit.id = index
		})

		let structure : ICircuitStructure = {
			builderId: id,
			input: inputSize,
			output: outputSize,
			instances,
			circuits,
			references: instancesReferences
		}
		return structure
	}

	addReference(reference: ICircuitReference) : void {
		const { port:inIndex } = reference.input
		const { port:outIndex, instance:other } = reference.output
		const inputSize = this.getInputSize()

		if (inIndex < 0 || inIndex >= inputSize) throw new Error("Input index out of bounds")
		if (outIndex < 0 || outIndex >= other.getOutputSize()) throw new Error("Output index out of bounds")
        
		this.setInput(inIndex, () => other.getOutput(outIndex))
	}

	execute(): void {
		const inputs = this.getCircuits().get("INPUT")!
		this.processInput.forEach((input, index) => { 
			inputs[index].setInput(0, input)
		})

		const orderRoot = this.getOrderTree()
		const executionRecursion = function(node: IOrderTreeNode, instances: Circuit[]) {
			if (node.previous) node.previous.forEach((n) => executionRecursion(n.node, instances))
			const instance = instances[node.instance.id]
			instance.execute()
		}
		orderRoot.forEach((n) => executionRecursion(n, this.getInstances()))


		if (!this.isReady()) throw new Error("Circuit not fully connected")
		const outputs = this.getCircuits().get("OUTPUT")
		if (outputs === undefined) throw new Error("Missing OUTPUTs")
	}

	hasSameType(other: Circuit): boolean {
		return other instanceof ComplexCircuit && this.structure.builderId === other.structure.builderId
	}

	getOrderTree(): IOrderTreeNode[] {
		const baseInstances = this.getInstances().filter((circuit) => circuit.hasSameType(OUTPUT))
		
		const treeBuilderRecursion = (current: Circuit) : IOrderTreeNode => {
			const references = this.getReferences().filter((reference) => reference.input.instance === current)
			return {
				instance: {
					id: current.id,
					index: current.index,
					name: current.getName()
				},
				previous: references.map((ref) => { return {
					port: ref.input.port,
					node: treeBuilderRecursion(ref.output.instance)} 
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

	getReferences(): ICircuitReference[] {
		return this.structure.references
	}

	isComplex(): boolean {
		return true
	}

	clone(): ComplexCircuit {
		return new ComplexCircuit(this.board, this.board.getCircuitSchema(this.structure.builderId))
	}

	getName(): string {
		return this.structure.builderId
	}

}