/**
 * tests/news.test.mjs — deterministic local daily briefing.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
new Function('TT', read('46-news.js'))(TT)
const N = TT.News

test('the briefing is deterministic per date', () => {
  const a = N.briefing('2026-11-20')
  const b = N.briefing('2026-11-20')
  assert.deepEqual(a.items.map((item) => item.id), b.items.map((item) => item.id))
  assert.equal(a.quiz.id, b.quiz.id)
  assert.deepEqual(a.metrics, b.metrics)
  assert.equal(a.items.length, 3)
  assert.equal(new Set(a.items.map((item) => item.id)).size, 3)
})

test('each day rotates content and offers a valid question', () => {
  const a = N.briefing('2026-11-20')
  const b = N.briefing('2026-11-21')
  assert.notDeepEqual(a.items.map((item) => item.id), b.items.map((item) => item.id))
  for (const day of ['2026-11-20', '2026-11-21', '2026-11-22']) {
    const brief = N.briefing(day)
    assert.ok(brief.quiz.answer >= 0 && brief.quiz.answer < brief.quiz.optionsKey.length)
    assert.ok(brief.metrics.blocks > 11842913 && brief.metrics.blocks < 11842913 + 300)
  }
  assert.equal(N.ITEMS.length >= 10, true)
  assert.equal(N.UPDATES.length >= 4, true)
})
