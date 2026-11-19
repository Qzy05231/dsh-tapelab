#!/usr/bin/env node
/**
 * nand-cli — command-line companion for the TapeOut 3D Lab circuit model.
 *
 *   nand-cli synth 0110            synthesize a 2-input truth table (0/1/- allowed)
 *   nand-cli import half.v         import gate-level Verilog into a NAND netlist
 *   nand-cli eval --file n.json --in 1011
 *   nand-cli verify --file n.json  exhaustively verify against its own truth table
 *   nand-cli disasm --file n.json  list gates and outputs
 *
 * Netlist JSON is the same format the lab's "copy JSON" produces, or the output of
 * `import --json` / `synth --json`.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLIENT = join(HERE, '..', 'src', 'client')
const read = (name) => readFileSync(join(CLIENT, name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '38-export.js', '48-verilog.js']) new Function('TT', read(name))(TT)

function usage() {
  console.log(`nand-cli — TapeOut NAND circuit tool

usage:
  nand-cli synth <table>           e.g. synth 0110   (2^nIn values, - = don't care)
  nand-cli import <file.v> [--json]
  nand-cli eval --file <netlist.json> --in <bits>
  nand-cli verify --file <netlist.json>
  nand-cli disasm --file <netlist.json>`)
}

function arg(flag, fallback) {
  const index = process.argv.indexOf(flag)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

function loadNetlist(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8'))
  if (!raw || !Array.isArray(raw.gates)) throw new Error('not a netlist JSON file')
  return TT.Circuit.makeNetlist({
    nIn: Number(raw.nIn) || 0,
    nState: Number(raw.nState) || 0,
    gates: raw.gates.map((gate) => (Array.isArray(gate) ? { a: Number(gate[0]), b: Number(gate[1]) } : { a: Number(gate.a), b: Number(gate.b) })),
    outputs: (raw.outputs || []).map(Number),
  })
}

function summarize(netlist) {
  return {
    nIn: netlist.nIn,
    nOut: netlist.outputs.length,
    gates: TT.Circuit.gateCount(netlist),
    depth: TT.Circuit.maxDepth(netlist),
    hex: TT.Circuit.gateHex(netlist),
  }
}

const command = process.argv[2]
try {
  if (command === 'synth') {
    const bits = process.argv[3]
    if (!bits || !/^[01-]+$/.test(bits)) throw new Error('table must be a string of 0/1/-')
    const nIn = Math.log2(bits.length)
    if (!Number.isInteger(nIn) || nIn < 1) throw new Error('table length must be 2, 4, 8 or 16')
    const result = TT.Circuit.synth({ nIn, bits: bits.split('').map((bit) => (bit === '-' ? -1 : Number(bit))) })
    const info = summarize(result.netlist)
    const check = TT.Circuit.exhaustiveVerify(result.netlist, (input) => {
      const value = bits.split('').map((bit) => (bit === '-' ? -1 : Number(bit)))[input]
      return value === -1 ? 0 : value
    })
    if (process.argv.includes('--json')) {
      console.log(TT.Export.netlistJson(result.netlist))
    } else {
      console.log(JSON.stringify({ ...info, verify: check.passed }, null, 2))
    }
  } else if (command === 'import') {
    const file = process.argv[3]
    if (!file) throw new Error('missing .v file')
    const parsed = TT.VerilogImport.parse(readFileSync(file, 'utf8'))
    const info = summarize(parsed.netlist)
    if (process.argv.includes('--json')) {
      console.log(TT.Export.netlistJson(parsed.netlist))
    } else {
      console.log(JSON.stringify({ module: parsed.name, inputs: parsed.inputs, outputs: parsed.outputs, ...info }, null, 2))
    }
  } else if (command === 'eval') {
    const netlist = loadNetlist(arg('--file'))
    const bits = arg('--in', '0')
    const value = TT.Circuit.evaluate(netlist, parseInt(bits, 2) || 0)
    console.log(JSON.stringify({ inputBits: bits, outputs: value.outputs, outputBits: value.outputBits }, null, 2))
  } else if (command === 'verify') {
    const netlist = loadNetlist(arg('--file'))
    const table = []
    for (let bits = 0; bits < 1 << netlist.nIn; bits += 1) table.push(TT.Circuit.evaluate(netlist, bits).outputBits)
    const result = TT.Circuit.exhaustiveVerify(netlist, (bits) => table[bits])
    console.log(JSON.stringify({ ...summarize(netlist), passed: result.passed, rows: result.count, mismatches: result.mismatchCount || 0 }, null, 2))
  } else if (command === 'disasm') {
    const netlist = loadNetlist(arg('--file'))
    console.log(`inputs ${netlist.nIn} · outputs ${netlist.outputs.length} · gates ${netlist.gates.length}`)
    netlist.gates.forEach((gate, index) => console.log(`  g${index}: nand(${gate.a}, ${gate.b}) -> ${2 + netlist.nIn + index}`))
    console.log('outputs:', netlist.outputs.map((node, index) => `out[${index}]=node ${node}`).join(' '))
  } else {
    usage()
  }
} catch (error) {
  console.error('error:', error && error.message ? error.message : error)
  process.exit(1)
}
