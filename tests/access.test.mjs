/**
 * tests/access.test.mjs — verifiable access/eligibility policies and receipts.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '38-export.js', '41-access.js']) new Function('TT', read(name))(TT)
const A = TT.Access

test('every access policy audits clean against its truth function', () => {
  for (const policy of A.POLICIES) {
    const audit = A.audit(policy.id)
    assert.equal(audit.passed, true, policy.id)
    assert.equal(audit.count, 1 << policy.inputs.length)
    assert.equal(audit.mismatches, 0)
    assert.ok(audit.gateCount >= 1)
  }
})

test('receipts round-trip and are self-contained', () => {
  const issued = A.receipt('member', 0b011)
  assert.equal(issued.allow, true)
  const verified = A.verify(issued.code)
  assert.equal(verified.ok, true)
  assert.equal(verified.allow, true)
  assert.equal(verified.fingerprint, issued.fingerprint)
  // the same code with a different expected fingerprint must be rejected
  const wrong = A.verify(issued.code, 'deadbeef')
  assert.equal(wrong.ok, false)
  assert.ok(wrong.reasons.join(' ').includes('指纹'))
  // garbage codes fail cleanly
  assert.equal(A.verify('not-a-code').ok, false)
})

test('tampered input bits are detected by recomputation', () => {
  const issued = A.receipt('simple', 0b11)
  const payload = JSON.parse(A.unb64url(issued.code))
  payload.inputs = 0b00
  payload.result = 1
  const tampered = A.b64url(JSON.stringify(payload))
  const result = A.verify(tampered)
  assert.equal(result.ok, false)
  assert.ok(result.reasons.join(' ').includes('结果不一致'))
})
