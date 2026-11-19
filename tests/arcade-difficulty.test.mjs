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
  const snake = { ...TT.Arcade.snakeInitial(undefined, 'fast'), cells: [7, 6, 5], dir: 'right', running: true, score: 4 }
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
