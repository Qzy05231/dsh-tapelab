/**
 * 20-circuit - TT.Circuit: the NAND/LATCH netlist model (SPEC section 6).
 *
 * Pure data + arithmetic, no DOM, no imports. Concatenated inside the shared factory
 * closure after 00-core.js; assigns TT.Circuit and never redeclares TT.
 *
 * Protocol canon this mirrors:
 *   node 0 = constant 0, node 1 = constant 1,
 *   nodes 2 .. 2+nIn-1            = circuit inputs  (bit i of inputBits = input i),
 *   nodes 2+nIn .. 2+nIn+nState-1 = LATCH state    (bit k of stateBits = latch k),
 *   gate i output = 2+nIn+nState+i; gates evaluate in array order,
 *   gate record {a,b} = NAND: out = 1 - (signal[a] & signal[b]),
 *   7-byte codec: 0x00 | A>>16, A>>8, A&255 | B>>16, B>>8, B&255 (big-endian ids).
 *
 * Bit conventions: all bit masks are LSB-first. outputBits bit i = outputs[i].
 *
 * API:
 *   makeNetlist({nIn, gates, outputs, nState=0, firstLatchInput=null}) -> frozen netlist
 *   nodeIds(netlist) -> {c0,c1,inputs,latches,gateStart,gateIds,nodeCount,firstLatchInput}
 *   evaluate(netlist, inputBits, {stateBits=0}) -> {signals, outputs, outputBits}
 *   step(netlist, inputBits, stateBits) -> {stateBits (next), outputBits, outputs,
 *        nextOutputBits, nextOutputs, signals}   one clock beat: read old state,
 *        settle every gate, then commit latches together (latch k captures node
 *        firstLatchInput+k). Combinational netlists simply re-evaluate.
 *   gateBytes(netlist) -> Uint8Array; gateHex(netlist) -> '0x...' lowercase
 *   gateCount(netlist); maxDepth(netlist)   (gate levels, 0 when no gates)
 *   validateNetlist(netlist) -> {ok, error?}   non-throwing probe
 *   truthTable(netlist) -> [{inputBits, outputs, outputBits}]  2^nIn rows (nIn <= 16)
 *   exhaustiveVerify(netlist, expectedFn) -> {valid, passed, count, rows, mismatches,
 *        mismatchCount, gateCount, maxDepth, nIn, nOut, error?}
 *        rows only when count <= 512; mismatches capped at 8, mismatchCount is full.
 *   equivalent(a, b) -> bool   same nIn/nOut/nState and same output bits for every
 *        input/state combination (up to 2^20 combinations)
 *   compose({nIn, parts, outputs?}) -> netlist
 *        parts = [{netlist, inputNodes, outputNodes}]; inputNodes are outer keys that
 *        drive the part inputs (0, 1, an outer input node 2..2+nIn-1, or a key produced
 *        by an earlier part output); outputNodes are the outer keys each part output
 *        produces. Composed outputs = produced keys that nothing consumes, in
 *        part/output order, unless `outputs` (outer keys) is given. Combinational
 *        parts only; nodes are renumbered densely by splice order.
 *   reference = {nand, not, and, or, xor}   truth-table helpers
 *   canonical = {halfAdder(), fullAdder(), fourBitAdder(), srLatch()}
 *
 * makeNetlist only checks structure and freezes; deliberate forward refs stay
 * constructible so validateNetlist can describe them. evaluate/step/gateBytes/gateHex/
 * truthTable/equivalent throw on an invalid netlist; exhaustiveVerify returns
 * {valid:false, error} instead. Output bitmasks support at most 31 outputs.
 */

