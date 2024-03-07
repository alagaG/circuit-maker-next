import Board, { OrderTreeNode as OrderTreeNode } from "./circuit"
import parse, { ParsedText, ParsingResult, TemporaryRunner } from "./parsing"

export interface VisibleStructure {
  orderTree: OrderTreeNode[]
  runnersResults: { runner: number[], result:number[] }[]
}

export default class BoardManager {
  private board: Board
  private parsedText: ParsedText 
  private visible: string[]

  constructor() {
    this.board = Board.createFromList([])
    this.parsedText = { definitions: [], runners: [], visible: [], result: { success: true } }
    this.visible = []
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

  getView(): VisibleStructure[] {
    const { runners } = this.parsedText
    let runnersResults : { runner: number[], result:number[] }[] = []
    runners.forEach((runner) => {
      runnersResults = this.board.runMultiple(runner.name, runner.inputs)
        .map((result, index) => { return { runner:runner.inputs[index], result } })
    })
    console.log(runnersResults)

    return [ { orderTree: [], runnersResults } ]
  }

}