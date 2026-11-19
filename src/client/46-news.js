/**
 * 46-news — the TapeOut daily briefing.
 *
 * Fully local and offline: the date seeds a rotation of curated protocol cards,
 * a daily quiz and a snapshot of demo metrics, plus the recent changelog.
 */

TT.News = (function () {
  const ITEMS = [
    { id: 'bytes', tag: 'news.tag.protocol', titleKey: 'news.item.bytes.title', bodyKey: 'news.item.bytes.body' },
    { id: 'token', tag: 'news.tag.protocol', titleKey: 'news.item.token.title', bodyKey: 'news.item.token.body' },
    { id: 'nft', tag: 'news.tag.protocol', titleKey: 'news.item.nft.title', bodyKey: 'news.item.nft.body' },
    { id: 'eval', tag: 'news.tag.protocol', titleKey: 'news.item.eval.title', bodyKey: 'news.item.eval.body' },
    { id: 'clock', tag: 'news.tag.data', titleKey: 'news.item.clock.title', bodyKey: 'news.item.clock.body' },
    { id: 'sizes', tag: 'news.tag.engineering', titleKey: 'news.item.sizes.title', bodyKey: 'news.item.sizes.body' },
    { id: 'lego', tag: 'news.tag.engineering', titleKey: 'news.item.lego.title', bodyKey: 'news.item.lego.body' },
    { id: 'behemoth', tag: 'news.tag.ecosystem', titleKey: 'news.item.behemoth.title', bodyKey: 'news.item.behemoth.body' },
    { id: 'rover', tag: 'news.tag.ecosystem', titleKey: 'news.item.rover.title', bodyKey: 'news.item.rover.body' },
    { id: 'hardware', tag: 'news.tag.engineering', titleKey: 'news.item.hardware.title', bodyKey: 'news.item.hardware.body' },
    { id: 'sevenseg', tag: 'news.tag.protocol', titleKey: 'news.item.sevenseg.title', bodyKey: 'news.item.sevenseg.body' },
    { id: 'safety', tag: 'news.tag.security', titleKey: 'news.item.safety.title', bodyKey: 'news.item.safety.body' },
  ]

  const QUIZZES = [
    { id: 'q1', questionKey: 'news.quiz.q1', optionsKey: ['news.quiz.q1.a', 'news.quiz.q1.b', 'news.quiz.q1.c'], answer: 1, explainKey: 'news.quiz.q1.explain' },
    { id: 'q2', questionKey: 'news.quiz.q2', optionsKey: ['news.quiz.q2.a', 'news.quiz.q2.b', 'news.quiz.q2.c'], answer: 0, explainKey: 'news.quiz.q2.explain' },
    { id: 'q3', questionKey: 'news.quiz.q3', optionsKey: ['news.quiz.q3.a', 'news.quiz.q3.b', 'news.quiz.q3.c'], answer: 2, explainKey: 'news.quiz.q3.explain' },
    { id: 'q4', questionKey: 'news.quiz.q4', optionsKey: ['news.quiz.q4.a', 'news.quiz.q4.b', 'news.quiz.q4.c'], answer: 1, explainKey: 'news.quiz.q4.explain' },
  ]

  const UPDATES = [
    { titleKey: 'news.update.challenge.title', bodyKey: 'news.update.challenge.body' },
    { titleKey: 'news.update.daily.title', bodyKey: 'news.update.daily.body' },
    { titleKey: 'news.update.achv.title', bodyKey: 'news.update.achv.body' },
    { titleKey: 'news.update.verilog.title', bodyKey: 'news.update.verilog.body' },
    { titleKey: 'news.update.apps.title', bodyKey: 'news.update.apps.body' },
  ]

  function hash32(text) {
    let hash = 0x811c9dc5
    const string = String(text)
    for (let i = 0; i < string.length; i += 1) {
      hash ^= string.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash >>> 0
  }

  function dateKey(date) {
    const d = date || new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  function rng(seed) {
    let value = seed >>> 0 || 1
    return () => {
      value ^= value << 13
      value ^= value >>> 17
      value ^= value << 5
      value >>>= 0
      return value / 4294967296
    }
  }

  function pick(items, count, random) {
    const pool = items.slice()
    const chosen = []
    while (pool.length && chosen.length < count) {
      chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
    }
    return chosen
  }

  function briefing(day) {
    const date = day || dateKey()
    const seed = hash32('news|' + date)
    const random = rng(seed)
    const items = pick(ITEMS, 3, random)
    const quiz = QUIZZES[seed % QUIZZES.length]
    const metrics = {
      blocks: 11842913 + (seed % 240),
      nand: 800 + (seed % 900),
      circuits: 24 + (seed % 40),
    }
    return { date, seed, items, quiz, metrics, updates: UPDATES }
  }

  return { ITEMS, QUIZZES, UPDATES, hash32, dateKey, briefing }
})()

// --------------------------------------------------------------------------- crawling + UI

/** Parse the r.jina.ai markdown of https://tapeout.link/news into feed items. */
TT.News.parseFeed = function parseFeed(markdown) {
  const lines = String(markdown || '').split('\n')
  const items = []
  let currentDate = ''
  let currentTime = ''
  let pending = null
  const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim()
  const title = (raw) => {
    const text = clean(raw)
    let last = -1
    for (let index = 0; index < text.length; index += 1) if (/[\u4e00-\u9fff]/.test(text[index])) last = index
    return last > 3 && /[A-Za-z]/.test(text.slice(last + 1)) ? text.slice(0, last + 1) : text
  }
  for (const raw of lines) {
    const line = raw.trim()
    const date = line.match(/^##\s*(.+?)(?:\s*·.*)?$/)
    if (date && /月|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct/.test(date[1])) currentDate = clean(date[1])
    const time = line.match(/^\d+\.\s+(\d{2}:\d{2})$/)
    if (time) currentTime = time[1]
    const heading = line.match(/^###\s*\[(.+?)\]\((https:\/\/tapeout\.link\/news\/\d+)\)/)
    if (heading) {
      if (pending) items.push(pending)
      pending = { title: title(heading[1]), url: heading[2], time: currentTime, date: currentDate, summary: '' }
      continue
    }
    if (pending && !pending.summary && line && !line.startsWith('!') && !line.startsWith('*') && !line.startsWith('展开') && !/^###/.test(line) && !/^\d+\.\s+/.test(line) && line.length > 30) {
      pending.summary = clean(line).slice(0, 240)
    }
  }
  if (pending) items.push(pending)
  return items.slice(0, 14)
}

TT.News.snapshot = function snapshot() {
  if (typeof TT.NewsFeed !== 'undefined' && TT.NewsFeed && Array.isArray(TT.NewsFeed.items) && TT.NewsFeed.items.length) return TT.NewsFeed
  return null
}

const NEWS_READER = 'https://r.jina.ai/https://tapeout.link/news'
const NEWS_CACHE = 'dsh-tapelab-lab:news:v1'

TT.NewsUI = (function () {
  const h = TT.h

  function loadFeed() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(NEWS_CACHE)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && Array.isArray(parsed.items) && parsed.items.length) return parsed
        }
      }
    } catch (error) {
      /* fall back to the embedded snapshot */
    }
    return TT.News.snapshot() || { source: '', crawledAt: '', items: [] }
  }

  function Page(props) {
    const { state, t } = props
    const brief = TT.News.briefing()
    const [feed, setFeed] = React.useState(loadFeed)
    const [status, setStatus] = React.useState('idle')
    const [picked, setPicked] = React.useState(null)
    const [revealed, setRevealed] = React.useState(false)
    const correct = picked === brief.quiz.answer

    async function refresh() {
      if (typeof fetch !== 'function') {
        setStatus('fail')
        return
      }
      setStatus('loading')
      try {
        const response = await fetch(NEWS_READER, { headers: { accept: 'text/plain' } })
        if (!response.ok) throw new Error('HTTP ' + response.status)
        const text = await response.text()
        const items = TT.News.parseFeed(text)
        if (!items.length) throw new Error('empty feed')
        const next = { source: 'https://tapeout.link/news', crawledAt: new Date().toISOString(), items }
        try {
          if (typeof localStorage !== 'undefined') localStorage.setItem(NEWS_CACHE, JSON.stringify(next))
        } catch (error) {
          /* cache is optional */
        }
        setFeed(next)
        setStatus('ok')
      } catch (error) {
        setStatus('fail')
      }
    }

    const crawled = feed.crawledAt ? new Date(feed.crawledAt).toLocaleString() : ''
    return h('div', { className: 'tt-labview tt-newsview' },
      h('div', { className: 'tt-labhero' },
        h('div', { className: 'tt-labherotxt' },
          h('div', { className: 'tt-labadge' }, t('news.badge')),
          h('h2', null, t('news.title')),
          h('p', null, t('news.sub')),
          h('div', { className: 'tt-labpaths' },
            h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary', disabled: status === 'loading', onClick: refresh }, status === 'loading' ? t('news.refreshing') : `🔄 ${t('news.refresh')}`),
            h('span', { className: 'tt-lablabel' }, status === 'fail' ? t('news.refreshFail') : status === 'ok' ? t('news.refreshed') : feed.crawledAt ? `${t('news.crawled')} ${crawled}` : t('news.noFeed')),
            feed.source ? h('a', { className: 'tt-chip', href: feed.source, target: '_blank', rel: 'noreferrer noopener' }, t('news.source')) : null,
          ),
        ),
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('news.latest')),
          h('span', null, feed.source ? (feed.crawledAt ? `${t('news.snapshot')} ${crawled}` : '') : t('news.noFeed')),
        ),
        feed.items.length
          ? h('div', { className: 'tt-feedlist' }, feed.items.map((item) =>
              h('article', { key: item.url, className: 'tt-feeditem' },
                h('div', { className: 'tt-feedmeta' },
                  h('span', { className: 'tt-newstag' }, t('news.tag.live')),
                  h('time', null, `${item.date || ''} ${item.time || ''}`.trim() || '—'),
                ),
                h('a', { className: 'tt-feedtitle', href: item.url, target: '_blank', rel: 'noreferrer noopener' }, item.title),
                item.summary ? h('p', null, item.summary) : null,
                h('a', { className: 'tt-feedsource', href: item.url, target: '_blank', rel: 'noreferrer noopener' }, 'tapeout.link ↗'),
              )))
          : h('p', { className: 'tt-labempty' }, t('news.noFeed')),
        h('p', { className: 'tt-finalenote', style: { marginBottom: 0 } }, t('news.crawlNote')),
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('news.title')),
          h('span', null, `${brief.date} · ${t('news.local')}`),
        ),
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, TT.util.int(brief.metrics.blocks)), h('span', null, t('news.metric.blocks'))),
          h('div', { className: 'tt-labstat' }, h('b', null, String(brief.metrics.nand)), h('span', null, t('news.metric.nand'))),
          h('div', { className: 'tt-labstat' }, h('b', null, String(brief.metrics.circuits)), h('span', null, t('news.metric.circuits'))),
          h('div', { className: 'tt-labstat' }, h('b', null, `${state.circuits ? state.circuits.length : 0}`), h('span', null, t('news.metric.mine'))),
        ),
        h('p', { className: 'tt-finalenote', style: { margin: '2px 0 0' } }, t('news.demo')),
        h('h4', { className: 'tt-newshead' }, t('news.today')),
        h('div', { className: 'tt-newsgrid' }, brief.items.map((item) =>
          h('article', { key: item.id, className: 'tt-newscard' },
            h('span', { className: 'tt-newstag' }, t(item.tag)),
            h('h4', null, t(item.titleKey)),
            h('p', null, t(item.bodyKey)),
          ))),
        h('div', { className: 'tt-newscard tt-newsquiz' },
          h('span', { className: 'tt-newstag' }, t('news.tag.quiz')),
          h('h4', null, t(brief.quiz.questionKey)),
          h('div', { className: 'tt-newsoptions' }, brief.quiz.optionsKey.map((key, index) =>
            h('button', {
              key, type: 'button', className: 'tt-chip',
              'data-active': picked === index ? 'true' : 'false',
              'data-correct': picked !== null && index === brief.quiz.answer ? 'true' : 'false',
              onClick: () => { setPicked(index); setRevealed(true) },
            }, t(key)))),
          revealed
            ? h('p', { className: 'tt-finalenote', style: { borderLeftColor: correct ? 'var(--tt-mint)' : 'var(--tt-red)' } },
                `${correct ? t('news.quiz.right') : t('news.quiz.wrong')} ${t(brief.quiz.explainKey)}`)
            : h('button', { type: 'button', className: 'tt-chip', onClick: () => setRevealed(true) }, t('news.quiz.reveal')),
        ),
      ),
      h('section', { className: 'tt-labcard' },
        h('strong', { className: 'tt-newshead' }, t('news.updates')),
        h('div', { className: 'tt-updateslist' }, brief.updates.map((update) =>
          h('div', { key: update.titleKey, className: 'tt-updateitem' },
            h('b', null, t(update.titleKey)),
            h('span', null, t(update.bodyKey)),
          ))),
        h('p', { className: 'tt-finalenote', style: { marginBottom: 0 } }, t('news.foot')),
      ),
    )
  }

  return { Page }
})()
