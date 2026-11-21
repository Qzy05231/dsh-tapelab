/**
 * 52-netgrid — reusable gate-level netlist grid.
 *
 * Lays a netlist out by logic depth (inputs on top, one row per level, outputs at
 * the bottom), draws every wire as a bezier, and lets the user toggle inputs,
 * inspect each NAND gate and see the computed 0/1 signal on every node.
 */

TT.NetlistGrid = (function () {
  function nodeCount(netlist) {
    return 2 + (netlist.nIn || 0) + (netlist.nState || 0) + netlist.gates.length
  }

  function layout(netlist) {
    const nIn = netlist.nIn || 0
    const nState = netlist.nState || 0
    const n = nodeCount(netlist)
    const depth = new Array(n).fill(0)
    depth[0] = 0
    depth[1] = 0
    for (let i = 0; i < nIn; i += 1) depth[2 + i] = 0
    netlist.gates.forEach((gate, index) => {
      const node = 2 + nIn + nState + index
      depth[node] = 1 + Math.max(depth[gate.a] || 0, depth[gate.b] || 0)
    })
    const maxLevel = Math.max(1, ...netlist.gates.map((gate, index) => depth[2 + nIn + nState + index]))

    // Matrix layout like a die photo: gates wrap in rows (8 columns), with the
    // logic depth shown as L1..L32 on each card instead of as rows.
    const count = netlist.gates.length
    const columns = count <= 4 ? Math.max(1, count) : count <= 16 ? 4 : 8
    const rowsCount = Math.max(1, Math.ceil(count / columns))
    const cellW = 92
    const cellH = 32
    const gapX = 6
    const gapY = 5
    const inputW = 52
    const inputGap = 4
    const inputY = 30
    const topY = inputY + 30
    const gridW = columns * cellW + (columns - 1) * gapX
    const inputWTotal = nIn * inputW + (nIn - 1) * inputGap
    const width = Math.max(560, gridW + 60, inputWTotal + 60)
    const nodes = Object.create(null)
    const startX = (width - gridW) / 2
    const inputStartX = (width - inputWTotal) / 2

    nodes[0] = { x: 10, y: 6, w: 24, h: 18, kind: 'const', label: '0' }
    nodes[1] = { x: 40, y: 6, w: 24, h: 18, kind: 'const', label: '1' }
    for (let i = 0; i < nIn; i += 1) {
      nodes[2 + i] = {
        x: inputStartX + i * (inputW + inputGap),
        y: inputY,
        w: inputW,
        h: 22,
        kind: 'input',
        index: i,
      }
    }
    const gateCards = []
    netlist.gates.forEach((gate, index) => {
      const node = 2 + nIn + nState + index
      const column = index % columns
      const row = Math.floor(index / columns)
      const card = {
        x: startX + column * (cellW + gapX),
        y: topY + row * (cellH + gapY),
        w: cellW,
        h: cellH,
        node,
        index,
        level: depth[node],
        a: gate.a,
        b: gate.b,
      }
      gateCards.push(card)
      nodes[node] = { x: card.x, y: card.y, w: cellW, h: cellH, kind: 'gate', card }
    })
    const outputY = topY + rowsCount * (cellH + gapY) + 8
    const outputs = netlist.outputs.map((node, index) => {
      const totalW = netlist.outputs.length * 96
      return { x: (width - totalW) / 2 + index * 96, y: outputY, w: 90, h: 26, node, index }
    })
    const height = outputY + 52
    return { nodes, gateCards, outputs, width, height, maxLevel, rows: [], nIn, inputRows: 1 }
  }

  function fitScale(plan, viewWidth, viewHeight) {
    if (!viewWidth || !viewHeight) return 1
    return Math.max(0.12, Math.min(1, Math.min(viewWidth / plan.width, viewHeight / plan.height) * 0.98))
  }

  function values(netlist, bits, stateBits) {
    return TT.Circuit.evaluate(netlist, Number(bits) || 0, { stateBits: Number(stateBits) || 0 }).signals
  }

  function inputLabel(labels, index) {
    return labels && labels[index] !== undefined ? labels[index] : `I${index}`
  }

  return { nodeCount, layout, values, inputLabel, fitScale }
})()

