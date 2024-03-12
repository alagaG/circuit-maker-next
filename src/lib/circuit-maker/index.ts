import Board, { ComplexCircuit, OrderGraph, OrderNode as OrderNode } from "./circuit"
import parse, { ParsedText, ParsingResult, TemporaryRunner } from "./parsing"
import { getSimpleTypeInput, isSimpleType } from "./utils"

export interface BoardView {
  views: View[]
  runners: RunnerResult[]
}

export interface View {
  type: string
  schemas: Map<string, DrawScheme> 
  order: OrderGraph
}

export interface DrawScheme {
  readonly type: string
  readonly input: number
  readonly output: number
} 

export interface RunnerResult {
  type: string
  input: number[]
  output: number[]
}

export default class BoardManager {
  private board: Board
  private parsedText: ParsedText

  constructor() {
    this.board = Board.createFromList([])
    this.parsedText = { definitions: [], runners: [], views: [], result: { success: false } }
  }

  parse(text: string): ParsingResult {
    const parsed = this.parsedText = parse(text)
    if (this.parsedText.result.success) {
      this.board = Board.createFromList(this.parsedText.definitions)
    } else {
      this.board = Board.createFromList([])
    }
    return parsed.result
  }

  getView(): BoardView {
    if (!this.parsedText.result.success) return { views: [], runners: [] }
    const { views: visible, runners } = this.parsedText
    console.log(runners)
    let tempRunners : RunnerResult[] = []
    runners.forEach((runner) => {
      const { type, inputs } = runner
      try {
        tempRunners.push(...this.board.runMultiple(type, inputs)
          .map((result, index) => { return { type, input: inputs[index], output:result } }))
      } catch (e) {
        if (e instanceof Error) console.log(e.message)
      }
    })

    const tempViews = visible
      .map((circuitType) => { 
        const schema = this.board.getCircuitSchema(circuitType) 
        const schemas = new Map<string, DrawScheme>(schema.instances
          .filter((subCircuit) => !isSimpleType(subCircuit))
          .map((subCircuit) => {
            const subSchema = this.board.getCircuitSchema(subCircuit)
            return [ subCircuit, {
              type: subCircuit,
              input: subSchema.inputSize,
              output: subSchema.outputSize
            } ]
          }))
        return { 
          type: circuitType, 
          schemas,
          order: this.board.getOrderGraph(circuitType)
        } 
      })

    return { views: tempViews, runners: tempRunners }
  }

}