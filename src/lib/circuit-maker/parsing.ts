import { CircuitIOCredential, CircuitSchema } from "./circuit";
import { isCircuitName, isDefaultCircuit as isDefaultCircuitType, matchCircuitName, parseCircuitName } from "./utils";

export interface ParsedText {
  readonly definitions: CircuitSchema[]
  readonly views: string[]
  readonly runners: {
    readonly type: string,
    readonly inputs: number[][]
  }[]
  readonly result: ParsingResult
}

export interface ParsingResult {
  readonly success: boolean
  readonly errors?: string[]
}

interface TemporaryDefinition {
  readonly type: string,
  inputSize: number,
  outputSize: number,
  instances: string[],
  connections: {
    input: CircuitIOCredential
    output: CircuitIOCredential
  }[]
}

export interface TemporaryRunner {
  readonly type: string
  inputs: number[][]
}

interface ParseState {
  definitions: TemporaryDefinition[]
  runners: TemporaryRunner[]
  views: string[]
  blockFunction: BlockFunction
}

interface BlockFunction {
  (state: ParseState, line: string, words: string[]): void
}

export default function parse(text: string): ParsedText {  
  const state : ParseState = {
    definitions: new Array<TemporaryDefinition>(),
    views: new Array<string>(),
    runners: new Array<TemporaryRunner>(),
    blockFunction: parseDefaultBlock
  }
  
  const lines = text.split('\n').filter((line) => line.length > 0)
  let result : ParsingResult|undefined = undefined
  lines.forEach((line) => {
    if (result !== undefined) return

    const words = line.split(' ')
    try {
      state.blockFunction(state, line, words)
    } catch(e) {
      if (e instanceof Error) result = { success: false, errors: [e.message] }
    }
  })
  return { 
    definitions: state.definitions,
    runners: state.runners,
    views: state.views, 
    result: result ? result : { success: true }}
}

function parseDefaultBlock(state: ParseState, line: string, words: string[]) {
  const [ command ] = words
  switch (command) {
    case 'define':
      if (words.length < 2) throw new Error('Missing circuit name')
      const tempDefinition : TemporaryDefinition = {
        type: words[1],
        inputSize: 0,
        outputSize: 0,
        instances: [],
        connections: []
      }
      state.definitions.push(tempDefinition)
      state.blockFunction = parseDefineBlock
      break
    case 'show':
      if (words.length < 2) throw new Error('Missing circuit name')
      const circuitType = words[1]
      if (!isDefaultCircuitType(circuitType) && !state.definitions.some((schema) => schema.type === circuitType)) throw new Error('Unknown circuit type')
      state.views.push(circuitType)
      break
    case 'run':
      if (words.length < 2) throw new Error('Missing circuit name')
      const tempRunner : TemporaryRunner = {
        type: words[1],
        inputs: []
      }
      if (!state.views.includes(words[1])) state.views.push(words[1])
      state.runners.push(tempRunner)
      state.blockFunction = parseRunBlock
      break
    default:
      throw new Error('Unknown command')
  }
}

function parseDefineBlock(state: ParseState, line: string, words: string[]) {
  const [ command ] = words
  const schema = state.definitions[state.definitions.length - 1]
  switch (command) {
    case 'io':
      if (words.length < 2) throw new Error('Missing input size')
      if (words.length < 3) throw new Error('Missing output size')
      
      const input = parseInt(words[1])
      const output = parseInt(words[2])
      if (input === undefined) throw new Error('Invalid input value')
      if (output === undefined) throw new Error('Invalid output value')

      schema.inputSize = input
      schema.outputSize = output
      break
    case 'add':
      if (words.length < 2) throw new Error('Missing circuit instance name')
      const instanceName = words[1]
      schema.instances.push(instanceName)
      break
    case 'connect':
      if (words.length < 2) throw new Error('Missing output reference')
      if (words.length < 3) throw new Error('<')
      if (words.length < 4) throw new Error('Missing input reference')
      
      const outputReferenceName = words[1]
      const inputReferenceName = words[3]
      if (!isCircuitName(outputReferenceName)) throw new Error('Invalid output reference name')
      if (!isCircuitName(inputReferenceName)) throw new Error('Invalid input reference name')

      const inputName = parseCircuitName(inputReferenceName)!
      const outName = parseCircuitName(outputReferenceName)!
      const reference = {
        input: inputName,
        output: outName
      }
      schema.connections.push(reference)
      break
    case 'end':
      state.blockFunction = parseDefaultBlock
      break
    default:
      throw new Error('Unknown command')
  }
}

const numberArrayRegex = /\[(\s*[01]+(?:\s*[01]+\s*)*)]/
function parseRunBlock(state: ParseState, line: string, words: string[]) {
  const [ command ] = words

  switch (command) {
    default:
      const matchResult = words.slice(0).join(' ').match(numberArrayRegex)
      if (matchResult === null) throw new Error('Invalid test')
      const inputs = matchResult[1].slice(1, -1).split(' ').map((v) => parseInt(v))
      state.runners[state.runners.length - 1].inputs.push(inputs)
      break
    case 'end':
      state.blockFunction = parseDefaultBlock
      break
  }
}