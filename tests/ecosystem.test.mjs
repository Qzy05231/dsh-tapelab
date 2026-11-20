/**
 * tests/ecosystem.test.mjs — bubble physics, project data and mode wiring.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(HERE, '..', 'src', 'client', name), 'utf8')
const TT = new Function(read('00-core.js') + '\nreturn TT')()
for (const name of ['20-circuit.js', '30-missions.js', '51-ecosystem.js']) new Function('TT', read(name))(TT)
const E = TT.Ecosystem

test('only the six official entries are listed', () => {
  const names = E.PROJECTS.map((project) => project.name)
  assert.deepEqual(names, ['TapeOut', 'Blonskr · X', 'TapeHub.ai', 'TapeKit', 'TapeCode.ai', 'TapeRelay'])
  assert.equal(E.PROJECTS.every((project) => E.CATEGORIES[project.category]), true)
})

test('every project has a category, description and https links', () => {
  assert.equal(E.PROJECTS.length, 6)
  for (const project of E.PROJECTS) {
    assert.ok(E.CATEGORIES[project.category], project.id)
    assert.ok(project.desc.length > 10, project.id)
    assert.ok(project.links.length >= 1, project.id)
    for (const link of project.links) assert.ok(link.url.startsWith('https://'), `${project.id} ${link.url}`)
  }
})

test('bubbles stay in bounds, collide and are clickable', () => {
  const bubbles = E.makeBubbles(900, 600)
  assert.equal(bubbles.length, E.PROJECTS.length)
  for (let i = 0; i < 300; i += 1) E.step(bubbles, 900, 600, 1)
  for (const bubble of bubbles) {
    assert.ok(bubble.x >= bubble.r - 1 && bubble.x <= 900 - bubble.r + 1)
    assert.ok(bubble.y >= bubble.r - 1 && bubble.y <= 600 - bubble.r + 1)
  }
  assert.equal(E.hitTest(bubbles, bubbles[0].x, bubbles[0].y), bubbles[0].id)
  assert.equal(E.hitTest(bubbles, -100, -100), null)
})

test('the ecosystem mode opens and closes', () => {
  let state = TT.Missions.initial()
  state = TT.Missions.reduce(state, { type: 'eco/open' })
  assert.equal(state.mode, 'eco')
  state = TT.Missions.reduce(state, { type: 'eco/close' })
  assert.equal(state.mode, 'missions')
})
