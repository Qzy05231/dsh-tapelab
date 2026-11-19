/**
 * 49-daily — deterministic daily truth-table deduction challenge.
 *
 * A hidden 3-input boolean function is derived from the local date, so everyone gets
 * the same puzzle on the same day. Two rows are given as clues; the player may query
 * up to 7 inputs, then fill the full 8-row truth table and submit. Fewer queries = better.
 */

TT.Daily = (function () {
  const BUDGET = 7
  const N = 8

  const FNS = [
    { id: 'and3', nameKey: 'daily.fn.and3', fn: (b) => (b[0] & b[1] & b[2]) },
    { id: 'or3', nameKey: 'daily.fn.or3', fn: (b) => (b[0] | b[1] | b[2]) },
    { id: 'xor3', nameKey: 'daily.fn.xor3', fn: (b) => (b[0] ^ b[1] ^ b[2]) },
    { id: 'nand3', nameKey: 'daily.fn.nand3', fn: (b) => 1 - (b[0] & b[1] & b[2]) },
    { id: 'majority', nameKey: 'daily.fn.majority', fn: (b) => (b[0] + b[1] + b[2] >= 2 ? 1 : 0) },
    { id: 'custom', nameKey: 'daily.fn.custom', fn: null },
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

  function bitsOf(index, count) {
    const bits = []
    for (let i = 0; i < count; i += 1) bits.push((index >> i) & 1)
    return bits
  }

  function puzzle(key) {
    const day = key || dateKey()
    const seed = hash32(day)
    const chosen = FNS[seed % FNS.length]
    const fn = chosen.fn || ((bits) => hash32(day + '|' + bits.join('')) & 1)
    const truth = []
    for (let index = 0; index < N; index += 1) truth.push(fn(bitsOf(index, 3)))
    const clueA = seed % N
    let clueB = (seed >> 4) % N
    if (clueB === clueA) clueB = (clueA + 3) % N
    const clues = [clueA, clueB].map((index) => ({ index, bits: bitsOf(index, 3), out: truth[index] }))
    return { date: day, seed, nameKey: chosen.nameKey, truth, clues, budget: BUDGET, solved: false }
  }

  function label(index) {
    return bitsOf(index, 3).join('')
  }

  function query(dayPuzzle, index) {
    return { index, bits: bitsOf(index, 3), out: dayPuzzle.truth[index] }
  }

  function evaluate(dayPuzzle, answers) {
    const diff = []
    for (let index = 0; index < N; index += 1) {
      if ((Number((answers || [])[index]) ? 1 : 0) !== dayPuzzle.truth[index]) diff.push(index)
    }
    return { solved: diff.length === 0, diff }
  }

  function start(dayPuzzle, stats) {
    const best = stats && stats.daily && stats.daily[dayPuzzle.date] ? stats.daily[dayPuzzle.date] : null
    return {
      date: dayPuzzle.date,
      answers: new Array(N).fill(0),
      used: 0,
      revealed: dayPuzzle.clues.map((clue) => ({ ...clue, kind: 'clue' })),
      solved: false,
      diff: [],
      best,
      attempts: 0,
    }
  }

  return { BUDGET, N, FNS, hash32, dateKey, bitsOf, label, puzzle, query, evaluate, start }
})()

// --------------------------------------------------------------------------- UI

TT.DailyUI = (function () {
  const h = TT.h

  function Page(props) {
    const { state, t, api } = props
    const daily = state.daily
    if (!daily) return h('div', { className: 'tt-labcard' }, h('p', { className: 'tt-labempty' }, t('daily.loading')))
    const puzzle = TT.Daily.puzzle(daily.date)
    const revealed = new Map((daily.revealed || []).map((entry) => [entry.index, entry]))
    const outOfQueries = daily.used >= puzzle.budget
    return h('div', { className: 'tt-labgrid' },
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, `${t('daily.title')} · ${daily.date}`),
          h('span', null, daily.solved ? `${t('daily.solved')} ✓` : `${t('daily.budget')} ${daily.used}/${puzzle.budget}`),
        ),
        h('p', { className: 'tt-labempty' }, t('daily.sub')),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('daily.hidden')),
          h('span', { className: 'tt-badge', 'data-tone': daily.solved ? 'good' : 'info' },
            daily.solved ? t(puzzle.nameKey) : '???'),
          daily.best !== null && daily.best !== undefined
            ? h('span', { className: 'tt-lablabel' }, `${t('daily.best')} ${daily.best}`)
            : null,
        ),
        h('div', { className: 'tt-dailyrows' }, Array.from({ length: 8 }, (_, index) => {
          const entry = revealed.get(index)
          const answer = (daily.answers || [])[index] ? 1 : 0
          return h('div', { key: index, className: 'tt-dailyrow', 'data-wrong': (daily.diff || []).indexOf(index) >= 0 ? 'true' : 'false' },
            h('span', { className: 'tt-dailybits' }, TT.Daily.label(index)),
            entry
              ? h('span', { className: 'tt-dailygiven', 'data-kind': entry.kind }, `${entry.out}`)
              : h('button', {
                  type: 'button',
                  className: 'tt-dailytoggle',
                  'data-on': answer ? 'true' : 'false',
                  disabled: daily.solved,
                  onClick: () => api.dispatch({ type: 'daily/toggle', index }),
                }, String(answer)),
            entry
              ? h('span', { className: 'tt-lablabel', style: { fontSize: 9 } }, t(entry.kind === 'clue' ? 'daily.given' : 'daily.queried'))
              : h('button', {
                  type: 'button',
                  className: 'tt-chip',
                  disabled: daily.solved || outOfQueries,
                  onClick: () => api.dispatch({ type: 'daily/query', index }),
                }, t('daily.query')),
          )
        })),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            disabled: daily.solved, onClick: () => api.dispatch({ type: 'daily/submit' }) }, t('daily.submit')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
            onClick: () => api.dispatch({ type: 'daily/reset' }) }, t('daily.reset')),
          daily.solved
            ? h('span', { className: 'tt-badge', 'data-tone': 'good' }, `${t('daily.win')} ${daily.used}`)
            : null,
          (daily.diff || []).length
            ? h('span', { className: 'tt-badge', 'data-tone': 'bad' }, `${t('daily.fail')} ${daily.diff.length}`)
            : null,
        ),
        daily.attempts ? h('p', { className: 'tt-finalenote', style: { marginBottom: 0 } }, `${t('daily.attempts')} ${daily.attempts}`) : null,
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' }, h('strong', null, t('daily.how.title'))),
        h('p', { className: 'tt-labempty' }, t('daily.how.body')),
      ),
    )
  }

  return { Page }
})()
