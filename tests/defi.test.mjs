/**
 * tests/defi.test.mjs — DeFi trade guard (NAND policy) + simulated constant-product AMM.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '38-export.js', '45-defi.js', '30-missions.js']) new Function('TT', read(name))(TT)
const D = TT.Defi

test('guard circuit is a 4-input AND and audits clean', () => {
  const built = D.circuit()
  assert.equal(built.gateCount, 6)
  const audit = D.audit()
  assert.equal(audit.passed, true)
  assert.equal(audit.count, 16)
  for (let bits = 0; bits < 16; bits += 1) {
    assert.equal(TT.Circuit.evaluate(built.netlist, bits).outputBits & 1, bits === 15 ? 1 : 0)
  }
})

test('constant-product quote preserves the pool constant', () => {
  const pool = { x: 100, y: 200000 }
  const quote = D.quote(pool, 10)
  assert.ok(quote.amountOut > 0)
  assert.ok(quote.newX > pool.x && quote.newY < pool.y)
  const kBefore = pool.x * pool.y
  const kAfter = quote.newX * quote.newY
  assert.ok(Math.abs(kAfter - kBefore) / kBefore < 1e-9)
})

test('guard blocks bad trades and allows good ones', () => {
  const base = { poolId: 'eth-usdc', x: 100, y: 200000, amountIn: 1, maxImpact: 5, cap: 2, impact: 0.01, allowlisted: 1, paused: 0, oracle: 1 }
  assert.equal(D.evaluate(base).allow, true)
  assert.equal(D.evaluate({ ...base, paused: 1 }).allow, false)
  assert.equal(D.evaluate({ ...base, oracle: 0 }).allow, false)
  assert.equal(D.evaluate({ ...base, allowlisted: 0 }).allow, false)
  assert.equal(D.evaluate({ ...base, amountIn: 9, impact: 0.09 }).allow, false)
  assert.ok(D.evaluate({ ...base, paused: 1 }).reasons.length > 0)
})

test('receipts verify and tampering is detected', () => {
  const args = { poolId: 'eth-usdc', x: 100, y: 200000, amountIn: 2, maxImpact: 5, cap: 5, impact: 0.02, allowlisted: 1, paused: 0, oracle: 1 }
  const issued = D.receipt(args)
  assert.equal(D.verify(issued.code).ok, true)
  const payload = JSON.parse(D.unb64url(issued.code))
  payload.bits = 7
  const tampered = D.verify(D.b64url(JSON.stringify(payload)))
  assert.equal(tampered.ok, false)
  assert.equal(D.verify(issued.code, 'deadbeef').ok, false)
})

test('reducer executes only allowed trades and updates the pool', () => {
  let state = TT.Missions.initial()
  const before = state.defi.pools['eth-usdc']
  state = TT.Missions.reduce(state, { type: 'defi/execute' })
  const after = state.defi.pools['eth-usdc']
  assert.ok(after.x > before.x && after.y < before.y)
  assert.equal(state.defi.trades.length, 1)
  // pause the protocol: no execution
  state = TT.Missions.reduce(state, { type: 'defi/flag', key: 'paused' })
  const pausedBefore = state.defi.pools['eth-usdc']
  state = TT.Missions.reduce(state, { type: 'defi/execute' })
  assert.deepEqual(state.defi.pools['eth-usdc'], pausedBefore)
  // audit + receipt
  state = TT.Missions.reduce(state, { type: 'defi/audit' })
  assert.equal(state.defi.audit.passed, true)
  state = TT.Missions.reduce(state, { type: 'defi/issue' })
  state = TT.Missions.reduce(state, { type: 'defi/verify' })
  assert.equal(state.defi.verifyResult.ok, true)
})
