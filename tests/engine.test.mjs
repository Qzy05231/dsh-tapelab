/**
 * engine.test.mjs — Node tests for the software 3D engine (10-engine.js).
 *
 * The engine is a plain script (not a module): it is loaded exactly the way the
 * plugin build loads it — inside a function scope with `TT`, `window` and
 * `document` provided — so any top-level DOM access would fail here.
 *
 * Run from the plugin directory:
 *   node --test tests/engine.test.mjs
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SOURCE = readFileSync(join(HERE, '..', 'src', 'client', '10-engine.js'), 'utf8')

function loadEngine() {
  const TT = {}
  // Mirrors the contract test harness: window/document are undefined here, so
  // the file must not touch them before create() is called with a canvas.
  new Function('TT', 'window', 'document', SOURCE)(TT, undefined, undefined)
  return TT
}

const TT = loadEngine()
const E = TT.Engine
const M = E.math

function close(actual, expected, tolerance = 1e-6, message = '') {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message} expected ${expected} ± ${tolerance}, got ${actual}`,
  )
}

function normalize(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

// ---------------------------------------------------------------------------
// fake 2D context / canvas (no DOM needed)
// ---------------------------------------------------------------------------

function fakeContext() {
  const gradient = { addColorStop() {} }
  return {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    textBaseline: 'alphabetic',
    textAlign: 'start',
    font: '10px sans-serif',
    setTransform() {},
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    ellipse() {},
    rect() {},
    quadraticCurveTo() {},
    bezierCurveTo() {},
    fill() {},
    stroke() {},
    clip() {},
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    translate() {},
    rotate() {},
    scale() {},
    drawImage() {},
    setLineDash() {},
    fillText() {},
    strokeText() {},
    createLinearGradient() { return gradient },
    createRadialGradient() { return gradient },
    measureText() { return { width: 10 } },
  }
}

function fakeCanvas(width = 900, height = 600) {
  const listeners = new Map()
  const ctx = fakeContext()
  const canvas = {
    clientWidth: width,
    clientHeight: height,
    width: 0,
    height: 0,
    style: {},
    context: ctx,
    getContext() { return ctx },
    addEventListener(name, fn) {
      if (!listeners.has(name)) listeners.set(name, [])
      listeners.get(name).push(fn)
    },
    removeEventListener(name, fn) {
      const list = listeners.get(name)
      if (!list) return
      const index = list.indexOf(fn)
      if (index >= 0) list.splice(index, 1)
    },
    getBoundingClientRect() { return { left: 0, top: 0, width, height } },
    dispatch(name, event) {
      const list = listeners.get(name) || []
      for (const fn of list) fn(event)
    },
    listenerCount() {
      let count = 0
      for (const list of listeners.values()) count += list.length
      return count
    },
  }
  return canvas
}

function pointerEvent(x, y, extra) {
  return Object.assign(
    {
      clientX: x,
      clientY: y,
      pointerId: 1,
      button: 0,
      cancelable: true,
      preventDefault() {},
    },
    extra || {},
  )
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// namespace / hygiene
// ---------------------------------------------------------------------------

test('exposes TT.Engine.create and pure TT.Engine.math', () => {
  assert.equal(typeof E, 'object')
  assert.equal(typeof E.create, 'function')
  for (const name of ['eye', 'project', 'screenToPlane', 'defaultCamera', 'pickRadiusFor']) {
    assert.equal(typeof M[name], 'function', `math.${name}`)
  }
})

test('source has no ES module syntax, DOM access at top level, or debug noise', () => {
  assert.ok(!/^\s*import\b/m.test(SOURCE), 'no import statements')
  assert.ok(!/^\s*export\b/m.test(SOURCE), 'no export statements')
  assert.ok(!/\.shadowBlur\s*=/.test(SOURCE), 'no shadowBlur in the draw path')
  assert.ok(!/console\.(log|debug|info|warn)/.test(SOURCE), 'no console noise')
  // Loading it with undefined window/document above already proved there is no
  // top-level DOM access; assert that create() is the only browser entry point.
  assert.equal(typeof E.create, 'function')
})

// ---------------------------------------------------------------------------
// math contract
// ---------------------------------------------------------------------------

test('defaultCamera is sane and returns fresh objects', () => {
  const cam = M.defaultCamera()
  assert.equal(cam.yaw, 32)
  assert.equal(cam.pitch, 26)
  assert.equal(cam.dist, 18)
  assert.deepEqual(cam.target, [0, 1.2, 0])
  assert.ok(cam.pitch >= 4 && cam.pitch <= 82, 'pitch in range')
  assert.ok(cam.dist >= 8 && cam.dist <= 40, 'dist in range')
  cam.target[0] = 99
  assert.equal(M.defaultCamera().target[0], 0, 'no shared mutable state')
})

test('eye() sits at camera distance and pitch elevation', () => {
  const cam = { yaw: 0, pitch: 4, dist: 18, target: [0, 1.2, 0] }
  const e0 = M.eye(cam)
  const pitch = (4 * Math.PI) / 180
  close(e0[2], 18 * Math.cos(pitch), 1e-9, 'yaw 0 puts the eye on +Z:')
  close(e0[0], 0, 1e-9)
  close(e0[1], 1.2 + 18 * Math.sin(pitch), 1e-9, 'eye elevation:')
  // below the clamp the camera still sits at PITCH_MIN (4 degrees)
  const clamped = M.eye({ yaw: 0, pitch: 0, dist: 18, target: [0, 1.2, 0] })
  close(clamped[1], e0[1], 1e-9, 'pitch clamp:')

  const tilted = { yaw: 32, pitch: 26, dist: 18, target: [0, 1.2, 0] }
  const e = M.eye(tilted)
  const dx = e[0] - tilted.target[0]
  const dy = e[1] - tilted.target[1]
  const dz = e[2] - tilted.target[2]
  close(Math.sqrt(dx * dx + dy * dy + dz * dz), tilted.dist, 1e-9, 'eye distance:')
  close(dy, tilted.dist * Math.sin((tilted.pitch * Math.PI) / 180), 1e-9, 'eye elevation:')
})

test('projection maps the camera target to the viewport centre', () => {
  const cam = M.defaultCamera()
  const viewport = { w: 900, h: 600 }
  const p = M.project(cam, viewport, cam.target)
  close(p.x, 450, 1e-6, 'centre x:')
  close(p.y, 300, 1e-6, 'centre y:')
  close(p.depth, cam.dist, 1e-9, 'target depth:')
  assert.equal(p.visible, true)
  // an offset point must land off-centre
  const q = M.project(cam, viewport, [cam.target[0] + 2, cam.target[1], cam.target[2]])
  assert.ok(q.x > 450, 'point right of target projects right of centre')
})

test('nearer points project larger and further off centre', () => {
  const cam = M.defaultCamera()
  const viewport = { w: 900, h: 600 }
  const eye = M.eye(cam)
  const away = normalize([
    cam.target[0] - eye[0],
    cam.target[1] - eye[1],
    cam.target[2] - eye[2],
  ])
  const nearPoint = [
    cam.target[0] - away[0] * 4,
    cam.target[1] - away[1] * 4,
    cam.target[2] - away[2] * 4,
  ]
  const farPoint = [
    cam.target[0] + away[0] * 4,
    cam.target[1] + away[1] * 4,
    cam.target[2] + away[2] * 4,
  ]
  const near = M.project(cam, viewport, nearPoint)
  const far = M.project(cam, viewport, farPoint)
  assert.equal(near.visible, true)
  assert.equal(far.visible, true)
  assert.ok(near.scale > far.scale, `near scale ${near.scale} > far scale ${far.scale}`)
  assert.ok(near.depth < far.depth, 'near point has smaller depth')
  close(near.depth, cam.dist - 4, 1e-6, 'near depth:')
  close(far.depth, cam.dist + 4, 1e-6, 'far depth:')

  const nearOffset = M.project(cam, viewport, [nearPoint[0] + 1.5, nearPoint[1], nearPoint[2]])
  const farOffset = M.project(cam, viewport, [farPoint[0] + 1.5, farPoint[1], farPoint[2]])
  assert.ok(
    Math.abs(nearOffset.x - 450) > Math.abs(farOffset.x - 450),
    'same world offset projects larger when nearer',
  )
})

test('math.project matches engine.project', () => {
  const engine = E.create(fakeCanvas())
  const cam = engine.getCamera()
  const viewport = { w: 900, h: 600 }
  for (const point of [[0, 0, 0], [2, 1.5, -3], [-4, 0.5, 2]]) {
    const a = M.project(cam, viewport, point)
    const b = engine.project(point)
    close(a.x, b.x, 1e-9, 'x:')
    close(a.y, b.y, 1e-9, 'y:')
    close(a.scale, b.scale, 1e-9, 'scale:')
    close(a.depth, b.depth, 1e-9, 'depth:')
    assert.equal(a.visible, b.visible)
  }
  engine.dispose()
})

test('screenToPlane is the inverse of projection on a ground plane', () => {
  const cam = M.defaultCamera()
  const viewport = { w: 900, h: 600 }
  const points = [[3, 0, -2], [-4, 0, 5], [0, 0, 0], [6.5, 0, 3.25]]
  for (const point of points) {
    const p = M.project(cam, viewport, point)
    assert.equal(p.visible, true)
    const back = M.screenToPlane(cam, viewport, p.x, p.y, 0)
    assert.ok(back, 'ray hits the ground plane')
    close(back[0], point[0], 1e-6, 'roundtrip x:')
    close(back[1], 0, 1e-9)
    close(back[2], point[2], 1e-6, 'roundtrip z:')
  }
  // arbitrary plane height
  const elevated = [1.5, 2, -1]
  const ep = M.project(cam, viewport, elevated)
  const eback = M.screenToPlane(cam, viewport, ep.x, ep.y, 2)
  assert.ok(eback)
  close(eback[0], elevated[0], 1e-6)
  close(eback[2], elevated[2], 1e-6)
})

test('screenToPlane returns null when the ray misses the plane', () => {
  const cam = M.defaultCamera()
  const viewport = { w: 900, h: 600 }
  // Camera is above y=0 and looks down; a plane above the eye is behind the ray.
  assert.equal(M.screenToPlane(cam, viewport, 450, 300, 100), null)
  // Looking up instead: a camera below the plane looking down misses upward planes.
  const below = { yaw: 0, pitch: 4, dist: 20, target: [0, 0, 0] }
  assert.equal(M.screenToPlane(below, viewport, 450, 300, 50), null)
})

test('camera is Y-up / X-right and cube face culling keeps the camera-facing half', () => {
  const canvas = fakeCanvas()
  const engine = E.create(canvas)
  const centre = engine.project([0, 1.5, 0])
  const right = engine.project([1, 1.5, 0])
  const up = engine.project([0, 2.5, 0])
  assert.ok(right.x > centre.x, 'world +X projects to the right')
  assert.ok(up.y < centre.y, 'world +Y projects up (smaller screen y)')

  // Record filled polygons to inspect the cube's visible faces.
  const ctx = canvas.context
  const path = []
  const fills = []
  ctx.beginPath = () => { path.length = 0 }
  ctx.moveTo = (x, y) => { path.push([x, y]) }
  ctx.lineTo = (x, y) => { path.push([x, y]) }
  ctx.closePath = () => {}
  ctx.fill = () => { fills.push({ points: path.map((p) => p.slice()), style: ctx.fillStyle }) }
  engine.add({ kind: 'cube', pos: [0, 0.5, 0], size: [1, 1, 1], color: '#2be6c2' })
  engine.renderOnce()

  assert.equal(fills.length, 3, 'a unit cube seen from above shows top + 2 sides')
  const centroids = fills.map((fill) => {
    let sx = 0
    let sy = 0
    for (const point of fill.points) {
      sx += point[0]
      sy += point[1]
    }
    return [sx / fill.points.length, sy / fill.points.length]
  })
  const topIndex = centroids.reduce((best, c, i) => (c[1] < centroids[best][1] ? i : best), 0)
  const others = centroids.filter((c, i) => i !== topIndex)
  assert.ok(centroids[topIndex][1] + 10 < others[0][1], 'top face is above the sides')
  // +X and +Z side faces are both visible: one centroid right of centre, one left.
  assert.ok(others.some((c) => c[0] > centre.x), 'the +X face is visible')
  assert.ok(others.some((c) => c[0] < centre.x), 'the +Z-facing side is visible')

  // luminance: the top face is the brightest (light comes from above)
  const luminance = (style) => {
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(style || '')
    return m ? Number(m[1]) + Number(m[2]) + Number(m[3]) : -1
  }
  const topLum = luminance(fills[topIndex].style)
  for (let i = 0; i < fills.length; i += 1) {
    if (i === topIndex) continue
    assert.ok(topLum > luminance(fills[i].style), 'top face shade is brightest')
  }
  engine.dispose()
})

test('pickRadiusFor scales with distance and respects sprite pickRadius', () => {
  const cube = { kind: 'cube', size: [1, 1, 1] }
  const near = M.pickRadiusFor(cube, { scale: 100 })
  const far = M.pickRadiusFor(cube, { scale: 20 })
  assert.ok(near > far, `near pick radius ${near} > far ${far}`)
  assert.ok(far >= 8, 'minimum pixel radius')

  const sprite = { kind: 'sprite', size: 1, pickRadius: 2 }
  assert.ok(
    M.pickRadiusFor(sprite, { scale: 40 }) > M.pickRadiusFor(cube, { scale: 40 }),
    'sprite pickRadius wins',
  )
  const plate = { kind: 'plate', size: [4, 4] }
  assert.ok(M.pickRadiusFor(plate, { scale: 40 }) > M.pickRadiusFor(cube, { scale: 40 }))
})

// ---------------------------------------------------------------------------
// engine instance: projection, picking, item lifecycle
// ---------------------------------------------------------------------------

test('resize() applies CSS size * dpr and caps dpr', () => {
  const canvas = fakeCanvas(900, 600)
  const engine = E.create(canvas, { dprMax: 2 })
  assert.equal(canvas.width, 900) // no window in this harness => dpr 1
  assert.equal(canvas.height, 600)
  canvas.clientWidth = 640
  canvas.clientHeight = 480
  engine.resize()
  assert.equal(canvas.width, 640)
  assert.equal(canvas.height, 480)
  const p = engine.project([0, 1.2, 0])
  close(p.x, 320, 1e-6, 'projection follows resize:')
  close(p.y, 240, 1e-6)
  engine.dispose()
})

test('add / set / remove and id-only picking', () => {
  const engine = E.create(fakeCanvas())
  const chip = engine.add({ id: 'chip', kind: 'hex', pos: [0, 1, 0], size: 0.8, data: { nand: 1 } })
  const anonymous = engine.add({ kind: 'cube', pos: [3, 1, 0], size: 1 })
  assert.equal(chip.spec.kind, 'hex')
  assert.equal(chip.pos[0], 0)
  assert.equal(chip.data.nand, 1)

  const center = engine.project([0, 1, 0])
  const pick = engine.pickAt(center.x, center.y)
  assert.ok(pick, 'picked the chip')
  assert.equal(pick.id, 'chip')
  assert.equal(pick.kind, 'hex')
  assert.deepEqual(pick.data, { nand: 1 })
  assert.equal(pick.item, chip)
  assert.equal(pick.point.length, 3)
  assert.ok(Number.isFinite(pick.screen.x) && Number.isFinite(pick.screen.y))

  // items without an id are never pickable
  const anonymousCenter = engine.project([3, 1, 0])
  assert.equal(engine.pickAt(anonymousCenter.x, anonymousCenter.y), null)
  assert.equal(engine.pickAt(5, 5), null)

  // move it, picking follows
  chip.set({ pos: [0, 1, 3] })
  assert.equal(engine.pickAt(center.x, center.y), null)
  const moved = engine.project([0, 1, 3])
  assert.equal(engine.pickAt(moved.x, moved.y).id, 'chip')

  // visibility + opacity gate picking
  chip.set({ visible: false })
  assert.equal(engine.pickAt(moved.x, moved.y), null)
  chip.set({ visible: true, opacity: 0 })
  assert.equal(engine.pickAt(moved.x, moved.y), null)
  chip.set({ opacity: 1 })

  // remove
  chip.remove()
  assert.equal(engine.pickAt(moved.x, moved.y), null)
  assert.equal(anonymous.spec.kind, 'cube')
  engine.clear()
  assert.equal(engine.pickAt(moved.x, moved.y), null)
  engine.dispose()
})

test('wire picking uses the projected polyline', () => {
  const engine = E.create(fakeCanvas())
  engine.add({
    id: 'wire',
    kind: 'wire',
    points: [[-2, 0.6, 0], [0, 0.6, 0], [2, 0.6, 0]],
    width: 0.15,
  })
  const mid = engine.project([0, 0.6, 0])
  const pick = engine.pickAt(mid.x, mid.y)
  assert.ok(pick)
  assert.equal(pick.id, 'wire')
  assert.equal(engine.pickAt(mid.x, mid.y + 600), null)
  engine.dispose()
})

test('camera set/get clamps pitch and distance and applies instantly when stopped', () => {
  const engine = E.create(fakeCanvas())
  engine.setCamera({ yaw: 5, pitch: 200, dist: 500 })
  let cam = engine.getCamera()
  assert.equal(cam.yaw, 5)
  assert.equal(cam.pitch, 82)
  assert.equal(cam.dist, 40)
  engine.setCamera({ target: [1, 0.5, -2] })
  cam = engine.getCamera()
  assert.deepEqual(cam.target, [1, 0.5, -2])
  engine.setCamera({ yaw: 123 }, { animateMs: 300 })
  assert.equal(engine.getCamera().yaw, 123, 'not running => applied immediately')
  engine.focus([2, 1, -2], { animateMs: 0 })
  assert.deepEqual(engine.getCamera().target, [2, 1, -2])
  engine.autoRotate(true, 12)
  assert.equal(engine.isRunning(), false)
  engine.autoRotate(false)
  engine.dispose()
})

test('pointer hover fires only on id change, click uses the 6px slop', () => {
  const canvas = fakeCanvas()
  const engine = E.create(canvas)
  engine.setPickCallback((pick, phase) => {
    calls.push({ id: pick ? pick.id : null, phase })
  })
  const calls = []
  engine.add({ id: 'chip', kind: 'hex', pos: [0, 2, 0], size: 0.9 })
  const at = engine.project([0, 2, 0])

  // hover once
  canvas.dispatch('pointermove', pointerEvent(at.x, at.y))
  assert.deepEqual(calls, [{ id: 'chip', phase: 'hover' }])
  // same id again: no duplicate hover
  canvas.dispatch('pointermove', pointerEvent(at.x + 1, at.y + 1))
  assert.equal(calls.length, 1)

  // click without moving
  canvas.dispatch('pointerdown', pointerEvent(at.x, at.y))
  canvas.dispatch('pointerup', pointerEvent(at.x, at.y))
  assert.deepEqual(calls[1], { id: 'chip', phase: 'click' })

  // 4 px of movement is still a click (below the 6 px slop)
  canvas.dispatch('pointerdown', pointerEvent(at.x, at.y))
  canvas.dispatch('pointermove', pointerEvent(at.x + 4, at.y))
  canvas.dispatch('pointerup', pointerEvent(at.x + 4, at.y))
  assert.equal(calls.filter((c) => c.phase === 'click').length, 2)

  // a real drag suppresses the click
  const clicksBefore = calls.filter((c) => c.phase === 'click').length
  canvas.dispatch('pointerdown', pointerEvent(at.x, at.y))
  canvas.dispatch('pointermove', pointerEvent(at.x + 40, at.y + 20))
  canvas.dispatch('pointerup', pointerEvent(at.x + 40, at.y + 20))
  assert.equal(calls.filter((c) => c.phase === 'click').length, clicksBefore)

  // moving away emits leave once
  canvas.dispatch('pointermove', pointerEvent(5, 5))
  assert.deepEqual(calls[calls.length - 1], { id: null, phase: 'leave' })
  assert.equal(engine.hoveredId(), null)
  engine.dispose()
})

test('hover highlights the item id internally and setPointerEnabled(false) disables input', () => {
  const canvas = fakeCanvas()
  const engine = E.create(canvas)
  const clicks = []
  engine.setPickCallback((pick, phase) => clicks.push(phase))
  engine.add({ id: 'target', kind: 'cube', pos: [0, 1, 0], size: 1 })
  const at = engine.project([0, 1, 0])
  canvas.dispatch('pointermove', pointerEvent(at.x, at.y))
  assert.equal(engine.hoveredId(), 'target')

  engine.setPointerEnabled(false)
  assert.equal(engine.hoveredId(), null)
  canvas.dispatch('pointerdown', pointerEvent(at.x, at.y))
  canvas.dispatch('pointerup', pointerEvent(at.x, at.y))
  assert.equal(clicks.filter((p) => p === 'click').length, 0)
  engine.setPointerEnabled(true)
  const after = engine.project([0, 1, 0])
  canvas.dispatch('pointerdown', pointerEvent(after.x, after.y))
  canvas.dispatch('pointerup', pointerEvent(after.x, after.y))
  assert.equal(clicks.filter((p) => p === 'click').length, 1)
  engine.dispose()
})

// ---------------------------------------------------------------------------
// rendering / lifecycle
// ---------------------------------------------------------------------------

test('renderOnce draws every item kind without DOM and calls sprite draw', () => {
  const canvas = fakeCanvas()
  const engine = E.create(canvas)
  const spriteCalls = []
  engine.add({ id: 'grid', kind: 'grid', pos: [0, 0, 0], size: [20, 20], cell: 1, majorEvery: 5, activeCell: [2, 3] })
  engine.add({ id: 'plate', kind: 'plate', pos: [0, 0, 0], size: [4, 3], label: 'PLATE', sub: 'tap', active: true })
  engine.add({ id: 'cube', kind: 'cube', pos: [-2, 0, 0], size: [1, 0.8, 1], label: 'NAND', sub: '7B', spin: 30, bob: 0.1, emissive: 0.4 })
  engine.add({ id: 'hex', kind: 'hex', pos: [2, 0, 0], size: 0.6, label: 'NAND', emissive: 0.6, anchor: 'center' })
  engine.add({ id: 'wire', kind: 'wire', points: [[-2, 0.6, 0], [0, 1.2, 1], [2, 0.6, 0]], flow: 0.6, pulseSpeed: 0.4, arrows: true, dash: 0.2 })
  engine.add({ kind: 'ring', pos: [0, 2.4, 0], radius: 1.2, spin: 40, tilt: 20, glow: 0.5 })
  engine.add({ kind: 'beam', pos: [4, 0, -2], radius: 0.4, height: 4 })
  engine.add({ kind: 'glow', pos: [-3, 0.6, -2], radius: 1.5, intensity: 1.2 })
  engine.add({ kind: 'particles', pos: [0, 1, 0], area: [6, 2, 6], count: 30, size: 0.05, speed: 1 })
  engine.add({ kind: 'text', pos: [0, 3, 0], text: 'NAND', sub: 'n=1', size: 14 })
  const sprite = engine.add({
    id: 'nft',
    kind: 'sprite',
    pos: [3, 1.5, 2],
    size: 1.2,
    draw(ctx, px, timeMs, item) {
      spriteCalls.push({ px: Object.assign({}, px), timeMs, item })
    },
  })

  engine.renderOnce()
  assert.equal(spriteCalls.length, 1)
  const call = spriteCalls[0]
  assert.ok(Number.isFinite(call.px.x) && Number.isFinite(call.px.y))
  assert.ok(call.px.unit > 0 && call.px.scale > 0)
  assert.equal(call.px.size, 1.2)
  assert.equal(call.item, sprite)
  assert.equal(typeof call.item.set, 'function')
  assert.equal(typeof call.timeMs, 'number')
  engine.dispose()
})

test('start/stop drives time, frame callback and the full draw path', async () => {
  const canvas = fakeCanvas()
  const engine = E.create(canvas)
  const frames = []
  engine.setFrameCallback((dt, time) => frames.push([dt, time]))
  engine.add({ id: 'grid', kind: 'grid', size: [10, 10], cell: 1 })
  engine.add({ id: 'cube', kind: 'cube', pos: [0, 0.5, 0], size: 1, label: 'A' })
  engine.add({ id: 'wire', kind: 'wire', points: [[-2, 0.4, 0], [2, 0.4, 0]], flow: 1 })
  assert.equal(engine.time(), 0)
  engine.start()
  engine.start() // idempotent
  await delay(90)
  engine.stop()
  assert.ok(engine.time() > 0, 'time advances while running')
  assert.ok(frames.length > 0, 'frame callback ran')
  const timeBefore = engine.time()
  await delay(40)
  close(engine.time(), timeBefore, 1e-9, 'time frozen after stop:')
  engine.dispose()
})

test('dispose detaches listeners and stops the loop', async () => {
  const canvas = fakeCanvas()
  const engine = E.create(canvas)
  engine.add({ id: 'x', kind: 'cube', pos: [0, 1, 0] })
  assert.ok(canvas.listenerCount() > 0)
  engine.start()
  await delay(30)
  engine.dispose()
  assert.equal(canvas.listenerCount(), 0, 'all pointer listeners removed')
  assert.equal(engine.isRunning(), false)
  engine.stop()
  engine.renderOnce()
  engine.clear()
  engine.dispose()
})

test('screenToPlane on the engine matches the pure math helper', () => {
  const engine = E.create(fakeCanvas())
  const cam = engine.getCamera()
  const viewport = { w: 900, h: 600 }
  const expected = M.screenToPlane(cam, viewport, 512, 341, 0)
  const actual = engine.screenToPlane(512, 341, 0)
  assert.ok(expected && actual)
  close(actual[0], expected[0], 1e-9, 'x:')
  close(actual[1], 0, 1e-9)
  close(actual[2], expected[2], 1e-9, 'z:')
  // and it is the inverse of engine.project
  const world = engine.screenToPlane(700, 200, 0)
  const back = engine.project(world)
  close(back.x, 700, 1e-6, 'roundtrip screen x:')
  close(back.y, 200, 1e-6, 'roundtrip screen y:')
  engine.dispose()
})
