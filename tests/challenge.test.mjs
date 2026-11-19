/**
 * tests/challenge.test.mjs — optional chapter challenge mode with stars.
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

test('challenge requires completing the chapter first', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'challenge/start' })
  assert.equal(state.challenge.active, false)
  assert.equal(state.toast.key, 'challenge.locked')
})

test('challenge resets the chapter, blocks shortcuts and awards stars', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'mint/all' })
  assert.equal(state.completed[0], true)
  state = M.reduce(state, { type: 'challenge/start' })
  assert.equal(state.challenge.active, true)
  assert.equal(state.completed[0], false)
  assert.equal(state.play.minted.length, 0)
  // one-click shortcut is refused
  state = M.reduce(state, { type: 'mint/all' })
  assert.equal(state.toast.key, 'challenge.noShortcut')
  assert.equal(state.play.minted.length, 0)
  for (let chip = 0; chip < 8; chip += 1) state = M.reduce(state, { type: 'mint', chip: `chip:${chip}` })
  assert.equal(state.challenge.active, false)
  assert.equal(state.completed[0], true)
  assert.ok(state.stats.challenge[0].stars >= 1 && state.stats.challenge[0].stars <= 3)
  assert.ok(state.challenge.lastResult && state.challenge.lastResult.stars >= 1)
  assert.ok(TT.Achievements.evaluate(state).find((item) => item.id === 'challenge1').done)
})

test('abandoning restores the completed state', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'mint/all' })
  state = M.reduce(state, { type: 'challenge/start' })
  assert.equal(state.completed[0], false)
  state = M.reduce(state, { type: 'challenge/abandon' })
  assert.equal(state.challenge.active, false)
  assert.equal(state.completed[0], true)
})
