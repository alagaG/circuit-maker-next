import Board, { ComplexCircuit, OrderGraph, OrderNode as OrderNode } from "./circuit"
import parse, { ParsedText, ParsingResult, TemporaryRunner } from "./parsing"
import { isSimpleType } from "./utils"

export interface BoardView {
  views: View[]
  runners: RunnerResult[]
}

export interface View {
  type: string
  custom?: DrawScheme[] 
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

    let tempRunners : RunnerResult[] = []
    runners.forEach((runner) => {
      const { type, inputs } = runner
      tempRunners = this.board.runMultiple(type, inputs)
        .map((result, index) => { return { type, input: inputs[index], output:result } })
    })

    const tempViews = visible
      .map((circuitType) => { 
        const schema = this.board.getCircuitSchema(circuitType) 
        const custom = Array.from(new Set(schema.instances.filter((instance) => !isSimpleType(instance))))
          .map((subCircuit): DrawScheme => {
            const subSchema = this.board.getCircuitSchema(subCircuit)
            return {
              type: subCircuit,
              input: subSchema.inputSize,
              output: subSchema.outputSize
            }
          })
        return { 
          type: circuitType, 
          custom,
          order: this.board.getOrderGraph(circuitType)
        } 
      })

    return { views: tempViews, runners: tempRunners }
  }

}