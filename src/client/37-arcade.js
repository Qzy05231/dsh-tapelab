/**
 * 37-arcade — the playground: NAND music box, 8×8 LED matrix, logic puzzles
 * (password lock / guess-the-number / majority vote) and a 5-level debug lab.
 *
 * Game data and generation live in TT.Arcade (pure, Node-testable); the React views
 * live in TT.ArcadeUI. Playback timers are owned by the controller in 50-app.js.
 */

TT.Arcade = (function () {
  const SCALES = [
    { id: 'major', nameKey: 'arcade.scale.major', steps: [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24] },
    { id: 'penta', nameKey: 'arcade.scale.penta', steps: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24] },
    { id: 'minor', nameKey: 'arcade.scale.minor', steps: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24] },
  ]
  const TUNES = [
    { id: 'scale', nameKey: 'arcade.tune.scale', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, -1, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1] },
    { id: 'twinkle', nameKey: 'arcade.tune.twinkle', steps: [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0, -1, 4, 4, 3, 3, 2, 2, 1, -1, 4, 4, 3, 3, 2, 2, 1, -1, 0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0, -1] },
    { id: 'beep', nameKey: 'arcade.tune.beep', steps: [0, 2, 4, 7, 9, 7, 4, 2, 0, 4, 9, 12, 9, 4, 0, -1] },
    { id: 'ode', nameKey: 'arcade.tune.ode', steps: [4, 4, 5, 7, 7, 5, 4, 2, 0, 0, 2, 4, 4, 2, 2, -1, 4, 4, 5, 7, 7, 5, 4, 2, 0, 0, 2, 4, 2, 0, 0, -1] },
  ]
  const NOTE_BASE = 261.63 // C4

  function freq(step, scaleIndex) {
    if (step < 0) return 0
    const scale = SCALES[scaleIndex % SCALES.length] || SCALES[0]
    const semis = scale.steps[Math.min(step, scale.steps.length - 1)]
    return NOTE_BASE * Math.pow(2, semis / 12)
  }
  function noteName(step, scaleIndex) {
    if (step < 0) return '·'
    const scale = SCALES[scaleIndex % SCALES.length] || SCALES[0]
    const semis = scale.steps[Math.min(step, scale.steps.length - 1)]
    const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
    return names[semis % 12] + (4 + Math.floor(semis / 12))
  }
  function stepAmplitude(step, scaleIndex) {
    if (step < 0) return 0
    const scale = SCALES[scaleIndex % SCALES.length] || SCALES[0]
    return Math.min(1, scale.steps[Math.min(step, scale.steps.length - 1)] / 24)
  }

  const PATTERNS = {
    heart: [0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    arrow: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    smile: [0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  }
  const PATTERN_KEYS = ['heart', 'arrow', 'smile']
  function pattern(name) {
    const bits = PATTERNS[name] || PATTERNS.heart
    return bits.slice()
  }

  function shiftPattern(bits, dir) {
    const next = new Array(64).fill(0)
    const shift = dir !== false
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const srcCol = shift ? (col + 7) % 8 : (col + 1) % 8
        next[row * 8 + col] = bits[row * 8 + srcCol]
      }
    }
    return next
  }

  function majority(a, b, c) {
    return (a & b) | (a & c) | (b & c)
  }
  function majorityNetlist() {
    try {
      const full = TT.Circuit.canonical.fullAdder()
      return TT.Circuit.makeNetlist({ nIn: 3, gates: full.gates, outputs: [full.outputs[1]] })
    } catch (error) {
      return TT.Circuit.synth({ nIn: 3, bits: [0, 0, 0, 1, 0, 1, 1, 1] }).netlist
    }
  }

  // ------------------------------------------------------------ debug puzzles
  function truthBits(nIn, fn) {
    const bits = []
    for (let i = 0; i < 1 << nIn; i += 1) bits.push(fn(i) ? 1 : 0)
    return bits
  }

  function buildDebugPuzzle(spec, seed) {
    const bits = truthBits(spec.nIn, spec.fn)
    const correct = TT.Circuit.synth({ nIn: spec.nIn, bits })
    const gates = correct.netlist.gates
    const totalGates = gates.length
    let puzzle = null

    for (let attempt = 0; attempt < totalGates && puzzle === null; attempt += 1) {
      const gateIndex = (seed * 2 + attempt) % totalGates
      const outputId = 2 + spec.nIn + gateIndex
      const original = gates[gateIndex]
      const candidates = [0, 1]
      for (let node = 2; node < outputId; node += 1) {
        if (node === original.a || node === original.b) continue
        candidates.push(node)
      }
      if (candidates.length === 0) continue
      const replacement = candidates[(seed + attempt) % candidates.length]
      const buggyGates = gates.map((gate, index) =>
        index === gateIndex ? { a: original.a, b: replacement } : { a: gate.a, b: gate.b },
      )
      const buggy = TT.Circuit.makeNetlist({ nIn: spec.nIn, gates: buggyGates, outputs: correct.netlist.outputs.slice() })
      const diff = []
      for (let index = 0; index < bits.length; index += 1) {
        const good = TT.Circuit.evaluate(correct.netlist, index).outputBits & 1
        let bad = 0
        try {
          bad = TT.Circuit.evaluate(buggy, index).outputBits & 1
        } catch (error) {
          bad = -1
        }
        if (good !== bad) diff.push({ inputBits: index, expected: good, actual: bad })
      }
      if (diff.length === 0) continue

      const options = [{ a: original.a, b: original.b, correct: true }]
      const tryDecoy = (candidate) => {
        if (candidate === original.b || candidate === original.a) return
        if (options.some((option) => option.b === candidate && option.a === original.a)) return
        const fixedGates = gates.map((gate, index) =>
          index === gateIndex ? { a: original.a, b: candidate } : { a: gate.a, b: gate.b },
        )
        const fixed = TT.Circuit.makeNetlist({ nIn: spec.nIn, gates: fixedGates, outputs: correct.netlist.outputs.slice() })
        let same = false
        try {
          same = TT.Circuit.equivalent(fixed, correct.netlist)
        } catch (error) {
          same = true
        }
        if (!same) options.push({ a: original.a, b: candidate, correct: false })
      }
      for (let i = 0; i < candidates.length && options.length < 4; i += 1) {
        tryDecoy(candidates[(i * 5 + seed + attempt) % candidates.length])
      }
      for (let i = 0; i < candidates.length && options.length < 4; i += 1) tryDecoy(candidates[i])
      if (options.length < 3) continue

      const order = options.map((option, index) => ({ option, key: (index * 7 + seed * 3 + attempt) % 13 }))
      order.sort((x, y) => x.key - y.key)
      puzzle = {
        id: spec.id,
        nameKey: spec.nameKey,
        nIn: spec.nIn,
        correct: correct.netlist,
        buggy,
        gateIndex,
        gate: original,
        diff,
        options: order.map((entry) => entry.option),
        gateCount: totalGates,
      }
      break
    }

    if (!puzzle) {
      const gateIndex = 0
      const original = gates[0] || { a: 2, b: 2 }
      puzzle = {
        id: spec.id,
        nameKey: spec.nameKey,
        nIn: spec.nIn,
        correct: correct.netlist,
        buggy: correct.netlist,
        gateIndex,
        gate: original,
        diff: [{ inputBits: 0, expected: 1, actual: 0 }],
        options: [{ a: original.a, b: original.b, correct: true }],
        gateCount: totalGates,
      }
    }
    return puzzle
  }

  const DEBUG_SPECS = [
    { id: 'xor', nameKey: 'arcade.debug.xor', nIn: 2, fn: (i) => (i & 1) ^ ((i >> 1) & 1) },
    { id: 'majority', nameKey: 'arcade.debug.majority', nIn: 3, fn: (i) => majority(i & 1, (i >> 1) & 1, (i >> 2) & 1) },
    { id: 'equal', nameKey: 'arcade.debug.equal', nIn: 3, fn: (i) => ((i & 1) === ((i >> 2) & 1) ? 1 : 0) & ((i >> 1) & 1) },
    { id: 'seg', nameKey: 'arcade.debug.seg', nIn: 2, fn: (i) => (TT.Circuit.canonical.sevenSegExpected(i) >> 2) & 1 },
    { id: 'parity', nameKey: 'arcade.debug.parity', nIn: 3, fn: (i) => ((i & 1) + ((i >> 1) & 1) + ((i >> 2) & 1)) % 2 },
  ]

  function debugPuzzles() {
    return DEBUG_SPECS.map((spec, index) => buildDebugPuzzle(spec, index + 1))
  }

  function fixedNetlist(puzzle, optionIndex) {
    const option = puzzle.options[optionIndex]
    if (!option) return puzzle.buggy
    const gates = puzzle.correct.gates.map((gate, index) =>
      index === puzzle.gateIndex ? { a: option.a, b: option.b } : { a: gate.a, b: gate.b },
    )
    return TT.Circuit.makeNetlist({ nIn: puzzle.nIn, gates, outputs: puzzle.correct.outputs.slice() })
  }

  // ------------------------------------------------------------ snake on the matrix
  const SNAKE_DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

  function snakeInitial(seed) {
    const start = { cells: [27, 26, 25], dir: 'right', food: 12, score: 0, alive: true, running: false, ticks: 0 }
    return placeFood(start, seed || 7)
  }

  function placeFood(snake, seed) {
    const occupied = new Set(snake.cells)
    const free = []
    for (let index = 0; index < 64; index += 1) if (!occupied.has(index)) free.push(index)
    if (free.length === 0) return { ...snake, alive: false }
    const rand = TT.util.random((seed || 1) + snake.cells.length * 31 + snake.ticks * 7)
    const food = free[Math.floor(rand() * free.length)]
    return { ...snake, food }
  }

  function snakeStep(snake) {
    if (!snake.alive) return snake
    const head = snake.cells[0]
    const row = Math.floor(head / 8)
    const col = head % 8
    const delta = SNAKE_DIRS[snake.dir] || SNAKE_DIRS.right
    const nextRow = row + delta[1]
    const nextCol = col + delta[0]
    if (nextRow < 0 || nextRow > 7 || nextCol < 0 || nextCol > 7) {
      return { ...snake, alive: false, running: false }
    }
    const next = nextRow * 8 + nextCol
    const body = snake.cells.slice(0, snake.cells.length - 1)
    if (body.indexOf(next) >= 0) return { ...snake, alive: false, running: false }
    const ate = next === snake.food
    const cells = [next, ...(ate ? snake.cells : body)]
    const grown = { ...snake, cells, ticks: snake.ticks + 1, score: snake.score + (ate ? 1 : 0) }
    return ate ? placeFood(grown, snake.ticks + snake.score + 3) : grown
  }

  function snakeTurn(snake, dir) {
    if (!snake.alive || !SNAKE_DIRS[dir]) return snake
    const delta = SNAKE_DIRS[dir]
    const deltaNow = SNAKE_DIRS[snake.dir] || SNAKE_DIRS.right
    // no instant 180-degree reversal
    if (delta[0] === -deltaNow[0] && delta[1] === -deltaNow[1]) return snake
    return { ...snake, dir }
  }

  return {
    SNAKE_DIRS,
    snakeInitial,
    snakeStep,
    snakeTurn,
    SCALES,
    TUNES,
    PATTERNS: PATTERN_KEYS,
    freq,
    noteName,
    stepAmplitude,
    pattern,
    shiftPattern,
    majority,
    majorityNetlist,
    debugPuzzles,
    fixedNetlist,
    truthBits,
  }
})()

