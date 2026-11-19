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
  ]

  function stats(state) {
    return (state && state.stats) || {}
  }

  function allDone(state) {
    if (!state || !state.completed) return false
    for (let index = 0; index < 11; index += 1) if (!state.completed[index]) return false
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

  function unlockedList(state) {
    const ids = new Set((state && state.unlocked) || [])
    return LIST.filter((item) => ids.has(item.id) || item.check(state))
  }

  return { LIST, evaluate, doneIds, unlockedList, stats, allDone }
})()
