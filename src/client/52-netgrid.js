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
    const driver = new Array(n).fill(-1)
    depth[0] = 0
    depth[1] = 0
    for (let i = 0; i < nIn; i += 1) depth[2 + i] = 0
    netlist.gates.forEach((gate, index) => {
      const node = 2 + nIn + nState + index
      depth[node] = 1 + Math.max(depth[gate.a] || 0, depth[gate.b] || 0)
      driver[node] = index
    })
    const maxLevel = Math.max(1, ...netlist.gates.map((gate, index) => depth[2 + nIn + nState + index]))
    const rows = Array.from({ length: maxLevel + 1 }, () => [])
    netlist.gates.forEach((gate, index) => {
      const node = 2 + nIn + nState + index
      if (rows[depth[node]]) rows[depth[node]].push(index)
      else rows[rows.length - 1].push(index)
    })
    const cellW = 104
    const cellH = 46
    const gapX = 12
    const gapY = 26
    const topY = 86
    const widest = Math.max(nIn, ...rows.map((row) => row.length), 4)
    const width = Math.max(720, widest * (cellW + gapX) + 120)
    const nodes = Object.create(null)
    const xFor = (count, index) => (width - count * cellW - (count - 1) * gapX) / 2 + index * (cellW + gapX)

    nodes[0] = { x: 16, y: 18, w: 34, h: 26, kind: 'const', label: '0' }
    nodes[1] = { x: 58, y: 18, w: 34, h: 26, kind: 'const', label: '1' }
    for (let i = 0; i < nIn; i += 1) {
      nodes[2 + i] = { x: xFor(nIn, i), y: 18, w: cellW, h: 44, kind: 'input', index: i }
    }
    const gateCards = []
    for (let level = 1; level <= maxLevel; level += 1) {
      const row = rows[level] || []
      const y = topY + (level - 1) * (cellH + gapY)
      row.forEach((gateIndex, column) => {
        const gate = netlist.gates[gateIndex]
        const node = 2 + nIn + nState + gateIndex
        const card = { x: xFor(row.length, column), y, w: cellW, h: cellH, node, index: gateIndex, level, a: gate.a, b: gate.b }
        gateCards.push(card)
        nodes[node] = { x: card.x, y, w: cellW, h: cellH, kind: 'gate', card }
      })
    }
    const outputY = topY + maxLevel * (cellH + gapY) + 14
    const outputs = netlist.outputs.map((node, index) => {
      const card = { x: xFor(netlist.outputs.length, index), y: outputY, w: cellW, h: 44, node, index }
      return card
    })
    const height = outputY + 84
    return { nodes, gateCards, outputs, width, height, maxLevel, rows, nIn }
  }

  function values(netlist, bits) {
    return TT.Circuit.evaluate(netlist, Number(bits) || 0).signals
  }

  function inputLabel(labels, index) {
    return labels && labels[index] !== undefined ? labels[index] : `I${index}`
  }

  return { nodeCount, layout, values, inputLabel }
})()

// --------------------------------------------------------------------------- UI

TT.NetlistGridUI = (function () {
  const h = TT.h

  function pair(value) {
    return { x: value.x + value.w / 2, y: value.y + value.h / 2 }
  }

  function Grid(props) {
    const { netlist, bits, onToggle, t, inputLabels, outputLabels, compact } = props
    const [selected, setSelected] = React.useState(null)
    const plan = TT.NetlistGrid.layout(netlist)
    const signals = TT.NetlistGrid.values(netlist, bits)
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

    return h('div', { className: 'tt-netgrid-wrap' },
      h('div', { className: 'tt-netgrid', style: { width: plan.width, height: plan.height } },
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
          }, h('b', null, TT.NetlistGrid.inputLabel(inputLabels, index)), h('span', null, ((Number(bits) || 0) >> index) & 1 ? '1' : '0'))
        }) : null,
        // gates
        plan.gateCards.map((card) => h('button', {
          key: `g-${card.index}`,
          type: 'button',
          className: 'tt-netgrid-node tt-netgrid-gate',
          'data-selected': selected === card.index ? 'true' : 'false',
          'data-out': signals[card.node] === 1 ? 'true' : 'false',
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
