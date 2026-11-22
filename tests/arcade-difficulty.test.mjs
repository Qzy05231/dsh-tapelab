/**
 * tests/arcade-difficulty.test.mjs — speed tiers, records and tighter arcade limits.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '30-missions.js', '37-arcade.js']) new Function('TT', read(name))(TT)
const M = TT.Missions

test('snake speed can be chosen before a run', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'arcade/game', game: 'snake' })
  state = M.reduce(state, { type: 'snake/speed', speed: 'fast' })
  assert.equal(state.arcade.snake.speed, 'fast')
  // while running the speed is locked
  state = M.reduce(state, { type: 'snake/toggle' })
  state = M.reduce(state, { type: 'snake/speed', speed: 'slow' })
  assert.equal(state.arcade.snake.speed, 'fast')
})

test('a crashing run records the local leaderboard and per-speed best', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'arcade/game', game: 'snake' })
  const snake = { ...TT.Arcade.snakeInitial(undefined, 'fast'), cells: [15, 14, 13], dir: 'right', running: true, score: 4 }
  state = { ...state, arcade: { ...state.arcade, snake } }
  const death = M.reduce(state, { type: 'snake/tick' })
  assert.equal(death.arcade.snake.alive, false)
  assert.equal(death.stats.snakeScores.length, 1)
  assert.equal(death.stats.snakeScores[0].score, 4)
  assert.equal(death.stats.snakeBySpeed.fast, 4)
})

test('guess now has five tries and awards a score', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'arcade/game', game: 'guess' })
  state = { ...state, arcade: { ...state.arcade, guess: { ...state.arcade.guess, secret: 0, guess: 0 } } }
  state = M.reduce(state, { type: 'guess/submit' })
  assert.equal(state.arcade.guess.solved, true)
  assert.equal(state.arcade.guess.score, 50)
  assert.equal(state.stats.guessScoreBest, 50)
  assert.equal(state.arcade.guess.maxTries, 5)
})

test('lock gives up after six failed attempts and records best solve', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'arcade/game', game: 'lock' })
  state = { ...state, arcade: { ...state.arcade, lock: { ...state.arcade.lock, code: 0, guess: 1 } } }
  for (let i = 0; i < 6; i += 1) state = M.reduce(state, { type: 'lock/check' })
  assert.equal(state.arcade.lock.failed, true)
  assert.equal(state.arcade.lock.solved, false)
  state = M.reduce(state, { type: 'lock/reset' })
  assert.equal(state.arcade.lock.failed, false)
  // solve in two attempts using a fresh code
  state = { ...state, arcade: { ...state.arcade, lock: { ...state.arcade.lock, code: 1 } } }
  state = M.reduce(state, { type: 'lock/check' })
  state = M.reduce(state, { type: 'lock/toggle', index: 0 })
  state = M.reduce(state, { type: 'lock/check' })
  assert.equal(state.arcade.lock.solved, true)
  assert.equal(state.stats.lockBestAttempts, 2)
})


test('sandbox remembers the page it was opened from', () => {
  let state = M.initial()
  state = { ...state, lab: { ...state.lab, result: { netlist: TT.Circuit.canonical.halfAdder() } } }
  state = M.reduce(state, { type: 'lab/sandbox', source: 'result' })
  assert.equal(state.lab.tab, 'sandbox')
  assert.equal(state.lab.sandbox.from, 'result')
  state = { ...state, lab: { ...state.lab, library: [{ id: 'one', name: 'one', netlist: TT.Circuit.canonical.halfAdder() }] } }
  state = M.reduce(state, { type: 'lab/sandbox', source: 'library', id: 'one' })
  assert.equal(state.lab.sandbox.from, 'library')
})


test('the music counter netlist counts beats, not notes', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'arcade/game', game: 'music' })
  state = M.reduce(state, { type: 'music/tune', index: 1 }) // twinkle: 1,1,1,...
  state = M.reduce(state, { type: 'music/step' })
  state = M.reduce(state, { type: 'music/step' })
  assert.equal(state.arcade.music.beats, 2)
  // the counter netlist outputs equal the state bits it is given
  const counter = TT.Circuit.canonical.counter4()
  for (const bits of [0, 1, 2, 7, 15]) {
    const result = TT.Circuit.evaluate(counter, 0, { stateBits: bits })
    assert.equal(result.outputBits, bits)
  }
})


test('music stops when the tune ends and piano keys advance the counter', () => {
  let state = M.initial()
  state = M.reduce(state, { type: 'arcade/game', game: 'music' })
  state = M.reduce(state, { type: 'music/tune', index: 2 }) // beep
  state = { ...state, arcade: { ...state.arcade, music: { ...state.arcade.music, playing: true } } }
  const tune = TT.Arcade.TUNES[2]
  state = { ...state, arcade: { ...state.arcade, music: { ...state.arcade.music, step: tune.notes.length - 1, beats: 8 } } }
  state = M.reduce(state, { type: 'music/step' })
  assert.equal(state.arcade.music.playing, false)
  assert.equal(state.arcade.music.finished, true)
  assert.equal(state.arcade.music.step, 0)
  // replay resets the counter
  state = M.reduce(state, { type: 'music/toggle' })
  assert.equal(state.arcade.music.playing, true)
  assert.equal(state.arcade.music.beats, 0)
  // piano key presses advance the counter so the netlist changes
  const before = state.arcade.music.beats
  state = M.reduce(state, { type: 'music/key', midi: 60 })
  assert.equal(state.arcade.music.beats, before + 1)
})
