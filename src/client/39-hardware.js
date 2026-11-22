/**
 * 39-hardware — turn a combinational NAND netlist into a real breadboard build:
 * 74HC00 chip count, per-gate pin assignment, BOM and a wire-by-wire list.
 *
 * Only combinational netlists are supported: a physical SR latch / counter needs
 * extra parts (74HC74, 74HC573) and manual clock wiring, so those plans warn instead
 * of pretending a 74HC00-only build is enough.
 *
 * 74HC00 pinout (DIP-14): 1=1A 2=1B 3=1Y, 4=2A 5=2B 6=2Y, 7=GND,
 *                         8=3Y 9=3A 10=3B, 11=4Y 12=4A 13=4B, 14=VCC
 */

TT.Hardware = (function () {
  const UNITS = [
    { a: 1, b: 2, y: 3 },
    { a: 4, b: 5, y: 6 },
    { a: 9, b: 10, y: 8 },
    { a: 12, b: 13, y: 11 },
  ]

  function gatePins(gateIndex) {
    const chip = Math.floor(gateIndex / 4) + 1
    const unit = gateIndex % 4
    return { chip, unit: unit + 1, ...UNITS[unit] }
  }

  function plan(netlist) {
    if (!netlist || !Array.isArray(netlist.gates)) throw new Error('plan: netlist required')
    const warnings = []
    const gates = netlist.gates
    const chips = Math.ceil(gates.length / 4) || 1
    const gateCount = gates.length
    const inputs = netlist.nIn
    const outputs = netlist.outputs
    const nodeDriver = []
    nodeDriver[0] = { kind: 'rail', label: 'GND (0V)', labelKey: 'hw.wire.gnd' }
    nodeDriver[1] = { kind: 'rail', label: 'VCC (5V)', labelKey: 'hw.wire.vcc' }
    for (let i = 0; i < inputs; i += 1) {
      nodeDriver[2 + i] = {
        kind: 'switch',
        index: i,
        label: `拨码开关 S${i + 1}`,
        labelKey: 'hw.wire.switch',
        labelParams: { n: i + 1 },
      }
    }
    for (let g = 0; g < gateCount; g += 1) {
      const pins = gatePins(g)
      nodeDriver[2 + inputs + g] = {
        kind: 'gate',
        gate: g,
        label: `U${pins.chip} 第 ${pins.unit} 个门 · 输出脚 ${pins.y}`,
        labelKey: 'hw.wire.gateDriver',
        labelParams: { chip: pins.chip, unit: pins.unit, pin: pins.y },
        pin: pins.y,
        chip: pins.chip,
      }
    }

    const pinTable = []
    const wires = []
    const warningKeys = []
    const wire = (from, to, note, fromKey, fromParams, toKey, toParams, noteKey, noteParams) => {
      wires.push({
        from,
        to,
        note: note || '',
        fromKey,
        fromParams,
        toKey,
        toParams,
        noteKey,
        noteParams,
      })
    }

    for (let g = 0; g < gateCount; g += 1) {
      const gate = gates[g]
      const pins = gatePins(g)
      pinTable.push({
        gate: g + 1,
        chip: pins.chip,
        unit: pins.unit,
        pins: `A${pins.a} B${pins.b} Y${pins.y}`,
        aNode: gate.a,
        bNode: gate.b,
      })
      ;[['A', gate.a, pins.a], ['B', gate.b, pins.b]].forEach(([pinName, node, pin]) => {
        const driver = nodeDriver[node]
        if (!driver) {
          warnings.push(`门 ${g + 1} 的 ${pinName} 输入引用了不存在的节点 ${node}`)
          warningKeys.push({ key: 'hw.warn.missingNode', params: { gate: g + 1, pin: pinName, node } })
          return
        }
        const toLabel = `U${pins.chip} 脚${pin}（${pinName}）`
        const toKey = 'hw.wire.chipPin'
        const toParams = { chip: pins.chip, pin, pinName }
        if (driver.kind === 'rail') {
          wire(driver.label, toLabel, `固定接 ${node === 0 ? 'GND' : 'VCC'}（恒 ${node}）`, driver.labelKey, {}, toKey, toParams, 'hw.wire.noteRail', { rail: node === 0 ? 'GND' : 'VCC', node })
        } else if (driver.kind === 'switch') {
          wire(driver.label, toLabel, '开关串联 10kΩ 下拉到 GND', driver.labelKey, driver.labelParams, toKey, toParams, 'hw.wire.noteSwitch', {})
        } else {
          wire(`U${driver.chip} 脚${driver.pin}（Y）`, toLabel, '74HC00 输出 → 输入', 'hw.wire.chipOut', { chip: driver.chip, pin: driver.pin }, toKey, toParams, 'hw.wire.noteGateToGate', {})
        }
      })
    }

    outputs.forEach((node, index) => {
      const driver = nodeDriver[node]
      if (!driver) {
        warnings.push(`输出 ${index + 1} 引用了不存在的节点 ${node}`)
        warningKeys.push({ key: 'hw.warn.missingOutputNode', params: { out: index + 1, node } })
        return
      }
      const toLabel = `LED${index + 1}`
      const toKey = 'hw.wire.led'
      const toParams = { n: index + 1 }
      if (driver.kind === 'rail') {
        wire(driver.label, toLabel, `恒 ${node}：LED 直接接电源/地（经 330Ω）`, driver.labelKey, {}, toKey, toParams, 'hw.wire.noteLedRail', { node })
      } else if (driver.kind === 'switch') {
        wire(driver.label, toLabel, driver.label + ' → 330Ω → LED → GND', driver.labelKey, driver.labelParams, toKey, toParams, 'hw.wire.noteLedSwitch', { label: driver.label })
      } else {
        wire(`U${driver.chip} 脚${driver.pin}（Y）`, toLabel, '经 330Ω 限流电阻到 GND', 'hw.wire.chipOut', { chip: driver.chip, pin: driver.pin }, toKey, toParams, 'hw.wire.noteLedGate', {})
      }
    })

    const fanOut = {}
    for (const gate of gates) {
      fanOut[gate.a] = (fanOut[gate.a] || 0) + 1
      fanOut[gate.b] = (fanOut[gate.b] || 0) + 1
    }
    const maxFanOut = Math.max(0, ...Object.values(fanOut))
    if (maxFanOut > 6) {
      warnings.push(`最大扇出 ${maxFanOut}：74HC00 单输出可驱动约 10 个输入，实际布线请分叉并保持短线`)
      warningKeys.push({ key: 'hw.warn.maxFanOut', params: { n: maxFanOut } })
    }
    if ((netlist.nState || 0) > 0) {
      warnings.push('这是时序电路（含锁存器/状态位）：74HC00 只能搭组合逻辑，时钟与状态请用 74HC74/74HC573 并手工布线。')
      warningKeys.push({ key: 'hw.warn.stateful' })
    }
    if (gateCount > 40) {
      warnings.push(`共 ${gateCount} 个门（${chips} 片 74HC00）：面包板会非常拥挤，建议改用洞洞板/PCB。`)
      warningKeys.push({ key: 'hw.warn.crowded', params: { gates: gateCount, chips } })
    }
    if (outputs.length > 7) {
      warnings.push('输出超过 7 个：请为每路 LED 单独准备 330Ω 电阻。')
      warningKeys.push({ key: 'hw.warn.manyOutputs' })
    }

    const switches = inputs
    const leds = outputs.length
    const decoupling = chips
    const boards = Math.max(1, Math.ceil(chips / 2))
    const jumpers = Math.max(10, Math.ceil((wires.length + chips * 2) / 5) * 5)
    const bom = [
      { item: '74HC00 四路 2 输入与非门（DIP-14）', itemKey: 'hw.bom.74hc00', qty: chips, note: `${gateCount} 个门 ÷ 4`, noteKey: 'hw.bom.noteGates', noteParams: { n: gateCount } },
      { item: '0.1µF 陶瓷电容（去耦）', itemKey: 'hw.bom.cap', qty: decoupling, note: '每片芯片 VCC–GND 之间各一颗', noteKey: 'hw.bom.noteCap' },
      { item: '10kΩ 电阻（下拉）', itemKey: 'hw.bom.res10k', qty: switches, note: '每个拨码开关一颗', noteKey: 'hw.bom.noteSwitchRes' },
      { item: '拨码开关 / 轻触开关', itemKey: 'hw.bom.switches', qty: switches, note: '每个输入一位', noteKey: 'hw.bom.noteSwitch' },
      { item: '330Ω 电阻（LED 限流）', itemKey: 'hw.bom.res330', qty: leds, note: '每个输出 LED 一颗', noteKey: 'hw.bom.noteLedRes' },
      { item: 'LED（5mm）', itemKey: 'hw.bom.led', qty: leds, note: '每个输出一位', noteKey: 'hw.bom.noteLed' },
      { item: '面包板 830 点', itemKey: 'hw.bom.breadboard', qty: boards, note: '每 2 片芯片约一块板', noteKey: 'hw.bom.noteBreadboard' },
      { item: '杜邦线 / 单股跳线', itemKey: 'hw.bom.jumpers', qty: jumpers, note: '按连线表裁剪', noteKey: 'hw.bom.noteJumpers' },
      { item: '5V 电源（USB 或稳压模块）', itemKey: 'hw.bom.power', qty: 1, note: 'HC 系列 2–6V', noteKey: 'hw.bom.notePower' },
    ]

    return {
      ok: gateCount > 0,
      gates: gateCount,
      chips,
      inputs,
      outputs: leds,
      wires: wires.length,
      boards,
      maxFanOut,
      warnings,
      bom,
      pinTable,
      wireList: wires,
      stateful: (netlist.nState || 0) > 0,
    }
  }

  function bomCsv(plan) {
    const rows = ['item,qty,note']
    for (const entry of plan.bom) rows.push(`"${entry.item}",${entry.qty},"${entry.note}"`)
    return rows.join('\n') + '\n'
  }

  function wiresCsv(plan) {
    const rows = ['from,to,note']
    for (const entry of plan.wireList) rows.push(`"${entry.from}","${entry.to}","${entry.note}"`)
    return rows.join('\n') + '\n'
  }

  function markdown(plan, name, netlist) {
    const lines = []
    lines.push(`# 面包板搭建指南 · ${name || 'NAND 电路'}`)
    lines.push('')
    lines.push(`- 门数：${plan.gates}，74HC00：${plan.chips} 片，输入：${plan.inputs}，输出：${plan.outputs}`)
    lines.push(`- 连线：${plan.wires} 根，面包板：${plan.boards} 块，最大扇出：${plan.maxFanOut}`)
    lines.push('')
    lines.push('## 采购清单')
    lines.push('| 元件 | 数量 | 说明 |')
    lines.push('| --- | --- | --- |')
    for (const entry of plan.bom) lines.push(`| ${entry.item} | ${entry.qty} | ${entry.note} |`)
    lines.push('')
    lines.push('## 门与引脚分配')
    lines.push('| 门 | 芯片 | 单元 | A/B/Y 引脚 |')
    lines.push('| --- | --- | --- | --- |')
    for (const entry of plan.pinTable) lines.push(`| ${entry.gate} | U${entry.chip} | ${entry.unit} | ${entry.pins} |`)
    lines.push('')
    lines.push('## 连线表')
    lines.push('| 从 | 到 | 说明 |')
    lines.push('| --- | --- | --- |')
    for (const entry of plan.wireList) lines.push(`| ${entry.from} | ${entry.to} | ${entry.note} |`)
    lines.push('')
    if (plan.warnings.length) {
      lines.push('## 注意')
      for (const warning of plan.warnings) lines.push(`- ${warning}`)
      lines.push('')
    }
    lines.push('## 搭建顺序')
    lines.push('1. 先把每片 74HC00 跨在面包板中缝上，VCC（14）接 +5V 轨、GND（7）接地轨，每片并一颗 0.1µF。')
    lines.push('2. 按引脚表把每个门的 A/B 输入接到来源：拨码开关（经 10kΩ 下拉）或前级输出。')
    lines.push('3. 输出经 330Ω 接 LED 到 GND；上电前先用万用表确认电源没有短路。')
    lines.push('4. 按真值表逐行拨开关验证：LED 亮 = 1，灭 = 0。')
    lines.push('')
    if (netlist) lines.push(`网表 hex：${TT.Circuit.gateHex(netlist)}`)
    return lines.join('\n') + '\n'
  }

  return { plan, bomCsv, wiresCsv, markdown, UNITS, gatePins }
})()
