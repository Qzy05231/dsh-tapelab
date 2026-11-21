/**
 * tests/version.test.mjs — version metadata, update check helpers and modal state.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
new Function('TT', read('50-version.js'))(TT)
new Function('TT', read('20-circuit.js'))(TT)
new Function('TT', read('30-missions.js'))(TT)

test('version metadata is coherent', () => {
  assert.equal(TT.Version.VERSION, '1.9.1')
  assert.ok(TT.Version.CHANGELOG.length >= 2)
  assert.equal(TT.Version.CHANGELOG[0].version, '1.9.1')
  assert.ok(TT.Version.REPO.startsWith('https://github.com/'))
  assert.ok(TT.Version.COMMAND.includes('build.mjs'))
  assert.equal(TT.Version.isNewer('2026-11-22T00:00:00Z'), true)
  assert.equal(TT.Version.isNewer('2026-11-20T00:00:00Z'), false)
  assert.equal(TT.Version.isNewer(''), false)
})

test('the version modal opens and closes', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'update/open' })
  assert.equal(state.updateOpen, true)
  state = TT.Missions.reduce(state, { type: 'update/close' })
  assert.equal(state.updateOpen, false)
})
