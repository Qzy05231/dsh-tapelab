/**
 * 10-engine.js — `TT.Engine`: dependency-free software 3D engine on a 2D canvas.
 *
 * No WebGL, no imports, no top-level DOM access. Concatenated inside the plugin
 * factory closure it assigns onto the shared `TT` namespace; unit tests load this
 * file with `new Function('TT', 'window', 'document', src)`.
 *
 * ---------------------------------------------------------------------------
 * PUBLIC API (contract §5)
 * ---------------------------------------------------------------------------
 *   const engine = TT.Engine.create(canvas, { dprMax: 2, background: '#05080f' })
 *   engine.add(itemSpec) -> handle
 *   engine.clear()
 *   engine.setCamera({ yaw, pitch, dist, target }, { animateMs })
 *   engine.getCamera() -> { yaw, pitch, dist, target:[x,y,z] }
 *   engine.resize()
 *   engine.start() / engine.stop() / engine.dispose()
 *   engine.setFrameCallback(fn)         // fn(dtMs, timeMs) before each draw
 *   engine.setPickCallback(fn)          // fn(pick|null, 'click'|'hover'|'leave')
 *   engine.setPointerEnabled(bool)
 *   engine.autoRotate(enabled, speedDegPerSec)
 *   engine.focus(target, { animateMs })
 *   engine.project([x,y,z]) -> { x, y, scale, depth, visible }   // CSS px
 *   engine.screenToPlane(x, y, planeY) -> [x, planeY, z] | null  // CSS px
 *   engine.pickAt(x, y) -> pick|null
 *   engine.time() -> ms since start()
 *   engine.math                         // pure helpers, Node-testable
 *
 *   pick = { id, kind, data, point:[x,y,z], screen:{x,y}, item:handle }
 *   handle = { set(patch), remove(), visible, spec, id, kind, pos, size, color, data }
 *
 *   TT.Engine.math = {
 *     eye(camera), project(camera, viewport, point),
 *     screenToPlane(camera, viewport, sx, sy, planeY),
 *     defaultCamera(), pickRadiusFor(spec, projected),
 *     basis(camera, viewport), clamp, lerp
 *   }
 *
 * ---------------------------------------------------------------------------
 * EXTRAS beyond the contract (safe to ignore)
 * ---------------------------------------------------------------------------
 *   engine.renderOnce()        draw one frame synchronously (handy for tests/debug)
 *   engine.hoveredId()         currently hovered id or null
 *   engine.isRunning()         boolean
 *   handle.pos/size/color/data/id/kind getters (read spec fields directly)
 *   spec.anchor: 'bottom' (default) | 'center' for cube/hex — pos.y is the base
 *               when bottom-anchored (so a chip at y=0 sits on the floor).
 *   spec.hovered: true forces the internal hover highlight without a pointer.
 *   spec.castShadow: true draws a soft ground contact shadow under cube/hex.
 *   sprite.draw(ctx, px, timeMs, handle): ctx is translated to the sprite centre;
 *               px = { x, y, unit, size, scale, depth, alpha, hovered }. `unit` is
 *               px per world unit, `scale` = unit * spec.size (artwork should use
 *               px.scale or px.unit and draw around (0,0)).
 *   wire `width` is in WORLD units; ring `width` is CSS px.
 *   grid.activeCell = [i, j] highlights one grid cell.
 *   Handy defaults: wire glow 0.32, ring glow 0.6, spin 0. Set `flow` (0..1) on
 *   a wire to animate signal pulses along its points.
 *   Pickable kinds: cube, hex, plate, wire, ring, sprite, text, beam, glow (any
 *   item with an `id`); grid/particles are best left without one.
 *
 * ---------------------------------------------------------------------------
 * CONVENTIONS
 * ---------------------------------------------------------------------------
 *   Right-handed: X right, Y up, Z toward viewer. Ground y = 0.
 *   yaw 0 => camera on +Z; pitch clamped 4..82; dist clamped 8..40; fov 48°.
 *   plate/grid `pos` = centre on the ground plane; wire `points` are absolute;
 *   cube/hex `pos` = base centre (bottom-anchored) unless anchor:'center';
 *   ring/glow/beam/sprite/text pos = visual centre / beam base.
 *   Cube's `size` may be a number or [sx,sy,sz]; plate's `size` is [w,d];
 *   hex/sprite `size` is a number.
 *   Pointer picking: only items with an `id`; 6 px click slop; hover callbacks
 *   fire only when the hovered id/phase changes. Hover highlight is internal.
 *   setCamera/focus animate only while start()ed; when stopped they snap.
 *   Re-add items per chapter with clear(); call handle.set({points:[...]}) to
 *   change wire geometry (array contents mutated in place are not re-read).
 *   Everything is drawn with the painter's algorithm; additive kinds
 *   (glow/beam/particles/wire pulses) use 'lighter' compositing and cached
 *   offscreen gradient sprites — no shadowBlur in the per-item hot path.
 * ---------------------------------------------------------------------------
 */

