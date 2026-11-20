/**
 * 36-audio — tiny WebAudio synth for the lab. No assets, no network: every sound is
 * a short oscillator envelope. Safely no-ops without AudioContext (SSR / Node tests)
 * and stays silent until a user gesture resumes the context.
 */

TT.Audio = (function () {
  let ctx = null
  let master = null
  let muted = false
  let failed = false

  function ensure() {
    if (ctx || failed) return ctx
    try {
      const AC = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null
      if (!AC) {
        failed = true
        return null
      }
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = muted ? 0 : 0.16
      master.connect(ctx.destination)
    } catch (error) {
      failed = true
      ctx = null
    }
    return ctx
  }

  function init() {
    const c = ensure()
    if (c && c.state === 'suspended') c.resume().catch(function () {})
  }

  function env(gain, start, peak, end) {
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
  }

  function tone(freq, dur, type, peak, slideTo, delay) {
    const c = ensure()
    if (!c) return
    const t0 = c.currentTime + (delay || 0)
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type || 'sine'
    osc.frequency.setValueAtTime(freq, t0)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
    env(gain, t0, peak || 0.18, t0 + dur)
    osc.connect(gain)
    gain.connect(master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.03)
  }

  function noise(dur, peak, lowpass) {
    const c = ensure()
    if (!c) return
    const length = Math.max(1, Math.floor(c.sampleRate * dur))
    const buffer = c.createBuffer(1, length, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
    const source = c.createBufferSource()
    source.buffer = buffer
    const gain = c.createGain()
    gain.gain.value = peak || 0.1
    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = lowpass || 1200
    source.connect(filter)
    filter.connect(gain)
    gain.connect(master)
    source.start()
  }

  const SOUNDS = {
    click: function () {
      tone(880, 0.045, 'square', 0.05, 620)
    },
    wire: function () {
      tone(660, 0.06, 'sine', 0.12, 990)
    },
    mint: function () {
      tone(520, 0.12, 'triangle', 0.16, 1040)
      tone(780, 0.16, 'sine', 0.08, 1560, 0.04)
    },
    verify: function () {
      tone(784, 0.1, 'sine', 0.14)
      tone(1175, 0.16, 'sine', 0.12, null, 0.09)
    },
    error: function () {
      tone(180, 0.2, 'square', 0.12, 120)
    },
    tapeout: function () {
      noise(0.9, 0.12, 900)
      tone(240, 0.8, 'sawtooth', 0.1, 70)
      tone(480, 0.4, 'sine', 0.06, 240, 0.06)
    },
    success: function () {
      tone(523, 0.16, 'sine', 0.13)
      tone(659, 0.16, 'sine', 0.12, null, 0.1)
      tone(784, 0.22, 'sine', 0.12, null, 0.2)
      tone(1046, 0.3, 'sine', 0.1, null, 0.3)
    },
    tick: function () {
      tone(1320, 0.03, 'square', 0.035)
    },
    blip: function () {
      tone(440, 0.06, 'sine', 0.1, 660)
    },
    levelup: function () {
      tone(392, 0.12, 'triangle', 0.12)
      tone(587, 0.16, 'triangle', 0.12, null, 0.1)
      tone(784, 0.24, 'triangle', 0.12, null, 0.2)
    },
    whoosh: function () {
      noise(0.35, 0.06, 2400)
    },
  }

  function play(name) {
    if (muted) return
    const sound = SOUNDS[name]
    if (!sound) return
    if (!ensure()) return
    if (ctx.state === 'suspended') init()
    try {
      sound()
    } catch (error) {
      /* audio must never break the game */
    }
  }

  function setMuted(value) {
    muted = Boolean(value)
    if (master) master.gain.value = muted ? 0 : 0.16
    return muted
  }

  return {
    init,
    play,
    note: function (freq, dur, type, peak) {
      if (muted) return
      const audio = ensure()
      if (!audio) return
      if (audio.state === 'suspended') audio.resume().catch(function () {})
      try {
        tone(freq, Math.max(0.04, dur || 0.18), type || 'triangle', peak || 0.16)
      } catch (error) {
        /* ignore */
      }
    },
    setMuted,
    isMuted: () => muted,
    sounds: Object.keys(SOUNDS),
  }
})()
