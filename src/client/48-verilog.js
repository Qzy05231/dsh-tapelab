/**
 * 48-verilog — a tiny gate-level Verilog importer.
 *
 * Supported subset:
 *   module m(input a, b, input [1:0] c, output y, output [1:0] z);
 *   wire t;
 *   assign t = a & b;
 *   assign y = ~t;
 *   assign z[0] = a ^ b;
 * Expressions: identifiers, bit selects name[0], constants 1'b0 / 1'b1,
 *   ~ & | ^ and parentheses. Everything is lowered to NAND gates.
 * Not supported: always/if/reg, arithmetic, multiple modules, parameters.
 */

TT.VerilogImport = (function () {
  function strip(text) {
    return String(text || '')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ')
  }

  function words(text) {
    return text.replace(/\s+/g, ' ').trim()
  }

  function parse(text) {
    const source = strip(text)
    const moduleMatch = source.match(/module\s+([A-Za-z_]\w*)\s*\(([\s\S]*?)\)\s*;/)
    if (!moduleMatch) throw new Error('没有找到 module 声明（只支持 gate-level Verilog）')
    const header = words(moduleMatch[2])
    const body = source.slice(moduleMatch.index + moduleMatch[0].length)
    const inputs = []
    const outputs = []
    const env = Object.create(null)
    let nextNode = 2

    function declareName(direction, width, rawName) {
      const clean = String(rawName).trim().replace(/\[[^\]]*\]/g, '')
      if (!/^[A-Za-z_]\w*$/.test(clean)) throw new Error(`端口名不合法：${rawName}`)
      if (direction === 'input') {
        const bits = []
        for (let bit = 0; bit < width; bit += 1) {
          bits.push(nextNode)
          nextNode += 1
          inputs.push({ name: width > 1 ? `${clean}[${bit}]` : clean, node: nextNode - 1 })
        }
        env[clean] = bits
        return
      }
      if (direction === 'output') {
        const bits = new Array(width).fill(null)
        env[clean] = bits
        outputs.push({ name: clean, width, bits })
        return
      }
      env[clean] = new Array(width).fill(null)
    }

    // Parse a declaration list, where a direction keyword applies until the next one:
    //   input a, b, input [1:0] c, output y
    function declareList(raw) {
      let direction = 'wire'
      let width = 1
      for (const part of splitTopLevel(raw)) {
        let text = part.trim()
        if (!text) continue
        const dirMatch = text.match(/^(input|output|wire)\b/)
        if (dirMatch) {
          direction = dirMatch[1]
          width = 1
          text = text.slice(dirMatch[0].length).trim()
          const range = text.match(/^\[\s*(\d+)\s*:\s*(\d+)\s*\]/)
          if (range) {
            width = Math.abs(Number(range[1]) - Number(range[2])) + 1
            text = text.slice(range[0].length).trim()
          }
        }
        if (!text) continue
        declareName(direction, width, text)
      }
    }

    declareList(header)

    const gates = []
    function emit(a, b) {
      gates.push({ a, b })
      return 2 + inputs.length + gates.length - 1
    }
    function notGate(node) {
      return emit(node, node)
    }
    function andGate(a, b) {
      return notGate(emit(a, b))
    }
    function orGate(a, b) {
      return emit(notGate(a), notGate(b))
    }
    function xorGate(a, b) {
      const n1 = emit(a, b)
      const n2 = emit(a, n1)
      const n3 = emit(b, n1)
      return emit(n2, n3)
    }
    function constNode(bit) {
      return Number(bit) ? 1 : 0
    }

    function lookup(token) {
      const select = token.match(/^([A-Za-z_]\w*)\s*\[\s*(\d+)\s*\]$/)
      if (select) {
        const bits = env[select[1]]
        if (!bits) throw new Error(`未声明的信号：${select[1]}`)
        const bit = Number(select[2])
        if (bit >= bits.length) throw new Error(`${select[1]} 的位下标越界：${bit}`)
        return bits[bit]
      }
      if (/^1'b[01]$/.test(token)) return constNode(token.slice(-1))
      if (/^0$/.test(token)) return 0
      if (/^1$/.test(token)) return 1
      const bits = env[token]
      if (!bits) throw new Error(`未声明的信号：${token}`)
      return bits.length === 1 ? bits[0] : bits
    }

    function resolveValue(node) {
      if (Array.isArray(node)) throw new Error('总线必须带位下标（例如 a[0]）')
      if (node === null || node === undefined) throw new Error('信号尚未赋值')
      return node
    }

    function parseExpr(expr) {
      let index = 0
      const text = String(expr).replace(/\s+/g, '')
      function peek() {
        return text[index]
      }
      function parseOr() {
        let left = parseXor()
        while (peek() === '|') {
          index += 1
          left = orGate(left, parseXor())
        }
        return left
      }
      function parseXor() {
        let left = parseAnd()
        while (peek() === '^') {
          index += 1
          left = xorGate(left, parseAnd())
        }
        return left
      }
      function parseAnd() {
        let left = parseUnary()
        while (peek() === '&') {
          index += 1
          left = andGate(left, parseUnary())
        }
        return left
      }
      function parseUnary() {
        if (peek() === '~') {
          index += 1
          return notGate(parseUnary())
        }
        return parsePrimary()
      }
      function parsePrimary() {
        if (peek() === '(') {
          index += 1
          const node = parseOr()
          if (peek() !== ')') throw new Error('括号不匹配')
          index += 1
          return node
        }
        const rest = text.slice(index)
        const select = rest.match(/^[A-Za-z_]\w*\[\d+\]/)
        if (select) {
          index += select[0].length
          return lookup(select[0])
        }
        const constant = rest.match(/^1'b[01]/)
        if (constant) {
          index += constant[0].length
          return constNode(constant[0].slice(-1))
        }
        const name = rest.match(/^[A-Za-z_]\w*/)
        if (name) {
          index += name[0].length
          return lookup(name[0])
        }
        throw new Error(`无法解析表达式：${expr}`)
      }
      const node = parseOr()
      if (index !== text.length) throw new Error(`表达式尾部无法解析：${text.slice(index)}`)
      return node
    }

    // statement scanner for the body: allow assign x = expr; and wire declarations
    const statements = body.split(';')
    for (const raw of statements) {
      const statement = words(raw)
      if (!statement) continue
      if (/^(input|output|wire)\b/.test(statement)) {
        declareList(statement)
        continue
      }
      const assign = statement.match(/^assign\s+([^=]+)=([\s\S]+)$/)
      if (!assign) {
        if (/^(always|initial|reg)\b/.test(statement)) throw new Error('只支持 assign 语句，不支持 always/initial/reg')
        if (/^module\b|^endmodule$/.test(statement)) continue
        throw new Error(`不支持的语句：${statement.slice(0, 40)}`)
      }
      const target = assign[1].trim()
      const expr = assign[2].trim()
      const value = parseExpr(expr)
      const node = resolveValue(value)
      const targetMatch = target.match(/^([A-Za-z_]\w*)\s*(?:\[\s*(\d+)\s*\])?$/)
      if (!targetMatch) throw new Error(`不支持的赋值目标：${target}`)
      const name = targetMatch[1]
      const bit = targetMatch[2] === undefined ? null : Number(targetMatch[2])
      const bus = env[name]
      if (!bus) throw new Error(`给未声明的信号赋值：${name}`)
      if (bit === null) {
        bus[0] = node
      } else {
        if (bit >= bus.length) throw new Error(`${name} 的位下标越界：${bit}`)
        bus[bit] = node
      }
    }

    const outputsFlat = []
    for (const out of outputs) {
      for (let bit = 0; bit < out.width; bit += 1) {
        const envBits = env[out.name]
        const node = envBits && envBits[bit] !== null && envBits[bit] !== undefined ? envBits[bit] : null
        if (node === null) throw new Error(`输出 ${out.name}${out.width > 1 ? '[' + bit + ']' : ''} 没有赋值`)
        outputsFlat.push(node)
      }
    }
    if (!inputs.length) throw new Error('至少需要一个 input')
    if (!outputsFlat.length) throw new Error('至少需要一个 output')
    const netlist = TT.Circuit.makeNetlist({
      nIn: inputs.length,
      nState: 0,
      gates,
      outputs: outputsFlat,
    })
    const check = TT.Circuit.validateNetlist(netlist)
    if (!check.ok) throw new Error(check.error)
    return {
      ok: true,
      name: moduleMatch[1],
      netlist,
      nIn: inputs.length,
      nOut: outputsFlat.length,
      inputs: inputs.map((item) => item.name),
      outputs: outputs.flatMap((out) => {
        const list = []
        for (let bit = 0; bit < out.width; bit += 1) list.push(out.width > 1 ? `${out.name}[${bit}]` : out.name)
        return list
      }),
      gates: gates.length,
    }
  }

  function splitTopLevel(text) {
    const parts = []
    let depth = 0
    let current = ''
    for (const char of text) {
      if (char === '(' || char === '[') depth += 1
      if (char === ')' || char === ']') depth -= 1
      if (char === ',' && depth === 0) {
        if (current.trim()) parts.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    if (current.trim()) parts.push(current.trim())
    return parts
  }

  return { parse }
})()
