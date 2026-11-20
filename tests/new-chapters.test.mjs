/**
 * tests/new-chapters.test.mjs — DeWeb, TapeRelay and container missions.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '30-missions.js', '52-apps-sim.js', '47-achievements.js']) new Function('TT', read(name))(TT)
const M = TT.Missions

function complete(index, actions) {
  let state = M.initial()
  state = M.reduce(state, { type: 'chapter/select', index })
  assert.equal(state.chapter, index)
  assert.equal(M.chapterGoals(state).length, 3)
  for (const action of actions) state = M.reduce(state, action)
  return state
}

test('DeWeb chapter publishes and verifies a site', () => {
  const state = complete(11, [{ type: 'deweb/hash' }, { type: 'deweb/publish' }, { type: 'deweb/verify' }])
  assert.ok(state.play.hash.startsWith('deweb://'))
  assert.equal(state.play.verified, true)
  assert.equal(state.completed[11], true)
  assert.ok(M.chapterGoals(state).every((goal) => goal.done))
})

test('TapeRelay chapter splits, replicates and sends', () => {
  const state = complete(12, [{ type: 'relay/split' }, { type: 'relay/replicate' }, { type: 'relay/send' }])
  assert.equal(state.play.chunks.length, 4)
  assert.equal(state.play.replicated, true)
  assert.equal(state.play.sent, true)
  assert.equal(state.completed[12], true)
})

test('container chapter packs, binds NFT auth and runs', () => {
  const state = complete(13, [{ type: 'container/pack' }, { type: 'container/auth' }, { type: 'container/run' }])
  assert.ok(state.play.image.startsWith('sha256:'))
  assert.equal(state.play.auth, true)
  assert.equal(state.play.running, true)
  assert.equal(state.completed[13], true)
})

test('the finale requires all fourteen chapters and unlocks the app trio badge', () => {
  let state = M.initial()
  state.completed = {}
  for (let index = 0; index < 11; index += 1) state.completed[index] = true
  assert.equal(M.allDone(state), false)
  state.completed[11] = true
  state.completed[12] = true
  state.completed[13] = true
  assert.equal(M.allDone(state), true)
  assert.ok(TT.Achievements.evaluate(state).find((badge) => badge.id === 'apps').done)
})
