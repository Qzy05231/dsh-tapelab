/**
 * tests/netgrid.test.mjs — depth layout and interaction helpers for the netlist grid.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '28-safety.js', '30-missions.js', '52-netgrid.js']) new Function('TT', read(name))(TT)
const G = TT.NetlistGrid

test('the safety netlist lays out over 32 levels with 80 gates and 4 outputs', () => {
  const netlist = TT.Safety.netlist()
  const plan = G.layout(netlist)
  assert.equal(plan.gateCards.length, 80)
  assert.equal(plan.maxLevel, 32)
  assert.equal(plan.outputs.length, 4)
  assert.ok(plan.width > 600 && plan.height < 900)
  assert.equal(plan.inputRows, 1)
  assert.equal(G.fitScale(plan, 1000, 650), 1)
  assert.ok(G.fitScale(plan, 400, 300) < 1)
  assert.equal(G.fitScale(plan, 0, 0), 1)
  const compact = G.layout(TT.Safety.netlist(), { compact: true })
  assert.equal(compact.gateCards.length, 80)
  assert.ok(compact.width < 340 && compact.height < 440)
  assert.ok(G.fitScale(compact, 320, 430) > 0.8)
  for (const card of plan.gateCards) {
    assert.ok(plan.nodes[card.node], `missing position for gate ${card.index}`)
    assert.equal(card.a, netlist.gates[card.index].a)
  }
})

test('values read every node and the allow preset is one-hot', () => {
  const netlist = TT.Safety.netlist()
  const signals = G.values(netlist, TT.Safety.PRESETS.allow)
  assert.equal(signals.length, 2 + 16 + 80)
  assert.deepEqual(netlist.outputs.map((node) => signals[node]), [1, 0, 0, 0])
  assert.equal(signals[0], 0)
  assert.equal(signals[1], 1)
})

test('a small netlist gets fewer levels and no invalid positions', () => {
  const half = TT.Circuit.canonical.halfAdder()
  const plan = G.layout(half)
  assert.equal(plan.gateCards.length, half.gates.length)
  assert.ok(plan.maxLevel >= 1 && plan.maxLevel <= 4)
  assert.equal(plan.outputs.length, 2)
})

test('the grid overlay opens and closes', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'grid/open' })
  assert.equal(state.gridOpen, true)
  state = TT.Missions.reduce(state, { type: 'grid/close' })
  assert.equal(state.gridOpen, false)
})


test('sequential netlists evaluate with state bits', () => {
  const counter = TT.Circuit.canonical.counter4()
  const values0 = G.values(counter, 0, 0)
  assert.equal(values0.length, 2 + (counter.nIn || 0) + (counter.nState || 0) + counter.gates.length)
  const step1 = TT.Circuit.step(counter, 0, 0)
  assert.equal(step1.stateBits, 1)
  const plan = G.layout(counter)
  assert.ok(plan.gateCards.length === counter.gates.length)
  const latch = TT.Circuit.canonical.srLatch()
  assert.ok(latch.nState >= 1)
  const signals = G.values(latch, 1, 0)
  assert.equal(signals.length, 2 + latch.nIn + latch.nState + latch.gates.length)
})

test('grid overlay remembers which kind was opened', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'grid/open', kind: 'counter' })
  assert.equal(state.gridOpen, true)
  assert.equal(state.gridKind, 'counter')
  state = TT.Missions.reduce(state, { type: 'grid/close' })
  assert.equal(state.gridOpen, false)
})


test('inline netlist toggles independently from the big modal', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'grid/inline', kind: 'counter' })
  assert.equal(state.gridInline, true)
  assert.equal(state.gridKind, 'counter')
  assert.equal(state.gridOpen, false)
  state = TT.Missions.reduce(state, { type: 'grid/inline', kind: 'counter' })
  assert.equal(state.gridInline, false)
})
