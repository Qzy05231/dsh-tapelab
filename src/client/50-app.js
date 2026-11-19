/**
 * 50-app — controller (store, clock, tape-out timing), the 3D world renderer, and the
 * Client entry that registers the sidebar entry, the main panel and the locale.
 */

const PANEL_ID = 'tapeout-lab'

// ----------------------------------------------------------------------------- controller

TT.App = (function () {
  function create(ctx, t) {
    const boot = TT.Missions.initial()
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('dsh-tapeout-lab:welcomed:v1') === '1') {
        boot.welcome = false
      }
      const savedProgress = typeof localStorage !== 'undefined' ? localStorage.getItem('dsh-tapeout-lab:progress:v1') : null
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress)
        if (parsed && parsed.stats) boot.stats = { ...boot.stats, ...parsed.stats }
        if (parsed && Array.isArray(parsed.unlocked)) boot.unlocked = parsed.unlocked
      }
    } catch (error) {
      /* private mode: show the guide once per session */
    }
    const store = TT.createStore(TT.Missions.reduce(boot, { type: 'chapter/select', index: 0 }))
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dsh-tapeout-lab:library:v1') : null
      if (saved) {
        const library = JSON.parse(saved)
        if (Array.isArray(library) && library.length) {
          const current = store.get()
          store.set({ ...current, lab: { ...current.lab, library } })
        }
      }
    } catch (error) {
      /* private mode / quota: the lab simply starts empty */
    }
    let pendingPort = null
    let tapeTimer = null
    let cinemaTimers = []
    let cinemaInternal = false
    let musicTimer = null
    let pixelTimer = null
    let snakeTimer = null
    let artTimer = null
    let clockTimer = null
    let clockRunning = false
    let world = null

    const get = () => store.get()

    // Remember the first-run guide, records and newly unlocked achievements.
    let syncing = false
    try {
      store.subscribe((state) => {
        if (typeof localStorage !== 'undefined') {
          try {
            if (!state.welcome) localStorage.setItem('dsh-tapeout-lab:welcomed:v1', '1')
            localStorage.setItem('dsh-tapeout-lab:progress:v1', JSON.stringify({ stats: state.stats || {}, unlocked: state.unlocked || [] }))
          } catch (error) {
            /* quota / private mode */
          }
        }
        if (syncing || !TT.Achievements) return
        const fresh = TT.Achievements.doneIds(state)
        if (!fresh.length) return
        syncing = true
        try {
          for (const id of fresh) {
            const item = TT.Achievements.LIST.find((entry) => entry.id === id)
            dispatch({ type: 'achv/unlock', ids: [id], title: item ? t(item.titleKey) : id })
          }
        } finally {
          syncing = false
        }
      })
    } catch (error) {
      /* ignore persistence failures */
    }

    // restore the mute preference and require a gesture before WebAudio starts
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('dsh-tapeout-lab:muted:v1') === '1') {
        const current = store.get()
        store.set({ ...current, soundMuted: true })
      }
    } catch (error) {
      /* ignore */
    }
    if (TT.Audio) TT.Audio.setMuted(store.get().soundMuted)
    if (typeof window !== 'undefined' && window.addEventListener) {
      const unlock = () => {
        if (TT.Audio) TT.Audio.init()
      }
      window.addEventListener('pointerdown', unlock, { once: true, passive: true })
      window.addEventListener('keydown', unlock, { once: true })
    }

    function clearTapeTimer() {
      if (tapeTimer) {
        clearTimeout(tapeTimer)
        tapeTimer = null
      }
    }

    function scheduleTapeDone() {
      clearTapeTimer()
      tapeTimer = setTimeout(() => {
        tapeTimer = null
        dispatch({ type: 'tapeout/done' })
      }, 4200)
    }

    function clearCinemaTimers() {
      for (const timer of cinemaTimers) clearTimeout(timer)
      cinemaTimers = []
    }

    function stopCinema(silent) {
      clearCinemaTimers()
      if (get().cinema) dispatch({ type: 'cinema/set', active: false })
      if (!silent) dispatch({ type: 'toast/show', key: 'cinema.stopped', tone: 'info' })
    }

    function startCinema() {
      if (get().cinema) return
      clearCinemaTimers()
      let at = 200
      const later = (ms, fn) => {
        at += ms
        cinemaTimers.push(setTimeout(fn, at))
      }
      const run = (action, ms) => later(ms || 0, () => {
        cinemaInternal = true
        try {
          dispatch(action)
        } finally {
          cinemaInternal = false
        }
      })
      dispatch({ type: 'cinema/set', active: true })
      dispatch({ type: 'toast/show', key: 'cinema.started', tone: 'info' })
      run({ type: 'chapter/select', index: 0 })
      run({ type: 'intro/close' }, 160)
      run({ type: 'mint/all' }, 260)
      run({ type: 'chapter/select', index: 1 }, 1100)
      run({ type: 'gate/place' }, 280)
      run({ type: 'wire/connect', from: 'in:0', to: 'g:0:a' }, 220)
      run({ type: 'wire/connect', from: 'in:1', to: 'g:0:b' }, 220)
      for (let i = 0; i < 4; i += 1) {
        run({ type: 'input/toggle', index: 0 }, 300)
        run({ type: 'input/toggle', index: 1 }, 150)
      }
      run({ type: 'chapter/select', index: 2 }, 800)
      for (let i = 0; i < 5; i += 1) run({ type: 'gate/place' }, 160)
      for (let i = 0; i < 14; i += 1) run({ type: 'wire/assist' }, 95)
      run({ type: 'chapter/select', index: 3 }, 800)
      run({ type: 'tapeout/start' }, 260)
      run({ type: 'eval/run' }, 4700)
      run({ type: 'chapter/select', index: 4 }, 800)
      run({ type: 'latch/toggle', kind: 'set' }, 300)
      for (let i = 0; i < 4; i += 1) run({ type: 'clock/tick' }, 260)
      run({ type: 'latch/toggle', kind: 'set' }, 220)
      for (let i = 0; i < 4; i += 1) run({ type: 'clock/tick' }, 260)
      run({ type: 'latch/toggle', kind: 'reset' }, 220)
      for (let i = 0; i < 4; i += 1) run({ type: 'clock/tick' }, 260)
      run({ type: 'latch/toggle', kind: 'reset' }, 220)
      for (let i = 0; i < 3; i += 1) run({ type: 'clock/tick' }, 240)
      run({ type: 'chapter/select', index: 5 }, 800)
      for (let i = 0; i < 3; i += 1) run({ type: 'box/place' }, 260)
      for (let i = 0; i < 10; i += 1) run({ type: 'wire/assist' }, 110)
      run({ type: 'lego/tapeout' }, 500)
      run({ type: 'chapter/select', index: 6 }, 900)
      run({ type: 'program/run' }, 300)
      for (let i = 0; i < 6; i += 1) run({ type: 'clock/tick' }, 480)
      run({ type: 'chapter/select', index: 7 }, 900)
      run({ type: 'seg/synth' }, 400)
      run({ type: 'seg/verify' }, 700)
      run({ type: 'seg/tapeout' }, 600)
      run({ type: 'seg/input', index: 0 }, 500)
      run({ type: 'seg/input', index: 1 }, 400)
      run({ type: 'chapter/select', index: 8 }, 900)
      for (let i = 0; i < 16; i += 1) run({ type: 'clock/tick' }, 280)
      run({ type: 'chapter/select', index: 9 }, 900)
      for (let i = 0; i < 3; i += 1) {
        run({ type: 'cpu/select', index: i }, 400)
        run({ type: 'cpu/run' }, 300)
        for (let j = 0; j < 10; j += 1) run({ type: 'clock/tick' }, 260)
      }
      run({ type: 'chapter/select', index: 10 }, 900)
      for (const kind of ['allow', 'slow', 'home', 'stop']) run({ type: 'safety/preset', kind }, 420)
      run({ type: 'safety/audit' }, 500)
      run({ type: 'safety/tapeout' }, 900)
      later(1800, () => {
        clearCinemaTimers()
        dispatch({ type: 'cinema/set', active: false })
        dispatch({ type: 'toast/show', key: 'cinema.done', tone: 'good' })
        dispatch({ type: 'finale/open' })
        if (TT.Audio) TT.Audio.play('success')
      })
    }

    function stopArcadeTimers() {
      if (musicTimer) clearTimeout(musicTimer)
      musicTimer = null
      if (pixelTimer) clearTimeout(pixelTimer)
      pixelTimer = null
    }

    function manageArcadeTimers(state) {
      const inArcade = state.mode === 'arcade'
      const musicOn = inArcade && state.arcade.game === 'music' && state.arcade.music.playing
      if (musicOn && !musicTimer) {
        const tick = () => {
          musicTimer = null
          const current = get()
          if (current.mode !== 'arcade' || current.arcade.game !== 'music' || !current.arcade.music.playing) return
          const music = current.arcade.music
          const tune = TT.Arcade.TUNES[music.tune % TT.Arcade.TUNES.length]
          const step = tune.steps[music.step % tune.steps.length]
          if (step >= 0 && TT.Audio) {
            TT.Audio.note(TT.Arcade.freq(step, music.scale), Math.max(0.07, (music.tempo - 60) / 1000), 'triangle', 0.2)
          }
          dispatch({ type: 'music/step' })
          const after = get()
          if (after.mode === 'arcade' && after.arcade.music.playing) {
            musicTimer = setTimeout(tick, after.arcade.music.tempo)
          }
        }
        musicTimer = setTimeout(tick, 120)
      } else if (!musicOn && musicTimer) {
        clearTimeout(musicTimer)
        musicTimer = null
      }
      const artOn = state.mode === 'lab' && state.lab.tab === 'art' && state.art && state.art.playing
      if (artOn && !artTimer) {
        artTimer = setInterval(() => {
          const current = get()
          if (current.mode !== 'lab' || current.lab.tab !== 'art' || !current.art.playing) return
          dispatch({ type: 'art/step' })
          if (TT.Audio) TT.Audio.play('tick')
        }, 1050)
      } else if (!artOn && artTimer) {
        clearInterval(artTimer)
        artTimer = null
      }
      const snakeOn = inArcade && state.arcade.game === 'snake' && state.arcade.snake && state.arcade.snake.running
      if (snakeOn && !snakeTimer) {
        snakeTimer = setInterval(() => {
          const current = get()
          const game = current.arcade.snake
          if (current.mode !== 'arcade' || current.arcade.game !== 'snake' || !game || !game.running) return
          const scoreBefore = game.score
          dispatch({ type: 'snake/tick' })
          const after = get().arcade.snake
          if (!after) return
          if (after.score > scoreBefore && TT.Audio) TT.Audio.play('mint')
          if (!after.alive && TT.Audio) TT.Audio.play('error')
        }, 420)
      } else if (!snakeOn && snakeTimer) {
        clearInterval(snakeTimer)
        snakeTimer = null
      }
      const pixelOn = inArcade && state.arcade.game === 'pixel' && state.arcade.pixel.anim
      if (pixelOn && !pixelTimer) {
        pixelTimer = setInterval(() => {
          const current = get()
          if (current.mode !== 'arcade' || current.arcade.game !== 'pixel' || !current.arcade.pixel.anim) return
          dispatch({ type: 'pixel/shift' })
        }, 190)
      } else if (!pixelOn && pixelTimer) {
        clearInterval(pixelTimer)
        pixelTimer = null
      }
    }

    function countCompleted(state) {
      return TT.Missions.completedCount ? TT.Missions.completedCount(state) : 0
    }

    function playSounds(before, after, action) {
      if (!TT.Audio) return
      const chapterChanged = after.chapter !== before.chapter
      if (chapterChanged) TT.Audio.play('whoosh')
      if (action.type === 'mint' || action.type === 'mint/all') TT.Audio.play('mint')
      if (action.type === 'gate/place' || action.type === 'box/place') TT.Audio.play('click')
      if (action.type === 'wire/connect' || action.type === 'wire/assist') TT.Audio.play('wire')
      if (action.type === 'seg/synth') TT.Audio.play('mint')
      if (action.type === 'input/toggle' || action.type === 'seg/input' || action.type === 'safety/toggle' || action.type === 'latch/toggle') {
        TT.Audio.play('click')
      }
      if (action.type === 'safety/preset') TT.Audio.play('blip')
      if (action.type === 'eval/run') TT.Audio.play('blip')
      if (action.type === 'tapeout/start' || action.type === 'lego/tapeout') TT.Audio.play('tapeout')
      if (action.type === 'tapeout/done') TT.Audio.play('success')
      if (action.type === 'seg/verify') TT.Audio.play(after.play && after.play.verify && after.play.verify.status === 'pass' ? 'verify' : 'error')
      if (action.type === 'safety/audit') TT.Audio.play(after.play && after.play.verify && after.play.verify.status === 'pass' ? 'verify' : 'error')
      if (action.type === 'clock/tick') {
        if (after.play && before.play && after.play.stateBits !== before.play.stateBits) TT.Audio.play('tick')
        const haltedNow = after.play && after.play.state && after.play.state.halted
        const haltedBefore = before.play && before.play.state && before.play.state.halted
        if (haltedNow && !haltedBefore) TT.Audio.play('levelup')
      }
      if (countCompleted(after) > countCompleted(before)) TT.Audio.play('success')
      if (after.toast && after.toast.id !== (before.toast && before.toast.id) && after.toast.tone === 'warn') {
        TT.Audio.play('error')
      }
    }

    function dispatch(action) {
      if (!action || !action.type) return store.get()
      if (action.type === 'cinema/start') {
        startCinema()
        return store.get()
      }
      if (action.type === 'cinema/stop') {
        stopCinema()
        return store.get()
      }
      if (action.type === 'chapter/select' && store.get().cinema && !cinemaInternal) {
        stopCinema(true)
      }
      if (action.type === 'game/reset' && store.get().cinema) stopCinema(true)
      const before = store.get()
      const after = TT.Missions.reduce(before, action)
      if (after !== before) store.set(after)
      if (after.lab && before.lab && after.lab.library !== before.lab.library) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('dsh-tapeout-lab:library:v1', JSON.stringify(after.lab.library))
          }
        } catch (error) {
          /* ignore quota errors: the in-memory library still works */
        }
      }
      if (action.type === 'tapeout/start' && after.play && after.play.phase === 'running') {
        scheduleTapeDone()
      }
      if (action.type === 'chapter/reset' || after.chapter !== before.chapter) {
        clearTapeTimer()
        pendingPort = null
        if (after.play && after.play.phase === 'running') scheduleTapeDone()
      }
      if (action.type === 'tapeout/done') clearTapeTimer()
      if (TT.Audio) TT.Audio.setMuted(after.soundMuted)
      if (action.type === 'sound/toggle') {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('dsh-tapeout-lab:muted:v1', after.soundMuted ? '1' : '0')
          }
        } catch (error) {
          /* ignore */
        }
      }
      if (after !== before) playSounds(before, after, action)
      manageArcadeTimers(after)
      return after
    }

    function startClock() {
      if (clockRunning) return () => {}
      clockRunning = true
      const tick = () => {
        if (!clockRunning) return
        const current = get()
        dispatch({ type: 'clock/tick' })
        const speed = current.speed === 4 ? 4 : 1
        clockTimer = setTimeout(tick, TT.protocol.BLOCK_SECONDS * 1000 * speed)
      }
      clockTimer = setTimeout(tick, TT.protocol.BLOCK_SECONDS * 1000)
      return () => {
        clockRunning = false
        if (clockTimer) clearTimeout(clockTimer)
        clockTimer = null
      }
    }

    function portIsSource(id) {
      return TT.Missions.isSource(get(), id)
    }

    function selectPort(id) {
      if (!id) return
      const state = get()
      if (pendingPort) {
        if (pendingPort === id) {
          pendingPort = null
          return
        }
        if (TT.Missions.canConnect(state, pendingPort, id)) {
          const from = pendingPort
          pendingPort = null
          dispatch({ type: 'wire/connect', from, to: id })
          return
        }
        if (portIsSource(id)) {
          pendingPort = id
          pushPortToast(id)
          return
        }
        pendingPort = null
        return
      }
      if (portIsSource(id)) {
        pendingPort = id
        pushPortToast(id)
      }
    }

    function pushPortToast(id) {
      const label = TT.Missions.describePort(get(), id)
      dispatch({
        type: 'toast/show',
        key: 'toast.portArmed',
        params: { source: label ? t(label.key, label.params) : t('port.unknown') },
        tone: 'info',
      })
    }

    function clearPending() {
      pendingPort = null
    }

    const api = {
      ctx,
      t,
      store,
      dispatch,
      startClock,
      selectPort,
      clearPending,
      getPending: () => pendingPort,
      resetCamera: () => {
        if (world) world.resetCamera()
      },
      setWorldActive: (active) => {
        if (world && world.setActive) world.setActive(active)
      },
      startCinema,
      stopCinema,
      isCinema: () => Boolean(store.get().cinema),
      attachWorld: (instance) => {
        world = instance
      },
      detachWorld: () => {
        world = null
        clearTapeTimer()
        clearCinemaTimers()
        stopArcadeTimers()
      },
    }
    return api
  }

  return { create }
})()

