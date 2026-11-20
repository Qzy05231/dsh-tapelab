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

function complete(index, goalCount, actions) {
  let state = M.initial()
  state = M.reduce(state, { type: 'chapter/select', index })
  assert.equal(state.chapter, index)
  assert.equal(M.chapterGoals(state).length, goalCount)
  for (const step of actions) {
    const action = typeof step === 'function' ? step(state) : step
    state = M.reduce(state, action)
  }
  return state
}

test('DeWeb chapter publishes, checks tampering and verifies a site', () => {
  const state = complete(11, 4, [
    { type: 'deweb/hash' },
    { type: 'deweb/strategyBad' },
    { type: 'deweb/strategyOk' },
    { type: 'deweb/publish' },
    (s) => ({ type: 'deweb/inspect', node: (s.play.tamperNode + 1) % 3 }),
    (s) => ({ type: 'deweb/inspect', node: s.play.tamperNode }),
    { type: 'deweb/verify' },
  ])
  assert.ok(state.play.hash.startsWith('deweb://'))
  assert.equal(state.play.strategy, 'pointer')
  assert.equal(state.play.tamperChecked, true)
  assert.equal(state.play.verified, true)
  assert.equal(state.completed[11], true)
  assert.ok(M.chapterGoals(state).every((goal) => goal.done))
})

test('TapeRelay chapter rejects one replica, recovers and sends', () => {
  let state = complete(12, 5, [
    { type: 'relay/split' },
    { type: 'relay/replica1' },
    { type: 'relay/replica3' },
    { type: 'relay/replicate' },
    { type: 'relay/offline' },
    (s) => ({ type: 'relay/inspect', chunk: (s.play.tamperChunk + 1) % 4 }),
    (s) => ({ type: 'relay/inspect', chunk: s.play.tamperChunk }),
    { type: 'relay/send' },
  ])
  assert.equal(state.play.replicaCount, 3)
  assert.equal(state.play.recovered, true)
  assert.equal(state.play.tamperChecked, true)
  assert.equal(state.play.sent, true)
  assert.equal(state.completed[12], true)
})

test('container chapter chooses a minimal base, limits and verifies', () => {
  const state = complete(13, 5, [
    { type: 'container/baseBad' },
    { type: 'container/baseMin' },
    { type: 'container/pack' },
    { type: 'container/authAccount' },
    { type: 'container/authNft' },
    { type: 'container/limit' },
    (s) => ({ type: 'container/inspect', layer: (s.play.tamperLayer + 1) % 3 }),
    (s) => ({ type: 'container/inspect', layer: s.play.tamperLayer }),
    { type: 'container/run' },
  ])
  assert.equal(state.play.base, 'tapeos-min')
  assert.ok(state.play.image.startsWith('sha256:'))
  assert.equal(state.play.auth, true)
  assert.equal(state.play.limits, true)
  assert.equal(state.play.verified, true)
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
