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

// --------------------------------------------------------------------------- UI

TT.NewsUI = (function () {
  const h = TT.h

  function Page(props) {
    const { state, t } = props
    const brief = TT.News.briefing()
    const [picked, setPicked] = React.useState(null)
    const [revealed, setRevealed] = React.useState(false)
    const correct = picked === brief.quiz.answer
    return h('div', { className: 'tt-labgrid' },
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('news.title')),
          h('span', null, `${brief.date} · ${t('news.local')}`),
        ),
        h('p', { className: 'tt-labempty' }, t('news.sub')),
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, TT.util.int(brief.metrics.blocks)), h('span', null, t('news.metric.blocks'))),
          h('div', { className: 'tt-labstat' }, h('b', null, stringify(brief.metrics.nand)), h('span', null, t('news.metric.nand'))),
          h('div', { className: 'tt-labstat' }, h('b', null, stringify(brief.metrics.circuits)), h('span', null, t('news.metric.circuits'))),
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
              key,
              type: 'button',
              className: 'tt-chip',
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

  function stringify(value) {
    return String(value)
  }

  return { Page }
})()
