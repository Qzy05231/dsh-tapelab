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
for (const name of ['20-circuit.js', '25-cpu.js', '28-safety.js', '30-missions.js', '37-arcade.js']) {
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
  for (const tune of A.TUNES) assert.ok(tune.steps.length >= 16)
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

  state = M.reduce(state, { type: 'arcade/game', game: 'debug' })
  assert.equal(state.arcade.debug.puzzles.length, 5)
  const puzzle = state.arcade.debug.puzzles[0]
  const correctIndex = puzzle.options.findIndex((option) => option.correct)
  state = M.reduce(state, { type: 'debug/select', option: correctIndex })
  assert.equal(state.arcade.debug.status, 'pass')
  state = M.reduce(state, { type: 'debug/level', level: 1 })
  assert.equal(state.arcade.debug.level, 1)
})
