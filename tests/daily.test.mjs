/**
 * tests/daily.test.mjs — deterministic daily truth-table challenge.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '30-missions.js', '49-daily.js']) new Function('TT', read(name))(TT)
const D = TT.Daily

test('the puzzle is deterministic per date', () => {
  const a = D.puzzle('2026-11-20')
  const b = D.puzzle('2026-11-20')
  assert.deepEqual(a.truth, b.truth)
  assert.equal(a.truth.length, 8)
  assert.equal(a.clues.length, 2)
  assert.notEqual(a.clues[0].index, a.clues[1].index)
  const other = D.puzzle('2026-11-21')
  assert.notDeepEqual(other.truth, a.truth)
})

test('queries and submit reveal and validate the truth table', () => {
  const puzzle = D.puzzle('2026-11-20')
  const reveal = D.query(puzzle, 3)
  assert.equal(reveal.out, puzzle.truth[3])
  assert.equal(D.evaluate(puzzle, puzzle.truth).solved, true)
  const wrong = puzzle.truth.slice()
  wrong[0] = wrong[0] ? 0 : 1
  assert.equal(D.evaluate(puzzle, wrong).solved, false)
  assert.equal(D.evaluate(puzzle, wrong).diff.length, 1)
})

test('reducer runs a daily attempt and records the best', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'arcade/open' })
  assert.ok(state.daily)
  const puzzle = D.puzzle(state.daily.date)
  // the clue positions depend on the date seed, so query a position that is not
  // already revealed by the two clues
  const queryIndex = [0, 1, 2, 3, 4, 5, 6, 7].find((index) => !puzzle.clues.some((clue) => clue.index === index))
  state = TT.Missions.reduce(state, { type: 'daily/query', index: queryIndex })
  assert.equal(state.daily.used, 1)
  assert.equal(state.daily.answers[queryIndex], puzzle.truth[queryIndex])
  // answer everything correctly, then submit
  const daily = { ...state.daily, answers: puzzle.truth.slice() }
  state = { ...state, daily }
  state = TT.Missions.reduce(state, { type: 'daily/submit' })
  assert.equal(state.daily.solved, true)
  assert.equal(state.stats.daily[state.daily.date], 1)
  assert.ok(state.toast && state.toast.key === 'daily.win')
  state = TT.Missions.reduce(state, { type: 'daily/reset' })
  assert.equal(state.daily.solved, false)
  assert.equal(state.daily.used, 0)
})
