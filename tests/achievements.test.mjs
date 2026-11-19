/**
 * tests/achievements.test.mjs — badges, records and stats wiring.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '30-missions.js', '47-achievements.js']) new Function('TT', read(name))(TT)
const A = TT.Achievements

test('stats start empty and achievements are locked', () => {
  const state = TT.Missions.initial()
  assert.equal(state.stats.snakeBest, 0)
  assert.equal(state.stats.synth, 0)
  const list = A.evaluate(state)
  assert.equal(list.length, A.LIST.length)
  assert.equal(list.every((item) => !item.done), true)
})

test('synthesizing unlocks the first-synthesis record and badge', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'lab/toggle', index: 0 })
  state = TT.Missions.reduce(state, { type: 'lab/synth' })
  assert.equal(state.stats.synth, 1)
  assert.ok(A.evaluate(state).find((item) => item.id === 'synth1').done)
  assert.deepEqual(A.doneIds(state), ['synth1'])
})

test('unlock actions are idempotent and chapters light badges', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'achv/unlock', ids: ['mint8'], title: 'First transistor' })
  assert.deepEqual(state.unlocked, ['mint8'])
  state = TT.Missions.reduce(state, { type: 'achv/unlock', ids: ['mint8'], title: 'First transistor' })
  assert.deepEqual(state.unlocked, ['mint8'])
  state = TT.Missions.reduce(state, { type: 'achv/open' })
  assert.equal(state.achvOpen, true)
  state = TT.Missions.reduce(state, { type: 'achv/close' })
  assert.equal(state.achvOpen, false)
  const completed = TT.Missions.initial()
  completed.completed = { 0: true, 2: true, 3: true }
  const done = A.evaluate(completed).filter((item) => item.done).map((item) => item.id)
  assert.ok(done.includes('mint8') && done.includes('halfadder') && done.includes('tapeout'))
})
