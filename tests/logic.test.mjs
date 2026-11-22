/**
 * tests/logic.test.mjs — TT.Circuit (SPEC section 6).
 *
 * Loads src/client/20-circuit.js as a plain script (same way the build concatenates it),
 * then checks the netlist model, 7-byte codec, exhaustive verifier, composition and the
 * canonical half / full / 4-bit adders and SR latch.
 *
 * Run: node --test tests/logic.test.mjs   (from tapeout-3d-plugin/)
 */
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const circuitPath = new URL('../src/client/20-circuit.js', import.meta.url)
const circuitSrc = readFileSync(circuitPath, 'utf8')

/** Load the module exactly like the factory does: a shared TT object, no modules. */
function loadCircuit() {
  const TT = {}
  new Function('TT', circuitSrc)(TT) // eslint-disable-line no-new-func
  return TT.Circuit
}

const C = loadCircuit()
const bitsOf = (value, width) => {
  const out = []
  for (let i = 0; i < width; i += 1) out.push((value >> i) & 1)
  return out
}

/** XOR chain over nIn inputs: each XOR costs 4 NAND gates. */
function makeParityNetlist(nIn) {
  const gates = []
  const push = (a, b) => {
    const id = 2 + nIn + gates.length
    gates.push({ a, b })
    return id
  }
  let acc = 2
  for (let i = 1; i < nIn; i += 1) {
    const x = 2 + i
    const n1 = push(acc, x)
    const n2 = push(acc, n1)
    const n3 = push(x, n1)
    acc = push(n2, n3)
  }
  return C.makeNetlist({ nIn, gates, outputs: [acc] })
}

/** OR from NAND: a OR b = NAND(NOT a, NOT b). */
function makeOrNetlist() {
  return C.makeNetlist({
    nIn: 2,
    gates: [
      { a: 2, b: 2 },
      { a: 3, b: 3 },
      { a: 4, b: 5 },
    ],
    outputs: [6],
  })
}

// ---------------------------------------------------------------------------
// loading / constraints
// ---------------------------------------------------------------------------
test('loads as a plain script and concatenates with 00-core inside one factory scope', () => {
  const TT = {}
  new Function('TT', circuitSrc)(TT) // eslint-disable-line no-new-func
  assert.equal(typeof TT.Circuit.evaluate, 'function')
  assert.equal(typeof TT.Circuit.canonical.halfAdder, 'function')

  // Real build: 00-core.js declares TT, then 20-circuit.js assigns onto it.
  const coreSrc = readFileSync(new URL('../src/client/00-core.js', import.meta.url), 'utf8')
  const factory = new Function('React', coreSrc + '\n' + circuitSrc + '\nreturn TT') // eslint-disable-line no-new-func
  const combined = factory(undefined)
  assert.equal(combined.Circuit.GATE_BYTES, combined.protocol.GATE_BYTES)
  assert.equal(combined.Circuit.gateHex(combined.Circuit.canonical.halfAdder()).slice(0, 2), '0x')
})

