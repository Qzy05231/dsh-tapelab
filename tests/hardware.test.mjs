/**
 * tests/hardware.test.mjs — 74HC00 real-hardware planner: BOM, pin map, wiring list.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '39-hardware.js']) new Function('TT', read(name))(TT)
const H = TT.Hardware

test('half adder maps onto two 74HC00 chips with a complete wiring list', () => {
  const half = TT.Circuit.canonical.halfAdder()
  const plan = H.plan(half)
  assert.equal(plan.gates, 5)
  assert.equal(plan.chips, 2)
  assert.equal(plan.pinTable.length, 5)
  assert.ok(plan.wireList.length >= 10, `wire count ${plan.wireList.length}`)
  assert.equal(plan.bom[0].qty, 2)
  assert.equal(plan.bom.find((entry) => entry.item.includes('LED')).qty, 2)
  assert.equal(plan.boards, 1)
  // gate 5 of the half adder is NAND(g1,g1) -> both inputs must appear as wires
  const gate5 = plan.pinTable[4]
  assert.equal(gate5.pins, 'A1 B2 Y3')
  assert.equal(gate5.chip, 2)
  const wiresToGate5 = plan.wireList.filter((wire) => wire.to.includes('U2 脚1（') || wire.to.includes('U2 脚2（'))
  assert.equal(wiresToGate5.length, 2)
})

test('pin assignment follows the 74HC00 DIP-14 pinout', () => {
  assert.deepEqual(H.gatePins(0), { chip: 1, unit: 1, a: 1, b: 2, y: 3 })
  assert.deepEqual(H.gatePins(1), { chip: 1, unit: 2, a: 4, b: 5, y: 6 })
  assert.deepEqual(H.gatePins(2), { chip: 1, unit: 3, a: 9, b: 10, y: 8 })
  assert.deepEqual(H.gatePins(3), { chip: 1, unit: 4, a: 12, b: 13, y: 11 })
  assert.equal(H.gatePins(4).chip, 2)
})

test('BOM, wiring CSV and build guide are exportable', () => {
  const plan = H.plan(TT.Circuit.canonical.halfAdder())
  const bom = H.bomCsv(plan)
  assert.ok(bom.startsWith('item,qty,note'))
  assert.ok(bom.includes('74HC00'))
  const wires = H.wiresCsv(plan)
  assert.ok(wires.startsWith('from,to,note'))
  assert.equal(wires.trim().split('\n').length, plan.wireList.length + 1)
  const guide = H.markdown(plan, 'half adder', TT.Circuit.canonical.halfAdder())
  assert.ok(guide.includes('面包板搭建指南'))
  assert.ok(guide.includes('采购清单'))
  assert.ok(guide.includes('连线表'))
})

test('stateful and large circuits carry warnings, seven-segment plans 28 chips', () => {
  const latch = H.plan(TT.Circuit.canonical.srLatch())
  assert.equal(latch.stateful, true)
  assert.ok(latch.warnings.some((warning) => warning.includes('时序')))
  const seven = H.plan(TT.Circuit.canonical.sevenSegment())
  assert.equal(seven.chips, 28)
  assert.equal(seven.boards, 14)
  assert.ok(seven.warnings.length >= 1)
})
