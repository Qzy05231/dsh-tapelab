/**
 * 28-safety — the real TapeRover 16-input / 80-NAND safety gate, embedded as data.
 *
 * Source: sites/taperover/traffic-policy.mjs (buildTrafficCircuit, v14 policy) from the
 * user's own TapeRover project. The netlist below is that compiled circuit: 16 boolean
 * inputs (12 policy inputs + L/S/M/Y traffic inputs), 4 mutually exclusive outputs
 * (ALLOW_MOVE / SLOW_MODE / RETURN_HOME / STOP), 80 NAND gates, max depth 32.
 *
 * It is embedded verbatim so the game can show the real product logic, not a mock.
 */

TT.Safety = (function () {
  const GATES = [[4,4],[8,8],[9,9],[3,18],[21,21],[22,5],[23,23],[24,6],[25,25],[26,19],[27,27],[28,20],[29,29],[30,11],[31,31],[12,12],[10,10],[32,2],[35,35],[36,7],[37,37],[38,33],[39,39],[40,34],[41,41],[40,10],[43,43],[7,7],[36,45],[46,46],[47,12],[48,48],[49,13],[50,50],[42,42],[44,44],[52,53],[54,54],[51,51],[55,56],[57,57],[58,58],[52,52],[53,53],[56,56],[59,59],[16,16],[17,17],[64,64],[65,65],[66,67],[14,14],[68,68],[69,70],[71,71],[60,72],[73,73],[15,15],[74,75],[76,76],[60,15],[78,78],[61,61],[79,79],[80,81],[82,72],[83,83],[62,72],[85,85],[63,63],[71,71],[87,88],[77,77],[84,84],[86,86],[89,89],[90,90],[91,91],[92,92],[93,93]]
  const OUTPUTS = [94, 95, 96, 97]
  const INPUTS = 16
  const LABELS = ["动作请求", "任务授权", "检测到障碍", "区域合规", "人员距离安全", "配送模式可用", "临界电量", "急停锁定", "人员预警", "输入有效", "返航动作", "返航路径有效", "信号禁止通行", "交通预警降速", "车道动作合法", "冲突区已让清"]
  const KEYS = ["R", "A", "O", "G", "H", "B", "C", "E", "W", "V", "P", "T", "L", "S", "M", "Y"]
  const OUTPUT_LABELS = ["ALLOW_MOVE", "SLOW_MODE", "RETURN_HOME", "STOP"]
  const OUTPUT_MODES = ["allow", "slow", "home", "stop"]
  const MODE_COUNTS = [2, 6, 4, 65524]
  const PRESETS = {"allow": 49723, "slow": 49979, "home": 52763, "stop": 0}

  const NODES = 2 + INPUTS + GATES.length

  function netlist() {
    return TT.Circuit.makeNetlist({
      nIn: INPUTS,
      gates: GATES.map((pair) => ({ a: pair[0], b: pair[1] })),
      outputs: OUTPUTS.slice(),
    })
  }

  function evaluate(bits) {
    const signals = new Array(NODES)
    signals[0] = 0
    signals[1] = 1
    for (let i = 0; i < INPUTS; i += 1) signals[2 + i] = (bits >> i) & 1
    for (let i = 0; i < GATES.length; i += 1) {
      const gate = GATES[i]
      signals[2 + INPUTS + i] = 1 - (signals[gate[0]] & signals[gate[1]])
    }
    const outputs = OUTPUTS.map((id) => signals[id])
    const onehot = outputs.reduce((sum, value) => sum + value, 0)
    return { outputs, modes: outputs.map((value) => value === 1), onehot, mode: outputs.indexOf(1), signals }
  }

  /** Exhaustive 2^16 audit: exactly one output must be high for every input combination. */
  function audit(bitsSource) {
    const counts = [0, 0, 0, 0]
    let violations = 0
    let firstViolation = -1
    for (let bits = 0; bits < 65536; bits += 1) {
      const result = evaluate(bits)
      if (result.onehot !== 1) {
        violations += 1
        if (firstViolation < 0) firstViolation = bits
      } else {
        counts[result.mode] += 1
      }
      if (bitsSource && typeof bitsSource === 'function') bitsSource(bits, result)
    }
    return { count: 65536, violations, firstViolation, counts }
  }

  return {
    INPUTS,
    LABELS,
    KEYS,
    OUTPUTS,
    OUTPUT_LABELS,
    OUTPUT_MODES,
    MODE_COUNTS,
    PRESETS,
    GATES,
    netlist,
    evaluate,
    audit,
    gateCount: GATES.length,
  }
})()
