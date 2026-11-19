/**
 * tests/sensors.test.mjs — sensor rule engine: thresholds, multi-output NAND logic,
 * exhaustive audit and verifiable receipts.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '38-export.js', '44-sensors.js', '30-missions.js']) new Function('TT', read(name))(TT)
const S = TT.Sensors

test('every scenario audits clean across all boolean combinations', () => {
  for (const sc of S.SCENARIOS) {
    const built = S.circuit(sc.id)
    assert.ok(built.gateCount >= 1)
    assert.ok(built.depth >= 1)
    const audit = S.audit(sc.id)
    assert.equal(audit.passed, true, sc.id)
    assert.equal(audit.mismatches, 0)
    assert.equal(audit.count, (1 << sc.sensors.length) * sc.outputs.length)
  }
})

test('thresholds convert analog readings into boolean bits', () => {
  const sc = S.scenario('fire')
  // smoke 10 < 20, heat 70 >= 58, co 10 < 60, away 1
  assert.equal(S.bitsFromValues(sc, { smoke: 10, heat: 70, co: 10, away: 1 }, {}), 0b1010)
  assert.equal(S.bitsFromValues(sc, { smoke: 80, heat: 10, co: 10, away: 0 }, {}), 0b0001)
  const evaluation = S.evaluate('fire', { smoke: 80, heat: 70, co: 10, away: 1 }, {})
  assert.deepEqual(evaluation.actuators.map((actuator) => actuator.on), [true, true, false])
  // raised thresholds: nothing triggers
  const calm = S.evaluate('fire', { smoke: 10, heat: 10, co: 10, away: 0 }, { smoke: 90, heat: 90, co: 90 })
  assert.deepEqual(calm.actuators.map((actuator) => actuator.on), [false, false, false])
})

test('receipts verify and tampering is detected', () => {
  const issued = S.receipt('fire', { smoke: 80, heat: 70, co: 10, away: 1 }, {})
  const verified = S.verify(issued.code)
  assert.equal(verified.ok, true)
  assert.deepEqual(verified.outputs, [1, 1, 0])
  // tamper an actuator result
  const payload = JSON.parse(S.unb64url(issued.code))
  payload.outputs[0] = 0
  const bad = S.verify(S.b64url(JSON.stringify(payload)))
  assert.equal(bad.ok, false)
  assert.ok(bad.reasons.join(' ').includes('不一致'))
  // tamper a raw reading so the bits no longer match
  const payload2 = JSON.parse(S.unb64url(issued.code))
  payload2.values.smoke = 0
  const bad2 = S.verify(S.b64url(JSON.stringify(payload2)))
  assert.equal(bad2.ok, false)
  assert.equal(S.verify(issued.code, 'deadbeef').ok, false)
  assert.equal(S.verify('garbage').ok, false)
})

test('reducer drives the rule engine UI', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'sensors/scenario', id: 'server' })
  assert.equal(state.sensors.scenarioId, 'server')
  state = TT.Missions.reduce(state, { type: 'sensors/value', key: 'water', value: 1 })
  assert.equal(state.sensors.values.water, 1)
  state = TT.Missions.reduce(state, { type: 'sensors/audit' })
  assert.equal(state.sensors.audit.passed, true)
  state = TT.Missions.reduce(state, { type: 'sensors/issue' })
  assert.ok(state.sensors.receipt.code)
  state = TT.Missions.reduce(state, { type: 'sensors/verify' })
  assert.equal(state.sensors.verifyResult.ok, true)
  assert.ok(state.sensors.verifyResult.actuators.some((actuator) => actuator.on))
})
