/**
 * 30-missions — chapter data, scene layout, and the pure game reducer.
 *
 * The reducer is side-effect free: the panel dispatches actions, the world renders
 * from the resulting state, and the React view reads derived selectors. Time-driven
 * effects (chain beats, tape-out animation completion) are actions dispatched by the
 * controller in 50-app.js.
 */

TT.Missions = (function () {
  // Per-chapter challenge targets in seconds: [3 stars, 2 stars], completion is 1 star.
  const CHALLENGE_TIMES = [
    [8, 20], [18, 45], [32, 80], [8, 20], [14, 35], [32, 80],
    [12, 30], [22, 55], [24, 60], [18, 45], [14, 40],
  ]
  const CHALLENGE_PAR = [8, 10, 20, 7, 4, 15, 2, 15, 16, 8, 7]
  function challengeShuffle(seed, length) {
    let value = (seed >>> 0) || 1
    const next = () => {
      value ^= value << 13
      value ^= value >>> 17
      value ^= value << 5
      value >>>= 0
      return value / 4294967296
    }
    const ids = Array.from({ length }, (_, index) => index)
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1))
      const tmp = ids[i]
      ids[i] = ids[j]
      ids[j] = tmp
    }
    return ids
  }

  function challengeConfig(index) {
    const entry = CHALLENGE_TIMES[index] || [40, 90]
    const par = CHALLENGE_PAR[index] || 20
    return { gold: entry[0], silver: entry[1], par }
  }

  const CHAPTERS = TT.protocol.CHAPTERS
  const CH = {
    MINT: 0,
    NAND: 1,
    HALF: 2,
    TAPEOUT: 3,
    LATCH: 4,
    LEGO: 5,
    BEHEMOTH: 6,
  }

  /** Static scene layout shared by the world renderer and the hint copy. */
  TT.layout = {
    mint: {
      wafer: [0, 0, 14, 9.4],
      chips: (() => {
        const out = []
        let i = 0
        for (let row = 0; row < 2; row += 1) {
          for (let col = 0; col < 4; col += 1) {
            out.push({ id: `chip:${i}`, x: -3.7 + col * 2.5, z: -1.5 + row * 3.0 })
            i += 1
          }
        }
        return out
      })(),
    },
    nand: {
      pads: [
        { port: 'in:0', x: -3.4, z: 1.7, label: 'A' },
        { port: 'in:1', x: -3.4, z: -1.7, label: 'B' },
      ],
      gate: { x: 0.2, z: 0 },
      led: { x: 3.2, z: 0 },
    },
    half: {
      pads: [
        { port: 'in:0', x: -5.1, z: 2.1, label: 'A' },
        { port: 'in:1', x: -5.1, z: -2.1, label: 'B' },
      ],
      slots: [
        { x: -3.0, z: 0 },
        { x: -1.1, z: 1.75 },
        { x: -1.1, z: -1.75 },
        { x: 1.1, z: 2.15 },
        { x: 1.1, z: -2.15 },
      ],
      outs: [
        { port: 'out:0', x: 4.3, z: 2.15, label: 'SUM' },
        { port: 'out:1', x: 4.3, z: -2.15, label: 'CARRY' },
      ],
    },
    tapeout: {
      stack: { x: -3.9, z: 0 },
      machine: { x: 0.1, z: 0 },
      crystal: { x: 3.7, z: 0 },
      circuit: { x: -1.6, z: 2.9 },
    },
    latch: {
      pads: [
        { port: 'in:0', x: -3.6, z: 1.9, label: 'S' },
        { port: 'in:1', x: -3.6, z: -1.9, label: 'R' },
      ],
      gates: [
        { x: -0.4, z: 0 },
        { x: 1.6, z: 0 },
      ],
      outs: [
        { port: 'out:0', x: 3.9, z: 1.5, label: 'Q' },
        { port: 'out:1', x: 3.9, z: -1.5, label: 'Q̄' },
      ],
    },
    lego: {
      pads: [
        { port: 'in:0', x: -5.4, z: 2.4, label: 'A' },
        { port: 'in:1', x: -5.4, z: 0, label: 'B' },
        { port: 'in:2', x: -5.4, z: -2.4, label: 'Cᵢₙ' },
      ],
      boxes: {
        ha1: { x: -2.6, z: 1.4 },
        ha2: { x: 0.4, z: 0 },
        or: { x: 1.6, z: -2.8 },
      },
      outs: [
        { port: 'out:0', x: 4.4, z: 1.4, label: 'SUM' },
        { port: 'out:1', x: 4.4, z: -2.4, label: 'CARRY' },
      ],
    },
    behemoth: {
      die: { x: 0, z: 0 },
      display: { x: 3.4, z: 2.2 },
      core: { x: -3.2, z: -2.2 },
    },
  }

  /** Canonical wiring the assist button follows: [sink, source] pairs. */
  const CANON = {
    1: [
      ['g:0:a', 'in:0'],
      ['g:0:b', 'in:1'],
    ],
    2: [
      ['g:0:a', 'in:0'],
      ['g:0:b', 'in:1'],
      ['g:1:a', 'in:0'],
      ['g:1:b', 'g:0:out'],
      ['g:2:a', 'in:1'],
      ['g:2:b', 'g:0:out'],
      ['g:3:a', 'g:1:out'],
      ['g:3:b', 'g:2:out'],
      ['g:4:a', 'g:0:out'],
      ['g:4:b', 'g:0:out'],
      ['out:0', 'g:3:out'],
      ['out:1', 'g:4:out'],
    ],
    5: [
      ['box:ha1:a', 'in:0'],
      ['box:ha1:b', 'in:1'],
      ['box:ha2:a', 'box:ha1:sum'],
      ['box:ha2:b', 'in:2'],
      ['box:or:a', 'box:ha1:carry'],
      ['box:or:b', 'box:ha2:carry'],
      ['out:0', 'box:ha2:sum'],
      ['out:1', 'box:or:out'],
    ],
  }

  const WIRE_SOURCES = {
    2: (play) => {
      const out = ['in:0', 'in:1']
      for (let i = 0; i < play.gates; i += 1) out.push(`g:${i}:out`)
      return out
    },
    1: (play) => (play.placed ? ['in:0', 'in:1', 'g:0:out'] : ['in:0', 'in:1']),
    5: (play) => {
      const out = ['in:0', 'in:1', 'in:2']
      for (const kind of ['ha1', 'ha2', 'or']) {
        if (!play.boxes.includes(kind)) continue
        if (kind === 'or') out.push('box:or:out')
        else out.push(`box:${kind}:sum`, `box:${kind}:carry`)
      }
      return out
    },
  }

  function selfLoop(from, to) {
    const a = /^g:(\d+):/.exec(from)
    const b = /^g:(\d+):/.exec(to)
    if (a && b) return a[1] === b[1]
    const c = /^box:([a-z0-9]+):/.exec(from)
    const d = /^box:([a-z0-9]+):/.exec(to)
    if (c && d) return c[1] === d[1]
    return false
  }

  /** Port label for hover text; null when the id is not a port of this chapter. */
  function describePort(state, id) {
    if (state.chapter === 1 || state.chapter === 2 || state.chapter === 5) {
      if (!isSource(state, id) && !isSink(state, id) && !isOutputSink(id)) return null
    } else if (state.chapter === 4) {
      if (!/^(in|out):[01]$/.test(id)) return null
    } else {
      return null
    }
    if (isSink(state, id) || isOutputSink(id)) return wireSinkLabel(id)
    return wireSourceLabel(id)
  }

  function isSink(state, id) {
    const play = state.play
    const index = state.chapter
    if (index === 2) {
      const m = /^g:(\d+):[ab]$/.exec(id)
      return Boolean(m) && Number(m[1]) < play.gates
    }
    if (index === 1) return play.placed && /^g:0:[ab]$/.test(id)
    if (index === 5) {
      const m = /^box:(ha1|ha2|or):[ab]$/.exec(id)
      return Boolean(m) && play.boxes.includes(m[1])
    }
    return false
  }

  function isSource(state, id) {
    return WIRE_SOURCES[state.chapter](state.play).includes(id)
  }

  function isOutputSink(id) {
    return id === 'out:0' || id === 'out:1'
  }

  /** Validate a proposed wire and record it on the sink. */
  function connect(state, from, to) {
    const play = state.play
    if (!from || !to) return state
    const target = to
    const sinkLike = isSink(state, target) || (isOutputSink(target) && (state.chapter === 2 || state.chapter === 5))
    if (!sinkLike || !isSource(state, from)) return state
    if (from === target) return state
    if (selfLoop(from, target)) return state
    if (play.wiring[target] === from) return state
    const wiring = { ...play.wiring, [target]: from }
    const next = { ...state, wiringVersion: (state.wiringVersion || 0) + 1 }
    next.play = {
      ...play,
      wiring,
      wiringVersion: (play.wiringVersion || 0) + 1,
      lastWire: { from, to: target, at: Date.now() },
    }
    return refresh(next)
  }

  function canConnect(state, from, to) {
    if (!from || !to) return false
    if (from === to) return false
    if (!isSource(state, from)) return false
    if (selfLoop(from, to)) return false
    if (isSink(state, to)) return state.play.wiring[to] !== from
    if (isOutputSink(to) && (state.chapter === 2 || state.chapter === 5)) {
      return state.play.wiring[to] !== from
    }
    return false
  }

  function nextAssistWire(state) {
    const list = CANON[state.chapter]
    if (!list) return null
    for (const [to, from] of list) {
      if (state.play.wiring[to] !== from) return { from, to }
    }
    return null
  }

  function wireSinkLabel(id) {
    const m = /^g:(\d+):([ab])$/.exec(id)
    if (m) return { key: 'port.gateIn', params: { n: Number(m[1]) + 1, pin: m[2].toUpperCase() } }
    const b = /^box:(ha1|ha2|or):([ab])$/.exec(id)
    if (b) return { key: 'port.boxIn', params: { box: b[1].toUpperCase(), pin: b[2].toUpperCase() } }
    if (id === 'out:0') return { key: 'port.sum', params: {} }
    if (id === 'out:1') return { key: 'port.carry', params: {} }
    return { key: 'port.unknown', params: {} }
  }

  function wireSourceLabel(id) {
    const i = /^in:(\d+)$/.exec(id)
    if (i) return { key: 'port.input', params: { n: Number(i[1]) + 1 } }
    const m = /^g:(\d+):out$/.exec(id)
    if (m) return { key: 'port.gateOut', params: { n: Number(m[1]) + 1 } }
    const b = /^box:(ha1|ha2|or):(sum|carry|out)$/.exec(id)
    if (b) return { key: 'port.boxOut', params: { box: b[1].toUpperCase(), pin: b[2] } }
    return { key: 'port.unknown', params: {} }
  }

  // ------------------------------------------------------------------ netlists

  function nandOf(a, b) {
    return 1 - (a & b)
  }

  function playerNetlist(state) {
    const play = state.play
    const index = state.chapter
    if (index === 1) {
      if (!play.placed) return null
      const wiring = play.wiring
      if (!wiring['g:0:a'] || !wiring['g:0:b']) return null
      return TT.Circuit.makeNetlist({
        nIn: 2,
        gates: [{ a: 2, b: 3 }],
        outputs: [4],
      })
    }
    if (index === 2) {
      if (play.gates < 5) return null
      const wiring = play.wiring
      for (let i = 0; i < 5; i += 1) {
        if (!wiring[`g:${i}:a`] || !wiring[`g:${i}:b`]) return null
      }
      if (!wiring['out:0'] || !wiring['out:1']) return null
      const nodeOf = (source) => {
        const input = /^in:(\d+)$/.exec(source)
        if (input) return 2 + Number(input[1])
        const gate = /^g:(\d+):out$/.exec(source)
        if (gate) return 4 + Number(gate[1])
        const v = Number(source)
        return Number.isInteger(v) ? v : null
      }
      const gates = []
      for (let i = 0; i < 5; i += 1) {
        const a = nodeOf(wiring[`g:${i}:a`])
        const b = nodeOf(wiring[`g:${i}:b`])
        if (a === null || b === null) return null
        gates.push({ a, b })
      }
      const out0 = nodeOf(wiring['out:0'])
      const out1 = nodeOf(wiring['out:1'])
      if (out0 === null || out1 === null) return null
      return TT.Circuit.makeNetlist({ nIn: 2, gates, outputs: [out0, out1] })
    }
    if (index === 5) {
      if (play.boxes.length < 3) return null
      for (const kind of play.boxes) {
        if (!play.wiring[`box:${kind}:a`] || !play.wiring[`box:${kind}:b`]) return null
      }
      if (!play.wiring['out:0'] || !play.wiring['out:1']) return null

      const half = play.demoHalf || TT.Circuit.canonical.halfAdder()
      // OR from three NAND: not a = NAND(a,a), not b = NAND(b,b), out = NAND(not a, not b)
      const orGate = TT.Circuit.makeNetlist({
        nIn: 2,
        gates: [
          { a: 2, b: 2 },
          { a: 3, b: 3 },
          { a: 4, b: 5 },
        ],
        outputs: [6],
      })
      const OUT_KEYS = { ha1: { sum: 100, carry: 101 }, ha2: { sum: 102, carry: 103 }, or: { out: 104 } }
      const sourceKey = (source) => {
        const input = /^in:(\d+)$/.exec(source)
        if (input) return 2 + Number(input[1])
        const box = /^box:(ha1|ha2|or):([a-z]+)$/.exec(source)
        if (box) return OUT_KEYS[box[1]][box[2]]
        return null
      }
      const part = (netlist, box, outputNodes) => {
        const a = sourceKey(play.wiring[`box:${box}:a`])
        const b = sourceKey(play.wiring[`box:${box}:b`])
        if (a === null || b === null) return null
        return { netlist, inputNodes: [a, b], outputNodes }
      }
      const parts = [
        part(half, 'ha1', [OUT_KEYS.ha1.sum, OUT_KEYS.ha1.carry]),
        part(half, 'ha2', [OUT_KEYS.ha2.sum, OUT_KEYS.ha2.carry]),
        part(orGate, 'or', [OUT_KEYS.or.out]),
      ]
      if (parts.some((entry) => entry === null)) return null
      const outKeys = [sourceKey(play.wiring['out:0']), sourceKey(play.wiring['out:1'])]
      if (outKeys.some((key) => key === null)) return null
      try {
        return TT.Circuit.compose({ nIn: 3, parts, outputs: outKeys })
      } catch (error) {
        return null
      }
    }
    return null
  }

  // ------------------------------------------------------------------ verify

  function expectedFn(index) {
    if (index === 1) {
      return (bits) => {
        const a = bits & 1
        const b = (bits >> 1) & 1
        return nandOf(a, b)
      }
    }
    if (index === 2) {
      return (bits) => {
        const a = bits & 1
        const b = (bits >> 1) & 1
        return (a ^ b) | ((a & b) << 1)
      }
    }
    if (index === 5) {
      return (bits) => {
        const sum = (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1)
        return (sum & 1) | ((sum >> 1) << 1)
      }
    }
    return null
  }

  function refreshTapeArtifact(state) {
    const netlist = playerNetlist(state)
    if (!netlist) {
      return {
        ...state,
        play: {
          ...state.play,
          verify: { status: 'incomplete', rows: [], count: 0, mismatchCount: 0 },
          netlist: null,
          hex: '',
        },
      }
    }
    const expected = expectedFn(state.chapter)
    const result = TT.Circuit.exhaustiveVerify(netlist, expected)
    const hex = TT.Circuit.gateHex(netlist)
    const preview = result.rows.length > 4 ? result.rows.slice(0, 4) : result.rows
    let next = state
    if (result.passed && state.chapter === 2) next = markComplete(next, 2, 'toast.halfDone')
    if (result.passed && state.chapter === 1 && state.play.visited === 15) next = markComplete(next, 1, 'toast.nandDone')
    return {
      ...next,
      play: {
        ...state.play,
        verify: {
          status: result.valid === false ? 'invalid' : result.passed ? 'pass' : 'fail',
          rows: preview,
          allRows: result.rows,
          count: result.count,
          mismatchCount: result.mismatchCount || 0,
          gateCount: TT.Circuit.gateCount(netlist),
          maxDepth: TT.Circuit.maxDepth(netlist),
          error: result.error,
        },
        netlist,
        hex,
      },
    }
  }

  function refresh(state) {
    if (state.chapter === 1 || state.chapter === 2 || state.chapter === 5) {
      return refreshTapeArtifact(state)
    }
    return state
  }

  // ------------------------------------------------------------------ play state

  function playFor(state, index) {
    const shared = { wiring: {}, verify: { status: 'idle', rows: [], count: 0, mismatchCount: 0 }, netlist: null, hex: '' }
    if (index === 0) {
      const minted = (state.flags && state.flags.mintedChips) || []
      return { minted: [...minted] }
    }
    if (index === 1) {
      return { ...shared, placed: false, inputs: [0, 0], visited: 0 }
    }
    if (index === 2) {
      return { ...shared, gates: 0, inputs: [0, 0] }
    }
    if (index === 3) {
      return {
        ...shared,
        phase: 'idle',
        startedAt: 0,
        nftId: null,
        evalRows: [],
        halfNetlist: null,
        halfHex: '',
        demo: false,
        quizPassed: false,
        quizWrong: 0,
        quizStep: 'gates',
      }
    }
    if (index === 4) {
      return {
        ...shared,
        stateBits: 2,
        S: 1,
        R: 1,
        history: [],
        stableQ: 0,
        stableQn: 0,
        transientSeen: false,
        wave: [],
      }
    }
    if (index === 5) {
      return { ...shared, boxes: [], inputs: [0, 0, 0], composed: null, demoHalf: null, taped: false }
    }
    if (index === 6) {
      return {
        running: false,
        operands: [3, 5],
        reveal: 0,
        total: 6,
        result: null,
        showResult: false,
        done: false,
        history: [],
      }
    }
    if (index === 7) {
      return {
        ...shared,
        synthesized: false,
        inputs: [0, 0, 0, 0],
        digit: 0,
        mask: 0,
        visitedMask: 0,
        verify: { status: 'idle', rows: [], count: 0, mismatchCount: 0 },
        taped: false,
        seq: 0,
      }
    }
    if (index === 8) {
      return {
        ...shared,
        netlist: null,
        stateBits: 0,
        beats: 0,
        reached15: false,
        wrapped: false,
        history: [],
      }
    }
    if (index === 9) {
      return {
        programIndex: 0,
        programId: 'add35',
        state: null,
        running: false,
        results: {},
        manualSteps: 0,
        trace: [],
        halted: false,
      }
    }
    return {
      ...shared,
      netlist: null,
      bits: 0,
      seenMask: 0,
      mode: 3,
      verify: { status: 'idle', rows: [], count: 0, mismatchCount: 0, violations: null },
      taped: false,
      auditAt: null,
    }
  }

  function initial() {
    const state = {
      chapter: 0,
      intro: false,
      welcome: true,
      achvOpen: false,
      updateOpen: false,
      sims: { deweb: false, relay: false, container: false },
      simOpen: null,
      unlocked: [],
      stats: { snakeBest: 0, snakeBySpeed: {}, snakeScores: [], debugSolved: 0, guessBest: null, guessScoreBest: 0, lockWins: 0, lockBestAttempts: null, synth: 0, imports: 0, receipts: 0, daily: {}, challenge: {} },
      challenge: { active: false, chapter: 0, startedAt: 0, hadCompleted: false, actions: 0, mistakes: 0, lastResult: null },
      daily: null,
      codex: false,
      paused: false,
      speed: 1,
      nand: 0,
      mintedTotal: 0,
      circuits: [],
      blocks: 11842913,
      completed: {},
      hint: 0,
      toast: null,
      toastSeq: 0,
      log: [],
      logSeq: 0,
      flags: {},
      play: {},
      epoch: 1,
      finaleDismissed: false,
      allDoneNotified: false,
      mode: 'missions',
      lab: freshLab(),
      soundMuted: false,
      cinema: false,
      arcade: freshArcade(),
      access: freshAccess(),
      lottery: freshLottery(),
      art: freshArt(),
      sensors: freshSensors(),
      defi: freshDefi(),
    }
    state.play = playFor(state, 0)
    return state
  }

  function freshDefi() {
    const pools = {}
    for (const pool of TT.Defi ? TT.Defi.POOLS : []) pools[pool.id] = { x: pool.x, y: pool.y }
    return {
      poolId: 'eth-usdc',
      pools,
      amountIn: 2,
      maxImpact: 10,
      cap: 20,
      allowlisted: 1,
      paused: 0,
      oracle: 1,
      audit: null,
      receipt: null,
      verifyCode: '',
      verifyHash: '',
      verifyResult: null,
      trades: [],
    }
  }

  function freshSensors() {
    return {
      scenarioId: 'home',
      values: {},
      thresholds: {},
      audit: null,
      receipt: null,
      verifyCode: '',
      verifyHash: '',
      verifyResult: null,
    }
  }

  function freshArt() {
    return {
      seed: 'genesis-block',
      circuit: 'lfsr8',
      palette: 0,
      index: 0,
      playing: false,
      gallery: [],
      verifyCode: '',
      verifyHash: '',
      verifyResult: null,
    }
  }

  function freshLottery() {
    return {
      seed: '0x' + (11842913).toString(16),
      participants: 'Alice\nBob\nCarol\nDave\nEve\nFrank\nGrace\nHeidi',
      count: 1,
      result: null,
      receipt: null,
      history: [],
      verifyCode: '',
      verifySeedHash: '',
      verifyResult: null,
    }
  }

  function freshAccess() {
    return {
      policyId: 'simple',
      inputs: 0,
      audit: null,
      receipt: null,
      receipts: [],
      verifyCode: '',
      verifyHash: '',
      verifyResult: null,
    }
  }

  function freshArcade() {
    const pattern = TT.Arcade ? TT.Arcade.pattern('heart') : new Array(64).fill(0)
    return {
      game: 'music',
      music: { playing: false, tempo: 420, scale: 0, tune: 0, step: 0 },
      pixel: { bits: pattern, anim: false },
      lock: { code: 9, guess: 0, attempts: 0, maxAttempts: 6, last: null, solved: false, failed: false, bestAttempts: null },
      guess: { secret: 11, guess: 0, tries: 0, maxTries: 5, history: [], solved: false, score: 0 },
      vote: { a: 0, b: 0, c: 0 },
      debug: { level: 0, selected: null, status: 'idle', solved: 0, attempts: 0, puzzles: null },
      snake: null,
    }
  }

  function ensureDaily(next) {
    if (!TT.Daily) return next
    const today = TT.Daily.dateKey()
    if (next.daily && next.daily.date === today) return next
    const puzzle = TT.Daily.puzzle(today)
    return { ...next, daily: TT.Daily.start(puzzle, next.stats) }
  }

  function ensureSnake(arcade) {
    if (arcade.snake || !TT.Arcade) return arcade
    return { ...arcade, snake: TT.Arcade.snakeInitial(undefined, 'normal') }
  }

  function ensureArcadePuzzles(arcade) {
    if (arcade.debug.puzzles || !TT.Arcade) return arcade
    let puzzles = []
    try {
      puzzles = TT.Arcade.debugPuzzles()
    } catch (error) {
      puzzles = []
    }
    return { ...arcade, debug: { ...arcade.debug, puzzles } }
  }

  function freshLab() {
    return {
      tab: 'synth',
      nIn: 4,
      bits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      result: null,
      verify: null,
      sandbox: null,
      sandboxInputs: 0,
      museumId: null,
      hardwareFrom: 'result',
      library: [],
      savedAt: null,
    }
  }

  function pushToast(state, key, params, tone) {
    const seq = (state.toastSeq || 0) + 1
    return { ...state, toastSeq: seq, toast: { id: seq, key, params: params || {}, tone: tone || 'info' } }
  }

  function pushLog(state, key, params, tone) {
    const seq = (state.logSeq || 0) + 1
    const entry = { id: seq, key, params: params || {}, tone: tone || 'muted', block: state.blocks }
    return { ...state, logSeq: seq, log: [entry, ...state.log].slice(0, 6) }
  }

  function completedCount(state) {
    let count = 0
    for (let i = 0; i < CHAPTERS.length; i += 1) if (state.completed[i]) count += 1
    return count
  }

  function allDone(state) {
    return completedCount(state) >= CHAPTERS.length
  }

  function markComplete(state, index, key) {
    if (state.completed[index]) return state
    let next = { ...state, completed: { ...state.completed, [index]: true } }
    if (next.challenge && next.challenge.active && next.challenge.chapter === index) {
      const elapsed = Math.max(0, Date.now() - (next.challenge.startedAt || Date.now()))
      const config = challengeConfig(index)
      const efficient = (next.challenge.actions || 0) <= config.par && (next.challenge.mistakes || 0) === 0
      const stars = elapsed <= config.gold * 1000 && efficient ? 3 : elapsed <= config.silver * 1000 ? 2 : 1
      const previous = next.stats.challenge[index]
      next = {
        ...next,
        stats: {
          ...next.stats,
          challenge: {
            ...next.stats.challenge,
            [index]: {
              stars: Math.max(stars, previous ? previous.stars : 0),
              bestMs: previous && previous.bestMs < elapsed ? previous.bestMs : elapsed,
            },
          },
        },
        challenge: {
          active: false, chapter: index, startedAt: 0, hadCompleted: true,
          actions: next.challenge.actions || 0, mistakes: next.challenge.mistakes || 0,
          lastResult: { stars, ms: elapsed, actions: next.challenge.actions || 0, mistakes: next.challenge.mistakes || 0 },
        },
        unlocked: next.unlocked || [],
      }
      next.challengeToast = { stars: '★'.repeat(stars), seconds: (elapsed / 1000).toFixed(1) }
    }
    next = pushToast(next, key || 'toast.chapterDone', {}, 'good')
    if (next.challengeToast) {
      next = pushToast(next, 'challenge.done', next.challengeToast, 'good')
      delete next.challengeToast
    }
    if (completedCount(next) >= CHAPTERS.length && !next.allDoneNotified) {
      next = {
        ...next,
        allDoneNotified: true,
        finaleDismissed: false,
        toast: { id: (next.toastSeq || 0) + 1, key: 'toast.allDone', params: {}, tone: 'good' },
        toastSeq: (next.toastSeq || 0) + 1,
        epoch: (next.epoch || 1) + 1,
      }
    }
    return next
  }

  function ensureResources(state, index) {
    let next = state
    if (index === 3 && next.nand < 5) {
      const add = 5 - next.nand
      next = { ...next, nand: next.nand + add }
      next = pushToast(next, 'toast.seedNand', { n: add }, 'info')
    }
    if (index === 5 && next.nand < 13) {
      const add = 13 - next.nand
      next = { ...next, nand: next.nand + add }
      next = pushToast(next, 'toast.seedNand', { n: add }, 'info')
    }
    if (index === 7 && next.nand < 100) {
      const add = 100 - next.nand
      next = { ...next, nand: next.nand + add }
      next = pushToast(next, 'toast.seedNand', { n: add }, 'info')
    }
    if (index === 10 && next.nand < 80) {
      const add = 80 - next.nand
      next = { ...next, nand: next.nand + add }
      next = pushToast(next, 'toast.seedNand', { n: add }, 'info')
    }
    return next
  }

  function loadProgram(index) {
    if (!TT.CPU || !TT.CPU.programs || !TT.CPU.programs[index]) return null
    const program = TT.CPU.programs[index]
    try {
      const state = TT.CPU.loadProgram(TT.CPU.initial(), program.bytes.slice())
      return { program, state }
    } catch (error) {
      return null
    }
  }

  /** Fill chapter-specific assets that are not part of the generic play shell. */
  function setupChapterPlay(state, index) {
    const play = { ...(state.play || {}) }
    if (index === 3) {
      const player = state.circuits.find((circuit) => circuit.gateCount === 5 && circuit.nIn === 2)
      const half = player ? player.netlist : TT.Circuit.canonical.halfAdder()
      play.halfNetlist = half
      play.halfHex = TT.Circuit.gateHex(half)
      play.demo = !player
      play.nftSource = player || null
    }
    if (index === 4) play.latch = TT.Circuit.canonical.srLatch()
    if (index === 5) {
      const player = state.circuits.find((circuit) => circuit.gateCount === 5 && circuit.nIn === 2)
      play.demoHalf = player ? player.netlist : TT.Circuit.canonical.halfAdder()
    }
    if (index === 6) play.adder = TT.Circuit.canonical.fourBitAdder()
    if (index === 8) {
      play.netlist = TT.Circuit.canonical.counter4 ? TT.Circuit.canonical.counter4() : null
      play.stateBits = 0
      play.beats = 0
      play.reached15 = false
      play.wrapped = false
      play.history = []
    }
    if (index === 9) {
      const loaded = loadProgram(0)
      play.programIndex = 0
      play.programId = loaded ? loaded.program.id : 'add35'
      play.state = loaded ? loaded.state : null
      play.running = false
      play.results = {}
      play.manualSteps = 0
      play.trace = []
      play.halted = false
    }
    if (index === 10) {
      play.netlist = TT.Safety.netlist()
      play.bits = TT.Safety.PRESETS.stop
      const current = TT.Safety.evaluate(play.bits)
      play.mode = current.mode
      play.seenMask = 1 << current.mode
      play.verify = { status: 'idle', rows: [], count: 0, mismatchCount: 0, violations: null }
      play.taped = false
    }
    return play
  }

  function selectChapter(state, index) {
    const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, index))
    let next = {
      ...state,
      chapter: clamped,
      intro: false,
      hint: 0,
      paused: false,
      mode: 'missions',
      play: {},
      epoch: (state.epoch || 1) + 1,
    }
    next.play = setupChapterPlay({ ...next, play: playFor(next, clamped) }, clamped)
    next = ensureResources(next, clamped)
    return next
  }

  // ------------------------------------------------------------------ chapter logic

  function chapterGoals(state) {
    const index = state.chapter
    const play = state.play
    if (index === 0) {
      return [
        { key: 'goal.mintChips', params: { n: 8 }, done: play.minted.length >= 8 },
        { key: 'goal.seeToken', params: {}, done: play.minted.length > 0 },
      ]
    }
    if (index === 1) {
      const wired = Boolean(play.wiring['g:0:a'] && play.wiring['g:0:b'])
      return [
        { key: 'goal.placeGate', params: { n: 1 }, done: play.placed },
        { key: 'goal.wireGate', params: {}, done: wired },
        { key: 'goal.allInputs', params: { n: 4, visited: countBits(play.visited) }, done: play.visited === 15 },
        { key: 'goal.verifyPass', params: {}, done: !!(play.verify && play.verify.status === 'pass') },
      ]
    }
    if (index === 2) {
      const wired = Object.keys(play.wiring || {}).length
      return [
        { key: 'goal.placeGates', params: { n: 5, placed: play.gates }, done: play.gates >= 5 },
        { key: 'goal.wireCount', params: { n: 12, done: wired }, done: wired >= 12 },
        { key: 'goal.verifyHalf', params: {}, done: !!(play.verify && play.verify.status === 'pass') },
      ]
    }
    if (index === 3) {
      return [
        { key: 'goal.chooseDesign', params: {}, done: play.phase !== 'idle' },
        { key: 'goal.tapeout', params: {}, done: play.phase === 'done' },
        { key: 'goal.freeEval', params: {}, done: (play.evalRows || []).length > 0 },
      ]
    }
    if (index === 4) {
      return [
        { key: 'goal.latchSet', params: {}, done: play.stableQ >= 1 },
        { key: 'goal.latchHold', params: { n: 3, done: Math.min(3, play.stableQ) }, done: play.stableQ >= 3 },
        { key: 'goal.latchReset', params: {}, done: play.stableQn >= 2 },
      ]
    }
    if (index === 5) {
      return [
        { key: 'goal.placeBoxes', params: { n: 3, done: play.boxes.length }, done: play.boxes.length >= 3 },
        {
          key: 'goal.wireCount',
          params: { n: 8, done: Object.keys(play.wiring || {}).length },
          done: Object.keys(play.wiring || {}).length >= 8,
        },
        { key: 'goal.verifyFull', params: {}, done: !!(play.verify && play.verify.status === 'pass') },
        { key: 'goal.tapeout', params: {}, done: play.taped },
      ]
    }
    if (index === 6) {
      return [
        { key: 'goal.runProgram', params: {}, done: play.running || play.done },
        { key: 'goal.seeResult', params: {}, done: play.showResult },
      ]
    }
    if (index === 7) {
      const visited = play.visitedMask || 0
      let count = 0
      for (let i = 0; i < 10; i += 1) if (visited & (1 << i)) count += 1
      return [
        { key: 'goal.segSynth', params: {}, done: Boolean(play.synthesized) },
        { key: 'goal.segVerify', params: {}, done: Boolean(play.verify && play.verify.status === 'pass') },
        { key: 'goal.segDigits', params: { n: count }, done: count >= 10 },
        { key: 'goal.tapeout', params: {}, done: Boolean(play.taped) },
      ]
    }
    if (index === 8) {
      return [
        { key: 'goal.countSix', params: {}, done: play.beats >= 6 },
        { key: 'goal.count15', params: {}, done: Boolean(play.reached15) },
        { key: 'goal.countWrap', params: {}, done: Boolean(play.wrapped) },
      ]
    }
    if (index === 9) {
      const done = play.results || {}
      return [
        { key: 'goal.cpuAdd', params: {}, done: Boolean(done.add35) },
        { key: 'goal.cpuSum', params: {}, done: Boolean(done.sum15) },
        { key: 'goal.cpuMul', params: {}, done: Boolean(done.mul12) },
        { key: 'goal.cpuStep', params: { n: Math.min(3, play.manualSteps || 0) }, done: (play.manualSteps || 0) >= 3 },
      ]
    }
    return [
      { key: 'goal.safetyModes', params: { n: countBits(play.seenMask || 0) }, done: (play.seenMask || 0) === 15 },
      { key: 'goal.safetyAudit', params: {}, done: Boolean(play.verify && play.verify.status === 'pass') },
      { key: 'goal.tapeout', params: {}, done: Boolean(play.taped) },
    ]
  }

  function countBits(value) {
    let count = 0
    let v = value
    while (v) {
      count += v & 1
      v >>= 1
    }
    return count
  }

  function isChapterDone(state, index) {
    if (index === 0) return state.play.minted.length >= 8
    if (index === 1) return state.play.visited === 15 && state.play.verify.status === 'pass'
    if (index === 2) return state.play.verify.status === 'pass'
    if (index === 3) return state.play.phase === 'done'
    if (index === 4) return state.play.stableQ >= 3 && state.play.stableQn >= 2
    if (index === 5) return state.play.taped && state.play.verify.status === 'pass'
    if (index === 6) return state.play.showResult
    if (index === 7) {
      return Boolean(
        state.play.synthesized &&
          state.play.taped &&
          state.play.verify.status === 'pass' &&
          state.play.visitedMask === 0x3ff,
      )
    }
    if (index === 8) return Boolean(state.play.reached15 && state.play.wrapped)
    if (index === 9) {
      return ['add35', 'sum15', 'mul12'].every((id) => Boolean(state.play.results && state.play.results[id]))
    }
    if (index === 10) {
      return Boolean(state.play.taped && state.play.verify.status === 'pass' && (state.play.seenMask || 0) === 15)
    }
    return false
  }

  function latchTick(state) {
    const play = state.play
    const S = play.S
    const R = play.R
    const inputBits = S | (R << 1)
    const result = TT.Circuit.step(play.latch, inputBits, play.stateBits)
    const stateBits = result.stateBits
    const Q = stateBits & 1
    const Qn = (stateBits >> 1) & 1
    const entry = { block: state.blocks + 1, S, R, Q, Qn }
    const wave = [...play.wave, entry].slice(-30)
    let stableQ = play.stableQ
    let stableQn = play.stableQn
    let settled = null
    if (Q === 1 && Qn === 0) {
      stableQ += 1
      settled = 'set'
    } else if (Q === 0 && Qn === 1) {
      stableQn += 1
      settled = 'reset'
    }
    const transient = Q === Qn
    const transientSeen = play.transientSeen || transient
    const next = {
      ...state,
      play: {
        ...play,
        stateBits,
        history: [...play.history, entry].slice(-8),
        wave,
        stableQ,
        stableQn,
        transientSeen,
      },
    }
    if (transient && !play.transientSeen) {
      return pushToast(next, 'toast.latchTransient', {}, 'info')
    }
    if (stableQ >= 3 && stableQn >= 2) return markComplete(next, 4, 'toast.latchDone')
    return next
  }

  function programTick(state) {
    const play = state.play
    if (!play.running) return state
    const reveal = Math.min(play.total, play.reveal + 1)
    const done = reveal >= play.total
    const next = {
      ...state,
      play: {
        ...play,
        reveal,
        running: !done,
        showResult: done,
        done,
        history: [...(play.history || []), { block: state.blocks + 1, reveal }].slice(-8),
      },
    }
    if (done) return markComplete(pushToast(next, 'toast.cpuDone', {}, 'good'), 6)
    return next
  }

  // ------------------------------------------------------------------ new chapters

  function segMaskOf(play) {
    const bits = (play.inputs || [0, 0, 0, 0]).reduce((sum, value, index) => sum | ((value ? 1 : 0) << index), 0)
    let mask = 0
    if (play.netlist) {
      try {
        mask = TT.Circuit.evaluate(play.netlist, bits).outputBits & 0x7f
      } catch (error) {
        mask = 0
      }
    } else if (TT.Circuit.canonical.sevenSegExpected) {
      mask = TT.Circuit.canonical.sevenSegExpected(bits) & 0x7f
    }
    return { bits, mask, digit: bits, valid: bits < 10 }
  }

  function segRefresh(state) {
    const play = { ...state.play }
    const info = segMaskOf(play)
    play.digit = info.digit
    play.mask = info.mask
    if (play.synthesized && info.valid) play.visitedMask = (play.visitedMask || 0) | (1 << info.digit)
    return { ...state, play }
  }

  function counterAdvance(state) {
    if (!state.play.netlist || !TT.Circuit.step) return state
    const result = TT.Circuit.step(state.play.netlist, 0, state.play.stateBits || 0)
    const play = {
      ...state.play,
      stateBits: result.stateBits & 15,
      beats: (state.play.beats || 0) + 1,
      reached15: state.play.reached15 || (result.stateBits & 15) === 15,
      wrapped: state.play.wrapped || (state.play.reached15 && (result.stateBits & 15) === 0),
      history: [...(state.play.history || []), result.stateBits & 15].slice(-24),
    }
    let next = { ...state, play }
    if (play.wrapped && !state.completed[8]) next = markComplete(next, 8, 'toast.counterDone')
    return next
  }

  function cpuStepOnce(state) {
    const play = state.play
    if (!play.state || !TT.CPU) return state
    let stepped
    try {
      stepped = TT.CPU.step(play.state)
    } catch (error) {
      return pushToast(state, 'toast.cpuError', { error: String(error && error.message ? error.message : error) }, 'warn')
    }
    const trace = [...(play.trace || []), stepped.trace && stepped.trace.length ? stepped.trace[stepped.trace.length - 1] : null]
      .filter(Boolean)
      .slice(-8)
    const out = stepped.OUT !== undefined ? stepped.OUT : stepped.out !== undefined ? stepped.out : stepped.A
    const halted = Boolean(stepped.halted)
    const results = { ...(play.results || {}) }
    let next = {
      ...state,
      play: {
        ...play,
        state: stepped,
        running: halted ? false : play.running,
        halted,
        trace,
        steps: (play.steps || 0) + 1,
        manualSteps: (play.manualSteps || 0) + (play.manual ? 1 : 0),
      },
    }
    if (halted && play.programId) {
      results[play.programId] = out
      next.play = { ...next.play, results }
      next = pushToast(next, 'toast.cpuProgramDone', { out }, 'good')
      if (isChapterDone(next, 9)) next = markComplete(next, 9, 'toast.cpuDoneAll')
    }
    return next
  }

  function safetyRefresh(state) {
    if (!state.play.netlist || !TT.Safety) return state
    const result = TT.Safety.evaluate(state.play.bits || 0)
    return {
      ...state,
      play: {
        ...state.play,
        mode: result.mode,
        seenMask: (state.play.seenMask || 0) | (1 << result.mode),
      },
    }
  }

  function museumNetlist(id) {
    if (!TT.Parts || !TT.Parts.museum) return null
    const entry = TT.Parts.museum.find((item) => item.id === id)
    if (!entry) return null
    if (entry.id === 'safety') return TT.Safety.netlist()
    if (entry.id === 'counter4') return null
    const builder = TT.Circuit.canonical[entry.build || entry.id]
    if (typeof builder === 'function') {
      try {
        return builder()
      } catch (error) {
        return null
      }
    }
    return null
  }

  function labVerify(synth, nIn, bits) {
    const rows = []
    let mismatches = 0
    const count = 1 << nIn
    for (let index = 0; index < count; index += 1) {
      const expected = bits[index]
      if (expected < 0) continue
      let actual = 0
      try {
        actual = TT.Circuit.evaluate(synth.netlist, index).outputBits & 1
      } catch (error) {
        actual = -1
      }
      const ok = actual === expected
      if (!ok) mismatches += 1
      if (rows.length < 256) rows.push({ inputBits: index, actualBits: actual, expectedBits: expected, ok })
    }
    return { status: mismatches ? 'fail' : 'pass', rows, count, mismatches, nIn }
  }

  // ------------------------------------------------------------------ reducer

  function reduceInner(state, action) {
    if (!action || !action.type) return state
    switch (action.type) {
      case 'sims/open': {
        const id = ['deweb', 'relay', 'container'].indexOf(action.id) >= 0 ? action.id : null
        return id ? { ...state, simOpen: id } : state
      }
      case 'sims/close':
        return { ...state, simOpen: null }
      case 'sims/complete': {
        const id = ['deweb', 'relay', 'container'].indexOf(action.id) >= 0 ? action.id : null
        if (!id) return state
        return pushToast({ ...state, sims: { ...state.sims, [id]: true } }, 'sim.toast.done', {}, 'good')
      }
      case 'update/open':
        return { ...state, updateOpen: true }
      case 'update/close':
        return { ...state, updateOpen: false }
      case 'achv/open':
        return { ...state, achvOpen: true }
      case 'achv/close':
        return { ...state, achvOpen: false }
      case 'achv/unlock': {
        const ids = Array.isArray(action.ids) ? action.ids : [action.id]
        const fresh = ids.filter((id) => id && (state.unlocked || []).indexOf(id) < 0)
        if (!fresh.length) return state
        let next = { ...state, unlocked: [...(state.unlocked || []), ...fresh] }
        for (const id of fresh) next = pushToast(next, 'achv.got', { name: action.title || id }, 'good')
        return next
      }
      case 'welcome/open':
        return { ...state, welcome: true }
      case 'welcome/close':
        return { ...state, welcome: false }
      case 'eco/open':
        return { ...state, mode: 'eco' }
      case 'eco/close':
        return { ...state, mode: 'missions' }
      case 'news/open':
        return { ...state, mode: 'news' }
      case 'news/close':
        return { ...state, mode: 'missions' }
      case 'intro/open':
        return { ...state, intro: true }
      case 'intro/close':
        return { ...state, intro: false }
      case 'arcade/open':
        return ensureDaily({
          ...state,
          mode: 'arcade',
          arcade: ensureSnake(ensureArcadePuzzles({ ...state.arcade, game: action.game || state.arcade.game })),
        })
      case 'arcade/close':
        return { ...state, mode: 'missions' }
      case 'arcade/game':
        return ensureDaily({
          ...state,
          mode: 'arcade',
          arcade: ensureSnake(ensureArcadePuzzles({ ...state.arcade, game: action.game || state.arcade.game })),
        })
      case 'defi/pool':
        return { ...state, defi: { ...state.defi, poolId: action.id || 'eth-usdc', audit: null, receipt: null, verifyResult: null } }
      case 'defi/amount':
        return { ...state, defi: { ...state.defi, amountIn: Math.max(0, Number(action.value) || 0), audit: null, receipt: null, verifyResult: null } }
      case 'defi/impact':
        return { ...state, defi: { ...state.defi, maxImpact: Math.max(0.1, Number(action.value) || 0), audit: null, receipt: null, verifyResult: null } }
      case 'defi/cap':
        return { ...state, defi: { ...state.defi, cap: Math.max(1, Number(action.value) || 1), audit: null, receipt: null, verifyResult: null } }
      case 'defi/flag': {
        const key = ['allowlisted', 'paused', 'oracle'].indexOf(action.key) >= 0 ? action.key : 'oracle'
        return { ...state, defi: { ...state.defi, [key]: state.defi[key] ? 0 : 1, audit: null, receipt: null, verifyResult: null } }
      }
      case 'defi/resetPool': {
        if (!TT.Defi) return state
        const meta = TT.Defi.pool(state.defi.poolId)
        return {
          ...state,
          defi: { ...state.defi, pools: { ...state.defi.pools, [meta.id]: { x: meta.x, y: meta.y } }, trades: [] },
        }
      }
      case 'defi/execute': {
        if (!TT.Defi) return state
        const defi = state.defi
        const meta = TT.Defi.pool(defi.poolId)
        const poolState = defi.pools[defi.poolId] || { x: meta.x, y: meta.y }
        const quote = TT.Defi.quote(poolState, defi.amountIn)
        const evaluation = TT.Defi.evaluate({
          poolId: defi.poolId,
          x: poolState.x,
          y: poolState.y,
          amountIn: defi.amountIn,
          maxImpact: defi.maxImpact,
          cap: defi.cap,
          impact: quote.impact,
          allowlisted: defi.allowlisted,
          paused: defi.paused,
          oracle: defi.oracle,
        })
        if (!evaluation.allow) {
          return pushToast(state, 'defi.blocked', { reasons: evaluation.reasons.join('；') }, 'warn')
        }
        const trade = {
          poolId: defi.poolId,
          amountIn: quote.amountIn,
          amountOut: quote.amountOut,
          impact: quote.impact,
          at: Date.now(),
        }
        return {
          ...state,
          defi: {
            ...defi,
            pools: { ...defi.pools, [defi.poolId]: { x: quote.newX, y: quote.newY } },
            trades: [trade, ...(defi.trades || [])].slice(0, 8),
            receipt: null,
          },
        }
      }
      case 'defi/audit': {
        if (!TT.Defi) return state
        return { ...state, defi: { ...state.defi, audit: TT.Defi.audit() } }
      }
      case 'defi/issue': {
        if (!TT.Defi) return state
        const defi = state.defi
        const meta = TT.Defi.pool(defi.poolId)
        const poolState = defi.pools[defi.poolId] || { x: meta.x, y: meta.y }
        const quote = TT.Defi.quote(poolState, defi.amountIn)
        const issued = TT.Defi.receipt({
          poolId: defi.poolId, x: poolState.x, y: poolState.y, amountIn: defi.amountIn,
          maxImpact: defi.maxImpact, cap: defi.cap, impact: quote.impact,
          allowlisted: defi.allowlisted, paused: defi.paused, oracle: defi.oracle,
        })
        return {
          ...state,
          defi: {
            ...defi,
            receipt: { code: issued.code, fingerprint: issued.fingerprint, at: issued.payload.at },
            verifyCode: issued.code,
            verifyResult: null,
          },
        }
      }
      case 'defi/verifyCode':
        return { ...state, defi: { ...state.defi, verifyCode: String(action.code || ''), verifyResult: null } }
      case 'defi/verifyHash':
        return { ...state, defi: { ...state.defi, verifyHash: String(action.hash || ''), verifyResult: null } }
      case 'defi/verify': {
        if (!TT.Defi) return state
        return { ...state, defi: { ...state.defi, verifyResult: TT.Defi.verify(state.defi.verifyCode, state.defi.verifyHash) } }
      }
      case 'sensors/scenario':
        return {
          ...state,
          sensors: { ...state.sensors, scenarioId: action.id || 'home', audit: null, receipt: null, verifyResult: null },
        }
      case 'sensors/value':
        return {
          ...state,
          sensors: {
            ...state.sensors,
            values: { ...state.sensors.values, [action.key]: Number(action.value) || 0 },
            audit: null,
            receipt: null,
            verifyResult: null,
          },
        }
      case 'sensors/threshold':
        return {
          ...state,
          sensors: {
            ...state.sensors,
            thresholds: { ...state.sensors.thresholds, [action.key]: Number(action.value) || 0 },
            audit: null,
            receipt: null,
            verifyResult: null,
          },
        }
      case 'sensors/audit': {
        if (!TT.Sensors) return state
        const audit = TT.Sensors.audit(state.sensors.scenarioId)
        return { ...state, sensors: { ...state.sensors, audit } }
      }
      case 'sensors/issue': {
        if (!TT.Sensors) return state
        const issued = TT.Sensors.receipt(state.sensors.scenarioId, state.sensors.values, state.sensors.thresholds)
        const entry = { code: issued.code, fingerprint: issued.fingerprint, at: issued.payload.at }
        return {
          ...state,
          sensors: { ...state.sensors, receipt: entry, verifyCode: entry.code, verifyResult: null },
        }
      }
      case 'sensors/verifyCode':
        return { ...state, sensors: { ...state.sensors, verifyCode: String(action.code || ''), verifyResult: null } }
      case 'sensors/verifyHash':
        return { ...state, sensors: { ...state.sensors, verifyHash: String(action.hash || ''), verifyResult: null } }
      case 'sensors/verify': {
        if (!TT.Sensors) return state
        const result = TT.Sensors.verify(state.sensors.verifyCode, state.sensors.verifyHash)
        return { ...state, sensors: { ...state.sensors, verifyResult: result } }
      }
      case 'art/seed':
        return { ...state, art: { ...state.art, seed: String(action.seed || ''), index: 0, verifyResult: null } }
      case 'art/circuit':
        return { ...state, art: { ...state.art, circuit: action.circuit || 'lfsr8', index: 0, verifyResult: null } }
      case 'art/palette':
        return { ...state, art: { ...state.art, palette: Math.max(0, Number(action.palette) || 0), verifyResult: null } }
      case 'art/step':
        return { ...state, art: { ...state.art, index: (state.art.index || 0) + 1 } }
      case 'art/play':
        return { ...state, art: { ...state.art, playing: !state.art.playing } }
      case 'art/reset':
        return { ...state, art: { ...state.art, index: 0, playing: false } }
      case 'art/verifyCode':
        return { ...state, art: { ...state.art, verifyCode: String(action.code || ''), verifyResult: null } }
      case 'art/verifyHash':
        return { ...state, art: { ...state.art, verifyHash: String(action.hash || ''), verifyResult: null } }
      case 'art/verify': {
        if (!TT.Art) return state
        const result = TT.Art.verify(state.art.verifyCode, state.art.verifyHash)
        return { ...state, art: { ...state.art, verifyResult: result } }
      }
      case 'art/mint': {
        if (!TT.Art) return state
        const frame = TT.Art.params(state.art)
        const entry = { code: TT.Art.artworkCode(frame), frame }
        return { ...state, art: { ...state.art, gallery: [entry, ...(state.art.gallery || [])].slice(0, 12) } }
      }
      case 'art/load': {
        if (!TT.Art) return state
        const result = TT.Art.verify(action.code, state.art.verifyHash)
        if (!result.ok || !result.payload) {
          return { ...state, art: { ...state.art, verifyResult: result } }
        }
        return {
          ...state,
          art: {
            ...state.art,
            seed: result.payload.seed,
            circuit: result.payload.circuit,
            palette: result.payload.palette,
            index: result.payload.index,
            verifyCode: String(action.code || ''),
            verifyResult: result,
          },
        }
      }
      case 'lottery/seed':
        return { ...state, lottery: { ...state.lottery, seed: String(action.seed || ''), result: null, receipt: null, verifyResult: null } }
      case 'lottery/participants':
        return { ...state, lottery: { ...state.lottery, participants: String(action.text || ''), result: null, receipt: null, verifyResult: null } }
      case 'lottery/count': {
        const pool = TT.Lottery ? TT.Lottery.parseParticipants(state.lottery.participants).length : 1
        const count = Math.max(1, Math.min(Math.max(1, pool), Number(action.count) || 1))
        return { ...state, lottery: { ...state.lottery, count } }
      }
      case 'lottery/randomSeed': {
        if (!TT.Lottery) return state
        const seed = '0x' + TT.Lottery.hash32(String(state.blocks) + ':' + Date.now()).toString(16).padStart(8, '0')
        return { ...state, lottery: { ...state.lottery, seed, result: null, receipt: null, verifyResult: null } }
      }
      case 'lottery/draw': {
        if (!TT.Lottery) return state
        try {
          const result = TT.Lottery.draw({
            seed: state.lottery.seed,
            participants: TT.Lottery.parseParticipants(state.lottery.participants),
            count: state.lottery.count,
          })
          const issued = TT.Lottery.receipt(result)
          const entry = { code: issued.code, winners: result.winners, seedHash: result.seedHash, at: Date.now() }
          return {
            ...state,
            lottery: {
              ...state.lottery,
              result,
              receipt: entry,
              history: [entry, ...(state.lottery.history || [])].slice(0, 6),
              verifyCode: entry.code,
              verifyResult: null,
            },
          }
        } catch (error) {
          return pushToast(state, 'lottery.error', { error: String(error && error.message ? error.message : error) }, 'warn')
        }
      }
      case 'lottery/verifyCode':
        return { ...state, lottery: { ...state.lottery, verifyCode: String(action.code || ''), verifyResult: null } }
      case 'lottery/verifySeedHash':
        return { ...state, lottery: { ...state.lottery, verifySeedHash: String(action.hash || ''), verifyResult: null } }
      case 'lottery/verify': {
        if (!TT.Lottery) return state
        const result = TT.Lottery.verify(state.lottery.verifyCode, state.lottery.verifySeedHash)
        return { ...state, lottery: { ...state.lottery, verifyResult: result } }
      }
      case 'lottery/load': {
        if (!TT.Lottery) return state
        const result = TT.Lottery.verify(action.code, state.lottery.verifySeedHash)
        return { ...state, lottery: { ...state.lottery, verifyCode: String(action.code || ''), verifyResult: result } }
      }
      case 'access/policy':
        return {
          ...state,
          access: { ...state.access, policyId: action.id || 'simple', inputs: 0, audit: null, receipt: null, verifyResult: null },
        }
      case 'access/toggle': {
        if (!TT.Access) return state
        const policy = TT.Access.policy(state.access.policyId)
        const index = Math.max(0, Math.min(policy.inputs.length - 1, Number(action.index) || 0))
        const inputs = (state.access.inputs || 0) ^ (1 << index)
        return { ...state, access: { ...state.access, inputs, audit: null, verifyResult: null } }
      }
      case 'access/audit': {
        if (!TT.Access) return state
        const audit = TT.Access.audit(state.access.policyId)
        return { ...state, access: { ...state.access, audit } }
      }
      case 'access/issue': {
        if (!TT.Access) return state
        const issued = TT.Access.receipt(state.access.policyId, state.access.inputs || 0)
        const entry = {
          code: issued.code,
          policy: state.access.policyId,
          allow: issued.allow,
          fingerprint: issued.fingerprint,
          at: issued.payload.at,
        }
        return {
          ...state,
          access: {
            ...state.access,
            receipt: entry,
            receipts: [entry, ...(state.access.receipts || [])].slice(0, 6),
            verifyCode: entry.code,
            verifyResult: null,
          },
        }
      }
      case 'access/verifyCode':
        return { ...state, access: { ...state.access, verifyCode: String(action.code || ''), verifyResult: null } }
      case 'access/verifyHash':
        return { ...state, access: { ...state.access, verifyHash: String(action.hash || ''), verifyResult: null } }
      case 'access/verify': {
        if (!TT.Access) return state
        const result = TT.Access.verify(state.access.verifyCode, state.access.verifyHash)
        return { ...state, access: { ...state.access, verifyResult: result } }
      }
      case 'access/loadReceipt':
        return {
          ...state,
          access: { ...state.access, verifyCode: String(action.code || ''), verifyResult: TT.Access ? TT.Access.verify(action.code, state.access.verifyHash) : null },
        }
      case 'lab/hardware':
        return { ...state, lab: { ...state.lab, tab: 'hardware', hardwareFrom: action.from === 'sandbox' ? 'sandbox' : 'result' } }
      case 'lab/import': {
        if (!TT.Export) return state
        try {
          const entries = TT.Export.decodeLibrary(action.code)
          const existing = state.lab.library || []
          const ids = new Set(existing.map((item) => item.id))
          const merged = [...existing]
          for (const entry of entries) {
            if (ids.has(entry.id)) continue
            merged.push(entry)
            ids.add(entry.id)
          }
          let next = { ...state, lab: { ...state.lab, library: merged.slice(0, 24) } }
          return pushToast(next, 'lab.importDone', { n: merged.length - existing.length }, 'good')
        } catch (error) {
          return pushToast(state, 'lab.importFail', { error: String(error && error.message ? error.message : error) }, 'warn')
        }
      }
      case 'daily/toggle': {
        if (!state.daily) return state
        const index = Math.max(0, Math.min(7, Number(action.index) || 0))
        if (state.daily.solved) return state
        const answers = state.daily.answers.slice()
        answers[index] = answers[index] ? 0 : 1
        return { ...state, daily: { ...state.daily, answers } }
      }
      case 'daily/query': {
        if (!state.daily || state.daily.solved || !TT.Daily) return state
        const index = Math.max(0, Math.min(7, Number(action.index) || 0))
        if (state.daily.used >= (state.daily.puzzle ? state.daily.puzzle.budget : TT.Daily.BUDGET)) return state
        if (state.daily.revealed.some((entry) => entry.index === index)) return state
        const puzzle = TT.Daily.puzzle(state.daily.date)
        const reveal = TT.Daily.query(puzzle, index)
        const answers = state.daily.answers.slice()
        answers[index] = reveal.out
        return {
          ...state,
          daily: { ...state.daily, used: state.daily.used + 1, answers, revealed: [...state.daily.revealed, { ...reveal, kind: 'query' }] },
        }
      }
      case 'daily/submit': {
        if (!state.daily || state.daily.solved || !TT.Daily) return state
        const puzzle = TT.Daily.puzzle(state.daily.date)
        const result = TT.Daily.evaluate(puzzle, state.daily.answers)
        if (!result.solved) {
          return {
            ...state,
            daily: { ...state.daily, diff: result.diff, attempts: (state.daily.attempts || 0) + 1 },
            toast: { key: 'daily.fail', params: { n: result.diff.length }, tone: 'warn', at: Date.now() },
          }
        }
        const bestMap = { ...(state.stats.daily || {}) }
        const previous = bestMap[state.daily.date]
        bestMap[state.daily.date] = previous === undefined ? state.daily.used : Math.min(previous, state.daily.used)
        return {
          ...state,
          stats: { ...state.stats, daily: bestMap },
          daily: { ...state.daily, solved: true, diff: [], best: bestMap[state.daily.date] },
          toast: { key: 'daily.win', params: { n: state.daily.used }, tone: 'good', at: Date.now() },
        }
      }
      case 'daily/reset': {
        if (!TT.Daily) return state
        const day = state.daily ? state.daily.date : TT.Daily.dateKey()
        return { ...state, daily: TT.Daily.start(TT.Daily.puzzle(day), state.stats) }
      }
      case 'snake/toggle': {
        const snake = state.arcade.snake || (TT.Arcade ? TT.Arcade.snakeInitial() : null)
        if (!snake) return state
        if (!snake.alive) {
          const reset = TT.Arcade.snakeInitial(undefined, snake.speed || 'normal')
          return { ...state, arcade: { ...state.arcade, snake: { ...reset, running: true } } }
        }
        return { ...state, arcade: { ...state.arcade, snake: { ...snake, running: !snake.running } } }
      }
      case 'snake/speed': {
        const snake = state.arcade.snake
        const speed = ['slow', 'normal', 'fast'].indexOf(action.speed) >= 0 ? action.speed : 'normal'
        if (!snake || snake.running) return state
        return { ...state, arcade: { ...state.arcade, snake: { ...snake, speed } } }
      }
      case 'snake/dir': {
        const snake = state.arcade.snake || (TT.Arcade ? TT.Arcade.snakeInitial() : null)
        if (!snake || !TT.Arcade) return state
        return { ...state, arcade: { ...state.arcade, snake: TT.Arcade.snakeTurn(snake, action.dir) } }
      }
      case 'snake/tick': {
        const snake = state.arcade.snake
        if (!snake || !snake.running || !TT.Arcade) return state
        const next = TT.Arcade.snakeStep(snake)
        const speed = snake.speed || 'normal'
        let stats = {
          ...state.stats,
          snakeBest: Math.max(state.stats.snakeBest || 0, next.score || 0),
          snakeBySpeed: { ...(state.stats.snakeBySpeed || {}), [speed]: Math.max((state.stats.snakeBySpeed || {})[speed] || 0, next.score || 0) },
        }
        if (!next.alive && snake.alive) {
          const entry = { score: next.score, speed, at: Date.now() }
          stats = {
            ...stats,
            snakeScores: [entry, ...(stats.snakeScores || [])].sort((a, b) => b.score - a.score).slice(0, 5),
          }
        }
        return { ...state, stats, arcade: { ...state.arcade, snake: next } }
      }
      case 'snake/reset':
        return { ...state, arcade: { ...state.arcade, snake: TT.Arcade ? TT.Arcade.snakeInitial(undefined, (state.arcade.snake && state.arcade.snake.speed) || 'normal') : null } }
      case 'music/toggle':
        return {
          ...state,
          arcade: { ...state.arcade, music: { ...state.arcade.music, playing: !state.arcade.music.playing } },
        }
      case 'music/step': {
        const tune = TT.Arcade.TUNES[state.arcade.music.tune % TT.Arcade.TUNES.length]
        const step = ((state.arcade.music.step || 0) + 1) % tune.steps.length
        return { ...state, arcade: { ...state.arcade, music: { ...state.arcade.music, step } } }
      }
      case 'music/tempo':
        return {
          ...state,
          arcade: { ...state.arcade, music: { ...state.arcade.music, tempo: Math.max(160, Math.min(900, Number(action.tempo) || 420)) } },
        }
      case 'music/scale':
        return {
          ...state,
          arcade: { ...state.arcade, music: { ...state.arcade.music, scale: Math.max(0, Number(action.index) || 0) % TT.Arcade.SCALES.length } },
        }
      case 'music/tune':
        return {
          ...state,
          arcade: { ...state.arcade, music: { ...state.arcade.music, tune: Math.max(0, Number(action.index) || 0) % TT.Arcade.TUNES.length, step: 0 } },
        }
      case 'pixel/toggle': {
        const bits = state.arcade.pixel.bits.slice()
        const index = Math.max(0, Math.min(63, Number(action.index) || 0))
        bits[index] = bits[index] ? 0 : 1
        return { ...state, arcade: { ...state.arcade, pixel: { ...state.arcade.pixel, bits } } }
      }
      case 'pixel/pattern':
        return {
          ...state,
          arcade: { ...state.arcade, pixel: { ...state.arcade.pixel, bits: TT.Arcade.pattern(action.name) } },
        }
      case 'pixel/clear':
        return { ...state, arcade: { ...state.arcade, pixel: { ...state.arcade.pixel, bits: new Array(64).fill(0) } } }
      case 'pixel/anim':
        return { ...state, arcade: { ...state.arcade, pixel: { ...state.arcade.pixel, anim: !state.arcade.pixel.anim } } }
      case 'pixel/shift':
        return {
          ...state,
          arcade: { ...state.arcade, pixel: { ...state.arcade.pixel, bits: TT.Arcade.shiftPattern(state.arcade.pixel.bits) } },
        }
      case 'lock/toggle': {
        const index = Math.max(0, Math.min(3, Number(action.index) || 0))
        const guess = (state.arcade.lock.guess || 0) ^ (1 << index)
        return { ...state, arcade: { ...state.arcade, lock: { ...state.arcade.lock, guess, solved: false, last: null } } }
      }
      case 'lock/check': {
        const lock = state.arcade.lock
        if (lock.solved || lock.failed) return state
        const attempts = lock.attempts + 1
        const solved = lock.guess === lock.code
        const maxAttempts = lock.maxAttempts || 6
        const failed = !solved && attempts >= maxAttempts
        let stats = state.stats
        if (solved) {
          stats = {
            ...stats,
            lockWins: (stats.lockWins || 0) + 1,
            lockBestAttempts: stats.lockBestAttempts === null || stats.lockBestAttempts === undefined ? attempts : Math.min(stats.lockBestAttempts, attempts),
          }
        }
        return {
          ...state,
          stats,
          arcade: {
            ...state.arcade,
            lock: { ...lock, attempts, last: lock.guess, solved, failed, bestAttempts: stats.lockBestAttempts },
          },
        }
      }
      case 'lock/reset':
        return { ...state, arcade: { ...state.arcade, lock: { ...state.arcade.lock, guess: 0, attempts: 0, last: null, solved: false, failed: false } } }
      case 'guess/toggle': {
        const index = Math.max(0, Math.min(3, Number(action.index) || 0))
        const value = (state.arcade.guess.guess || 0) ^ (1 << index)
        return { ...state, arcade: { ...state.arcade, guess: { ...state.arcade.guess, guess: value } } }
      }
      case 'guess/submit': {
        const game = state.arcade.guess
        const maxTries = game.maxTries || 5
        if (game.solved || game.tries >= maxTries) return state
        const cmp = game.guess === game.secret ? 0 : game.guess > game.secret ? 1 : -1
        const tries = game.tries + 1
        const solved = cmp === 0
        const score = solved ? Math.max(10, (maxTries + 1 - tries) * 10) : 0
        const best = solved ? (state.stats.guessBest === null || state.stats.guessBest === undefined ? tries : Math.min(state.stats.guessBest, tries)) : state.stats.guessBest
        return {
          ...state,
          stats: { ...state.stats, guessBest: best, guessScoreBest: Math.max(state.stats.guessScoreBest || 0, score) },
          arcade: {
            ...state.arcade,
            guess: {
              ...game,
              tries,
              solved,
              score,
              history: [...(game.history || []), { value: game.guess, cmp }],
            },
          },
        }
      }
      case 'guess/restart': {
        const secrets = [11, 3, 13, 7, 9, 5, 14, 2]
        const current = state.arcade.guess
        const nextSecret = secrets[(secrets.indexOf(current.secret) + 1) % secrets.length]
        return {
          ...state,
          arcade: { ...state.arcade, guess: { secret: nextSecret, guess: 0, tries: 0, history: [], solved: false } },
        }
      }
      case 'vote/toggle': {
        const vote = state.arcade.vote
        return {
          ...state,
          arcade: { ...state.arcade, vote: { ...vote, [['a', 'b', 'c'][Math.max(0, Math.min(2, action.index || 0))]]: vote[['a', 'b', 'c'][Math.max(0, Math.min(2, action.index || 0))]] ? 0 : 1 } },
        }
      }
      case 'debug/level':
        return {
          ...state,
          arcade: {
            ...state.arcade,
            debug: { ...state.arcade.debug, level: Math.max(0, Number(action.level) || 0), selected: null, status: 'idle' },
          },
        }
      case 'debug/select': {
        const debug = state.arcade.debug
        const puzzle = debug.puzzles && debug.puzzles[debug.level]
        if (!puzzle) return state
        const option = puzzle.options[Number(action.option) || 0]
        const status = option && option.correct ? 'pass' : 'fail'
        return {
          ...state,
          arcade: {
            ...state.arcade,
            debug: {
              ...debug,
              selected: Number(action.option) || 0,
              status,
              attempts: debug.attempts + (status === 'fail' ? 1 : 0),
              solved: debug.solved + (status === 'pass' ? 1 : 0),
            },
          },
          stats: status === 'pass' ? { ...state.stats, debugSolved: Math.max(state.stats.debugSolved || 0, debug.solved + 1) } : state.stats,
        }
      }
      case 'debug/reset':
        return {
          ...state,
          arcade: { ...state.arcade, debug: { ...state.arcade.debug, selected: null, status: 'idle' } },
        }
      case 'sound/toggle':
        return { ...state, soundMuted: !state.soundMuted }
      case 'cinema/set':
        return { ...state, cinema: Boolean(action.active) }
      case 'codex/open':
        return { ...state, codex: true }
      case 'codex/close':
        return { ...state, codex: false }
      case 'codex/toggle':
        return { ...state, codex: !state.codex }
      case 'pause/toggle':
        return { ...state, paused: !state.paused }
      case 'speed/toggle':
        return { ...state, speed: state.speed === 1 ? 4 : 1 }
      case 'hint':
        return { ...state, hint: (state.hint || 0) + 1 }
      case 'toast/clear':
        if (!state.toast || (action.id && action.id !== state.toast.id)) return state
        return { ...state, toast: null }
      case 'chapter/select':
        return selectChapter(state, action.index)
      case 'finale/close':
        return { ...state, finaleDismissed: true }
      case 'finale/open':
        return { ...state, finaleDismissed: false }
      case 'game/reset': {
        let next = initial()
        next = pushToast(next, 'toast.resetAll', {}, 'good')
        return next
      }
      case 'chapter/next':
        return selectChapter(state, Math.min(CHAPTERS.length - 1, state.chapter + 1))
      case 'challenge/start': {
        if (state.challenge && state.challenge.active) return state
        const chapter = state.chapter
        const completed = { ...state.completed, [chapter]: false }
        const flags = chapter === 0 ? { ...state.flags, mintedChips: [] } : state.flags
        let play = setupChapterPlay({ ...state, flags, play: playFor({ ...state, flags }, chapter) }, chapter)
        if (chapter === 0) {
          play = { ...play, mintOrder: challengeShuffle(((state.blocks || 1) * 2654435761) ^ ((state.epoch || 1) * 97), 8), mintCursor: 0 }
        }
        return {
          ...state,
          play,
          completed,
          intro: false,
          epoch: (state.epoch || 1) + 1,
          challenge: { active: true, chapter, startedAt: Date.now(), hadCompleted: Boolean(state.completed[chapter]), actions: 0, mistakes: 0 },
          toast: { key: 'challenge.start', params: { seconds: challengeConfig(chapter).gold }, tone: 'info', at: Date.now() },
        }
      }
      case 'challenge/reset': {
        if (!state.challenge || !state.challenge.active) {
          const chapter = state.chapter
          const flags = chapter === 0 ? { ...state.flags, mintedChips: [] } : state.flags
          return {
            ...state,
            flags,
            play: setupChapterPlay({ ...state, flags, play: playFor({ ...state, flags }, chapter) }, chapter),
            hint: 0,
            epoch: (state.epoch || 1) + 1,
          }
        }
        const chapter = state.challenge.chapter
        const flags = chapter === 0 ? { ...state.flags, mintedChips: [] } : state.flags
        return {
          ...state,
          flags,
          play: setupChapterPlay({ ...state, flags, play: playFor({ ...state, flags }, chapter) }, chapter),
          challenge: { ...state.challenge, startedAt: Date.now(), actions: 0, mistakes: 0 },
          toast: { key: 'challenge.resetDone', params: {}, tone: 'info', at: Date.now() },
        }
      }
      case 'challenge/abandon': {
        if (!state.challenge || !state.challenge.active) return state
        const chapter = state.challenge.chapter
        const completed = state.challenge.hadCompleted ? { ...state.completed, [chapter]: true } : state.completed
        const flags = chapter === 0 ? { ...state.flags, mintedChips: [] } : state.flags
        return {
          ...state,
          completed,
          flags,
          play: setupChapterPlay({ ...state, flags, play: playFor({ ...state, flags }, chapter) }, chapter),
          challenge: { active: false, chapter, startedAt: 0, hadCompleted: false, actions: 0, mistakes: 0 },
          toast: { key: 'challenge.abandoned', params: {}, tone: 'info', at: Date.now() },
        }
      }
      case 'chapter/reset': {
        const next = {
          ...state,
          play: setupChapterPlay({ ...state, play: playFor(state, state.chapter) }, state.chapter),
          hint: 0,
          epoch: (state.epoch || 1) + 1,
        }
        return next
      }

      // ---------------------------------------------------------- chapter 0
      case 'mint':
        if (state.chapter !== 0) return state
        if (state.play.minted.includes(action.chip)) return state
        {
          if (state.challenge && state.challenge.active && Array.isArray(state.play.mintOrder)) {
            const expected = state.play.mintOrder[state.play.mintCursor || 0]
            if (action.chip !== `chip:${expected}`) {
              return pushToast(
                { ...state, challenge: { ...state.challenge, mistakes: (state.challenge.mistakes || 0) + 1 } },
                'mint.wrongOrder',
                { next: expected + 1 },
                'warn',
              )
            }
          }
          const minted = [...state.play.minted, action.chip]
          let next = {
            ...state,
            nand: state.nand + 1,
            mintedTotal: state.mintedTotal + 1,
            flags: { ...state.flags, mintedChips: minted },
            play: { ...state.play, minted, mintCursor: (state.play.mintCursor || 0) + 1 },
          }
          next = pushLog(next, 'log.mintOne', { n: next.nand }, 'good')
          if (minted.length === 8) {
            next = markComplete(next, 0)
            next = pushToast(next, 'toast.mintDone', {}, 'good')
          }
          return next
        }
      case 'mint/all': {
        if (state.chapter !== 0) return state
        if (state.challenge && state.challenge.active) return pushToast(state, 'challenge.noShortcut', {}, 'warn')
        if ((state.play.minted || []).length < 2) return pushToast(state, 'mint.manualFirst', {}, 'warn')
        const minted = []
        for (let i = 0; i < TT.layout.mint.chips.length; i += 1) minted.push(`chip:${i}`)
        let next = {
          ...state,
          nand: state.nand + (minted.length - state.play.minted.length),
          mintedTotal: state.mintedTotal + (minted.length - state.play.minted.length),
          flags: { ...state.flags, mintedChips: minted },
          play: { ...state.play, minted },
        }
        next = pushLog(next, 'log.mintAll', { n: next.nand }, 'good')
        return markComplete(next, 0)
      }

      // ---------------------------------------------------------- chapter 1
      case 'input/toggle': {
        if (![1, 2, 5].includes(state.chapter)) return state
        const play = state.play
        const inputs = [...(play.inputs || [])]
        const index = Math.max(0, Math.min(inputs.length - 1, Number(action.index) || 0))
        inputs[index] = inputs[index] ? 0 : 1
        let next = { ...state, play: { ...play, inputs } }
        if (state.chapter === 1) {
          const visited = play.visited | (1 << ((inputs[0] || 0) | ((inputs[1] || 0) << 1)))
          next.play = { ...next.play, visited }
          if (visited === 15 && next.play.verify && next.play.verify.status === 'pass') {
            next = markComplete(next, 1, 'toast.nandDone')
          }
        }
        return next
      }
      case 'toast/show': {
        const seq = (state.toastSeq || 0) + 1
        return {
          ...state,
          toastSeq: seq,
          toast: { id: seq, key: action.key, params: action.params || {}, tone: action.tone || 'info' },
        }
      }
      case 'nand/toggle': {
        if (state.chapter !== 1) return state
        const which = action.index === 1 ? 1 : 0
        const inputs = [...state.play.inputs]
        inputs[which] = inputs[which] ? 0 : 1
        const visited = state.play.visited | (1 << (inputs[0] | (inputs[1] << 1)))
        let next = { ...state, play: { ...state.play, inputs, visited } }
        if (visited === 15 && next.play.verify && next.play.verify.status === 'pass') {
          next = markComplete(next, 1, 'toast.nandDone')
        }
        return next
      }
      case 'gate/place':
        if (state.chapter === 1) {
          if (state.play.placed) return state
          const next = { ...state, play: { ...state.play, placed: true } }
          return refresh(next)
        }
        if (state.chapter === 2) {
          if (state.play.gates >= 5) return state
          const next = { ...state, play: { ...state.play, gates: state.play.gates + 1 } }
          return refresh(next)
        }
        return state
      case 'box/place': {
        if (state.chapter !== 5) return state
        const order = ['ha1', 'ha2', 'or']
        const nextKind = order.find((kind) => !state.play.boxes.includes(kind))
        if (!nextKind) return state
        const boxes = [...state.play.boxes, nextKind]
        const next = { ...state, play: { ...state.play, boxes } }
        return refresh(next)
      }
      case 'wire/connect': {
        if (![1, 2, 5].includes(state.chapter)) return state
        return connect(state, action.from, action.to)
      }
      case 'wire/assist': {
        if (![1, 2, 5].includes(state.chapter)) return state
        if (state.challenge && state.challenge.active) return pushToast(state, 'challenge.noShortcut', {}, 'warn')
        const wire = nextAssistWire(state)
        if (!wire) return state
        return connect(state, wire.from, wire.to)
      }
      case 'wire/clear': {
        if (![1, 2, 5].includes(state.chapter)) return state
        return refresh({
          ...state,
          play: {
            ...state.play,
            wiring: {},
            wiringVersion: (state.play.wiringVersion || 0) + 1,
            lastWire: null,
          },
        })
      }
      case 'verify/run': {
        if (![1, 2, 5].includes(state.chapter)) return state
        return refresh(state)
      }

      // ---------------------------------------------------------- chapter 3
      case 'tapeout/quiz': {
        if (state.chapter !== 3) return state
        const play0 = state.play
        const active = state.challenge && state.challenge.active
        const step = play0.quizStep || 'gates'
        const expects = { gates: 5, burn: 5, pins: '22' }
        if (!expects[step]) return state
        const value = action.step === 'pins' ? String(action.value) : Number(action.value)
        const correct = value === expects[step]
        if (!correct) {
          let next = { ...state, play: { ...play0, quizWrong: (play0.quizWrong || 0) + 1 } }
          if (active) next = { ...next, challenge: { ...state.challenge, mistakes: (state.challenge.mistakes || 0) + 1 } }
          return pushToast(next, `tapeout.quizFail.${step}`, {}, 'warn')
        }
        const order = ['gates', 'burn', 'pins']
        const nextStep = active ? order[order.indexOf(step) + 1] || 'done' : 'done'
        const play = { ...play0, quizStep: nextStep, quizPassed: nextStep === 'done' }
        return pushToast({ ...state, play }, nextStep === 'done' ? 'tapeout.quizOk' : `tapeout.quizOk.${step}`, {}, 'good')
      }
      case 'tapeout/start': {
        if (state.chapter !== 3) return state
        if (!state.play.quizPassed) return pushToast(state, 'tapeout.quizFirst', {}, 'warn')
        if (state.play.phase !== 'idle') return state
        const netlist = state.play.halfNetlist
        if (!netlist) return state
        const gates = TT.Circuit.gateCount(netlist)
        let work = state
        if (work.nand < gates) {
          work = pushToast({ ...work, nand: gates }, 'toast.seedNand', { n: gates - work.nand }, 'info')
        }
        return {
          ...work,
          play: { ...work.play, phase: 'running', startedAt: Date.now(), nftId: work.circuits.length + 1 },
          epoch: (work.epoch || 1) + 1,
        }
      }
      case 'tapeout/done': {
        if (state.chapter !== 3 || state.play.phase !== 'running') return state
        const netlist = state.play.halfNetlist
        const gates = TT.Circuit.gateCount(netlist)
        const id = state.play.nftId || state.circuits.length + 1
        const circuit = {
          id,
          kind: 'halfAdder',
          nameKey: 'circuit.halfAdder',
          gateCount: gates,
          nIn: netlist.nIn,
          nOut: netlist.outputs.length,
          nState: netlist.nState || 0,
          netlist,
          hex: TT.Circuit.gateHex(netlist),
          demo: Boolean(state.play.demo),
          tapedAt: state.blocks,
        }
        let next = {
          ...state,
          nand: state.nand - gates,
          circuits: [...state.circuits, circuit],
          play: { ...state.play, phase: 'done', nftId: id },
        }
        next = pushLog(next, 'log.tapeout', { n: gates, id }, 'good')
        next = markComplete(next, 3)
        return pushToast(next, 'toast.tapeoutDone', { id, n: gates }, 'good')
      }
      case 'eval/run': {
        if (state.chapter !== 3 || state.play.phase !== 'done') return state
        const netlist = state.play.halfNetlist
        const rows = []
        for (let bits = 0; bits < 4; bits += 1) {
          const result = TT.Circuit.evaluate(netlist, bits)
          rows.push({ inputBits: bits, outputBits: result.outputBits })
        }
        return {
          ...state,
          play: { ...state.play, evalRows: rows },
        }
      }

      // ---------------------------------------------------------- chapter 4
      case 'latch/toggle': {
        if (state.chapter !== 4) return state
        if (action.kind === 'reset') {
          return { ...state, play: { ...state.play, R: state.play.R ? 0 : 1 } }
        }
        return { ...state, play: { ...state.play, S: state.play.S ? 0 : 1 } }
      }

      // ---------------------------------------------------------- chapter 5
      case 'lego/tapeout': {
        if (state.chapter !== 5) return state
        if (state.play.taped) return state
        const netlist = playerNetlist(state)
        if (!netlist || state.play.verify.status !== 'pass') {
          return pushToast(state, 'toast.verifyFirst', {}, 'warn')
        }
        const gates = TT.Circuit.gateCount(netlist)
        let work = state
        if (work.nand < gates) {
          work = pushToast({ ...work, nand: gates }, 'toast.seedNand', { n: gates - work.nand }, 'info')
        }
        const id = work.circuits.length + 1
        const circuit = {
          id,
          kind: 'fullAdderComposed',
          nameKey: 'circuit.composed',
          gateCount: gates,
          nIn: netlist.nIn,
          nOut: netlist.outputs.length,
          nState: 0,
          netlist,
          hex: TT.Circuit.gateHex(netlist),
          tapedAt: state.blocks,
        }
        let next = {
          ...work,
          nand: work.nand - gates,
          circuits: [...work.circuits, circuit],
          play: { ...work.play, taped: true },
        }
        next = pushLog(next, 'log.tapeoutLego', { n: gates, id }, 'good')
        next = markComplete(next, 5)
        return pushToast(next, 'toast.legoDone', { n: gates }, 'good')
      }

      // ---------------------------------------------------------- chapter 6
      case 'program/run': {
        if (state.chapter !== 6) return state
        if (state.play.running) return state
        const adder = state.play.adder || TT.Circuit.canonical.fourBitAdder()
        const [a, b] = state.play.operands
        const bits = a | (b << 4) | (0 << 8)
        const result = TT.Circuit.evaluate(adder, bits)
        return {
          ...state,
          play: {
            ...state.play,
            running: true,
            reveal: 0,
            showResult: false,
            done: false,
            history: [],
            result: { a, b, outputBits: result.outputBits, bits },
          },
          epoch: (state.epoch || 1) + 1,
        }
      }
      case 'program/again': {
        if (state.chapter !== 6) return state
        const pairs = [
          [3, 5],
          [7, 9],
          [15, 1],
          [10, 6],
        ]
        const idx = pairs.findIndex((pair) => pair[0] === state.play.operands[0] && pair[1] === state.play.operands[1])
        const nextPair = pairs[(idx + 1) % pairs.length]
        return {
          ...state,
          play: {
            ...state.play,
            running: false,
            operands: nextPair,
            reveal: 0,
            showResult: false,
            done: false,
            result: null,
            history: [],
          },
        }
      }

      // ---------------------------------------------------------- chapter 7: seven-segment
      case 'seg/synth': {
        if (state.chapter !== 7) return state
        if (state.play.synthesized) return state
        if (!TT.Circuit.canonical.sevenSegment) return pushToast(state, 'toast.toolMissing', {}, 'warn')
        const netlist = TT.Circuit.canonical.sevenSegment()
        const play = {
          ...state.play,
          synthesized: true,
          netlist,
          hex: TT.Circuit.gateHex(netlist),
          gateCount: TT.Circuit.gateCount(netlist),
          verify: { status: 'idle', rows: [], count: 0, mismatchCount: 0 },
        }
        return pushToast({ ...state, play }, 'toast.segSynthDone', { n: TT.Circuit.gateCount(netlist) }, 'good')
      }
      case 'seg/input': {
        if (state.chapter !== 7) return state
        const inputs = [...(state.play.inputs || [0, 0, 0, 0])]
        const index = Math.max(0, Math.min(3, Number(action.index) || 0))
        inputs[index] = inputs[index] ? 0 : 1
        return segRefresh({ ...state, play: { ...state.play, inputs } })
      }
      case 'seg/verify': {
        if (state.chapter !== 7 || !state.play.netlist) return state
        if (!TT.Circuit.canonical.sevenSegExpected) return state
        const result = TT.Circuit.exhaustiveVerify(state.play.netlist, (bits) =>
          TT.Circuit.canonical.sevenSegExpected(bits) & 0x7f,
        )
        const verify = {
          status: result.passed ? 'pass' : 'fail',
          rows: (result.rows || []).slice(0, 16),
          count: result.count,
          mismatchCount: result.mismatchCount || 0,
        }
        let next = { ...state, play: { ...state.play, verify } }
        next = pushToast(next, verify.status === 'pass' ? 'toast.segVerified' : 'toast.segVerifyFail', {}, verify.status === 'pass' ? 'good' : 'warn')
        return next
      }
      case 'seg/tapeout': {
        if (state.chapter !== 7 || state.play.taped) return state
        if (!state.play.netlist || state.play.verify.status !== 'pass') return pushToast(state, 'toast.verifyFirst', {}, 'warn')
        const gates = TT.Circuit.gateCount(state.play.netlist)
        let work = state
        if (work.nand < gates) work = pushToast({ ...work, nand: gates }, 'toast.seedNand', { n: gates - work.nand }, 'info')
        const id = work.circuits.length + 1
        const circuit = {
          id,
          kind: 'sevenSegment',
          nameKey: 'circuit.sevenSegment',
          gateCount: gates,
          nIn: 4,
          nOut: 7,
          nState: 0,
          netlist: state.play.netlist,
          hex: state.play.hex || TT.Circuit.gateHex(state.play.netlist),
          tapedAt: work.blocks,
        }
        let next = {
          ...work,
          nand: work.nand - gates,
          circuits: [...work.circuits, circuit],
          play: { ...work.play, taped: true },
        }
        next = pushLog(next, 'log.tapeout', { n: gates, id }, 'good')
        next = markComplete(next, 7, 'toast.segDone')
        return pushToast(next, 'toast.tapeoutDone', { id, n: gates }, 'good')
      }

      // ---------------------------------------------------------- chapter 8: counter
      case 'counter/step': {
        if (state.chapter !== 8) return state
        return counterAdvance(state)
      }

      // ---------------------------------------------------------- chapter 9: mini computer
      case 'cpu/select': {
        if (state.chapter !== 9) return state
        const loaded = loadProgram(Number(action.index) || 0)
        if (!loaded) return pushToast(state, 'toast.toolMissing', {}, 'warn')
        return {
          ...state,
          play: {
            ...state.play,
            programIndex: Number(action.index) || 0,
            programId: loaded.program.id,
            state: loaded.state,
            running: false,
            halted: false,
            trace: [],
            steps: 0,
            epoch: (state.play.epoch || 0) + 1,
          },
          epoch: (state.epoch || 1) + 1,
        }
      }
      case 'cpu/run': {
        if (state.chapter !== 9) return state
        let play = state.play
        if (!play.state || play.halted) {
          const loaded = loadProgram(play.programIndex || 0)
          if (!loaded) return state
          play = { ...play, state: loaded.state, halted: false, trace: [], steps: 0 }
        }
        return { ...state, play: { ...play, running: true } }
      }
      case 'cpu/step': {
        if (state.chapter !== 9) return state
        return cpuStepOnce({ ...state, play: { ...state.play, manual: true, running: false } })
      }
      case 'cpu/reset': {
        if (state.chapter !== 9) return state
        const loaded = loadProgram(state.play.programIndex || 0)
        if (!loaded) return state
        return {
          ...state,
          play: { ...state.play, state: loaded.state, running: false, halted: false, trace: [], steps: 0 },
        }
      }

      // ---------------------------------------------------------- chapter 10: TapeRover safety
      case 'safety/toggle': {
        if (state.chapter !== 10) return state
        const index = Math.max(0, Math.min(15, Number(action.index) || 0))
        const bits = (state.play.bits || 0) ^ (1 << index)
        return safetyRefresh({ ...state, play: { ...state.play, bits } })
      }
      case 'safety/preset': {
        if (state.chapter !== 10 || !TT.Safety) return state
        const bits = TT.Safety.PRESETS[action.kind] !== undefined ? TT.Safety.PRESETS[action.kind] : TT.Safety.PRESETS.stop
        return safetyRefresh({ ...state, play: { ...state.play, bits } })
      }
      case 'safety/audit': {
        if (state.chapter !== 10 || !TT.Safety) return state
        const audit = TT.Safety.audit()
        const verify = {
          status: audit.violations === 0 ? 'pass' : 'fail',
          rows: [],
          count: audit.count,
          mismatchCount: audit.violations,
          violations: audit.violations,
        }
        let seenMask = state.play.seenMask || 0
        audit.counts.forEach((count, index) => {
          if (count > 0) seenMask |= 1 << index
        })
        let next = { ...state, play: { ...state.play, verify, seenMask } }
        next = pushToast(next, verify.status === 'pass' ? 'toast.safetyAuditDone' : 'toast.safetyAuditFail', { n: audit.count }, verify.status === 'pass' ? 'good' : 'warn')
        return next
      }
      case 'safety/tapeout': {
        if (state.chapter !== 10 || state.play.taped) return state
        if (!TT.Safety) return state
        if (!state.play.verify || state.play.verify.status !== 'pass') return pushToast(state, 'toast.verifyFirst', {}, 'warn')
        const gates = TT.Safety.gateCount
        let work = state
        if (work.nand < gates) work = pushToast({ ...work, nand: gates }, 'toast.seedNand', { n: gates - work.nand }, 'info')
        const id = work.circuits.length + 1
        const netlist = state.play.netlist || TT.Safety.netlist()
        const circuit = {
          id,
          kind: 'safety',
          nameKey: 'circuit.safety',
          gateCount: gates,
          nIn: 16,
          nOut: 4,
          nState: 0,
          netlist,
          hex: TT.Circuit.gateHex(netlist),
          tapedAt: work.blocks,
        }
        let next = {
          ...work,
          nand: work.nand - gates,
          circuits: [...work.circuits, circuit],
          play: { ...work.play, taped: true },
        }
        next = pushLog(next, 'log.tapeout', { n: gates, id }, 'good')
        next = markComplete(next, 10, 'toast.safetyDone')
        return pushToast(next, 'toast.tapeoutDone', { id, n: gates }, 'good')
      }

      // ---------------------------------------------------------- lab / tools
      case 'lab/open':
        return { ...state, mode: 'lab' }
      case 'lab/close':
        return { ...state, mode: 'missions' }
      case 'lab/tab':
        return { ...state, mode: 'lab', lab: { ...state.lab, tab: action.tab || 'synth' } }
      case 'lab/nIn': {
        const nIn = Math.max(2, Math.min(4, Number(action.nIn) || 4))
        const bits = state.lab.bits.slice()
        for (let index = 1 << nIn; index < bits.length; index += 1) bits[index] = 0
        return { ...state, lab: { ...state.lab, nIn, bits, result: null, verify: null } }
      }
      case 'lab/toggle': {
        const nIn = state.lab.nIn
        const index = Math.max(0, Math.min((1 << nIn) - 1, Number(action.index) || 0))
        const bits = state.lab.bits.slice()
        bits[index] = action.value !== undefined ? Number(action.value) : (bits[index] + 1) % 3
        return { ...state, lab: { ...state.lab, bits } }
      }
      case 'lab/clear': {
        const bits = state.lab.bits.map(() => 0)
        return { ...state, lab: { ...state.lab, bits, result: null, verify: null } }
      }
      case 'lab/synth': {
        if (!TT.Circuit.synth) return pushToast(state, 'toast.toolMissing', {}, 'warn')
        const nIn = state.lab.nIn
        const bits = state.lab.bits.slice(0, 1 << nIn)
        try {
          const result = TT.Circuit.synth({ nIn, bits })
          const verify = labVerify(result, nIn, bits)
          return {
            ...state,
            stats: { ...state.stats, synth: (state.stats.synth || 0) + 1 },
            lab: { ...state.lab, result, verify },
          }
        } catch (error) {
          return pushToast(state, 'toast.synthFail', { error: String(error && error.message ? error.message : error) }, 'warn')
        }
      }
      case 'lab/importVerilog': {
        if (!TT.VerilogImport || !TT.Circuit) return state
        try {
          const parsed = TT.VerilogImport.parse(action.text)
          return {
            ...state,
            mode: 'lab',
            stats: { ...state.stats, imports: (state.stats.imports || 0) + 1 },
            lab: {
              ...state.lab,
              tab: 'sandbox',
              sandbox: { name: parsed.name || 'verilog', netlist: parsed.netlist },
              sandboxInputs: 0,
              museumId: null,
            },
          }
        } catch (error) {
          return pushToast(state, 'lab.verilog.fail', { error: String(error && error.message ? error.message : error) }, 'warn')
        }
      }
      case 'lab/sandbox': {
        let netlist = null
        let name = action.name || 'circuit'
        if (action.source === 'result') {
          netlist = state.lab.result ? state.lab.result.netlist : null
        } else if (action.source === 'museum') {
          netlist = museumNetlist(action.id)
          name = action.id
        } else if (action.source === 'library') {
          const entry = (state.lab.library || []).find((item) => item.id === action.id)
          netlist = entry ? entry.netlist : null
          if (entry) name = entry.name
        } else if (action.source === 'safety') {
          netlist = TT.Safety.netlist()
          name = 'safety16'
        } else if (action.netlist) {
          netlist = action.netlist
        }
        if (!netlist) return pushToast(state, 'toast.sandboxEmpty', {}, 'warn')
        return {
          ...state,
          mode: 'lab',
          lab: { ...state.lab, tab: 'sandbox', sandbox: { name, netlist }, sandboxInputs: 0, museumId: action.id || null },
        }
      }
      case 'lab/input':
        return { ...state, lab: { ...state.lab, sandboxInputs: Number(action.bits) || 0 } }
      case 'lab/save': {
        if (!state.lab.result) return state
        const library = state.lab.library || []
        if (library.length >= 24) return pushToast(state, 'toast.libraryFull', {}, 'warn')
        const entry = {
          id: `c${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`,
          name: `${state.lab.nIn} in · ${state.lab.result.gateCount} gates`,
          nIn: state.lab.nIn,
          gateCount: state.lab.result.gateCount,
          hex: state.lab.result.hex,
          netlist: state.lab.result.netlist,
          at: Date.now(),
        }
        return {
          ...state,
          lab: { ...state.lab, library: [entry, ...library], savedAt: Date.now() },
        }
      }
      case 'lab/remove': {
        const library = (state.lab.library || []).filter((item) => item.id !== action.id)
        return { ...state, lab: { ...state.lab, library } }
      }

      // ---------------------------------------------------------- clock
      case 'clock/tick': {
        let next = { ...state, blocks: state.blocks + 1 }
        if (next.paused) return next
        if (next.chapter === 4) next = latchTick(next)
        if (next.chapter === 6) next = programTick(next)
        if (next.chapter === 8) next = counterAdvance(next)
        if (next.chapter === 9 && next.play.running) next = cpuStepOnce({ ...next, play: { ...next.play, manual: false } })
        return next
      }
      default:
        return state
    }
  }

  // ------------------------------------------------------------------ selectors

  function nextHint(state) {
    const index = state.chapter
    const play = state.play
    if (state.completed && state.completed[index]) return { key: 'hint.chapterDone', params: {} }
    if (index === 0) {
      if (state.challenge && state.challenge.active && Array.isArray(play.mintOrder)) {
        const order = play.mintOrder.map((chip) => chip + 1).join(' → ')
        return { key: 'hint.mintOrder', params: { order, next: (play.mintOrder[play.mintCursor || 0] || 0) + 1 } }
      }
      return { key: 'hint.mint', params: { n: 8 - play.minted.length } }
    }
    if (index === 1) {
      if (!play.placed) return { key: 'hint.nandPlace', params: {} }
      if (!play.wiring['g:0:a'] || !play.wiring['g:0:b']) {
        const wire = nextAssistWire(state)
        return wire ? { key: 'hint.nextWire', params: describeWire(wire) } : { key: 'hint.nandWire', params: {} }
      }
      return { key: 'hint.nandToggle', params: { n: countBits(play.visited) } }
    }
    if (index === 2) {
      if (play.gates < 5) return { key: 'hint.halfPlace', params: { n: 5 - play.gates } }
      const wire = nextAssistWire(state)
      if (wire) return { key: 'hint.nextWire', params: describeWire(wire) }
      if (play.verify.status === 'fail') return { key: 'hint.halfFail', params: {} }
      return { key: 'hint.halfDone', params: {} }
    }
    if (index === 3) {
      if (play.phase === 'idle') return { key: 'hint.tapeoutStart', params: {} }
      if (play.phase === 'running') return { key: 'hint.tapeoutRunning', params: {} }
      return { key: 'hint.tapeoutDone', params: {} }
    }
    if (index === 4) {
      const q = play.stateBits & 1
      const qn = (play.stateBits >> 1) & 1
      if (q === qn) return { key: 'hint.latchForbidden', params: {} }
      if (!play.transientSeen) return { key: 'hint.latchSet', params: {} }
      if (play.stableQ < 3) return { key: 'hint.latchHold', params: { n: 3 - play.stableQ } }
      return { key: 'hint.latchReset', params: {} }
    }
    if (index === 5) {
      if (play.boxes.length < 3) return { key: 'hint.legoPlace', params: { n: 3 - play.boxes.length } }
      const wire = nextAssistWire(state)
      if (wire) return { key: 'hint.nextWire', params: describeWire(wire) }
      if (!play.taped) return { key: 'hint.legoTapeout', params: {} }
      return { key: 'hint.legoDone', params: {} }
    }
    if (index === 6) {
      if (!play.running && !play.showResult) return { key: 'hint.cpuRun', params: {} }
      if (play.running) return { key: 'hint.cpuRunning', params: {} }
      return { key: 'hint.cpuDone', params: {} }
    }
    if (index === 7) {
      if (!play.synthesized) return { key: 'hint.segSynth', params: {} }
      if (!(play.verify && play.verify.status === 'pass')) return { key: 'hint.segVerify', params: {} }
      if (!play.taped) return { key: 'hint.segTapeout', params: {} }
      return { key: 'hint.segDigits', params: { n: countBits(play.visitedMask || 0) } }
    }
    if (index === 8) {
      if (!play.reached15) return { key: 'hint.counterBeats', params: { n: play.beats || 0 } }
      if (!play.wrapped) return { key: 'hint.counterWrap', params: {} }
      return { key: 'hint.counterDone', params: {} }
    }
    if (index === 9) {
      if (!play.state) return { key: 'hint.cpuStep', params: {} }
      if (play.running) return { key: 'hint.cpuRunning', params: {} }
      return { key: 'hint.cpuRun', params: {} }
    }
    if (!play.verify || play.verify.status !== 'pass') return { key: 'hint.safetyAudit', params: {} }
    if ((play.seenMask || 0) !== 15) return { key: 'hint.safetyModes', params: { n: countBits(play.seenMask || 0) } }
    if (!play.taped) return { key: 'hint.safetyTapeout', params: {} }
    return { key: 'hint.safetyDone', params: {} }
  }

  function describeWire(wire) {
    const sink = wireSinkLabel(wire.to)
    const source = wireSourceLabel(wire.from)
    return { sinkKey: sink.key, sinkParams: sink.params, sourceKey: source.key, sourceParams: source.params }
  }

  function stats(state) {
    let gatesBurned = 0
    for (const circuit of state.circuits) gatesBurned += circuit.gateCount
    return {
      chapters: completedCount(state),
      minted: state.mintedTotal,
      circuits: state.circuits.length,
      gatesBurned,
      blocks: state.blocks,
    }
  }

  function chapterMeta(index) {
    return {
      index,
      id: CHAPTERS[index],
      titleKey: `chapter.${index}.title`,
      subtitleKey: `chapter.${index}.subtitle`,
      tagKey: `chapter.${index}.tag`,
      introKey: `chapter.${index}.intro`,
      factKey: `chapter.${index}.fact`,
    }
  }

  function status(state) {
    const meta = chapterMeta(state.chapter)
    return {
      ...meta,
      goals: chapterGoals(state),
      done: isChapterDone(state, state.chapter),
      completed: Boolean(state.completed[state.chapter]),
    }
  }

  /** Contextual dock actions; the UI dispatches each item's `action`. */
  function dock(state) {
    const index = state.chapter
    const play = state.play
    const done = isChapterDone(state, index)
    const items = []
    const add = (id, key, action, kind, extra) => items.push({ id, key, action, kind: kind || 'ghost', ...extra })
    if (index === 0) {
      add('mintAll', 'dock.mintAll', { type: 'mint/all' }, 'secondary', { disabled: play.minted.length >= TT.layout.mint.chips.length })
    }
    if (index === 1) {
      add('placeGate', 'dock.placeGate', { type: 'gate/place' }, 'primary', { disabled: play.placed })
      add('toggleA', play.inputs[0] ? 'dock.inputOff' : 'dock.inputOn', { type: 'nand/toggle', index: 0 }, 'secondary', { params: { p: 'A' } })
      add('toggleB', play.inputs[1] ? 'dock.inputOff' : 'dock.inputOn', { type: 'nand/toggle', index: 1 }, 'secondary', { params: { p: 'B' } })
      add('assist', 'dock.assist', { type: 'wire/assist' }, 'ghost')
    }
    if (index === 2) {
      add('placeGate', 'dock.placeGateN', { type: 'gate/place' }, 'primary', {
        disabled: play.gates >= 5,
        params: { left: Math.max(0, 5 - play.gates) },
      })
      add('assist', 'dock.assist', { type: 'wire/assist' }, 'secondary')
      add('clear', 'dock.clearWires', { type: 'wire/clear' }, 'ghost', { disabled: Object.keys(play.wiring || {}).length === 0 })
    }
    if (index === 3) {
      add('tapeout', 'dock.tapeout', { type: 'tapeout/start' }, 'primary', { disabled: play.phase !== 'idle' })
      add('eval', 'dock.freeEval', { type: 'eval/run' }, 'secondary', { disabled: play.phase !== 'done' })
    }
    if (index === 4) {
      add('set', play.S ? 'dock.setLow' : 'dock.setHigh', { type: 'latch/toggle', kind: 'set' }, play.S ? 'primary' : 'active', {
        params: { level: play.S },
      })
      add('reset', play.R ? 'dock.resetLow' : 'dock.resetHigh', { type: 'latch/toggle', kind: 'reset' }, play.R ? 'secondary' : 'active', {
        params: { level: play.R },
      })
    }
    if (index === 5) {
      add('placeBox', 'dock.placeBox', { type: 'box/place' }, 'primary', {
        disabled: play.boxes.length >= 3,
        params: { left: Math.max(0, 3 - play.boxes.length) },
      })
      add('assist', 'dock.assist', { type: 'wire/assist' }, 'secondary')
      add('tapeout', 'dock.tapeoutLego', { type: 'lego/tapeout' }, 'primary', {
        disabled: play.taped || play.verify.status !== 'pass',
      })
      add('clear', 'dock.clearWires', { type: 'wire/clear' }, 'ghost', { disabled: Object.keys(play.wiring || {}).length === 0 })
    }
    if (index === 6) {
      add('run', 'dock.runProgram', { type: 'program/run' }, 'primary', { disabled: play.running, params: { a: play.operands[0], b: play.operands[1] } })
      add('again', 'dock.again', { type: 'program/again' }, 'secondary', { disabled: play.running })
    }
    if (index === 7) {
      add('synth', 'dock.segSynth', { type: 'seg/synth' }, 'primary', { disabled: Boolean(play.synthesized) })
      add('verify', 'dock.segVerify', { type: 'seg/verify' }, 'secondary', { disabled: !play.synthesized })
      add('tapeout', 'dock.segTapeout', { type: 'seg/tapeout' }, 'primary', {
        disabled: Boolean(play.taped) || !(play.verify && play.verify.status === 'pass'),
      })
    }
    if (index === 8) {
      add('step', 'dock.counterStep', { type: 'counter/step' }, 'primary')
      add('reset', 'dock.counterReset', { type: 'chapter/reset' }, 'ghost')
    }
    if (index === 9) {
      ;[{ id: 'add35', key: 'dock.cpuAdd35' }, { id: 'sum15', key: 'dock.cpuSum15' }, { id: 'mul12', key: 'dock.cpuMul12' }].forEach(
        (program, order) => {
          add(`program-${program.id}`, program.key, { type: 'cpu/select', index: order }, play.programId === program.id ? 'active' : 'secondary')
        },
      )
      add('run', 'dock.cpuRun', { type: 'cpu/run' }, 'primary', { disabled: Boolean(play.running) })
      add('step', 'dock.cpuStep', { type: 'cpu/step' }, 'secondary')
      add('reset', 'dock.cpuReset', { type: 'cpu/reset' }, 'ghost')
    }
    if (index === 10) {
      ;[
        { kind: 'allow', key: 'dock.safetyAllow' },
        { kind: 'slow', key: 'dock.safetySlow' },
        { kind: 'home', key: 'dock.safetyHome' },
        { kind: 'stop', key: 'dock.safetyStop' },
      ].forEach((preset) => add(`preset-${preset.kind}`, preset.key, { type: 'safety/preset', kind: preset.kind }, 'secondary'))
      add('audit', 'dock.safetyAudit', { type: 'safety/audit' }, 'primary', { disabled: Boolean(play.verify && play.verify.status === 'pass') })
      add('tapeout', 'dock.safetyTapeout', { type: 'safety/tapeout' }, 'primary', {
        disabled: Boolean(play.taped) || !(play.verify && play.verify.status === 'pass'),
      })
    }
    if (done && index < CHAPTERS.length - 1) {
      add('next', 'dock.nextChapter', { type: 'chapter/next' }, 'primary')
    }
    return items
  }

  const CHALLENGE_IGNORE = /^(challenge\/|toast|hint|sound|pause|speed|codex|intro|welcome|cinema|chapter\/select|chapter\/next|lab\/|arcade\/|achv\/|daily\/|snake\/|music\/|pixel\/|lock\/|guess\/|vote\/|debug\/)/

  // Wraps the pure reducer to count challenge actions and failed verifications.
  function reduce(state, action) {
    const previous = state
    const next = reduceInner(state, action)
    if (!next || typeof next !== 'object') return next
    const active = next.challenge && next.challenge.active
    if (!active || !action || !action.type || CHALLENGE_IGNORE.test(action.type)) return next
    let mistakes = next.challenge.mistakes || 0
    if (previous.play && next.play && previous.play.verify && next.play.verify) {
      const before = previous.play.verify.status
      const after = next.play.verify.status
      if (before !== 'fail' && after === 'fail') mistakes += 1
    }
    return {
      ...next,
      challenge: { ...next.challenge, actions: (next.challenge.actions || 0) + 1, mistakes },
    }
  }

  return {
    challengeConfig,
    chapterMeta,
    chapterGoals,
    completedCount,
    allDone,
    stats,
    dock,
    status,
    initial,
    reduce,
    canConnect,
    isSink,
    isSource,
    isOutputSink,
    nextHint,
    describeWire,
    describePort,
    playerNetlist,
    selectChapter,
    CH,
  }
})()
