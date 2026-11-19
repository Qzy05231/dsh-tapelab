/**
 * tests/verilog.test.mjs — gate-level Verilog import.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '48-verilog.js']) new Function('TT', read(name))(TT)
const V = TT.VerilogImport

test('imports a half adder and evaluates like real addition', () => {
  const result = V.parse('module half(input a, b, output sum, cout); assign sum = a ^ b; assign cout = a & b; endmodule')
  assert.equal(result.nIn, 2)
  assert.equal(result.nOut, 2)
  assert.ok(result.gates >= 5)
  const outputs = []
  for (let bits = 0; bits < 4; bits += 1) outputs.push(TT.Circuit.evaluate(result.netlist, bits).outputBits)
  assert.deepEqual(outputs, [0b00, 0b01, 0b01, 0b10])
})

test('supports buses, bit selects, wire and OR', () => {
  const result = V.parse('module m(input [1:0] a, input b, output [1:0] y); wire n; assign n = ~(a[0] & b); assign y[0] = a[1] | b; assign y[1] = n; endmodule')
  assert.equal(result.nIn, 3)
  assert.equal(result.nOut, 2)
  for (let bits = 0; bits < 8; bits += 1) {
    const out = TT.Circuit.evaluate(result.netlist, bits).outputBits
    const a0 = bits & 1
    const a1 = (bits >> 1) & 1
    const b = (bits >> 2) & 1
    assert.equal(out & 1, a1 | b)
    assert.equal((out >> 1) & 1, a0 & b ? 0 : 1)
  }
})

test('rejects unsupported syntax with a clear message', () => {
  assert.throws(() => V.parse('module m(input a, output y); assign y = a + a; endmodule'), /无法解析|不支持/)
  assert.throws(() => V.parse('always @(posedge clk) y <= a;'), /module/)
  assert.throws(() => V.parse('module m(input a, output y); assign y = missing; endmodule'), /未声明/)
})
