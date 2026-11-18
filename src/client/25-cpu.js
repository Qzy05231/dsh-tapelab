/**
 * 25-cpu — a compact 4-bit SAP-1-style teaching computer.
 *
 * The TapeOut "Behemoth" is described as an Intel-4004-class 4-bit CPU; this module
 * is the honest miniature used by the 小计算机 chapter: 16-byte RAM, an accumulator,
 * a program counter, one general register, flags, and an 8-bit instruction word
 * (4-bit opcode + 4-bit operand). It is a register-transfer model, not a NAND netlist:
 * the chapter labels it that way and shows the NAND building blocks it would use.
 */

TT.CPU = (function () {
  const OPS = {
    HLT: 0,
    LDA: 1, // LDA imm   A = imm
    ADD: 2, // ADD imm   A = A + imm
    SUB: 3, // SUB imm   A = A - imm
    AND: 4,
    OR: 5,
    OUT: 6, // OUT       OUT = A
    JMP: 7, // JMP addr
    JZ: 8, // JZ addr
    STA: 9, // STA addr  RAM[addr] = A
    LDM: 10, // LDM addr  A = RAM[addr]
    INC: 11,
    DEC: 12,
  }
  const OP_NAMES = Object.keys(OPS).reduce((map, name) => {
    map[OPS[name]] = name
    return map
  }, {})

  function initial(ram) {
    const memory = new Array(16).fill(0)
    if (Array.isArray(ram)) {
      for (let i = 0; i < 16; i += 1) memory[i] = (Number(ram[i]) || 0) & 15
    }
    return {
      A: 0,
      B: 0,
      PC: 0,
      IR: 0,
      RAM: memory,
      OUT: 0,
      Z: true,
      C: false,
      halted: false,
      cycles: 0,
      trace: [],
    }
  }

  function loadProgram(state, bytes) {
    const memory = state.RAM.slice()
    for (let i = 0; i < 16; i += 1) memory[i] = 0
    for (let i = 0; i < Math.min(16, bytes.length); i += 1) memory[i] = bytes[i] & 255
    return {
      ...state,
      A: 0,
      B: 0,
      PC: 0,
      IR: 0,
      RAM: memory,
      OUT: 0,
      Z: true,
      C: false,
      halted: false,
      cycles: 0,
      trace: [],
    }
  }

  function step(state) {
    if (state.halted) return state
    const memory = state.RAM.slice()
    const pc = state.PC & 15
    const ir = memory[pc] & 255
    const op = ir >> 4
    const arg = ir & 15
    let A = state.A & 15
    let B = state.B & 15
    let OUT = state.OUT & 15
    let C = false
    let Z = A === 0
    let nextPC = (pc + 1) & 15
    let halted = false
    switch (op) {
      case OPS.HLT:
        halted = true
        break
      case OPS.LDA:
        A = arg
        break
      case OPS.ADD: {
        const sum = A + arg
        C = sum > 15
        A = sum & 15
        break
      }
      case OPS.SUB: {
        const diff = A - arg
        C = A < arg
        A = diff & 15
        break
      }
      case OPS.AND:
        A = A & arg
        break
      case OPS.OR:
        A = A | arg
        break
      case OPS.OUT:
        OUT = A
        break
      case OPS.JMP:
        nextPC = arg
        break
      case OPS.JZ:
        if (A === 0) nextPC = arg
        break
      case OPS.STA:
        memory[arg] = A
        break
      case OPS.LDM:
        A = memory[arg] & 15
        break
      case OPS.INC: {
        const sum = A + 1
        C = sum > 15
        A = sum & 15
        break
      }
      case OPS.DEC:
        C = A === 0
        A = (A - 1) & 15
        break
      default:
        halted = true
        break
    }
    Z = A === 0
    const next = {
      ...state,
      A,
      B,
      OUT,
      IR: ir,
      PC: halted ? pc : nextPC,
      RAM: memory,
      Z,
      C,
      halted,
      cycles: state.cycles + 1,
      trace: [
        ...state.trace,
        { cycle: state.cycles + 1, pc, ir, op, name: OP_NAMES[op] || '?', arg, a: A, out: OUT, halted },
      ].slice(-64),
    }
    return next
  }

  function runUntilHalt(state, maxCycles) {
    const limit = maxCycles || 256
    let current = state
    let guard = 0
    while (!current.halted && guard < limit) {
      current = step(current)
      guard += 1
    }
    return current
  }

  function assemble(source) {
    const lines = String(source || '')
      .split('\n')
      .map((line) => line.replace(/[;#].*$/, '').trim())
      .filter(Boolean)
    const bytes = []
    for (const line of lines) {
      const parts = line.split(/[\s,]+/)
      const name = parts[0].toUpperCase()
      if (OPS[name] === undefined) throw new Error(`assemble: unknown opcode ${parts[0]}`)
      const arg = parts.length > 1 ? Number(parts[1]) : 0
      if (!Number.isInteger(arg) || arg < 0 || arg > 15) throw new Error(`assemble: bad operand ${parts[1]}`)
      bytes.push(((OPS[name] << 4) | (arg & 15)) & 255)
    }
    return bytes
  }

  function disassemble(bytes) {
    return bytes.map((byte) => {
      const op = (byte >> 4) & 15
      const arg = byte & 15
      const name = OP_NAMES[op]
      if (!name) return `.byte ${byte}`
      if (name === 'HLT' || name === 'OUT' || name === 'INC' || name === 'DEC') return name
      return `${name} ${arg}`
    })
  }

  const PROGRAMS = [
    {
      id: 'add35',
      nameKey: 'cpu.prog.add35',
      source: 'LDA 3\nADD 5\nOUT\nHLT',
      expected: 8,
    },
    {
      id: 'sum15',
      nameKey: 'cpu.prog.sum15',
      source: 'LDA 0\nADD 1\nADD 2\nADD 3\nADD 4\nADD 5\nOUT\nHLT',
      expected: 15,
    },
    {
      id: 'mul12',
      nameKey: 'cpu.prog.mul12',
      source: 'LDA 3\nADD 3\nADD 3\nADD 3\nOUT\nHLT',
      expected: 12,
    },
  ].map((program) => ({ ...program, bytes: assemble(program.source) }))

  return {
    OPS,
    OP_NAMES,
    initial,
    loadProgram,
    step,
    runUntilHalt,
    assemble,
    disassemble,
    programs: PROGRAMS,
  }
})()
