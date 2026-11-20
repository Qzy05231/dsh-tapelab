/**
 * 47-achievements — local progress badges and playground records.
 * Everything is derived from mission state plus a small persisted stats slice.
 */

TT.Achievements = (function () {
  const LIST = [
    { id: 'mint8', tier: 'bronze', titleKey: 'achv.mint8.title', descKey: 'achv.mint8.desc', check: (s) => Boolean(s.completed && s.completed[0]) },
    { id: 'halfadder', tier: 'bronze', titleKey: 'achv.halfadder.title', descKey: 'achv.halfadder.desc', check: (s) => Boolean(s.completed && s.completed[2]) },
    { id: 'tapeout', tier: 'bronze', titleKey: 'achv.tapeout.title', descKey: 'achv.tapeout.desc', check: (s) => Boolean(s.completed && s.completed[3]) },
    { id: 'sevenseg', tier: 'silver', titleKey: 'achv.sevenseg.title', descKey: 'achv.sevenseg.desc', check: (s) => Boolean(s.completed && s.completed[7]) },
    { id: 'cpu', tier: 'silver', titleKey: 'achv.cpu.title', descKey: 'achv.cpu.desc', check: (s) => Boolean(s.completed && s.completed[9]) },
    { id: 'safety', tier: 'gold', titleKey: 'achv.safety.title', descKey: 'achv.safety.desc', check: (s) => Boolean(s.completed && s.completed[10]) },
    { id: 'finale', tier: 'gold', titleKey: 'achv.finale.title', descKey: 'achv.finale.desc', check: (s) => allDone(s) },
    { id: 'snake10', tier: 'silver', titleKey: 'achv.snake10.title', descKey: 'achv.snake10.desc', check: (s) => stats(s).snakeBest >= 10 },
    { id: 'debug5', tier: 'silver', titleKey: 'achv.debug5.title', descKey: 'achv.debug5.desc', check: (s) => stats(s).debugSolved >= 5 },
    { id: 'synth1', tier: 'bronze', titleKey: 'achv.synth1.title', descKey: 'achv.synth1.desc', check: (s) => stats(s).synth >= 1 },
    { id: 'synth10', tier: 'gold', titleKey: 'achv.synth10.title', descKey: 'achv.synth10.desc', check: (s) => stats(s).synth >= 10 },
    { id: 'guess3', tier: 'silver', titleKey: 'achv.guess3.title', descKey: 'achv.guess3.desc', check: (s) => stats(s).guessBest !== null && stats(s).guessBest <= 3 },
    { id: 'lock1', tier: 'bronze', titleKey: 'achv.lock1.title', descKey: 'achv.lock1.desc', check: (s) => stats(s).lockWins >= 1 },
    { id: 'verilog', tier: 'silver', titleKey: 'achv.verilog.title', descKey: 'achv.verilog.desc', check: (s) => stats(s).imports >= 1 },
    { id: 'daily1', tier: 'bronze', titleKey: 'achv.daily1.title', descKey: 'achv.daily1.desc', check: (s) => Object.keys(stats(s).daily || {}).length >= 1 },
    { id: 'daily3', tier: 'gold', titleKey: 'achv.daily3.title', descKey: 'achv.daily3.desc', check: (s) => Object.keys(stats(s).daily || {}).length >= 3 },
    { id: 'challenge1', tier: 'silver', titleKey: 'achv.challenge1.title', descKey: 'achv.challenge1.desc', check: (s) => Object.keys(stats(s).challenge || {}).length >= 1 },
    { id: 'challengeGold', tier: 'gold', titleKey: 'achv.challengeGold.title', descKey: 'achv.challengeGold.desc', check: (s) => Object.values(stats(s).challenge || {}).some((entry) => entry && entry.stars >= 3) },
    { id: 'apps', tier: 'gold', titleKey: 'achv.apps.title', descKey: 'achv.apps.desc', check: (s) => Boolean(s.completed && s.completed[11] && s.completed[12] && s.completed[13]) },
  ]

  function stats(state) {
    return (state && state.stats) || {}
  }

  function allDone(state) {
    if (!state || !state.completed) return false
    const total = TT.protocol && TT.protocol.CHAPTERS ? TT.protocol.CHAPTERS.length : 14
    for (let index = 0; index < total; index += 1) if (!state.completed[index]) return false
    return true
  }

  function evaluate(state) {
    return LIST.map((item) => ({
      id: item.id,
      tier: item.tier,
      titleKey: item.titleKey,
      descKey: item.descKey,
      done: Boolean(item.check(state)),
    }))
  }

  function doneIds(state) {
    const unlocked = new Set(state && state.unlocked ? state.unlocked : [])
    return LIST.filter((item) => item.check(state) && !unlocked.has(item.id)).map((item) => item.id)
  }

  function shareText(state, t) {
    const list = evaluate(state)
    const done = list.filter((item) => item.done)
    const daily = Object.keys(stats(state).daily || {}).length
    const lines = [
      `TapeOut 3D 实验室 · 我的战绩`,
      `徽章 ${done.length}/${list.length} · 每日挑战 ${daily} 天`,
      `贪吃蛇最高分 ${stats(state).snakeBest || 0} · 排障 ${stats(state).debugSolved || 0} 关 · 综合 ${stats(state).synth || 0} 次`,
      `猜数最佳 ${stats(state).guessBest || '—'} 次 · 密码锁 ${stats(state).lockWins || 0} 次`,
      `—— 从一颗与非门到链上巨兽`,
    ]
    return lines.join('\n')
  }

  function drawCard(ctx, state, t, width, height) {
    const w = width || 1200
    const h = height || 630
    const list = evaluate(state)
    const done = list.filter((item) => item.done)
    const gradient = ctx.createLinearGradient(0, 0, w, h)
    gradient.addColorStop(0, '#07121d')
    gradient.addColorStop(0.55, '#0a1f2e')
    gradient.addColorStop(1, '#11283a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
    // subtle circuit grid
    ctx.strokeStyle = 'rgba(86,225,255,.07)'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = 0; y < h; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
    ctx.fillStyle = '#2be6c2'
    ctx.font = '700 22px ui-monospace, monospace'
    ctx.fillText('TAPEOUT 3D LAB', 64, 82)
    ctx.fillStyle = '#e8f6ff'
    ctx.font = '800 46px ui-sans-serif, -apple-system, sans-serif'
    ctx.fillText('我的成就战绩', 64, 142)
    ctx.fillStyle = '#8fb3c8'
    ctx.font = '18px ui-sans-serif, -apple-system, sans-serif'
    ctx.fillText(`徽章 ${done.length} / ${list.length} · 每日挑战 ${Object.keys(stats(state).daily || {}).length} 天`, 64, 180)
    // stats row
    const statRows = [
      ['贪吃蛇最高分', stats(state).snakeBest || 0],
      ['排障通关', stats(state).debugSolved || 0],
      ['综合次数', stats(state).synth || 0],
      ['猜数最佳', stats(state).guessBest || '—'],
      ['密码锁', stats(state).lockWins || 0],
    ]
    statRows.forEach(([label, value], index) => {
      const x = 64 + index * 210
      ctx.fillStyle = '#56e1ff'
      ctx.font = '700 34px ui-monospace, monospace'
      ctx.fillText(String(value), x, 262)
      ctx.fillStyle = '#8fb3c8'
      ctx.font = '15px ui-sans-serif, -apple-system, sans-serif'
      ctx.fillText(label, x, 290)
    })
    // badges: 5 columns
    const cols = 5
    const cellW = (w - 128) / cols
    done.slice(0, 15).forEach((item, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = 64 + col * cellW
      const y = 340 + row * 84
      ctx.fillStyle = 'rgba(43,230,194,.08)'
      const radius = 12
      ctx.beginPath()
      ctx.roundRect(x, y, cellW - 14, 70, radius)
      ctx.fill()
      ctx.strokeStyle = item.tier === 'gold' ? 'rgba(255,195,92,.6)' : item.tier === 'silver' ? 'rgba(86,225,255,.55)' : 'rgba(43,230,194,.45)'
      ctx.stroke()
      ctx.fillStyle = '#ffc35c'
      ctx.font = '22px ui-sans-serif, -apple-system, sans-serif'
      ctx.fillText('🏅', x + 12, y + 38)
      ctx.fillStyle = '#e8f6ff'
      ctx.font = '600 14px ui-sans-serif, -apple-system, sans-serif'
      const title = t ? t(item.titleKey) : item.id
      ctx.fillText(title.length > 10 ? title.slice(0, 10) + '…' : title, x + 44, y + 34)
    })
    ctx.fillStyle = '#4d738a'
    ctx.font = '14px ui-monospace, monospace'
    ctx.fillText(`dsh-tapelab · ${new Date().toISOString().slice(0, 10)} · 从一颗与非门到链上巨兽`, 64, h - 32)
  }

  function cardDataUrl(state, t) {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    drawCard(ctx, state, t, 1200, 630)
    return canvas.toDataURL('image/png')
  }

  function unlockedList(state) {
    const ids = new Set((state && state.unlocked) || [])
    return LIST.filter((item) => ids.has(item.id) || item.check(state))
  }

  return { LIST, evaluate, doneIds, unlockedList, stats, allDone, shareText, drawCard, cardDataUrl }
})()
