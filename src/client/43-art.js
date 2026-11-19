/**
 * 43-art — circuit-state driven generative art. Each block advances the circuit
 * state; the state deterministically derives a frame. Frames can be exported as
 * PNG and "minted" into a local gallery with a verifiable artwork code.
 */

TT.Art = (function () {
  const PALETTES = [
    {
      id: 'cyber',
      nameKey: 'art.palette.cyber',
      bg: ['#050b14', '#0a1730'],
      fg: ['#56e1ff', '#2be6c2', '#ffc35c', '#ff6ad5', '#8fb3c8'],
      accent: '#ffc35c',
    },
    {
      id: 'riso',
      nameKey: 'art.palette.riso',
      bg: ['#f4efe4', '#e8dfcc'],
      fg: ['#1f3a8a', '#e4572e', '#f3c300', '#2a9d8f', '#264653'],
      accent: '#e4572e',
    },
    {
      id: 'mono',
      nameKey: 'art.palette.mono',
      bg: ['#0b0b0b', '#191919'],
      fg: ['#f2f2f2', '#9a9a9a', '#5c5c5c', '#d4d4d4', '#7a7a7a'],
      accent: '#f2f2f2',
    },
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

  function rng(seed) {
    let state = seed >>> 0 || 1
    return () => {
      state ^= state << 13
      state ^= state >>> 17
      state ^= state << 5
      state >>>= 0
      return state / 4294967296
    }
  }

  function circuitState(seed, circuit, index) {
    if (circuit === 'lfsr8') {
      let state = hash32(seed) & 0xff || 0x5a
      for (let i = 0; i < index; i += 1) {
        const feedback = ((state >> 7) ^ (state >> 5) ^ (state >> 4) ^ (state >> 3)) & 1
        state = ((state << 1) | feedback) & 0xff
      }
      return state & 0xff
    }
    if (circuit === 'counter4') {
      const netlist = TT.Circuit.canonical.counter4()
      let state = 0
      for (let i = 0; i < index; i += 1) {
        state = TT.Circuit.step(netlist, 0, state).stateBits & 15
      }
      return state
    }
    return hash32(seed + '|gates|' + index) & 0xff
  }

  function params(options) {
    const seed = String(options.seed || 'tapeout')
    const circuit = options.circuit === 'counter4' ? 'counter4' : options.circuit === 'gates' ? 'gates' : 'lfsr8'
    const paletteIndex = Math.max(0, Math.min(PALETTES.length - 1, Number(options.palette) || 0))
    const index = Math.max(0, Number(options.index) || 0)
    const state = circuitState(seed, circuit, index)
    const next = rng(hash32(seed + '|' + circuit + '|' + paletteIndex + '|' + index) || 1)
    const grid = 8 + Math.floor(next() * 5)
    const cellCount = grid * grid
    const cells = []
    for (let i = 0; i < cellCount; i += 1) cells.push(Math.floor(next() * 5))
    const rings = 3 + Math.floor(next() * 4)
    const rotation = Math.floor(next() * 360)
    const density = 0.25 + next() * 0.6
    const frame = {
      schema: 'dsh-tapelab.art.v1',
      seed,
      circuit,
      palette: paletteIndex,
      index,
      state,
      grid,
      cells,
      rings,
      rotation,
      density,
    }
    frame.hash = hash32(JSON.stringify(frame)).toString(16).padStart(8, '0')
    return frame
  }

  function b64url(text) {
    return TT.Export.b64encode(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  function unb64url(code) {
    const base64 = String(code || '').trim().replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return TT.Export.b64decode(padded)
  }

  function artworkCode(frame) {
    const payload = {
      schema: 'dsh-tapelab.art.v1',
      seed: frame.seed,
      circuit: frame.circuit,
      palette: frame.palette,
      index: frame.index,
      hash: frame.hash,
    }
    return b64url(JSON.stringify(payload))
  }

  function verify(code, expectedHash) {
    const reasons = []
    let payload
    try {
      payload = JSON.parse(unb64url(code))
    } catch (error) {
      return { ok: false, reasons: ['作品码无法解码'], payload: null }
    }
    if (!payload || payload.schema !== 'dsh-tapelab.art.v1') return { ok: false, reasons: ['作品格式不匹配'], payload: null }
    const recomputed = params(payload)
    if (payload.hash && payload.hash !== recomputed.hash) reasons.push('帧哈希不一致（参数可能被篡改）')
    if (expectedHash && String(expectedHash).trim().toLowerCase() !== recomputed.hash) {
      reasons.push(`帧哈希不匹配：作品 ${recomputed.hash}，期望 ${String(expectedHash).trim().toLowerCase()}`)
    }
    return { ok: reasons.length === 0, reasons, payload, frame: recomputed, hash: recomputed.hash }
  }

  /** Deterministic frame drawing shared by the preview, gallery and PNG export. */
  function draw(ctx, frame, size) {
    const palette = PALETTES[frame.palette] || PALETTES[0]
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, palette.bg[0])
    gradient.addColorStop(1, palette.bg[1])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    const cell = size / frame.grid
    for (let row = 0; row < frame.grid; row += 1) {
      for (let col = 0; col < frame.grid; col += 1) {
        const value = frame.cells[row * frame.grid + col]
        if (value === 0) continue
        ctx.fillStyle = palette.fg[value % palette.fg.length]
        ctx.globalAlpha = frame.density
        const x = col * cell
        const y = row * cell
        if (value % 3 === 0) ctx.fillRect(x + cell * 0.08, y + cell * 0.08, cell * 0.84, cell * 0.84)
        else if (value % 3 === 1) {
          ctx.beginPath()
          ctx.arc(x + cell * 0.5, y + cell * 0.5, cell * 0.36, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.moveTo(x + cell * 0.15, y + cell * 0.85)
          ctx.lineTo(x + cell * 0.85, y + cell * 0.15)
          ctx.lineWidth = Math.max(1, cell * 0.12)
          ctx.strokeStyle = palette.fg[value % palette.fg.length]
          ctx.stroke()
        }
      }
    }
    ctx.globalAlpha = 1
    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.rotate((frame.rotation * Math.PI) / 180)
    for (let ring = 0; ring < frame.rings; ring += 1) {
      ctx.beginPath()
      ctx.arc(0, 0, size * (0.12 + ring * 0.055), 0, Math.PI * 1.6)
      ctx.lineWidth = Math.max(1.5, size * 0.006)
      ctx.strokeStyle = palette.accent
      ctx.globalAlpha = 0.55 - ring * 0.08
      ctx.stroke()
    }
    ctx.restore()
    ctx.globalAlpha = 1
    // NAND glyph as the "circuit" signature
    const glyph = size * 0.09
    ctx.save()
    ctx.translate(size - glyph * 2.2, size - glyph * 2.2)
    ctx.strokeStyle = palette.accent
    ctx.lineWidth = Math.max(1.5, size * 0.005)
    ctx.beginPath()
    ctx.moveTo(-glyph * 0.6, -glyph * 0.5)
    ctx.lineTo(glyph * 0.2, -glyph * 0.5)
    ctx.arc(glyph * 0.2, 0, glyph * 0.5, -Math.PI / 2, Math.PI / 2)
    ctx.lineTo(-glyph * 0.6, glyph * 0.5)
    ctx.closePath()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(glyph * 0.75, 0, glyph * 0.12, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    ctx.fillStyle = palette.fg[0]
    ctx.globalAlpha = 0.8
    ctx.font = `${Math.max(9, size * 0.022)}px ui-monospace, monospace`
    ctx.fillText(`${frame.circuit} · state ${String(frame.state).padStart(2, '0')} · frame #${frame.index}`, size * 0.04, size * 0.95)
    ctx.fillText(`seed ${frame.seed.slice(0, 14)} · ${frame.hash}`, size * 0.04, size * 0.975)
    ctx.globalAlpha = 1
  }

  function pngDataUrl(frame, size) {
    const dimension = size || 1024
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = dimension
    canvas.height = dimension
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    draw(ctx, frame, dimension)
    return canvas.toDataURL('image/png')
  }

  return { PALETTES, params, artworkCode, verify, draw, pngDataUrl, hash32, circuitState, b64url, unb64url }
})()

// --------------------------------------------------------------------------- UI

TT.ArtUI = (function () {
  const h = TT.h

  function ArtCanvas(props) {
    const { frame, size } = props
    const ref = React.useRef(null)
    React.useEffect(() => {
      const canvas = ref.current
      if (!canvas || !frame) return
      const ratio = 2
      canvas.width = size * ratio
      canvas.height = size * ratio
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.save()
        ctx.scale(ratio, ratio)
        TT.Art.draw(ctx, frame, size)
        ctx.restore()
      }
    }, [frame, size])
    return h('canvas', {
      ref,
      className: 'tt-artcanvas',
      style: { width: size, height: size },
      'aria-label': `generative art frame ${frame ? frame.index : 0}`,
    })
  }

  function Page(props) {
    const { state, t, api } = props
    const art = state.art
    const frame = TT.Art.params(art)
    return h('div', { className: 'tt-labgrid' },
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('art.title')),
          h('span', null, t('art.sub')),
        ),
        h('div', { className: 'tt-artwrap' },
          h(ArtCanvas, { frame, size: 420 }),
          h('div', { className: 'tt-artbadge' },
            h('span', null, `#${frame.index}`),
            h('span', null, `${frame.circuit} · state ${String(frame.state).padStart(2, '0')}`),
            h('span', null, frame.hash),
          ),
        ),
        h('div', { className: 'tt-labrow' },
          h('button', {
            type: 'button',
            className: 'tt-btn',
            'data-kind': art.playing ? 'active' : 'primary',
            onClick: () => api.dispatch({ type: 'art/play' }),
          }, art.playing ? t('art.pause') : t('art.play')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'art/step' }) }, t('art.step')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
            onClick: () => api.dispatch({ type: 'art/reset' }) }, t('art.reset')),
          h('span', { className: 'tt-lablabel' }, t('art.block')),
        ),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('art.seed')),
          h('input', {
            className: 'tt-archivebox',
            style: { minHeight: 0, height: 30, flex: '1 1 180px' },
            value: art.seed,
            onChange: (event) => api.dispatch({ type: 'art/seed', seed: event.target.value }),
          }),
        ),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('art.circuit')),
          [['lfsr8', 'art.circuit.lfsr'], ['counter4', 'art.circuit.counter'], ['gates', 'art.circuit.gates']].map(([id, key]) =>
            h('button', {
              key: id,
              type: 'button',
              className: 'tt-chip',
              'data-active': art.circuit === id ? 'true' : 'false',
              onClick: () => api.dispatch({ type: 'art/circuit', circuit: id }),
            }, t(key))),
        ),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('art.palette')),
          TT.Art.PALETTES.map((palette, index) =>
            h('button', {
              key: palette.id,
              type: 'button',
              className: 'tt-chip',
              'data-active': art.palette === index ? 'true' : 'false',
              onClick: () => api.dispatch({ type: 'art/palette', palette: index }),
            }, t(palette.nameKey))),
        ),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => {
              const url = TT.Art.pngDataUrl(frame, 1024)
              if (!url || typeof document === 'undefined') {
                api.dispatch({ type: 'toast/show', key: 'art.exportFail', tone: 'warn' })
                return
              }
              const link = document.createElement('a')
              link.href = url
              link.download = `tapeout-art-${frame.hash}.png`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              api.dispatch({ type: 'toast/show', key: 'art.exported', tone: 'good' })
            } }, t('art.exportPng')),
          h('button', { type: 'button', className: 'tt-chip',
            onClick: () => copyText(api, TT.Art.artworkCode(frame)) }, t('art.copyCode')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            onClick: () => api.dispatch({ type: 'art/mint' }) }, t('art.mint')),
          h('span', { className: 'tt-lablabel' }, `${t('art.hash')} ${frame.hash}`),
        ),
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('art.verify.title')),
          h('span', null, t('art.verify.hint')),
        ),
        h('textarea', {
          className: 'tt-archivebox',
          placeholder: t('art.verify.placeholder'),
          value: art.verifyCode || '',
          onChange: (event) => api.dispatch({ type: 'art/verifyCode', code: event.target.value }),
        }),
        h('div', { className: 'tt-labrow' },
          h('input', {
            className: 'tt-archivebox',
            style: { minHeight: 0, height: 30, width: 160 },
            placeholder: t('art.verify.hashPlaceholder'),
            value: art.verifyHash || '',
            onChange: (event) => api.dispatch({ type: 'art/verifyHash', hash: event.target.value }),
          }),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'art/verify' }) }, t('art.verify.run')),
        ),
        art.verifyResult
          ? h('div', { className: 'tt-finalenote', style: { borderLeftColor: art.verifyResult.ok ? 'var(--tt-mint)' : 'var(--tt-red)' } },
              art.verifyResult.ok
                ? `${t('art.verify.pass')} · ${art.verifyResult.hash}`
                : `${t('art.verify.fail')}：${(art.verifyResult.reasons || []).join('；')}`)
          : null,
        h('div', { className: 'tt-labcardhead', style: { marginTop: 6 } },
          h('strong', null, t('art.gallery.title')),
          h('span', null, `${(art.gallery || []).length}/12`),
        ),
        (art.gallery || []).length === 0
          ? h('p', { className: 'tt-labempty' }, t('art.gallery.empty'))
          : h('div', { className: 'tt-artgallery' }, art.gallery.map((entry, index) =>
              h('button', {
                key: index,
                type: 'button',
                className: 'tt-artthumb',
                title: `#${entry.frame.index} · ${entry.frame.hash}`,
                onClick: () => api.dispatch({ type: 'art/load', code: entry.code }),
              }, h(ArtCanvas, { frame: entry.frame, size: 96 })))),
        h('p', { className: 'tt-finalenote', style: { marginTop: 10 } }, t('art.nft')),
      ),
    )
  }

  function copyText(api, text) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => api.dispatch({ type: 'toast/show', key: 'lab.copied', tone: 'good' }),
          () => api.dispatch({ type: 'toast/show', key: 'lab.copyFail', tone: 'warn' }),
        )
        return
      }
    } catch (error) {
      /* fall through */
    }
    api.dispatch({ type: 'toast/show', key: 'lab.copied', tone: 'good' })
  }

  return { Page, ArtCanvas }
})()