;(function () {
  'use strict'

  if (!TT || typeof TT !== 'object') {
    throw new Error('TT.Circuit requires the shared TT namespace from 00-core.js')
  }

  // ---- protocol constants -------------------------------------------------
  var CONST0 = 0
  var CONST1 = 1
  var INPUT_BASE = 2
  var GATE_BYTES = 7
  var OPCODE_NAND = 0x00
  var MAX_NODE_ID = 0xffffff // node ids are 3-byte big-endian on chain
  var MAX_EXHAUSTIVE_INPUTS = 16 // 2^16 = 65536 rows
  var MAX_OUTPUT_BITS = 31 // outputBits is a JS 32-bit int mask
  var MAX_SCAN = 1 << 20 // equivalent(): combinations budget
  var DISPLAYED_MISMATCHES = 8
  var TABLE_ROW_LIMIT = 512
  var HEX = '0123456789abcdef'

  // ---- small helpers ------------------------------------------------------
  function isInt(value) {
    return typeof value === 'number' && Number.isInteger(value)
  }

  function fail(message) {
    return { ok: false, error: message }
  }

  function nodeCountOf(netlist) {
    return 2 + netlist.nIn + netlist.nState + netlist.gates.length
  }

  function outputMask(nOut) {
    return nOut >= MAX_OUTPUT_BITS ? 0x7fffffff : (1 << nOut) - 1
  }

  /** Sequential gate allocator for the canonical builders. */
  function gateBuilder(nIn, nState) {
    var gates = []
    var base = 2 + nIn + nState
    return {
      gates: gates,
      push: function (a, b) {
        var id = base + gates.length
        gates.push({ a: a, b: b })
        return id
      },
    }
  }

  // ---- netlist construction ----------------------------------------------
  function makeNetlist(spec) {
    if (!spec || typeof spec !== 'object') {
      throw new TypeError('makeNetlist: spec object required')
    }
    var nIn = spec.nIn === undefined ? 0 : spec.nIn
    var nState = spec.nState === undefined ? 0 : spec.nState
    var gates = spec.gates === undefined ? [] : spec.gates
    var outputs = spec.outputs === undefined ? [] : spec.outputs
    if (!isInt(nIn) || nIn < 0) throw new TypeError('makeNetlist: nIn must be a non-negative integer')
    if (!isInt(nState) || nState < 0) {
      throw new TypeError('makeNetlist: nState must be a non-negative integer')
    }
    if (!Array.isArray(gates)) throw new TypeError('makeNetlist: gates must be an array')
    if (!Array.isArray(outputs)) throw new TypeError('makeNetlist: outputs must be an array')

    var gateCopies = []
    for (var i = 0; i < gates.length; i += 1) {
      var gate = gates[i]
      if (!gate || typeof gate !== 'object' || !isInt(gate.a) || !isInt(gate.b)) {
        throw new TypeError('makeNetlist: gate ' + i + ' must be {a, b} integer node ids')
      }
      gateCopies.push(Object.freeze({ a: gate.a, b: gate.b }))
    }

    var firstLatchInput = spec.firstLatchInput
    if (nState === 0) {
      firstLatchInput = null
    } else if (firstLatchInput === undefined || firstLatchInput === null) {
      // Protocol-friendly default: the last nState gate outputs are the latch inputs.
      firstLatchInput = 2 + nIn + gateCopies.length
    } else if (!isInt(firstLatchInput) || firstLatchInput < 0) {
      throw new TypeError('makeNetlist: firstLatchInput must be a non-negative integer')
    }

    return Object.freeze({
      nIn: nIn,
      nOut: outputs.length,
      nState: nState,
      gates: Object.freeze(gateCopies),
      outputs: Object.freeze(outputs.slice()),
      firstLatchInput: firstLatchInput,
    })
  }

  function nodeIds(netlist) {
    var inputs = []
    var latches = []
    var gateIds = []
    var i
    for (i = 0; i < netlist.nIn; i += 1) inputs.push(INPUT_BASE + i)
    for (i = 0; i < netlist.nState; i += 1) latches.push(INPUT_BASE + netlist.nIn + i)
    var gateStart = 2 + netlist.nIn + netlist.nState
    for (i = 0; i < netlist.gates.length; i += 1) gateIds.push(gateStart + i)
    return {
      c0: CONST0,
      c1: CONST1,
      inputs: inputs,
      latches: latches,
      gateStart: gateStart,
      gateIds: gateIds,
      nodeCount: gateStart + netlist.gates.length,
      firstLatchInput: netlist.firstLatchInput,
    }
  }

  // ---- validation ---------------------------------------------------------
  function validateNetlist(netlist) {
    if (!netlist || typeof netlist !== 'object') return fail('netlist must be an object')
    var nIn = netlist.nIn
    var nState = netlist.nState
    var gates = netlist.gates
    var outputs = netlist.outputs
    if (!isInt(nIn) || nIn < 0) return fail('nIn must be a non-negative integer')
    if (!isInt(nState) || nState < 0) return fail('nState must be a non-negative integer')
    if (!Array.isArray(gates)) return fail('gates must be an array')
    if (!Array.isArray(outputs)) return fail('outputs must be an array')
    if (netlist.nOut !== outputs.length) {
      return fail('nOut (' + netlist.nOut + ') must equal outputs.length (' + outputs.length + ')')
    }
    if (outputs.length === 0) return fail('netlist must declare at least one output')

    var total = 2 + nIn + nState + gates.length
    if (total > MAX_NODE_ID + 1) {
      return fail('netlist has ' + total + ' nodes; 3-byte protocol ids allow at most ' + (MAX_NODE_ID + 1))
    }
    var gateStart = 2 + nIn + nState
    var i
    var j
    for (i = 0; i < gates.length; i += 1) {
      var gate = gates[i]
      if (!gate || typeof gate !== 'object' || !isInt(gate.a) || !isInt(gate.b)) {
        return fail('gate ' + i + ' must be {a, b} integer node ids')
      }
      var limit = gateStart + i - 1 // highest node that already has a value
      var names = ['a', 'b']
      for (j = 0; j < 2; j += 1) {
        var id = j === 0 ? gate.a : gate.b
        if (id < 0) return fail('gate ' + i + ' input ' + names[j] + ' is a negative node id')
        if (id >= total) {
          return fail('gate ' + i + ' input ' + names[j] + ' node ' + id + ' is out of range (max ' + (total - 1) + ')')
        }
        if (id > limit) {
          return fail(
            'gate ' + i + ' input ' + names[j] + ' is a forward reference to node ' + id + ' (must be <= ' + limit + ')',
          )
        }
      }
    }
    for (j = 0; j < outputs.length; j += 1) {
      var out = outputs[j]
      if (!isInt(out)) return fail('output ' + j + ' must be an integer node id')
      if (out < 0 || out >= total) {
        return fail('output ' + j + ' node ' + out + ' is out of range (max ' + (total - 1) + ')')
      }
    }
    if (nState > 0) {
      var first = netlist.firstLatchInput
      if (first === undefined || first === null) return fail('nState > 0 requires firstLatchInput')
      if (!isInt(first) || first < 0) return fail('firstLatchInput must be a non-negative integer')
      if (first + nState - 1 >= total) {
        return fail('firstLatchInput ' + first + ' does not leave room for ' + nState + ' latch input nodes')
      }
    }
    return { ok: true }
  }

  // ---- evaluation ---------------------------------------------------------
  /** Fill `signals` (Uint8Array) for one input/state combination. Assumes valid netlist. */
  function evalInto(netlist, signals, inputBits, stateBits) {
    signals[0] = 0
    signals[1] = 1
    var nIn = netlist.nIn
    var nState = netlist.nState
    var i
    for (i = 0; i < nIn; i += 1) signals[INPUT_BASE + i] = (inputBits >>> i) & 1
    for (i = 0; i < nState; i += 1) signals[INPUT_BASE + nIn + i] = (stateBits >>> i) & 1
    var gateStart = 2 + nIn + nState
    var gates = netlist.gates
    for (i = 0; i < gates.length; i += 1) {
      var gate = gates[i]
      signals[gateStart + i] = 1 - (signals[gate.a] & signals[gate.b])
    }
  }

  function readOutputs(signals, outputs) {
    var values = new Array(outputs.length)
    var bits = 0
    for (var i = 0; i < outputs.length; i += 1) {
      var value = signals[outputs[i]]
      values[i] = value
      bits |= value << i
    }
    return { outputs: values, outputBits: bits }
  }

  function requireValid(netlist, who) {
    var check = validateNetlist(netlist)
    if (!check.ok) throw new Error(who + ': invalid netlist: ' + check.error)
    return check
  }

  function evaluate(netlist, inputBits, opts) {
    requireValid(netlist, 'evaluate')
    if (!isInt(inputBits) || inputBits < 0) {
      throw new TypeError('evaluate: inputBits must be a non-negative integer')
    }
    var stateBits = opts && opts.stateBits !== undefined && opts.stateBits !== null ? opts.stateBits : 0
    if (!isInt(stateBits) || stateBits < 0) {
      throw new TypeError('evaluate: stateBits must be a non-negative integer')
    }
    if (netlist.nOut > MAX_OUTPUT_BITS) {
      throw new RangeError('evaluate: at most ' + MAX_OUTPUT_BITS + ' outputs fit in outputBits')
    }
    var signals = new Uint8Array(nodeCountOf(netlist))
    evalInto(netlist, signals, inputBits, stateBits)
    var read = readOutputs(signals, netlist.outputs)
    return {
      signals: Array.prototype.slice.call(signals),
      outputs: read.outputs,
      outputBits: read.outputBits,
    }
  }

  function step(netlist, inputBits, stateBits) {
    requireValid(netlist, 'step')
    if (!isInt(inputBits) || inputBits < 0) {
      throw new TypeError('step: inputBits must be a non-negative integer')
    }
    if (netlist.nOut > MAX_OUTPUT_BITS) {
      throw new RangeError('step: at most ' + MAX_OUTPUT_BITS + ' outputs fit in outputBits')
    }
    if (stateBits === undefined || stateBits === null) stateBits = 0
    if (!isInt(stateBits) || stateBits < 0) {
      throw new TypeError('step: stateBits must be a non-negative integer')
    }
    var total = nodeCountOf(netlist)
    var signals = new Uint8Array(total)
    evalInto(netlist, signals, inputBits, stateBits)
    var current = readOutputs(signals, netlist.outputs)
    var nextState = 0
    if (netlist.nState > 0) {
      var first = netlist.firstLatchInput
      for (var k = 0; k < netlist.nState; k += 1) {
        if (signals[first + k]) nextState |= 1 << k
      }
    }
    // Convenience: outputs as they will read after the latches commit.
    var after = new Uint8Array(total)
    evalInto(netlist, after, inputBits, nextState)
    var next = readOutputs(after, netlist.outputs)
    return {
      stateBits: nextState,
      outputBits: current.outputBits,
      outputs: current.outputs,
      nextOutputBits: next.outputBits,
      nextOutputs: next.outputs,
      signals: Array.prototype.slice.call(signals),
    }
  }

  // ---- bytecode -----------------------------------------------------------
  function gateBytes(netlist) {
    requireValid(netlist, 'gateBytes')
    var gates = netlist.gates
    var bytes = new Uint8Array(gates.length * GATE_BYTES)
    for (var i = 0; i < gates.length; i += 1) {
      var gate = gates[i]
      var o = i * GATE_BYTES
      bytes[o] = OPCODE_NAND
      bytes[o + 1] = (gate.a >>> 16) & 0xff
      bytes[o + 2] = (gate.a >>> 8) & 0xff
      bytes[o + 3] = gate.a & 0xff
      bytes[o + 4] = (gate.b >>> 16) & 0xff
      bytes[o + 5] = (gate.b >>> 8) & 0xff
      bytes[o + 6] = gate.b & 0xff
    }
    return bytes
  }

  function gateHex(netlist) {
    var bytes = gateBytes(netlist)
    var text = '0x'
    for (var i = 0; i < bytes.length; i += 1) {
      text += HEX[bytes[i] >>> 4] + HEX[bytes[i] & 0x0f]
    }
    return text
  }

  function gateCount(netlist) {
    return netlist && Array.isArray(netlist.gates) ? netlist.gates.length : 0
  }

  function maxDepth(netlist) {
    if (!netlist || !Array.isArray(netlist.gates)) return 0
    var nIn = netlist.nIn | 0
    var nState = netlist.nState | 0
    var gates = netlist.gates
    var depth = new Uint32Array(2 + nIn + nState + gates.length)
    var gateStart = 2 + nIn + nState
    var deepest = 0
    for (var i = 0; i < gates.length; i += 1) {
      var gate = gates[i]
      var d = 1 + Math.max(depth[gate.a] || 0, depth[gate.b] || 0)
      depth[gateStart + i] = d
      if (d > deepest) deepest = d
    }
    return deepest
  }

  // ---- truth tables and verification -------------------------------------
  function truthTable(netlist) {
    requireValid(netlist, 'truthTable')
    var nIn = netlist.nIn
    if (nIn > MAX_EXHAUSTIVE_INPUTS) {
      throw new RangeError('truthTable: at most ' + MAX_EXHAUSTIVE_INPUTS + ' inputs supported (65536 rows)')
    }
    if (netlist.nOut > MAX_OUTPUT_BITS) {
      throw new RangeError('truthTable: at most ' + MAX_OUTPUT_BITS + ' outputs supported')
    }
    var count = Math.pow(2, nIn)
    var rows = new Array(count)
    var signals = new Uint8Array(nodeCountOf(netlist))
    for (var inputBits = 0; inputBits < count; inputBits += 1) {
      evalInto(netlist, signals, inputBits, 0)
      var read = readOutputs(signals, netlist.outputs)
      rows[inputBits] = { inputBits: inputBits, outputs: read.outputs, outputBits: read.outputBits }
    }
    return rows
  }

  function exhaustiveVerify(netlist, expectedFn) {
    var check = validateNetlist(netlist)
    if (!check.ok) {
      return {
        valid: false,
        passed: false,
        error: check.error,
        count: 0,
        rows: [],
        mismatches: [],
        mismatchCount: 0,
        gateCount: gateCount(netlist),
        maxDepth: 0,
        nIn: netlist && netlist.nIn,
        nOut: netlist && netlist.nOut,
      }
    }
    if (typeof expectedFn !== 'function') {
      throw new TypeError('exhaustiveVerify: expectedFn must be a function')
    }
    var nIn = netlist.nIn
    var nOut = netlist.nOut
    if (nIn > MAX_EXHAUSTIVE_INPUTS) {
      throw new RangeError(
        'exhaustiveVerify: at most ' + MAX_EXHAUSTIVE_INPUTS + ' inputs supported (65536 rows)',
      )
    }
    if (nOut > MAX_OUTPUT_BITS) {
      throw new RangeError('exhaustiveVerify: at most ' + MAX_OUTPUT_BITS + ' outputs supported')
    }
    var count = Math.pow(2, nIn)
    var mask = outputMask(nOut)
    var signals = new Uint8Array(nodeCountOf(netlist))
    var gates = netlist.gates
    var gateStart = 2 + nIn + netlist.nState
    var outputs = netlist.outputs
    var wantRows = count <= TABLE_ROW_LIMIT
    var rows = wantRows ? new Array(count) : []
    var mismatches = []
    var mismatchCount = 0
    for (var inputBits = 0; inputBits < count; inputBits += 1) {
      evalInto(netlist, signals, inputBits, 0)
      var actualBits = 0
      for (var o = 0; o < outputs.length; o += 1) actualBits |= signals[outputs[o]] << o
      var expectedRaw = expectedFn(inputBits)
      if (!isInt(expectedRaw) || expectedRaw < 0) {
        throw new TypeError('exhaustiveVerify: expectedFn must return a non-negative integer')
      }
      var expectedBits = expectedRaw & mask
      var ok = (actualBits & mask) === expectedBits
      if (!ok) {
        mismatchCount += 1
        if (mismatches.length < DISPLAYED_MISMATCHES) {
          mismatches.push({
            inputBits: inputBits,
            actualBits: actualBits & mask,
            expectedBits: expectedBits,
            ok: false,
          })
        }
      }
      if (wantRows) {
        rows[inputBits] = {
          inputBits: inputBits,
          actualBits: actualBits & mask,
          expectedBits: expectedBits,
          ok: ok,
        }
      }
    }
    return {
      valid: true,
      passed: mismatchCount === 0,
      count: count,
      rows: rows,
      mismatches: mismatches,
      mismatchCount: mismatchCount,
      gateCount: gates.length,
      maxDepth: maxDepth(netlist),
      nIn: nIn,
      nOut: nOut,
    }
  }

  function equivalent(a, b) {
    requireValid(a, 'equivalent (first netlist)')
    requireValid(b, 'equivalent (second netlist)')
    if (a.nIn !== b.nIn || a.nOut !== b.nOut || a.nState !== b.nState) return false
    if (a.nOut > MAX_OUTPUT_BITS) {
      throw new RangeError('equivalent: at most ' + MAX_OUTPUT_BITS + ' outputs supported')
    }
    var inputCount = Math.pow(2, a.nIn)
    var stateCount = Math.pow(2, a.nState)
    if (inputCount * stateCount > MAX_SCAN) {
      throw new RangeError(
        'equivalent: ' + inputCount * stateCount + ' combinations exceed the ' + MAX_SCAN + ' limit',
      )
    }
    var sigA = new Uint8Array(nodeCountOf(a))
    var sigB = new Uint8Array(nodeCountOf(b))
    for (var stateBits = 0; stateBits < stateCount; stateBits += 1) {
      for (var inputBits = 0; inputBits < inputCount; inputBits += 1) {
        evalInto(a, sigA, inputBits, stateBits)
        evalInto(b, sigB, inputBits, stateBits)
        var bitsA = 0
        var bitsB = 0
        for (var o = 0; o < a.nOut; o += 1) {
          bitsA |= sigA[a.outputs[o]] << o
          bitsB |= sigB[b.outputs[o]] << o
        }
        if (bitsA !== bitsB) return false
      }
    }
    return true
  }

  // ---- composition --------------------------------------------------------
  /**
   * Splice combinational part netlists into one flat, densely numbered netlist.
   * Caller supplies "outer keys": arbitrary non-negative integers used as wires.
   * Keys 0/1 and 2..2+nIn-1 are the outer constants and primary inputs; any other
   * key is produced by exactly one part output and must be consumed after it exists.
   */
  function compose(opts) {
    if (!opts || typeof opts !== 'object') throw new TypeError('compose: options object required')
    var nIn = opts.nIn
    var parts = opts.parts === undefined ? [] : opts.parts
    if (!isInt(nIn) || nIn < 0) throw new TypeError('compose: nIn must be a non-negative integer')
    if (!Array.isArray(parts)) throw new TypeError('compose: parts must be an array')
    var explicitOutputs = opts.outputs

    var gates = []
    var outerGateStart = 2 + nIn
    var produced = Object.create(null) // outer key -> composed node id
    var consumed = Object.create(null) // outer key -> true once a part input reads it
    var candidates = []
    var p
    var i

    function isOuterInput(key) {
      return key >= INPUT_BASE && key < INPUT_BASE + nIn
    }

    function describeKey(key) {
      if (key === CONST0 || key === CONST1) return 'constant ' + key
      if (isOuterInput(key)) return 'outer input node ' + key
      return 'outer node ' + key
    }

    function resolveKey(key) {
      if (!isInt(key) || key < 0) {
        throw new Error('compose: outer node keys must be non-negative integers')
      }
      if (key === CONST0 || key === CONST1) return key
      if (isOuterInput(key)) return key
      if (produced[key] !== undefined) return produced[key]
      return -1
    }

    for (p = 0; p < parts.length; p += 1) {
      var part = parts[p]
      if (!part || typeof part !== 'object') throw new TypeError('compose: part ' + p + ' must be an object')
      var net = part.netlist
      var check = validateNetlist(net)
      if (!check.ok) throw new Error('compose: part ' + p + ' netlist is invalid: ' + check.error)
      if (net.nState > 0) {
        throw new Error(
          'compose: part ' + p + ' is stateful (nState=' + net.nState + '); only combinational parts can be composed',
        )
      }
      var inputNodes = part.inputNodes
      if (!Array.isArray(inputNodes) || inputNodes.length !== net.nIn) {
        throw new Error('compose: part ' + p + ' needs inputNodes with ' + net.nIn + ' entries')
      }
      var outputNodes = part.outputNodes
      if (outputNodes !== undefined && (!Array.isArray(outputNodes) || outputNodes.length !== net.nOut)) {
        throw new Error('compose: part ' + p + ' needs outputNodes with ' + net.nOut + ' entries')
      }

      // Resolve this part's inputs against constants, outer inputs and earlier outputs.
      var resolvedInputs = new Array(net.nIn)
      for (i = 0; i < net.nIn; i += 1) {
        var inputKey = inputNodes[i]
        var inputId = resolveKey(inputKey)
        if (inputId < 0) {
          throw new Error(
            'compose: part ' + p + ' input ' + i + ' references unknown outer node ' + inputKey +
              ' (expected 0/1, an outer input node, or an earlier part output key)',
          )
        }
        resolvedInputs[i] = inputId
        if (produced[inputKey] !== undefined) consumed[inputKey] = true
      }

      var partGateStart = 2 + net.nIn
      var base = outerGateStart + gates.length
      var localGates = net.gates
      var partNIn = net.nIn
      function remapNode(node) {
        if (node === CONST0 || node === CONST1) return node
        if (node >= 2 && node < 2 + partNIn) return resolvedInputs[node - 2]
        if (node >= partGateStart && node < partGateStart + localGates.length) {
          return base + (node - partGateStart)
        }
        throw new Error('compose: part ' + p + ' references invalid node ' + node)
      }
      for (i = 0; i < localGates.length; i += 1) {
        var localGate = localGates[i]
        gates.push({ a: remapNode(localGate.a), b: remapNode(localGate.b) })
      }

      // Map part outputs to outer keys (or straight to dangling composed nodes).
      var partOutputs = new Array(net.nOut)
      for (i = 0; i < net.nOut; i += 1) partOutputs[i] = remapNode(net.outputs[i])
      for (i = 0; i < net.nOut; i += 1) {
        if (outputNodes === undefined) {
          candidates.push({ key: null, id: partOutputs[i] })
          continue
        }
        var outputKey = outputNodes[i]
        if (!isInt(outputKey) || outputKey < 0) {
          throw new Error('compose: part ' + p + ' output ' + i + ' key must be a non-negative integer')
        }
        if (outputKey === CONST0 || outputKey === CONST1) {
          throw new Error('compose: part ' + p + ' output ' + i + ' cannot drive constant node ' + outputKey)
        }
        if (isOuterInput(outputKey)) {
          throw new Error(
            'compose: part ' + p + ' output ' + i + ' cannot overwrite outer input node ' + outputKey,
          )
        }
        if (produced[outputKey] !== undefined) {
          throw new Error('compose: outer node ' + outputKey + ' is produced by more than one part output')
        }
        produced[outputKey] = partOutputs[i]
        candidates.push({ key: outputKey, id: partOutputs[i] })
      }
    }

    var composedOutputs
    if (explicitOutputs !== undefined) {
      if (!Array.isArray(explicitOutputs)) throw new TypeError('compose: outputs must be an array')
      if (explicitOutputs.length === 0) throw new Error('compose: outputs must not be empty')
      composedOutputs = new Array(explicitOutputs.length)
      for (i = 0; i < explicitOutputs.length; i += 1) {
        var outKey = explicitOutputs[i]
        var outId = resolveKey(outKey)
        if (outId < 0) {
          throw new Error(
            'compose: outputs[' + i + '] references unknown outer node ' + outKey + ' (' + describeKey(outKey) + ')',
          )
        }
        composedOutputs[i] = outId
      }
    } else {
      composedOutputs = []
      for (i = 0; i < candidates.length; i += 1) {
        var candidate = candidates[i]
        if (candidate.key === null || consumed[candidate.key] === undefined) {
          composedOutputs.push(candidate.id)
        }
      }
    }
    if (composedOutputs.length === 0) throw new Error('compose: composed netlist has no dangling outputs')

    var result = makeNetlist({ nIn: nIn, gates: gates, outputs: composedOutputs })
    var selfCheck = validateNetlist(result)
    if (!selfCheck.ok) throw new Error('compose: internal splice error: ' + selfCheck.error)
    return result
  }

  // ---- canonical circuits -------------------------------------------------
  function buildHalfAdder() {
    var b = gateBuilder(2, 0)
    var x = 2
    var y = 3
    var n1 = b.push(x, y) // NOT(x AND y)
    var n2 = b.push(x, n1)
    var n3 = b.push(y, n1)
    var sum = b.push(n2, n3) // x XOR y
    var carry = b.push(n1, n1) // x AND y
    return makeNetlist({ nIn: 2, gates: b.gates, outputs: [sum, carry] })
  }

  function buildFullAdder() {
    var b = gateBuilder(3, 0)
    var a = 2
    var c = 3
    var cin = 4
    var n1 = b.push(a, c) // NOT(a AND b)
    var n2 = b.push(a, n1)
    var n3 = b.push(c, n1)
    var s = b.push(n2, n3) // a XOR b
    var n5 = b.push(s, cin) // NOT((a XOR b) AND cin)
    var carry = b.push(n1, n5) // a AND b OR cin AND (a XOR b)
    var n7 = b.push(s, n5)
    var n8 = b.push(cin, n5)
    var sum = b.push(n7, n8) // a XOR b XOR cin
    return makeNetlist({ nIn: 3, gates: b.gates, outputs: [sum, carry] })
  }

  function buildFourBitAdder() {
    var b = gateBuilder(9, 0)
    var aNodes = [2, 3, 4, 5] // A0..A3
    var bNodes = [6, 7, 8, 9] // B0..B3
    var carry = 10 // Cin
    var sums = []
    for (var i = 0; i < 4; i += 1) {
      var a = aNodes[i]
      var bb = bNodes[i]
      var cin = carry
      var n1 = b.push(a, bb)
      var n2 = b.push(a, n1)
      var n3 = b.push(bb, n1)
      var s = b.push(n2, n3)
      var n5 = b.push(s, cin)
      carry = b.push(n1, n5)
      var n7 = b.push(s, n5)
      var n8 = b.push(cin, n5)
      sums.push(b.push(n7, n8))
    }
    return makeNetlist({ nIn: 9, gates: b.gates, outputs: [sums[0], sums[1], sums[2], sums[3], carry] })
  }

  function buildSrLatch() {
    var b = gateBuilder(2, 2)
    var s = 2
    var r = 3
    var q = 2 + 2 // first latch node
    var qn = 2 + 2 + 1 // second latch node
    var nextQ = b.push(s, qn) // Q' = NAND(S, Qn)
    var nextQn = b.push(r, q) // Qn' = NAND(R, Q)
    return makeNetlist({
      nIn: 2,
      nState: 2,
      gates: b.gates,
      outputs: [q, qn],
      firstLatchInput: nextQ,
    })
  }


  // ---- generic NAND construction helpers ---------------------------------
  function nandKit(nIn, nState) {
    var b = gateBuilder(nIn, nState)
    var notCache = Object.create(null)
    var andCache = Object.create(null)
    var orCache = Object.create(null)
    function not(x) {
      if (notCache[x] !== undefined) return notCache[x]
      var id = b.push(x, x)
      notCache[x] = id
      return id
    }
    function and(a, c) {
      var key = a < c ? a + ',' + c : c + ',' + a
      if (andCache[key] !== undefined) return andCache[key]
      var id = not(b.push(a, c))
      andCache[key] = id
      return id
    }
    function or(a, c) {
      var key = a < c ? a + ',' + c : c + ',' + a
      if (orCache[key] !== undefined) return orCache[key]
      var id = b.push(not(a), not(c))
      orCache[key] = id
      return id
    }
    function xor(a, c) {
      var n = b.push(a, c)
      return b.push(b.push(a, n), b.push(c, n))
    }
    return { b: b, gates: b.gates, push: b.push, not: not, and: and, or: or, xor: xor }
  }

  // ---- Quine–McCluskey synthesis (nIn <= 4) ------------------------------
  var POPCOUNT4 = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4]
  function bitsOf(index, nIn) {
    var out = new Array(nIn)
    for (var i = 0; i < nIn; i += 1) out[i] = (index >> i) & 1
    return out
  }
  function termKey(vals, dc, nIn) {
    var key = ''
    for (var i = 0; i < nIn; i += 1) key += (dc >> i) & 1 ? '-' : vals[i]
    return key
  }
  function primeImplicants(minterms, dcSet, nIn) {
    var terms = []
    var byKey = Object.create(null)
    for (var i = 0; i < minterms.length; i += 1) {
      var term = { vals: bitsOf(minterms[i], nIn), dc: 0, covered: false }
      var key = termKey(term.vals, 0, nIn)
      if (byKey[key] === undefined) {
        byKey[key] = term
        terms.push(term)
      }
    }
    var primes = []
    var round = terms
    while (round.length > 0) {
      var next = []
      var nextKey = Object.create(null)
      var changed = new Array(round.length)
      for (var a = 0; a < round.length; a += 1) {
        for (var c = a + 1; c < round.length; c += 1) {
          if (round[a].dc !== round[c].dc) continue
          var diff = -1
          var ok = true
          for (var v = 0; v < nIn; v += 1) {
            if ((round[a].dc >> v) & 1) continue
            if (round[a].vals[v] !== round[c].vals[v]) {
              if (diff >= 0) {
                ok = false
                break
              }
              diff = v
            }
          }
          if (!ok || diff < 0) continue
          changed[a] = true
          changed[c] = true
          var vals = round[a].vals.slice()
          var dc = round[a].dc | (1 << diff)
          var key2 = termKey(vals, dc, nIn)
          if (nextKey[key2] === undefined) {
            var merged = { vals: vals, dc: dc }
            nextKey[key2] = merged
            next.push(merged)
          }
        }
      }
      for (var r = 0; r < round.length; r += 1) {
        if (!changed[r]) primes.push(round[r])
      }
      round = next
    }
    return { primes: primes, dcBranches: dcSet }
  }
  function covers(term, minterm, nIn) {
    for (var i = 0; i < nIn; i += 1) {
      if ((term.dc >> i) & 1) continue
      if (term.vals[i] !== ((minterm >> i) & 1)) return false
    }
    return true
  }
  function affineForm(minterms, nIn) {
    // Detect an affine (XOR-of-inputs) function: f(i) = c ^ (a·i mod 2).
    var count = 1 << nIn
    for (var i = 0; i < count; i += 1) if (minterms[i] !== 0 && minterms[i] !== 1) return null
    var c = minterms[0]
    var coeff = []
    for (var v = 0; v < nIn; v += 1) {
      var bit = 1 << v
      var value = null
      for (var m = 0; m < count; m += 1) {
        if (m & bit) continue
        var d = minterms[m] ^ minterms[m | bit]
        if (value === null) value = d
        else if (value !== d) return null
      }
      coeff.push(value || 0)
    }
    return { constant: c, coeff: coeff }
  }

  function buildAffine(form, nIn, kit) {
    var node = form.constant ? 1 : 0
    for (var v = 0; v < nIn; v += 1) {
      if (!form.coeff[v]) continue
      var input = 2 + v
      node = node === 0 ? input : node === 1 ? kit.not(input) : kit.xor(node, input)
    }
    return node
  }

  function buildSop(minterms, dcSet, nIn, kit) {
    var ones = []
    var cares = []
    for (var i = 0; i < (1 << nIn); i += 1) {
      var value = minterms[i]
      if (value === 1) ones.push(i)
      if (value === 1 || value === 0) cares.push(i)
    }
    if (ones.length === 0) return { node: 0, terms: [], literalCount: 0, primeCount: 0 }
    if (ones.length === cares.length) return { node: 1, terms: [{ all: true }], literalCount: 0, primeCount: 0 }
    var affine = affineForm(minterms, nIn)
    if (affine !== null) {
      return {
        node: buildAffine(affine, nIn, kit),
        terms: [{ affine: true }],
        literalCount: affine.coeff.filter(Boolean).length,
        primeCount: 0,
        affine: true,
      }
    }
    var qm = primeImplicants(ones, {}, nIn)
    var primes = qm.primes
    // greedy cover: most uncovered minterms, tie-break fewest literals
    var uncovered = ones.slice()
    var chosen = []
    while (uncovered.length > 0) {
      var best = null
      var bestCover = null
      var bestLiterals = 0
      for (var p = 0; p < primes.length; p += 1) {
        var prime = primes[p]
        var cover = []
        for (var u = 0; u < uncovered.length; u += 1) {
          if (covers(prime, uncovered[u], nIn)) cover.push(uncovered[u])
        }
        if (cover.length === 0) continue
        var literals = nIn - POPCOUNT4[prime.dc & 15]
        if (best === null || cover.length > bestCover.length || (cover.length === bestCover.length && literals < bestLiterals)) {
          best = prime
          bestCover = cover
          bestLiterals = literals
        }
      }
      if (best === null) break
      chosen.push(best)
      uncovered = uncovered.filter(function (m) {
        return bestCover.indexOf(m) < 0
      })
    }
    // build product terms
    var products = []
    var literalCount = 0
    for (var t = 0; t < chosen.length; t += 1) {
      var term = chosen[t]
      var factors = []
      for (var bit = 0; bit < nIn; bit += 1) {
        if ((term.dc >> bit) & 1) continue
        var node = 2 + bit
        factors.push(term.vals[bit] ? node : kit.not(node))
        literalCount += 1
      }
      if (factors.length === 0) return { node: 1, terms: chosen, literalCount: 0, primeCount: primes.length }
      var product = factors[0]
      for (var f = 1; f < factors.length; f += 1) product = kit.and(product, factors[f])
      products.push(product)
    }
    var out = products[0]
    for (var q = 1; q < products.length; q += 1) out = kit.or(out, products[q])
    return { node: out, terms: chosen, literalCount: literalCount, primeCount: primes.length }
  }

  function synthesize(spec) {
    if (!spec || typeof spec !== 'object') throw new TypeError('synth: options required')
    var nIn = spec.nIn
    if (!isInt(nIn) || nIn < 1 || nIn > 4) throw new TypeError('synth: nIn must be 1..4')
    var bits = spec.bits
    if (!Array.isArray(bits) || bits.length !== 1 << nIn) {
      throw new TypeError('synth: bits must be an array of length ' + (1 << nIn))
    }
    for (var i = 0; i < bits.length; i += 1) {
      var value = bits[i]
      if (value !== 0 && value !== 1 && value !== -1 && value !== null && value !== undefined) {
        throw new TypeError('synth: bits must be 0 / 1 / -1 (don\'t care)')
      }
    }
    var kit = nandKit(nIn, 0)
    var minterms = bits.map(function (v) {
      if (v === 1) return 1
      if (v === 0) return 0
      return -1
    })
    var sop = buildSop(minterms, null, nIn, kit)
    var netlist = makeNetlist({ nIn: nIn, gates: kit.gates, outputs: [sop.node] })
    return {
      netlist: netlist,
      bits: minterms,
      terms: sop.terms.length,
      literalCount: sop.literalCount,
      primeCount: sop.primeCount,
      gateCount: kit.gates.length,
      hex: gateHexOf(netlist),
    }
  }
  function gateHexOf(netlist) {
    var bytes = gateBytes(netlist)
    var hex = '0x'
    for (var i = 0; i < bytes.length; i += 1) hex += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16)
    return hex
  }

  // ---- canonical component library ---------------------------------------
  function buildNotGate() {
    var k = nandKit(1, 0)
    return makeNetlist({ nIn: 1, gates: k.gates.concat([{ a: 2, b: 2 }]), outputs: [3] })
  }
  function buildNandGate() {
    return makeNetlist({ nIn: 2, gates: [{ a: 2, b: 3 }], outputs: [4] })
  }
  function buildAndGate() {
    var k = nandKit(2, 0)
    var n = k.push(2, 3)
    return makeNetlist({ nIn: 2, gates: k.gates.concat([{ a: n, b: n }]), outputs: [5] })
  }
  function buildOrGate() {
    var k = nandKit(2, 0)
    var na = k.not(2)
    var nb = k.not(3)
    var out = k.push(na, nb)
    return makeNetlist({ nIn: 2, gates: k.gates, outputs: [out] })
  }
  function buildXorGate() {
    var k = nandKit(2, 0)
    var out = k.xor(2, 3)
    return makeNetlist({ nIn: 2, gates: k.gates, outputs: [out] })
  }
  function buildMux2() {
    var k = nandKit(3, 0)
    var notS = k.not(4)
    var t1 = k.push(2, notS)
    var t2 = k.push(3, 4)
    var out = k.push(t1, t2)
    return makeNetlist({ nIn: 3, gates: k.gates, outputs: [out] })
  }
  function buildDecoder2to4() {
    var k = nandKit(2, 0)
    var na = k.not(2)
    var nb = k.not(3)
    var y0 = k.push(na, nb)
    var y1 = k.push(2, nb)
    var y2 = k.push(na, 3)
    var y3 = k.push(2, 3)
    return makeNetlist({ nIn: 2, gates: k.gates, outputs: [y0, y1, y2, y3] })
  }

  var SEVEN_SEG = Object.freeze([63, 6, 91, 79, 102, 109, 125, 7, 127, 111])
  function sevenSegmentMask(digit) {
    if (!isInt(digit) || digit < 0 || digit > 9) return 0
    return SEVEN_SEG[digit]
  }
  function sevenSegmentExpected(bits) {
    var digit = bits & 15
    return sevenSegmentMask(digit)
  }
  function buildSevenSegment() {
    var nIn = 4
    var kit = nandKit(nIn, 0)
    var outputs = []
    for (var segment = 0; segment < 7; segment += 1) {
      var bits = new Array(16)
      for (var index = 0; index < 16; index += 1) {
        bits[index] = (sevenSegmentMask(index) >> segment) & 1
      }
      var sop = buildSop(bits, null, nIn, kit)
      outputs.push(sop.node)
    }
    return makeNetlist({ nIn: nIn, gates: kit.gates, outputs: outputs })
  }

  function buildCounter4() {
    // latches Q0..Q3 are nodes 2..5; gates start at 6 (2 + nIn + nState)
    var gates = []
    var base = 6
    var push = function (a, b) {
      var id = base + gates.length
      gates.push({ a: a, b: b })
      return id
    }
    var q0 = 2
    var q1 = 3
    var q2 = 4
    var q3 = 5
    var x1 = push(q1, q0)
    var y1 = push(q1, x1)
    var z1 = push(q0, x1)
    var c1 = push(x1, x1)
    var x2 = push(q2, c1)
    var y2 = push(q2, x2)
    var z2 = push(c1, x2)
    var c2 = push(x2, x2)
    var x3 = push(q3, c2)
    var y3 = push(q3, x3)
    var z3 = push(c2, x3)
    // the last four gate outputs are the latch inputs Q0'..Q3' in order
    push(q0, q0)
    push(y1, z1)
    push(y2, z2)
    push(y3, z3)
    return makeNetlist({ nIn: 0, nState: 4, gates: gates, outputs: [q0, q1, q2, q3] })
  }
  function counterExpected(stateBits) {
    return (stateBits + 1) & 15
  }

  var canonical = Object.freeze({
    halfAdder: buildHalfAdder,
    fullAdder: buildFullAdder,
    fourBitAdder: buildFourBitAdder,
    srLatch: buildSrLatch,
    notGate: buildNotGate,
    nandGate: buildNandGate,
    andGate: buildAndGate,
    orGate: buildOrGate,
    xorGate: buildXorGate,
    mux2: buildMux2,
    decoder2to4: buildDecoder2to4,
    sevenSegment: buildSevenSegment,
    sevenSegMask: sevenSegmentMask,
    sevenSegExpected: sevenSegmentExpected,
    counter4: buildCounter4,
    counterExpected: counterExpected,
  })

  // ---- boolean reference helpers -----------------------------------------
  var reference = Object.freeze({
    nand: function (a, b) {
      return 1 - ((a & 1) & (b & 1))
    },
    not: function (a) {
      return 1 - (a & 1)
    },
    and: function (a, b) {
      return (a & 1) & (b & 1)
    },
    or: function (a, b) {
      return (a & 1) | (b & 1)
    },
    xor: function (a, b) {
      return (a & 1) ^ (b & 1)
    },
  })

  TT.Circuit = Object.freeze({
    // protocol constants (handy for the HUD / codex)
    GATE_BYTES: GATE_BYTES,
    OPCODE_NAND: OPCODE_NAND,
    MAX_EXHAUSTIVE_INPUTS: MAX_EXHAUSTIVE_INPUTS,
    // netlist model
    makeNetlist: makeNetlist,
    nodeIds: nodeIds,
    validateNetlist: validateNetlist,
    // evaluation
    evaluate: evaluate,
    step: step,
    // bytecode
    gateBytes: gateBytes,
    gateHex: gateHex,
    gateCount: gateCount,
    maxDepth: maxDepth,
    // verification
    truthTable: truthTable,
    exhaustiveVerify: exhaustiveVerify,
    equivalent: equivalent,
    // composition + building blocks
    compose: compose,
    synth: synthesize,
    canonical: canonical,
    reference: reference,
  })
})()
