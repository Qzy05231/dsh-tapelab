/**
 * 44-sensors — sensor rule engine: analog sensors → thresholds → NAND logic →
 * multiple actuators (alarm / power cut / ventilation / sprinkler / machine stop).
 *
 * Each scenario has <= 4 boolean conditions, so every output is synthesized with the
 * same Quine–McCluskey NAND synthesizer and composed into one multi-output netlist.
 * Receipts carry raw values + thresholds so anyone can recompute the boolean bits,
 * re-evaluate the circuit and verify the actuator outputs.
 */

TT.Sensors = (function () {
  const SENSORS = {
    door: { id: 'door', type: 'bool', labelKey: 'sensor.door', value: 0 },
    window: { id: 'window', type: 'bool', labelKey: 'sensor.window', value: 0 },
    away: { id: 'away', type: 'bool', labelKey: 'sensor.away', value: 0 },
    smoke: { id: 'smoke', type: 'analog', labelKey: 'sensor.smoke', unit: '%', value: 8, threshold: 20, thresholdKey: 'sensor.smoke.th' },
    heat: { id: 'heat', type: 'analog', labelKey: 'sensor.heat', unit: '°C', value: 28, threshold: 58, thresholdKey: 'sensor.heat.th' },
    co: { id: 'co', type: 'analog', labelKey: 'sensor.co', unit: 'ppm', value: 12, threshold: 60, thresholdKey: 'sensor.co.th' },
    co2: { id: 'co2', type: 'analog', labelKey: 'sensor.co2', unit: 'ppm', value: 480, threshold: 1000, thresholdKey: 'sensor.co2.th' },
    humidity: { id: 'humidity', type: 'analog', labelKey: 'sensor.humidity', unit: '%', value: 40, threshold: 80, thresholdKey: 'sensor.humidity.th' },
    water: { id: 'water', type: 'bool', labelKey: 'sensor.water', value: 0 },
    estop: { id: 'estop', type: 'bool', labelKey: 'sensor.estop', value: 0 },
    gate: { id: 'gate', type: 'bool', labelKey: 'sensor.gate', value: 0 },
    running: { id: 'running', type: 'bool', labelKey: 'sensor.running', value: 1 },
  }

  const SCENARIOS = [
    {
      id: 'home',
      nameKey: 'sensor.scenario.home',
      descKey: 'sensor.scenario.homeDesc',
      sensors: ['door', 'window', 'away'],
      outputs: [
        { key: 'alarm', labelKey: 'actuator.alarm', tone: 'bad', fn: (bits) => ((bits & 1) | ((bits >> 1) & 1)) & ((bits >> 2) & 1) },
      ],
    },
    {
      id: 'fire',
      nameKey: 'sensor.scenario.fire',
      descKey: 'sensor.scenario.fireDesc',
      sensors: ['smoke', 'heat', 'co', 'away'],
      outputs: [
        { key: 'alarm', labelKey: 'actuator.alarm', tone: 'bad', fn: (bits) => (bits & 1) & (((bits >> 1) & 1) | ((bits >> 2) & 1)) },
        { key: 'powerCut', labelKey: 'actuator.powerCut', tone: 'warn', fn: (bits) => (bits & 1) & ((bits >> 1) & 1) },
        { key: 'sprinkler', labelKey: 'actuator.sprinkler', tone: 'good', fn: (bits) => (bits & 1) & ((bits >> 2) & 1) },
      ],
    },
    {
      id: 'air',
      nameKey: 'sensor.scenario.air',
      descKey: 'sensor.scenario.airDesc',
      sensors: ['co2', 'heat', 'smoke', 'away'],
      outputs: [
        { key: 'fan', labelKey: 'actuator.fan', tone: 'good', fn: (bits) => (((bits & 1) | ((bits >> 1) & 1)) ? 1 : 0) & (((bits >> 2) & 1) ? 0 : 1) },
        { key: 'purify', labelKey: 'actuator.purify', tone: 'warn', fn: (bits) => (bits >> 2) & 1 },
      ],
    },
    {
      id: 'interlock',
      nameKey: 'sensor.scenario.interlock',
      descKey: 'sensor.scenario.interlockDesc',
      sensors: ['estop', 'gate', 'running', 'away'],
      outputs: [
        { key: 'stop', labelKey: 'actuator.stop', tone: 'bad', fn: (bits) => (bits & 1) | (((bits >> 1) & 1) & ((bits >> 2) & 1)) },
        { key: 'alarm', labelKey: 'actuator.alarm', tone: 'warn', fn: (bits) => (bits & 1) | ((bits >> 1) & 1) },
      ],
    },
    {
      id: 'server',
      nameKey: 'sensor.scenario.server',
      descKey: 'sensor.scenario.serverDesc',
      sensors: ['heat', 'humidity', 'water', 'away'],
      outputs: [
        { key: 'ac', labelKey: 'actuator.ac', tone: 'good', fn: (bits) => (bits & 1) & ((bits >> 1) & 1) },
        { key: 'powerCut', labelKey: 'actuator.powerCut', tone: 'bad', fn: (bits) => (bits >> 2) & 1 },
        { key: 'alarm', labelKey: 'actuator.alarm', tone: 'warn', fn: (bits) => ((bits >> 2) & 1) | ((bits & 1) & ((bits >> 1) & 1)) },
      ],
    },
  ]

  const cache = Object.create(null)

  function scenario(id) {
    return SCENARIOS.find((item) => item.id === id) || SCENARIOS[0]
  }

  function sensorsOf(sc) {
    return sc.sensors.map((key) => SENSORS[key])
  }

  function truthBits(nIn, fn) {
    const bits = []
    for (let i = 0; i < 1 << nIn; i += 1) bits.push(fn(i) ? 1 : 0)
    return bits
  }

  function circuit(id) {
    const sc = scenario(id)
    if (cache[sc.id]) return cache[sc.id]
    const nIn = sc.sensors.length
    const inputNodes = Array.from({ length: nIn }, (_, index) => 2 + index)
    const parts = sc.outputs.map((output, index) => {
      const synth = TT.Circuit.synth({ nIn, bits: truthBits(nIn, output.fn) })
      return { netlist: synth.netlist, inputNodes, outputNodes: [200 + index] }
    })
    const composed = TT.Circuit.compose({
      nIn,
      parts,
      outputs: sc.outputs.map((_, index) => 200 + index),
    })
    cache[sc.id] = {
      netlist: composed,
      gateCount: TT.Circuit.gateCount(composed),
      depth: TT.Circuit.maxDepth(composed),
      fingerprint: fingerprint(composed),
    }
    return cache[sc.id]
  }

  function bitsFromValues(sc, values, thresholds) {
    let bits = 0
    sc.sensors.forEach((key, index) => {
      const sensor = SENSORS[key]
      const value = Number((values && values[key]) !== undefined ? values[key] : sensor.value)
      const threshold = Number((thresholds && thresholds[key]) !== undefined ? thresholds[key] : sensor.threshold || 0.5)
      const on = sensor.type === 'bool' ? value >= 1 : value >= threshold
      if (on) bits |= 1 << index
    })
    return bits
  }

  function evaluate(id, values, thresholds) {
    const sc = scenario(id)
    const built = circuit(id)
    const bits = bitsFromValues(sc, values, thresholds)
    const result = TT.Circuit.evaluate(built.netlist, bits)
    const actuators = sc.outputs.map((output, index) => ({
      key: output.key,
      labelKey: output.labelKey,
      tone: output.tone,
      on: result.outputs[index] === 1,
    }))
    return { bits, outputs: result.outputs, actuators, expected: sc.outputs.map((output) => (output.fn(bits) ? 1 : 0)) }
  }

  function audit(id) {
    const sc = scenario(id)
    const built = circuit(id)
    let mismatches = 0
    let count = 0
    for (let bits = 0; bits < 1 << sc.sensors.length; bits += 1) {
      const result = TT.Circuit.evaluate(built.netlist, bits)
      for (let index = 0; index < sc.outputs.length; index += 1) {
        count += 1
        const expected = sc.outputs[index].fn(bits) ? 1 : 0
        if (result.outputs[index] !== expected) mismatches += 1
      }
    }
    return {
      passed: mismatches === 0,
      count,
      mismatches,
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

  function receipt(id, values, thresholds) {
    const sc = scenario(id)
    const built = circuit(id)
    const evaluation = evaluate(id, values, thresholds)
    const payload = {
      schema: 'dsh-tapelab.sensors.v1',
      scenario: sc.id,
      values: { ...(values || {}) },
      thresholds: { ...(thresholds || {}) },
      bits: evaluation.bits,
      outputs: evaluation.outputs,
      gates: built.netlist.gates.map((gate) => [gate.a, gate.b]),
      netlistOutputs: built.netlist.outputs.slice(),
      fingerprint: built.fingerprint,
      at: Date.now(),
    }
    return { code: b64url(JSON.stringify(payload)), payload, fingerprint: built.fingerprint }
  }

  function verify(code, expectedFingerprint) {
    const reasons = []
    const reasonKeys = []
    let payload
    try {
      payload = JSON.parse(unb64url(code))
    } catch (error) {
      return { ok: false, reasons: ['凭证码无法解码'], reasonKeys: [{ key: 'sensor.verify.errDecode' }], payload: null }
    }
    if (!payload || payload.schema !== 'dsh-tapelab.sensors.v1') {
      return { ok: false, reasons: ['凭证格式不匹配'], reasonKeys: [{ key: 'sensor.verify.errSchema' }], payload: null }
    }
    let netlist
    try {
      netlist = TT.Circuit.makeNetlist({
        nIn: scenario(payload.scenario).sensors.length,
        gates: (payload.gates || []).map((pair) => ({ a: Number(pair[0]), b: Number(pair[1]) })),
        outputs: (payload.netlistOutputs || []).map(Number),
      })
      const check = TT.Circuit.validateNetlist(netlist)
      if (!check.ok) throw new Error(check.error)
    } catch (error) {
      const msg = String(error && error.message ? error.message : error)
      return { ok: false, reasons: ['凭证里的网表无效：' + msg], reasonKeys: [{ key: 'sensor.verify.errNetlist', params: { error: msg } }], payload }
    }
    const actualFingerprint = fingerprint(netlist)
    if (actualFingerprint !== payload.fingerprint) {
      reasons.push('网表指纹不一致（可能被篡改）')
      reasonKeys.push({ key: 'sensor.verify.errFingerprint' })
    }
    if (expectedFingerprint && String(expectedFingerprint).trim().toLowerCase() !== actualFingerprint) {
      const exp = String(expectedFingerprint).trim().toLowerCase()
      reasons.push(`指纹不匹配：凭证 ${actualFingerprint}，期望 ${exp}`)
      reasonKeys.push({ key: 'sensor.verify.errMismatch', params: { actual: actualFingerprint, expected: exp } })
    }
    const sc = scenario(payload.scenario)
    const bits = bitsFromValues(sc, payload.values, payload.thresholds)
    if (bits !== payload.bits) {
      reasons.push('传感器条件与凭证记录的位不一致')
      reasonKeys.push({ key: 'sensor.verify.errBits' })
    }
    const outputs = TT.Circuit.evaluate(netlist, bits).outputs
    for (let index = 0; index < outputs.length; index += 1) {
      if (outputs[index] !== payload.outputs[index]) {
        reasons.push(`执行器 ${index + 1} 结果不一致：重算 ${outputs[index]}，凭证 ${payload.outputs[index]}`)
        reasonKeys.push({ key: 'sensor.verify.errOutput', params: { index: index + 1, recomputed: outputs[index], receipt: payload.outputs[index] } })
        break
      }
    }
    return { ok: reasons.length === 0, reasons, reasonKeys, payload, bits, outputs, fingerprint: actualFingerprint, actuators: sc.outputs.map((output, index) => ({ key: output.key, labelKey: output.labelKey, tone: output.tone, on: outputs[index] === 1 })) }
  }

  return { SENSORS, SCENARIOS, scenario, sensorsOf, circuit, bitsFromValues, evaluate, audit, receipt, verify, fingerprint, b64url, unb64url }
})()

// --------------------------------------------------------------------------- UI

TT.SensorsUI = (function () {
  const h = TT.h

  function Page(props) {
    const { state, t, api } = props
    const engine = state.sensors
    const sc = TT.Sensors.scenario(engine.scenarioId)
    const sensors = TT.Sensors.sensorsOf(sc)
    const built = TT.Sensors.circuit(sc.id)
    const evaluation = TT.Sensors.evaluate(sc.id, engine.values, engine.thresholds)
    return h('div', { className: 'tt-labgrid' },
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('sensor.title')),
          h('span', null, t('sensor.sub')),
        ),
        h('div', { className: 'tt-labrow' }, TT.Sensors.SCENARIOS.map((item) =>
          h('button', {
            key: item.id,
            type: 'button',
            className: 'tt-chip',
            'data-active': engine.scenarioId === item.id ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'sensors/scenario', id: item.id }),
          }, t(item.nameKey)))),
        h('p', { className: 'tt-labempty' }, t(sc.descKey)),
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, built.gateCount), h('span', null, t('lab.synth.gates'))),
          h('div', { className: 'tt-labstat' }, h('b', null, sc.outputs.length), h('span', null, t('sensor.actuators'))),
          h('div', { className: 'tt-labstat' }, h('b', null, built.depth), h('span', null, t('hud.depth'))),
          h('div', { className: 'tt-labstat' }, h('b', null, built.fingerprint), h('span', null, t('access.fingerprint'))),
        ),
        h('div', { className: 'tt-lablabel', style: { marginTop: 4 } }, t('sensor.inputs')),
        sensors.map((sensor) => {
          const value = engine.values[sensor.id] !== undefined ? engine.values[sensor.id] : sensor.value
          const threshold = engine.thresholds[sensor.id] !== undefined ? engine.thresholds[sensor.id] : sensor.threshold || 1
          const on = (evaluation.bits >> sensors.indexOf(sensor)) & 1
          return h('div', { key: sensor.id, className: 'tt-sensorrow' },
            h('span', { className: 'tt-sensorname' }, t(sensor.labelKey), on ? h('i', { 'data-on': 'true' }) : h('i', null)),
            sensor.type === 'bool'
              ? h('button', {
                  type: 'button',
                  className: 'tt-chip',
                  'data-active': value >= 1 ? 'true' : 'false',
                  onClick: () => api.dispatch({ type: 'sensors/value', key: sensor.id, value: value >= 1 ? 0 : 1 }),
                }, value >= 1 ? t('sensor.on') : t('sensor.off'))
              : h('input', {
                  type: 'range',
                  className: 'tt-slider',
                  min: 0,
                  max: sensor.id === 'co2' ? 2000 : 100,
                  value,
                  onChange: (event) => api.dispatch({ type: 'sensors/value', key: sensor.id, value: Number(event.target.value) }),
                }),
            sensor.type === 'bool'
              ? h('span', { className: 'tt-sensorval' }, '')
              : h('span', { className: 'tt-sensorval' }, `${value}${sensor.unit}`),
            sensor.type === 'bool' ? null : h('span', { className: 'tt-sensorval' },
              h('input', {
                type: 'number',
                className: 'tt-sensorthreshold',
                value: threshold,
                onChange: (event) => api.dispatch({ type: 'sensors/threshold', key: sensor.id, value: Number(event.target.value) }),
              }), t('sensor.threshold')),
          )
        }),
        h('div', { className: 'tt-lablabel', style: { marginTop: 6 } }, t('sensor.actuatorTitle')),
        h('div', { className: 'tt-actuators' }, evaluation.actuators.map((actuator) =>
          h('div', { key: actuator.key, className: 'tt-actuator', 'data-on': actuator.on ? 'true' : 'false', 'data-tone': actuator.tone },
            h('i', null),
            h('span', null, t(actuator.labelKey)),
            h('b', null, actuator.on ? t('sensor.firing') : t('sensor.idle')),
          ))),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'sensors/audit' }) }, t('access.audit')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            onClick: () => api.dispatch({ type: 'sensors/issue' }) }, t('access.issue')),
          h('span', { className: 'tt-lablabel' }, t('sensor.auditHint')),
        ),
        engine.audit
          ? h('div', { className: 'tt-labrow' },
              h('span', { className: 'tt-badge', 'data-tone': engine.audit.passed ? 'good' : 'bad' },
                `${engine.audit.passed ? t('hud.verifyPass') : t('hud.verifyFail')} · ${engine.audit.count} ${t('sensor.rows')}`))
          : null,
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('sensor.receipt.title')),
          h('span', null, t('sensor.receipt.hint')),
        ),
        engine.receipt
          ? h('div', null,
              h('div', { className: 'tt-hex tt-mono', style: { maxHeight: 90 } }, engine.receipt.code),
              h('div', { className: 'tt-labrow' },
                h('button', { type: 'button', className: 'tt-chip',
                  onClick: () => copyText(api, engine.receipt.code) }, t('access.receipt.copy')),
                h('span', { className: 'tt-lablabel' }, `${t('access.receipt.fingerprint')} ${engine.receipt.fingerprint}`),
              ),
            )
          : h('p', { className: 'tt-labempty' }, t('sensor.receipt.empty')),
        h('div', { className: 'tt-lablabel' }, t('access.verify.title')),
        h('textarea', {
          className: 'tt-archivebox',
          placeholder: t('access.verify.codePlaceholder'),
          value: engine.verifyCode || '',
          onChange: (event) => api.dispatch({ type: 'sensors/verifyCode', code: event.target.value }),
        }),
        h('div', { className: 'tt-labrow' },
          h('input', {
            className: 'tt-archivebox',
            style: { minHeight: 0, height: 30, width: 160 },
            placeholder: t('access.verify.hashPlaceholder'),
            value: engine.verifyHash || '',
            onChange: (event) => api.dispatch({ type: 'sensors/verifyHash', hash: event.target.value }),
          }),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'sensors/verify' }) }, t('access.verify.run')),
        ),
        engine.verifyResult
          ? h('div', { className: 'tt-finalenote', style: { borderLeftColor: engine.verifyResult.ok ? 'var(--tt-mint)' : 'var(--tt-red)' } },
              engine.verifyResult.ok
                ? `${t('access.verify.pass')} · ${engine.verifyResult.actuators.filter((actuator) => actuator.on).map((actuator) => t(actuator.labelKey)).join(' / ') || t('sensor.none')}`
                : `${t('access.verify.fail')}：${(engine.verifyResult.reasonKeys || []).map((r) => t(r.key, r.params || {})).join('；') || (engine.verifyResult.reasons || []).join('；')}`)
          : null,
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' }, h('strong', null, t('sensor.why.title'))),
        h('p', { className: 'tt-labempty' }, t('sensor.why.body')),
        h('p', { className: 'tt-finalenote', style: { margin: 0 } }, t('sensor.why.note')),
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
