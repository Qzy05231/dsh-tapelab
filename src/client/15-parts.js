/**
 * 15-parts.js — `TT.Parts`: reusable 2D-canvas artwork for the 3D engine's `sprite`
 * items (new chapters, displays and the component museum).
 *
 * Everything here is plain canvas 2D — no imports, no DOM at load time, no
 * dependencies. The file is concatenated after 00-core.js / 10-engine.js and may
 * lazily read `TT.Circuit` at *draw* time (20-circuit.js loads later).
 *
 * ---------------------------------------------------------------------------
 * ENGINE SPRITE CONTRACT (see 10-engine.js)
 * ---------------------------------------------------------------------------
 * A sprite item's `draw(ctx, px, timeMs, handle)` is called with:
 *   - ctx      already translated to the sprite's projected screen centre;
 *              draw around (0, 0) and leave global state as you found it
 *              (factories below save()/restore() themselves).
 *   - px       { x, y, unit, size, scale, depth, alpha, hovered }
 *              unit  = CSS px per world unit at this depth
 *              size  = spec.size (world units)
 *              scale = unit * size  → the recommended artwork size in CSS px
 *              alpha = item opacity × depth fog (multiply your own alpha by it)
 *   - timeMs   engine time in ms (for subtle animation; never rebuild the scene)
 *   - handle   the item handle (rarely needed)
 *
 * All factories take GETTERS (functions) so live state can change every frame
 * without rebuilding the 3D scene. A plain value is also accepted, which is
 * handy for static museum exhibits and unit tests.
 *
 * ---------------------------------------------------------------------------
 * PUBLIC API
 * ---------------------------------------------------------------------------
 *   TT.Parts.colors            frozen hex constants (also below as named colours)
 *   TT.Parts.GATE_KINDS        ['not','and','or','xor','nand','mux','dff','decoder']
 *   TT.Parts.sprite.led(getOn, color?)
 *   TT.Parts.sprite.sevenSeg(getMask, getGhost?)   // mask bits a..g = bit0..bit6
 *   TT.Parts.sprite.gate(kind, getOn, color?, opts?)  // opts.caption = false hides label
 *   TT.Parts.sprite.chip(getMinted?, color?)
 *   TT.Parts.sprite.rover(getState)      // { heading, safe|stopped|mode, ... }
 *   TT.Parts.sprite.ramGrid(getState)    // { cells:[16], pc, accessed, write } | cells[]
 *   TT.Parts.sprite.register(getValue, label)  // label string or getter
 *   TT.Parts.sprite.busPulse(getActive, color?)
 *
 *   TT.Parts.museum            12 frozen entries: { id, nameKey, formulaKey, gates,
 *                              build, notesKey, name, formula } (+ latches on counter4)
 *   TT.Parts.museumById        id → entry
 *   TT.Parts.museumGates(entryOrId)  // live TT.Circuit.canonical gate count when the
 *                                    // builder exists, else the frozen metadata value
 *   TT.Parts.sevenSegMaskBits(mask)      // mask | boolean[] -> [a,b,c,d,e,f,g]
 *   TT.Parts.sevenSegMaskForDigit(v)     // 0..15 -> active-high a..g mask
 *   TT.Parts.SEVEN_SEG_MASKS             // 0..15 mask table
 *
 * Locale keys used by the museum are `museum.<id>.name|formula|notes`; `name` and
 * `formula` are also provided as English fallbacks so the UI can render today.
 *
 * Colour parameters accept either a hex string or a name from TT.Parts.colors
 * ('cyan', 'mint', 'amber', 'magenta', …).
 * ---------------------------------------------------------------------------
 */

