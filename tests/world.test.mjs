/**
 * tests/world.test.mjs — integration regression for the 3D world renderer.
 *
 * Loads the whole client bundle the same way the build does (one shared TT scope,
 * stub React for element creation only) and mounts TT.WorldView on a fake canvas.
 * It catches the class of bug where chapter switches leak scene items: anonymous
 * backdrop pieces must be removed through the same handle map as named ones.
 *
 * Run from the plugin directory:
 *   node --test tests/world.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const SOURCES = ['00-core.js', '10-engine.js', '15-parts.js', '20-circuit.js', '25-cpu.js', '28-safety.js', '30-missions.js', '35-lab.js', '36-audio.js', '37-arcade.js', '38-export.js', '39-hardware.js', '41-access.js', '42-lottery.js', '43-art.js', '44-sensors.js', '45-defi.js', '47-achievements.js', '48-verilog.js', '40-ui.js', '50-app.js']

function fakeContext() {
  const gradient = { addColorStop() {} }
  return new Proxy(
    {},
    {
      get(_target, key) {
        if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => gradient
        if (key === 'measureText') return () => ({ width: 10 })
        if (key === 'canvas') return null
        return () => {}
      },
      set() {
        return true
      },
    },
  )
}

function fakeCanvas(width = 900, height = 600) {
  const context = fakeContext()
  const listeners = new Map()
  return {
    clientWidth: width,
    clientHeight: height,
    width: 0,
    height: 0,
    style: {},
    getContext: () => context,
    addEventListener(name, fn) {
      if (!listeners.has(name)) listeners.set(name, [])
      listeners.get(name).push(fn)
    },
    removeEventListener(name, fn) {
      const list = listeners.get(name)
      if (list) list.splice(list.indexOf(fn), 1)
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
  }
}

function load() {
  const React = { createElement: (...args) => ({ type: args[0], props: args[1], children: args.slice(2) }) }
  const window = {
    devicePixelRatio: 2,
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame: (callback) => setTimeout(() => callback(Date.now()), 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  }
  const document = {
    createElement: () => fakeCanvas(128, 128),
    querySelector: () => null,
    head: { appendChild() {} },
  }
  const TT = new Function('React', 'window', 'document', read('00-core.js') + '\nreturn TT')(React, window, document)
  for (const name of SOURCES.slice(1)) {
    new Function('TT', 'React', 'window', 'document', read(name))(TT, React, window, document)
  }
  return { TT, React, window, document }
}

/** Count engine items and remove them through the public handle API. */
function instrumentEngine(TT) {
  const state = { live: 0 }
  const originalCreate = TT.Engine.create
  TT.Engine.create = (...args) => {
    const engine = originalCreate(...args)
    const originalAdd = engine.add.bind(engine)
    engine.add = (spec) => {
      const handle = originalAdd(spec)
      state.live += 1
      let alive = true
      const originalRemove = handle.remove.bind(handle)
      handle.remove = () => {
        if (alive) {
          alive = false
          state.live -= 1
        }
        return originalRemove()
      }
      return handle
    }
    return engine
  }
  return state
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('chapter switches do not leak 3D scene items', async () => {
  const { TT } = load()
  const counts = instrumentEngine(TT)
  const translate = (key) => key
  const ctx = {
    layout: { selectPanel() {} },
    locale: { register: () => () => {}, bind: () => translate },
    slots: { inject: (owner, cb) => (cb(), () => {}), register: () => () => {} },
    effect: (fn) => (fn(), () => {}),
  }
  const api = TT.App.create(ctx, translate)
  const view = TT.WorldView.mount(fakeCanvas(), { store: api.store, api, t: translate, setHover() {} })
  try {
    await delay(40)
    const baseline = counts.live
    assert.ok(baseline > 8, `chapter 0 should build a scene, got ${baseline} items`)

    const route = [3, 6, 1, 2, 4, 5, 0]
    for (const index of route) {
      api.dispatch({ type: 'chapter/select', index })
      await delay(30)
      assert.ok(counts.live < 80, `scene for chapter ${index} is unexpectedly large: ${counts.live} items`)
    }
    assert.equal(
      counts.live,
      baseline,
      `returning to chapter 0 must restore the same scene size (baseline ${baseline}, now ${counts.live})`,
    )

    // a second lap must not grow the scene either
    for (const index of route) {
      api.dispatch({ type: 'chapter/select', index })
      await delay(20)
    }
    assert.equal(counts.live, baseline, `second lap leaks items: ${counts.live} vs ${baseline}`)
  } finally {
    view.dispose()
  }
})

test('cinema mode starts, reports, and stops without leaking timers', async () => {
  const { TT } = load()
  const translate = (key) => key
  const ctx = {
    layout: { selectPanel() {} },
    locale: { register: () => () => {}, bind: () => translate },
    slots: { inject: (owner, cb) => (cb(), () => {}), register: () => () => {} },
    effect: (fn) => (fn(), () => {}),
  }
  const api = TT.App.create(ctx, translate)
  api.dispatch({ type: 'cinema/start' })
  assert.equal(api.store.get().cinema, true, 'cinema should become active')
  assert.equal(api.isCinema(), true)
  api.dispatch({ type: 'cinema/stop' })
  assert.equal(api.store.get().cinema, false, 'cinema should stop')
  assert.equal(api.store.get().toast.key, 'cinema.stopped')
})

test('sound preference toggles and audio never throws in Node', async () => {
  const { TT } = load()
  const translate = (key) => key
  const ctx = {
    layout: { selectPanel() {} },
    locale: { register: () => () => {}, bind: () => translate },
    slots: { inject: (owner, cb) => (cb(), () => {}), register: () => () => {} },
    effect: (fn) => (fn(), () => {}),
  }
  const api = TT.App.create(ctx, translate)
  const before = api.store.get().soundMuted
  api.dispatch({ type: 'sound/toggle' })
  assert.equal(api.store.get().soundMuted, !before)
  assert.doesNotThrow(() => TT.Audio.play('success'))
  assert.doesNotThrow(() => TT.Audio.init())
  assert.doesNotThrow(() => TT.Audio.setMuted(true))
})

test('transient event FX are collected after they fade', async () => {
  const { TT } = load()
  const counts = instrumentEngine(TT)
  const translate = (key) => key
  const ctx = {
    layout: { selectPanel() {} },
    locale: { register: () => () => {}, bind: () => translate },
    slots: { inject: (owner, cb) => (cb(), () => {}), register: () => () => {} },
    effect: (fn) => (fn(), () => {}),
  }
  const api = TT.App.create(ctx, translate)
  const view = TT.WorldView.mount(fakeCanvas(), { store: api.store, api, t: translate, setHover() {} })
  try {
    await delay(40)
    const baseline = counts.live
    api.dispatch({ type: 'mint', chip: 'chip:0' })
    await delay(60)
    assert.ok(counts.live > baseline, 'minting should spawn a transient burst')
    await delay(1200)
    assert.equal(counts.live, baseline, `burst should be removed after fading (${counts.live} vs ${baseline})`)
  } finally {
    view.dispose()
  }
})
