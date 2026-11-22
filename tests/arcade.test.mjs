/**
 * tests/arcade.test.mjs — playground logic: music/pixel helpers, majority gate,
 * the five debug puzzles, and the reducer actions behind the mini games.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '25-cpu.js', '28-safety.js', '30-missions.js', '37-arcade.js', '38-export.js']) {
  new Function('TT', read(name))(TT)
}
const A = TT.Arcade
const M = TT.Missions

test('music helpers map scale steps to notes and frequencies', () => {
  assert.equal(A.SCALES.length, 3)
  assert.ok(A.freq(0, 0) > 200 && A.freq(0, 0) < 300)
  assert.ok(A.freq(4, 0) > A.freq(0, 0))
  assert.equal(A.noteName(-1, 0), '·')
  assert.ok(A.TUNES.length >= 3)
  for (const tune of A.TUNES) {
    assert.ok(tune.notes.length >= 13)
    assert.ok(A.tuneBeats(tune) > 4)
    for (const note of tune.notes) assert.ok(note.beats > 0)
  }
  const semitone = (note) => (note.deg < 0 ? null : A.SCALES[0].steps[note.deg])
  assert.deepEqual(A.TUNES.find((tune) => tune.id === 'twinkle').notes.slice(0, 7).map(semitone), [0, 0, 7, 7, 9, 9, 7])
  assert.deepEqual(A.TUNES.find((tune) => tune.id === 'ode').notes.slice(0, 7).map(semitone), [4, 4, 5, 7, 7, 5, 4])
})

test('full piano maps keys, MIDI notes and octaves', () => {
  assert.equal(A.PIANO_MIN, 21)
  assert.equal(A.PIANO_MAX, 108)
  assert.equal(A.midiName(21), 'A0')
  assert.equal(A.midiName(60), 'C4')
  assert.equal(A.midiName(108), 'C8')
  assert.ok(A.midiFreq(21) > 27 && A.midiFreq(21) < 28)
  assert.ok(A.midiFreq(108) > 4180)
  assert.equal(Object.keys(A.PIANO_KEYS).length, 26)
  assert.equal(A.keyToMidi('q', 4), 72)
  assert.equal(A.keyToMidi('z', 4), 60)
  assert.equal(A.keyToMidi('nope', 4), null)
  assert.equal(A.isBlackMidi(24), false)
  assert.equal(A.isBlackMidi(25), true)
  assert.ok(A.pianoGain(21) > A.pianoGain(60))
  assert.ok(A.pianoGain(60) > A.pianoGain(108))
  assert.ok(A.pianoGain(60) > 0.3 && A.pianoGain(60) < 0.5)
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'music/key', midi: 64 })
  assert.equal(state.arcade.music.lastMidi, 64)
  state = TT.Missions.reduce(state, { type: 'music/octave', delta: 1 })
  assert.equal(state.arcade.music.octave, 5)
  state = TT.Missions.reduce(state, { type: 'music/octave', delta: -2 })
  assert.equal(state.arcade.music.octave, 3)
  state = TT.Missions.reduce(state, { type: 'music/octave', delta: 99 })
  assert.equal(state.arcade.music.octave, 6)
  state = TT.Missions.reduce(state, { type: 'music/octave', delta: -99 })
  assert.equal(state.arcade.music.octave, 1)
})


test('pixel helpers keep the 8×8 shape and shift columns', () => {
  const heart = A.pattern('heart')
  assert.equal(heart.length, 64)
  assert.equal(A.pattern('smile').length, 64)
  const shifted = A.shiftPattern(heart)
  assert.equal(shifted.length, 64)
  assert.notDeepEqual(shifted, heart)
  assert.equal(shifted.reduce((sum, value) => sum + value, 0), heart.reduce((sum, value) => sum + value, 0))
})

test('majority gate and its NAND netlist agree', () => {
  for (let i = 0; i < 8; i += 1) {
    const expected = A.majority(i & 1, (i >> 1) & 1, (i >> 2) & 1)
    assert.equal(TT.Circuit.evaluate(A.majorityNetlist(), i).outputBits & 1, expected, `input ${i}`)
  }
})

test('debug lab has five solvable puzzles with one correct repair each', () => {
  const puzzles = A.debugPuzzles()
  assert.equal(puzzles.length, 5)
  for (const puzzle of puzzles) {
    assert.ok(puzzle.diff.length >= 1, `${puzzle.id} should show a visible diff`)
    assert.equal(puzzle.options.filter((option) => option.correct).length, 1)
    const correctIndex = puzzle.options.findIndex((option) => option.correct)
    const fixed = A.fixedNetlist(puzzle, correctIndex)
    assert.equal(TT.Circuit.equivalent(fixed, puzzle.correct), true, puzzle.id)
    const wrong = A.fixedNetlist(puzzle, (correctIndex + 1) % puzzle.options.length)
    assert.equal(TT.Circuit.equivalent(wrong, puzzle.correct), false, puzzle.id)
  }
})

test('chain snake moves, turns, eats and dies on walls', () => {
  let snake = A.snakeInitial()
  assert.equal(snake.alive, true)
  assert.equal(snake.cells.length, 3)
  const head = snake.cells[0]
  assert.equal(A.SNAKE_SIZE, 16)
  snake = A.snakeStep(snake)
  assert.equal(snake.cells[0], head + 1)
  snake = A.snakeTurn(snake, 'left')
  assert.equal(snake.dir, 'right', '180-degree turn is rejected')
  snake = A.snakeTurn(snake, 'up')
  const before = snake.cells[0]
  snake = A.snakeStep(snake)
  assert.equal(snake.cells[0], before - 16)
  // eating
  let eat = A.snakeInitial()
  eat = { ...eat, food: eat.cells[0] + 1 }
  const length = eat.cells.length
  eat = A.snakeStep(eat)
  assert.equal(eat.score, 1)
  assert.equal(eat.cells.length, length + 1)
  // wall collision
  let wall = A.snakeInitial()
  wall = { ...wall, cells: [15, 14, 13], dir: 'right' }
  wall = A.snakeStep(wall)
  assert.equal(wall.alive, false)
})

test('export helpers round-trip netlists, Verilog and libraries', () => {
  const half = TT.Circuit.canonical.halfAdder()
  const code = TT.Export.encodeNetlist(half)
  assert.equal(typeof code, 'string')
  const decoded = TT.Export.decodeNetlist(code)
  assert.equal(TT.Circuit.equivalent(decoded, half), true)
  const verilog = TT.Export.verilog(half, 'half_adder')
  assert.ok(verilog.includes('module half_adder'))
  assert.ok(verilog.includes('assign w['))
  const csv = TT.Export.truthTableCsv(half)
  const lines = csv.trim().split('\n')
  assert.equal(lines[0], 'in_bits,out_bits')
  assert.equal(lines.length, 5, 'header + four truth-table rows')
  const library = [{ id: 'a', name: 'one', nIn: 2, gateCount: 5, hex: '0x00', netlist: half, at: 1 }]
  const archive = TT.Export.libraryCode(library)
  const restored = TT.Export.decodeLibrary(archive)
  assert.equal(restored.length, 1)
  assert.equal(TT.Circuit.equivalent(restored[0].netlist, half), true)
})

test('arcade reducer drives every mini game', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'arcade/open', game: 'music' })
  assert.equal(state.mode, 'arcade')
  state = M.reduce(state, { type: 'music/toggle' })
  assert.equal(state.arcade.music.playing, true)
  const before = state.arcade.music.step
  state = M.reduce(state, { type: 'music/step' })
  assert.notEqual(state.arcade.music.step, before)

  state = M.reduce(state, { type: 'arcade/game', game: 'pixel' })
  const lit = state.arcade.pixel.bits.filter(Boolean).length
  state = M.reduce(state, { type: 'pixel/clear' })
  assert.equal(state.arcade.pixel.bits.filter(Boolean).length, 0)
  assert.ok(lit > 0)

  state = M.reduce(state, { type: 'arcade/game', game: 'lock' })
  state = M.reduce(state, { type: 'lock/toggle', index: 0 })
  state = M.reduce(state, { type: 'lock/toggle', index: 3 })
  state = M.reduce(state, { type: 'lock/check' })
  assert.equal(state.arcade.lock.guess, 9)
  assert.equal(state.arcade.lock.solved, true)

  state = M.reduce(state, { type: 'arcade/game', game: 'guess' })
  assert.equal(state.arcade.guess.secret, 11)
  state = M.reduce(state, { type: 'guess/submit' })
  assert.equal(state.arcade.guess.tries, 1)
  assert.equal(state.arcade.guess.history[0].cmp, -1)

  state = M.reduce(state, { type: 'arcade/game', game: 'vote' })
  state = M.reduce(state, { type: 'vote/toggle', index: 0 })
  state = M.reduce(state, { type: 'vote/toggle', index: 1 })
  assert.equal(A.majority(state.arcade.vote.a, state.arcade.vote.b, state.arcade.vote.c), 1)

  state = M.reduce(state, { type: 'arcade/game', game: 'snake' })
  state = M.reduce(state, { type: 'snake/toggle' })
  assert.equal(state.arcade.snake.running, true)
  const headBefore = state.arcade.snake.cells[0]
  state = M.reduce(state, { type: 'snake/tick' })
  assert.notEqual(state.arcade.snake.cells[0], headBefore)
  state = M.reduce(state, { type: 'snake/dir', dir: 'up' })
  assert.equal(state.arcade.snake.dir, 'up')

  state = M.reduce(state, { type: 'arcade/game', game: 'debug' })
  assert.equal(state.arcade.debug.puzzles.length, 5)
  const puzzle = state.arcade.debug.puzzles[0]
  const correctIndex = puzzle.options.findIndex((option) => option.correct)
  state = M.reduce(state, { type: 'debug/select', option: correctIndex })
  assert.equal(state.arcade.debug.status, 'pass')
  state = M.reduce(state, { type: 'debug/level', level: 1 })
  assert.equal(state.arcade.debug.level, 1)
})


test('arcade games expose real gate netlists', () => {
  const compare = A.comparatorNetlist()
  assert.equal(compare.nIn, 8)
  for (let a = 0; a < 16; a += 1) {
    for (let b = 0; b < 16; b += 1) {
      const result = TT.Circuit.evaluate(compare, a | (b << 4))
      assert.equal(result.outputBits & 1, a === b ? 1 : 0, `${a} vs ${b}`)
    }
  }
  const majority = A.majorityNetlist()
  assert.equal(majority.nIn, 3)
  for (let bits = 0; bits < 8; bits += 1) {
    const a = bits & 1
    const b = (bits >> 1) & 1
    const c = (bits >> 2) & 1
    assert.equal(TT.Circuit.evaluate(majority, bits).outputBits & 1, A.majority(a, b, c))
  }
})