// --------------------------------------------------------------------------- UI

TT.ArcadeUI = (function () {
  const h = TT.h
  const GAMES = [
    ['music', 'arcade.game.music', '🎹'],
    ['pixel', 'arcade.game.pixel', '🟦'],
    ['lock', 'arcade.game.lock', '🔐'],
    ['guess', 'arcade.game.guess', '🔢'],
    ['vote', 'arcade.game.vote', '🗳️'],
    ['debug', 'arcade.game.debug', '🐞'],
    ['snake', 'arcade.game.snake', '🐍'],
    ['boxing', 'arcade.game.boxing', '🥊'],
  ]

  function Page(props) {
    const { state, t, api } = props
    const arcade = state.arcade
    return h('div', { className: 'tt-labview tt-arcadeview' },
      h('div', { className: 'tt-labhero' },
        h('div', { className: 'tt-labherotxt' },
          h('div', { className: 'tt-labadge' }, t('arcade.badge')),
          h('h2', null, t('arcade.title')),
          h('p', null, t('arcade.sub')),
        ),
      ),
      h('div', { className: 'tt-arcadecards' }, GAMES.map(([id, key, icon]) =>
        h('button', {
          key: id,
          type: 'button',
          className: 'tt-arcadecard',
          'data-active': arcade.game === id ? 'true' : 'false',
          onClick: () => api.dispatch({ type: 'arcade/game', game: id }),
        }, h('span', { className: 'tt-arcadeicon' }, icon), h('span', null, t(key))),
      )),
      arcade.game === 'music' ? h(Music, { arcade, t, api }) : null,
      arcade.game === 'pixel' ? h(Pixel, { arcade, t, api }) : null,
      arcade.game === 'lock' ? h(Lock, { arcade, t, api }) : null,
      arcade.game === 'guess' ? h(Guess, { arcade, t, api }) : null,
      arcade.game === 'vote' ? h(Vote, { arcade, t, api }) : null,
      arcade.game === 'debug' ? h(Debug, { arcade, t, api }) : null,
      arcade.game === 'snake' ? h(Snake, { arcade, t, api }) : null,
      arcade.game === 'boxing' && TT.BoxingUI ? h(TT.BoxingUI.Page, { state, t, api }) : null,
    )
  }

  function Card(props) {
    return h('section', { className: 'tt-labcard' },
      h('div', { className: 'tt-labcardhead' }, h('strong', null, props.title), h('span', null, props.hint)),
      props.children,
    )
  }

  function Music(props) {
    const { arcade, t, api } = props
    const music = arcade.music
    const tune = TT.Arcade.TUNES[music.tune % TT.Arcade.TUNES.length]
    const windowStart = Math.max(0, Math.min(tune.steps.length - 16, (music.step | 0) - 7))
    const steps = tune.steps.slice(windowStart, windowStart + 16)
    return h('div', { className: 'tt-labgrid' },
      h(Card, { title: t('arcade.music.title'), hint: t('arcade.music.hint') },
        h('div', { className: 'tt-labrow' },
          h('button', {
            type: 'button',
            className: 'tt-btn',
            'data-kind': music.playing ? 'active' : 'primary',
            onClick: () => api.dispatch({ type: 'music/toggle' }),
          }, music.playing ? t('arcade.music.stop') : t('arcade.music.play')),
          h('span', { className: 'tt-lablabel' }, t('arcade.music.tempo')),
          [['slow', 620], ['normal', 420], ['fast', 280]].map(([key, value]) =>
            h('button', {
              key,
              type: 'button',
              className: 'tt-chip',
              'data-active': music.tempo === value ? 'true' : 'false',
              onClick: () => api.dispatch({ type: 'music/tempo', tempo: value }),
            }, t(`arcade.tempo.${key}`))),
        ),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('arcade.music.scale')),
          TT.Arcade.SCALES.map((scale, index) =>
            h('button', {
              key: scale.id,
              type: 'button',
              className: 'tt-chip',
              'data-active': music.scale === index ? 'true' : 'false',
              onClick: () => api.dispatch({ type: 'music/scale', index }),
            }, t(scale.nameKey))),
        ),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('arcade.music.tune')),
          TT.Arcade.TUNES.map((item, index) =>
            h('button', {
              key: item.id,
              type: 'button',
              className: 'tt-chip',
              'data-active': music.tune === index ? 'true' : 'false',
              onClick: () => api.dispatch({ type: 'music/tune', index }),
            }, t(item.nameKey))),
        ),
        h('div', { className: 'tt-musicsteps' }, steps.map((step, index) => {
          const absolute = windowStart + index
          const active = music.playing && absolute === music.step % tune.steps.length
          return h('div', {
            key: index,
            className: 'tt-musicstep',
            'data-active': active ? 'true' : 'false',
            'data-rest': step < 0 ? 'true' : 'false',
            style: { height: `${28 + TT.Arcade.stepAmplitude(step, music.scale) * 60}px` },
          }, h('span', null, TT.Arcade.noteName(step, music.scale)))
        })),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('arcade.music.now')),
          h('b', { style: { color: 'var(--tt-amber)', fontVariantNumeric: 'tabular-nums' } },
            `${TT.Arcade.noteName(tune.steps[music.step % tune.steps.length], music.scale)} @ ${music.tempo}ms`),
        ),
      ),
      h(Card, { title: t('arcade.music.how'), hint: '' },
        h('p', { className: 'tt-labempty' }, t('arcade.music.howBody')),
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, TT.Arcade.SCALES.length), h('span', null, t('arcade.music.scales'))),
          h('div', { className: 'tt-labstat' }, h('b', null, TT.Arcade.TUNES.length), h('span', null, t('arcade.music.tunes'))),
          h('div', { className: 'tt-labstat' }, h('b', null, '2.22'), h('span', null, 'Hz')),
          h('div', { className: 'tt-labstat' }, h('b', null, '0.45'), h('span', null, 's')),
        ),
        h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('arcade.music.clock')),
      ),
    )
  }

  function Pixel(props) {
    const { arcade, t, api } = props
    const pixel = arcade.pixel
    const on = pixel.bits.reduce((sum, value) => sum + (value ? 1 : 0), 0)
    return h('div', { className: 'tt-labgrid' },
      h(Card, { title: t('arcade.pixel.title'), hint: t('arcade.pixel.hint') },
        h('div', { className: 'tt-pixelgrid' }, Array.from({ length: 64 }, (_, index) =>
          h('button', {
            key: index,
            type: 'button',
            className: 'tt-pixel',
            'data-on': pixel.bits[index] ? 'true' : 'false',
            'aria-label': `pixel ${index}`,
            onClick: () => api.dispatch({ type: 'pixel/toggle', index }),
          }),
        )),
        h('div', { className: 'tt-labrow' },
          h('button', {
            type: 'button',
            className: 'tt-btn',
            'data-kind': pixel.anim ? 'active' : 'secondary',
            onClick: () => api.dispatch({ type: 'pixel/anim' }),
          }, pixel.anim ? t('arcade.pixel.pause') : t('arcade.pixel.play')),
          h('span', { className: 'tt-lablabel' }, `${on} / 64`),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
            onClick: () => api.dispatch({ type: 'pixel/clear' }) }, t('arcade.pixel.clear')),
        ),
      ),
      h(Card, { title: t('arcade.pixel.patterns'), hint: t('arcade.pixel.patternHint') },
        h('div', { className: 'tt-labrow' }, TT.Arcade.PATTERNS.map((name) =>
          h('button', {
            key: name,
            type: 'button',
            className: 'tt-btn',
            'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'pixel/pattern', name }),
          }, t(`arcade.pixel.pattern.${name}`)),
        )),
        h('p', { className: 'tt-labempty' }, t('arcade.pixel.playHint')),
        h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('arcade.pixel.clock')),
      ),
    )
  }

  function Lock(props) {
    const { arcade, t, api } = props
    const lock = arcade.lock
    const guess = lock.guess
    return h('div', { className: 'tt-labgrid' },
      h(Card, { title: t('arcade.lock.title'), hint: t('arcade.lock.hint') },
        h('div', { className: 'tt-labrow' }, [0, 1, 2, 3].map((index) =>
          h('button', {
            key: index,
            type: 'button',
            className: 'tt-chip',
            'data-active': (guess >> index) & 1 ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'lock/toggle', index }),
          }, `B${index}`),
        )),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            disabled: lock.solved, onClick: () => api.dispatch({ type: 'lock/check' }) }, t('arcade.lock.check')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
            onClick: () => api.dispatch({ type: 'lock/reset' }) }, t('arcade.lock.reset')),
          h('span', { className: 'tt-lablabel' }, `${t('arcade.lock.attempts')} ${lock.attempts}`),
        ),
        lock.solved ? h('div', { className: 'tt-badge', 'data-tone': 'good' }, t('arcade.lock.solved')) : null,
        lock.last ? h('div', { className: 'tt-leds' }, [0, 1, 2, 3].map((index) =>
          h('span', { key: index, className: 'tt-led', 'data-on': ((lock.last >> index) & 1) ? 'true' : 'false' },
            h('i', null), `B${index} ${((lock.code >> index) & 1) ? '✓' : '✗'}`),
        )) : null,
      ),
      h(Card, { title: t('arcade.lock.circuit'), hint: '' },
        h('p', { className: 'tt-labempty' }, t('arcade.lock.body')),
        h('div', { className: 'tt-hex tt-mono' }, 'lock = (guess == code) · 4 × XNOR + AND'),
      ),
    )
  }

  function Guess(props) {
    const { arcade, t, api } = props
    const game = arcade.guess
    return h('div', { className: 'tt-labgrid' },
      h(Card, { title: t('arcade.guess.title'), hint: t('arcade.guess.hint') },
        h('div', { className: 'tt-labrow' }, [0, 1, 2, 3].map((index) =>
          h('button', {
            key: index,
            type: 'button',
            className: 'tt-chip',
            'data-active': (game.guess >> index) & 1 ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'guess/toggle', index }),
          }, `B${index}`),
        )),
        h('div', { className: 'tt-labrow' },
          h('b', { style: { fontVariantNumeric: 'tabular-nums' } }, `${t('arcade.guess.value')} ${game.guess}`),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            disabled: game.solved, onClick: () => api.dispatch({ type: 'guess/submit' }) }, t('arcade.guess.submit')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
            onClick: () => api.dispatch({ type: 'guess/restart' }) }, t('arcade.guess.restart')),
          h('span', { className: 'tt-lablabel' }, `${t('arcade.guess.tries')} ${game.tries}/8`),
        ),
        game.solved ? h('div', { className: 'tt-badge', 'data-tone': 'good' }, `${t('arcade.guess.solved')} ${game.secret}`) : null,
        h('div', { className: 'tt-librarylist' }, game.history.slice(-6).map((entry, index) =>
          h('div', { key: index, className: 'tt-libraryrow' },
            h('span', { className: 'tt-libraryname' }, `${entry.value}`),
            h('span', { className: 'tt-libraryhex' }, entry.cmp === 0 ? '=' : entry.cmp > 0 ? '猜小了 ↑' : '猜大了 ↓'),
          ),
        )),
      ),
      h(Card, { title: t('arcade.guess.how'), hint: '' },
        h('p', { className: 'tt-labempty' }, t('arcade.guess.body')),
        h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('arcade.guess.lfsr')),
      ),
    )
  }

  function Vote(props) {
    const { arcade, t, api } = props
    const vote = arcade.vote
    const inputs = [vote.a, vote.b, vote.c]
    const out = TT.Arcade.majority(vote.a, vote.b, vote.c)
    return h('div', { className: 'tt-labgrid' },
      h(Card, { title: t('arcade.vote.title'), hint: t('arcade.vote.hint') },
        h('div', { className: 'tt-labrow' }, ['A', 'B', 'C'].map((name, index) =>
          h('button', {
            key: name,
            type: 'button',
            className: 'tt-chip',
            'data-active': inputs[index] ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'vote/toggle', index }),
          }, `${name} = ${inputs[index]}`),
        )),
        h('div', { className: 'tt-seg', style: { marginTop: 6 } },
          h('span', { style: { fontSize: 13, color: 'var(--tt-mint)' } }, `PASS = ${out}`),
          h('span', { className: 'tt-badge', 'data-tone': out ? 'good' : 'muted' }, out ? '2 / 3 通过' : '未通过'),
        ),
      ),
      h(Card, { title: t('arcade.vote.table'), hint: '' },
        h('table', { className: 'tt-table' },
          h('thead', null, h('tr', null, h('th', null, 'A'), h('th', null, 'B'), h('th', null, 'C'), h('th', null, 'PASS'))),
          h('tbody', null, Array.from({ length: 8 }, (_, index) => {
            const a = index & 1
            const b = (index >> 1) & 1
            const c = (index >> 2) & 1
            return h('tr', { key: index },
              h('td', null, a), h('td', null, b), h('td', null, c),
              h('td', { className: 'tt-bit' }, TT.Arcade.majority(a, b, c)))
          })),
        ),
      ),
    )
  }

  function Debug(props) {
    const { arcade, t, api } = props
    const debug = arcade.debug
    const puzzles = debug.puzzles || []
    const puzzle = puzzles[debug.level]
    return h('div', { className: 'tt-labgrid' },
      h(Card, { title: t('arcade.debug.title'), hint: t('arcade.debug.hint') },
        h('div', { className: 'tt-labrow' }, puzzles.map((item, index) =>
          h('button', {
            key: item.id,
            type: 'button',
            className: 'tt-chip',
            'data-active': debug.level === index ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'debug/level', level: index }),
          }, `${index + 1}. ${t(item.nameKey)}`),
        )),
        puzzle ? h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, `${t('arcade.debug.buggy')} ${t(puzzle.nameKey)} · ${puzzle.gateCount} 门 · ${puzzle.diff.length} 行不一致`),
          h('span', { className: 'tt-badge', 'data-tone': debug.status === 'pass' ? 'good' : debug.status === 'fail' ? 'bad' : 'muted' },
            debug.status === 'pass' ? t('arcade.debug.fixed') : debug.status === 'fail' ? t('arcade.debug.wrong') : t('arcade.debug.inspect')),
        ) : null,
        puzzle ? h('table', { className: 'tt-table' },
          h('thead', null, h('tr', null,
            h('th', null, t('hud.evalInput')),
            h('th', null, t('arcade.debug.expect')),
            h('th', null, t('arcade.debug.actual')),
          )),
          h('tbody', null, puzzle.diff.map((row) =>
            h('tr', { key: row.inputBits, 'data-ok': 'false' },
              h('td', { className: 'tt-bit' }, TT.util.formatBits(row.inputBits, puzzle.nIn)),
              h('td', { className: 'tt-bit' }, row.expected),
              h('td', { className: 'tt-bit' }, row.actual),
            )),
          ),
        ) : null,
        puzzle ? h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('arcade.debug.options')),
        ) : null,
        puzzle ? h('div', { className: 'tt-debugoptions' }, puzzle.options.map((option, index) =>
          h('button', {
            key: index,
            type: 'button',
            className: 'tt-debugoption',
            'data-active': debug.selected === index ? 'true' : 'false',
            'data-kind': debug.selected === index ? (option.correct ? 'good' : 'bad') : 'idle',
            onClick: () => api.dispatch({ type: 'debug/select', option: index }),
          }, `门 #${puzzle.gateIndex + 1}: A←${option.a}，B←${option.b}`),
        )) : null,
        debug.status === 'pass'
          ? h('div', { className: 'tt-labrow' },
              h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
                onClick: () => api.dispatch({ type: 'debug/level', level: (debug.level + 1) % Math.max(1, puzzles.length) }) }, t('arcade.debug.next')),
            )
          : null,
      ),
      h(Card, { title: t('arcade.debug.why'), hint: '' },
        h('p', { className: 'tt-labempty' }, t('arcade.debug.body')),
        h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('arcade.debug.scope')),
      ),
    )
  }

  function Snake(props) {
    const { arcade, t, api } = props
    const game = arcade.snake || TT.Arcade.snakeInitial()
    const cellAt = (index) => {
      if (index === game.food) return 'food'
      const at = game.cells.indexOf(index)
      if (at === 0) return 'head'
      if (at > 0) return 'body'
      return ''
    }
    return h('div', { className: 'tt-labgrid' },
      h(Card, { title: t('arcade.snake.title'), hint: t('arcade.snake.hint') },
        h('div', { className: 'tt-snakewrap' },
          h('div', { className: 'tt-snakegrid' }, Array.from({ length: 64 }, (_, index) => {
            const kind = cellAt(index)
            return h('div', {
              key: index,
              className: 'tt-snakecell',
              'data-kind': kind,
            })
          })),
          game.alive ? null : h('div', { className: 'tt-snakeover' },
            h('strong', null, t('arcade.snake.over')),
            h('span', null, `${t('arcade.snake.score')} ${game.score}`),
          ),
        ),
        h('div', { className: 'tt-labrow' },
          h('button', {
            type: 'button',
            className: 'tt-btn',
            'data-kind': game.running ? 'active' : 'primary',
            disabled: !game.alive,
            onClick: () => api.dispatch({ type: 'snake/toggle' }),
          }, game.running ? t('arcade.snake.pause') : t('arcade.snake.play')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
            onClick: () => api.dispatch({ type: 'snake/reset' }) }, t('arcade.snake.reset')),
          h('span', { className: 'tt-lablabel' }, `${t('arcade.snake.score')} ${game.score}`),
          h('span', { className: 'tt-lablabel' }, `${t('arcade.snake.dir')} ${game.dir}`),
        ),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => api.dispatch({ type: 'snake/dir', dir: 'up' }) }, '↑'),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => api.dispatch({ type: 'snake/dir', dir: 'down' }) }, '↓'),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => api.dispatch({ type: 'snake/dir', dir: 'left' }) }, '←'),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => api.dispatch({ type: 'snake/dir', dir: 'right' }) }, '→'),
          h('span', { style: { fontSize: 10, color: 'var(--tt-faint)' } }, t('arcade.snake.keys')),
        ),
      ),
      h(Card, { title: t('arcade.snake.how'), hint: '' },
        h('p', { className: 'tt-labempty' }, t('arcade.snake.body')),
        h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('arcade.snake.clock')),
      ),
    )
  }

  return { Page }
})()