TT.Parts = (function () {
  'use strict'

  // ------------------------------------------------------------------ constants
  const TAU = Math.PI * 2
  const FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'

  /** Palette-independent colours (hex strings) so 15-parts never depends on 00-core. */
  const COLORS = Object.freeze({
    void0: '#03060c',
    void1: '#071120',
    space: '#0a1a2e',
    die: '#0d2237',
    dark: '#04121c',
    cyan: '#56e1ff',
    cyanDim: '#2a8fb0',
    mint: '#2be6c2',
    green: '#5dffa8',
    amber: '#ffc35c',
    orange: '#ff9a4d',
    magenta: '#ff6ad5',
    red: '#ff5d6c',
    blue: '#6ea8ff',
    gold: '#ffd479',
    ink: '#e8f6ff',
    dim: '#8fb3c8',
    faint: '#4d738a',
    nand: '#7ce9ff',
    nft: '#ffd479',
    latch: '#c98bff',
    gate: '#123249',
    gateEdge: '#2a7ea8',
  })

  const GATE_KINDS = Object.freeze(['not', 'and', 'or', 'xor', 'nand', 'mux', 'dff', 'decoder'])

  /** Standard active-high 7-segment patterns, same order as TT.UI.sevenSegmentMap. */
  const SEVEN_SEG_MASKS = Object.freeze([
    0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07,
    0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71,
  ])

  // -------------------------------------------------------------------- helpers
  function read(source, fallback) {
    if (typeof source === 'function') {
      const value = source()
      return value === undefined ? fallback : value
    }
    return source === undefined ? fallback : source
  }

  function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value
  }

  function toInt(value, fallback) {
    const n = typeof value === 'number' ? value : Number(value)
    return n === n && n !== Infinity && n !== -Infinity ? Math.round(n) : fallback
  }

  function isOn(value) {
    if (value === true) return true
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') return value === '1' || value === 'true' || value === 'on'
    return Boolean(value)
  }

  function colorValue(value, fallback) {
    if (typeof value === 'string' && value) return COLORS[value] || value
    const fb = typeof fallback === 'string' && fallback ? fallback : 'cyan'
    return COLORS[fb] || COLORS.cyan
  }

  function parseColor(value, fallback) {
    const str = colorValue(value, fallback)
    if (str.charAt(0) === '#') {
      const hex = str.slice(1)
      if (hex.length === 3) {
        return [
          parseInt(hex.charAt(0) + hex.charAt(0), 16),
          parseInt(hex.charAt(1) + hex.charAt(1), 16),
          parseInt(hex.charAt(2) + hex.charAt(2), 16),
        ]
      }
      if (hex.length === 6 || hex.length === 8) {
        return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
      }
    }
    const match = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(str)
    if (match) return [Number(match[1]), Number(match[2]), Number(match[3])]
    return [86, 225, 255]
  }

  function rgba(rgb, alpha) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')'
  }

  const fontCache = new Map()

  function fontOf(size, weight) {
    const px = clamp(Math.round(size), 6, 72)
    const key = (weight || 600) + ':' + px
    let value = fontCache.get(key)
    if (value === undefined) {
      value = (weight || 600) + ' ' + px + 'px ' + FONT_STACK
      fontCache.set(key, value)
    }
    return value
  }

  function pxScale(px) {
    if (px && typeof px.scale === 'number' && px.scale > 0) return px.scale
    if (px && typeof px.unit === 'number' && px.unit > 0) return px.unit
    return 24
  }

  function pxUnit(px) {
    if (px && typeof px.unit === 'number' && px.unit > 0) return px.unit
    return pxScale(px)
  }

  function pxAlpha(px) {
    return px && typeof px.alpha === 'number' ? clamp(px.alpha, 0, 1) : 1
  }

  /** Rounded-rect path (no reliance on ctx.roundRect). Leaves the path open for fill/stroke. */
  function roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, Math.min(width, height) * 0.5))
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function fillRoundRect(ctx, x, y, width, height, radius) {
    roundRectPath(ctx, x, y, width, height, radius)
    ctx.fill()
  }

  function strokeRoundRect(ctx, x, y, width, height, radius) {
    roundRectPath(ctx, x, y, width, height, radius)
    ctx.stroke()
  }

  // Cached additive-glow sprites (created once per colour; drawImage per frame).
  const glowCache = new Map()

  function glowSprite(rgb) {
    const key = rgb[0] + ',' + rgb[1] + ',' + rgb[2]
    if (glowCache.has(key)) return glowCache.get(key)
    let sprite = null
    if (typeof document !== 'undefined' && document && document.createElement) {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const g = canvas.getContext('2d')
        if (g) {
          const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
          grad.addColorStop(0, 'rgba(' + key + ',1)')
          grad.addColorStop(0.35, 'rgba(' + key + ',0.5)')
          grad.addColorStop(1, 'rgba(' + key + ',0)')
          g.fillStyle = grad
          g.fillRect(0, 0, 64, 64)
          sprite = canvas
        }
      } catch (err) {
        sprite = null
      }
    }
    glowCache.set(key, sprite)
    return sprite
  }

  /** Additive-ish soft glow centred on (0,0) — cached sprite in the browser, gradient fallback in tests. */
  function drawGlow(ctx, px, rgb, radius, strength) {
    const alpha = pxAlpha(px) * strength
    if (!(alpha > 0) || !(radius > 0)) return
    const sprite = glowSprite(rgb)
    if (sprite) {
      ctx.globalAlpha = alpha
      ctx.drawImage(sprite, -radius, -radius, radius * 2, radius * 2)
      return
    }
    if (typeof ctx.createRadialGradient !== 'function') return
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, radius))
    grad.addColorStop(0, rgba(rgb, 0.85))
    grad.addColorStop(0.45, rgba(rgb, 0.3))
    grad.addColorStop(1, rgba(rgb, 0))
    ctx.globalAlpha = alpha
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(0, 0, Math.max(1, radius), 0, TAU)
    ctx.fill()
  }

  function maskBits(mask) {
    const out = [false, false, false, false, false, false, false]
    if (Array.isArray(mask)) {
      for (let i = 0; i < 7; i += 1) out[i] = Boolean(mask[i])
      return out
    }
    const value = toInt(mask, 0)
    for (let i = 0; i < 7; i += 1) out[i] = ((value >> i) & 1) === 1
    return out
  }

  function popcount7(bits) {
    let n = 0
    for (let i = 0; i < 7; i += 1) if (bits[i]) n += 1
    return n
  }

  function sevenSegMaskBits(mask) {
    return maskBits(mask)
  }

  function sevenSegMaskForDigit(value) {
    const digit = clamp(toInt(value, 0), 0, 15)
    return SEVEN_SEG_MASKS[digit]
  }

  // ------------------------------------------------------------------ sprites

  // ---- LED ----------------------------------------------------------------
  function led(getOn, color) {
    const rgb = parseColor(color, 'mint')
    const bodyOn = colorValue(color, 'mint')
    const bodyOff = 'rgba(8,20,32,0.94)'
    const ring = rgba(rgb, 0.9)
    return function drawLed(ctx, px) {
      const alpha = pxAlpha(px)
      const r = Math.max(5, pxScale(px) * 0.4)
      ctx.save()
      ctx.globalAlpha = alpha
      drawGlow(ctx, px, rgb, r * 2.8, isOn(read(getOn, 0)) ? 0.55 : 0.16)
      const on = isOn(read(getOn, 0))
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, TAU)
      ctx.fillStyle = on ? bodyOn : bodyOff
      ctx.fill()
      ctx.lineWidth = Math.max(1, r * 0.22)
      ctx.strokeStyle = ring
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.42, 0, TAU)
      ctx.fillStyle = on ? 'rgba(4,18,28,0.9)' : rgba(rgb, 0.3)
      ctx.fill()
      ctx.font = fontOf(Math.max(7, r * 0.9))
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = on ? 'rgba(4,18,28,0.95)' : rgba(rgb, 0.85)
      ctx.fillText(on ? '1' : '0', 0, 0)
      ctx.restore()
    }
  }

  // ---- seven-segment tube -------------------------------------------------
  // Segment layout (same a..g order as TT.UI.sevenSegmentMap):
  //   a top, b top-right, c bottom-right, d bottom, e bottom-left, f top-left, g middle.
  function sevenSeg(getMask, getGhost) {
    const onCore = '#ffc35c' // counted by tests; keep as a plain hex string
    const onGlow = 'rgba(255,195,92,1)'
    const offColor = 'rgba(255,195,92,0.09)'
    const ghostColor = 'rgba(255,195,92,0.22)'
    return function drawSevenSeg(ctx, px) {
      const alpha = pxAlpha(px)
      const bits = maskBits(read(getMask, 0))
      const ghostRaw = getGhost === undefined ? null : read(getGhost, null)
      const ghost = ghostRaw === null || ghostRaw === undefined ? null : maskBits(ghostRaw)
      const w = Math.max(11, pxScale(px) * 0.85)
      const h = w * 1.6
      const t = Math.max(2, w * 0.13)
      const seg = [
        [-w * 0.30, -h * 0.44, w * 0.60, t],
        [w * 0.30, -h * 0.40, t, h * 0.36],
        [w * 0.30, h * 0.04, t, h * 0.36],
        [-w * 0.30, h * 0.44 - t, w * 0.60, t],
        [-w * 0.30 - t, h * 0.04, t, h * 0.36],
        [-w * 0.30 - t, -h * 0.40, t, h * 0.36],
        [-w * 0.30, -t * 0.5, w * 0.60, t],
      ]
      ctx.save()
      // backplate
      ctx.globalAlpha = alpha
      ctx.fillStyle = 'rgba(4,12,20,0.88)'
      fillRoundRect(ctx, -w * 0.62, -h * 0.56, w * 1.24, h * 1.12, w * 0.16)
      ctx.lineWidth = Math.max(1, w * 0.05)
      ctx.strokeStyle = 'rgba(255,195,92,0.28)'
      strokeRoundRect(ctx, -w * 0.62, -h * 0.56, w * 1.24, h * 1.12, w * 0.16)
      // off state of every segment keeps the tube legible
      ctx.fillStyle = offColor
      for (let i = 0; i < 7; i += 1) {
        ctx.globalAlpha = alpha
        fillRoundRect(ctx, seg[i][0], seg[i][1], seg[i][2], seg[i][3], t * 0.5)
      }
      if (ghost) {
        ctx.fillStyle = ghostColor
        for (let i = 0; i < 7; i += 1) {
          if (!ghost[i]) continue
          ctx.globalAlpha = alpha
          fillRoundRect(ctx, seg[i][0], seg[i][1], seg[i][2], seg[i][3], t * 0.5)
        }
      }
      // lit segments: soft halo + bright core
      for (let i = 0; i < 7; i += 1) {
        if (!bits[i]) continue
        const s = seg[i]
        ctx.globalAlpha = alpha * 0.22
        ctx.fillStyle = onGlow
        fillRoundRect(ctx, s[0] - t * 0.45, s[1] - t * 0.45, s[2] + t * 0.9, s[3] + t * 0.9, t * 0.8)
        ctx.globalAlpha = alpha * 0.95
        ctx.fillStyle = onCore
        fillRoundRect(ctx, s[0], s[1], s[2], s[3], t * 0.5)
      }
      ctx.restore()
    }
  }

  // ---- logic-gate symbol --------------------------------------------------
  function gatePath(ctx, kind, s) {
    if (kind === 'not') {
      ctx.beginPath()
      ctx.moveTo(-0.45 * s, -0.52 * s)
      ctx.lineTo(-0.45 * s, 0.52 * s)
      ctx.lineTo(0.33 * s, 0)
      ctx.closePath()
      return
    }
    if (kind === 'and' || kind === 'nand') {
      ctx.beginPath()
      ctx.moveTo(-0.52 * s, -0.52 * s)
      ctx.lineTo(-0.05 * s, -0.52 * s)
      ctx.quadraticCurveTo(0.48 * s, -0.5 * s, 0.48 * s, 0)
      ctx.quadraticCurveTo(0.48 * s, 0.5 * s, -0.05 * s, 0.52 * s)
      ctx.lineTo(-0.52 * s, 0.52 * s)
      ctx.closePath()
      return
    }
    if (kind === 'or' || kind === 'xor') {
      ctx.beginPath()
      ctx.moveTo(-0.55 * s, -0.5 * s)
      ctx.quadraticCurveTo(-0.12 * s, -0.45 * s, 0.5 * s, 0)
      ctx.quadraticCurveTo(-0.12 * s, 0.45 * s, -0.55 * s, 0.5 * s)
      ctx.quadraticCurveTo(-0.3 * s, 0, -0.55 * s, -0.5 * s)
      ctx.closePath()
      return
    }
    if (kind === 'mux') {
      ctx.beginPath()
      ctx.moveTo(-0.55 * s, -0.55 * s)
      ctx.lineTo(0.45 * s, -0.3 * s)
      ctx.lineTo(0.45 * s, 0.3 * s)
      ctx.lineTo(-0.55 * s, 0.55 * s)
      ctx.closePath()
      return
    }
    if (kind === 'dff') {
      roundRectPath(ctx, -0.5 * s, -0.58 * s, 0.95 * s, 1.16 * s, 0.1 * s)
      return
    }
    // decoder (+ unknown fallback)
    roundRectPath(ctx, -0.55 * s, -0.5 * s, 1.0 * s, 1.0 * s, 0.1 * s)
  }

  function gatePins(ctx, kind, s, color) {
    ctx.strokeStyle = color
    ctx.lineWidth = Math.max(1, s * 0.045)
    const line = function (x0, y0, x1, y1) {
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    }
    if (kind === 'not') {
      line(-0.95 * s, 0, -0.45 * s, 0)
      line(0.57 * s, 0, 0.95 * s, 0)
      return
    }
    if (kind === 'and' || kind === 'nand') {
      line(-0.95 * s, -0.22 * s, -0.52 * s, -0.22 * s)
      line(-0.95 * s, 0.22 * s, -0.52 * s, 0.22 * s)
      line((kind === 'nand' ? 0.72 : 0.48) * s, 0, 0.95 * s, 0)
      return
    }
    if (kind === 'or' || kind === 'xor') {
      line(-0.95 * s, -0.2 * s, -0.44 * s, -0.2 * s)
      line(-0.95 * s, 0.2 * s, -0.44 * s, 0.2 * s)
      line(0.5 * s, 0, 0.95 * s, 0)
      return
    }
    if (kind === 'mux') {
      line(-0.95 * s, -0.2 * s, -0.55 * s, -0.2 * s)
      line(-0.95 * s, 0.2 * s, -0.55 * s, 0.2 * s)
      line(0.45 * s, 0, 0.95 * s, 0)
      line(0, 0.43 * s, 0, 0.8 * s)
      return
    }
    if (kind === 'dff') {
      line(-0.95 * s, -0.3 * s, -0.5 * s, -0.3 * s)
      line(-0.95 * s, 0.3 * s, -0.5 * s, 0.3 * s)
      line(0.45 * s, -0.3 * s, 0.95 * s, -0.3 * s)
      line(0.45 * s, 0.3 * s, 0.95 * s, 0.3 * s)
      // clock wedge
      ctx.beginPath()
      ctx.moveTo(-0.5 * s, 0.16 * s)
      ctx.lineTo(-0.36 * s, 0.3 * s)
      ctx.lineTo(-0.5 * s, 0.44 * s)
      ctx.stroke()
      return
    }
    // decoder: 2 inputs, 4 outputs
    line(-0.95 * s, -0.12 * s, -0.55 * s, -0.12 * s)
    line(-0.95 * s, 0.12 * s, -0.55 * s, 0.12 * s)
    for (let i = 0; i < 4; i += 1) {
      const y = (-0.3 + i * 0.2) * s
      line(0.45 * s, y, 0.95 * s, y)
    }
  }

  function gate(kind, getOn, color, opts) {
    const options = opts || {}
    const label = typeof kind === 'string' && kind ? kind : 'and'
    const rgb = parseColor(color, 'mint')
    const edge = rgba(rgb, 0.95)
    const captionText = label === 'decoder' ? '2→4' : label.toUpperCase()
    return function drawGate(ctx, px, timeMs) {
      const alpha = pxAlpha(px)
      const s = Math.max(13, pxScale(px) * 0.9)
      const on = isOn(read(getOn, 0))
      const pulse = on ? 0.55 + 0.45 * Math.sin((timeMs || 0) * 0.006) : 0
      ctx.save()
      ctx.globalAlpha = alpha
      if (on) drawGlow(ctx, px, rgb, s * 1.9, 0.22 + pulse * 0.2)
      ctx.globalAlpha = alpha
      gatePath(ctx, label, s)
      ctx.fillStyle = on ? rgba(rgb, 0.18) : 'rgba(6,18,30,0.9)'
      ctx.fill()
      ctx.lineWidth = Math.max(1.2, s * 0.055)
      ctx.strokeStyle = edge
      ctx.stroke()
      // inversion bubble for NOT / NAND
      if (label === 'not' || label === 'nand') {
        const bx = label === 'not' ? 0.45 * s : 0.6 * s
        ctx.beginPath()
        ctx.arc(bx, 0, 0.12 * s, 0, TAU)
        ctx.fillStyle = 'rgba(6,18,30,0.95)'
        ctx.fill()
        ctx.strokeStyle = edge
        ctx.lineWidth = Math.max(1, s * 0.045)
        ctx.stroke()
      }
      // XOR/OR extra input arc
      if (label === 'xor') {
        ctx.beginPath()
        ctx.moveTo(-0.66 * s, -0.5 * s)
        ctx.quadraticCurveTo(-0.42 * s, 0, -0.66 * s, 0.5 * s)
        ctx.strokeStyle = edge
        ctx.lineWidth = Math.max(1, s * 0.04)
        ctx.stroke()
      }
      gatePins(ctx, label, s, rgba(rgb, 0.6))
      // inner label for the boxy symbols
      if (label === 'dff' || label === 'decoder' || label === 'mux') {
        ctx.font = fontOf(Math.max(7, s * 0.24))
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = rgba(rgb, 0.9)
        ctx.fillText(captionText, 0.02 * s, 0)
      }
      if (options.caption !== false && pxUnit(px) >= 30) {
        ctx.font = fontOf(Math.max(7, s * 0.2))
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.globalAlpha = alpha * 0.8
        ctx.fillStyle = rgba(rgb, 0.8)
        ctx.fillText(captionText, 0, 1.02 * s)
      }
      ctx.restore()
    }
  }

  // ---- NAND token chip ----------------------------------------------------
  function chip(getMinted, color) {
    const mintedRgb = parseColor(color, 'cyan')
    const unmintedRgb = parseColor(COLORS.amber)
    const mintedHex = colorValue(color, 'cyan')
    return function drawChip(ctx, px, timeMs) {
      const alpha = pxAlpha(px)
      const r = Math.max(5, pxScale(px) * 0.42)
      const minted = getMinted === undefined ? true : isOn(read(getMinted, true))
      const rgb = minted ? mintedRgb : unmintedRgb
      const t = timeMs || 0
      ctx.save()
      ctx.globalAlpha = alpha
      drawGlow(ctx, px, rgb, r * 3, minted ? 0.16 : 0.42 + 0.12 * Math.sin(t * 0.006))
      ctx.globalAlpha = alpha
      ctx.beginPath()
      for (let i = 0; i < 6; i += 1) {
        const a = -Math.PI / 2 + (Math.PI / 3) * i
        const x = Math.cos(a) * r
        const y = Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = minted ? 'rgba(11,40,56,0.95)' : 'rgba(36,28,8,0.92)'
      ctx.fill()
      ctx.lineWidth = Math.max(1, r * 0.16)
      ctx.strokeStyle = rgba(rgb, 0.95)
      ctx.stroke()
      // inner rim
      ctx.beginPath()
      for (let i = 0; i < 6; i += 1) {
        const a = -Math.PI / 2 + (Math.PI / 3) * i
        const x = Math.cos(a) * r * 0.64
        const y = Math.sin(a) * r * 0.64
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.lineWidth = Math.max(0.8, r * 0.06)
      ctx.strokeStyle = rgba(rgb, minted ? 0.4 : 0.5)
      ctx.stroke()
      // travelling spark on the rim for a "live token" feel
      if (minted && r > 8) {
        const a0 = (t * 0.0015) % TAU
        ctx.beginPath()
        ctx.arc(0, 0, r * 0.86, a0, a0 + 0.7)
        ctx.lineWidth = Math.max(1, r * 0.09)
        ctx.strokeStyle = rgba(rgb, 0.55)
        ctx.stroke()
      }
      ctx.font = fontOf(Math.max(6, r * 0.9))
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = minted ? mintedHex : COLORS.gold
      ctx.fillText('∧', 0, 0)
      if (pxUnit(px) >= 34) {
        ctx.font = fontOf(Math.max(6, r * 0.42))
        ctx.globalAlpha = alpha * 0.85
        ctx.fillStyle = rgba(rgb, 0.85)
        ctx.fillText('NAND', 0, r * 0.52)
      }
      ctx.restore()
    }
  }

  // ---- rover / van (top-down) --------------------------------------------
  function rover(getState) {
    const safeRgb = parseColor(COLORS.mint)
    const warnRgb = parseColor(COLORS.amber)
    const stopRgb = parseColor(COLORS.red)
    const headRgb = parseColor(COLORS.gold)
    return function drawRover(ctx, px, timeMs) {
      const state = read(getState, null) || {}
      const alpha = pxAlpha(px)
      const L = Math.max(16, pxScale(px) * 0.95)
      const heading = typeof state.heading === 'number' ? state.heading : 0
      const mode = typeof state.mode === 'string'
        ? state.mode
        : state.stopped === true || state.safe === false
          ? 'stop'
          : state.warn === true
            ? 'warn'
            : 'safe'
      const rgb = mode === 'stop' ? stopRgb : mode === 'warn' ? warnRgb : safeRgb
      const edge = rgba(rgb, 0.95)
      const moving = state.moving === true || mode === 'safe'
      ctx.save()
      ctx.globalAlpha = alpha
      // ground shadow
      ctx.save()
      ctx.scale(1, 0.45)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.beginPath()
      ctx.arc(0, L * 0.85, L * 0.62, 0, TAU)
      ctx.fill()
      ctx.restore()
      ctx.save()
      ctx.rotate(heading)
      // headlight cones
      if (moving && typeof ctx.createLinearGradient === 'function') {
        const grad = ctx.createLinearGradient(0, -L * 0.4, 0, -L * 1.35)
        grad.addColorStop(0, rgba(headRgb, 0.4))
        grad.addColorStop(1, rgba(headRgb, 0))
        ctx.globalAlpha = alpha
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.moveTo(-L * 0.3, -L * 0.42)
        ctx.lineTo(-L * 0.56, -L * 1.35)
        ctx.lineTo(-L * 0.04, -L * 1.35)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(L * 0.3, -L * 0.42)
        ctx.lineTo(L * 0.04, -L * 1.35)
        ctx.lineTo(L * 0.56, -L * 1.35)
        ctx.closePath()
        ctx.fill()
      }
      // wheels
      ctx.fillStyle = 'rgba(2,8,14,0.95)'
      ctx.fillRect(-L * 0.44, -L * 0.52, L * 0.16, L * 0.26)
      ctx.fillRect(L * 0.28, -L * 0.52, L * 0.16, L * 0.26)
      ctx.fillRect(-L * 0.44, L * 0.24, L * 0.16, L * 0.26)
      ctx.fillRect(L * 0.28, L * 0.24, L * 0.16, L * 0.26)
      // body
      ctx.globalAlpha = alpha
      ctx.fillStyle = 'rgba(8,22,34,0.96)'
      fillRoundRect(ctx, -L * 0.34, -L * 0.55, L * 0.68, L * 1.1, L * 0.16)
      ctx.lineWidth = Math.max(1.2, L * 0.055)
      ctx.strokeStyle = edge
      strokeRoundRect(ctx, -L * 0.34, -L * 0.55, L * 0.68, L * 1.1, L * 0.16)
      // windshield / roof panel
      ctx.fillStyle = rgba(rgb, 0.18)
      fillRoundRect(ctx, -L * 0.24, -L * 0.36, L * 0.48, L * 0.3, L * 0.08)
      ctx.fillStyle = 'rgba(4,14,22,0.9)'
      fillRoundRect(ctx, -L * 0.22, -L * 0.02, L * 0.44, L * 0.42, L * 0.08)
      // NAND token on the roof
      ctx.beginPath()
      for (let i = 0; i < 6; i += 1) {
        const a = -Math.PI / 2 + (Math.PI / 3) * i
        const x = Math.cos(a) * L * 0.1
        const y = Math.sin(a) * L * 0.1 + L * 0.19
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = rgba(safeRgb, 0.22)
      ctx.fill()
      ctx.lineWidth = Math.max(0.8, L * 0.02)
      ctx.strokeStyle = rgba(safeRgb, 0.7)
      ctx.stroke()
      // headlights + tail lights
      ctx.fillStyle = moving ? COLORS.gold : 'rgba(120,140,150,0.6)'
      ctx.beginPath()
      ctx.arc(-L * 0.22, -L * 0.46, L * 0.06, 0, TAU)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(L * 0.22, -L * 0.46, L * 0.06, 0, TAU)
      ctx.fill()
      ctx.fillStyle = mode === 'stop' ? COLORS.red : 'rgba(255,93,108,0.55)'
      ctx.fillRect(-L * 0.24, L * 0.5, L * 0.14, L * 0.05)
      ctx.fillRect(L * 0.1, L * 0.5, L * 0.14, L * 0.05)
      // antenna blink
      const blink = 0.5 + 0.5 * Math.sin((timeMs || 0) * 0.008)
      ctx.globalAlpha = alpha * (0.35 + 0.5 * blink)
      ctx.fillStyle = rgba(rgb, 0.9)
      ctx.beginPath()
      ctx.arc(L * 0.3, -L * 0.62, L * 0.045, 0, TAU)
      ctx.fill()
      ctx.restore()
      // "stop" ring
      if (mode === 'stop') {
        ctx.globalAlpha = alpha * 0.6
        ctx.strokeStyle = rgba(stopRgb, 0.8)
        ctx.lineWidth = Math.max(1, L * 0.03)
        ctx.beginPath()
        ctx.arc(0, 0, L * 0.72, 0, TAU)
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  // ---- 4×4 RAM panel ------------------------------------------------------
  function ramGrid(getState) {
    const cyanRgb = parseColor(COLORS.cyan)
    const amberRgb = parseColor(COLORS.amber)
    const mintRgb = parseColor(COLORS.mint)
    return function drawRamGrid(ctx, px, timeMs) {
      const raw = read(getState, null)
      const state = Array.isArray(raw) ? { cells: raw } : raw || {}
      const cells = state.cells || state.values || []
      const pc = toInt(state.pc, -1)
      const accessed = toInt(state.accessed == null ? -1 : state.accessed, -1)
      const alpha = pxAlpha(px)
      const total = Math.max(28, pxScale(px) * 1.15)
      const pad = total * 0.08
      const gap = total * 0.045
      const cell = (total - pad * 2 - gap * 3) / 4
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = 'rgba(4,14,24,0.9)'
      fillRoundRect(ctx, -total * 0.5, -total * 0.5, total, total, total * 0.08)
      ctx.lineWidth = Math.max(1, total * 0.012)
      ctx.strokeStyle = rgba(cyanRgb, 0.3)
      strokeRoundRect(ctx, -total * 0.5, -total * 0.5, total, total, total * 0.08)
      for (let i = 0; i < 16; i += 1) {
        const row = Math.floor(i / 4)
        const col = i % 4
        const x = -total * 0.5 + pad + col * (cell + gap)
        const y = -total * 0.5 + pad + row * (cell + gap)
        const value = clamp(toInt(cells[i], 0), 0, 15)
        const t = value / 15
        // value brightness
        ctx.globalAlpha = alpha * (0.12 + 0.45 * t)
        ctx.fillStyle = cyanRgb
        fillRoundRect(ctx, x, y, cell, cell, cell * 0.18)
        // cell border
        ctx.globalAlpha = alpha * (0.25 + 0.2 * t)
        ctx.strokeStyle = cyanRgb
        ctx.lineWidth = Math.max(0.7, cell * 0.04)
        strokeRoundRect(ctx, x, y, cell, cell, cell * 0.18)
        // accessed cell tint (animated when it is the current access)
        if (i === accessed) {
          const blink = 0.5 + 0.5 * Math.sin((timeMs || 0) * 0.01)
          ctx.globalAlpha = alpha * (0.18 + 0.22 * blink)
          ctx.fillStyle = amberRgb
          fillRoundRect(ctx, x, y, cell, cell, cell * 0.18)
        }
        // 4-bit pips (MSB first, no allocation)
        const pip = cell * 0.13
        const step = cell * 0.185
        const pipY = y + cell - pip * 1.9
        for (let b = 0; b < 4; b += 1) {
          const on = ((value >> (3 - b)) & 1) === 1
          const px0 = x + cell * 0.12 + b * step
          ctx.globalAlpha = alpha * (on ? 0.95 : 0.18)
          ctx.fillStyle = on ? mintRgb : cyanRgb
          ctx.fillRect(px0, pipY, pip, pip)
        }
        // hex digit when the cell is big enough
        if (cell >= 11) {
          ctx.globalAlpha = alpha * 0.9
          ctx.font = fontOf(cell * 0.46)
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = value > 0 ? COLORS.ink : rgba(cyanRgb, 0.5)
          ctx.fillText(value.toString(16).toUpperCase(), x + cell * 0.5, y + cell * 0.34)
        }
        // PC highlight: bright frame + corner ticks
        if (i === pc) {
          ctx.globalAlpha = alpha
          ctx.strokeStyle = COLORS.mint
          ctx.lineWidth = Math.max(1.4, cell * 0.09)
          strokeRoundRect(ctx, x - cell * 0.04, y - cell * 0.04, cell * 1.08, cell * 1.08, cell * 0.2)
        }
      }
      if (pxUnit(px) >= 44) {
        ctx.globalAlpha = alpha * 0.75
        ctx.font = fontOf(Math.max(6, total * 0.1))
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = COLORS.dim
        ctx.fillText('RAM 4×4', 0, total * 0.58)
      }
      ctx.restore()
    }
  }

  // ---- 4-bit register block ----------------------------------------------
  function register(getValue, label) {
    const mintRgb = parseColor(COLORS.mint)
    const cyanRgb = parseColor(COLORS.cyan)
    return function drawRegister(ctx, px, timeMs) {
      const value = clamp(toInt(read(getValue, 0), 0), 0, 15)
      const text = typeof label === 'function' ? String(read(label, 'REG')) : label == null ? 'REG' : String(label)
      const alpha = pxAlpha(px)
      const w = Math.max(40, pxScale(px) * 1.6)
      const h = w * 0.44
      const sq = h * 0.34
      const gap = sq * 0.32
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = 'rgba(4,16,26,0.92)'
      fillRoundRect(ctx, -w * 0.5, -h * 0.5, w, h, h * 0.16)
      ctx.lineWidth = Math.max(1, h * 0.035)
      ctx.strokeStyle = rgba(cyanRgb, 0.5)
      strokeRoundRect(ctx, -w * 0.5, -h * 0.5, w, h, h * 0.16)
      // clock notch
      ctx.beginPath()
      ctx.moveTo(-w * 0.5, -h * 0.12)
      ctx.lineTo(-w * 0.5 + w * 0.035, 0)
      ctx.lineTo(-w * 0.5, h * 0.12)
      ctx.strokeStyle = rgba(cyanRgb, 0.6)
      ctx.lineWidth = Math.max(1, h * 0.025)
      ctx.stroke()
      // label
      ctx.globalAlpha = alpha * 0.9
      ctx.font = fontOf(Math.max(6, h * 0.22))
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = COLORS.ink
      ctx.fillText(text.toUpperCase(), -w * 0.4, -h * 0.27)
      // value hex
      ctx.textAlign = 'right'
      ctx.fillStyle = rgba(mintRgb, 0.9)
      ctx.fillText('0x' + value.toString(16).toUpperCase(), w * 0.42, -h * 0.27)
      // four bit squares, MSB first
      const startX = -w * 0.36
      for (let b = 0; b < 4; b += 1) {
        const bit = (value >> (3 - b)) & 1
        const x = startX + b * (sq + gap)
        ctx.globalAlpha = alpha
        ctx.fillStyle = bit ? COLORS.mint : 'rgba(16,44,60,0.95)'
        fillRoundRect(ctx, x, h * 0.02, sq, sq, sq * 0.22)
        ctx.lineWidth = Math.max(0.8, sq * 0.08)
        ctx.strokeStyle = bit ? 'rgba(255,255,255,0.55)' : rgba(cyanRgb, 0.45)
        strokeRoundRect(ctx, x, h * 0.02, sq, sq, sq * 0.22)
        if (bit) {
          ctx.globalAlpha = alpha * 0.35
          ctx.fillStyle = COLORS.mint
          ctx.fillRect(x + sq * 0.22, h * 0.02 + sq * 0.22, sq * 0.56, sq * 0.56)
        }
      }
      ctx.restore()
    }
  }

  // ---- bus with a travelling packet --------------------------------------
  function busPulse(getActive, color) {
    const rgb = parseColor(color, 'cyan')
    return function drawBus(ctx, px, timeMs) {
      const active = isOn(read(getActive, 0))
      const alpha = pxAlpha(px)
      const w = Math.max(26, pxScale(px) * 1.9)
      const h = Math.max(6, w * 0.14)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = 'rgba(8,26,40,0.92)'
      ctx.fillRect(-w * 0.5, -h * 0.5, w, h)
      ctx.strokeStyle = rgba(rgb, 0.45)
      ctx.lineWidth = Math.max(0.8, h * 0.08)
      ctx.strokeRect(-w * 0.5, -h * 0.5, w, h)
      // tap ticks
      ctx.globalAlpha = alpha * 0.5
      for (let i = 0; i <= 6; i += 1) {
        const x = -w * 0.5 + (i / 6) * w
        ctx.beginPath()
        ctx.moveTo(x, h * 0.5)
        ctx.lineTo(x, h * 0.5 + h * 0.28)
        ctx.stroke()
      }
      if (active) {
        const u = ((timeMs || 0) * 0.0006) % 1
        const x = -w * 0.5 + u * w
        drawGlow(ctx, px, rgb, h * 1.8, 0.5)
        ctx.globalAlpha = alpha
        ctx.fillStyle = COLORS.ink
        ctx.fillRect(x - h * 0.32, -h * 0.45, h * 0.64, h * 0.9)
      }
      ctx.restore()
    }
  }

  const sprite = Object.freeze({
    led: led,
    sevenSeg: sevenSeg,
    gate: gate,
    chip: chip,
    rover: rover,
    ramGrid: ramGrid,
    register: register,
    busPulse: busPulse,
  })

  // ------------------------------------------------------------------- museum
  function museumEntry(id, name, formula, gates, build) {
    return Object.freeze({
      id: id,
      nameKey: 'museum.' + id + '.name',
      formulaKey: 'museum.' + id + '.formula',
      notesKey: 'museum.' + id + '.notes',
      name: name,
      formula: formula,
      gates: gates,
      build: build,
    })
  }

  const museum = Object.freeze([
    museumEntry('notGate', 'NOT gate', 'Y = ¬A', 1, 'notGate'),
    museumEntry('andGate', 'AND gate', 'Y = A · B', 2, 'andGate'),
    museumEntry('orGate', 'OR gate', 'Y = A + B', 3, 'orGate'),
    museumEntry('xorGate', 'XOR gate', 'Y = A ⊕ B', 4, 'xorGate'),
    museumEntry('nandGate', 'NAND gate', 'Y = ¬(A · B)', 1, 'nandGate'),
    museumEntry('mux2', '2:1 multiplexer', 'Y = S ? B : A', 3, 'mux2'),
    museumEntry('decoder2to4', '2-to-4 decoder', 'Y_i = (A = i)', 6, 'decoder2to4'),
    museumEntry('halfAdder', 'Half adder', 'S = A ⊕ B, C = A · B', 5, 'halfAdder'),
    museumEntry('fullAdder', 'Full adder', 'S = A ⊕ B ⊕ Cin, Co = AB + Cin(A ⊕ B)', 9, 'fullAdder'),
    museumEntry('srLatch', 'SR latch', 'Q = ¬(S · Q̄), Q̄ = ¬(R · Q)', 2, 'srLatch'),
    Object.freeze({
      id: 'counter4',
      nameKey: 'museum.counter4.name',
      formulaKey: 'museum.counter4.formula',
      notesKey: 'museum.counter4.notes',
      name: '4-bit counter',
      formula: 'Q⁺ = Q + 1 · 4 latches',
      gates: null,
      build: 'counter4',
      latches: 4,
    }),
    museumEntry('sevenSegment', '7-segment driver', '7 NAND per segment ≈ 100 gates', 100, 'sevenSegment'),
  ])

  const museumById = Object.freeze(museum.reduce(function (map, entry) {
    map[entry.id] = entry
    return map
  }, {}))

  /**
   * Gate count for a museum exhibit. Prefers the live TT.Circuit canonical builder
   * when available (lazy reference: 20-circuit.js loads after this file); falls back
   * to the frozen metadata number. Returns null when neither is known.
   */
  function museumGates(entryOrId) {
    const entry = typeof entryOrId === 'string' ? museumById[entryOrId] : entryOrId
    if (!entry) return null
    const circuit = TT && TT.Circuit
    const canonical = circuit && circuit.canonical
    const builder = canonical && entry.build ? canonical[entry.build] : null
    if (typeof builder === 'function' && typeof circuit.gateCount === 'function') {
      try {
        const netlist = builder()
        const count = circuit.gateCount(netlist)
        if (typeof count === 'number' && count === count) return count
      } catch (err) {
        // fall through to the frozen metadata
      }
    }
    return entry.gates == null ? null : entry.gates
  }

  return Object.freeze({
    colors: COLORS,
    GATE_KINDS: GATE_KINDS,
    SEVEN_SEG_MASKS: SEVEN_SEG_MASKS,
    sprite: sprite,
    museum: museum,
    museumById: museumById,
    museumGates: museumGates,
    sevenSegMaskBits: sevenSegMaskBits,
    sevenSegMaskForDigit: sevenSegMaskForDigit,
    // small pure helpers, handy for UI/tests
    gateCount: popcount7,
    clamp: clamp,
  })
})()
