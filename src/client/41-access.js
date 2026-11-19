/**
 * 41-access — verifiable access control / eligibility app.
 *
 * A small policy builder: pick a policy, the plugin synthesizes it into a real NAND
 * netlist, evaluates it on named conditions, audits all input rows, and issues an
 * offline-verifiable receipt (base64url text) that anyone can re-run.
 */

TT.Access = (function () {
  const POLICIES = [
    {
      id: 'simple',
      nameKey: 'access.policy.simple',
      descKey: 'access.policy.simpleDesc',
      inputs: [
        { key: 'card', labelKey: 'access.input.card' },
        { key: 'adult', labelKey: 'access.input.adult' },
      ],
      fn: (bits) => (bits & 1) & ((bits >> 1) & 1),
    },
    {
      id: 'member',
      nameKey: 'access.policy.member',
      descKey: 'access.policy.memberDesc',
      inputs: [
        { key: 'card', labelKey: 'access.input.card' },
        { key: 'adult', labelKey: 'access.input.adult' },
        { key: 'blacklist', labelKey: 'access.input.blacklist' },
      ],
      fn: (bits) => (bits & 1) & ((bits >> 1) & 1) & (((bits >> 2) & 1) ? 0 : 1),
    },
    {
      id: 'invite',
      nameKey: 'access.policy.invite',
      descKey: 'access.policy.inviteDesc',
      inputs: [
        { key: 'card', labelKey: 'access.input.card' },
        { key: 'adult', labelKey: 'access.input.adult' },
        { key: 'member', labelKey: 'access.input.member' },
        { key: 'invite', labelKey: 'access.input.invite' },
      ],
      fn: (bits) => (bits & 1) & ((bits >> 1) & 1) & (((bits >> 2) & 1) | ((bits >> 3) & 1)),
    },
    {
      id: 'multisig',
      nameKey: 'access.policy.multisig',
      descKey: 'access.policy.multisigDesc',
      inputs: [
        { key: 'signA', labelKey: 'access.input.signA' },
        { key: 'signB', labelKey: 'access.input.signB' },
        { key: 'signC', labelKey: 'access.input.signC' },
        { key: 'amount', labelKey: 'access.input.amount' },
      ],
      fn: (bits) => {
        const a = bits & 1
        const b = (bits >> 1) & 1
        const c = (bits >> 2) & 1
        const amount = (bits >> 3) & 1
        return ((a & b) | (a & c) | (b & c)) & amount
      },
    },
    {
      id: 'staff',
      nameKey: 'access.policy.staff',
      descKey: 'access.policy.staffDesc',
      inputs: [
        { key: 'card', labelKey: 'access.input.card' },
        { key: 'staff', labelKey: 'access.input.staff' },
        { key: 'temp', labelKey: 'access.input.temp' },
        { key: 'manager', labelKey: 'access.input.manager' },
      ],
      fn: (bits) => {
        const card = bits & 1
        const staff = (bits >> 1) & 1
        const temp = (bits >> 2) & 1
        const manager = (bits >> 3) & 1
        return card & (staff | (temp & manager))
      },
    },
  ]

  const cache = Object.create(null)

  function policy(id) {
    return POLICIES.find((item) => item.id === id) || POLICIES[0]
  }

  function circuit(id) {
    const key = policy(id).id
    if (cache[key]) return cache[key]
    const item = policy(id)
    const bits = []
    for (let index = 0; index < 1 << item.inputs.length; index += 1) bits.push(item.fn(index) ? 1 : 0)
    const result = TT.Circuit.synth({ nIn: item.inputs.length, bits })
    cache[key] = result
    return result
  }

  function evaluate(id, bits) {
    const item = policy(id)
    const result = circuit(id)
    let output = 0
    try {
      output = TT.Circuit.evaluate(result.netlist, bits).outputBits & 1
    } catch (error) {
      output = 0
    }
    return { allow: output === 1, expected: item.fn(bits) === 1, output }
  }

  function audit(id) {
    const item = policy(id)
    const result = circuit(id)
    const verified = TT.Circuit.exhaustiveVerify(result.netlist, (bits) => (item.fn(bits) ? 1 : 0))
    return {
      passed: verified.passed,
      count: verified.count,
      mismatches: verified.mismatchCount || 0,
      rows: (verified.rows || []).slice(0, 8),
      gateCount: TT.Circuit.gateCount(result.netlist),
      depth: TT.Circuit.maxDepth(result.netlist),
      hex: result.hex,
    }
  }

  /** Tiny FNV-1a fingerprint over the 7-byte gate hex; not a cryptographic hash. */
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
    const base64 = TT.Export ? TT.Export.b64encode(text) : ''
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  function unb64url(code) {
    const base64 = String(code || '').trim().replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return TT.Export.b64decode(padded)
  }

  function receipt(id, bits) {
    const item = policy(id)
    const result = circuit(id)
    const evaluation = evaluate(id, bits)
    const payload = {
      schema: 'dsh-tapelab.access.v1',
      policy: item.id,
      nIn: item.inputs.length,
      gates: result.netlist.gates.map((gate) => [gate.a, gate.b]),
      outputs: result.netlist.outputs.slice(),
      inputs: bits,
      result: evaluation.output,
      fingerprint: fingerprint(result.netlist),
      at: Date.now(),
    }
    return {
      code: b64url(JSON.stringify(payload)),
      payload,
      fingerprint: payload.fingerprint,
      allow: evaluation.allow,
    }
  }

  function verify(code, expectedFingerprint) {
    const reasons = []
    let payload
    try {
      payload = JSON.parse(unb64url(code))
    } catch (error) {
      return { ok: false, reasons: ['凭证码无法解码'], payload: null }
    }
    if (!payload || payload.schema !== 'dsh-tapelab.access.v1') return { ok: false, reasons: ['凭证格式不匹配'], payload: null }
    let netlist
    try {
      netlist = TT.Circuit.makeNetlist({
        nIn: payload.nIn,
        gates: (payload.gates || []).map((pair) => ({ a: Number(pair[0]), b: Number(pair[1]) })),
        outputs: (payload.outputs || []).map(Number),
      })
      const check = TT.Circuit.validateNetlist(netlist)
      if (!check.ok) throw new Error(check.error)
    } catch (error) {
      return { ok: false, reasons: ['凭证里的网表无效：' + String(error && error.message ? error.message : error)], payload }
    }
    const actualFingerprint = fingerprint(netlist)
    if (actualFingerprint !== payload.fingerprint) reasons.push('网表指纹与凭证不一致（可能被篡改）')
    if (expectedFingerprint && String(expectedFingerprint).trim().toLowerCase() !== actualFingerprint) {
      reasons.push(`策略指纹不匹配：凭证是 ${actualFingerprint}，期望是 ${String(expectedFingerprint).trim().toLowerCase()}`)
    }
    const recomputed = TT.Circuit.evaluate(netlist, payload.inputs).outputBits & 1
    if (recomputed !== payload.result) reasons.push(`结果不一致：重算 ${recomputed}，凭证写 ${payload.result}`)
    const expected = policy(payload.policy).fn(payload.inputs) ? 1 : 0
    if (recomputed !== expected) reasons.push('重算结果与策略本身不一致')
    return {
      ok: reasons.length === 0,
      reasons,
      payload,
      recomputed,
      allow: recomputed === 1,
      fingerprint: actualFingerprint,
    }
  }

  return { POLICIES, policy, circuit, evaluate, audit, fingerprint, receipt, verify, b64url, unb64url }
})()

