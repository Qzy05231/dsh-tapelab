/**
 * 42-lottery — verifiable lottery / randomness service.
 *
 * Deterministic and self-contained: a public seed plus the participant list fully
 * determines the winners, so anyone can recompute and verify a receipt offline.
 * Also shows the LFSR view: on-chain randomness is usually derived from a seed via
 * a shift register (8 latches + a few XOR gates ≈ 20 NAND gates).
 */

TT.Lottery = (function () {
  const ALGORITHM = 'fnv1a-sort-v1'

  function hash32(text) {
    let hash = 0x811c9dc5
    const string = String(text)
    for (let i = 0; i < string.length; i += 1) {
      hash ^= string.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash >>> 0
  }

  function parseParticipants(text) {
    const seen = new Set()
    const names = []
    for (const raw of String(text || '').split(/\r?\n/)) {
      const name = raw.trim().replace(/\s+/g, ' ')
      if (!name) continue
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      names.push(name)
    }
    return names
  }

  function draw(options) {
    const seed = String(options.seed || '')
    const names = Array.isArray(options.participants) ? options.participants : parseParticipants(options.text)
    const count = Math.max(1, Math.min(names.length || 1, Number(options.count) || 1))
    if (!seed) throw new Error('draw: seed required')
    if (names.length === 0) throw new Error('draw: participants required')
    const pool = names.map((name, index) => ({
      name,
      index,
      key: hash32(seed + '|' + index + '|' + name),
    }))
    const sorted = pool.slice().sort((a, b) => a.key - b.key || a.index - b.index)
    const winners = sorted.slice(0, count).map((entry, rank) => ({
      rank: rank + 1,
      name: entry.name,
      index: entry.index,
      key: entry.key.toString(16).padStart(8, '0'),
    }))
    return {
      algorithm: ALGORITHM,
      seed,
      seedHash: hash32(seed).toString(16).padStart(8, '0'),
      participantsHash: hash32(names.join('\u0001')).toString(16).padStart(8, '0'),
      participants: names,
      count,
      poolSize: names.length,
      winners,
    }
  }

  /** 8-bit maximal-length LFSR (taps 8,6,5,4) — the "circuit view" of a PRNG. */
  function lfsrStates(seedText, rounds) {
    const length = Math.max(1, Math.min(32, Number(rounds) || 8))
    let state = hash32(seedText) & 0xff || 0x5a
    const states = []
    for (let i = 0; i < length; i += 1) {
      states.push(state)
      const feedback = ((state >> 7) ^ (state >> 5) ^ (state >> 4) ^ (state >> 3)) & 1
      state = ((state << 1) | feedback) & 0xff
    }
    return states
  }

  function b64url(text) {
    return TT.Export.b64encode(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  function unb64url(code) {
    const base64 = String(code || '').trim().replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return TT.Export.b64decode(padded)
  }

  function receipt(result) {
    const payload = {
      schema: 'dsh-tapelab.lottery.v1',
      algorithm: ALGORITHM,
      seed: result.seed,
      seedHash: result.seedHash,
      participantsHash: result.participantsHash,
      participants: result.participants,
      count: result.count,
      winners: result.winners.map((entry) => ({ rank: entry.rank, name: entry.name, index: entry.index })),
      at: Date.now(),
    }
    return { code: b64url(JSON.stringify(payload)), payload, seedHash: result.seedHash }
  }

  function verify(code, expectedSeedHash) {
    const reasons = []
    let payload
    try {
      payload = JSON.parse(unb64url(code))
    } catch (error) {
      return { ok: false, reasons: ['凭证码无法解码'], payload: null }
    }
    if (!payload || payload.schema !== 'dsh-tapelab.lottery.v1') return { ok: false, reasons: ['凭证格式不匹配'], payload: null }
    if (payload.algorithm !== ALGORITHM) reasons.push(`算法版本不匹配：${payload.algorithm}`)
    let recomputed
    try {
      recomputed = draw({ seed: payload.seed, participants: payload.participants, count: payload.count })
    } catch (error) {
      return { ok: false, reasons: ['无法复算：' + String(error && error.message ? error.message : error)], payload }
    }
    if (recomputed.seedHash !== payload.seedHash) reasons.push('种子哈希不一致')
    if (recomputed.participantsHash !== payload.participantsHash) reasons.push('参与者名单哈希不一致（可能被篡改）')
    if (expectedSeedHash && String(expectedSeedHash).trim().toLowerCase() !== recomputed.seedHash) {
      reasons.push(`种子哈希不匹配：凭证 ${recomputed.seedHash}，期望 ${String(expectedSeedHash).trim().toLowerCase()}`)
    }
    const expectedWinners = recomputed.winners
    const claimed = Array.isArray(payload.winners) ? payload.winners : []
    if (claimed.length !== expectedWinners.length) {
      reasons.push(`中奖人数不一致：凭证 ${claimed.length}，复算 ${expectedWinners.length}`)
    } else {
      for (let i = 0; i < claimed.length; i += 1) {
        if (claimed[i].name !== expectedWinners[i].name || claimed[i].index !== expectedWinners[i].index) {
          reasons.push(`第 ${i + 1} 名不一致：凭证 ${claimed[i].name}，复算 ${expectedWinners[i].name}`)
          break
        }
      }
    }
    return {
      ok: reasons.length === 0,
      reasons,
      payload,
      winners: expectedWinners,
      seedHash: recomputed.seedHash,
      participantsHash: recomputed.participantsHash,
    }
  }

  return {
    ALGORITHM,
    hash32,
    parseParticipants,
    draw,
    lfsrStates,
    receipt,
    verify,
    b64url,
    unb64url,
  }
})()

// --------------------------------------------------------------------------- UI

TT.LotteryUI = (function () {
  const h = TT.h

  function Page(props) {
    const { state, t, api } = props
    const lottery = state.lottery
    const participants = TT.Lottery.parseParticipants(lottery.participants)
    const lfsr = TT.Lottery.lfsrStates(lottery.seed, 8)
    return h('div', { className: 'tt-labgrid' },
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('lottery.title')),
          h('span', null, t('lottery.sub')),
        ),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('lottery.seed')),
          h('input', {
            className: 'tt-archivebox',
            style: { minHeight: 0, height: 30, flex: '1 1 220px' },
            value: lottery.seed,
            onChange: (event) => api.dispatch({ type: 'lottery/seed', seed: event.target.value }),
          }),
          h('button', { type: 'button', className: 'tt-chip',
            onClick: () => api.dispatch({ type: 'lottery/randomSeed' }) }, t('lottery.newSeed')),
        ),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('lottery.count')),
          h('input', {
            className: 'tt-archivebox',
            style: { minHeight: 0, height: 30, width: 70 },
            type: 'number',
            min: 1,
            max: Math.max(1, participants.length),
            value: lottery.count,
            onChange: (event) => api.dispatch({ type: 'lottery/count', count: Number(event.target.value) }),
          }),
          h('span', { className: 'tt-lablabel' },
            `${participants.length} ${t('lottery.people')} · ${t('lottery.seedHash')} ${TT.Lottery.hash32(lottery.seed).toString(16).padStart(8, '0')}`),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            onClick: () => api.dispatch({ type: 'lottery/draw' }) }, t('lottery.draw')),
        ),
        h('textarea', {
          className: 'tt-archivebox',
          style: { minHeight: 96 },
          placeholder: t('lottery.peoplePlaceholder'),
          value: lottery.participants,
          onChange: (event) => api.dispatch({ type: 'lottery/participants', text: event.target.value }),
        }),
        lottery.result
          ? h('div', null,
              h('div', { className: 'tt-lablabel', style: { marginTop: 6 } },
                `${t('lottery.winners')} · ${t('lottery.algorithm')} ${lottery.result.algorithm}`),
              h('div', { className: 'tt-winners' }, lottery.result.winners.map((winner) =>
                h('div', { key: winner.rank, className: 'tt-winner' },
                  h('b', null, `#${winner.rank}`),
                  h('span', null, winner.name),
                  h('em', null, winner.key),
                ))),
            )
          : h('p', { className: 'tt-labempty' }, t('lottery.empty')),
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('lottery.receipt.title')),
          h('span', null, t('lottery.receipt.hint')),
        ),
        lottery.receipt
          ? h('div', null,
              h('div', { className: 'tt-hex tt-mono', style: { maxHeight: 90 } }, lottery.receipt.code),
              h('div', { className: 'tt-labrow' },
                h('button', { type: 'button', className: 'tt-chip',
                  onClick: () => copyText(api, lottery.receipt.code) }, t('lottery.receipt.copy')),
                h('span', { className: 'tt-lablabel' }, `${t('lottery.seedHash')} ${lottery.receipt.seedHash}`),
              ),
            )
          : h('p', { className: 'tt-labempty' }, t('lottery.receipt.empty')),
        h('div', { className: 'tt-lablabel' }, t('lottery.verify.title')),
        h('textarea', {
          className: 'tt-archivebox',
          placeholder: t('lottery.verify.placeholder'),
          value: lottery.verifyCode || '',
          onChange: (event) => api.dispatch({ type: 'lottery/verifyCode', code: event.target.value }),
        }),
        h('div', { className: 'tt-labrow' },
          h('input', {
            className: 'tt-archivebox',
            style: { minHeight: 0, height: 30, width: 170 },
            placeholder: t('lottery.verify.hashPlaceholder'),
            value: lottery.verifySeedHash || '',
            onChange: (event) => api.dispatch({ type: 'lottery/verifySeedHash', hash: event.target.value }),
          }),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'lottery/verify' }) }, t('lottery.verify.run')),
        ),
        lottery.verifyResult
          ? h('div', { className: 'tt-finalenote', style: { borderLeftColor: lottery.verifyResult.ok ? 'var(--tt-mint)' : 'var(--tt-red)' } },
              lottery.verifyResult.ok
                ? `${t('lottery.verify.pass')} · ${t('lottery.seedHash')} ${lottery.verifyResult.seedHash}`
                : `${t('lottery.verify.fail')}：${(lottery.verifyResult.reasons || []).join('；')}`)
          : null,
        lottery.history && lottery.history.length
          ? h('div', { className: 'tt-librarylist' }, lottery.history.map((entry, index) =>
              h('div', { key: index, className: 'tt-libraryrow' },
                h('span', { className: 'tt-libraryname' }, `${entry.winners.map((winner) => winner.name).join(', ')}`),
                h('span', { className: 'tt-libraryhex' }, `seed ${entry.seedHash}`),
                h('button', { type: 'button', className: 'tt-chip',
                  onClick: () => api.dispatch({ type: 'lottery/load', code: entry.code }) }, t('lottery.verify.use')),
              )))
          : null,
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' }, h('strong', null, t('lottery.how.title'))),
        h('p', { className: 'tt-labempty' }, t('lottery.how.body')),
        h('div', { className: 'tt-lablabel' }, t('lottery.lfsr.title')),
        h('div', { className: 'tt-hex tt-mono' }, lfsr.map((value) => (value < 16 ? '0' : '') + value.toString(16)).join(' '),
          h('br'), h('span', { style: { color: 'var(--tt-dim)' } }, t('lottery.lfsr.note'))),
        h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('lottery.how.warn')),
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
