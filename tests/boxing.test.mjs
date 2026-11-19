/**
 * tests/boxing.test.mjs — NAND-referee boxing: rules, CPU, match reducer and verifiable receipts.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '38-export.js', '46-boxing.js', '30-missions.js']) new Function('TT', read(name))(TT)
const B = TT.Boxing

test('referee circuit implements the action table and audits clean', () => {
  const built = B.circuit()
  assert.ok(built.gateCount >= 1)
  const audit = B.audit()
  assert.equal(audit.passed, true)
  assert.equal(audit.rows, 9)
  const cases = [
    ['punch', 'guard', 0, 0],
    ['punch', 'punch', 1, 1],
    ['punch', 'feint', 1, 0],
    ['guard', 'feint', 0, 1],
    ['feint', 'guard', 1, 0],
    ['feint', 'punch', 0, 1],
    ['guard', 'punch', 0, 0],
    ['feint', 'feint', 0, 0],
  ]
  for (const [player, cpu, playerScore, cpuScore] of cases) {
    const result = B.resolve(player, cpu)
    assert.equal(result.playerScore, playerScore, `${player} vs ${cpu}`)
    assert.equal(result.cpuScore, cpuScore, `${player} vs ${cpu}`)
  }
})

test('CPU is deterministic per seed/exchange and always a legal action', () => {
  const first = B.cpuAction('ring-genesis', 0)
  assert.equal(first, B.cpuAction('ring-genesis', 0))
  for (let i = 0; i < 30; i += 1) {
    assert.ok(B.ACTIONS.some((action) => action.id === B.cpuAction('ring-genesis', i)))
  }
})

test('reducer plays exchanges, finishes a match and issues a receipt', () => {
  let state = TT.Missions.initial()
  assert.ok(state.boxing)
  assert.equal(state.boxing.playerHp, B.START_HP)
  state = TT.Missions.reduce(state, { type: 'boxing/action', action: 'punch' })
  assert.equal(state.boxing.log.length, 1)
  assert.equal(state.boxing.last.player, 'punch')
  let guard = 0
  while (!state.boxing.finished && guard < 40) {
    state = TT.Missions.reduce(state, { type: 'boxing/action', action: 'punch' })
    guard += 1
  }
  assert.equal(state.boxing.finished, true)
  assert.ok(['win', 'lose', 'draw'].includes(state.boxing.result))
  assert.ok(state.boxing.receipt.code)
  state = TT.Missions.reduce(state, { type: 'boxing/verify' })
  assert.equal(state.boxing.verifyResult.ok, true)
  assert.ok(state.boxing.verifyResult.playerHp === state.boxing.playerHp)
})

test('tampered match logs fail verification', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'boxing/action', action: 'punch' })
  const code = state.boxing.receipt
  // no receipt until finished; finish quickly by setting hp through a full loop
  let guard = 0
  while (!state.boxing.finished && guard < 40) {
    state = TT.Missions.reduce(state, { type: 'boxing/action', action: 'punch' })
    guard += 1
  }
  const issued = state.boxing.receipt.code
  const payload = JSON.parse(B.unb64url(issued))
  payload.log[0].playerScore = payload.log[0].playerScore === 1 ? 0 : 1
  const bad = B.verify(B.b64url(JSON.stringify(payload)))
  assert.equal(bad.ok, false)
  assert.ok(bad.reasons.length > 0)
})
