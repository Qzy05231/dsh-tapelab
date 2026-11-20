/**
 * 00-core — shared namespace, helpers, palette and TapeOut protocol constants.
 *
 * Everything is concatenated inside one factory closure (see scripts/build.mjs), so
 * every module assigns onto the single `TT` object declared here. Keep top-level code
 * free of DOM access: the pure modules are unit-tested in Node.
 */

const TT = {}

/** React.createElement with the small conveniences the UI files use. */
TT.h = function h(type, props, ...children) {
  const flat = []
  const push = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) push(item)
    } else if (value !== undefined && value !== null && value !== false && value !== true) {
      flat.push(value)
    }
  }
  for (const child of children) push(child)
  return flat.length ? React.createElement(type, props, flat) : React.createElement(type, props)
}

TT.util = {
  clamp(value, min, max) {
    return value < min ? min : value > max ? max : value
  },
  lerp(a, b, t) {
    return a + (b - a) * t
  },
  /** Smooth 0..1 ramp, used for camera moves and reveal animations. */
  ease(t) {
    const x = TT.util.clamp(t, 0, 1)
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
  },
  easeOut(t) {
    const x = TT.util.clamp(t, 0, 1)
    return 1 - Math.pow(1 - x, 3)
  },
  pulse(timeMs, periodMs, phase) {
    return 0.5 + 0.5 * Math.sin(((timeMs + (phase || 0) * periodMs) / periodMs) * Math.PI * 2)
  },
  /** 0b1010 -> '1010' with `width` characters (MSB first); left-pads with zeros. */
  formatBits(value, width) {
    let out = ''
    for (let i = width - 1; i >= 0; i -= 1) out += (value >> i) & 1 ? '1' : '0'
    return out
  },
  /** 7-byte gate record: 00 | A(3 bytes) | B(3 bytes), as shown by the protocol. */
  gateRecord(a, b) {
    const hex = (n) => (n & 0xffffff).toString(16).padStart(6, '0')
    return `00${hex(a)}${hex(b)}`
  },
  /** Node id as 3-byte hex, e.g. 10 -> '00000a'. */
  hex3(node) {
    return (node & 0xffffff).toString(16).padStart(6, '0')
  },
  int(value) {
    return Math.round(value).toLocaleString('en-US')
  },
  shortHash(hex) {
    const clean = String(hex || '').replace(/^0x/, '')
    return `0x${clean.slice(0, 6)}…${clean.slice(-6)}`
  },
  /** Frame-rate independent damping factor. */
  damp(dtMs, halfLifeMs) {
    return 1 - Math.pow(0.5, dtMs / Math.max(1, halfLifeMs))
  },
  distance2(a, b) {
    const dx = a[0] - b[0]
    const dz = a[2] - b[2]
    return Math.sqrt(dx * dx + dz * dz)
  },
  random(seed) {
    let state = (seed || 1) >>> 0
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0
      return state / 0x100000000
    }
  },
}

/**
 * Palette: holographic silicon. Artwork may use its own colors (host tokens are for the
 * chrome only), so these are deliberately independent of the light/dark theme.
 */
TT.palette = Object.freeze({
  void0: '#03060c',
  void1: '#071120',
  space: '#0a1a2e',
  die: '#0d2237',
  dieEdge: '#163a56',
  grid: '#14405c',
  gridHot: '#1d6b8e',
  cyan: '#56e1ff',
  cyanDim: '#2a8fb0',
  mint: '#2be6c2',
  green: '#5dffa8',
  amber: '#ffc35c',
  orange: '#ff9a4d',
  magenta: '#ff6ad5',
  red: '#ff5d6c',
  blue: '#6ea8ff',
  ink: '#e8f6ff',
  dim: '#8fb3c8',
  faint: '#4d738a',
  wafer: '#0b1826',
  gold: '#ffd479',
  wire: '#39d7ff',
  wireHot: '#b8f6ff',
  gate: '#123249',
  gateEdge: '#2a7ea8',
  nand: '#7ce9ff',
  nft: '#ffd479',
  latch: '#c98bff',
  segment: '#ff9a4d',
  rover: '#8fe8ff',
})

/** Protocol facts quoted by the game. Keep them here so copy and logic agree. */
TT.protocol = Object.freeze({
  BLOCK_SECONDS: 0.45,
  CLOCK_HZ: 1 / 0.45,
  GATE_BYTES: 7,
  NAND_INPUTS: 2,
  EXAMPLES: [
    { gates: 5, key: 'halfAdder' },
    { gates: 9, key: 'fullAdder' },
    { gates: 36, key: 'fourBitAdder' },
    { gates: 100, key: 'sevenSegment' },
  ],
  BEHEMOTH: {
    name: 'Behemoth',
    nameZh: '巨兽',
    year: 1971,
    reference: 'Intel 4004',
    transistors: 2300,
    bits: 4,
    hz: 2.222,
  },
  CHAPTERS: [
    'mint',
    'nand',
    'halfadder',
    'tapeout',
    'latch',
    'lego',
    'behemoth',
    'sevenseg',
    'counter',
    'cpu',
    'safety',
    'deweb',
    'relay',
    'container',
  ],
})

/** Tiny pub/sub store used by the React panel and the canvas world. */
TT.createStore = function createStore(initial) {
  let state = initial
  const listeners = new Set()
  return {
    get() {
      return state
    },
    set(next) {
      state = next
      for (const listener of listeners) listener(state)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