TT.Engine = (function () {
  'use strict'

  // ------------------------------------------------------------------ constants
  const DEG = Math.PI / 180
  const TAU = Math.PI * 2
  const FOV = 48 * DEG
  const NEAR = 0.2
  const DIST_MIN = 8
  const DIST_MAX = 40
  const PITCH_MIN = 4
  const PITCH_MAX = 82
  const CLICK_SLOP = 6
  const SHADE_STEPS = 24
  const RING_SEG = 72
  const FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
  const FONT_CACHE = []
  const LABEL_DARK = 'rgba(2, 6, 13, 0.72)'
  const SUB_COLOR = 'rgba(150, 195, 220, 0.78)'
  const LIGHT = (function () {
    const x = -0.42
    const y = 0.82
    const z = 0.38
    const len = Math.sqrt(x * x + y * y + z * z)
    return [x / len, y / len, z / len]
  })()
  const RING_COS = new Float64Array(RING_SEG)
  const RING_SIN = new Float64Array(RING_SEG)
  for (let i = 0; i < RING_SEG; i += 1) {
    const a = (i / RING_SEG) * TAU
    RING_COS[i] = Math.cos(a)
    RING_SIN[i] = Math.sin(a)
  }

  // -------------------------------------------------------------------- helpers
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v
  }

  function lerp(a, b, t) {
    return a + (b - a) * t
  }

  function num(v, d) {
    return typeof v === 'number' && v === v && v !== Infinity && v !== -Infinity ? v : d
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function shortAngle(from, to) {
    let d = (to - from) % 360
    if (d > 180) d -= 360
    if (d < -180) d += 360
    return d
  }

  function fontStr(px) {
    let size = Math.round(px)
    if (size < 6) size = 6
    else if (size > 64) size = 64
    let out = FONT_CACHE[size]
    if (out === undefined) {
      out = '600 ' + size + 'px ' + FONT_STACK
      FONT_CACHE[size] = out
    }
    return out
  }

  function nowMs() {
    if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') {
      return performance.now()
    }
    return Date.now()
  }

  function requestFrame(fn) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(fn)
    return setTimeout(function () { fn(nowMs()) }, 16)
  }

  function cancelFrame(id) {
    if (!id) return
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id)
    else clearTimeout(id)
  }

  // ---------------------------------------------------------------- colour
  function parseColor(value) {
    if (typeof value !== 'string') return null
    const s = value.trim()
    if (s.charAt(0) === '#') {
      const h = s.slice(1)
      if (h.length === 3 || h.length === 4) {
        const r = parseInt(h.charAt(0) + h.charAt(0), 16)
        const g = parseInt(h.charAt(1) + h.charAt(1), 16)
        const b = parseInt(h.charAt(2) + h.charAt(2), 16)
        if (r === r && g === g && b === b) return [r, g, b]
        return null
      }
      if (h.length === 6 || h.length === 8) {
        const r = parseInt(h.slice(0, 2), 16)
        const g = parseInt(h.slice(2, 4), 16)
        const b = parseInt(h.slice(4, 6), 16)
        if (r === r && g === g && b === b) return [r, g, b]
        return null
      }
      return null
    }
    const m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(s)
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
    return null
  }

  function rgbString(r, g, b) {
    return 'rgb(' + r + ',' + g + ',' + b + ')'
  }

  function brighten(rgb, gain, lift) {
    return [
      clamp(Math.round(rgb[0] * gain + lift * 255), 0, 255),
      clamp(Math.round(rgb[1] * gain + lift * 255), 0, 255),
      clamp(Math.round(rgb[2] * gain + lift * 255), 0, 255),
    ]
  }

  function brightenString(rgb, gain, lift, alpha) {
    const c = brighten(rgb, gain, lift)
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')'
  }

  function buildShades(rgb) {
    const list = new Array(SHADE_STEPS)
    for (let i = 0; i < SHADE_STEPS; i += 1) {
      const f = 0.18 + (i / (SHADE_STEPS - 1)) * 1.02
      list[i] = rgbString(
        clamp(Math.round(rgb[0] * f), 0, 255),
        clamp(Math.round(rgb[1] * f), 0, 255),
        clamp(Math.round(rgb[2] * f), 0, 255),
      )
    }
    return list
  }

  function paletteColor(name, fallback) {
    const palette = TT && TT.palette
    if (palette && typeof palette[name] === 'string') return palette[name]
    return fallback
  }

  function defaultColor(kind) {
    switch (kind) {
      case 'cube': return paletteColor('mint', '#6ee7b7')
      case 'hex': return paletteColor('nand', '#7ce9ff')
      case 'plate': return paletteColor('cyan', '#22d3ee')
      case 'wire': return paletteColor('wire', '#38bdf8')
      case 'ring': return paletteColor('amber', '#fbbf24')
      case 'beam': return paletteColor('cyan', '#22d3ee')
      case 'glow': return paletteColor('magenta', '#e879f9')
      case 'particles': return paletteColor('cyanDim', '#2a8fb0')
      case 'grid': return paletteColor('grid', '#14405c')
      case 'text': return paletteColor('ink', '#dbeafe')
      default: return '#7dd3fc'
    }
  }

  // ----------------------------------------------------------------------- math
  function makeBasis() {
    return {
      eye: [0, 0, 0],
      fwd: [0, 0, 0],
      right: [0, 0, 0],
      up: [0, 0, 0],
      f: 1,
      cx: 0,
      cy: 0,
      w: 2,
      h: 2,
    }
  }

  function fillBasis(camera, viewport, out) {
    const cam = camera || {}
    const target = cam.target && cam.target.length >= 3 ? cam.target : [0, 0, 0]
    const yaw = num(cam.yaw, 32) * DEG
    const pitch = clamp(num(cam.pitch, 26), PITCH_MIN, PITCH_MAX) * DEG
    const dist = clamp(num(cam.dist, 18), DIST_MIN, DIST_MAX)
    const cp = Math.cos(pitch)
    const sp = Math.sin(pitch)
    const eye0 = out.eye
    eye0[0] = target[0] + dist * Math.sin(yaw) * cp
    eye0[1] = target[1] + dist * sp
    eye0[2] = target[2] + dist * Math.cos(yaw) * cp
    const fwd = out.fwd
    fwd[0] = -Math.sin(yaw) * cp
    fwd[1] = -sp
    fwd[2] = -Math.cos(yaw) * cp
    const right = out.right
    right[0] = -fwd[2]
    right[1] = 0
    right[2] = fwd[0]
    const rl = Math.sqrt(right[0] * right[0] + right[2] * right[2]) || 1
    right[0] /= rl
    right[2] /= rl
    const up = out.up
    up[0] = right[1] * fwd[2] - right[2] * fwd[1]
    up[1] = right[2] * fwd[0] - right[0] * fwd[2]
    up[2] = right[0] * fwd[1] - right[1] * fwd[0]
    const vp = viewport || {}
    const w = Math.max(2, num(vp.w, 800))
    const h = Math.max(2, num(vp.h, 600))
    out.w = w
    out.h = h
    out.f = (h * 0.5) / Math.tan(FOV * 0.5)
    out.cx = w * 0.5
    out.cy = h * 0.5
    return out
  }

  function defaultCamera() {
    return { yaw: 32, pitch: 26, dist: 18, target: [0, 1.2, 0] }
  }

  function eye(camera) {
    const b = fillBasis(camera, { w: 2, h: 2 }, makeBasis())
    return [b.eye[0], b.eye[1], b.eye[2]]
  }

  function projectWithBasis(b, point) {
    const p = point || [0, 0, 0]
    const dx = num(p[0], 0) - b.eye[0]
    const dy = num(p[1], 0) - b.eye[1]
    const dz = num(p[2], 0) - b.eye[2]
    const vx = dx * b.right[0] + dy * b.right[1] + dz * b.right[2]
    const vy = dx * b.up[0] + dy * b.up[1] + dz * b.up[2]
    const vz = dx * b.fwd[0] + dy * b.fwd[1] + dz * b.fwd[2]
    const visible = vz > NEAR
    const denom = visible ? vz : NEAR
    const scale = b.f / denom
    return { x: b.cx + vx * scale, y: b.cy - vy * scale, scale, depth: vz, visible }
  }

  function project(camera, viewport, point) {
    return projectWithBasis(fillBasis(camera, viewport, makeBasis()), point)
  }

  function screenToPlaneWithBasis(b, sx, sy, planeY) {
    const u = (num(sx, 0) - b.cx) / b.f
    const v = -(num(sy, 0) - b.cy) / b.f
    let dx = b.right[0] * u + b.up[0] * v + b.fwd[0]
    let dy = b.right[1] * u + b.up[1] * v + b.fwd[1]
    let dz = b.right[2] * u + b.up[2] * v + b.fwd[2]
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (!(len > 1e-9)) return null
    dx /= len
    dy /= len
    dz /= len
    if (Math.abs(dy) < 1e-9) return null
    const t = (num(planeY, 0) - b.eye[1]) / dy
    if (!(t > 0)) return null
    return [b.eye[0] + dx * t, num(planeY, 0), b.eye[2] + dz * t]
  }

  function screenToPlane(camera, viewport, sx, sy, planeY) {
    return screenToPlaneWithBasis(fillBasis(camera, viewport, makeBasis()), sx, sy, planeY)
  }

  function pickRadiusFor(spec, projected) {
    const s = spec || {}
    const scale = projected && isFinite(projected.scale) && projected.scale > 0 ? projected.scale : 1
    const size = s.size
    const kind = s.kind || 'cube'
    let world = 0.5
    if (kind === 'cube') {
      let sx = 1
      let sy = 1
      let sz = 1
      if (typeof size === 'number') {
        sx = sy = sz = size
      } else if (size && size.length >= 3) {
        sx = num(size[0], 1)
        sy = num(size[1], 1)
        sz = num(size[2], 1)
      }
      world = Math.max(sx, sy, sz) * 0.75
    } else if (kind === 'hex') {
      const r = Array.isArray(size) ? num(size[0], 1) : num(size, 1)
      const h = num(s.height, r * 0.5)
      world = Math.max(r, h * 0.6) * 0.95
    } else if (kind === 'plate') {
      const w = Array.isArray(size) ? num(size[0], 2) : num(size, 2)
      const d = Array.isArray(size) ? num(size[1], 2) : num(size, 2)
      world = Math.min(w, d) * 0.55
    } else if (kind === 'sprite') {
      world = s.pickRadius != null ? Math.max(0.05, num(s.pickRadius, 1)) : num(size, 1) * 0.6
    } else if (kind === 'wire') {
      world = Math.max(0.35, num(s.width, 0.12) * 3)
    } else if (kind === 'ring') {
      world = Math.max(0.5, num(s.radius, 1.2))
    } else if (kind === 'beam') {
      world = Math.max(0.4, num(s.radius, 0.7))
    } else if (kind === 'text') {
      world = Math.max(0.25, num(s.size, 12) / 34)
    } else if (kind === 'glow') {
      world = Math.max(0.4, num(s.radius, 1.2) * 0.7)
    }
    return clamp(world * scale, 8, 110)
  }

  const math = {
    eye,
    basis: function (camera, viewport) { return fillBasis(camera, viewport, makeBasis()) },
    project,
    screenToPlane,
    defaultCamera,
    pickRadiusFor,
    clamp,
    lerp,
  }

  // --------------------------------------------------------------------- items
  function copySpec(spec) {
    const src = spec || {}
    const out = {}
    for (const key in src) {
      if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = src[key]
    }
    const p = src.pos
    out.pos = Array.isArray(p) && p.length >= 3 ? [num(p[0], 0), num(p[1], 0), num(p[2], 0)] : [0, 0, 0]
    if (Array.isArray(src.size)) out.size = src.size.slice()
    out.visible = src.visible !== false
    out.opacity = src.opacity == null ? 1 : clamp(num(src.opacity, 1), 0, 1)
    return out
  }

  function makeItem(spec) {
    const src = spec || {}
    const it = {
      kind: typeof src.kind === 'string' ? src.kind : 'cube',
      spec: copySpec(src),
      id: src.id == null ? null : String(src.id),
      handle: null,
      dirty: true,
      phase: Math.random() * TAU,
      alphaBase: 1,
      colorStr: '#7dd3fc',
      rgb: [125, 211, 252],
      shades: null,
      edgeStr: 'rgba(200,240,255,0.9)',
      labelColor: '#eaf7ff',
      subColor: SUB_COLOR,
      centerOff: [0, 0, 0],
      centerPt: null,
      projX: null,
      projY: null,
      projD: null,
      projVis: null,
      bodyX: null,
      bodyY: null,
      bodyZ: null,
      poly: null,
      faceOrder: null,
      faceLevel: null,
      faceDepth: null,
      pn: 0,
      plx: null,
      plz: null,
      pw: 2,
      pd: 2,
      ringStr: null,
      wnx: 0,
      wx: null,
      wy: null,
      wz: null,
      wcum: null,
      wtotal: 0,
      widthWorld: 0.12,
      radius: 1,
      tiltX: 0,
      tiltZ: 0,
      ringX: null,
      ringY: null,
      ringZ: null,
      beamH: 5,
      intensity: 1,
      sizeNum: 1,
      drawFn: null,
      fontSize: 12,
      align: 'center',
      textStr: '',
      subStr: '',
      grid: null,
      parts: null,
      shadow: false,
    }
    it.spec.kind = it.kind
    it.spec.id = it.id == null ? undefined : it.id
    return it
  }

  function bobOf(st, it) {
    if (it.kind !== 'cube' && it.kind !== 'hex') return 0
    const b = num(it.spec.bob, 0)
    if (!b) return 0
    return b * Math.sin(st.time * 0.0021 + it.phase * 3)
  }

  function centerOf(st, it) {
    const out = st._cen
    if (it.centerPt) {
      out[0] = it.centerPt[0]
      out[1] = it.centerPt[1]
      out[2] = it.centerPt[2]
      return out
    }
    const off = it.centerOff
    const p = it.spec.pos
    out[0] = p[0] + off[0]
    out[1] = p[1] + off[1] + bobOf(st, it)
    out[2] = p[2] + off[2]
    return out
  }

  // --------------------------------------------------------------- preparation
  function prepare(it) {
    it.dirty = false
    const s = it.spec
    it.alphaBase = s.opacity == null ? 1 : clamp(num(s.opacity, 1), 0, 1)
    const color = s.color == null ? defaultColor(it.kind) : s.color
    it.colorStr = typeof color === 'string' ? color : '#7dd3fc'
    it.rgb = parseColor(it.colorStr) || [125, 211, 252]
    it.shades = buildShades(it.rgb)
    it.edgeStr = s.edge == null ? brightenString(it.rgb, 1.3, 0.08, 0.92) : String(s.edge)
    it.labelColor = s.labelColor == null ? '#eaf7ff' : s.labelColor
    it.subColor = s.subColor == null ? SUB_COLOR : s.subColor
    it.centerOff[0] = 0
    it.centerOff[1] = 0
    it.centerOff[2] = 0
    it.centerPt = null
    it.shadow = s.castShadow === true
    it.shadowR = 0.6
    switch (it.kind) {
      case 'cube': prepareCube(it, s); break
      case 'hex': prepareHex(it, s); break
      case 'plate': preparePlate(it, s); break
      case 'wire': prepareWire(it, s); break
      case 'ring': prepareRing(it, s); break
      case 'beam': prepareBeam(it, s); break
      case 'glow': prepareGlow(it, s); break
      case 'particles': prepareParticles(it, s); break
      case 'grid': prepareGrid(it, s); break
      case 'text': prepareText(it, s); break
      case 'sprite': prepareSprite(it, s); break
      default: break
    }
  }

  function makePolyScratch(it, nv, nf) {
    it.bodyX = new Float64Array(nv)
    it.bodyY = new Float64Array(nv)
    it.bodyZ = new Float64Array(nv)
    it.projX = new Float64Array(nv)
    it.projY = new Float64Array(nv)
    it.projD = new Float64Array(nv)
    it.projVis = new Uint8Array(nv)
    it.faceOrder = new Int16Array(nf)
    it.faceLevel = new Int16Array(nf)
    it.faceDepth = new Float64Array(nf)
  }

  function prepareCube(it, s) {
    const size = s.size
    let sx = 1
    let sy = 1
    let sz = 1
    if (typeof size === 'number') {
      sx = sy = sz = size
    } else if (size && size.length >= 3) {
      sx = num(size[0], 1)
      sy = num(size[1], 1)
      sz = num(size[2], 1)
    }
    const hx = sx * 0.5
    const hy = sy * 0.5
    const hz = sz * 0.5
    const lx = new Float64Array(8)
    const ly = new Float64Array(8)
    const lz = new Float64Array(8)
    const corners = [
      [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz],
      [-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz],
    ]
    for (let i = 0; i < 8; i += 1) {
      lx[i] = corners[i][0]
      ly[i] = corners[i][1]
      lz[i] = corners[i][2]
    }
    const faces = [
      { i: [0, 3, 2, 1], n: [0, -1, 0] },
      { i: [4, 5, 6, 7], n: [0, 1, 0] },
      { i: [3, 2, 6, 7], n: [0, 0, 1] },
      { i: [1, 0, 4, 5], n: [0, 0, -1] },
      { i: [2, 1, 5, 6], n: [1, 0, 0] },
      { i: [0, 3, 7, 4], n: [-1, 0, 0] },
    ]
    const bottom = s.anchor !== 'center'
    it.poly = {
      nv: 8,
      lx: lx,
      ly: ly,
      lz: lz,
      faces: faces,
      topY: hy,
      centerOffY: bottom ? hy : 0,
    }
    it.shadowR = Math.sqrt(hx * hx + hz * hz) * 1.15
    makePolyScratch(it, 8, 6)
  }

  function prepareHex(it, s) {
    const rawR = Array.isArray(s.size) ? num(s.size[0], 1) : num(s.size, 1)
    const radius = Math.max(0.05, rawR)
    const height = Math.max(0.04, num(s.height, radius * 0.5))
    const lx = new Float64Array(12)
    const ly = new Float64Array(12)
    const lz = new Float64Array(12)
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * TAU
      const x = Math.cos(a) * radius
      const z = Math.sin(a) * radius
      lx[i] = x; ly[i] = height * 0.5; lz[i] = z
      lx[i + 6] = x; ly[i + 6] = -height * 0.5; lz[i + 6] = z
    }
    const faces = []
    faces.push({ i: [0, 1, 2, 3, 4, 5], n: [0, 1, 0] })
    faces.push({ i: [11, 10, 9, 8, 7, 6], n: [0, -1, 0] })
    for (let i = 0; i < 6; i += 1) {
      const next = (i + 1) % 6
      const mid = ((i + 0.5) / 6) * TAU
      faces.push({
        i: [i, next, next + 6, i + 6],
        n: [Math.cos(mid), 0, Math.sin(mid)],
      })
    }
    const bottom = s.anchor !== 'center'
    it.poly = {
      nv: 12,
      lx: lx,
      ly: ly,
      lz: lz,
      faces: faces,
      topY: height * 0.5,
      centerOffY: bottom ? height * 0.5 : 0,
    }
    it.shadowR = radius * 1.15
    makePolyScratch(it, 12, faces.length)
  }

  function preparePlate(it, s) {
    const size = s.size
    let w = 2
    let d = 2
    if (typeof size === 'number') {
      w = d = size
    } else if (size && size.length >= 2) {
      w = num(size[0], 2)
      d = num(size[1], 2)
    }
    w = Math.max(0.2, w)
    d = Math.max(0.2, d)
    it.pw = w
    it.pd = d
    const rr = Math.min(w, d) * 0.16
    const seg = 4
    const perCorner = seg + 1
    const total = perCorner * 4
    const lx = new Float64Array(total)
    const lz = new Float64Array(total)
    const corners = [
      [w * 0.5 - rr, d * 0.5 - rr, 0],
      [-w * 0.5 + rr, d * 0.5 - rr, Math.PI * 0.5],
      [-w * 0.5 + rr, -d * 0.5 + rr, Math.PI],
      [w * 0.5 - rr, -d * 0.5 + rr, Math.PI * 1.5],
    ]
    let n = 0
    for (let c = 0; c < 4; c += 1) {
      const corner = corners[c]
      for (let k = 0; k <= seg; k += 1) {
        const a = corner[2] + (k / seg) * (Math.PI * 0.5)
        lx[n] = corner[0] + Math.cos(a) * rr
        lz[n] = corner[1] + Math.sin(a) * rr
        n += 1
      }
    }
    it.pn = total
    it.plx = lx
    it.plz = lz
    it.ringStr = s.ring == null ? brightenString(it.rgb, 1.25, 0.12, 0.95) : String(s.ring)
  }

  function prepareWire(it, s) {
    const pts = Array.isArray(s.points) ? s.points : []
    const n = pts.length
    it.wnx = n
    it.wx = new Float64Array(n)
    it.wy = new Float64Array(n)
    it.wz = new Float64Array(n)
    it.wcum = new Float64Array(n)
    let total = 0
    for (let i = 0; i < n; i += 1) {
      const p = pts[i] || [0, 0, 0]
      it.wx[i] = num(p[0], 0)
      it.wy[i] = num(p[1], 0)
      it.wz[i] = num(p[2], 0)
      if (i > 0) {
        const dx = it.wx[i] - it.wx[i - 1]
        const dy = it.wy[i] - it.wy[i - 1]
        const dz = it.wz[i] - it.wz[i - 1]
        total += Math.sqrt(dx * dx + dy * dy + dz * dz)
      }
      it.wcum[i] = total
    }
    it.wtotal = total
    it.widthWorld = Math.max(0.01, num(s.width, 0.12))
    if (n > 0) {
      const mid = locateWire(it, 0.5, [0, 0, 0])
      it.centerPt = mid ? [mid[0], mid[1], mid[2]] : [it.wx[0], it.wy[0], it.wz[0]]
    } else {
      it.centerPt = [0, 0, 0]
    }
  }

  function locateWire(it, u, out) {
    const n = it.wnx
    if (n === 0) return null
    if (n === 1 || !(it.wtotal > 0)) {
      out[0] = it.wx[0]
      out[1] = it.wy[0]
      out[2] = it.wz[0]
      return out
    }
    let target = (u - Math.floor(u)) * it.wtotal
    if (target <= 0) target = 0
    const cum = it.wcum
    let lo = 1
    let hi = n - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cum[mid] < target) lo = mid + 1
      else hi = mid
    }
    const i = lo
    const seg = cum[i] - cum[i - 1]
    const t = seg > 1e-9 ? clamp((target - cum[i - 1]) / seg, 0, 1) : 0
    out[0] = it.wx[i - 1] + (it.wx[i] - it.wx[i - 1]) * t
    out[1] = it.wy[i - 1] + (it.wy[i] - it.wy[i - 1]) * t
    out[2] = it.wz[i - 1] + (it.wz[i] - it.wz[i - 1]) * t
    return out
  }

  function prepareRing(it, s) {
    it.radius = Math.max(0.2, num(s.radius, 1.2))
    let tx = 0
    let tz = 0
    const tilt = s.tilt
    if (typeof tilt === 'number') {
      tx = tilt
    } else if (tilt && tilt.length >= 2) {
      tx = num(tilt[0], 0)
      tz = num(tilt[1], 0)
    }
    it.tiltX = tx * DEG
    it.tiltZ = tz * DEG
    const rx = new Float64Array(RING_SEG)
    const ry = new Float64Array(RING_SEG)
    const rz = new Float64Array(RING_SEG)
    const cx = Math.cos(it.tiltX)
    const sx = Math.sin(it.tiltX)
    const cz = Math.cos(it.tiltZ)
    const sz = Math.sin(it.tiltZ)
    for (let i = 0; i < RING_SEG; i += 1) {
      let x = RING_COS[i]
      let y = 0
      let z = RING_SIN[i]
      const y1 = y * cx - z * sx
      const z1 = y * sx + z * cx
      const x1 = x * cz - y1 * sz
      const y2 = x * sz + y1 * cz
      rx[i] = x1
      ry[i] = y2
      rz[i] = z1
    }
    it.ringX = rx
    it.ringY = ry
    it.ringZ = rz
  }

  function prepareBeam(it, s) {
    it.radius = Math.max(0.05, num(s.radius, 0.7))
    it.beamH = Math.max(0.2, num(s.height, 5))
    it.centerOff[1] = it.beamH * 0.5
  }

  function prepareGlow(it, s) {
    it.radius = Math.max(0.05, num(s.radius, 1.2))
    it.intensity = clamp(num(s.intensity, 1), 0, 3)
  }

  function prepareParticles(it, s) {
    const count = clamp(Math.round(num(s.count, 40)), 1, 240)
    const area = Array.isArray(s.area) ? s.area : [5, 2, 5]
    const ax = Math.max(0.1, num(area[0], 5))
    const ay = Math.max(0.1, num(area[1], 2))
    const az = Math.max(0.1, num(area[2], 5))
    const parts = {
      count: count,
      ax: ax,
      ay: ay,
      az: az,
      baseX: new Float64Array(count),
      baseY: new Float64Array(count),
      baseZ: new Float64Array(count),
      phase: new Float64Array(count),
      speed: new Float64Array(count),
      size: new Float64Array(count),
    }
    for (let i = 0; i < count; i += 1) {
      parts.baseX[i] = (Math.random() - 0.5) * ax
      parts.baseY[i] = (Math.random() - 0.5) * ay
      parts.baseZ[i] = (Math.random() - 0.5) * az
      parts.phase[i] = Math.random()
      parts.speed[i] = 0.35 + Math.random() * 0.85
      parts.size[i] = 0.6 + Math.random() * 0.9
    }
    it.parts = parts
    it.sizeNum = Math.max(0.005, num(s.size, 0.05))
  }

  function prepareGrid(it, s) {
    const size = s.size
    let w = 20
    let d = 20
    if (typeof size === 'number') {
      w = d = size
    } else if (size && size.length >= 2) {
      w = num(size[0], 20)
      d = num(size[1], 20)
    }
    w = Math.max(0.5, w)
    d = Math.max(0.5, d)
    const cell = clamp(num(s.cell, 1), 0.1, 20)
    const nx = clamp(Math.floor(w / cell), 1, 240)
    const nz = clamp(Math.floor(d / cell), 1, 240)
    const gx = new Float64Array(nx + 1)
    const gz = new Float64Array(nz + 1)
    for (let i = 0; i <= nx; i += 1) gx[i] = -w * 0.5 + (i / nx) * w
    for (let i = 0; i <= nz; i += 1) gz[i] = -d * 0.5 + (i / nz) * d
    it.grid = {
      w: w,
      d: d,
      nx: nx,
      nz: nz,
      gx: gx,
      gz: gz,
      majorEvery: Math.max(1, Math.round(num(s.majorEvery, 5))),
      active: s.activeCell && s.activeCell.length >= 2 ? [Math.round(num(s.activeCell[0], 0)), Math.round(num(s.activeCell[1], 0))] : null,
    }
  }

  function prepareText(it, s) {
    it.fontSize = clamp(num(s.size, 12), 6, 64)
    it.align = s.align === 'left' ? 'left' : s.align === 'right' ? 'right' : 'center'
    it.textStr = s.text == null ? '' : String(s.text)
    it.subStr = s.sub == null ? '' : String(s.sub)
  }

  function prepareSprite(it, s) {
    it.sizeNum = Math.max(0.02, num(s.size, 1))
    it.drawFn = typeof s.draw === 'function' ? s.draw : null
  }

  // -------------------------------------------------------------- projection
  // Screen/projection helpers used by the draw path. They reuse engine scratch
  // arrays and never allocate.
  function projWorld(st, x, y, z, out) {
    const b = st.basis
    const dx = x - b.eye[0]
    const dy = y - b.eye[1]
    const dz = z - b.eye[2]
    const vx = dx * b.right[0] + dy * b.right[1] + dz * b.right[2]
    const vy = dx * b.up[0] + dy * b.up[1] + dz * b.up[2]
    const vz = dx * b.fwd[0] + dy * b.fwd[1] + dz * b.fwd[2]
    out[3] = vz
    if (vz <= NEAR) {
      out[0] = 0
      out[1] = 0
      out[2] = 0
      out[4] = 0
      return false
    }
    const scale = b.f / vz
    out[0] = b.cx + vx * scale
    out[1] = b.cy - vy * scale
    out[2] = scale
    out[4] = 1
    return true
  }

  // Clips one world line segment to the near plane; out = [ax, ay, bx, by,
  // startClipped, endClipped, avgDepth]. Returns false when the segment is
  // entirely behind the camera.
  function projSegment(st, x0, y0, z0, x1, y1, z1, out) {
    const b = st.basis
    let dx = x0 - b.eye[0]
    let dy = y0 - b.eye[1]
    let dz = z0 - b.eye[2]
    let vx0 = dx * b.right[0] + dy * b.right[1] + dz * b.right[2]
    let vy0 = dx * b.up[0] + dy * b.up[1] + dz * b.up[2]
    let vz0 = dx * b.fwd[0] + dy * b.fwd[1] + dz * b.fwd[2]
    dx = x1 - b.eye[0]
    dy = y1 - b.eye[1]
    dz = z1 - b.eye[2]
    let vx1 = dx * b.right[0] + dy * b.right[1] + dz * b.right[2]
    let vy1 = dx * b.up[0] + dy * b.up[1] + dz * b.up[2]
    let vz1 = dx * b.fwd[0] + dy * b.fwd[1] + dz * b.fwd[2]
    if (vz0 <= NEAR && vz1 <= NEAR) return false
    let cs = 0
    let ce = 0
    if (vz0 <= NEAR) {
      const t = (NEAR - vz0) / (vz1 - vz0)
      vx0 += (vx1 - vx0) * t
      vy0 += (vy1 - vy0) * t
      vz0 = NEAR
      cs = 1
    } else if (vz1 <= NEAR) {
      const t = (NEAR - vz1) / (vz0 - vz1)
      vx1 += (vx0 - vx1) * t
      vy1 += (vy0 - vy1) * t
      vz1 = NEAR
      ce = 1
    }
    const s0 = b.f / vz0
    const s1 = b.f / vz1
    out[0] = b.cx + vx0 * s0
    out[1] = b.cy - vy0 * s0
    out[2] = b.cx + vx1 * s1
    out[3] = b.cy - vy1 * s1
    out[4] = cs
    out[5] = ce
    out[6] = (vz0 + vz1) * 0.5
    return true
  }

  function fogOf(st, depth) {
    const d = st.cam.dist
    return clamp(1 - (depth - d * 0.8) / (d * 2.6), 0.22, 1)
  }

  // Cached offscreen gradient sprites (created once per colour, drawn per frame
  // with drawImage — no gradient allocation in the hot path).
  function radialSprite(st, rgb) {
    const key = rgb[0] + ',' + rgb[1] + ',' + rgb[2]
    let found = st.spriteCache.get(key)
    if (found !== undefined) return found
    found = null
    if (typeof document !== 'undefined' && document && document.createElement) {
      try {
        const cv = document.createElement('canvas')
        cv.width = 128
        cv.height = 128
        const g = cv.getContext('2d')
        if (g) {
          const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
          grad.addColorStop(0, 'rgba(' + key + ',1)')
          grad.addColorStop(0.28, 'rgba(' + key + ',0.55)')
          grad.addColorStop(0.62, 'rgba(' + key + ',0.14)')
          grad.addColorStop(1, 'rgba(' + key + ',0)')
          g.fillStyle = grad
          g.fillRect(0, 0, 128, 128)
          found = cv
        }
      } catch (err) {
        found = null
      }
    }
    st.spriteCache.set(key, found)
    return found
  }

  function rampSprite(st, rgb) {
    const key = rgb[0] + ',' + rgb[1] + ',' + rgb[2]
    let found = st.rampCache.get(key)
    if (found !== undefined) return found
    found = null
    if (typeof document !== 'undefined' && document && document.createElement) {
      try {
        const cv = document.createElement('canvas')
        cv.width = 64
        cv.height = 128
        const g = cv.getContext('2d')
        if (g) {
          const grad = g.createLinearGradient(0, 0, 0, 128)
          grad.addColorStop(0, 'rgba(' + key + ',0)')
          grad.addColorStop(0.55, 'rgba(' + key + ',0.22)')
          grad.addColorStop(1, 'rgba(' + key + ',0.85)')
          g.fillStyle = grad
          g.fillRect(0, 0, 64, 128)
          found = cv
        }
      } catch (err) {
        found = null
      }
    }
    st.rampCache.set(key, found)
    return found
  }

  // ------------------------------------------------------------------- drawing
  function drawBackground(st) {
    const ctx = st.ctx
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = st.bgSolid
    ctx.fillRect(0, 0, st.w, st.h)
    if (st.bgGlow) {
      ctx.fillStyle = st.bgGlow
      ctx.fillRect(0, 0, st.w, st.h)
    }
  }

  function drawHalo(st, it, rec) {
    const sprite = radialSprite(st, it.rgb)
    if (!sprite) return
    const ctx = st.ctx
    const r = Math.max(30, pickRadiusFor(it.spec, rec) * 1.8)
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.62
    ctx.drawImage(sprite, rec.x - r, rec.y - r, r * 2, r * 2)
    ctx.globalCompositeOperation = 'source-over'
  }

  function drawLabel(st, it, label, sub, x, y, scale, alpha) {
    const ctx = st.ctx
    let px = Math.round(clamp(scale * 0.34, 8, 16))
    if (it.spec.labelSize != null) px = Math.round(clamp(num(it.spec.labelSize, 11), 7, 24))
    ctx.textAlign = 'center'
    if (label != null && label !== '') {
      ctx.font = fontStr(px)
      ctx.globalAlpha = alpha
      ctx.lineWidth = Math.max(2, px * 0.3)
      ctx.strokeStyle = LABEL_DARK
      ctx.strokeText(String(label), x, y)
      ctx.fillStyle = it.labelColor
      ctx.fillText(String(label), x, y)
    }
    if (sub != null && sub !== '') {
      const spx = Math.max(7, Math.round(px * 0.78))
      ctx.font = fontStr(spx)
      ctx.globalAlpha = alpha * 0.8
      const sy = y + px * 1.02
      ctx.lineWidth = Math.max(2, spx * 0.3)
      ctx.strokeStyle = LABEL_DARK
      ctx.strokeText(String(sub), x, sy)
      ctx.fillStyle = it.subColor
      ctx.fillText(String(sub), x, sy)
    }
  }

  function drawPoly(st, it, rec, hl) {
    const ctx = st.ctx
    const s = it.spec
    const poly = it.poly
    if (!poly) return
    const nv = poly.nv
    const t = st.time
    const up = hl ? 1.055 : 1
    const spin = (num(s.spin, 0) * t * 0.001 + it.phase) * DEG
    const ca = Math.cos(spin)
    const sa = Math.sin(spin)
    const bob = bobOf(st, it)
    const ox = s.pos[0]
    const oz = s.pos[2]
    const baseY = s.pos[1] + bob
    const centerY = baseY + poly.centerOffY * up
    const bodyX = it.bodyX
    const bodyY = it.bodyY
    const bodyZ = it.bodyZ
    const projX = it.projX
    const projY = it.projY
    const projD = it.projD
    const vis = it.projVis
    const eye0 = st.basis.eye[0]
    const eye1 = st.basis.eye[1]
    const eye2 = st.basis.eye[2]
    for (let i = 0; i < nv; i += 1) {
      const lx = poly.lx[i] * up
      const ly = poly.ly[i] * up
      const lz = poly.lz[i] * up
      const wx = ox + lx * ca + lz * sa
      const wy = centerY + ly
      const wz = oz - lx * sa + lz * ca
      bodyX[i] = wx
      bodyY[i] = wy
      bodyZ[i] = wz
      if (projWorld(st, wx, wy, wz, st._p)) {
        projX[i] = st._p[0]
        projY[i] = st._p[1]
        projD[i] = st._p[3]
        vis[i] = 1
      } else {
        vis[i] = 0
      }
    }
    const emissive = clamp(num(s.emissive, 0), 0, 1)
    const pulse = clamp(num(s.pulse, 0), 0, 1)
    const pulseGlow = pulse ? pulse * (0.22 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.005 + it.phase))) : 0
    const fog = fogOf(st, rec.depth)
    const faces = poly.faces
    const fc = faces.length
    const order = it.faceOrder
    const levels = it.faceLevel
    const depths = it.faceDepth
    let nf = 0
    for (let f = 0; f < fc; f += 1) {
      const face = faces[f]
      const idx = face.i
      let cx = 0
      let cy = 0
      let cz = 0
      let depth = 0
      let visible = 1
      for (let k = 0; k < idx.length; k += 1) {
        const vi = idx[k]
        if (!vis[vi]) { visible = 0; break }
        cx += bodyX[vi]
        cy += bodyY[vi]
        cz += bodyZ[vi]
        depth += projD[vi]
      }
      if (!visible) continue
      const inv = 1 / idx.length
      cx *= inv
      cy *= inv
      cz *= inv
      depth *= inv
      const n = face.n
      const nx = n[0] * ca + n[2] * sa
      const ny = n[1]
      const nz = -n[0] * sa + n[2] * ca
      if ((eye0 - cx) * nx + (eye1 - cy) * ny + (eye2 - cz) * nz <= 0.0001) continue
      const lam = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2])
      let lv = Math.round(((0.16 + 0.84 * lam + emissive * 0.5 + pulseGlow) * (SHADE_STEPS - 1)) / 1.28) + (hl ? 2 : 0)
      if (lv < 0) lv = 0
      else if (lv > SHADE_STEPS - 1) lv = SHADE_STEPS - 1
      order[nf] = f
      levels[nf] = lv
      depths[nf] = depth
      nf += 1
    }
    // painter's order inside the item: far faces first (tiny selection sort)
    for (let a = 0; a < nf; a += 1) {
      let best = a
      for (let b = a + 1; b < nf; b += 1) {
        if (depths[b] > depths[best]) best = b
      }
      if (best !== a) {
        const td = depths[a]; depths[a] = depths[best]; depths[best] = td
        const tf = order[a]; order[a] = order[best]; order[best] = tf
        const tl = levels[a]; levels[a] = levels[best]; levels[best] = tl
      }
    }
    ctx.globalAlpha = it.alphaBase * fog
    for (let i = 0; i < nf; i += 1) {
      const face = faces[order[i]]
      const idx = face.i
      const first = idx[0]
      ctx.beginPath()
      ctx.moveTo(projX[first], projY[first])
      for (let k = 1; k < idx.length; k += 1) ctx.lineTo(projX[idx[k]], projY[idx[k]])
      ctx.closePath()
      ctx.fillStyle = it.shades[levels[i]]
      ctx.fill()
      ctx.lineWidth = hl ? 1.7 : 1
      ctx.strokeStyle = it.edgeStr
      ctx.stroke()
    }
    if (s.label != null || s.sub != null) {
      const topY = centerY + poly.topY * up
      if (projWorld(st, ox, topY, oz, st._p)) {
        drawLabel(st, it, s.label, s.sub, st._p[0], st._p[1], st._p[2], it.alphaBase * fog)
      }
    }
  }

  function drawPlate(st, it, rec, hl) {
    const ctx = st.ctx
    const s = it.spec
    const t = st.time
    const up = hl ? 1.035 : 1
    const ox = s.pos[0]
    const oy = s.pos[1] + 0.012
    const oz = s.pos[2]
    const lx = it.plx
    const lz = it.plz
    const n = it.pn
    ctx.beginPath()
    let started = false
    let any = false
    for (let i = 0; i < n; i += 1) {
      if (projWorld(st, ox + lx[i] * up, oy, oz + lz[i] * up, st._p)) {
        if (!started) {
          ctx.moveTo(st._p[0], st._p[1])
          started = true
        } else {
          ctx.lineTo(st._p[0], st._p[1])
        }
        any = true
      } else {
        started = false
      }
    }
    if (!any) return
    ctx.closePath()
    const fog = fogOf(st, rec.depth)
    const active = s.active === true
    const pulse = active ? 0.5 + 0.5 * Math.sin(t * 0.005 + it.phase) : 0
    const alpha = it.alphaBase * fog
    ctx.globalAlpha = alpha * (0.14 + pulse * 0.1)
    ctx.fillStyle = it.colorStr
    ctx.fill()
    ctx.globalAlpha = alpha * (0.1 + pulse * 0.18)
    ctx.lineWidth = 9
    ctx.strokeStyle = it.ringStr
    ctx.stroke()
    ctx.globalAlpha = alpha * (0.72 + pulse * 0.28)
    ctx.lineWidth = hl ? 2.6 : 1.7
    ctx.strokeStyle = it.ringStr
    ctx.stroke()
    if (active) {
      const sprite = radialSprite(st, it.rgb)
      if (sprite) {
        const r = Math.max(24, rec.scale * Math.max(it.pw, it.pd) * 0.85)
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = alpha * (0.12 + pulse * 0.14)
        ctx.drawImage(sprite, rec.x - r, rec.y - r, r * 2, r * 2)
        ctx.globalCompositeOperation = 'source-over'
      }
    }
    if (s.label != null || s.sub != null) {
      if (projWorld(st, ox, oy, oz, st._p)) {
        ctx.globalAlpha = alpha
        ctx.font = fontStr(Math.round(clamp(st._p[2] * 0.3, 8, 15)))
        ctx.textAlign = 'center'
        if (s.label != null && s.label !== '') {
          ctx.fillStyle = it.labelColor
          ctx.fillText(String(s.label), st._p[0], st._p[1] - 4)
        }
        if (s.sub != null && s.sub !== '') {
          ctx.font = fontStr(Math.round(clamp(st._p[2] * 0.24, 7, 12)))
          ctx.globalAlpha = alpha * 0.8
          ctx.fillStyle = it.subColor
          ctx.fillText(String(s.sub), st._p[0], st._p[1] + 9)
        }
      }
    }
  }

  function drawWire(st, it, rec, hl) {
    const ctx = st.ctx
    const s = it.spec
    const n = it.wnx
    if (n < 2) return
    const fog = fogOf(st, rec.depth)
    const alpha = it.alphaBase * fog
    let widthPx = clamp(it.widthWorld * rec.scale, 1, 12)
    if (hl) widthPx *= 1.5
    const ln = st._ln
    ctx.beginPath()
    let prevEndClipped = true
    let drew = false
    for (let i = 0; i < n - 1; i += 1) {
      if (!projSegment(st, it.wx[i], it.wy[i], it.wz[i], it.wx[i + 1], it.wy[i + 1], it.wz[i + 1], ln)) continue
      if (prevEndClipped) ctx.moveTo(ln[0], ln[1])
      ctx.lineTo(ln[2], ln[3])
      drew = true
      prevEndClipped = ln[5] === 1
    }
    if (!drew) return
    const glow = s.glow == null ? 0.32 : clamp(num(s.glow, 0.32), 0, 1)
    if (glow > 0) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = alpha * glow * 0.2
      ctx.lineWidth = widthPx * 3.4
      ctx.strokeStyle = it.colorStr
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    }
    ctx.globalAlpha = alpha
    ctx.lineWidth = widthPx
    ctx.strokeStyle = it.colorStr
    if (s.dash != null) {
      const dashPx = clamp(num(s.dash, 0.2) * rec.scale, 2, 24)
      ctx.setLineDash([dashPx, dashPx * 0.7])
    }
    ctx.stroke()
    if (s.dash != null) ctx.setLineDash([])

    if (s.arrows === true) {
      ctx.globalAlpha = alpha * 0.9
      ctx.lineWidth = Math.max(1.2, widthPx * 0.8)
      ctx.strokeStyle = it.colorStr
      const locA = st._locA
      const locB = st._locB
      for (let k = 1; k <= 3; k += 1) {
        const u = k / 4
        if (!locateWire(it, u, locA) || !locateWire(it, Math.min(0.999, u + 0.02), locB)) continue
        if (!projWorld(st, locA[0], locA[1], locA[2], st._p)) continue
        const ax = st._p[0]
        const ay = st._p[1]
        if (!projWorld(st, locB[0], locB[1], locB[2], st._p)) continue
        let dx = st._p[0] - ax
        let dy = st._p[1] - ay
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        dx /= len
        dy /= len
        const size = clamp(widthPx * 2.2, 3, 9)
        ctx.beginPath()
        ctx.moveTo(ax - dx * size - dy * size * 0.7, ay - dy * size + dx * size * 0.7)
        ctx.lineTo(ax, ay)
        ctx.lineTo(ax - dx * size + dy * size * 0.7, ay - dy * size - dx * size * 0.7)
        ctx.stroke()
      }
    }

    const flow = clamp(num(s.flow, 0), 0, 1)
    if (flow > 0) {
      const count = 2 + Math.round(flow * 2)
      const phase = (st.time * 0.0001 * (1 + num(s.pulseSpeed, 0.35) * 3)) % 1
      const loc = st._loc
      const locTail = st._locA
      const segment = clamp(0.035 * (1 + num(s.pulseSpeed, 0.35)), 0.02, 0.09)
      const headColor = brightenString(it.rgb, 1.12, 0.26, 0.92)
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = headColor
      ctx.fillStyle = headColor
      for (let k = 0; k < count; k += 1) {
        const u = phase + k / count
        const tail = u - segment < 0 ? 0 : u - segment
        if (!locateWire(it, u, loc)) continue
        if (!locateWire(it, tail, locTail)) continue
        if (!projWorld(st, loc[0], loc[1], loc[2], st._p)) continue
        const hx = st._p[0]
        const hy = st._p[1]
        const hScale = st._p[2]
        if (!projWorld(st, locTail[0], locTail[1], locTail[2], st._p)) continue
        ctx.globalAlpha = alpha * 0.85
        ctx.lineWidth = Math.max(1.5, widthPx * 1.15)
        ctx.beginPath()
        ctx.moveTo(st._p[0], st._p[1])
        ctx.lineTo(hx, hy)
        ctx.stroke()
        const r = clamp(widthPx * 0.55 + 1.2, 1.8, 5.5)
        ctx.beginPath()
        ctx.arc(hx, hy, r, 0, TAU)
        ctx.fill()
        ctx.globalAlpha = alpha * 0.12
        const glowR = Math.max(6, widthPx * 2.2)
        const sprite = radialSprite(st, brighten(it.rgb, 1.1, 0.25))
        if (sprite) ctx.drawImage(sprite, hx - glowR, hy - glowR, glowR * 2, glowR * 2)
      }
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  function drawRing(st, it, rec, hl) {
    const ctx = st.ctx
    const s = it.spec
    const t = st.time
    const spin = (num(s.spin, 0) * t * 0.001 + it.phase) * DEG
    const ca = Math.cos(spin)
    const sa = Math.sin(spin)
    const ox = s.pos[0]
    const oy = s.pos[1]
    const oz = s.pos[2]
    const r = it.radius * (hl ? 1.04 : 1)
    const rx = it.ringX
    const ry = it.ringY
    const rz = it.ringZ
    const fog = fogOf(st, rec.depth)
    const alpha = it.alphaBase * fog
    ctx.beginPath()
    let started = false
    let any = false
    for (let i = 0; i < RING_SEG; i += 1) {
      const lx = rx[i] * ca + rz[i] * sa
      const lz = -rx[i] * sa + rz[i] * ca
      if (projWorld(st, ox + lx * r, oy + ry[i] * r, oz + lz * r, st._p)) {
        if (!started) {
          ctx.moveTo(st._p[0], st._p[1])
          started = true
        } else {
          ctx.lineTo(st._p[0], st._p[1])
        }
        any = true
      } else {
        started = false
      }
    }
    if (!any) return
    if (started) ctx.closePath()
    const widthPx = clamp(num(s.width, 2.4), 1, 14) * (hl ? 1.4 : 1)
    const glow = s.glow == null ? 0.6 : clamp(num(s.glow, 0.6), 0, 1)
    if (glow > 0) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = alpha * glow * 0.22
      ctx.lineWidth = widthPx * 4
      ctx.strokeStyle = it.colorStr
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    }
    ctx.globalAlpha = alpha * (0.85 + 0.15 * Math.sin(t * 0.003 + it.phase))
    ctx.lineWidth = widthPx
    ctx.strokeStyle = it.colorStr
    ctx.stroke()
  }

  function drawBeam(st, it, rec) {
    const ctx = st.ctx
    const s = it.spec
    const ox = s.pos[0]
    const oy = s.pos[1]
    const oz = s.pos[2]
    if (!projWorld(st, ox, oy, oz, st._p)) return
    const baseX = st._p[0]
    const baseY = st._p[1]
    const baseScale = st._p[2]
    if (!projWorld(st, ox, oy + it.beamH, oz, st._p)) return
    const topX = st._p[0]
    const topY = st._p[1]
    const width = Math.max(4, it.radius * baseScale * 1.9)
    const topWidth = width * 0.62
    const fog = fogOf(st, rec.depth)
    const alpha = it.alphaBase * fog
    const sprite = rampSprite(st, it.rgb)
    const height = Math.max(1, baseY - topY)
    if (!sprite) {
      ctx.globalAlpha = alpha * 0.3
      ctx.fillStyle = it.colorStr
      ctx.fillRect((baseX + topX) * 0.5 - width * 0.5, topY, width, height)
      return
    }
    // clip a trapezoid so the column narrows with height, then add a hot core
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(baseX - width * 0.5, baseY)
    ctx.lineTo(baseX + width * 0.5, baseY)
    ctx.lineTo(topX + topWidth * 0.5, topY)
    ctx.lineTo(topX - topWidth * 0.5, topY)
    ctx.closePath()
    ctx.clip()
    ctx.globalAlpha = alpha * 0.45
    ctx.drawImage(sprite, baseX - width * 0.5, topY, width, height)
    ctx.globalAlpha = alpha * 0.3
    const core = width * 0.3
    ctx.drawImage(sprite, baseX - core * 0.5, topY, core, height)
    ctx.restore()
  }

  function drawGlow(st, it, rec) {
    const ctx = st.ctx
    const fog = fogOf(st, rec.depth)
    const sprite = radialSprite(st, it.rgb)
    if (!sprite) return
    const size = Math.max(8, it.radius * 2 * rec.scale)
    const prev = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = clamp(it.alphaBase * fog * it.intensity, 0, 1)
    ctx.drawImage(sprite, rec.x - size * 0.5, rec.y - size * 0.5, size, size)
    ctx.globalCompositeOperation = prev
  }

  function drawParticles(st, it, rec) {
    const ctx = st.ctx
    const s = it.spec
    const p = it.parts
    if (!p) return
    const fog = fogOf(st, rec.depth)
    const alpha = it.alphaBase * fog
    const t = st.time * 0.001
    const ox = s.pos[0]
    const oy = s.pos[1]
    const oz = s.pos[2]
    const px = st._p
    ctx.fillStyle = it.colorStr
    for (let i = 0; i < p.count; i += 1) {
      const u = (p.phase[i] + t * p.speed[i] * 0.12) % 1
      const wob = Math.sin(t * 0.7 + p.phase[i] * 9.4) * 0.22
      const x = ox + p.baseX[i] + wob
      const y = oy - p.ay * 0.5 + u * p.ay
      const z = oz + p.baseZ[i]
      if (!projWorld(st, x, y, z, px)) continue
      const size = clamp(it.sizeNum * px[2] * p.size[i], 1.2, 4.5)
      const a = Math.sin(Math.PI * u) * 0.85
      ctx.globalAlpha = alpha * a
      ctx.fillRect(px[0] - size * 0.5, px[1] - size * 0.5, size, size)
    }
  }

  function drawSpriteItem(st, it, rec, hl) {
    const fn = it.drawFn
    if (!fn) return
    const ctx = st.ctx
    const fog = fogOf(st, rec.depth)
    const alpha = it.alphaBase * fog
    const px = st._spritePx
    px.x = rec.x
    px.y = rec.y
    px.unit = rec.scale
    px.size = it.sizeNum
    px.scale = rec.scale * it.sizeNum * (hl ? 1.05 : 1)
    px.depth = rec.depth
    px.alpha = alpha
    px.hovered = hl
    ctx.globalAlpha = alpha
    ctx.translate(rec.x, rec.y)
    fn(ctx, px, st.time, it.handle)
  }

  function drawTextItem(st, it, rec, hl) {
    const ctx = st.ctx
    const s = it.spec
    const fog = fogOf(st, rec.depth)
    const baseAlpha = s.alpha == null ? 1 : clamp(num(s.alpha, 1), 0, 1)
    const factor = clamp(rec.scale / 38, 0.66, 2.1)
    let px = Math.round(clamp(it.fontSize * factor, 8, 58))
    if (hl) px = Math.round(px * 1.06)
    const alpha = it.alphaBase * fog * baseAlpha
    ctx.font = fontStr(px)
    ctx.textAlign = it.align
    ctx.globalAlpha = alpha
    if (it.textStr) {
      ctx.lineWidth = Math.max(2, px * 0.24)
      ctx.strokeStyle = LABEL_DARK
      ctx.strokeText(it.textStr, rec.x, rec.y)
      ctx.fillStyle = it.colorStr
      ctx.fillText(it.textStr, rec.x, rec.y)
    }
    if (it.subStr) {
      const spx = Math.max(7, Math.round(px * 0.76))
      ctx.font = fontStr(spx)
      ctx.globalAlpha = alpha * 0.78
      const sy = rec.y + px * 1.05
      ctx.lineWidth = Math.max(2, spx * 0.24)
      ctx.strokeStyle = LABEL_DARK
      ctx.strokeText(it.subStr, rec.x, sy)
      ctx.fillStyle = it.subColor
      ctx.fillText(it.subStr, rec.x, sy)
    }
  }

  function drawGrid(st, it) {
    const ctx = st.ctx
    const s = it.spec
    const g = it.grid
    if (!g) return
    const ox = s.pos[0]
    const oy = s.pos[1]
    const oz = s.pos[2]
    if (!projWorld(st, ox, oy, oz, st._p)) return
    const fog = fogOf(st, st._p[3]) * it.alphaBase
    const ln = st._ln
    const x0 = ox + g.gx[0]
    const x1 = ox + g.gx[g.nx]
    const z0 = oz + g.gz[0]
    const z1 = oz + g.gz[g.nz]
    // active cell fill (four corners projected individually)
    if (g.active) {
      const i = clamp(g.active[0], 0, g.nx - 1)
      const j = clamp(g.active[1], 0, g.nz - 1)
      const ax = ox + g.gx[i]
      const bx = ox + g.gx[i + 1]
      const az = oz + g.gz[j]
      const bz = oz + g.gz[j + 1]
      let ok = true
      let c0x = 0
      let c0y = 0
      let c1x = 0
      let c1y = 0
      let c2x = 0
      let c2y = 0
      let c3x = 0
      let c3y = 0
      if (projWorld(st, ax, oy, az, st._p)) { c0x = st._p[0]; c0y = st._p[1] } else ok = false
      if (ok && projWorld(st, bx, oy, az, st._p)) { c1x = st._p[0]; c1y = st._p[1] } else ok = false
      if (ok && projWorld(st, bx, oy, bz, st._p)) { c2x = st._p[0]; c2y = st._p[1] } else ok = false
      if (ok && projWorld(st, ax, oy, bz, st._p)) { c3x = st._p[0]; c3y = st._p[1] } else ok = false
      if (ok) {
        const pulse = 0.5 + 0.5 * Math.sin(st.time * 0.004)
        ctx.globalAlpha = fog * (0.16 + pulse * 0.12)
        ctx.fillStyle = it.colorStr
        ctx.beginPath()
        ctx.moveTo(c0x, c0y)
        ctx.lineTo(c1x, c1y)
        ctx.lineTo(c2x, c2y)
        ctx.lineTo(c3x, c3y)
        ctx.closePath()
        ctx.fill()
      }
    }
    // minor lines
    ctx.beginPath()
    let drewMinor = false
    for (let i = 0; i <= g.nx; i += 1) {
      if (i % g.majorEvery === 0) continue
      if (!projSegment(st, ox + g.gx[i], oy, z0, ox + g.gx[i], oy, z1, ln)) continue
      ctx.moveTo(ln[0], ln[1])
      ctx.lineTo(ln[2], ln[3])
      drewMinor = true
    }
    for (let i = 0; i <= g.nz; i += 1) {
      if (i % g.majorEvery === 0) continue
      if (!projSegment(st, x0, oy, oz + g.gz[i], x1, oy, oz + g.gz[i], ln)) continue
      ctx.moveTo(ln[0], ln[1])
      ctx.lineTo(ln[2], ln[3])
      drewMinor = true
    }
    if (drewMinor) {
      ctx.globalAlpha = fog * 0.22
      ctx.lineWidth = 0.75
      ctx.strokeStyle = it.colorStr
      ctx.stroke()
    }
    // major lines
    ctx.beginPath()
    let drewMajor = false
    for (let i = 0; i <= g.nx; i += g.majorEvery) {
      if (!projSegment(st, ox + g.gx[i], oy, z0, ox + g.gx[i], oy, z1, ln)) continue
      ctx.moveTo(ln[0], ln[1])
      ctx.lineTo(ln[2], ln[3])
      drewMajor = true
    }
    for (let i = 0; i <= g.nz; i += g.majorEvery) {
      if (!projSegment(st, x0, oy, oz + g.gz[i], x1, oy, oz + g.gz[i], ln)) continue
      ctx.moveTo(ln[0], ln[1])
      ctx.lineTo(ln[2], ln[3])
      drewMajor = true
    }
    if (drewMajor) {
      ctx.globalAlpha = fog * 0.44
      ctx.lineWidth = 1.25
      ctx.strokeStyle = brightenString(it.rgb, 1.15, 0.05, 1)
      ctx.stroke()
    }
  }

  function drawShadow(st, it, rec) {
    const ctx = st.ctx
    if (!(it.shadowR > 0)) return
    const s = it.spec
    if (!projWorld(st, s.pos[0], 0.01, s.pos[2], st._p)) return
    const sprite = radialSprite(st, [0, 0, 0])
    if (!sprite) return
    const size = Math.max(12, st._p[2] * it.shadowR * 2.6)
    ctx.globalAlpha = 0.5
    ctx.drawImage(sprite, st._p[0] - size * 0.5, st._p[1] - size * 0.3, size, size * 0.6)
  }

  function drawItem(st, rec) {
    const it = rec.item
    const s = it.spec
    const hl = it.id != null && (it.id === st.hoverId || s.hovered === true)
    if (it.shadow && (it.kind === 'cube' || it.kind === 'hex')) drawShadow(st, it, rec)
    if (hl && (it.kind === 'cube' || it.kind === 'hex' || it.kind === 'sprite' || it.kind === 'ring')) {
      drawHalo(st, it, rec)
    }
    switch (it.kind) {
      case 'cube':
      case 'hex': drawPoly(st, it, rec, hl); break
      case 'plate': drawPlate(st, it, rec, hl); break
      case 'wire': drawWire(st, it, rec, hl); break
      case 'ring': drawRing(st, it, rec, hl); break
      case 'beam': drawBeam(st, it, rec); break
      case 'glow': drawGlow(st, it, rec); break
      case 'particles': drawParticles(st, it, rec); break
      case 'sprite': drawSpriteItem(st, it, rec, hl); break
      case 'text': drawTextItem(st, it, rec, hl); break
      default: break
    }
  }

  // ---------------------------------------------------------------- frame draw
  function updateBasis(st) {
    st.vp.w = st.w
    st.vp.h = st.h
    fillBasis(st.cam, st.vp, st.basis)
  }

  function drawFrame(st) {
    const ctx = st.ctx
    if (!ctx || st.w < 2 || st.h < 2) return
    updateBasis(st)
    drawBackground(st)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.textBaseline = 'middle'
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    const items = st.items
    // the floor grid is always painted first
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i]
      if (it.kind !== 'grid') continue
      if (it.dirty) prepare(it)
      if (it.spec.visible === false || it.alphaBase <= 0) continue
      drawGrid(st, it)
    }
    const recs = st.recs
    recs.length = 0
    const pool = st.pool
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i]
      if (it.kind === 'grid') continue
      if (it.dirty) prepare(it)
      const s = it.spec
      if (s.visible === false || it.alphaBase <= 0) continue
      const center = centerOf(st, it)
      if (!projWorld(st, center[0], center[1], center[2], st._p)) continue
      const rec = pool[recs.length] || (pool[recs.length] = { item: null, kind: '', x: 0, y: 0, scale: 0, depth: 0, order: 0 })
      rec.item = it
      rec.kind = it.kind
      rec.x = st._p[0]
      rec.y = st._p[1]
      rec.scale = st._p[2]
      rec.depth = st._p[3]
      rec.order = i + (it.kind === 'text' ? -0.3 : 0)
      recs.push(rec)
    }
    recs.sort(compareRecs)
    for (let i = 0; i < recs.length; i += 1) {
      const rec = recs[i]
      const it = rec.item
      const additive = it.kind === 'glow' || it.kind === 'beam' || it.kind === 'particles'
      ctx.save()
      ctx.globalCompositeOperation = additive ? 'lighter' : 'source-over'
      ctx.globalAlpha = 1
      drawItem(st, rec)
      ctx.restore()
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  function compareRecs(a, b) {
    const d = b.depth - a.depth
    if (d !== 0) return d
    return a.order - b.order
  }

  // --------------------------------------------------------------------- engine
  function create(canvas, opts) {
    const options = opts || {}
    const st = {
      canvas: canvas || null,
      ctx: canvas && canvas.getContext ? canvas.getContext('2d') : null,
      dprMax: clamp(num(options.dprMax, 2), 1, 4),
      bgSolid: typeof options.background === 'string' ? options.background : '#05080f',
      bgGlow: null,
      w: 2,
      h: 2,
      dpr: 1,
      cam: defaultCamera(),
      camAnim: null,
      vp: { w: 2, h: 2 },
      basis: makeBasis(),
      frameCb: null,
      pickCb: null,
      pointerEnabled: true,
      auto: { on: false, speed: 7 },
      running: false,
      raf: 0,
      last: 0,
      time: 0,
      disposed: false,
      items: [],
      recs: [],
      pool: [],
      drag: null,
      pointers: new Map(),
      pinchDist: 0,
      pinched: false,
      hoverId: null,
      listeners: [],
      ro: null,
      spriteCache: new Map(),
      rampCache: new Map(),
      _p: [0, 0, 0, 0, 0],
      _ln: [0, 0, 0, 0, 0, 0, 0],
      _cen: [0, 0, 0],
      _loc: [0, 0, 0],
      _locA: [0, 0, 0],
      _locB: [0, 0, 0],
      _spritePx: { x: 0, y: 0, unit: 1, size: 1, scale: 1, depth: 0, alpha: 1, hovered: false },
      _pt: { x: 0, y: 0 },
    }

    // ---- viewport ----
    function resizeViewport() {
      const el = st.canvas
      if (!el) return
      let cw = num(el.clientWidth, 0)
      let ch = num(el.clientHeight, 0)
      if ((!cw || !ch) && typeof el.getBoundingClientRect === 'function') {
        const rect = el.getBoundingClientRect()
        if (rect) {
          cw = num(rect.width, 0) || cw
          ch = num(rect.height, 0) || ch
        }
      }
      if (!cw || !ch) {
        cw = st.w > 2 ? st.w : 2
        ch = st.h > 2 ? st.h : 2
      }
      let dpr = 1
      if (typeof window !== 'undefined' && window && num(window.devicePixelRatio, 0) > 0) {
        dpr = num(window.devicePixelRatio, 1)
      }
      dpr = clamp(dpr, 1, st.dprMax)
      st.w = cw
      st.h = ch
      st.dpr = dpr
      const pw = Math.max(2, Math.round(cw * dpr))
      const ph = Math.max(2, Math.round(ch * dpr))
      if (el.width !== pw) el.width = pw
      if (el.height !== ph) el.height = ph
      if (st.ctx && st.ctx.setTransform) st.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildBackground()
    }

    function buildBackground() {
      const ctx = st.ctx
      if (!ctx || !ctx.createRadialGradient) return
      try {
        const g = ctx.createRadialGradient(st.w * 0.5, st.h * 0.42, 6, st.w * 0.5, st.h * 0.55, Math.max(st.w, st.h) * 0.8)
        g.addColorStop(0, 'rgba(56,189,248,0.075)')
        g.addColorStop(0.55, 'rgba(30,64,120,0.03)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        st.bgGlow = g
      } catch (err) {
        st.bgGlow = null
      }
    }

    // ---- camera ----
    function applyCamera(target) {
      const c = st.cam
      c.yaw = target.yaw
      c.pitch = target.pitch
      c.dist = target.dist
      c.target[0] = target.target[0]
      c.target[1] = target.target[1]
      c.target[2] = target.target[2]
    }

    function copyCamera() {
      const c = st.cam
      return { yaw: c.yaw, pitch: c.pitch, dist: c.dist, target: [c.target[0], c.target[1], c.target[2]] }
    }

    function setCamera(patch, animOpts) {
      if (!patch) return api
      const animateMs = animOpts && animOpts.animateMs != null ? num(animOpts.animateMs, 0) : num(patch.animateMs, 0)
      const c = st.cam
      const to = {
        yaw: patch.yaw != null ? num(patch.yaw, c.yaw) : c.yaw,
        pitch: patch.pitch != null ? clamp(num(patch.pitch, c.pitch), PITCH_MIN, PITCH_MAX) : c.pitch,
        dist: patch.dist != null ? clamp(num(patch.dist, c.dist), DIST_MIN, DIST_MAX) : c.dist,
        target: patch.target && patch.target.length >= 3
          ? [num(patch.target[0], 0), num(patch.target[1], 0), num(patch.target[2], 0)]
          : [c.target[0], c.target[1], c.target[2]],
      }
      if (animateMs > 0 && st.running) {
        st.camAnim = { from: copyCamera(), to: to, t0: st.time, dur: animateMs }
      } else {
        st.camAnim = null
        applyCamera(to)
      }
      return api
    }

    function updateCamera(dt) {
      const anim = st.camAnim
      if (anim) {
        const t = clamp((st.time - anim.t0) / anim.dur, 0, 1)
        const e = easeInOut(t)
        const c = st.cam
        c.yaw = anim.from.yaw + shortAngle(anim.from.yaw, anim.to.yaw) * e
        c.pitch = lerp(anim.from.pitch, anim.to.pitch, e)
        c.dist = lerp(anim.from.dist, anim.to.dist, e)
        c.target[0] = lerp(anim.from.target[0], anim.to.target[0], e)
        c.target[1] = lerp(anim.from.target[1], anim.to.target[1], e)
        c.target[2] = lerp(anim.from.target[2], anim.to.target[2], e)
        if (t >= 1) {
          applyCamera(anim.to)
          st.camAnim = null
        }
      }
      if (st.auto.on && !st.drag) {
        st.cam.yaw += (st.auto.speed * dt) / 1000
      }
    }

    // ---- frame loop ----
    function frame(now) {
      st.raf = 0
      if (!st.running) return
      st.raf = requestFrame(frame)
      let dt = now - st.last
      if (!(dt >= 0)) dt = 0
      if (dt > 120) dt = 120
      st.last = now
      st.time += dt
      updateCamera(dt)
      if (st.frameCb) st.frameCb(dt, st.time)
      drawFrame(st)
    }

    function start() {
      if (st.disposed || st.running) return api
      st.running = true
      st.last = nowMs()
      st.raf = requestFrame(frame)
      return api
    }

    function stop() {
      st.running = false
      cancelFrame(st.raf)
      st.raf = 0
      return api
    }

    // ---- items ----
    function applyPatch(it, patch) {
      if (!patch) return
      const s = it.spec
      for (const key in patch) {
        if (!Object.prototype.hasOwnProperty.call(patch, key)) continue
        const value = patch[key]
        if (key === 'pos') {
          s.pos = Array.isArray(value) && value.length >= 3
            ? [num(value[0], 0), num(value[1], 0), num(value[2], 0)]
            : [0, 0, 0]
        } else if (key === 'size' && Array.isArray(value)) {
          s.size = value.slice()
        } else if (key === 'id') {
          it.id = value == null ? null : String(value)
          s.id = value == null ? undefined : it.id
        } else if (key === 'kind' && typeof value === 'string') {
          it.kind = value
          s.kind = value
          it.dirty = true
          it.centerOff[0] = 0
          it.centerOff[1] = 0
          it.centerOff[2] = 0
          it.centerPt = null
        } else if (key === 'opacity') {
          s.opacity = value == null ? 1 : clamp(num(value, 1), 0, 1)
        } else if (key === 'visible') {
          s.visible = value !== false
        } else {
          s[key] = value
        }
      }
      it.dirty = true
    }

    function makeHandle(it) {
      const handle = {
        spec: it.spec,
        set: function (patch) {
          applyPatch(it, patch)
          return handle
        },
        remove: function () {
          const idx = st.items.indexOf(it)
          if (idx >= 0) st.items.splice(idx, 1)
          if (it.id != null && st.hoverId === it.id) {
            st.hoverId = null
            emitPick(null, 'leave')
          }
          return handle
        },
      }
      const getters = ['kind', 'pos', 'size', 'color', 'data', 'id']
      for (let i = 0; i < getters.length; i += 1) {
        const key = getters[i]
        Object.defineProperty(handle, key, {
          enumerable: true,
          get: function () {
            return key === 'id' ? it.id : it.spec[key]
          },
        })
      }
      Object.defineProperty(handle, 'visible', {
        enumerable: true,
        get: function () { return it.spec.visible !== false },
        set: function (value) { it.spec.visible = value !== false },
      })
      return handle
    }

    function add(spec) {
      const it = makeItem(spec)
      it.handle = makeHandle(it)
      st.items.push(it)
      return it.handle
    }

    function clear() {
      st.items.length = 0
      st.recs.length = 0
      st.hoverId = null
      return api
    }

    // ---- picking ----
    function projectCenterInto(st2, it, out) {
      const center = centerOf(st2, it)
      return projWorld(st2, center[0], center[1], center[2], out)
    }

    function pickAtPoint(sx, sy) {
      if (st.w < 2) resizeViewport()
      updateBasis(st)
      let best = null
      for (let i = 0; i < st.items.length; i += 1) {
        const it = st.items[i]
        if (it.id == null) continue
        if (it.dirty) prepare(it)
        const s = it.spec
        if (s.visible === false || s.pickable === false || it.alphaBase <= 0) continue
        if (!projectCenterInto(st, it, st._p)) continue
        const scale = st._p[2]
        const depth = st._p[3]
        const cxs = st._p[0]
        const cys = st._p[1]
        let score = Infinity
        if (it.kind === 'wire' && it.wnx > 1) {
          let minD2 = Infinity
          for (let k = 0; k < it.wnx - 1; k += 1) {
            if (!projSegment(st, it.wx[k], it.wy[k], it.wz[k], it.wx[k + 1], it.wy[k + 1], it.wz[k + 1], st._ln)) continue
            const d2 = distToSegment2(sx, sy, st._ln[0], st._ln[1], st._ln[2], st._ln[3])
            if (d2 < minD2) minD2 = d2
          }
          const radius = Math.max(10, it.widthWorld * scale + 7)
          if (minD2 <= radius * radius) score = Math.sqrt(minD2) / radius
        } else {
          const radius = pickRadiusFor(s, { scale: scale })
          const dist = Math.sqrt((sx - cxs) * (sx - cxs) + (sy - cys) * (sy - cys))
          if (dist <= radius) score = dist / radius
        }
        if (score === Infinity) continue
        if (best === null || score < best.score - 1e-6 || (Math.abs(score - best.score) <= 1e-6 && depth < best.depth)) {
          best = { it: it, score: score, depth: depth, x: cxs, y: cys }
        }
      }
      if (best === null) return null
      const it = best.it
      const center = centerOf(st, it)
      return {
        id: it.id,
        kind: it.kind,
        data: it.spec.data,
        point: [center[0], center[1], center[2]],
        screen: { x: best.x, y: best.y },
        item: it.handle,
      }
    }

    function distToSegment2(px, py, ax, ay, bx, by) {
      const dx = bx - ax
      const dy = by - ay
      const len2 = dx * dx + dy * dy
      let t = 0
      if (len2 > 1e-9) t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1)
      const qx = ax + dx * t
      const qy = ay + dy * t
      return (px - qx) * (px - qx) + (py - qy) * (py - qy)
    }

    // ---- hover / pick callbacks ----
    function emitPick(pick, phase) {
      if (st.pickCb) st.pickCb(pick, phase)
    }

    function updateHover(pick) {
      const id = pick ? pick.id : null
      if (id === st.hoverId) return
      st.hoverId = id
      if (id != null) emitPick(pick, 'hover')
      else emitPick(null, 'leave')
    }

    // ---- pointer handling ----
    function localPoint(event) {
      const pt = st._pt
      let left = 0
      let top = 0
      if (st.canvas && typeof st.canvas.getBoundingClientRect === 'function') {
        const rect = st.canvas.getBoundingClientRect()
        if (rect) {
          left = num(rect.left, 0)
          top = num(rect.top, 0)
        }
      }
      pt.x = num(event.clientX, 0) - left
      pt.y = num(event.clientY, 0) - top
      return pt
    }

    function pointerIdOf(event) {
      return event.pointerId == null ? 1 : event.pointerId
    }

    function onPointerDown(event) {
      if (st.disposed || !st.pointerEnabled) return
      if (event.button != null && event.button > 0) return
      const pt = localPoint(event)
      const id = pointerIdOf(event)
      st.pointers.set(id, { x: pt.x, y: pt.y, startX: pt.x, startY: pt.y })
      if (st.pointers.size === 1) {
        st.drag = { x: pt.x, y: pt.y, startX: pt.x, startY: pt.y, moved: false }
        st.pinchDist = 0
      } else if (st.pointers.size === 2) {
        st.drag = null
        st.pinched = true
        st.pinchDist = pinchDistance()
      }
      if (event.cancelable !== false && event.preventDefault) event.preventDefault()
      if (st.canvas && st.canvas.setPointerCapture) {
        try { st.canvas.setPointerCapture(id) } catch (err) { /* ignore */ }
      }
    }

    function pinchDistance() {
      if (st.pointers.size < 2) return 0
      const values = []
      st.pointers.forEach(function (value) { values.push(value) })
      const a = values[0]
      const b = values[1]
      return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))
    }

    function onPointerMove(event) {
      if (st.disposed || !st.pointerEnabled) return
      const pt = localPoint(event)
      const id = pointerIdOf(event)
      const tracked = st.pointers.get(id)
      if (tracked) {
        tracked.x = pt.x
        tracked.y = pt.y
      }
      if (st.pointers.size >= 2) {
        const d = pinchDistance()
        if (st.pinchDist > 0 && d > 0) {
          st.cam.dist = clamp(st.cam.dist * (st.pinchDist / d), DIST_MIN, DIST_MAX)
          st.camAnim = null
        }
        st.pinchDist = d
        return
      }
      if (st.drag) {
        const dx = pt.x - st.drag.x
        const dy = pt.y - st.drag.y
        if (!st.drag.moved) {
          const totalDx = pt.x - st.drag.startX
          const totalDy = pt.y - st.drag.startY
          if (totalDx * totalDx + totalDy * totalDy > CLICK_SLOP * CLICK_SLOP) st.drag.moved = true
        }
        if (st.drag.moved) {
          st.cam.yaw -= dx * 0.42
          st.cam.pitch = clamp(st.cam.pitch + dy * 0.32, PITCH_MIN, PITCH_MAX)
          st.camAnim = null
        }
        st.drag.x = pt.x
        st.drag.y = pt.y
        return
      }
      updateHover(pickAtPoint(pt.x, pt.y))
    }

    function onPointerUp(event) {
      if (st.disposed) return
      const pt = localPoint(event)
      const id = pointerIdOf(event)
      st.pointers.delete(id)
      if (st.pointers.size === 0) {
        const wasDrag = st.drag ? st.drag.moved : false
        const wasPinch = st.pinched
        st.drag = null
        st.pinchDist = 0
        st.pinched = false
        if (!st.pointerEnabled) return
        if (!wasDrag && !wasPinch) {
          const pick = pickAtPoint(pt.x, pt.y)
          emitPick(pick, 'click')
          updateHover(pick)
        }
      }
      if (st.canvas && st.canvas.releasePointerCapture) {
        try { st.canvas.releasePointerCapture(id) } catch (err) { /* ignore */ }
      }
    }

    function onPointerCancel(event) {
      const id = pointerIdOf(event)
      st.pointers.delete(id)
      if (st.pointers.size === 0) {
        st.drag = null
        st.pinchDist = 0
        st.pinched = false
      }
    }

    function onPointerLeave() {
      if (st.disposed || !st.pointerEnabled) return
      if (st.pointers.size > 0 || st.drag) return
      updateHover(null)
    }

    function onWheel(event) {
      if (st.disposed || !st.pointerEnabled) return
      if (event.preventDefault) event.preventDefault()
      const delta = num(event.deltaY, 0)
      st.cam.dist = clamp(st.cam.dist * Math.exp(delta * 0.0012), DIST_MIN, DIST_MAX)
      st.camAnim = null
    }

    function listen(target, name, fn, options) {
      if (!target || typeof target.addEventListener !== 'function') return
      target.addEventListener(name, fn, options)
      st.listeners.push([target, name, fn, options])
    }

    function attachEvents() {
      const el = st.canvas
      if (!el) return
      listen(el, 'pointerdown', onPointerDown, false)
      listen(el, 'pointermove', onPointerMove, false)
      listen(el, 'pointerup', onPointerUp, false)
      listen(el, 'pointercancel', onPointerCancel, false)
      listen(el, 'pointerleave', onPointerLeave, false)
      listen(el, 'wheel', onWheel, { passive: false })
      if (el.style) el.style.touchAction = 'none'
    }

    // ---- public API ----
    const api = {
      add: add,
      clear: clear,
      setCamera: setCamera,
      getCamera: function () { return copyCamera() },
      resize: function () { resizeViewport(); return api },
      start: start,
      stop: stop,
      dispose: function () {
        stop()
        st.disposed = true
        for (let i = 0; i < st.listeners.length; i += 1) {
          const entry = st.listeners[i]
          if (entry[0] && typeof entry[0].removeEventListener === 'function') {
            entry[0].removeEventListener(entry[1], entry[2], entry[3])
          }
        }
        st.listeners.length = 0
        if (st.ro) {
          try { st.ro.disconnect() } catch (err) { /* ignore */ }
          st.ro = null
        }
        st.items.length = 0
        st.recs.length = 0
        st.ctx = null
      },
      setFrameCallback: function (fn) {
        st.frameCb = typeof fn === 'function' ? fn : null
        return api
      },
      setPickCallback: function (fn) {
        st.pickCb = typeof fn === 'function' ? fn : null
        return api
      },
      setPointerEnabled: function (enabled) {
        st.pointerEnabled = enabled !== false
        if (!st.pointerEnabled) {
          st.hoverId = null
          st.drag = null
          st.pointers.clear()
          st.pinched = false
        }
        return api
      },
      autoRotate: function (enabled, speedDegPerSec) {
        st.auto.on = enabled !== false
        if (speedDegPerSec != null) st.auto.speed = num(speedDegPerSec, st.auto.speed)
        return api
      },
      focus: function (target, focusOpts) {
        const o = focusOpts || {}
        const patch = { target: target }
        if (o.dist != null) patch.dist = o.dist
        return setCamera(patch, { animateMs: o.animateMs == null ? 650 : o.animateMs })
      },
      project: function (point) {
        if (st.w < 2) resizeViewport()
        updateBasis(st)
        const p = projectWithBasis(st.basis, point)
        return p
      },
      screenToPlane: function (x, y, planeY) {
        if (st.w < 2) resizeViewport()
        updateBasis(st)
        return screenToPlaneWithBasis(st.basis, x, y, planeY)
      },
      pickAt: function (x, y) {
        return pickAtPoint(num(x, 0), num(y, 0))
      },
      time: function () { return st.time },
      renderOnce: function () {
        if (st.disposed) return api
        if (st.w < 2) resizeViewport()
        drawFrame(st)
        return api
      },
      hoveredId: function () { return st.hoverId },
      isRunning: function () { return st.running },
      math: math,
    }

    resizeViewport()
    attachEvents()
    if (typeof ResizeObserver === 'function') {
      try {
        st.ro = new ResizeObserver(function () { resizeViewport() })
        st.ro.observe(st.canvas)
      } catch (err) {
        st.ro = null
      }
    }
    return api
  }

  return { create: create, math: math }
})()