// ----------------------------------------------------------------------------- world

TT.WorldView = (function () {
  const P = TT.palette

  // Scene targets are nudged left so the left-side HUD card does not cover the
  // interactive input pads / chips on the left of the die.
  const CAMERA = [
    { yaw: 24, pitch: 27, dist: 20, target: [-0.8, 0.8, 0] },
    { yaw: 18, pitch: 24, dist: 15.5, target: [-1.3, 0.9, 0] },
    { yaw: 20, pitch: 27, dist: 21.5, target: [-1.7, 0.9, 0] },
    { yaw: 26, pitch: 25, dist: 18, target: [-0.9, 1.1, 0] },
    { yaw: 22, pitch: 23, dist: 16.5, target: [-1.3, 0.9, 0] },
    { yaw: 22, pitch: 28, dist: 22, target: [-1.9, 0.9, 0] },
    { yaw: 16, pitch: 31, dist: 29, target: [0.2, 1.2, 0] },
    { yaw: 20, pitch: 26, dist: 18, target: [-0.9, 0.9, 0] },
    { yaw: 22, pitch: 24, dist: 17, target: [-0.9, 0.9, 0] },
    { yaw: 18, pitch: 27, dist: 19, target: [-0.9, 0.9, 0] },
    { yaw: 22, pitch: 27, dist: 20, target: [-1.2, 0.9, 0] },
  ]

  function spritePort(color, active, label) {
    return (ctx, px) => {
      const r = Math.max(3.5, px.scale * 0.5)
      const alpha = px.alpha === undefined ? 1 : px.alpha
      ctx.globalAlpha = alpha
      if (active) {
        const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 3.2)
        glow.addColorStop(0, 'rgba(86,225,255,.55)')
        glow.addColorStop(1, 'rgba(86,225,255,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(0, 0, r * 3.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(4,12,20,.92)'
      ctx.fill()
      ctx.lineWidth = Math.max(1, r * 0.38)
      ctx.strokeStyle = active ? color : 'rgba(86,225,255,.55)'
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2)
      ctx.fillStyle = active ? color : 'rgba(86,225,255,.35)'
      ctx.fill()
      if (label && px.unit > 26) {
        ctx.font = `${Math.max(8, Math.min(11, px.unit * 0.5))}px ui-monospace, monospace`
        ctx.fillStyle = 'rgba(143,179,200,.85)'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, r * 1.5, 0)
      }
      ctx.globalAlpha = 1
    }
  }

  function drawLed(bit) {
    return (ctx, px) => {
      const r = Math.max(6, px.scale * 0.42)
      const on = bit === 1
      const color = on ? [43, 230, 194] : [42, 126, 160]
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.8)
      glow.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${on ? 0.62 : 0.2})`)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = on ? `rgba(${color[0]},${color[1]},${color[2]},.92)` : 'rgba(8,20,32,.9)'
      ctx.fill()
      ctx.lineWidth = Math.max(1, r * 0.25)
      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},.9)`
      ctx.stroke()
      ctx.font = `600 ${Math.max(8, r * 1.1)}px ui-monospace, monospace`
      ctx.fillStyle = on ? '#04121c' : 'rgba(143,179,200,.9)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(bit), 0, 0)
    }
  }

  function chipSprite(minted) {
    return (ctx, px, time) => {
      const r = Math.max(5, px.scale * 0.42)
      const color = minted ? [86, 225, 255] : [255, 195, 92]
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 3.2)
      glow.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${minted ? 0.18 : 0.55})`)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(0, 0, r * 3.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        const px0 = Math.cos(angle) * r
        const py0 = Math.sin(angle) * r
        if (i === 0) ctx.moveTo(px0, py0)
        else ctx.lineTo(px0, py0)
      }
      ctx.closePath()
      ctx.fillStyle = minted ? 'rgba(11,40,56,.95)' : 'rgba(36,28,8,.92)'
      ctx.fill()
      ctx.lineWidth = Math.max(1, r * 0.16)
      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},.95)`
      ctx.stroke()
      ctx.font = `600 ${Math.max(6, r * 0.95)}px ui-monospace, monospace`
      ctx.fillStyle = minted ? 'rgba(86,225,255,.9)' : '#ffd479'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('∧', 0, 0)
    }
  }

  function crystalSprite(state, api) {
    return (ctx, px, time) => {
      const r = Math.max(8, px.scale * 0.55)
      const spin = time * 0.0006
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 3.4)
      glow.addColorStop(0, 'rgba(255,212,121,.6)')
      glow.addColorStop(1, 'rgba(255,212,121,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(0, 0, r * 3.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.save()
      ctx.rotate(spin)
      ctx.beginPath()
      ctx.moveTo(0, -r * 1.25)
      ctx.lineTo(r * 0.85, 0)
      ctx.lineTo(0, r * 1.25)
      ctx.lineTo(-r * 0.85, 0)
      ctx.closePath()
      ctx.fillStyle = 'rgba(56,40,10,.92)'
      ctx.fill()
      ctx.lineWidth = Math.max(1, r * 0.14)
      ctx.strokeStyle = '#ffd479'
      ctx.stroke()
      ctx.restore()
      ctx.font = `600 ${Math.max(7, r * 0.82)}px ui-monospace, monospace`
      ctx.fillStyle = '#ffe9ae'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('NFT', 0, 0)
    }
  }

  function machineSprite(getState) {
    return (ctx, px, time) => {
      const state = getState()
      const r = Math.max(12, px.scale)
      const running = state.play && state.play.phase === 'running'
      const pulse = running ? 0.55 + 0.45 * Math.sin(time * 0.008) : 0.25
      const glow = ctx.createRadialGradient(0, -r * 0.4, 1, 0, -r * 0.4, r * 2.6)
      glow.addColorStop(0, `rgba(86,225,255,${0.35 * pulse})`)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(0, -r * 0.4, r * 2.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(10,26,42,.94)'
      ctx.strokeStyle = `rgba(86,225,255,${0.5 + 0.4 * pulse})`
      ctx.lineWidth = Math.max(1.2, r * 0.1)
      ctx.beginPath()
      ctx.roundRect ? ctx.roundRect(-r, -r * 1.2, r * 2, r * 1.9, r * 0.22) : ctx.rect(-r, -r * 1.2, r * 2, r * 1.9)
      ctx.fill()
      ctx.stroke()
      ctx.font = `600 ${Math.max(8, r * 0.3)}px ui-monospace, monospace`
      ctx.fillStyle = 'rgba(184,246,255,.9)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('TAPE', 0, -r * 0.62)
      ctx.fillText('OUT', 0, -r * 0.25)
      ctx.strokeStyle = `rgba(86,225,255,${0.45 * pulse})`
      ctx.beginPath()
      ctx.moveTo(-r * 0.9, r * 0.35)
      ctx.lineTo(r * 0.9, r * 0.35)
      ctx.stroke()
    }
  }

  function sevenSegSprite(getState) {
    return (ctx, px) => {
      const state = getState()
      const w = Math.max(14, px.scale * 0.95)
      const h = w * 1.55
      const play = state.play
      const show = play && play.showResult && play.result ? play.result.outputBits & 15 : null
      const value = show === null ? null : show
      const map = value === null ? null : TT.UI.sevenSegmentMap[value]
      const on = 'rgba(255,195,92,.95)'
      const off = 'rgba(255,195,92,.08)'
      ctx.translate(0, -h * 0.5)
      ctx.fillStyle = 'rgba(4,12,20,.85)'
      ctx.strokeStyle = 'rgba(255,195,92,.35)'
      ctx.lineWidth = Math.max(1, w * 0.06)
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(-w * 0.5, -h * 0.1, w, h, w * 0.12)
      else ctx.rect(-w * 0.5, -h * 0.1, w, h)
      ctx.fill()
      ctx.stroke()
      const segs = [
        [-w * 0.28, -h * 0.02, w * 0.56, h * 0.055],
        [w * 0.3, h * 0.02, h * 0.055, h * 0.32],
        [w * 0.3, h * 0.42, h * 0.055, h * 0.32],
        [-w * 0.28, h * 0.78, w * 0.56, h * 0.055],
        [-w * 0.36, h * 0.42, h * 0.055, h * 0.32],
        [-w * 0.36, h * 0.02, h * 0.055, h * 0.32],
        [-w * 0.28, h * 0.4, w * 0.56, h * 0.055],
      ]
      for (let i = 0; i < 7; i += 1) {
        ctx.fillStyle = map && map[i] ? on : off
        ctx.fillRect(segs[i][0], segs[i][1], segs[i][2], segs[i][3])
      }
      ctx.font = `600 ${Math.max(7, w * 0.28)}px ui-monospace, monospace`
      ctx.fillStyle = 'rgba(255,212,121,.8)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(value === null ? '0' : String(value), 0, h * 0.92)
    }
  }

  function dieSprite() {
    let cache = null
    let canvas = null
    return (ctx, px, time) => {
      if (!cache) {
        canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        cache = canvas.getContext('2d')
        const rand = TT.util.random(1971)
        cache.fillStyle = '#071523'
        cache.fillRect(0, 0, 512, 512)
        const n = 46
        const cell = 512 / n
        for (let y = 0; y < n; y += 1) {
          for (let x = 0; x < n; x += 1) {
            const on = rand() > 0.42
            cache.fillStyle = on ? `rgba(86,225,255,${0.12 + rand() * 0.55})` : 'rgba(18,50,73,.5)'
            cache.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2)
          }
        }
        cache.strokeStyle = 'rgba(86,225,255,.28)'
        cache.lineWidth = 3
        cache.strokeRect(2, 2, 508, 508)
      }
      const w = Math.max(30, px.scale * 3.1)
      const alpha = px.alpha === undefined ? 1 : px.alpha
      ctx.globalAlpha = alpha
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, w)
      glow.addColorStop(0, 'rgba(86,225,255,.22)')
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(0, 0, w, 0, Math.PI * 2)
      ctx.fill()
      ctx.drawImage(canvas, -w * 0.5, -w * 0.5, w, w)
      ctx.globalAlpha = 1
    }
  }

  function mount(canvas, options) {
    const store = options.store
    const api = options.api
    const t = options.t
    const setHover = options.setHover

    const engine = TT.Engine.create(canvas, { dprMax: 2, background: '#04070d' })
    const items = new Map()
    let currentChapter = null
    let lastEpoch = null
    let pointer = null
    let tickTime = 0
    let disposed = false

    function add(spec) {
      const handle = engine.add(spec)
      items.set(spec.id || `auto:${items.size}`, handle)
      return handle
    }

    function remove(id) {
      const handle = items.get(id)
      if (handle) {
        handle.remove()
        items.delete(id)
      }
    }

    function clear() {
      for (const handle of items.values()) handle.remove()
      items.clear()
    }

    // ---------------------------------------------------------------- positions
    const L = TT.layout

    function padList(state) {
      if (state.chapter === 1) return L.nand.pads
      if (state.chapter === 2) return L.half.pads
      if (state.chapter === 5) return L.lego.pads
      if (state.chapter === 4) return L.latch.pads
      return []
    }

    function portPos(state, id) {
      if (id.indexOf('in:') === 0) {
        const index = Number(id.slice(3))
        const pad = padList(state)[index]
        if (!pad) return [0, 0.5, 0]
        return [pad.x + 0.95, 0.55, pad.z]
      }
      if (id.indexOf('g:') === 0) {
        const parts = id.split(':')
        const index = Number(parts[1])
        const pin = parts[2]
        const slot = state.chapter === 1 ? L.nand.gate : state.chapter === 2 ? L.half.slots[index] : L.latch.gates[index]
        if (!slot) return [0, 0.5, 0]
        if (pin === 'out') return [slot.x + 0.85, 0.55, slot.z]
        return [slot.x - 0.85, 0.55, slot.z + (pin === 'a' ? -0.28 : 0.28)]
      }
      if (id.indexOf('out:') === 0) {
        const index = Number(id.slice(4))
        const list = state.chapter === 2 ? L.half.outs : state.chapter === 5 ? L.lego.outs : L.latch.outs
        const out = list[index]
        if (!out) return [0, 0.5, 0]
        return [out.x - 0.65, 0.55, out.z]
      }
      if (id.indexOf('box:') === 0) {
        const parts = id.split(':')
        const box = parts[1]
        const pin = parts[2]
        const slot = L.lego.boxes[box]
        if (!slot) return [0, 0.5, 0]
        if (pin === 'a') return [slot.x - 1.25, 0.55, slot.z - 0.34]
        if (pin === 'b') return [slot.x - 1.25, 0.55, slot.z + 0.34]
        if (pin === 'sum') return [slot.x + 1.25, 0.55, slot.z - 0.34]
        if (pin === 'carry') return [slot.x + 1.25, 0.55, slot.z + 0.34]
        return [slot.x + 1.25, 0.55, slot.z]
      }
      return [0, 0.5, 0]
    }

    function gatePos(state, index) {
      if (state.chapter === 1) return L.nand.gate
      if (state.chapter === 2) return L.half.slots[index]
      if (state.chapter === 4) return L.latch.gates[index]
      return { x: 0, z: 0 }
    }

    function chipPos(index) {
      const chip = L.mint.chips[index] || { x: 0, z: 0 }
      return [chip.x, 0.42, chip.z]
    }

    // ---------------------------------------------------------------- scene
    function sceneSpecs(state) {
      const specs = []
      const play = state.play || {}
      specs.push({ kind: 'grid', pos: [0, 0, 0], size: [18, 14], cell: 1, color: P.grid, majorEvery: 4 })
      specs.push({
        kind: 'particles',
        pos: [0, 2.6, 0],
        area: [15, 4.4, 11],
        count: 24,
        color: P.cyan,
        size: 0.9,
        speed: 0.12,
      })
      specs.push({
        kind: 'particles',
        pos: [0, 2.0, 0],
        area: [13, 3.4, 9],
        count: 14,
        color: P.amber,
        size: 0.7,
        speed: 0.06,
      })

      if (state.chapter !== 6) {
        // containment field around the die: two slow counter-rotating rings
        specs.push({ kind: 'ring', pos: [0, 0.05, 0], radius: 7.1, width: 1.2, color: P.cyanDim, glow: 0.16, spin: 5 })
        specs.push({ kind: 'ring', pos: [0, 0.05, 0], radius: 7.8, width: 1, color: P.cyanDim, glow: 0.09, spin: -3 })
        specs.push({ kind: 'text', pos: [0, 0.05, -5.6], text: 'TAPEOUT · SILICON LAB', size: 10, color: P.faint })
      }

      if (state.chapter === 0) {
        specs.push({ kind: 'plate', id: 'wafer', pos: [0, 0.02, 0], size: [14, 9.4], color: P.wafer, ring: P.dieEdge })
        specs.push({ kind: 'glow', pos: [0, 0.35, 0], radius: 3.0, color: P.cyan, intensity: 0.055 })
        specs.push({ kind: 'text', pos: [0, 0.05, 5.6], text: t('hud.erc1155'), size: 12, color: P.cyanDim })
        L.mint.chips.forEach((chip, index) => {
          const minted = (play.minted || []).indexOf(chip.id) >= 0
          specs.push({
            kind: 'sprite',
            id: chip.id,
            pos: [chip.x, 0.5 + (minted ? 0.05 : 0), chip.z],
            size: 0.9,
            data: { chip: index },
            draw: chipSprite(minted),
          })
          specs.push({ kind: 'ring', pos: [chip.x, 0.06, chip.z], radius: 0.55, width: 1.2, color: minted ? P.cyanDim : P.amber, glow: minted ? 0.2 : 0.7 })
        })
        return specs
      }

      if (state.chapter === 1) {
        specs.push({ kind: 'plate', pos: [0, 0.02, 0], size: [12, 6.6], color: P.wafer, ring: P.dieEdge })
        const padStates = play.inputs || [0, 0]
        padList(state).forEach((pad, index) => {
          const on = padStates[index] === 1
          specs.push({
            kind: 'plate',
            id: `pad:${pad.port}`,
            pos: [pad.x, 0.05, pad.z],
            size: [1.9, 1.5],
            color: on ? '#123c4e' : '#0a1a28',
            ring: on ? P.mint : P.cyanDim,
            label: pad.label,
            sub: on ? '1' : '0',
            active: on,
          })
          specs.push({
            kind: 'sprite',
            id: `port:${pad.port}`,
            pos: portPos(state, pad.port),
            size: 0.46,
            draw: spritePort(P.cyan, false, pad.label),
          })
        })
        if (play.placed) {
          const gate = L.nand.gate
          specs.push({
            kind: 'cube',
            id: 'gate:0',
            pos: [gate.x, 0.05, gate.z],
            size: [1.7, 1, 1.6],
            color: P.gate,
            emissive: 0.35,
            edge: P.gateEdge,
            label: 'NAND',
            sub: '⊼',
          })
          ;['a', 'b'].forEach((pin) => {
            specs.push({
              kind: 'sprite',
              id: `port:g:0:${pin}`,
              pos: portPos(state, `g:0:${pin}`),
              size: 0.42,
              draw: spritePort(P.cyan, false, pin.toUpperCase()),
            })
          })
          specs.push({
            kind: 'sprite',
            id: 'port:g:0:out',
            pos: portPos(state, 'g:0:out'),
            size: 0.42,
            draw: spritePort(P.mint, false, ''),
          })
          const outBit = TT.util.clamp(1 - (padStates[0] & padStates[1]), 0, 1)
          specs.push({ kind: 'sprite', pos: [L.nand.led.x, 0.6, L.nand.led.z], size: 0.9, draw: drawLed(outBit) })
          specs.push({ kind: 'text', pos: [L.nand.led.x, 0.05, L.nand.led.z + 0.9], text: 'NAND', size: 11, color: P.cyanDim })
        }
        return specs
      }

      if (state.chapter === 2) {
        specs.push({ kind: 'plate', pos: [0, 0.02, 0], size: [15, 8], color: P.wafer, ring: P.dieEdge })
        const pads = L.half.pads
        pads.forEach((pad) => {
          const index = Number(pad.port.split(':')[1])
          const on = (play.inputs || [0, 0])[index] === 1
          specs.push({
            kind: 'plate',
            id: `pad:${pad.port}`,
            pos: [pad.x, 0.05, pad.z],
            size: [1.8, 1.4],
            color: on ? '#123c4e' : '#0a1a28',
            ring: on ? P.mint : P.cyanDim,
            label: pad.label,
            sub: on ? '1' : '0',
            active: on,
          })
          specs.push({ kind: 'sprite', id: `port:${pad.port}`, pos: portPos(state, pad.port), size: 0.44, draw: spritePort(P.cyan, false, pad.label) })
        })
        for (let i = 0; i < 5; i += 1) {
          const slot = L.half.slots[i]
          if (i < (play.gates || 0)) {
            specs.push({
              kind: 'cube',
              id: `gate:${i}`,
              pos: [slot.x, 0.05, slot.z],
              size: [1.6, 0.95, 1.5],
              color: P.gate,
              emissive: 0.3,
              edge: P.gateEdge,
              label: `NAND ${i + 1}`,
              sub: '⊼',
            })
            ;['a', 'b'].forEach((pin) => {
              specs.push({
                kind: 'sprite',
                id: `port:g:${i}:${pin}`,
                pos: portPos(state, `g:${i}:${pin}`),
                size: 0.4,
                draw: spritePort(P.cyan, false, pin.toUpperCase()),
              })
            })
            specs.push({
              kind: 'sprite',
              id: `port:g:${i}:out`,
              pos: portPos(state, `g:${i}:out`),
              size: 0.4,
              draw: spritePort(P.mint, false, ''),
            })
          } else {
            specs.push({ kind: 'plate', pos: [slot.x, 0.04, slot.z], size: [1.5, 1.4], color: '#081624', ring: P.grid, label: '+', sub: `${i + 1}` })
          }
        }
        L.half.outs.forEach((out, index) => {
          const wired = Boolean(play.wiring && play.wiring[out.port])
          specs.push({
            kind: 'plate',
            id: `outpad:${out.port}`,
            pos: [out.x, 0.05, out.z],
            size: [1.7, 1.3],
            color: wired ? '#10303c' : '#0a1a28',
            ring: wired ? P.mint : P.cyanDim,
            label: out.label,
            sub: wired ? 'wired' : '',
          })
          specs.push({ kind: 'sprite', id: `port:${out.port}`, pos: portPos(state, out.port), size: 0.44, draw: spritePort(P.cyan, false, '') })
        })
        return specs
      }

      if (state.chapter === 3) {
        specs.push({ kind: 'plate', pos: [0, 0.02, 0], size: [14, 8], color: P.wafer, ring: P.dieEdge })
        const machine = L.tapeout.machine
        specs.push({ kind: 'sprite', id: 'machine', pos: [machine.x, 1.5, machine.z], size: 2.2, draw: machineSprite(store.get) })
        specs.push({ kind: 'beam', pos: [machine.x, 0, machine.z], radius: 0.5, color: P.cyan, height: 5 })
        specs.push({ kind: 'glow', pos: [machine.x, 1.3, machine.z], radius: 1.7, color: P.cyan, intensity: 0.085 })
        specs.push({ kind: 'text', pos: [machine.x, 0.05, machine.z + 1.9], text: 'TAPE OUT', size: 12, color: P.cyanDim })

        const stack = L.tapeout.stack
        const count = Math.min(state.nand, 10)
        for (let i = 0; i < count; i += 1) {
          specs.push({
            kind: 'hex',
            pos: [stack.x, 0.12 + i * 0.16, stack.z],
            size: 0.5,
            color: '#1a4a5e',
            emissive: 0.35,
            label: '',
          })
        }
        specs.push({ kind: 'text', pos: [stack.x, 0.05, stack.z + 1.1], text: `${t('hud.nand')} ${state.nand}`, size: 11, color: P.cyanDim })

        // the design being taped out
        specs.push({ kind: 'plate', pos: [L.tapeout.circuit.x, 0.03, L.tapeout.circuit.z], size: [3.4, 2], color: '#0b1c2c', ring: P.gold, label: '半加器', sub: '5 NAND' })
        if (play.phase === 'running') {
          const progress = TT.util.clamp((Date.now() - play.startedAt) / 4200, 0, 1)
          const hex = play.halfHex || ''
          const shown = Math.floor((hex.length / 2) * progress) * 2
          specs.push({ kind: 'text', id: 'tapeout:hex', pos: [L.tapeout.circuit.x, 2.1, L.tapeout.circuit.z], text: (hex || '').slice(0, shown), size: 10, color: P.cyan })
          specs.push({ kind: 'glow', pos: [machine.x, 1.6, machine.z], radius: 2.1, color: P.amber, intensity: 0.12 })
        }
        if (play.phase === 'done') {
          const crystal = L.tapeout.crystal
          specs.push({ kind: 'sprite', id: 'crystal', pos: [crystal.x, 1.7, crystal.z], size: 1.5, draw: crystalSprite(state, api) })
          specs.push({ kind: 'glow', pos: [crystal.x, 1.6, crystal.z], radius: 1.5, color: P.gold, intensity: 0.14 })
          specs.push({ kind: 'text', pos: [crystal.x, 0.05, crystal.z + 1.2], text: `ERC-721 #${play.nftId || 1}`, size: 11, color: P.gold })
        }
        return specs
      }

      if (state.chapter === 4) {
        specs.push({ kind: 'plate', pos: [0, 0.02, 0], size: [14, 7.6], color: P.wafer, ring: P.dieEdge })
        const playL = state.play
        L.latch.pads.forEach((pad) => {
          const isSet = pad.port === 'in:0'
          const level = isSet ? playL.S : playL.R
          const low = level === 0
          specs.push({
            kind: 'plate',
            id: `latchpad:${pad.port}`,
            pos: [pad.x, 0.05, pad.z],
            size: [1.8, 1.4],
            color: low ? '#3a1420' : '#0a1a28',
            ring: low ? P.amber : P.cyanDim,
            label: pad.label,
            sub: low ? '0' : '1',
            active: low,
          })
        })
        L.latch.gates.forEach((slot, index) => {
          specs.push({
            kind: 'cube',
            pos: [slot.x, 0.05, slot.z],
            size: [1.5, 0.95, 1.4],
            color: index === 0 ? '#1a2c46' : '#2a2440',
            emissive: 0.3,
            edge: index === 0 ? P.cyanDim : P.magenta,
            label: 'NAND',
            sub: index === 0 ? 'Q' : 'Q̄',
          })
        })
        const q = playL.stateBits & 1
        const qn = (playL.stateBits >> 1) & 1
        specs.push({ kind: 'sprite', pos: [L.latch.outs[0].x, 0.7, L.latch.outs[0].z], size: 0.9, draw: drawLed(q) })
        specs.push({ kind: 'sprite', pos: [L.latch.outs[1].x, 0.7, L.latch.outs[1].z], size: 0.9, draw: drawLed(qn) })
        specs.push({ kind: 'text', pos: [L.latch.outs[0].x, 0.05, L.latch.outs[0].z + 0.7], text: 'Q', size: 12, color: P.mint })
        specs.push({ kind: 'text', pos: [L.latch.outs[1].x, 0.05, L.latch.outs[1].z + 0.7], text: 'Q̄', size: 12, color: P.magenta })
        const wires = [
          [portPos(state, 'in:0'), [L.latch.gates[0].x - 0.75, 0.55, L.latch.gates[0].z + 0.28]],
          [portPos(state, 'in:1'), [L.latch.gates[1].x - 0.75, 0.55, L.latch.gates[1].z + 0.28]],
          [[L.latch.gates[0].x + 0.8, 0.55, L.latch.gates[0].z], [L.latch.gates[1].x - 0.75, 0.55, L.latch.gates[1].z - 0.28]],
          [[L.latch.gates[1].x + 0.75, 0.55, L.latch.gates[1].z], [L.latch.gates[0].x - 0.75, 0.55, L.latch.gates[0].z - 0.28]],
          [[L.latch.gates[0].x + 0.8, 0.55, L.latch.gates[0].z], portPos(state, 'out:0')],
          [[L.latch.gates[1].x + 0.8, 0.55, L.latch.gates[1].z], portPos(state, 'out:1')],
        ]
        wires.forEach((pair, index) => {
          specs.push({
            kind: 'wire',
            points: [pair[0], [ (pair[0][0] + pair[1][0]) / 2, 1.25 + index * 0.05, (pair[0][2] + pair[1][2]) / 2 ], pair[1]],
            color: index < 2 ? P.cyan : P.magenta,
            width: 0.04,
            glow: 0.55,
            flow: (tickTime * 0.00018 + index * 0.17) % 1,
          })
        })
        if (playL.transientSeen && playL.stateBits === 3) {
          specs.push({ kind: 'text', pos: [0, 2.2, 0], text: 'settling…', size: 12, color: P.amber })
        }
        return specs
      }

      if (state.chapter === 5) {
        specs.push({ kind: 'plate', pos: [0, 0.02, 0], size: [15, 8.4], color: P.wafer, ring: P.dieEdge })
        L.lego.pads.forEach((pad) => {
          const index = Number(pad.port.split(':')[1])
          const on = (play.inputs || [0, 0, 0])[index] === 1
          specs.push({
            kind: 'plate',
            id: `pad:${pad.port}`,
            pos: [pad.x, 0.05, pad.z],
            size: [1.7, 1.3],
            color: on ? '#123c4e' : '#0a1a28',
            ring: on ? P.mint : P.cyanDim,
            label: pad.label,
            sub: on ? '1' : '0',
            active: on,
          })
          specs.push({ kind: 'sprite', id: `port:${pad.port}`, pos: portPos(state, pad.port), size: 0.42, draw: spritePort(P.cyan, false, pad.label) })
        })
        const boxes = [
          { id: 'ha1', label: '半加器 1', gates: 5 },
          { id: 'ha2', label: '半加器 2', gates: 5 },
          { id: 'or', label: '或门', gates: 3 },
        ]
        boxes.forEach((box) => {
          const slot = L.lego.boxes[box.id]
          const placed = (play.boxes || []).indexOf(box.id) >= 0
          if (!placed) {
            specs.push({ kind: 'plate', pos: [slot.x, 0.04, slot.z], size: [3, 2], color: '#081624', ring: P.grid, label: '+', sub: box.label })
            return
          }
          specs.push({
            kind: 'plate',
            pos: [slot.x, 0.06, slot.z],
            size: [3, 2],
            color: box.id === 'or' ? '#231a33' : '#0d2437',
            ring: box.id === 'or' ? P.magenta : P.gold,
            label: box.label,
            sub: `${box.gates} NAND · black box`,
            active: true,
          })
          const pins = box.id === 'or' ? ['a', 'b', 'out'] : ['a', 'b', 'sum', 'carry']
          pins.forEach((pin) => {
            const isInput = pin === 'a' || pin === 'b'
            specs.push({
              kind: 'sprite',
              id: `port:box:${box.id}:${pin}`,
              pos: portPos(state, `box:${box.id}:${pin}`),
              size: 0.4,
              draw: spritePort(isInput ? P.cyan : P.mint, false, pin.toUpperCase()),
            })
          })
        })
        L.lego.outs.forEach((out) => {
          const wired = Boolean(play.wiring && play.wiring[out.port])
          specs.push({
            kind: 'plate',
            pos: [out.x, 0.05, out.z],
            size: [1.6, 1.3],
            color: wired ? '#10303c' : '#0a1a28',
            ring: wired ? P.mint : P.cyanDim,
            label: out.label,
          })
          specs.push({ kind: 'sprite', id: `port:${out.port}`, pos: portPos(state, out.port), size: 0.42, draw: spritePort(P.cyan, false, '') })
        })
        return specs
      }

      if (state.chapter === 7) {
        specs.push({ kind: 'plate', pos: [0, 0.02, 0], size: [15, 8], color: P.wafer, ring: P.dieEdge })
        const display = { x: 3.5, z: 0.1 }
        const parts = TT.Parts
        for (let index = 0; index < 4; index += 1) {
          const x = -5.2 + (index % 2) * 1.5
          const z = -1.2 + Math.floor(index / 2) * 2.3
          const on = (play.inputs || [])[index] ? 1 : 0
          specs.push({
            kind: 'plate',
            id: `segpad:${index}`,
            pos: [x, 0.05, z],
            size: [1.2, 1.0],
            color: on ? '#123c4e' : '#0a1a28',
            ring: on ? P.mint : P.cyanDim,
            label: `D${index}`,
            sub: on ? '1' : '0',
            active: Boolean(on),
          })
        }
        if (play.synthesized) {
          for (let row = 0; row < 10; row += 1) {
            for (let col = 0; col < 10; col += 1) {
              specs.push({
                kind: 'cube',
                pos: [-1.9 + col * 0.34, 0.04, -1.7 + row * 0.34],
                size: [0.26, 0.16, 0.26],
                color: P.gate,
                edge: P.gateEdge,
                emissive: 0.18,
              })
            }
          }
          specs.push({ kind: 'text', pos: [-1.9, 0.05, -2.2], text: `${play.gateCount || ''} NAND`, size: 10, color: P.cyanDim })
        } else {
          specs.push({ kind: 'text', pos: [-1.9, 0.6, 0], text: t('dock.segSynth'), size: 12, color: P.faint })
        }
        if (parts) {
          specs.push({
            kind: 'sprite',
            id: 'segdisplay',
            pos: [display.x, 1.6, display.z],
            size: 2.6,
            draw: parts.sprite.sevenSeg(() => store.get().play.mask || 0),
          })
        }
        const mask = play.mask || 0
        for (let index = 0; index < 7; index += 1) {
          specs.push({ kind: 'sprite', pos: [display.x + 1.9, 1.15, -1.2 + index * 0.4], size: 0.34,
            draw: parts ? parts.sprite.led(() => (store.get().play.mask || 0) >> index & 1, P.amber) : null })
          specs.push({ kind: 'text', pos: [display.x + 2.25, 0.05, -1.2 + index * 0.4], text: 'abcdefg'[index], size: 9, color: P.faint })
        }
        specs.push({ kind: 'text', pos: [display.x, 0.05, 1.8], text: `digit ${play.digit || 0} · mask ${TT.util.formatBits(mask, 7)}`, size: 10, color: P.cyanDim })
        return specs
      }

      if (state.chapter === 8) {
        specs.push({ kind: 'plate', pos: [0, 0.02, 0], size: [15, 8], color: P.wafer, ring: P.dieEdge })
        const bits = play.stateBits || 0
        for (let index = 0; index < 4; index += 1) {
          specs.push({ kind: 'sprite', pos: [-2.4 + index * 1.5, 1.15, 0.4], size: 1.1,
            draw: TT.Parts ? TT.Parts.sprite.led(() => ((store.get().play.stateBits || 0) >> index) & 1, P.mint) : null })
          specs.push({ kind: 'text', pos: [-2.4 + index * 1.5, 0.05, 1.3], text: `Q${index}`, size: 11, color: P.cyanDim })
        }
        specs.push({ kind: 'ring', pos: [0, 1.2, -2.0], radius: 1.2, width: 1.3, color: P.cyan, glow: 0.4, spin: 24 })
        specs.push({ kind: 'text', pos: [0, 0.05, -2.9], text: `${t('hud.beats')} ${play.beats || 0} · +1 / block`, size: 10, color: P.cyanDim })
        specs.push({ kind: 'text', pos: [0, 0.6, -0.4], text: TT.util.formatBits(bits, 4), size: 26, color: P.cyan })
        specs.push({ kind: 'text', pos: [0, 0.05, 2.2], text: `${t('hud.next')} ${TT.util.formatBits((bits + 1) & 15, 4)}`, size: 10, color: P.faint })
        if (TT.Parts) {
          specs.push({ kind: 'sprite', pos: [3.8, 1.6, 0], size: 1.8,
            draw: TT.Parts.sprite.sevenSeg(() => TT.Parts.sevenSegMaskForDigit(store.get().play.stateBits || 0)) })
        }
        return specs
      }

      if (state.chapter === 9) {
        specs.push({ kind: 'plate', pos: [0, 0.02, 0], size: [16, 8.4], color: P.wafer, ring: P.dieEdge })
        const cpu = play.state
        if (TT.Parts) {
          specs.push({ kind: 'sprite', pos: [-3.6, 2.2, 0], size: 3.1,
            draw: TT.Parts.sprite.ramGrid(() => {
              const c = store.get().play.state
              return c ? { cells: c.RAM, pc: c.PC, accessed: c.PC } : { cells: [] }
            }) })
          const regs = [['PC', () => (store.get().play.state || {}).PC], ['IR', () => (store.get().play.state || {}).IR], ['A', () => (store.get().play.state || {}).A], ['OUT', () => (store.get().play.state || {}).OUT]]
          regs.forEach(([label, getter], index) => {
            specs.push({ kind: 'sprite', pos: [1.4, 1.2, -1.6 + index * 1.05], size: 1.1,
              draw: TT.Parts.sprite.register(getter, label) })
          })
        }
        specs.push({ kind: 'ring', pos: [-0.4, 1.1, 0], radius: 1.5, width: 1.3, color: P.magenta, glow: 0.45, spin: -16 })
        specs.push({ kind: 'text', pos: [-0.4, 0.05, 1.2], text: t('hud.program') + ' · ' + t(`cpu.prog.${play.programId}`), size: 11, color: P.magenta })
        specs.push({ kind: 'text', pos: [-3.6, 0.05, -2.3], text: 'RAM 16 × 4-bit', size: 10, color: P.cyanDim })
        specs.push({ kind: 'text', pos: [3.9, 0.05, 0.4], text: play.running ? 'RUNNING' : cpu && cpu.halted ? 'HALTED' : 'READY', size: 11, color: play.running ? P.mint : P.amber })
        if (TT.Parts) {
          specs.push({ kind: 'sprite', pos: [4.4, 1.8, 0.4], size: 1.5,
            draw: TT.Parts.sprite.sevenSeg(() => TT.Parts.sevenSegMaskForDigit((store.get().play.state || {}).OUT || 0)) })
        }
        return specs
      }

      if (state.chapter === 10) {
        specs.push({ kind: 'plate', pos: [0, 0.02, 0], size: [17, 8.4], color: P.wafer, ring: P.dieEdge })
        const safety = TT.Safety
        if (safety) {
          for (let index = 0; index < 16; index += 1) {
            const col = index % 8
            const row = Math.floor(index / 8)
            const x = -6.0 + col * 1.5
            const z = -1.6 + row * 2.9
            const on = ((play.bits || 0) >> index) & 1
            specs.push({
              kind: 'plate',
              id: `safepad:${index}`,
              pos: [x, 0.05, z],
              size: [1.15, 1.0],
              color: on ? '#123c4e' : '#0a1a28',
              ring: on ? P.amber : P.cyanDim,
              label: safety.KEYS[index],
              sub: on ? '1' : '0',
              active: Boolean(on),
            })
          }
        }
        const colors = [P.mint, P.amber, P.cyan, P.red]
        const mode = play.mode || 0
        specs.push({ kind: 'ring', pos: [0.4, 1.2, 0], radius: 1.7, width: 2, color: colors[mode], glow: 0.5, spin: 10 })
        specs.push({ kind: 'sprite', pos: [0.4, 1.1, 0], size: 1.9,
          draw: TT.Parts ? TT.Parts.sprite.rover(() => {
            const p = store.get().play
            return { mode: p.mode || 0, stopped: (p.mode || 0) === 3, safe: (p.mode || 0) === 0 }
          }) : null })
        for (let index = 0; index < 4; index += 1) {
          specs.push({ kind: 'sprite', pos: [3.8, 1.1, -1.2 + index * 0.8], size: 0.7,
            draw: TT.Parts ? TT.Parts.sprite.led(() => (store.get().play.mode || 0) === index ? 1 : 0, colors[index]) : null })
          specs.push({ kind: 'text', pos: [3.8, 0.05, -0.7 + index * 0.8], text: t(`safety.${['allow', 'slow', 'home', 'stop'][index]}`), size: 9, color: colors[index] })
        }
        specs.push({ kind: 'text', pos: [0.4, 0.05, 1.9], text: `${t('hud.mode')}: ${t(`safety.${['allow', 'slow', 'home', 'stop'][mode]}`)}`, size: 11, color: colors[mode] })
        specs.push({ kind: 'text', pos: [-6.0, 0.05, -2.5], text: 'TAPEROVER SAFETY · 16 in / 80 NAND / 4 out', size: 9, color: P.cyanDim })
        return specs
      }

      if (state.chapter === 6) {
        const die = L.behemoth.die
        specs.push({ kind: 'sprite', id: 'die', pos: [die.x, 3.2, die.z], size: 6, draw: dieSprite() })
        specs.push({ kind: 'glow', pos: [die.x, 3.2, die.z], radius: 4.6, color: P.cyan, intensity: 0.05 })
        specs.push({ kind: 'ring', pos: [die.x, 3.2, die.z], radius: 4.6, width: 1.5, color: P.cyan, glow: 0.38, spin: 12 })
        specs.push({ kind: 'text', pos: [die.x, 0.05, die.z + 4.2], text: 'BEHEMOTH · 2300 TRANSISTORS', size: 12, color: P.cyanDim })
        const display = L.behemoth.display
        specs.push({ kind: 'sprite', id: 'display', pos: [display.x, 1.6, display.z], size: 1.5, draw: sevenSegSprite(store.get) })
        specs.push({
          kind: 'plate',
          pos: [display.x, 0.04, display.z],
          size: [2.2, 2.4],
          color: '#0b1826',
          ring: P.gold,
          label: t('hud.programOp', { a: play.operands[0], b: play.operands[1] }),
          sub: '4-bit adder',
        })
        const core = L.behemoth.core
        specs.push({ kind: 'ring', pos: [core.x, 1.2, core.z], radius: 1.4, width: 1.4, color: P.magenta, glow: 0.55, spin: -18 })
        specs.push({ kind: 'text', pos: [core.x, 0.05, core.z + 1.2], text: 'CLOCK', size: 11, color: P.magenta })
        return specs
      }

      return specs
    }

    function wireSpecs(state) {
      const specs = []
      const play = state.play || {}
      const wiring = play.wiring || {}
      const sources = sourceBits(state)
      let index = 0
      for (const sink of Object.keys(wiring)) {
        const source = wiring[sink]
        if (!source) continue
        const from = portPos(state, source)
        const to = portPos(state, sink)
        const bit = sources[source]
        const color = bit === 1 ? P.mint : bit === 0 ? P.cyanDim : P.cyan
        const mid = [(from[0] + to[0]) / 2, 1.35 + (index % 3) * 0.16, (from[2] + to[2]) / 2]
        specs.push({
          kind: 'wire',
          id: `wire:${sink}`,
          points: [from, mid, to],
          color,
          width: 0.045,
          glow: 0.5,
          flow: (index * 0.13) % 1,
          arrows: false,
        })
        index += 1
      }
      const pending = api.getPending()
      if (pending) {
        const from = portPos(state, pending)
        const to = pointer ? pointer.world : [from[0], 0.6, from[2] + 2]
        specs.push({
          kind: 'wire',
          id: 'wire:pending',
          points: [from, [from[0], 1.5, from[2]], [to[0], Math.max(0.6, to[1]), to[2]]],
          color: P.amber,
          width: 0.035,
          glow: 0.85,
          dash: 1,
        })
      }
      return specs
    }

    function sourceBits(state) {
      const play = state.play || {}
      const inputs = play.inputs || [0, 0, 0]
      let bits = 0
      inputs.forEach((value, index) => {
        bits |= (value ? 1 : 0) << index
      })
      const map = {}
      if (state.chapter === 1) {
        map['in:0'] = inputs[0] || 0
        map['in:1'] = inputs[1] || 0
        if (play.placed) map['g:0:out'] = 1 - ((inputs[0] || 0) & (inputs[1] || 0))
        return map
      }
      const netlist = state.chapter === 2 || state.chapter === 5 ? TT.Missions.playerNetlist(state) : null
      if (!netlist) return map
      let signals = null
      try {
        signals = TT.Circuit.evaluate(netlist, bits).signals
      } catch (error) {
        return map
      }
      if (state.chapter === 2) {
        map['in:0'] = signals[2]
        map['in:1'] = signals[3]
        for (let i = 0; i < 5; i += 1) map[`g:${i}:out`] = signals[4 + i]
        return map
      }
      if (state.chapter === 5) {
        map['in:0'] = signals[2]
        map['in:1'] = signals[3]
        map['in:2'] = signals[4]
        return map
      }
      return map
    }

    // ---------------------------------------------------------------- sync
    let lastPending = null
    let sceneKey = null
    let prevSnap = null
    let frameNo = 0
    const fx = []
    let fxSeq = 0

    /** Only the visual state matters here: clock ticks and logs must not rebuild the scene. */
    function sceneSignature(state) {
      const p = state.play || {}
      return [
        state.chapter,
        state.epoch,
        state.nand,
        (p.minted || []).length,
        p.placed ? 1 : 0,
        p.gates || 0,
        (p.boxes || []).length,
        p.wiringVersion || 0,
        p.phase || '',
        p.stateBits || 0,
        (p.inputs || []).join(''),
        p.transientSeen ? 1 : 0,
        p.reveal || 0,
        p.showResult ? 1 : 0,
        p.taped ? 1 : 0,
        (p.operands || []).join('+'),
        state.chapter === 7
          ? `seg:${p.synthesized ? 1 : 0}:${p.mask || 0}:${p.digit || 0}:${p.visitedMask || 0}:${p.taped ? 1 : 0}`
          : '',
        state.chapter === 8 ? `cnt:${p.stateBits || 0}:${p.beats || 0}` : '',
        state.chapter === 9 && p.state
          ? `cpu:${p.programId}:${p.state.PC},${p.state.A},${p.state.OUT},${p.state.IR},${p.state.halted ? 1 : 0}:${p.running ? 1 : 0}:${(p.trace || []).length}`
          : state.chapter === 9 ? 'cpu:none' : '',
        state.chapter === 10 ? `saf:${p.bits || 0}:${p.mode || 0}:${p.seenMask || 0}:${p.taped ? 1 : 0}` : '',
      ].join('|')
    }

    function snapshot(state) {
      const p = state.play || {}
      return {
        chapter: state.chapter,
        minted: (p.minted || []).length,
        wiring: p.wiringVersion || state.wiringVersion || 0,
        verify: p.verify ? p.verify.status : '',
        phase: p.phase || '',
        stateBits: p.stateBits || 0,
        reveal: p.reveal || 0,
        showResult: p.showResult ? 1 : 0,
        completed: TT.Missions.completedCount(state),
        allDone: TT.Missions.allDone(state),
        segMask: p.mask || 0,
        segDigit: p.digit || 0,
        counterBits: p.stateBits || 0,
        cpuHalted: p.state && p.state.halted ? 1 : 0,
        cpuOut: p.state ? p.state.OUT : null,
        safetyMode: p.mode || 0,
      }
    }

    // ---------------------------------------------------------------- fx
    function spawnBurst(pos, color, options) {
      const opts = options || {}
      const t0 = engine.time()
      const ring = engine.add({
        kind: 'ring',
        pos: [pos[0], pos[1], pos[2]],
        radius: 0.25,
        width: opts.thick || 2.2,
        color,
        glow: 0.9,
        spin: 0,
      })
      const glow = engine.add({
        kind: 'glow',
        pos: [pos[0], pos[1], pos[2]],
        radius: 0.5,
        color,
        intensity: 0.5,
      })
      fxSeq += 1
      fx.push({ ring, glow, t0, dur: opts.dur || 950, maxR: opts.radius || 1.9, peak: opts.peak || 0.5 })
    }

    function bumpFx(state, snap) {
      if (!prevSnap) return
      const before = prevSnap
      const p = state.play || {}
      if (state.chapter !== before.chapter) return
      if (snap.minted > before.minted) {
        const id = (p.minted || [])[snap.minted - 1]
        const index = Number(String(id || '').split(':')[1])
        const chip = L.mint.chips[index]
        if (chip) spawnBurst([chip.x, 0.7, chip.z], P.amber, { radius: 1.1, dur: 650, peak: 0.42 })
      }
      if (snap.wiring > before.wiring) {
        const last = p.lastWire
        if (last) {
          const a = portPos(state, last.from)
          const b = portPos(state, last.to)
          spawnBurst([(a[0] + b[0]) / 2, 1.3, (a[2] + b[2]) / 2], P.mint, { radius: 0.9, dur: 620, peak: 0.38 })
        }
      }
      if (snap.verify === 'pass' && before.verify !== 'pass') {
        spawnBurst([0, 1.2, 0], P.mint, { radius: 2.6, dur: 1100, peak: 0.5 })
      }
      if (snap.phase !== before.phase) {
        const m = L.tapeout.machine
        const c = L.tapeout.crystal
        if (snap.phase === 'running') spawnBurst([m.x, 1.4, m.z], P.amber, { radius: 2.2, dur: 1000 })
        if (snap.phase === 'done') {
          spawnBurst([c.x, 1.7, c.z], P.gold, { radius: 2.8, dur: 1400, peak: 0.62 })
          spawnBurst([m.x, 1.4, m.z], P.cyan, { radius: 1.8, dur: 900 })
        }
      }
      if (state.chapter === 4 && snap.stateBits !== before.stateBits) {
        const q = snap.stateBits & 1
        spawnBurst([L.latch.outs[0].x, 0.8, L.latch.outs[0].z], q ? P.mint : P.magenta, {
          radius: 1.1,
          dur: 700,
          peak: 0.42,
        })
      }
      if (state.chapter === 6 && snap.reveal > before.reveal) {
        const core = L.behemoth.core
        spawnBurst([core.x, 1.3, core.z], P.magenta, { radius: 0.9, dur: 550, peak: 0.34 })
      }
      if (snap.showResult && !before.showResult) {
        const display = L.behemoth.display
        spawnBurst([display.x, 1.7, display.z], P.gold, { radius: 2.6, dur: 1400, peak: 0.6 })
      }
      if (state.chapter === 7 && snap.segMask !== before.segMask) {
        spawnBurst([3.1, 1.5, 0], P.amber, { radius: 1.2, dur: 620, peak: 0.4 })
      }
      if (state.chapter === 8 && snap.counterBits !== before.counterBits) {
        spawnBurst([-1.2, 1.3, 0], P.cyan, { radius: 1.0, dur: 520, peak: 0.35 })
      }
      if (state.chapter === 9 && snap.cpuHalted && !before.cpuHalted) {
        spawnBurst([3.4, 1.9, 0], P.gold, { radius: 2.2, dur: 1200, peak: 0.55 })
      }
      if (state.chapter === 10 && snap.safetyMode !== before.safetyMode) {
        const colors = [P.mint, P.amber, P.cyan, P.red]
        spawnBurst([0.4, 1.2, 0], colors[snap.safetyMode] || P.cyan, { radius: 2.0, dur: 900, peak: 0.45 })
      }
      if (snap.completed > before.completed) {
        spawnBurst([0, 1.4, 0], snap.allDone ? P.gold : P.mint, {
          radius: snap.allDone ? 3.6 : 2.4,
          dur: snap.allDone ? 1600 : 1100,
          peak: snap.allDone ? 0.66 : 0.46,
          thick: snap.allDone ? 3.4 : 2.2,
        })
      }
      if (snap.allDone && !before.allDone) {
        spawnBurst([0, 2.0, 0], P.cyan, { radius: 4.2, dur: 1900, peak: 0.5, thick: 3 })
      }
    }

    function observe(state) {
      const snap = snapshot(state)
      bumpFx(state, snap)
      prevSnap = snap
      const key = sceneSignature(state)
      if (key !== sceneKey) {
        sceneKey = key
        sync(state)
      }
    }

    function updateFx() {
      const now = engine.time()
      for (let i = fx.length - 1; i >= 0; i -= 1) {
        const entry = fx[i]
        const k = (now - entry.t0) / entry.dur
        if (k >= 1) {
          entry.ring.remove()
          entry.glow.remove()
          fx.splice(i, 1)
          continue
        }
        const eased = 1 - Math.pow(1 - k, 3)
        entry.ring.set({ radius: 0.25 + entry.maxR * eased, opacity: 1 - k * 0.85 })
        entry.glow.set({ radius: 0.5 + entry.maxR * 0.8 * eased, opacity: (1 - k) * 0.9, intensity: (1 - k) * entry.peak })
      }
    }
    function sync(state) {
      // anonymous backdrop pieces are rebuilt on every sync
      for (const [id, handle] of Array.from(items.entries())) {
        if (id.indexOf('auto:') === 0) {
          handle.remove()
          items.delete(id)
        }
      }
      const chapter = state.chapter
      if (chapter !== currentChapter || state.epoch !== lastEpoch) {
        const first = currentChapter === null
        for (const entry of fx) {
          entry.ring.remove()
          entry.glow.remove()
        }
        fx.length = 0
        clear()
        currentChapter = chapter
        lastEpoch = state.epoch
        const preset = CAMERA[chapter] || CAMERA[0]
        engine.setCamera(preset, { animateMs: first ? 0 : 700 })
        if (chapter === 6) engine.autoRotate(false)
      }
      const specs = sceneSpecs(state).concat(wireSpecs(state))
      const alive = new Set()
      for (const spec of specs) {
        alive.add(spec.id || null)
        if (!spec.id) {
          // Track anonymous backdrop pieces too: clear() and the next sync remove
          // them through the same map, otherwise they leak on every chapter change.
          const handle = engine.add(spec)
          items.set(`auto:${items.size}`, handle)
          continue
        }
        const existing = items.get(spec.id)
        if (existing) {
          existing.set(spec)
        } else {
          add(spec)
        }
      }
      // remove named handles whose id disappeared (dynamic scene pieces)
      for (const [id, handle] of Array.from(items.entries())) {
        if (id.indexOf('auto:') !== 0 && id.indexOf('fx:') !== 0 && !alive.has(id)) {
          handle.remove()
          items.delete(id)
        }
      }
      lastPending = api.getPending()
    }

    // ---------------------------------------------------------------- frame
    function frame() {
      tickTime = engine.time()
      frameNo += 1
      updateFx()
      const state = store.get()
      const pending = api.getPending()
      if (pending !== lastPending) {
        lastPending = pending
        sync(state)
        return
      }
      // animated signal flow along every drawn wire (throttled; pending preview is live)
      for (const [id, handle] of items.entries()) {
        if (id.indexOf('wire:') !== 0) continue
        if (id === 'wire:pending') {
          if (pending && pointer) {
            const from = portPos(state, pending)
            const to = pointer.world
            handle.set({
              points: [from, [from[0], 1.5, from[2]], [to[0], Math.max(0.6, to[1]), to[2]]],
            })
          }
          continue
        }
        if (frameNo % 4 === 0) handle.set({ flow: (tickTime * 0.00022 + items.size * 0.003) % 1 })
      }
      // chip float
      if (state.chapter === 0) {
        const play = state.play || {}
        L.mint.chips.forEach((chip, index) => {
          const handle = items.get(chip.id)
          if (!handle) return
          const minted = (play.minted || []).indexOf(chip.id) >= 0
          const bob = Math.sin(tickTime * 0.0016 + index * 1.7) * 0.06
          handle.set({ pos: [chip.x, 0.5 + bob + (minted ? 0.04 : 0), chip.z] })
        })
      }
      // tape-out animation
      if (state.chapter === 3 && state.play && state.play.phase === 'running') {
        const progress = TT.util.clamp((Date.now() - state.play.startedAt) / 4200, 0, 1)
        const machine = items.get('machine')
        if (machine) machine.set({ glow: 0.4 + progress * 0.4 })
        const crystal = items.get('crystal')
        if (!crystal && progress > 0.85) sync(state)
        const hexText = items.get('tapeout:hex')
        if (hexText) hexText.set({ text: (state.play.halfHex || '').slice(0, Math.floor(((state.play.halfHex || '').length / 2) * progress) * 2) })
      }
    }

    // ---------------------------------------------------------------- pointer
    const local = (event) => {
      const rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    function onMove(event) {
      const point = local(event)
      const world = engine.screenToPlane(point.x, point.y, 0.55)
      pointer = { screen: point, world: world || [0, 0.55, 0] }
    }

    canvas.addEventListener('pointermove', onMove, { passive: true })

    engine.setPickCallback((pick, phase) => {
      if (phase === 'click') {
        onClick(pick)
        return
      }
      if (phase === 'hover' || phase === 'leave') {
        if (!pick) {
          setHover(null)
          return
        }
        const label = hoverLabel(store.get(), pick.id)
        setHover(label)
      }
    })

    function onClick(pick) {
      const state = store.get()
      const id = pick && pick.id
      if (!id) {
        if (api.getPending()) api.clearPending()
        return
      }
      if (id.indexOf('port:') === 0) {
        api.selectPort(id.slice(5))
        return
      }
      if (id.indexOf('pad:') === 0) {
        const index = Number(id.split(':')[2])
        api.dispatch({ type: 'input/toggle', index })
        return
      }
      if (id.indexOf('segpad:') === 0 && state.chapter === 7) {
        api.dispatch({ type: 'seg/input', index: Number(id.split(':')[1]) })
        return
      }
      if (id.indexOf('safepad:') === 0 && state.chapter === 10) {
        api.dispatch({ type: 'safety/toggle', index: Number(id.split(':')[1]) })
        return
      }
      if (id.indexOf('chip:') === 0) {
        api.dispatch({ type: 'mint', chip: id })
        return
      }
      if (id === 'machine' && state.chapter === 3) {
        api.dispatch({ type: 'tapeout/start' })
        return
      }
      if (id === 'crystal' && state.chapter === 3) {
        api.dispatch({ type: 'eval/run' })
        return
      }
      if (id === 'die' && state.chapter === 6) {
        api.dispatch({ type: 'program/run' })
        return
      }
      if (id === 'display' && state.chapter === 6) {
        api.dispatch({ type: 'program/again' })
        return
      }
      if (id.indexOf('latchpad:') === 0) {
        const which = id.slice(id.lastIndexOf(':') + 1)
        api.dispatch({ type: 'latch/toggle', kind: which === '0' ? 'set' : 'reset' })
        return
      }
      if (api.getPending()) api.clearPending()
    }

    function hoverLabel(state, id) {
      if (!id) return null
      if (id.indexOf('segpad:') === 0) return t('hover.segpad', { n: Number(id.split(':')[1]) })
      if (id.indexOf('safepad:') === 0) return t('hover.safepad', { n: Number(id.split(':')[1]) })
      if (id.indexOf('chip:') === 0) return t('hover.chip')
      if (id.indexOf('pad:') === 0) {
        const parts = id.split(':')
        return t('hover.padToggle', { p: padLabel(state, Number(parts[2])) })
      }
      if (id.indexOf('port:') === 0) {
        const port = id.slice(5)
        const desc = TT.Missions.describePort(state, port)
        if (!desc) return null
        const source = TT.Missions.isSource(state, port)
        return `${t(desc.key, desc.params)} · ${source ? t('hover.source') : t('hover.sink')}`
      }
      if (id === 'machine') return t('hover.machine')
      if (id === 'crystal') return t('hover.crystal')
      if (id === 'die') return t('hover.cpu')
      if (id === 'display') return t('hover.display')
      if (id === 'surface' || id === 'wafer') return t('hover.die')
      return null
    }

    function padLabel(state, index) {
      const pads = padList(state)
      const pad = pads[index]
      return pad ? pad.label : String(index)
    }

    // ---------------------------------------------------------------- lifecycle
    const unsubscribe = store.subscribe(observe)
    sceneKey = sceneSignature(store.get())
    sync(store.get())
    prevSnap = snapshot(store.get())
    engine.setFrameCallback(frame)
    engine.start()
    api.attachWorld({
      resetCamera: () => {
        const preset = CAMERA[store.get().chapter] || CAMERA[0]
        engine.setCamera(preset, { animateMs: 500 })
      },
      setActive: (active) => {
        if (active) {
          engine.resize()
          engine.start()
        } else {
          engine.stop()
        }
      },
      dispose: () => {
        engine.dispose()
      },
    })

    return {
      dispose() {
        if (disposed) return
        disposed = true
        unsubscribe()
        canvas.removeEventListener('pointermove', onMove)
        api.detachWorld()
        engine.dispose()
      },
    }
  }

  return { mount }
})()

// ----------------------------------------------------------------------------- client entry

function apply(ctx) {
  const t = ctx.locale.bind('tapeoutLab')
  const api = TT.App.create(ctx, t)

  ctx.effect(() => ctx.locale.register('tapeoutLab', TT.dict), 'tapeout-lab: locale')

  ctx.effect(
    () =>
      ctx.slots.inject('main', () =>
        ctx.slots.register({ name: 'main', key: PANEL_ID }, () =>
          TT.UI.Panel({ ctx, store: api.store, api, t }),
        ),
      ),
    'tapeout-lab: main panel',
  )

  ctx.effect(
    () =>
      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 4,
            label: () => t('panel.title'),
          },
          (props) => TT.UI.Icon({ size: (props && props.size) || 18 }),
        ),
      ),
    'tapeout-lab: sidebar entry',
  )
}

TT.plugin = {
  inject: ['slots', 'locale', 'layout'],
  apply,
}
