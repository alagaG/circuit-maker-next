import { CircuitIOCredential, OrderTreeNode, defaultCircuits } from "./circuit"

export function printOrderTree(treeRoot: OrderTreeNode[]) {
	let queue : OrderTreeNode[][] = []
	let next : OrderTreeNode[] = []
	console.log(">", treeRoot.map(n => `${n.instance.type}#${n.instance.index}`))
	treeRoot.forEach((n) => {
		if (n.previous) next.push(...n.previous.map(n => n.node))
	})
	queue.push(next)
	while(queue.length > 0) {
		const current = queue.shift()!
		console.log(">", current.map(n => `${n.instance.type}#${n.instance.index}`))
		next = []
		current.forEach((n) => {
			if (n.previous) next.push(...n.previous.map(n => n.node))
		})
		if (next.length > 0) queue.push(next)
	}
}

const circuitNameRegex = /(\w+)#(\d)(?:-(\d))?/
export function matchCircuitName(name:string): RegExpMatchArray|null {
  return name.match(circuitNameRegex)
}

export function isCircuitName(name:string): boolean {
  return name.match(name) !== null
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