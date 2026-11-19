/**
 * tests/challenge.test.mjs — switchable chapter challenge: timer, action par, mistakes.
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
const M = TT.Missions

test('challenge can be switched on at any time and blocks shortcuts', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'challenge/start' })
  assert.equal(state.challenge.active, true)
  assert.equal(state.play.minted.length, 0)
  state = M.reduce(state, { type: 'mint/all' })
  assert.equal(state.toast.key, 'challenge.noShortcut')
  assert.equal(state.play.minted.length, 0)
})

test('a clean fast run earns 3 stars and records actions', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'challenge/start' })
  for (const chip of state.play.mintOrder) state = M.reduce(state, { type: 'mint', chip: `chip:${chip}` })
  assert.equal(state.challenge.active, false)
  assert.equal(state.completed[0], true)
  const result = state.challenge.lastResult
  assert.equal(result.stars, 3)
  assert.ok(result.actions <= TT.Missions.challengeConfig(0).par)
  assert.ok(TT.Achievements.evaluate(state).find((item) => item.id === 'challengeGold').done)
})

test('reset clears the run counters; switching back restores normal mode', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'challenge/start' })
  state = M.reduce(state, { type: 'mint', chip: 'chip:0' })
  assert.ok(state.challenge.actions >= 1)
  state = M.reduce(state, { type: 'challenge/reset' })
  assert.equal(state.challenge.actions, 0)
  assert.equal(state.challenge.mistakes, 0)
  assert.equal(state.play.minted.length, 0)
  state = M.reduce(state, { type: 'challenge/abandon' })
  assert.equal(state.challenge.active, false)
})

test('the mode behaves normally after switching back', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'challenge/start' })
  state = M.reduce(state, { type: 'challenge/abandon' })
  assert.equal(state.challenge.active, false)
  // normal mode shortcuts work again (after minting two chips by hand)
  state = M.reduce(state, { type: 'mint', chip: 'chip:0' })
  state = M.reduce(state, { type: 'mint', chip: 'chip:1' })
  state = M.reduce(state, { type: 'mint/all' })
  assert.equal(state.completed[0], true)
  state = M.reduce(state, { type: 'challenge/start' })
  assert.equal(state.challenge.active, true)
  state = M.reduce(state, { type: 'challenge/abandon' })
  assert.equal(state.completed[0], true)
})


test('chapter 1 challenge enforces the minting order and counts mistakes', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'challenge/start' })
  const order = state.play.mintOrder
  state = M.reduce(state, { type: 'mint', chip: `chip:${order[1]}` })
  assert.equal(state.play.minted.length, 0)
  assert.equal(state.challenge.mistakes, 1)
  for (const chip of order) state = M.reduce(state, { type: 'mint', chip: `chip:${chip}` })
  assert.equal(state.completed[0], true)
  assert.equal(state.challenge.active, false)
})

test('chapter 4 challenge quizzes gates, burn amount and pins', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'chapter/select', index: 3 })
  state = M.reduce(state, { type: 'challenge/start' })
  state = M.reduce(state, { type: 'tapeout/quiz', step: 'gates', value: 9 })
  assert.equal(state.challenge.mistakes, 1)
  state = M.reduce(state, { type: 'tapeout/quiz', step: 'gates', value: 5 })
  assert.equal(state.play.quizStep, 'burn')
  state = M.reduce(state, { type: 'tapeout/quiz', step: 'burn', value: 10 })
  assert.equal(state.challenge.mistakes, 2)
  state = M.reduce(state, { type: 'tapeout/quiz', step: 'burn', value: 5 })
  assert.equal(state.play.quizStep, 'pins')
  state = M.reduce(state, { type: 'tapeout/quiz', step: 'pins', value: '22' })
  assert.equal(state.play.quizPassed, true)
})
