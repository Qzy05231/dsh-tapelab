/**
 * 45-defi — verifiable DeFi trade guard + simulated constant-product AMM.
 *
 * The guard is real NAND logic: open (allowlisted && !paused), oracle freshness,
 * price-impact limit and amount cap are boolean bits; only if the circuit outputs 1
 * does the simulated pool execute the swap. Receipts carry the raw pool/amount
 * parameters so anyone can recompute the guard bits and the circuit result.
 *
 * This is a simulation: no wallet, no signatures, no chain calls.
 */

TT.Defi = (function () {
  const POOLS = [
    { id: 'eth-usdc', nameKey: 'defi.pool.ethusdc', x: 100, y: 200000, symbolX: 'ETH', symbolY: 'USDC' },
    { id: 'btc-usdc', nameKey: 'defi.pool.btcusdc', x: 10, y: 600000, symbolX: 'BTC', symbolY: 'USDC' },
    { id: 'tap-bnb', nameKey: 'defi.pool.tapbnb', x: 5000, y: 250, symbolX: 'NAND', symbolY: 'BNB' },
  ]

  const cache = Object.create(null)

  function pool(id) {
    return POOLS.find((item) => item.id === id) || POOLS[0]
  }

  function quote(poolState, amountIn) {
    const x = Math.max(0.0001, Number(poolState.x) || 0)
    const y = Math.max(0.0001, Number(poolState.y) || 0)
    const amount = Math.max(0, Number(amountIn) || 0)
    const out = (y * amount) / (x + amount)
    const impact = amount / (x + amount)
    return {
      amountIn: amount,
      amountOut: out,
      impact,
      newX: x + amount,
      newY: y - out,
      midPrice: y / x,
      executionPrice: amount > 0 ? out / amount : 0,
    }
  }

  function guardBits(args) {
    const impactOk = Number(args.impact || 0) <= Number(args.maxImpact || 0) / 100
    const capOk = Number(args.amountIn || 0) <= Number(args.cap || 0)
    const open = args.allowlisted ? 1 : 0
    const openOk = open && !args.paused ? 1 : 0
    const oracleOk = args.oracle ? 1 : 0
    const bits = (openOk) | (oracleOk << 1) | (impactOk << 2) | (capOk << 3)
    return { bits, impactOk, capOk, openOk, oracleOk, open: Boolean(open) }
  }

  function circuit() {
    if (cache.and4) return cache.and4
    const synth = TT.Circuit.synth({ nIn: 4, bits: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] })
    cache.and4 = {
      netlist: synth.netlist,
      gateCount: TT.Circuit.gateCount(synth.netlist),
      depth: TT.Circuit.maxDepth(synth.netlist),
      fingerprint: fingerprint(synth.netlist),
      hex: synth.hex,
    }
    return cache.and4
  }

  function evaluate(args) {
    const built = circuit()
    const bits = guardBits(args)
    const output = TT.Circuit.evaluate(built.netlist, bits.bits).outputBits & 1
    const reasons = []
    if (!bits.open) reasons.push('地址不在白名单')
    if (args.paused) reasons.push('协议已暂停')
    if (!bits.oracleOk) reasons.push('预言机数据过期')
    if (!bits.impactOk) reasons.push(`价格冲击 ${(bits.impactOk ? 0 : ((args.impact || 0) * 100)).toFixed(2)}% 超过上限`)
    if (!bits.capOk) reasons.push(`金额 ${args.amountIn} 超过单笔上限 ${args.cap}`)
    return { allow: output === 1, bits: bits.bits, guards: { open: bits.openOk, oracle: bits.oracleOk, impact: bits.impactOk ? 1 : 0, cap: bits.capOk ? 1 : 0 }, reasons }
  }

  function audit() {
    const built = circuit()
    const verified = TT.Circuit.exhaustiveVerify(built.netlist, (bits) => (bits === 15 ? 1 : 0))
    return {
      passed: verified.passed,
      count: verified.count,
      mismatches: verified.mismatchCount || 0,
      rows: (verified.rows || []).slice(0, 8),
      gateCount: built.gateCount,
      depth: built.depth,
      fingerprint: built.fingerprint,
    }
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

  function b64url(text) {
    return TT.Export.b64encode(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  function unb64url(code) {
    const base64 = String(code || '').trim().replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return TT.Export.b64decode(padded)
  }

  function receipt(args) {
    const built = circuit()
    const evaluation = evaluate(args)
    const payload = {
      schema: 'dsh-tapelab.defi.v1',
      pool: args.poolId,
      poolState: { x: args.x, y: args.y },
      amountIn: args.amountIn,
      maxImpact: args.maxImpact,
      cap: args.cap,
      allowlisted: Boolean(args.allowlisted),
      paused: Boolean(args.paused),
      oracle: Boolean(args.oracle),
      impact: args.impact,
      bits: evaluation.bits,
      allow: evaluation.allow,
      guards: evaluation.guards,
      gates: built.netlist.gates.map((gate) => [gate.a, gate.b]),
      netlistOutputs: built.netlist.outputs.slice(),
      fingerprint: built.fingerprint,
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
      return { ok: false, reasons: ['凭证码无法解码'], payload: null }
    }
    if (!payload || payload.schema !== 'dsh-tapelab.defi.v1') return { ok: false, reasons: ['凭证格式不匹配'], payload: null }
    let netlist
    try {
      netlist = TT.Circuit.makeNetlist({
        nIn: 4,
        gates: (payload.gates || []).map((pair) => ({ a: Number(pair[0]), b: Number(pair[1]) })),
        outputs: (payload.netlistOutputs || []).map(Number),
      })
      const check = TT.Circuit.validateNetlist(netlist)
      if (!check.ok) throw new Error(check.error)
    } catch (error) {
      return { ok: false, reasons: ['凭证里的网表无效'], payload }
    }
    const actualFingerprint = fingerprint(netlist)
    if (actualFingerprint !== payload.fingerprint) reasons.push('网表指纹不一致（可能被篡改）')
    if (expectedFingerprint && String(expectedFingerprint).trim().toLowerCase() !== actualFingerprint) {
      reasons.push(`指纹不匹配：凭证 ${actualFingerprint}，期望 ${String(expectedFingerprint).trim().toLowerCase()}`)
    }
    const recomputed = guardBits(payload)
    if (recomputed.bits !== payload.bits) reasons.push('守卫条件与凭证记录的位不一致')
    const output = TT.Circuit.evaluate(netlist, recomputed.bits).outputBits & 1
    if (output !== (payload.allow ? 1 : 0)) reasons.push(`放行结果不一致：重算 ${output}，凭证 ${payload.allow ? 1 : 0}`)
    return { ok: reasons.length === 0, reasons, payload, allow: output === 1, bits: recomputed.bits, fingerprint: actualFingerprint }
  }

  return { POOLS, pool, quote, guardBits, circuit, evaluate, audit, receipt, verify, fingerprint, b64url, unb64url }
})()

// --------------------------------------------------------------------------- UI

TT.DefiUI = (function () {
  const h = TT.h

  function Page(props) {
    const { state, t, api } = props
    const defi = state.defi
    const meta = TT.Defi.pool(defi.poolId)
    const poolState = defi.pools[defi.poolId] || { x: meta.x, y: meta.y }
    const quote = TT.Defi.quote(poolState, defi.amountIn)
    const built = TT.Defi.circuit()
    const evaluation = TT.Defi.evaluate({
      poolId: defi.poolId,
      x: poolState.x,
      y: poolState.y,
      amountIn: defi.amountIn,
      maxImpact: defi.maxImpact,
      cap: defi.cap,
      impact: quote.impact,
      allowlisted: defi.allowlisted,
      paused: defi.paused,
      oracle: defi.oracle,
    })
    const guards = [
      ['open', 'defi.guard.open', evaluation.guards.open],
      ['oracle', 'defi.guard.oracle', evaluation.guards.oracle],
      ['impact', 'defi.guard.impact', evaluation.guards.impact],
      ['cap', 'defi.guard.cap', evaluation.guards.cap],
    ]
    return h('div', { className: 'tt-labgrid' },
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('defi.title')),
          h('span', null, t('defi.sub')),
        ),
        h('div', { className: 'tt-labrow' }, TT.Defi.POOLS.map((item) =>
          h('button', {
            key: item.id,
            type: 'button',
            className: 'tt-chip',
            'data-active': defi.poolId === item.id ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'defi/pool', id: item.id }),
          }, t(item.nameKey)))),
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, `${poolState.x.toFixed(2)}`), h('span', null, meta.symbolX)),
          h('div', { className: 'tt-labstat' }, h('b', null, `${poolState.y.toFixed(2)}`), h('span', null, meta.symbolY)),
          h('div', { className: 'tt-labstat' }, h('b', null, `${quote.amountOut.toFixed(2)}`), h('span', null, t('defi.out'))),
          h('div', { className: 'tt-labstat' }, h('b', null, `${(quote.impact * 100).toFixed(2)}%`), h('span', null, t('defi.impact'))),
        ),
        h('div', { className: 'tt-lablabel' }, t('defi.amount')),
        h('div', { className: 'tt-labrow' },
          h('input', {
            type: 'range', className: 'tt-slider', min: 0, max: Math.max(1, Math.round(poolState.x)), step: 0.5,
            value: defi.amountIn,
            onChange: (event) => api.dispatch({ type: 'defi/amount', value: Number(event.target.value) }),
          }),
          h('span', { className: 'tt-sensorval' }, `${defi.amountIn} ${meta.symbolX}`),
        ),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('defi.maxImpact')),
          h('input', {
            type: 'range', className: 'tt-slider', min: 0.1, max: 20, step: 0.1,
            value: defi.maxImpact,
            onChange: (event) => api.dispatch({ type: 'defi/impact', value: Number(event.target.value) }),
          }),
          h('span', { className: 'tt-sensorval' }, `${defi.maxImpact}%`),
          h('span', { className: 'tt-lablabel' }, t('defi.cap')),
          h('input', {
            type: 'range', className: 'tt-slider', min: 1, max: Math.max(2, Math.round(poolState.x)), step: 1,
            value: defi.cap,
            onChange: (event) => api.dispatch({ type: 'defi/cap', value: Number(event.target.value) }),
          }),
          h('span', { className: 'tt-sensorval' }, `${defi.cap}`),
        ),
        h('div', { className: 'tt-labrow' },
          [['allowlisted', 'defi.flag.allowlisted'], ['oracle', 'defi.flag.oracle'], ['paused', 'defi.flag.paused']].map(([key, labelKey]) =>
            h('button', {
              key,
              type: 'button',
              className: 'tt-chip',
              'data-active': defi[key] ? 'true' : 'false',
              onClick: () => api.dispatch({ type: 'defi/flag', key }),
            }, `${t(labelKey)} ${defi[key] ? '1' : '0'}`)),
        ),
        h('div', { className: 'tt-lablabel', style: { marginTop: 6 } }, t('defi.guards')),
        h('div', { className: 'tt-actuators' }, guards.map(([key, labelKey, on]) =>
          h('div', { key, className: 'tt-actuator', 'data-on': on ? 'true' : 'false', 'data-tone': on ? 'good' : 'bad' },
            h('i', null), h('span', null, t(labelKey)), h('b', null, on ? t('defi.pass') : t('defi.fail'))))),
        h('div', { className: 'tt-seg', style: { marginTop: 8 } },
          h('span', { style: { fontSize: 14, color: evaluation.allow ? 'var(--tt-mint)' : 'var(--tt-red)' } },
            evaluation.allow ? 'EXECUTE ✓' : 'BLOCKED ✕'),
          evaluation.allow
            ? null
            : h('span', { style: { fontSize: 10.5, color: 'var(--tt-dim)' } }, evaluation.reasons.join('；')),
        ),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            disabled: !evaluation.allow, onClick: () => api.dispatch({ type: 'defi/execute' }) }, t('defi.execute')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
            onClick: () => api.dispatch({ type: 'defi/resetPool' }) }, t('defi.reset')),
          h('span', { className: 'tt-lablabel' }, t('defi.simulated')),
        ),
        defi.trades && defi.trades.length
          ? h('div', { className: 'tt-librarylist' }, defi.trades.slice(0, 5).map((trade, index) =>
              h('div', { key: index, className: 'tt-libraryrow' },
                h('span', { className: 'tt-libraryname' }, `${trade.amountIn} → ${trade.amountOut.toFixed(2)}`),
                h('span', { className: 'tt-libraryhex' }, `${(trade.impact * 100).toFixed(2)}% · ${meta.symbolX}/${meta.symbolY}`),
              )))
          : null,
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('defi.circuit.title')),
          h('span', null, t('defi.circuit.hint')),
        ),
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, built.gateCount), h('span', null, t('lab.synth.gates'))),
          h('div', { className: 'tt-labstat' }, h('b', null, built.depth), h('span', null, t('hud.depth'))),
          h('div', { className: 'tt-labstat' }, h('b', null, built.fingerprint), h('span', null, t('access.fingerprint'))),
        ),
        h('div', { className: 'tt-hex tt-mono' }, built.hex.length > 120 ? built.hex.slice(0, 117) + '…' : built.hex),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'defi/audit' }) }, t('defi.audit')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            onClick: () => api.dispatch({ type: 'defi/issue' }) }, t('defi.issue')),
        ),
        defi.audit
          ? h('div', { className: 'tt-labrow' },
              h('span', { className: 'tt-badge', 'data-tone': defi.audit.passed ? 'good' : 'bad' },
                `${defi.audit.passed ? t('hud.verifyPass') : t('hud.verifyFail')} · ${defi.audit.count} ${t('hud.rowsUnit')}`))
          : null,
        defi.receipt
          ? h('div', null,
              h('div', { className: 'tt-hex tt-mono', style: { maxHeight: 90 } }, defi.receipt.code),
              h('div', { className: 'tt-labrow' },
                h('button', { type: 'button', className: 'tt-chip',
                  onClick: () => copyText(api, defi.receipt.code) }, t('access.receipt.copy')),
                h('span', { className: 'tt-lablabel' }, `${t('access.receipt.fingerprint')} ${defi.receipt.fingerprint}`),
              ),
            )
          : h('p', { className: 'tt-labempty' }, t('defi.receipt.empty')),
        h('div', { className: 'tt-lablabel' }, t('access.verify.title')),
        h('textarea', {
          className: 'tt-archivebox',
          placeholder: t('access.verify.codePlaceholder'),
          value: defi.verifyCode || '',
          onChange: (event) => api.dispatch({ type: 'defi/verifyCode', code: event.target.value }),
        }),
        h('div', { className: 'tt-labrow' },
          h('input', {
            className: 'tt-archivebox',
            style: { minHeight: 0, height: 30, width: 160 },
            placeholder: t('access.verify.hashPlaceholder'),
            value: defi.verifyHash || '',
            onChange: (event) => api.dispatch({ type: 'defi/verifyHash', hash: event.target.value }),
          }),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'defi/verify' }) }, t('access.verify.run')),
        ),
        defi.verifyResult
          ? h('div', { className: 'tt-finalenote', style: { borderLeftColor: defi.verifyResult.ok ? 'var(--tt-mint)' : 'var(--tt-red)' } },
              defi.verifyResult.ok
                ? `${t('access.verify.pass')} · ${defi.verifyResult.allow ? 'ALLOW' : 'BLOCK'} · ${defi.verifyResult.fingerprint}`
                : `${t('access.verify.fail')}：${(defi.verifyResult.reasons || []).join('；')}`)
          : null,
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' }, h('strong', null, t('defi.why.title'))),
        h('p', { className: 'tt-labempty' }, t('defi.why.body')),
        h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('defi.why.note')),
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
