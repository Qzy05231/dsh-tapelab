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
new Function('TT', read('news-feed.js'))(TT)
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


test('real feed snapshot and markdown parser work', () => {
  assert.ok(TT.NewsFeed && TT.NewsFeed.items.length >= 10)
  const first = TT.NewsFeed.items[0]
  assert.ok(first.url.startsWith('https://tapeout.link/news/'))
  assert.ok(first.title.length > 4)
  const markdown = [
    '## 11月20日 · 周五',
    '1.   21:53',
    '### [TapeRelay 官方详解：三副本 TapeRelay explainer](https://tapeout.link/news/2123414239326970035)**72**分 pts',
    'TapeOut 官方连发多条推文详解 TapeRelay，文件被切分为 1 MiB 分块并用两级索引组织，支持断点续传。',
  ].join('\n')
  const parsed = TT.News.parseFeed(markdown)
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].url, 'https://tapeout.link/news/2123414239326970035')
  assert.equal(parsed[0].time, '21:53')
  assert.ok(parsed[0].summary.includes('TapeRelay'))
})


test('the 6am scheduler only runs once per day and respects backoff', () => {
  const day = new Date('2026-11-20T05:00:00')
  const before = day.getTime()
  const after = new Date('2026-11-20T06:01:00').getTime()
  const yesterday = new Date('2026-11-19T06:30:00').getTime()
  // before 6:00 -> no
  assert.equal(TT.News.shouldAutoFetch({ enabled: true, lastAuto: 0 }, before), false)
  // after 6:00, never fetched today -> yes
  assert.equal(TT.News.shouldAutoFetch({ enabled: true, lastAuto: 0 }, after), true)
  // fetched earlier today -> no
  assert.equal(TT.News.shouldAutoFetch({ enabled: true, lastAuto: new Date('2026-11-20T06:02:00').getTime() }, after), false)
  // fetched yesterday -> yes again
  assert.equal(TT.News.shouldAutoFetch({ enabled: true, lastAuto: yesterday }, after), true)
  // disabled -> no
  assert.equal(TT.News.shouldAutoFetch({ enabled: false, lastAuto: 0 }, after), false)
  // failed a moment ago -> backoff
  assert.equal(TT.News.shouldAutoFetch({ enabled: true, lastAuto: 0, lastAttempt: after - 60000 }, after), false)
  // next run calculation
  assert.equal(new Date(TT.News.nextAutoAt(before)).getHours(), 6)
  assert.equal(new Date(TT.News.nextAutoAt(after)).getDate(), new Date(after).getDate() + 1)
})