// --------------------------------------------------------------------------- UI

TT.AccessUI = (function () {
  const h = TT.h

  function Page(props) {
    const { state, t, api } = props
    const access = state.access
    const item = TT.Access.policy(access.policyId)
    const circuit = TT.Access.circuit(access.policyId)
    const evaluation = TT.Access.evaluate(access.policyId, access.inputs || 0)
    const gateCount = TT.Circuit.gateCount(circuit.netlist)
    const depth = TT.Circuit.maxDepth(circuit.netlist)
    const fingerprint = TT.Access.fingerprint(circuit.netlist)
    return h('div', { className: 'tt-labgrid' },
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('access.title')),
          h('span', null, t('access.sub')),
        ),
        h('div', { className: 'tt-labrow' }, TT.Access.POLICIES.map((policy) =>
          h('button', {
            key: policy.id,
            type: 'button',
            className: 'tt-chip',
            'data-active': access.policyId === policy.id ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'access/policy', id: policy.id }),
          }, t(policy.nameKey)))),
        h('p', { className: 'tt-labempty' }, t(item.descKey)),
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, gateCount), h('span', null, t('lab.synth.gates'))),
          h('div', { className: 'tt-labstat' }, h('b', null, depth), h('span', null, t('hud.depth'))),
          h('div', { className: 'tt-labstat' }, h('b', null, fingerprint), h('span', null, t('access.fingerprint'))),
          h('div', { className: 'tt-labstat' }, h('b', null, item.inputs.length), h('span', null, t('hud.inputs'))),
        ),
        h('div', { className: 'tt-lablabel', style: { marginTop: 4 } }, t('access.conditions')),
        h('div', { className: 'tt-labrow' }, item.inputs.map((input, index) =>
          h('button', {
            key: input.key,
            type: 'button',
            className: 'tt-chip',
            'data-active': ((access.inputs || 0) >> index) & 1 ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'access/toggle', index }),
          }, `${t(input.labelKey)} = ${((access.inputs || 0) >> index) & 1}`))),
        h('div', { className: 'tt-seg', style: { marginTop: 8 } },
          h('span', { style: { fontSize: 14, color: evaluation.allow ? 'var(--tt-mint)' : 'var(--tt-red)' } },
            evaluation.allow ? 'ALLOW ✓' : 'DENY ✕'),
          h('span', { className: 'tt-badge', 'data-tone': evaluation.allow ? 'good' : 'bad' },
            evaluation.allow ? t('access.allow') : t('access.deny')),
        ),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'access/audit' }) }, t('access.audit')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            onClick: () => api.dispatch({ type: 'access/issue' }) }, t('access.issue')),
          h('span', { className: 'tt-lablabel' }, t('access.auditHint')),
        ),
        access.audit ? h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-badge', 'data-tone': access.audit.passed ? 'good' : 'bad' },
            `${access.audit.passed ? t('hud.verifyPass') : t('hud.verifyFail')} · ${access.audit.count} ${t('hud.rowsUnit')} · ${authGates(access.audit)}`),
        ) : null,
        access.audit && access.audit.rows && access.audit.rows.length
          ? h('table', { className: 'tt-table' },
              h('thead', null, h('tr', null,
                h('th', null, t('hud.evalInput')),
                h('th', null, t('access.allowShort')),
                h('th', null, t('access.denyShort')),
              )),
              h('tbody', null, access.audit.rows.slice(0, 8).map((row) =>
                h('tr', { key: row.inputBits },
                  h('td', { className: 'tt-bit' }, TT.util.formatBits(row.inputBits, item.inputs.length)),
                  h('td', null, row.actualBits === 1 ? '✓' : ''),
                  h('td', null, row.actualBits === 0 ? '✓' : ''),
                ))),
            )
          : null,
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('access.receipt.title')),
          h('span', null, t('access.receipt.hint')),
        ),
        access.receipt
          ? h('div', null,
              h('div', { className: 'tt-hex tt-mono', style: { maxHeight: 96 } }, access.receipt.code),
              h('div', { className: 'tt-labrow' },
                h('button', { type: 'button', className: 'tt-chip',
                  onClick: () => copyAccess(api, access.receipt.code) }, t('access.receipt.copy')),
                h('span', { className: 'tt-lablabel' },
                  `${t('access.receipt.fingerprint')} ${access.receipt.fingerprint} · ${access.receipt.allow ? 'ALLOW' : 'DENY'}`),
              ),
            )
          : h('p', { className: 'tt-labempty' }, t('access.receipt.empty')),
        h('div', { className: 'tt-lablabel' }, t('access.verify.title')),
        h('textarea', {
          className: 'tt-archivebox',
          placeholder: t('access.verify.codePlaceholder'),
          value: access.verifyCode || '',
          onChange: (event) => api.dispatch({ type: 'access/verifyCode', code: event.target.value }),
        }),
        h('div', { className: 'tt-labrow' },
          h('input', {
            className: 'tt-archivebox',
            style: { minHeight: 0, height: 30, width: 160 },
            placeholder: t('access.verify.hashPlaceholder'),
            value: access.verifyHash || '',
            onChange: (event) => api.dispatch({ type: 'access/verifyHash', hash: event.target.value }),
          }),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'access/verify' }) }, t('access.verify.run')),
        ),
        access.verifyResult
          ? h('div', { className: 'tt-finalenote', style: { borderLeftColor: access.verifyResult.ok ? 'var(--tt-mint)' : 'var(--tt-red)' } },
              access.verifyResult.ok
                ? `${t('access.verify.pass')} · ${access.verifyResult.allow ? 'ALLOW' : 'DENY'} · ${t('access.verify.fingerprint')} ${access.verifyResult.fingerprint}`
                : `${t('access.verify.fail')}：${(access.verifyResult.reasons || []).join('；')}`)
          : null,
        access.receipts && access.receipts.length
          ? h('div', { className: 'tt-librarylist' }, access.receipts.map((entry, index) =>
              h('div', { key: index, className: 'tt-libraryrow' },
                h('span', { className: 'tt-libraryname' }, `${entry.policy} · ${entry.allow ? 'ALLOW' : 'DENY'}`),
                h('span', { className: 'tt-libraryhex' }, `fp ${entry.fingerprint}`),
                h('button', { type: 'button', className: 'tt-chip',
                  onClick: () => api.dispatch({ type: 'access/loadReceipt', code: entry.code }) }, t('access.verify.use')),
              )))
          : null,
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' }, h('strong', null, t('access.why.title'))),
        h('p', { className: 'tt-labempty' }, t('access.why.body')),
        h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('access.why.note')),
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, '7'), h('span', null, t('access.why.bytes'))),
          h('div', { className: 'tt-labstat' }, h('b', null, '0'), h('span', null, t('access.why.state'))),
          h('div', { className: 'tt-labstat' }, h('b', null, 'eval'), h('span', null, t('access.why.readonly'))),
        ),
      ),
    )
  }

  function authGates(audit) {
    return `${audit.gateCount} ${'门'}`
  }

  function copyAccess(api, text) {
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
