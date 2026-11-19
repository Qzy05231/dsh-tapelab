/**
 * 35-lab — the "实验室" tools: synthesis, component museum, circuit sandbox and a
 * local circuit library. Rendered inside the same main panel, above the 3D stage.
 */

TT.LabUI = (function () {
  const h = TT.h

  function gateCountLabel(entry) {
    const gates = TT.Parts && TT.Parts.museumGates ? TT.Parts.museumGates(entry) : entry.gates
    return gates == null ? '—' : String(gates)
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
      const area = document.createElement('textarea')
      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand && document.execCommand('copy')
      document.body.removeChild(area)
      api.dispatch({ type: 'toast/show', key: ok ? 'lab.copied' : 'lab.copyFail', tone: ok ? 'good' : 'warn' })
    } catch (error) {
      api.dispatch({ type: 'toast/show', key: 'lab.copyFail', tone: 'warn' })
    }
  }

  function Lab(props) {
    const { state, t, resolve, api } = props
    const lab = state.lab
    const tabs = [
      ['synth', 'lab.tab.synth'],
      ['museum', 'lab.tab.museum'],
      ['sandbox', 'lab.tab.sandbox'],
      ['library', 'lab.tab.library'],
      ['hardware', 'lab.tab.hardware'],
      ['access', 'lab.tab.access'],
      ['lottery', 'lab.tab.lottery'],
      ['art', 'lab.tab.art'],
      ['sensors', 'lab.tab.sensors'],
    ]
    return h('div', { className: 'tt-labview' },
      h('div', { className: 'tt-labhero' },
        h('div', { className: 'tt-labherotxt' },
          h('div', { className: 'tt-labadge' }, t('lab.badge')),
          h('h2', null, t('lab.title')),
          h('p', null, t('lab.sub')),
        ),
        h('div', { className: 'tt-labtabs' }, tabs.map(([id, key]) =>
          h('button', {
            key: id,
            type: 'button',
            className: 'tt-labtab',
            'data-active': lab.tab === id ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'lab/tab', tab: id }),
          }, t(key)),
        )),
      ),
      lab.tab === 'synth' ? h(Synthesizer, { lab, t, api }) : null,
      lab.tab === 'museum' ? h(Museum, { lab, t, api }) : null,
      lab.tab === 'sandbox' ? h(SandboxPage, { lab, t, api }) : null,
      lab.tab === 'library' ? h(Library, { lab, t, api }) : null,
      lab.tab === 'hardware' ? h(Hardware, { lab, t, api }) : null,
      lab.tab === 'access' && TT.AccessUI ? TT.AccessUI.Page({ state, t, api }) : null,
      lab.tab === 'lottery' && TT.LotteryUI ? TT.LotteryUI.Page({ state, t, api }) : null,
      lab.tab === 'art' && TT.ArtUI ? TT.ArtUI.Page({ state, t, api }) : null,
      lab.tab === 'sensors' && TT.SensorsUI ? TT.SensorsUI.Page({ state, t, api }) : null,
    )
  }

  // ---------------------------------------------------------------- synthesizer
  function Synthesizer(props) {
    const { lab, t, api } = props
    const count = 1 << lab.nIn
    const result = lab.result
    const verify = lab.verify
    const cycles = [0, 1, -1]
    return h('div', { className: 'tt-labgrid' },
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('lab.synth.title')),
          h('span', null, t('lab.synth.hint')),
        ),
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('lab.synth.inputs')),
          [2, 3, 4].map((n) => h('button', {
            key: n,
            type: 'button',
            className: 'tt-chip',
            'data-active': lab.nIn === n ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'lab/nIn', nIn: n }),
          }, `${n}`)),
          h('span', { style: { flex: 1 } }),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
            onClick: () => api.dispatch({ type: 'lab/clear' }) }, t('lab.synth.clear')),
        ),
        h('div', { className: 'tt-truthgrid', style: { '--cols': Math.min(8, count) } },
          Array.from({ length: count }, (_, index) => {
            const value = lab.bits[index]
            const next = cycles[(cycles.indexOf(value) + 1) % 3]
            return h('button', {
              key: index,
              type: 'button',
              className: 'tt-truthcell',
              'data-value': value,
              title: `${TT.util.formatBits(index, lab.nIn)} → ${value === -1 ? '×' : value}`,
              onClick: () => api.dispatch({ type: 'lab/toggle', index, value: next }),
            },
              h('span', { className: 'tt-truthbits' }, TT.util.formatBits(index, lab.nIn)),
              h('b', null, value === -1 ? '×' : String(value)),
            )
          }),
        ),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
            onClick: () => api.dispatch({ type: 'lab/synth' }) }, t('lab.synth.run')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            disabled: !result, onClick: () => api.dispatch({ type: 'lab/sandbox', source: 'result' }) }, t('lab.synth.sandbox')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
            disabled: !result, onClick: () => api.dispatch({ type: 'lab/save' }) }, t('lab.synth.save')),
        ),
        result && TT.Export ? h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('lab.export.title')),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => copyText(api, result.hex) }, t('lab.export.hex')),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => copyText(api, TT.Export.verilog(result.netlist, 'synthesized')) }, t('lab.export.verilog')),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => copyText(api, TT.Export.netlistJson(result.netlist)) }, t('lab.export.json')),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => copyText(api, TT.Export.truthTableCsv(result.netlist)) }, t('lab.export.csv')),
        ) : null,
      ),
      h('section', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' },
          h('strong', null, t('lab.synth.result')),
          verify ? h('span', { className: 'tt-badge', 'data-tone': verify.status === 'pass' ? 'good' : 'bad' },
            verify.status === 'pass' ? t('lab.verify.pass') : t('lab.verify.fail')) : null,
        ),
        result ? h('div', null,
          h('div', { className: 'tt-labstats' },
            h('div', { className: 'tt-labstat' }, h('b', null, result.gateCount), h('span', null, t('lab.synth.gates'))),
            h('div', { className: 'tt-labstat' }, h('b', null, result.literalCount), h('span', null, t('lab.synth.literals'))),
            h('div', { className: 'tt-labstat' }, h('b', null, result.terms), h('span', null, t('lab.synth.terms'))),
            h('div', { className: 'tt-labstat' }, h('b', null, count), h('span', null, t('lab.synth.rows'))),
          ),
          h('div', { className: 'tt-hex tt-mono' }, result.hex.length > 160 ? result.hex.slice(0, 157) + '…' : result.hex),
          verify ? h('table', { className: 'tt-table' },
            h('thead', null, h('tr', null,
              h('th', null, t('hud.evalInput')),
              h('th', null, t('lab.synth.expect')),
              h('th', null, t('lab.synth.actual')),
            )),
            h('tbody', null, verify.rows.slice(0, 16).map((row) =>
              h('tr', { key: row.inputBits, 'data-ok': row.ok === false ? 'false' : 'true' },
                h('td', { className: 'tt-bit' }, TT.util.formatBits(row.inputBits, lab.nIn)),
                h('td', { className: 'tt-bit' }, String(row.expectedBits)),
                h('td', { className: 'tt-bit' }, String(row.actualBits)),
              ),
            )),
          ) : null,
        ) : h('p', { className: 'tt-labempty' }, t('lab.synth.empty')),
      ),
    )
  }

  // ---------------------------------------------------------------- museum
  function Museum(props) {
    const { t, api } = props
    const entries = TT.Parts && TT.Parts.museum ? TT.Parts.museum : []
    return h('div', { className: 'tt-museum' },
      h('div', { className: 'tt-labcardhead' },
        h('strong', null, t('lab.museum.title')),
        h('span', null, t('lab.museum.hint')),
      ),
      h('div', { className: 'tt-museumgrid' }, entries.map((entry) => {
        const stateful = entry.id === 'counter4' || entry.latches
        return h('article', { key: entry.id, className: 'tt-museumcard' },
          h('div', { className: 'tt-museumart' },
            h('span', { className: 'tt-museumglyph' }, entry.formula),
          ),
          h('div', { className: 'tt-museumtext' },
            h('strong', null, t(entry.nameKey) !== entry.nameKey ? t(entry.nameKey) : entry.name),
            h('span', { className: 'tt-museumformula' }, entry.formula),
            h('span', { className: 'tt-museuminfo' },
              stateful ? t('lab.museum.stateful') : `${gateCountLabel(entry)} ${t('lab.synth.gates')}`),
          ),
          h('div', { className: 'tt-labrow' },
            h('button', {
              type: 'button',
              className: 'tt-btn',
              'data-kind': 'secondary',
              disabled: stateful,
              onClick: () => api.dispatch({ type: 'lab/sandbox', source: 'museum', id: entry.id }),
            }, t('lab.museum.open')),
          ),
        )
      })),
    )
  }

  // ---------------------------------------------------------------- library
  function Library(props) {
    const { lab, t, api } = props
    const library = lab.library || []
    const [archive, setArchive] = React.useState('')
    const [importing, setImporting] = React.useState(false)
    return h('div', { className: 'tt-labcard' },
      h('div', { className: 'tt-labcardhead' },
        h('strong', null, t('lab.library.title')),
        h('span', null, `${library.length}/24`),
      ),
      TT.Export ? h('div', { className: 'tt-labrow' },
        h('span', { className: 'tt-lablabel' }, t('lab.archive.title')),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
          onClick: () => copyText(api, TT.Export.libraryCode(library)) }, t('lab.archive.export')),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
          onClick: () => setImporting((open) => !open) }, t('lab.archive.import')),
        h('span', { style: { fontSize: 10, color: 'var(--tt-faint)' } }, t('lab.archive.hint')),
      ) : null,
      importing ? h('div', { className: 'tt-labrow', style: { alignItems: 'stretch' } },
        h('textarea', {
          className: 'tt-archivebox',
          placeholder: t('lab.archive.placeholder'),
          value: archive,
          onChange: (event) => setArchive(event.target.value),
        }),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary',
          onClick: () => {
            if (!archive.trim()) return
            api.dispatch({ type: 'lab/import', code: archive.trim() })
            setArchive('')
            setImporting(false)
          } }, t('lab.archive.import')),
      ) : null,
      library.length === 0
        ? h('p', { className: 'tt-labempty' }, t('lab.library.empty'))
        : h('div', { className: 'tt-librarylist' }, library.map((entry) =>
            h('div', { key: entry.id, className: 'tt-libraryrow' },
              h('span', { className: 'tt-libraryname' }, entry.name),
              h('span', { className: 'tt-libraryhex tt-mono' }, (entry.hex || '').slice(0, 42)),
              h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
                onClick: () => api.dispatch({ type: 'lab/sandbox', source: 'library', id: entry.id }) }, t('lab.museum.open')),
              h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
                onClick: () => api.dispatch({ type: 'lab/remove', id: entry.id }) }, '✕'),
            ),
          )),
    )
  }

  // ---------------------------------------------------------------- hardware
  function Hardware(props) {
    const { lab, t, api } = props
    const from = lab.hardwareFrom === 'sandbox' ? 'sandbox' : 'result'
    const netlist = from === 'sandbox' ? (lab.sandbox && lab.sandbox.netlist) : (lab.result && lab.result.netlist)
    const plan = React.useMemo(() => {
      if (!netlist || !TT.Hardware) return null
      try {
        return TT.Hardware.plan(netlist)
      } catch (error) {
        return null
      }
    }, [netlist])
    return h('div', { className: 'tt-labcard' },
      h('div', { className: 'tt-labcardhead' },
        h('strong', null, t('lab.hardware.title')),
        h('span', null, t('lab.hardware.hint')),
        h('button', { type: 'button', className: 'tt-chip', 'data-active': from === 'result' ? 'true' : 'false',
          onClick: () => api.dispatch({ type: 'lab/hardware', from: 'result' }) }, t('lab.hardware.fromResult')),
        h('button', { type: 'button', className: 'tt-chip', 'data-active': from === 'sandbox' ? 'true' : 'false',
          onClick: () => api.dispatch({ type: 'lab/hardware', from: 'sandbox' }) }, t('lab.hardware.fromSandbox')),
      ),
      plan ? h('div', null,
        h('div', { className: 'tt-labstats' },
          h('div', { className: 'tt-labstat' }, h('b', null, plan.gates), h('span', null, t('lab.synth.gates'))),
          h('div', { className: 'tt-labstat' }, h('b', null, plan.chips), h('span', null, t('lab.hardware.chips'))),
          h('div', { className: 'tt-labstat' }, h('b', null, plan.wires), h('span', null, t('lab.hardware.wires'))),
          h('div', { className: 'tt-labstat' }, h('b', null, plan.boards), h('span', null, t('lab.hardware.boards'))),
        ),
        plan.warnings.length ? h('div', { className: 'tt-finalenote', style: { margin: '4px 0' } },
          plan.warnings.map((warning, index) => h('div', { key: index }, '⚠ ', warning))) : null,
        h('div', { className: 'tt-labrow' },
          h('span', { className: 'tt-lablabel' }, t('lab.export.title')),
          h('button', { type: 'button', className: 'tt-chip',
            onClick: () => copyText(api, TT.Hardware.bomCsv(plan)) }, t('lab.hardware.copyBom')),
          h('button', { type: 'button', className: 'tt-chip',
            onClick: () => copyText(api, TT.Hardware.wiresCsv(plan)) }, t('lab.hardware.copyWires')),
          h('button', { type: 'button', className: 'tt-chip',
            onClick: () => copyText(api, TT.Hardware.markdown(plan, from === 'sandbox' && lab.sandbox ? lab.sandbox.name : 'synthesized', netlist)) },
            t('lab.hardware.copyGuide')),
        ),
        h('h4', { style: { margin: '8px 0 4px', fontSize: 12, color: 'var(--tt-mint)' } }, t('lab.hardware.bom')),
        h('table', { className: 'tt-table' },
          h('thead', null, h('tr', null,
            h('th', null, t('lab.hardware.item')),
            h('th', null, t('lab.hardware.qty')),
            h('th', null, t('lab.hardware.note')),
          )),
          h('tbody', null, plan.bom.map((entry, index) =>
            h('tr', { key: index },
              h('td', null, entry.item),
              h('td', { className: 'tt-bit' }, entry.qty),
              h('td', { style: { fontSize: 10, color: 'var(--tt-dim)' } }, entry.note),
            ),
          )),
        ),
        h('h4', { style: { margin: '10px 0 4px', fontSize: 12, color: 'var(--tt-mint)' } }, t('lab.hardware.pins')),
        h('table', { className: 'tt-table' },
          h('thead', null, h('tr', null,
            h('th', null, '#'),
            h('th', null, t('lab.hardware.chip')),
            h('th', null, t('lab.hardware.unit')),
            h('th', null, 'A / B / Y'),
          )),
          h('tbody', null, plan.pinTable.map((entry) =>
            h('tr', { key: entry.gate },
              h('td', { className: 'tt-bit' }, entry.gate),
              h('td', null, `U${entry.chip}`),
              h('td', null, entry.unit),
              h('td', { className: 'tt-bit' }, entry.pins),
            ),
          )),
        ),
        h('h4', { style: { margin: '10px 0 4px', fontSize: 12, color: 'var(--tt-mint)' } }, `${t('lab.hardware.wiresTitle')} · ${plan.wires}`),
        h('div', { className: 'tt-hardwarewires' }, plan.wireList.map((entry, index) =>
          h('div', { key: index, className: 'tt-hardwarewire' },
            h('span', null, entry.from), h('b', null, '→'), h('span', null, entry.to),
            entry.note ? h('em', null, entry.note) : null,
          ),
        )),
        h('p', { className: 'tt-finalenote', style: { marginTop: 10 } }, t('lab.hardware.steps')),
      ) : h('div', null,
        h('p', { className: 'tt-labempty' }, t('lab.hardware.empty')),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'lab/tab', tab: 'synth' }) }, t('lab.hardware.goSynth')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'lab/tab', tab: 'sandbox' }) }, t('lab.hardware.goSandbox')),
        ),
      ),
    )
  }

  // ---------------------------------------------------------------- sandbox
  function SandboxPage(props) {
    const { lab, t, api } = props
    const sandbox = lab.sandbox
    if (!sandbox) {
      return h('div', { className: 'tt-labcard' },
        h('div', { className: 'tt-labcardhead' }, h('strong', null, t('lab.sandbox.title'))),
        h('p', { className: 'tt-labempty' }, t('lab.sandbox.empty')),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            disabled: !lab.result, onClick: () => api.dispatch({ type: 'lab/sandbox', source: 'result' }) }, t('lab.sandbox.fromSynth')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'secondary',
            onClick: () => api.dispatch({ type: 'lab/tab', tab: 'museum' }) }, t('lab.sandbox.fromMuseum')),
        ),
      )
    }
    const netlist = sandbox.netlist
    const inputs = lab.sandboxInputs || 0
    return h('div', { className: 'tt-labcard tt-sandboxcard' },
      h('div', { className: 'tt-labcardhead' },
        h('strong', null, t('lab.sandbox.title')),
        h('span', null, `${sandbox.name} · ${TT.Circuit.gateCount(netlist)} ${t('lab.synth.gates')} · ${netlist.nIn} in / ${netlist.outputs.length} out`),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost',
          onClick: () => api.dispatch({ type: 'lab/tab', tab: 'synth' }) }, '←'),
        TT.Export ? h('button', { type: 'button', className: 'tt-chip',
          onClick: () => copyText(api, TT.Export.verilog(netlist, sandbox.name)) }, t('lab.export.verilog')) : null,
        TT.Export ? h('button', { type: 'button', className: 'tt-chip',
          onClick: () => copyText(api, TT.Export.netlistJson(netlist)) }, t('lab.export.json')) : null,
      ),
      h(SandboxCanvas, { netlist, inputs, api, t }),
      h('div', { className: 'tt-labrow tt-sandboxinputs' },
        h('span', { className: 'tt-lablabel' }, t('lab.sandbox.inputs')),
        netlist.nIn > 16
          ? h('span', null, '16+ inputs: use the mission panels')
          : Array.from({ length: Math.min(16, netlist.nIn) }, (_, index) =>
              h('button', {
                key: index,
                type: 'button',
                className: 'tt-chip',
                'data-active': (inputs >> index) & 1 ? 'true' : 'false',
                onClick: () => api.dispatch({ type: 'lab/input', bits: inputs ^ (1 << index) }),
              }, `I${index}`),
            ),
      ),
    )
  }

  function SandboxCanvas(props) {
    const { netlist, inputs, api } = props
    const canvasRef = React.useRef(null)
    const inputsRef = React.useRef(inputs)
    inputsRef.current = inputs
    React.useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas || !TT.Engine || !netlist) return undefined
      const engine = TT.Engine.create(canvas, { dprMax: 2, background: '#04070d' })
      const items = []
      const gateCount = TT.Circuit.gateCount(netlist)
      const columns = 10
      const rows = Math.max(1, Math.ceil(gateCount / columns))
      const outBits = new Array(netlist.outputs.length).fill(0)
      const positions = new Array(2 + netlist.nIn + gateCount)
      const inputColumns = Math.min(4, Math.max(1, netlist.nIn))
      for (let i = 0; i < netlist.nIn; i += 1) {
        const col = i % inputColumns
        const row = Math.floor(i / inputColumns)
        positions[2 + i] = [-7.2 + col * 1.15, 0.5, -3.2 + row * 1.15]
      }
      const gateStartX = -4.6
      const gateStartZ = -2.6
      for (let i = 0; i < gateCount; i += 1) {
        positions[2 + netlist.nIn + i] = [gateStartX + (i % columns) * 1.05, 0.5, gateStartZ + Math.floor(i / columns) * 0.9]
      }
      const outX = gateStartX + columns * 1.05 + 0.4
      const outPositions = []
      for (let i = 0; i < netlist.outputs.length; i += 1) {
        outPositions.push([outX, 0.55, gateStartZ + i * 0.85])
      }
      function nodePos(node) {
        if (node === 0 || node === 1) return [-8.3, 0.4, node === 0 ? -1.2 : 1.2]
        return positions[node] || [0, 0.5, 0]
      }
      items.push(engine.add({ kind: 'grid', pos: [0, 0, 0], size: [22, 16], cell: 1, color: TT.palette.grid, majorEvery: 4 }))
      items.push(engine.add({ kind: 'plate', pos: [-1.2, 0.02, 0], size: [18, 12], color: TT.palette.wafer, ring: TT.palette.dieEdge }))
      for (let i = 0; i < netlist.nIn; i += 1) {
        const pos = positions[2 + i]
        const pad = engine.add({
          kind: 'plate',
          id: `pad:${i}`,
          pos: [pos[0], 0.05, pos[2]],
          size: [0.85, 0.85],
          color: '#0a1a28',
          ring: TT.palette.cyanDim,
          label: `I${i}`,
        })
        items.push(pad)
        items.push(engine.add({
          kind: 'sprite',
          pos: [pos[0], 0.5, pos[2]],
          size: 0.4,
          draw: TT.Parts ? TT.Parts.sprite.led(() => ((inputsRef.current >> i) & 1)) : null,
        }))
      }
      items.push(engine.add({ kind: 'text', pos: [0, 0.05, -4.6], text: 'CIRCUIT SANDBOX · NAND NETLIST', size: 10, color: TT.palette.cyanDim }))
      for (let i = 0; i < gateCount; i += 1) {
        const gate = netlist.gates[i]
        const pos = positions[2 + netlist.nIn + i]
        items.push(engine.add({
          kind: 'cube',
          pos: [pos[0], 0.05, pos[2]],
          size: [0.8, 0.5, 0.7],
          color: TT.palette.gate,
          edge: TT.palette.gateEdge,
          label: `N${i + 1}`,
          sub: 'NAND',
        }))
        ;[gate.a, gate.b].forEach((source) => {
          const from = nodePos(source)
          items.push(engine.add({
            kind: 'wire',
            points: [from, [(from[0] + pos[0]) / 2, 0.9, (from[2] + pos[2]) / 2], [pos[0], 0.4, pos[2]]],
            color: TT.palette.wire,
            width: 0.025,
            glow: 0.35,
            flow: 0.2,
          }))
        })
      }
      for (let i = 0; i < netlist.outputs.length; i += 1) {
        const pos = outPositions[i]
        const source = netlist.outputs[i]
        const from = nodePos(source)
        items.push(engine.add({
          kind: 'wire',
          points: [from, [(from[0] + pos[0]) / 2, 1.1, (from[2] + pos[2]) / 2], [pos[0], 0.45, pos[2]]],
          color: TT.palette.mint,
          width: 0.032,
          glow: 0.5,
          flow: 0.6,
        }))
        items.push(engine.add({
          kind: 'sprite',
          pos: [pos[0], 0.75, pos[2]],
          size: 0.55,
          draw: TT.Parts ? TT.Parts.sprite.led(() => outBits[i], TT.palette.mint) : null,
        }))
        items.push(engine.add({ kind: 'text', pos: [pos[0], 0.05, pos[2] + 0.5], text: `Y${i}`, size: 10, color: TT.palette.mint }))
      }
      engine.setCamera({ yaw: 24, pitch: 30, dist: Math.max(16, rows * 1.4 + 12), target: [-1.2, 0.6, 0] }, { animateMs: 0 })
      engine.setPickCallback((pick, phase) => {
        if (phase !== 'click' || !pick || !pick.id) return
        const match = /^pad:(\d+)$/.exec(pick.id)
        if (!match) return
        const index = Number(match[1])
        api.dispatch({ type: 'lab/input', bits: inputsRef.current ^ (1 << index) })
      })
      engine.setFrameCallback(() => {
        let bits = 0
        for (let i = 0; i < netlist.nIn; i += 1) bits |= ((inputsRef.current >> i) & 1) << i
        try {
          const result = TT.Circuit.evaluate(netlist, bits)
          for (let i = 0; i < outBits.length; i += 1) outBits[i] = result.outputs[i]
        } catch (error) {
          for (let i = 0; i < outBits.length; i += 1) outBits[i] = 0
        }
      })
      engine.start()
      return () => engine.dispose()
    }, [netlist, api])
    return h('div', { className: 'tt-sandboxcanvaswrap' }, h('canvas', { className: 'tt-sandboxcanvas', ref: canvasRef }))
  }

  return { Lab, SandboxCanvas }
})()
