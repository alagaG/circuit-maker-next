import { ICircuitSchema } from "./circuit";

export const NANDSchema : ICircuitSchema = {
	name: "NAND",
	inputSize: 2,
	outputSize: 1,
	instances: [ "AND", "NOT" ],
	references: [
		{  output: { name: "INPUT", id: 0, port: 0 }, input: { name: "AND", id: 0, port: 0 } },
		{  output: { name: "INPUT", id: 1, port: 0 }, input: { name: "AND", id: 0, port: 1 } },
		{  output: { name: "AND", id: 0, port: 0 }, input: { name: "NOT", id: 0, port: 0 } },
		{  output: { name: "NOT", id: 0, port: 0 }, input: { name: "OUTPUT", id: 0, port: 0 } },
	]
}

export const NORSchema : ICircuitSchema = {
	name: "NOR",
	inputSize: 2,
	outputSize: 1,
	instances: [ "OR", "NOT" ],
	references: [
		{  output: { name: "INPUT", id: 0, port: 0 }, input: { name: "OR", id: 0, port: 0 } },
		{  output: { name: "INPUT", id: 1, port: 0 }, input: { name: "OR", id: 0, port: 1 } },
		{  output: { name: "OR", id: 0, port: 0 }, input: { name: "NOT", id: 0, port: 0 } },
		{  output: { name: "NOT", id: 0, port: 0 }, input: { name: "OUTPUT", id: 0, port: 0 } },
	]
}

export const XORSchema : ICircuitSchema = {
    name: "XOR",
    inputSize: 2,
    outputSize: 1,
    instances: [ "OR", "NAND", "AND" ],
    references: [
        {  output: { name: "INPUT", id: 0, port: 0 }, input: { name: "OR", id: 0, port: 0 } },
        {  output: { name: "INPUT", id: 1, port: 0 }, input: { name: "OR", id: 0, port: 1 } },
        {  output: { name: "INPUT", id: 0, port: 0 }, input: { name: "NAND", id: 0, port: 0 } },
        {  output: { name: "INPUT", id: 1, port: 0 }, input: { name: "NAND", id: 0, port: 1 } },
        {  output: { name: "OR", id: 0, port: 0 }, input: { name: "AND", id: 0, port: 0 } },
        {  output: { name: "NAND", id: 0, port: 0 }, input: { name: "AND", id: 0, port: 1 } },
        {  output: { name: "AND", id: 0, port: 0 }, input: { name: "OUTPUT", id: 0, port: 0 } }
    ]
}

export const DEFAULT_COMPLEX_CIRCUITS = [
	NANDSchema,
	NORSchema,
	XORSchema
]