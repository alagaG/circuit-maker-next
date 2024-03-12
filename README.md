# Circuit Maker

## Features

- Test Logical Gates ( AND, OR, NOT )
- Build custom Circuits
- Build custom Complex Circuits
- Test Circuits and Complex Circuits
- Visualization of Circuit Structure
- Visualization of Circuit Process
- Choose between Light Mode and Dark Mode
- Change the color themes

## Themes

### Light Themes
- Ayu Ligth

### Dark Themes
- Ayu Mirage
- Dracula

## Commands

There are 3 scope for commands: global, circuit, test. To create a new circuit you need to `define` it name, IO, components and connections. Defining the IO create input and output components implicitly. To reference a subcircuit use this format: [name]#[id of this type]-[io].

### Global

- define [circuit_name]: Define a new Circuit and enters in circuit escope
- show [circuit_name]: Generate a circuit diagram
- run [circuit_name]: Enters in test scope

### Circuit

- io [input] [output]: Define the circuit input and output
- add [subcircuit]: Add a subcircuit to definition
- connect [from] > [to]: Add a connection from a subcircuit to another
- end: Returns to global scope

### Test

- [ i1 i2 i3 ... ]: Define the test inputs
- end: Returns to global scope

## Example

```
define HalfSum
io 2 2
add XOR
add AND
connect Input#0 > XOR#0-0
connect Input#1 > XOR#0-1
connect Input#0 > AND#0-0
connect Input#1 > AND#0-1
connect XOR#0 > Output#0
connect AND#0 > Output#1
end

show HalfSum
```