test('source stays dependency-free: no import/export, no DOM, no console', () => {
  assert.doesNotMatch(circuitSrc, /^\s*(?:import|export)\b/m)
  assert.doesNotMatch(circuitSrc, /\b(?:window|document)\s*\./)
  assert.doesNotMatch(circuitSrc, /\bconsole\s*\./)
  assert.doesNotMatch(circuitSrc, /\brequire\s*\(/)
})

// ---------------------------------------------------------------------------
// reference helpers
// ---------------------------------------------------------------------------
test('reference helpers implement the full boolean tables', () => {
  const { nand, not, and, or, xor } = C.reference
  assert.deepEqual([1, 1, 1, 0], [nand(0, 0), nand(0, 1), nand(1, 0), nand(1, 1)])
  assert.deepEqual([1, 0], [not(0), not(1)])
  assert.deepEqual([0, 0, 0, 1], [and(0, 0), and(0, 1), and(1, 0), and(1, 1)])
  assert.deepEqual([0, 1, 1, 1], [or(0, 0), or(0, 1), or(1, 0), or(1, 1)])
  assert.deepEqual([0, 1, 1, 0], [xor(0, 0), xor(0, 1), xor(1, 0), xor(1, 1)])
})

// ---------------------------------------------------------------------------
// netlist model
// ---------------------------------------------------------------------------
test('makeNetlist freezes the netlist and nodeIds mirrors protocol numbering', () => {
  const ha = C.makeNetlist({ nIn: 2, gates: [{ a: 2, b: 3 }], outputs: [4] })
  assert.equal(ha.nIn, 2)
  assert.equal(ha.nOut, 1)
  assert.equal(ha.nState, 0)
  assert.equal(ha.firstLatchInput, null)
  assert(Object.isFrozen(ha))
  assert(Object.isFrozen(ha.gates))
  assert(Object.isFrozen(ha.outputs))
  assert(Object.isFrozen(ha.gates[0]))
  assert.throws(() => ha.outputs.push(9), TypeError)
  assert.throws(() => ha.gates[0].a = 0, TypeError)

  const ids = C.nodeIds(ha)
  assert.deepEqual(ids, {
    c0: 0,
    c1: 1,
    inputs: [2, 3],
    latches: [],
    gateStart: 4,
    gateIds: [4],
    nodeCount: 5,
    firstLatchInput: null,
  })
  assert.deepEqual(C.nodeIds(C.canonical.srLatch()), {
    c0: 0,
    c1: 1,
    inputs: [2, 3],
    latches: [4, 5],
    gateStart: 6,
    gateIds: [6, 7],
    nodeCount: 8,
    firstLatchInput: 6,
  })
})

test('makeNetlist defaults latch capture to the last nState gate outputs', () => {
  const built = C.makeNetlist({
    nIn: 2,
    nState: 2,
    gates: [
      { a: 2, b: 5 },
      { a: 3, b: 4 },
    ],
    outputs: [4, 5],
  })
  assert.equal(built.firstLatchInput, 6)
  assert.equal(C.validateNetlist(built).ok, true)
  const explicit = C.makeNetlist({
    nIn: 2,
    nState: 1,
    gates: [{ a: 2, b: 2 }],
    outputs: [2],
    firstLatchInput: 2,
  })
  assert.equal(explicit.firstLatchInput, 2)
  assert.throws(() => C.makeNetlist({ nIn: -1, gates: [] }), TypeError)
  assert.throws(() => C.makeNetlist({ nIn: 2, gates: [{ a: '2', b: 3 }] }), TypeError)
  assert.throws(() => C.makeNetlist({ nIn: 2, gates: [{ a: 2 }] }), TypeError)
})

test('validateNetlist catches forward refs, ranges, missing outputs and latch capture', () => {
  // A gate may only read constants, inputs, latches or earlier gate outputs.
  const selfRef = C.makeNetlist({ nIn: 2, gates: [{ a: 2, b: 4 }], outputs: [4] })
  const selfCheck = C.validateNetlist(selfRef)
  assert.equal(selfCheck.ok, false)
  assert.match(selfCheck.error, /forward reference/)

  const future = C.makeNetlist({ nIn: 2, gates: [{ a: 2, b: 3 }, { a: 2, b: 5 }], outputs: [5] })
  const futureCheck = C.validateNetlist(future)
  assert.equal(futureCheck.ok, false)
  assert.match(futureCheck.error, /forward reference to node 5/)

  const outOfRange = C.makeNetlist({ nIn: 2, gates: [{ a: 2, b: 99 }], outputs: [3] })
  assert.match(C.validateNetlist(outOfRange).error, /out of range/)

  const noOutputs = C.makeNetlist({ nIn: 2, gates: [], outputs: [] })
  assert.match(C.validateNetlist(noOutputs).error, /at least one output/)

  const badOutput = C.makeNetlist({ nIn: 2, gates: [], outputs: [9] })
  assert.match(C.validateNetlist(badOutput).error, /out of range/)

  const wrongNOut = {
    nIn: 2,
    nOut: 1,
    nState: 0,
    gates: [],
    outputs: [2, 3],
    firstLatchInput: null,
  }
  assert.match(C.validateNetlist(wrongNOut).error, /nOut/)

  const noLatchCapture = {
    nIn: 2,
    nOut: 1,
    nState: 2,
    gates: [],
    outputs: [4],
    firstLatchInput: null,
  }
  assert.match(C.validateNetlist(noLatchCapture).error, /firstLatchInput/)

  const stuckLatchCapture = {
    nIn: 2,
    nOut: 1,
    nState: 2,
    gates: [],
    outputs: [4],
    firstLatchInput: 6,
  }
  assert.match(C.validateNetlist(stuckLatchCapture).error, /does not leave room/)

  assert.equal(C.validateNetlist(null).ok, false)
  assert.equal(C.validateNetlist({}).ok, false)
})

// ---------------------------------------------------------------------------
// canonical circuits: shape and exact output node order
// ---------------------------------------------------------------------------
test('canonical half adder is the 5-NAND XOR/AND circuit with outputs [sum, carry]', () => {
  const ha = C.canonical.halfAdder()
  assert.equal(ha.nIn, 2)
  assert.equal(ha.nOut, 2)
  assert.equal(ha.nState, 0)
  assert.equal(ha.gates.length, 5)
  assert.deepEqual(Array.from(ha.gates).map((g) => [g.a, g.b]), [
    [2, 3],
    [2, 4],
    [3, 4],
    [5, 6],
    [4, 4],
  ])
  assert.deepEqual(Array.from(ha.outputs), [7, 8])
  assert.equal(C.gateCount(ha), 5)
  assert.equal(C.maxDepth(ha), 3)
  assert.equal(C.validateNetlist(ha).ok, true)
})

test('canonical full adder is the 9-NAND circuit with outputs [sum, carry]', () => {
  const fa = C.canonical.fullAdder()
  assert.equal(fa.nIn, 3)
  assert.equal(fa.nOut, 2)
  assert.equal(fa.nState, 0)
  assert.equal(fa.gates.length, 9)
  assert.deepEqual(Array.from(fa.gates).map((g) => [g.a, g.b]), [
    [2, 3],
    [2, 5],
    [3, 5],
    [6, 7],
    [8, 4],
    [5, 9],
    [8, 9],
    [4, 9],
    [11, 12],
  ])
  assert.deepEqual(Array.from(fa.outputs), [13, 10])
  assert.equal(C.maxDepth(fa), 6)
  assert.equal(C.validateNetlist(fa).ok, true)
})

test('canonical 4-bit ripple adder is 36 NAND with outputs [S0, S1, S2, S3, Cout]', () => {
  const add = C.canonical.fourBitAdder()
  assert.equal(add.nIn, 9) // A0..A3, B0..B3, Cin
  assert.equal(add.nOut, 5)
  assert.equal(add.nState, 0)
  assert.equal(add.gates.length, 36)
  assert.deepEqual(Array.from(add.outputs), [19, 28, 37, 46, 43])
  assert.equal(C.maxDepth(add), 12)
  const ids = C.nodeIds(add)
  assert.deepEqual(ids.inputs, [2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.equal(ids.gateStart, 11)
  assert.equal(ids.gateIds.length, 36)
  assert.equal(ids.nodeCount, 47)
  assert.equal(C.validateNetlist(add).ok, true)
})

test('canonical SR latch is two cross-coupled NAND gates with nState=2 and outputs [Q, Qn]', () => {
  const sr = C.canonical.srLatch()
  assert.equal(sr.nIn, 2) // S, R (active low)
  assert.equal(sr.nOut, 2)
  assert.equal(sr.nState, 2)
  assert.equal(sr.gates.length, 2)
  assert.equal(sr.firstLatchInput, 6)
  assert.deepEqual(Array.from(sr.gates).map((g) => [g.a, g.b]), [
    [2, 5], // next Q = NAND(S, Qn)
    [3, 4], // next Qn = NAND(R, Q)
  ])
  assert.deepEqual(Array.from(sr.outputs), [4, 5])
  assert.equal(C.maxDepth(sr), 1)
  assert.equal(C.validateNetlist(sr).ok, true)
})

// ---------------------------------------------------------------------------
// exhaustive arithmetic
// ---------------------------------------------------------------------------
test('half adder matches real addition on all 4 rows', () => {
  const ha = C.canonical.halfAdder()
  const result = C.exhaustiveVerify(ha, (inputBits) => {
    const x = inputBits & 1
    const y = (inputBits >> 1) & 1
    return (x ^ y) | ((x & y) << 1) // bit 0 = sum, bit 1 = carry
  })
  assert.equal(result.valid, true)
  assert.equal(result.passed, true)
  assert.equal(result.count, 4)
  assert.equal(result.gateCount, 5)
  assert.equal(result.maxDepth, 3)
  assert.equal(result.mismatchCount, 0)
  assert.equal(result.rows.length, 4)
  for (const row of result.rows) {
    assert.equal(row.ok, true)
    const x = row.inputBits & 1
    const y = (row.inputBits >> 1) & 1
    assert.equal('outputs' in row, false)
    assert.equal(row.actualBits, (x ^ y) | ((x & y) << 1))
    assert.equal(row.expectedBits, row.actualBits)
  }
  // evaluate agrees with the table.
  for (let bits = 0; bits < 4; bits += 1) {
    const evaluation = C.evaluate(ha, bits)
    const x = bits & 1
    const y = (bits >> 1) & 1
    assert.deepEqual(evaluation.outputs, [x ^ y, x & y])
    assert.equal(evaluation.outputBits, (x ^ y) | ((x & y) << 1))
    assert.equal(evaluation.signals.length, 9)
  }
})

test('full adder matches real 3-bit addition on all 8 rows', () => {
  const fa = C.canonical.fullAdder()
  const result = C.exhaustiveVerify(fa, (inputBits) => {
    const a = inputBits & 1
    const b = (inputBits >> 1) & 1
    const cin = (inputBits >> 2) & 1
    return a + b + cin // low bit = sum, high bit = carry
  })
  assert.equal(result.passed, true)
  assert.equal(result.count, 8)
  assert.equal(result.rows.length, 8)
  for (let bits = 0; bits < 8; bits += 1) {
    const a = bits & 1
    const b = (bits >> 1) & 1
    const cin = (bits >> 2) & 1
    const total = a + b + cin
    const evaluation = C.evaluate(fa, bits)
    assert.deepEqual(evaluation.outputs, [total & 1, (total >> 1) & 1])
    assert.equal(evaluation.outputBits, total)
  }
})

test('4-bit ripple adder matches A + B + Cin on all 512 rows', () => {
  const add = C.canonical.fourBitAdder()
  const result = C.exhaustiveVerify(add, (inputBits) => {
    const a = inputBits & 0xf
    const b = (inputBits >> 4) & 0xf
    const cin = (inputBits >> 8) & 1
    const total = a + b + cin
    return (total & 0xf) | (((total >> 4) & 1) << 4) // bits 0..3 = S0..S3, bit 4 = Cout
  })
  assert.equal(result.valid, true)
  assert.equal(result.passed, true)
  assert.equal(result.count, 512)
  assert.equal(result.rows.length, 512) // 512 is still inside the display cap
  assert.equal(result.mismatchCount, 0)
  const sample = [0, 1, 0x1ff, 0x155, 0x2aa, 0x3ff]
  for (const bits of sample) {
    const total = (bits & 0xf) + ((bits >> 4) & 0xf) + ((bits >> 8) & 1)
    const evaluation = C.evaluate(add, bits)
    assert.deepEqual(evaluation.outputs, bitsOf(total, 5))
    assert.equal(evaluation.outputBits, total & 0x1f)
  }
})

// ---------------------------------------------------------------------------
// 7-byte codec
// ---------------------------------------------------------------------------
test('gateBytes packs 00 | A(3) | B(3) big-endian, 7 bytes per NAND', () => {
  const ha = C.canonical.halfAdder()
  const bytes = C.gateBytes(ha)
  assert.ok(bytes instanceof Uint8Array)
  assert.equal(bytes.length, 35)
  assert.deepEqual(Array.from(bytes), [
    0, 0, 0, 2, 0, 0, 3,
    0, 0, 0, 2, 0, 0, 4,
    0, 0, 0, 3, 0, 0, 4,
    0, 0, 0, 5, 0, 0, 6,
    0, 0, 0, 4, 0, 0, 4,
  ])
  const hex = C.gateHex(ha)
  assert.equal(hex.length, 2 + 14 * 5)
  assert.match(hex, /^0x[0-9a-f]+$/)
  assert.equal(
    hex,
    '0x' +
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
  )

  // Node ids above 0xff must use the full 3-byte big-endian field.
  const wide = C.makeNetlist({ nIn: 300, gates: [{ a: 300, b: 301 }], outputs: [302] })
  assert.deepEqual(Array.from(C.gateBytes(wide)), [0, 0, 0x01, 0x2c, 0, 0x01, 0x2d])
  assert.equal(C.gateHex(wide), '0x0000012c00012d')
})

// ---------------------------------------------------------------------------
// truth table
// ---------------------------------------------------------------------------
test('truthTable returns 2^nIn rows with outputs and packed outputBits', () => {
  const rows = C.truthTable(C.canonical.halfAdder())
  assert.equal(rows.length, 4)
  for (let bits = 0; bits < 4; bits += 1) {
    const x = bits & 1
    const y = (bits >> 1) & 1
    assert.equal(rows[bits].inputBits, bits)
    assert.deepEqual(rows[bits].outputs, [x ^ y, x & y])
    assert.equal(rows[bits].outputBits, (x ^ y) | ((x & y) << 1))
  }
  const bigInputs = C.makeNetlist({ nIn: 17, gates: [], outputs: [2] })
  assert.throws(() => C.truthTable(bigInputs), RangeError)
})

// ---------------------------------------------------------------------------
// exhaustiveVerify: mismatch reporting and 16-input scale
// ---------------------------------------------------------------------------
test('exhaustiveVerify reports capped mismatches but full counts', () => {
  const ha = C.canonical.halfAdder()
  const wrong = C.exhaustiveVerify(ha, () => 0)
  assert.equal(wrong.valid, true)
  assert.equal(wrong.passed, false)
  assert.equal(wrong.count, 4)
  assert.equal(wrong.mismatchCount, 3) // rows 01, 10 and 11 (11 has carry)
  assert.equal(wrong.mismatches.length, 3)
  assert.equal(wrong.rows.length, 4)
  assert.equal(wrong.rows[0].ok, true)
  assert.equal(wrong.rows[3].ok, false)

  const four = C.canonical.fourBitAdder()
  const allWrong = C.exhaustiveVerify(four, () => 0)
  assert.equal(allWrong.passed, false)
  assert.equal(allWrong.mismatchCount, 511) // only row 0 (0 + 0 + 0) matches expected 0
  assert.equal(allWrong.mismatches.length, 8) // display cap
  for (const mismatch of allWrong.mismatches) {
    assert.equal(mismatch.ok, false)
    assert.equal(mismatch.expectedBits, 0)
    assert.ok(mismatch.actualBits > 0)
  }
  assert.equal(allWrong.rows.length, 512)
  assert.equal(allWrong.rows.filter((row) => row.ok === false).length, 511)
})

test('exhaustiveVerify rejects invalid netlists before scanning', () => {
  const broken = C.makeNetlist({ nIn: 2, gates: [{ a: 2, b: 4 }], outputs: [4] })
  const result = C.exhaustiveVerify(broken, () => 0)
  assert.equal(result.valid, false)
  assert.equal(result.passed, false)
  assert.equal(typeof result.error, 'string')
  assert.match(result.error, /forward reference/)
  assert.equal(result.count, 0)
  assert.deepEqual(result.rows, [])
  assert.deepEqual(result.mismatches, [])
  assert.equal(result.mismatchCount, 0)
})

test('16-input / 65536-row parity verify stays fast and summarizes mismatches', () => {
  const netlist = makeParityNetlist(16)
  assert.equal(netlist.nIn, 16)
  assert.equal(netlist.gates.length, 60)
  const parity = (inputBits) => {
    let p = 0
    for (let i = 0; i < 16; i += 1) p ^= (inputBits >> i) & 1
    return p
  }
  const started = performance.now()
  const result = C.exhaustiveVerify(netlist, parity)
  const elapsed = performance.now() - started
  assert.equal(result.valid, true)
  assert.equal(result.passed, true)
  assert.equal(result.count, 65536)
  assert.equal(result.mismatchCount, 0)
  assert.equal(result.rows.length, 0) // rows are only materialized for <= 512 rows
  assert.ok(elapsed < 2000, '65536-row verify took ' + Math.round(elapsed) + 'ms')

  const oneBadRow = C.exhaustiveVerify(netlist, (inputBits) => parity(inputBits) ^ (inputBits === 0x1234 ? 1 : 0))
  assert.equal(oneBadRow.passed, false)
  assert.equal(oneBadRow.count, 65536)
  assert.equal(oneBadRow.mismatchCount, 1)
  assert.equal(oneBadRow.mismatches.length, 1)
  assert.equal(oneBadRow.mismatches[0].inputBits, 0x1234)
  assert.equal(oneBadRow.rows.length, 0)
})

test('evaluate and step reject malformed arguments and invalid netlists', () => {
  const ha = C.canonical.halfAdder()
  const broken = C.makeNetlist({ nIn: 2, gates: [{ a: 2, b: 4 }], outputs: [4] })
  assert.throws(() => C.evaluate(ha, -1), TypeError)
  assert.throws(() => C.evaluate(ha, 1.5), TypeError)
  assert.throws(() => C.evaluate(ha, 0, { stateBits: -1 }), TypeError)
  assert.throws(() => C.evaluate(broken, 0), /invalid netlist/)
  assert.throws(() => C.step(ha, -1, 0), TypeError)
  assert.throws(() => C.step(ha, 0, -1), TypeError)
})

test('equivalent compares full behaviour and matches compose against full adder', () => {
  assert.equal(C.equivalent(C.canonical.halfAdder(), C.canonical.halfAdder()), true)
  assert.equal(C.equivalent(C.canonical.halfAdder(), C.canonical.fullAdder()), false)
  const swapped = C.makeNetlist({
    nIn: 2,
    gates: [
      { a: 2, b: 3 },
      { a: 2, b: 4 },
      { a: 3, b: 4 },
      { a: 5, b: 6 },
      { a: 4, b: 4 },
    ],
    outputs: [8, 7],
  })
  assert.equal(C.equivalent(C.canonical.halfAdder(), swapped), false)
  assert.equal(C.equivalent(swapped, swapped), true)
})

// ---------------------------------------------------------------------------
// SR latch clock semantics
// ---------------------------------------------------------------------------
test('srLatch holds, sets and resets across clock beats (active-low S/R)', () => {
  const sr = C.canonical.srLatch()
  const HOLD = 0b11 // S=1, R=1
  const SET = 0b10 // S=0, R=1
  const RESET = 0b01 // S=1, R=0
  const RESET_STATE = 0b10 // Q=0, Qn=1 (bit 0 = Q)
  const SET_STATE = 0b01 // Q=1, Qn=0

  // Reset state shows Q=0, Qn=1 and holds while S=R=1.
  let state = RESET_STATE
  let evaluation = C.evaluate(sr, HOLD, { stateBits: state })
  assert.deepEqual(evaluation.outputs, [0, 1])
  const held = C.step(sr, HOLD, state)
  assert.equal(held.stateBits, RESET_STATE)
  assert.deepEqual(held.outputs, [0, 1])
  assert.deepEqual(held.nextOutputs, [0, 1])

  // Set: S=0 forces Q high. A cross-coupled latch settles one gate level per beat,
  // so it reaches the stable (1,0) state on the second beat and then holds.
  state = C.step(sr, SET, state).stateBits
  assert.equal(state, 0b11) // transient Q=Qn=1 on the first beat
  state = C.step(sr, SET, state).stateBits
  assert.equal(state, SET_STATE)
  evaluation = C.evaluate(sr, HOLD, { stateBits: state })
  assert.deepEqual(evaluation.outputs, [1, 0])
  assert.equal(C.step(sr, HOLD, state).stateBits, SET_STATE)

  // Reset: R=0 clears Q, again settling on the second beat.
  state = C.step(sr, RESET, state).stateBits
  assert.equal(state, 0b11)
  state = C.step(sr, RESET, state).stateBits
  assert.equal(state, RESET_STATE)
  assert.deepEqual(C.evaluate(sr, HOLD, { stateBits: state }).outputs, [0, 1])

  // Both active (forbidden input) is raw NAND, not magic: both outputs read high.
  const forbidden = C.step(sr, 0b00, RESET_STATE)
  assert.equal(forbidden.stateBits, 0b11)
  assert.deepEqual(C.evaluate(sr, 0b00, { stateBits: 0b11 }).outputs, [1, 1])
})

test('step is a no-op on combinational netlists', () => {
  const ha = C.canonical.halfAdder()
  for (let bits = 0; bits < 4; bits += 1) {
    const stepped = C.step(ha, bits, 0)
    const evaluation = C.evaluate(ha, bits)
    assert.equal(stepped.stateBits, 0)
    assert.equal(stepped.outputBits, evaluation.outputBits)
    assert.deepEqual(stepped.outputs, evaluation.outputs)
    assert.deepEqual(stepped.nextOutputs, evaluation.outputs)
  }
})

// ---------------------------------------------------------------------------
// composition (LEGO)
// ---------------------------------------------------------------------------
test('compose(two half adders + OR) yields a flat netlist equivalent to the canonical full adder', () => {
  const ha = C.canonical.halfAdder()
  const or = makeOrNetlist()
  const composed = C.compose({
    nIn: 3, // A = 2, B = 3, Cin = 4
    parts: [
      { netlist: ha, inputNodes: [2, 3], outputNodes: [5, 6] }, // s1 = 5, c1 = 6
      { netlist: ha, inputNodes: [5, 4], outputNodes: [7, 8] }, // sum = 7, c2 = 8
      { netlist: or, inputNodes: [6, 8], outputNodes: [9] }, // carry = 9
    ],
  })
  assert.equal(composed.nIn, 3)
  assert.equal(composed.nOut, 2) // only the dangling outputs: [sum, carry]
  assert.equal(composed.nState, 0)
  assert.equal(composed.gates.length, 13) // 5 + 5 + 3
  assert.equal(C.validateNetlist(composed).ok, true)

  // Dense renumbering: outer gate ids are contiguous from 2 + nIn.
  const ids = C.nodeIds(composed)
  assert.equal(ids.gateStart, 5)
  assert.equal(ids.gateIds.length, 13)
  assert.equal(ids.gateIds[0], 5)
  assert.equal(ids.gateIds[12], 17)
  for (let i = 1; i < ids.gateIds.length; i += 1) {
    assert.equal(ids.gateIds[i], ids.gateIds[i - 1] + 1)
  }
  // Outputs are [ha2 sum, or carry] in part order and match the canonical order.
  assert.deepEqual(Array.from(composed.outputs), [13, 17])

  assert.equal(C.equivalent(composed, C.canonical.fullAdder()), true)
  const result = C.exhaustiveVerify(composed, (inputBits) => {
    const a = inputBits & 1
    const b = (inputBits >> 1) & 1
    const cin = (inputBits >> 2) & 1
    return a + b + cin
  })
  assert.equal(result.passed, true)
  assert.equal(result.rows.length, 8)
})

test('compose of four full adders reproduces the canonical 4-bit adder', () => {
  const fa = C.canonical.fullAdder()
  const parts = []
  const sumKeys = []
  let cinKey = 10 // Cin outer input node
  let nextKey = 11
  for (let i = 0; i < 4; i += 1) {
    const sumKey = nextKey
    const carryKey = nextKey + 1
    nextKey += 2
    parts.push({
      netlist: fa,
      inputNodes: [2 + i, 6 + i, cinKey], // A_i, B_i, carry-in
      outputNodes: [sumKey, carryKey],
    })
    sumKeys.push(sumKey)
    cinKey = carryKey
  }
  const composed = C.compose({ nIn: 9, parts, outputs: [...sumKeys, cinKey] })
  assert.equal(composed.gates.length, 36)
  assert.equal(composed.nOut, 5)
  assert.equal(C.validateNetlist(composed).ok, true)
  assert.equal(C.equivalent(composed, C.canonical.fourBitAdder()), true)
  const result = C.exhaustiveVerify(composed, (inputBits) => {
    const a = inputBits & 0xf
    const b = (inputBits >> 4) & 0xf
    const cin = (inputBits >> 8) & 1
    const total = a + b + cin
    return (total & 0xf) | (((total >> 4) & 1) << 4)
  })
  assert.equal(result.passed, true)
  assert.equal(result.count, 512)
})

test('compose can return explicit output order and auto-dangling outputs', () => {
  const ha = C.canonical.halfAdder()
  const or = makeOrNetlist()
  const parts = [
    { netlist: ha, inputNodes: [2, 3], outputNodes: [5, 6] },
    { netlist: ha, inputNodes: [5, 4], outputNodes: [7, 8] },
    { netlist: or, inputNodes: [6, 8], outputNodes: [9] },
  ]
  // Explicit order: carry first, sum second.
  const swapped = C.compose({ nIn: 3, parts, outputs: [9, 7] })
  assert.equal(swapped.nOut, 2)
  const check = C.exhaustiveVerify(swapped, (inputBits) => {
    const a = inputBits & 1
    const b = (inputBits >> 1) & 1
    const cin = (inputBits >> 2) & 1
    const total = a + b + cin
    const sum = total & 1
    const carry = (total >> 1) & 1
    return carry | (sum << 1) // bit 0 = outputs[0] = carry
  })
  assert.equal(check.passed, true)

  // No outputNodes: both half-adder outputs are dangling and stay in order.
  const standalone = C.compose({ nIn: 2, parts: [{ netlist: ha, inputNodes: [2, 3] }] })
  assert.equal(standalone.nOut, 2)
  assert.equal(standalone.gates.length, 5)
  assert.equal(C.equivalent(standalone, C.canonical.halfAdder()), true)
})

test('compose validates wiring and rejects malformed parts', () => {
  const ha = C.canonical.halfAdder()
  const or = makeOrNetlist()
  assert.throws(
    () => C.compose({ nIn: 2, parts: [{ netlist: ha, inputNodes: [2, 99], outputNodes: [5, 6] }] }),
    /unknown outer node 99/,
  )
  // A part cannot read an output that is produced later (also catches wiring order bugs).
  assert.throws(
    () =>
      C.compose({
        nIn: 3,
        parts: [
          { netlist: ha, inputNodes: [5, 4], outputNodes: [7, 8] },
          { netlist: ha, inputNodes: [2, 3], outputNodes: [5, 6] },
        ],
      }),
    /unknown outer node 5/,
  )
  // A part output may not overwrite a constant or an outer input node.
  assert.throws(
    () => C.compose({ nIn: 2, parts: [{ netlist: ha, inputNodes: [2, 3], outputNodes: [2, 6] }] }),
    /cannot overwrite outer input node 2/,
  )
  assert.throws(
    () => C.compose({ nIn: 2, parts: [{ netlist: ha, inputNodes: [2, 3], outputNodes: [0, 6] }] }),
    /cannot drive constant node 0/,
  )
  // Two parts cannot drive the same outer key.
  assert.throws(
    () =>
      C.compose({
        nIn: 2,
        parts: [
          { netlist: ha, inputNodes: [2, 3], outputNodes: [5, 6] },
          { netlist: ha, inputNodes: [2, 3], outputNodes: [5, 7] },
        ],
      }),
    /produced by more than one part output/,
  )
  // Stateful parts are not composable (the contract has a single latch capture group).
  assert.throws(
    () =>
      C.compose({
        nIn: 2,
        parts: [{ netlist: C.canonical.srLatch(), inputNodes: [2, 3], outputNodes: [4, 5] }],
      }),
    /stateful/,
  )
  assert.throws(() => C.compose({ nIn: 2, parts: [{ netlist: ha, inputNodes: [2], outputNodes: [5] }] }), /inputNodes/)
  assert.throws(
    () => C.compose({ nIn: 2, parts: [{ netlist: or, inputNodes: [2, 3], outputNodes: [] }] }),
    /outputNodes/,
  )
  assert.throws(
    () => C.compose({ nIn: 2, parts: [{ netlist: or, inputNodes: [2, 3], outputNodes: [4] }], outputs: [99] }),
    /outputs\[0\]/,
  )
  assert.throws(() => C.compose({ nIn: -1, parts: [] }), TypeError)
})

test('compose can splice constants into part inputs', () => {
  // NOT as NAND(a, a) fed from constant 1 -> output 0.
  const notPart = C.makeNetlist({ nIn: 1, gates: [{ a: 2, b: 2 }], outputs: [3] })
  const composed = C.compose({ nIn: 0, parts: [{ netlist: notPart, inputNodes: [1], outputNodes: [2] }] })
  assert.equal(composed.nIn, 0)
  assert.equal(composed.nOut, 1)
  assert.equal(C.gateCount(composed), 1)
  assert.equal(C.evaluate(composed, 0).outputs[0], 0) // NOT 1 = 0
})