// --------------------------------------------------------------------------- UI

TT.NetlistGridUI = (function () {
  const h = TT.h

  function pair(value) {
    return { x: value.x + value.w / 2, y: value.y + value.h / 2 }
  }

  function Grid(props) {
    const { netlist, bits, stateBits, onToggle, t, inputLabels, outputLabels, autoFit } = props
    const [selected, setSelected] = React.useState(null)
    const plan = TT.NetlistGrid.layout(netlist)
    const signals = TT.NetlistGrid.values(netlist, bits, stateBits)
    const previousRef = React.useRef(null)
    const changed = new Set()
    if (previousRef.current && previousRef.current.length === signals.length) {
      for (let index = 0; index < signals.length; index += 1) {
        if (previousRef.current[index] !== signals[index]) changed.add(index)
      }
    }
    React.useEffect(() => {
      previousRef.current = signals
    })
    const node = (id) => plan.nodes[id]
    const selectedCard = selected !== null ? plan.gateCards[selected] : null

    // ancestors of the selected gate, for path highlighting
    const highlighted = new Set()
    if (selectedCard) {
      const stack = [selectedCard.index]
      while (stack.length) {
        const index = stack.pop()
        const gate = netlist.gates[index]
        for (const source of [gate.a, gate.b]) {
          highlighted.add(`n:${source}`)
          const sourceDriver = plan.nodes[source] && plan.nodes[source].card
          if (sourceDriver) stack.push(sourceDriver.index)
        }
      }
    }

    const edges = []
    plan.gateCards.forEach((card) => {
      const gate = netlist.gates[card.index]
      for (const source of [gate.a, gate.b]) {
        const sourceNode = node(source)
        if (!sourceNode) continue
        const from = pair(sourceNode)
        const to = { x: card.x, y: card.y + card.h / 2 }
        const active = signals[source] === 1
        const isHighlight = selectedCard && (card.index === selectedCard.index || highlighted.has(`n:${source}`))
        edges.push(h('path', {
          key: `${card.index}-${source}`,
          d: `M ${from.x} ${from.y} C ${(from.x + to.x) / 2} ${from.y}, ${(from.x + to.x) / 2} ${to.y}, ${to.x} ${to.y}`,
          className: 'tt-netgrid-wire',
          'data-on': active ? 'true' : 'false',
          'data-highlight': isHighlight ? 'true' : 'false',
          'data-level': card.level,
        }))
      }
    })

    const viewportRef = React.useRef(null)
    const [viewport, setViewport] = React.useState({ w: 0, h: 0 })
    const [zoom, setZoom] = React.useState(autoFit === false ? 1 : null)
    React.useEffect(() => {
      const el = viewportRef.current
      if (!el) return undefined
      const update = () => setViewport({ w: el.clientWidth, h: el.clientHeight })
      update()
      const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
      if (observer) observer.observe(el)
      window.addEventListener('resize', update)
      return () => {
        if (observer) observer.disconnect()
        window.removeEventListener('resize', update)
      }
    }, [])
    const fit = TT.NetlistGrid.fitScale(plan, viewport.w, viewport.h)
    const scale = zoom || fit

    return h('div', { className: 'tt-netgrid-wrap' },
      h('div', { className: 'tt-netgrid-viewport', ref: viewportRef },
        h('div', { className: 'tt-netgrid-zoom' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => setZoom(Math.max(0.12, scale / 1.25)) }, '−'),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => setZoom(null) }, `${Math.round(fit * 100)}% 适应`),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => setZoom(Math.min(3, scale * 1.25)) }, '+'),
        ),
        h('div', { className: 'tt-netgrid-stage', style: { width: plan.width * scale, height: plan.height * scale } },
          h('div', { className: 'tt-netgrid', style: { width: plan.width, height: plan.height, transform: `scale(${scale})` } },
        h('svg', { className: 'tt-netgrid-svg', width: plan.width, height: plan.height, viewBox: `0 0 ${plan.width} ${plan.height}` }, edges),
        // constants
        [0, 1].map((id) => h('div', { key: id, className: 'tt-netgrid-node tt-netgrid-const', style: { left: node(id).x, top: node(id).y } }, `${id}`)),
        // inputs
        netlist.nIn <= 32 ? Array.from({ length: netlist.nIn }, (_, index) => {
          const card = node(2 + index)
          return h('button', {
            key: `in-${index}`,
            type: 'button',
            className: 'tt-netgrid-node tt-netgrid-input',
            'data-on': ((Number(bits) || 0) >> index) & 1 ? 'true' : 'false',
            style: { left: card.x, top: card.y, width: card.w, height: card.h },
            title: `${TT.NetlistGrid.inputLabel(inputLabels, index)} = ${((Number(bits) || 0) >> index) & 1}`,
            onClick: () => onToggle && onToggle(index),
          }, h('span', null, ((Number(bits) || 0) >> index) & 1 ? '1' : '0'), h('b', null, TT.NetlistGrid.inputLabel(inputLabels, index)))
        }) : null,
        // state bits strip (sequential netlists)
        netlist.nState > 0 ? Array.from({ length: netlist.nState }, (_, index) => {
          const value = (Number(stateBits) || 0) >> index & 1
          return h('span', {
            key: `state-${index}`,
            className: 'tt-netgrid-state',
            'data-on': value ? 'true' : 'false',
            style: { left: 10 + index * 54, top: plan.height - 24 },
          }, `Q${index} ${value}`)
        }) : null,
        // gates
        plan.gateCards.map((card) => h('button', {
          key: `g-${card.index}`,
          type: 'button',
          className: 'tt-netgrid-node tt-netgrid-gate',
          'data-selected': selected === card.index ? 'true' : 'false',
          'data-out': signals[card.node] === 1 ? 'true' : 'false',
          'data-changed': changed.has(card.node) ? 'true' : 'false',
          style: { left: card.x, top: card.y, width: card.w, height: card.h },
          title: `NAND #${card.index + 1} · a=${card.a} b=${card.b} y=${card.node}`,
          onClick: () => setSelected(selected === card.index ? null : card.index),
        },
          h('span', { className: 'tt-netgrid-gatetag' }, `N${card.node} · L${card.level}`),
          h('span', { className: 'tt-netgrid-gateval' }, String(signals[card.node] || 0)),
        )),
        // outputs
        plan.outputs.map((card) => h('div', {
          key: `out-${card.index}`,
          className: 'tt-netgrid-node tt-netgrid-output',
          'data-on': signals[card.node] === 1 ? 'true' : 'false',
          style: { left: card.x, top: card.y, width: card.w, height: card.h },
        }, h('i', null), h('span', null, outputLabels && outputLabels[card.index] ? outputLabels[card.index] : `OUT${card.index + 1}`), h('b', null, String(signals[card.node] || 0)))),
          ),
        ),
      ),
      selectedCard
        ? h('div', { className: 'tt-netgrid-detail' },
            h('b', null, `NAND #${selectedCard.index + 1} · L${selectedCard.level}`),
            h('span', null, `a = node ${selectedCard.a} (${signals[selectedCard.a] || 0})`),
            h('span', null, `b = node ${selectedCard.b} (${signals[selectedCard.b] || 0})`),
            h('span', null, `y = node ${selectedCard.node} (${signals[selectedCard.node] || 0})`),
            h('button', { type: 'button', className: 'tt-chip', onClick: () => setSelected(null) }, t('netgrid.clear')),
          )
        : h('div', { className: 'tt-netgrid-detail tt-netgrid-hint' },
            h('span', null, t('netgrid.hint')),
            h('span', null, `${netlist.gates.length} NAND · ${plan.maxLevel} L · ${netlist.nIn} in / ${netlist.outputs.length} out`),
          ),
    )
  }

  return { Grid }
})()
