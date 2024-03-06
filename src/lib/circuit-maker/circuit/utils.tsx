import { IOrderTreeNode } from "./circuit"

export function printOrderTree(treeRoot: IOrderTreeNode[]) {
	let queue : IOrderTreeNode[][] = []
	let next : IOrderTreeNode[] = []
	console.log(">", treeRoot.map(n => `${n.instance.name}#${n.instance.index}`))
	treeRoot.forEach((n) => {
		if (n.previous) next.push(...n.previous.map(n => n.node))
	})
	queue.push(next)
	while(queue.length > 0) {
		const current = queue.shift()!
		console.log(">", current.map(n => `${n.instance.name}#${n.instance.index}`))
		next = []
		current.forEach((n) => {
			if (n.previous) next.push(...n.previous.map(n => n.node))
		})
		if (next.length > 0) queue.push(next)
	}
}