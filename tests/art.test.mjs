/**
 * tests/art.test.mjs — deterministic circuit-state generative art.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '38-export.js', '43-art.js', '30-missions.js']) new Function('TT', read(name))(TT)
const A = TT.Art

test('frames are deterministic and change with the block index', () => {
  const a = A.params({ seed: 'genesis', circuit: 'lfsr8', palette: 0, index: 7 })
  const b = A.params({ seed: 'genesis', circuit: 'lfsr8', palette: 0, index: 7 })
  assert.equal(a.hash, b.hash)
  assert.deepEqual(a.cells, b.cells)
  const next = A.params({ seed: 'genesis', circuit: 'lfsr8', palette: 0, index: 8 })
  assert.notEqual(a.hash, next.hash)
  assert.ok(a.grid >= 8 && a.grid <= 12)
  assert.ok(a.rings >= 3)
})

test('counter4 state advances with the real NAND counter', () => {
  const expected = TT.Circuit.canonical.counter4()
  let state = 0
  for (let i = 0; i < 5; i += 1) state = TT.Circuit.step(expected, 0, state).stateBits & 15
  assert.equal(A.circuitState('genesis', 'counter4', 5), state)
  assert.equal(A.params({ seed: 'genesis', circuit: 'counter4', palette: 1, index: 5 }).state, state)
})

test('artwork codes verify and tampering is detected', () => {
  const frame = A.params({ seed: 'genesis', circuit: 'lfsr8', palette: 2, index: 3 })
  const code = A.artworkCode(frame)
  assert.equal(A.verify(code).ok, true)
  assert.equal(A.verify(code, frame.hash).ok, true)
  assert.equal(A.verify(code, 'deadbeef').ok, false)
  // tamper the seed inside the artwork code
  const payload = JSON.parse(A.unb64url(code))
  payload.seed = 'tampered'
  const tampered = A.b64url(JSON.stringify(payload))
  const result = A.verify(tampered)
  assert.equal(result.ok, false)
  assert.ok(result.reasons.join(' ').includes('哈希'))
  // PNG export degrades to null without a DOM
  assert.equal(A.pngDataUrl(frame, 256), null)
})

test('reducer steps, mints and reloads art frames', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'art/step' })
  state = TT.Missions.reduce(state, { type: 'art/step' })
  assert.equal(state.art.index, 2)
  state = TT.Missions.reduce(state, { type: 'art/mint' })
  assert.equal(state.art.gallery.length, 1)
  const code = state.art.gallery[0].code
  state = TT.Missions.reduce(state, { type: 'art/verifyCode', code })
  state = TT.Missions.reduce(state, { type: 'art/verify' })
  assert.equal(state.art.verifyResult.ok, true)
  state = TT.Missions.reduce(state, { type: 'art/palette', palette: 2 })
  state = TT.Missions.reduce(state, { type: 'art/load', code })
  assert.equal(state.art.palette, 0)
  assert.equal(state.art.index, 2)
})
