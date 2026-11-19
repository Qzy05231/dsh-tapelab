/**
 * tests/oneclick.test.mjs — the formerly one-click chapters now ask one real question.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '30-missions.js']) new Function('TT', read(name))(TT)
const M = TT.Missions

test('mint-all stays locked until two chips were minted by hand', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'mint/all' })
  assert.equal(state.play.minted.length, 0)
  assert.equal(state.toast.key, 'mint.manualFirst')
  state = M.reduce(state, { type: 'mint', chip: 'chip:0' })
  state = M.reduce(state, { type: 'mint', chip: 'chip:1' })
  state = M.reduce(state, { type: 'mint/all' })
  assert.equal(state.play.minted.length, 8)
  assert.equal(state.completed[0], true)
})

test('tape-out requires answering the gate-count check first', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'chapter/select', index: 3 })
  state = M.reduce(state, { type: 'tapeout/start' })
  assert.equal(state.toast.key, 'tapeout.quizFirst')
  state = M.reduce(state, { type: 'tapeout/quiz', value: 4 })
  assert.equal(state.play.quizPassed, false)
  assert.equal(state.toast.key, 'tapeout.quizFail')
  state = M.reduce(state, { type: 'tapeout/quiz', value: 5 })
  assert.equal(state.play.quizPassed, true)
  assert.equal(state.toast.key, 'tapeout.quizOk')
})

test('a wrong check counts as a challenge mistake', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'chapter/select', index: 3 })
  state = M.reduce(state, { type: 'challenge/start' })
  state = M.reduce(state, { type: 'tapeout/quiz', value: 9 })
  assert.equal(state.challenge.mistakes, 1)
  state = M.reduce(state, { type: 'tapeout/quiz', value: 5 })
  assert.equal(state.play.quizPassed, true)
})
