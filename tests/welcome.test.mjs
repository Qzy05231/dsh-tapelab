/**
 * tests/welcome.test.mjs — first-run guide state and onboarding defaults.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
new Function('TT', read('20-circuit.js'))(TT)
new Function('TT', read('30-missions.js'))(TT)
const M = TT.Missions

test('first run shows the guide and starts without the chapter popup', () => {
  const state = M.initial()
  assert.equal(state.welcome, true)
  assert.equal(state.intro, false)
})

test('guide closes, reopens, and never blocks gameplay state', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'welcome/close' })
  assert.equal(state.welcome, false)
  state = M.reduce(state, { type: 'welcome/open' })
  assert.equal(state.welcome, true)
  state = M.reduce(state, { type: 'welcome/close' })
  // normal actions still work afterwards
  state = M.reduce(state, { type: 'chapter/select', index: 3 })
  assert.equal(state.chapter, 3)
  state = M.reduce(state, { type: 'lab/open' })
  assert.equal(state.mode, 'lab')
  state = M.reduce(state, { type: 'arcade/open' })
  assert.equal(state.mode, 'arcade')
  assert.equal(state.welcome, false)
})
