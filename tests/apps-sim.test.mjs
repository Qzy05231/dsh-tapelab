/**
 * tests/apps-sim.test.mjs — DeWeb / TapeRelay / container simulation helpers and state.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '30-missions.js', '52-apps-sim.js']) new Function('TT', read(name))(TT)
const S = TT.AppSims

test('files split into unique hashed chunks and tampering is detected', () => {
  const chunks = S.chunkFile('demo-video', 4)
  assert.equal(chunks.length, 4)
  assert.equal(new Set(chunks.map((chunk) => chunk.hash)).size, 4)
  assert.equal(S.verifyChunk(chunks[0], false).ok, true)
  assert.equal(S.verifyChunk(chunks[0], true).ok, false)
})

test('DeWeb addresses and container images are deterministic', () => {
  assert.equal(S.dewebAddress('site'), S.dewebAddress('site'))
  assert.notEqual(S.dewebAddress('site'), S.dewebAddress('other'))
  const image = { base: 'tapeos-min', circuit: 'half-adder' }
  assert.equal(S.imageHash(image), S.imageHash(image))
  assert.notEqual(S.imageHash(image), S.imageHash({ ...image, base: 'generic' }))
  assert.equal(S.simByChapter(3).id, 'deweb')
  assert.equal(S.simByChapter(4).id, 'relay')
  assert.equal(S.simByChapter(5).id, 'container')
  assert.equal(S.simByChapter(2), null)
})

test('simulations open, complete and persist their bonus state', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'sims/open', id: 'deweb' })
  assert.equal(state.simOpen, 'deweb')
  state = TT.Missions.reduce(state, { type: 'sims/close' })
  assert.equal(state.simOpen, null)
  state = TT.Missions.reduce(state, { type: 'sims/complete', id: 'relay' })
  assert.equal(state.sims.relay, true)
  assert.equal(state.sims.deweb, false)
  assert.equal(state.toast.key, 'sim.toast.done')
})
