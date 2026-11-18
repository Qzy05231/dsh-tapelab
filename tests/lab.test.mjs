/**
 * tests/lab.test.mjs — new lab building blocks: synthesis, seven-segment decoder,
 * 4-bit counter, mini computer, the embedded TapeRover safety netlist and TT.Parts.
 *
 * Run from the plugin directory:
 *   node --test tests/lab.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const ORDER = ['15-parts.js', '20-circuit.js', '25-cpu.js', '28-safety.js']

const TT = {}
for (const name of ORDER) {
  new Function('TT', 'window', 'document', read(name))(TT, undefined, undefined)
}
const C = TT.Circuit

function fakeContext() {
  const gradient = { addColorStop() {} }
  return new Proxy(
    {},
    {
      get(_target, key) {
        if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => gradient
        if (key === 'measureText') return () => ({ width: 10 })
        return () => {}
      },
      set() {
        return true
      },
    },
  )
}

test('synth reproduces every 2-input boolean function', () => {
  for (let mask = 0; mask < 16; mask += 1) {
    const bits = [0, 1, 2, 3].map((index) => (mask >> index) & 1)
    const result = C.synth({ nIn: 2, bits })
    for (let index = 0; index < 4; index += 1) {
      assert.equal(C.evaluate(result.netlist, index).outputBits & 1, bits[index], `mask ${mask} input ${index}`)
    }
    assert.ok(result.gateCount >= 0 && result.gateCount <= 8, `mask ${mask} gate count ${result.gateCount}`)
  }
})

test('synth handles don\'t-care terms and 3/4-input parity', () => {
  const withDc = C.synth({ nIn: 3, bits: [1, 1, 1, -1, 0, 0, 0, 0] })
  assert.equal(C.evaluate(withDc.netlist, 0).outputBits & 1, 1)
  assert.equal(C.evaluate(withDc.netlist, 6).outputBits & 1, 0)
  const parity4 = [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0]
  const result = C.synth({ nIn: 4, bits: parity4 })
  for (let index = 0; index < 16; index += 1) {
    assert.equal(C.evaluate(result.netlist, index).outputBits & 1, parity4[index])
  }
})

test('seven-segment decoder is correct for all 16 inputs and near the protocol size', () => {
  const netlist = C.canonical.sevenSegment()
  assert.equal(netlist.nIn, 4)
  assert.equal(netlist.outputs.length, 7)
  for (let bits = 0; bits < 16; bits += 1) {
    assert.equal(
      C.evaluate(netlist, bits).outputBits & 0x7f,
      C.canonical.sevenSegExpected(bits),
      `digit ${bits}`,
    )
  }
  const gates = C.gateCount(netlist)
  assert.ok(gates > 80 && gates < 200, `seven-segment gate count ${gates}`)
})

test('4-bit counter advances once per beat and wraps', () => {
  const counter = C.canonical.counter4()
  assert.equal(counter.nState, 4)
  assert.equal(counter.nIn, 0)
  let stateBits = 0
  for (let beat = 1; beat <= 21; beat += 1) {
    const result = C.step(counter, 0, stateBits)
    stateBits = result.stateBits
    assert.equal(stateBits, beat & 15, `beat ${beat}`)
  }
})

test('mini computer runs the three preset programs', () => {
  for (const program of TT.CPU.programs) {
    const state = TT.CPU.runUntilHalt(TT.CPU.loadProgram(TT.CPU.initial(), program.bytes), 64)
    assert.equal(state.OUT, program.expected, program.id)
    assert.equal(state.halted, true)
  }
  assert.deepEqual(TT.CPU.assemble('LDA 3\nADD 5\nOUT\nHLT'), [0x13, 0x25, 0x60, 0x00])
  assert.deepEqual(TT.CPU.disassemble([0x13, 0x25, 0x60, 0x00]), ['LDA 3', 'ADD 5', 'OUT', 'HLT'])
})

test('embedded TapeRover safety circuit is the real 16/80 logic and stays mutually exclusive', () => {
  const audit = TT.Safety.audit()
  assert.equal(audit.count, 65536)
  assert.equal(audit.violations, 0)
  assert.equal(TT.Safety.gateCount, 80)
  assert.equal(audit.counts.reduce((sum, value) => sum + value, 0), 65536)
  for (const mode of ['allow', 'slow', 'home', 'stop']) {
    const bits = TT.Safety.PRESETS[mode]
    const index = TT.Safety.OUTPUT_MODES.indexOf(mode)
    assert.equal(TT.Safety.evaluate(bits).mode, index, mode)
  }
})

test('TT.Parts exposes museum metadata and drawable sprites', () => {
  assert.equal(TT.Parts.museum.length, 12)
  assert.equal(TT.Parts.museumGates('halfAdder'), 5)
  assert.equal(TT.Parts.museumGates('fullAdder'), 9)
  const ctx = fakeContext()
  const px = { unit: 40, scale: 40, size: 1, x: 0, y: 0, depth: 10, alpha: 1 }
  for (const [name, factory] of Object.entries(TT.Parts.sprite)) {
    const draw = factory(1)
    assert.doesNotThrow(() => draw(ctx, px, 100), name)
  }
  assert.deepEqual(TT.Parts.sevenSegMaskBits(TT.Parts.sevenSegMaskForDigit(8)).map((value) => (value ? 1 : 0)), [1, 1, 1, 1, 1, 1, 1])
})
