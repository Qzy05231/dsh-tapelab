/**
 * tests/lottery.test.mjs — deterministic, verifiable lottery + LFSR view.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '38-export.js', '42-lottery.js']) new Function('TT', read(name))(TT)
const L = TT.Lottery

const NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi']

test('draw is deterministic and returns unique winners', () => {
  const a = L.draw({ seed: 'block-42', participants: NAMES, count: 3 })
  const b = L.draw({ seed: 'block-42', participants: NAMES, count: 3 })
  assert.deepEqual(a.winners, b.winners)
  assert.equal(a.winners.length, 3)
  assert.equal(new Set(a.winners.map((winner) => winner.name)).size, 3)
  assert.equal(a.poolSize, NAMES.length)
  const other = L.draw({ seed: 'block-43', participants: NAMES, count: 3 })
  assert.notDeepEqual(other.winners.map((winner) => winner.name), a.winners.map((winner) => winner.name))
})

test('participants are parsed, trimmed and de-duplicated', () => {
  const names = L.parseParticipants('  Alice \nBob\n\nalice\nCarol  Smith \r\n')
  assert.deepEqual(names, ['Alice', 'Bob', 'Carol Smith'])
})

test('receipts verify and tampering is detected', () => {
  const result = L.draw({ seed: 'block-42', participants: NAMES, count: 2 })
  const issued = L.receipt(result)
  const verified = L.verify(issued.code)
  assert.equal(verified.ok, true)
  assert.deepEqual(verified.winners.map((winner) => winner.name), result.winners.map((winner) => winner.name))
  // replace the winner name
  const payload = JSON.parse(L.unb64url(issued.code))
  payload.winners[0].name = 'Mallory'
  const tampered = L.b64url(JSON.stringify(payload))
  const bad = L.verify(tampered)
  assert.equal(bad.ok, false)
  assert.ok(bad.reasons.join(' ').includes('不一致'))
  // wrong expected seed hash
  const wrongHash = L.verify(issued.code, 'deadbeef')
  assert.equal(wrongHash.ok, false)
  assert.ok(wrongHash.reasons.join(' ').includes('种子哈希'))
  assert.equal(L.verify('garbage').ok, false)
})

test('8-bit LFSR view is deterministic and non-trivial', () => {
  const a = L.lfsrStates('seed', 8)
  const b = L.lfsrStates('seed', 8)
  assert.deepEqual(a, b)
  assert.equal(a.length, 8)
  assert.ok(a[0] !== a[1])
  assert.ok(a.every((value) => value >= 0 && value <= 255))
})

test('reducer draws, issues a receipt and verifies it', () => {
  const M = new Function('TT', read('30-missions.js'))
  new Function('TT', read('30-missions.js'))(TT)
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'lottery/count', count: 2 })
  state = TT.Missions.reduce(state, { type: 'lottery/draw' })
  assert.ok(state.lottery.result)
  assert.equal(state.lottery.result.winners.length, 2)
  assert.ok(state.lottery.receipt.code)
  state = TT.Missions.reduce(state, { type: 'lottery/verify' })
  assert.equal(state.lottery.verifyResult.ok, true)
})
