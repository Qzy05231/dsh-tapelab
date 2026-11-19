/**
 * 46-boxing — TapOut boxing: a small turn-based boxing game whose referee is a real
 * NAND netlist. Actions (punch / guard / feint) are encoded in 2 bits per boxer; the
 * 4-input, 2-output referee circuit decides who scores. Match logs are replayable
 * and can be verified offline against the circuit fingerprint.
 */

TT.Boxing = (function () {
  const ACTIONS = [
    { id: 'punch', labelKey: 'boxing.action.punch', icon: '👊' },
    { id: 'guard', labelKey: 'boxing.action.guard', icon: '🛡️' },
    { id: 'feint', labelKey: 'boxing.action.feint', icon: '↩️' },
  ]
  const CODE = { punch: 0, guard: 1, feint: 2 }
  const MAX_EXCHANGES = 20
  const START_HP = 6

  const cache = Object.create(null)

  function playerScore(p, c) {
    return p === 'punch' ? (c === 'punch' || c === 'feint' ? 1 : 0) : p === 'feint' && c === 'guard' ? 1 : 0
  }
  function cpuScore(p, c) {
    return c === 'punch' ? (p === 'punch' || p === 'feint' ? 1 : 0) : c === 'feint' && p === 'guard' ? 1 : 0
  }

  function truthTable(fn) {
    const bits = []
    for (let index = 0; index < 16; index += 1) {
      const p = index & 3
      const c = (index >> 2) & 3
      if (p === 3 || c === 3) {
        bits.push(-1)
        continue
      }
      bits.push(fn(p, c) ? 1 : 0)
    }
    return bits
  }

  function circuit() {
    if (cache.referee) return cache.referee
    const playerBits = truthTable((p, c) => playerScore(ACTIONS[p].id, ACTIONS[c].id))
    const cpuBits = truthTable((p, c) => cpuScore(ACTIONS[p].id, ACTIONS[c].id))
    const playerSynth = TT.Circuit.synth({ nIn: 4, bits: playerBits })
    const cpuSynth = TT.Circuit.synth({ nIn: 4, bits: cpuBits })
    const composed = TT.Circuit.compose({
      nIn: 4,
      parts: [
        { netlist: playerSynth.netlist, inputNodes: [2, 3, 4, 5], outputNodes: [200] },
        { netlist: cpuSynth.netlist, inputNodes: [2, 3, 4, 5], outputNodes: [201] },
      ],
      outputs: [200, 201],
    })
    cache.referee = {
      netlist: composed,
      gateCount: TT.Circuit.gateCount(composed),
      depth: TT.Circuit.maxDepth(composed),
      fingerprint: fingerprint(composed),
      hex: TT.Circuit.gateHex(composed),
    }
    return cache.referee
  }

  function fingerprint(netlist) {
    const hex = TT.Circuit.gateHex(netlist)
    let hash = 0x811c9dc5
    for (let i = 0; i < hex.length; i += 1) {
      hash ^= hex.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash.toString(16).padStart(8, '0')
  }

  function hash32(text) {
    let hash = 0x811c9dc5
    const string = String(text)
    for (let i = 0; i < string.length; i += 1) {
      hash ^= string.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash >>> 0
  }

  function cpuAction(seed, exchange) {
    return ACTIONS[hash32(String(seed) + '|cpu|' + exchange) % 3].id
  }

  function exchangeBits(playerAction, cpuActionId) {
    return (CODE[playerAction] || 0) | ((CODE[cpuActionId] || 0) << 2)
  }

  function resolve(playerAction, cpuActionId) {
    const built = circuit()
    const bits = exchangeBits(playerAction, cpuActionId)
    const outputs = TT.Circuit.evaluate(built.netlist, bits).outputs
    return { bits, playerScore: outputs[0], cpuScore: outputs[1] }
  }

  function start(seed) {
    return {
      seed: seed || 'ring-genesis',
      round: 1,
      wins: { player: 0, cpu: 0 },
      roundWins: 0,
      combo: 0,
      bestCombo: 0,
      playerHp: START_HP,
      cpuHp: START_HP,
      exchange: 0,
      roundExchange: 0,
      log: [],
      last: null,
      finished: false,
      result: null,
      receipt: null,
      verifyResult: null,
      verifyCode: '',
    }
  }

  function audit() {
    const built = circuit()
    let mismatches = 0
    let rows = 0
    for (let p = 0; p < 3; p += 1) {
      for (let c = 0; c < 3; c += 1) {
        const result = resolve(ACTIONS[p].id, ACTIONS[c].id)
        rows += 1
        if (result.playerScore !== playerScore(ACTIONS[p].id, ACTIONS[c].id)) mismatches += 1
        if (result.cpuScore !== cpuScore(ACTIONS[p].id, ACTIONS[c].id)) mismatches += 1
      }
    }
    return { passed: mismatches === 0, rows, mismatches, gateCount: built.gateCount, depth: built.depth, fingerprint: built.fingerprint }
  }

  function b64url(text) {
    return TT.Export.b64encode(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  function unb64url(code) {
    const base64 = String(code || '').trim().replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return TT.Export.b64decode(padded)
  }

  function receipt(match) {
    const built = circuit()
    const payload = {
      schema: 'dsh-tapelab.boxing.v1',
      seed: match.seed,
      log: match.log.map((entry) => ({ n: entry.n, round: entry.round, player: entry.player, cpu: entry.cpu, playerScore: entry.playerScore, cpuScore: entry.cpuScore, bits: entry.bits })),
      round: match.round,
      wins: match.wins,
      playerHp: match.playerHp,
      cpuHp: match.cpuHp,
      result: match.result,
      fingerprint: built.fingerprint,
      gates: built.netlist.gates.map((gate) => [gate.a, gate.b]),
      outputs: built.netlist.outputs.slice(),
      at: Date.now(),
    }
    return { code: b64url(JSON.stringify(payload)), payload, fingerprint: built.fingerprint }
  }

  function verify(code, expectedFingerprint) {
    const reasons = []
    let payload
    try {
      payload = JSON.parse(unb64url(code))
    } catch (error) {
      return { ok: false, reasons: ['比赛凭证无法解码'], payload: null }
    }
    if (!payload || payload.schema !== 'dsh-tapelab.boxing.v1') return { ok: false, reasons: ['比赛凭证格式不匹配'], payload: null }
    let netlist
    try {
      netlist = TT.Circuit.makeNetlist({
        nIn: 4,
        gates: (payload.gates || []).map((pair) => ({ a: Number(pair[0]), b: Number(pair[1]) })),
        outputs: (payload.outputs || []).map(Number),
      })
      const check = TT.Circuit.validateNetlist(netlist)
      if (!check.ok) throw new Error(check.error)
    } catch (error) {
      return { ok: false, reasons: ['凭证里的裁判网表无效'], payload }
    }
    const actualFingerprint = fingerprint(netlist)
    if (actualFingerprint !== payload.fingerprint) reasons.push('裁判网表指纹不一致（可能被篡改）')
    if (expectedFingerprint && String(expectedFingerprint).trim().toLowerCase() !== actualFingerprint) {
      reasons.push(`指纹不匹配：凭证 ${actualFingerprint}，期望 ${String(expectedFingerprint).trim().toLowerCase()}`)
    }
    let playerHp = START_HP
    let cpuHp = START_HP
    let round = 1
    let roundExchange = 0
    const wins = { player: 0, cpu: 0 }
    for (const entry of payload.log || []) {
      if (entry.round && entry.round !== round) reasons.push('日志的回合编号不连续')
      const bits = exchangeBits(entry.player, entry.cpu)
      if (bits !== entry.bits) reasons.push('日志输入位与动作不一致')
      const outputs = TT.Circuit.evaluate(netlist, bits).outputs
      if (outputs[0] !== entry.playerScore || outputs[1] !== entry.cpuScore) reasons.push('日志得分与裁判网表不一致')
      playerHp = Math.max(0, playerHp - outputs[1])
      cpuHp = Math.max(0, cpuHp - outputs[0])
      roundExchange += 1
      const roundOver = playerHp <= 0 || cpuHp <= 0 || roundExchange >= MAX_EXCHANGES
      if (roundOver) {
        if (playerHp > cpuHp) wins.player += 1
        else if (cpuHp > playerHp) wins.cpu += 1
        const matchOver = wins.player >= 2 || wins.cpu >= 2
        if (!matchOver) {
          round += 1
          roundExchange = 0
          playerHp = START_HP
          cpuHp = START_HP
        }
      }
    }
    if (wins.player !== payload.wins.player || wins.cpu !== payload.wins.cpu) reasons.push('还原后的局分与凭证不一致')
    const expectedResult = wins.player > wins.cpu ? 'win' : wins.player < wins.cpu ? 'lose' : 'draw'
    if (payload.result && payload.result !== expectedResult) reasons.push('比赛结果与日志不一致')
    return { ok: reasons.length === 0, reasons, payload, playerHp, cpuHp, wins, result: expectedResult, fingerprint: actualFingerprint }
  }

  return { ACTIONS, START_HP, MAX_EXCHANGES, circuit, resolve, cpuAction, start, audit, receipt, verify, fingerprint, exchangeBits, b64url, unb64url }
})()

// --------------------------------------------------------------------------- UI

TT.BoxingUI = (function () {
  const h = TT.h
  const FX_TEXT = { hit: 'boxing.hit', hurt: 'boxing.hurt', block: 'boxing.blocked', trade: 'boxing.trade' }

  function Fighter(props) {
    const { name, emoji, hp, wins, combo, side } = props
    return h('div', { className: `tt-fighter ${side}` },
      h('div', { className: 'tt-fighter-name' }, emoji, ' ', name),
      h('div', { className: 'tt-hpseg' }, Array.from({ length: TT.Boxing.START_HP }, (_, index) =>
        h('i', { key: index, 'data-on': index < hp ? 'true' : 'false' }))),
      h('div', { className: 'tt-fighter-meta' },
        h('span', null, wins ? '★'.repeat(wins) : '—'),
        side === 'player' && combo >= 2 ? h('b', null, `COMBO ×${combo}`) : null,
      ),
    )
  }

  function Sprite(props) {
    const { side, anim, low } = props
    return h('div', {
      className: 'tt-sprite',
      'data-side': side,
      'data-anim': anim || 'idle',
      'data-low': low ? 'true' : 'false',
    },
      h('div', { className: 'tt-sprite-shadow' }),
      h('div', { className: 'tt-sprite-glow' }),
      h('div', { className: 'tt-sprite-body' }),
      h('div', { className: 'tt-sprite-head' }),
      h('div', { className: 'tt-sprite-glove g1' }),
      h('div', { className: 'tt-sprite-glove g2' }),
    )
  }

  function Page(props) {
    const { state, t, api } = props
    const match = state.boxing
    const built = TT.Boxing.circuit()
    const last = match.last
    const fx = last ? (last.playerScore > 0 && last.cpuScore > 0 ? 'trade' : last.playerScore > 0 ? 'hit' : last.cpuScore > 0 ? 'hurt' : 'block') : null
    const finished = match.finished
    React.useEffect(() => {
      if (!last || !TT.Audio) return
      if (finished && match.result === 'win') TT.Audio.play('success')
      else if (finished && match.result === 'lose') TT.Audio.play('error')
      else if (last.playerScore > 0 && last.cpuScore > 0) TT.Audio.play('mint')
      else if (last.playerScore > 0) TT.Audio.play('mint')
      else if (last.cpuScore > 0) TT.Audio.play('error')
      else TT.Audio.play('verify')
    }, [last && last.n, finished])
    function act(action) {
      if (finished) return
      if (TT.Audio) TT.Audio.play('click')
      api.dispatch({ type: 'boxing/action', action })
    }
    return h('div', { className: 'tt-fight' },
      h('div', { className: 'tt-fight-hud' },
        h(Fighter, { name: t('boxing.you'), emoji: '🥊', hp: match.playerHp, wins: match.wins.player, combo: match.combo || 0, side: 'player' }),
        h('div', { className: 'tt-fight-round' },
          h('span', null, `ROUND ${match.round}`),
          h('b', null, `${match.wins.player} : ${match.wins.cpu}`),
          h('small', null, `R${match.round} / 3`),
        ),
        h(Fighter, { name: t('boxing.cpu'), emoji: '🤖', hp: match.cpuHp, wins: match.wins.cpu, combo: 0, side: 'cpu' }),
      ),
      h('div', { className: 'tt-ring', 'data-fx': fx || 'idle', key: `ring-${match.exchange}` },
        h('div', { className: 'tt-ringfloor' }),
        h('div', { className: 'tt-ringropes' }),
        h(Sprite, { side: 'player', anim: last ? last.player : null, low: match.playerHp <= 2 }),
        h(Sprite, { side: 'cpu', anim: last ? last.cpu : null, low: match.cpuHp <= 2 }),
        h('div', { className: 'tt-roundbanner', key: `round-${match.round}` }, `ROUND ${match.round}`),
        fx ? h('div', { className: 'tt-fx', 'data-type': fx, key: `fx-${match.exchange}` }, t(FX_TEXT[fx])) : null,
        match.combo >= 2 && !finished ? h('div', { className: 'tt-combobadge' }, `${t('fight.combo')} ×${match.combo}`) : null,
        finished
          ? h('div', { className: 'tt-ko' },
              h('h3', null, match.result === 'win' ? t('boxing.win') : match.result === 'lose' ? t('boxing.lose') : t('boxing.draw')),
              h('p', null, `${t('boxing.roundScore')} ${match.wins.player} : ${match.wins.cpu} · ${t('fight.bestCombo')} ×${match.bestCombo || 0}`),
              h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
                onClick: () => api.dispatch({ type: 'boxing/start' }) }, t('boxing.again')),
            )
          : null,
      ),
      h('div', { className: 'tt-fight-controls' }, TT.Boxing.ACTIONS.map((action, index) =>
        h('button', {
          key: action.id,
          type: 'button',
          className: 'tt-fightbtn',
          'data-kind': action.id,
          disabled: finished,
          onClick: () => act(action.id),
        }, h('span', null, action.icon), h('b', null, t(action.labelKey)), h('kbd', null, String(index + 1))))),
      h('p', { className: 'tt-fight-hint' }, t('fight.hint')),
      h('details', { className: 'tt-fight-details' },
        h('summary', null, t('fight.details')),
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, built.gateCount), h('span', null, t('lab.synth.gates'))),
          h('div', { className: 'tt-labstat' }, h('b', null, built.depth), h('span', null, t('hud.depth'))),
          h('div', { className: 'tt-labstat' }, h('b', null, built.fingerprint), h('span', null, t('access.fingerprint'))),
        ),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'boxing/audit' }) }, t('defi.audit')),
          h('span', { className: 'tt-lablabel' }, t('boxing.referee.auditHint')),
        ),
        match.audit
          ? h('div', { className: 'tt-badge', 'data-tone': match.audit.passed ? 'good' : 'bad' },
              `${match.audit.passed ? t('hud.verifyPass') : t('hud.verifyFail')} · ${match.audit.rows}`)
          : null,
        match.receipt
          ? h('div', null,
              h('div', { className: 'tt-lablabel' }, t('boxing.receipt.title')),
              h('div', { className: 'tt-hex tt-mono', style: { maxHeight: 80 } }, match.receipt.code),
              h('div', { className: 'tt-labrow' },
                h('button', { type: 'button', className: 'tt-chip',
                  onClick: () => copyText(api, match.receipt.code) }, t('access.receipt.copy'))),
              h('textarea', {
                className: 'tt-archivebox',
                placeholder: t('access.verify.codePlaceholder'),
                value: match.verifyCode || '',
                onChange: (event) => api.dispatch({ type: 'boxing/verifyCode', code: event.target.value }),
              }),
              h('div', { className: 'tt-labrow' },
                h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
                  onClick: () => api.dispatch({ type: 'boxing/verify' }) }, t('access.verify.run')),
              ),
              match.verifyResult
                ? h('div', { className: 'tt-finalenote', style: { borderLeftColor: match.verifyResult.ok ? 'var(--tt-mint)' : 'var(--tt-red)' } },
                    match.verifyResult.ok
                      ? `${t('access.verify.pass')} · ${t('boxing.result')} ${match.verifyResult.result}`
                      : `${t('access.verify.fail')}：${(match.verifyResult.reasons || []).join('；')}`)
                : null,
            )
          : null,
        h('details', { style: { marginTop: 8 } },
          h('summary', null, t('boxing.rules.title')),
          h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('boxing.why')),
        ),
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

  return { Page }
})()
