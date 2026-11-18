# TapeOut 3D Lab — plugin build spec (shared source of truth)

We are building one DeepSeek Harness **client plugin** (Web GUI) that adds a left-sidebar
entry and a main panel containing an **interactive 3D demo game** that teaches the
TapeOut protocol. The Lead owns packaging, install, panel/HUD, world rendering and
integration. Teammates own the two pure-JavaScript modules named below.

Read this whole file before writing code. Do not edit files outside your ownership.

---

## 1. Environment and hard constraints

- Workspace root: `/Users/loot360/各项目/tapeout`. Package directory: `tapeout-3d-plugin/`.
- Target runtime: DeepSeek Harness Web GUI (browser, Electron). React is provided by the
  host module table: `require('react')` inside the client bundle factory.
- **No external dependencies, no network, no npm install, no bundler.** We build the
  client artifact with a tiny `node scripts/build.mjs` that concatenates source files
  into one `client.js` in the host `window.__ModuleLoader__.load({id, factory})` format.
- **No JSX.** Write `const h = TT.h` (a `React.createElement` wrapper) or plain helper
  functions. Plain ES2020 JavaScript only.
- Each source file is concatenated **inside one factory function scope**, in filename
  order: `00-core.js`, `10-engine.js`, `20-circuit.js`, `30-missions.js`, `40-ui.js`,
  `50-app.js`. There is exactly one `TT` object shared by all files.
- Therefore: a module file may only contain top-level `const`/`function`/assignment
  statements that declare things on `TT`. Never assume another file's top-level value
  is initialized at load time; reference `TT.x` lazily inside functions. Never touch
  `window`/`document` at top level (tests load the file in Node).
- No `import`/`export` keywords inside `src/client/*.js` (they are not modules). Use
  `TT` namespaces.
- Files must be pure enough to unit-test in Node: `TT.Engine.math` and all of
  `TT.Circuit` must work without a DOM.
- Keep it readable: small functions, comments in English, UI copy lives in the locale
  dictionaries (Lead owns dictionaries), no `console.log` noise.
- Do not run `plugin_manager`, do not install anything, do not write into
  `~/.dsh/profiles`, do not start servers, do not create preview HTML pages.

## 2. TapeOut protocol canon (faithful facts the game must teach)

From `reference/TapeOut-Protocol-latest.pdf` plus the deployed implementation
(`taperover-2.39.0-public.zip`, `sites/taperover/`). Do not invent protocol semantics.

1. **NAND token = transistor.** Fungible ERC-1155 token, one token = one NAND gate.
   Its on-chain record is **7 bytes**: `1 byte opcode (0x00 = NAND) + 3-byte input A id
   (big-endian) + 3-byte input B id (big-endian)`. The protocol PDF says "this 7-byte
   thing is the most basic element of the digital world".
2. **Nodes (input ids).** Node `0` = constant 0, node `1` = constant 1, nodes
   `2 .. 2+nIn-1` = circuit inputs, gate `i` (0-based) output = node `2+nIn+i`.
3. **NAND semantics.** `out = 1 - (a & b)` (NOT of AND). Any boolean function can be
   built from NAND gates alone.
4. **LATCH.** Exactly one extra primitive: a 1-bit state element updated once per clock
   beat. The protocol says without memory there is no computer.
5. **Circuit = NFT (ERC-721).** Taped-out circuit logic is on-chain **data, not code**:
   it can only compute; it has no calls, no writes, no storage of its own (except
   latches), so a stranger's circuit can at worst return a wrong answer.
6. **Tape-out ("流片").** In the canvas you wire transistors for free off-chain. Pressing
   "流片" **destroys the NAND tokens** and mints one circuit NFT recording the netlist,
   pin counts (`nIn`, `nOut`, `nState`, gate count) and the 7-byte-per-gate bytecode.
   Examples: 5 NAND = half adder, 9 = full adder, 36 = 4-bit adder, 100 = 7-segment
   decoder.
7. **Evaluation is read-only.** Anyone can call `eval(circuitId, inputBits)`: no wallet,
   no gas, no transaction, no state left behind; the node computes and returns bits.
   Worst case is a wrong answer — safe to compose a stranger's circuit into your logic.
8. **Composition is LEGO.** A taped-out circuit becomes a black box with pins you can
   drop into the next canvas. Transistor → circuit → processor use the same structure.
9. **Clock = chain blocks.** BNB Chain block time 0.45 s ⇒ default clock 2.22 Hz. Each
   new block advances the processor one cycle. Consensus drives it; it cannot be paused;
   the factory renounced ownership; it runs as long as the chain exists.
10. **Behemoth.** The first on-chain CPU ("巨兽"), Intel 4004-class: 4-bit, 2300
    transistors, 2.22 Hz, permanent. The first chapter's finale visual: a die-shot
    array of gates, zoom from one transistor to the whole glowing die.
11. Real deployment numbers we may quote in the codex: BNB Chain / X Layer, tape-out fee
    references, 16-input/80-gate safety circuit used by TapeRover experiments, token
    balance is consumed by the gate count.

## 3. File ownership

| Path | Owner | Purpose |
|---|---|---|
| `SPEC.md` | Lead | this file |
| `package.json`, `cordis.patch.yml`, `index.js`, `icon.svg`, `locale/*.json`, `README.md` | Lead | bundle manifest, screenshot-free display metadata |
| `scripts/build.mjs` | Lead | concat build into `client.js` |
| `src/client/00-core.js` | Lead | `TT`, `h()`, utils, palette, protocol constants |
| `src/client/10-engine.js` | **engine-dev** | generic software 3D canvas engine (contract §5) |
| `src/client/20-circuit.js` | **circuit-dev** | NAND circuit model, 7-byte codec, exhaustive verify, composition, latch (contract §6) |
| `src/client/30-missions.js` | Lead | chapter definitions, game state reducer |
| `src/client/40-ui.js` | Lead | panel shell, header/toolbar (macOS safe area), HUD, codex |
| `src/client/50-app.js` | Lead | world rendering, interaction glue, slot registration |
| `client.js` (generated) | Lead | built artifact |
| `tests/engine.test.mjs` | engine-dev | `node --test` for engine math |
| `tests/logic.test.mjs` | circuit-dev | `node --test` for circuit logic |

Only edit your own files. If you believe the contract is wrong, message the Lead
(`lead`) with the exact problem and a proposal; do not silently change the interface.

## 4. Shared core (Lead writes `00-core.js` first; read it when it appears)

```js
TT                // namespace object
TT.h              // React.createElement wrapper: TT.h('div', {className:'x'}, children...)
TT.util.clamp(v,a,b), TT.util.lerp(a,b,t), TT.util.ease(t), TT.util.fmt(n)
TT.util.formatBits(bits, n)   // e.g. '1010' left-to-right = input n-1..0? define: MSB first string of length n
TT.util.hex7(n)               // 3-byte hex of a node id, '00000A'
TT.palette                    // {cyan, amber, mint, magenta, ink, panel, ...} hex strings
TT.protocol                   // frozen constants: BLOCK_SECONDS=0.45, CLOCK_HZ=2.222, GATE_BYTES=7, ...
```

## 5. Engine contract — `src/client/10-engine.js` (engine-dev)

Software-rendered 3D on a 2D canvas (no WebGL, no deps). Dark holographic "silicon die"
aesthetic. Must stay smooth with ≤ 350 items at 60 fps and HiDPI.

### Coordinates & camera

- Right-handed: **X right, Y up, Z toward the viewer**, ground plane `y = 0`.
- Camera orbits a target. `yaw` degrees (0 = looking from +Z), `pitch` degrees above the
  ground plane (clamp 4..82), `dist` in world units, `target:[x,y,z]`.
- Perspective projection with vertical fov ~48°. Near objects bigger; depth fog.

### API

```js
const engine = TT.Engine.create(canvas, { dprMax: 2, background: '#05080f' })
engine.add(itemSpec) -> handle        // returns { set(patch), remove(), visible, spec }
engine.clear()                        // remove all items
engine.setCamera({yaw,pitch,dist,target}, {animateMs: 0}) // animate with easing
engine.getCamera()                    // {yaw,pitch,dist,target}
engine.resize()                       // read canvas.clientWidth/Height * dpr (also auto on ResizeObserver if available)
engine.start(); engine.stop(); engine.dispose()
engine.setFrameCallback(fn)           // fn(dtMs, timeMs) called each frame before draw
engine.setPickCallback(fn)            // fn(pick|null, phase) phase='click'|'hover'|'leave'
engine.setPointerEnabled(bool)        // default true
engine.autoRotate(enabled, speedDegPerSec)
engine.focus(target, {animateMs})     // camera target dolly
engine.project([x,y,z])               // -> {x,y,scale,depth,visible} screen px (CSS px)
engine.screenToPlane(x, y, planeY)    // screen px -> [x,planeY,z] or null
engine.pickAt(x, y)                   // -> pick|null
engine.time()                         // ms since start
engine.math                           // pure helpers, Node-testable
```

`pick = { id, kind, data, point:[x,y,z], screen:{x,y}, item }`; only items with an `id`
are pickable. Hover fires only when the hovered id/phase changes.

### Item kinds (all support `id?`, `data?`, `opacity?`, `visible?`, `castShadow?`)

- `{kind:'cube', pos, size:[sx,sy,sz], color, emissive?:0..1, edge?:color, label?, sub?,
   pulse?:0..1, spin?:degPerSec, bob?:amplitude}` — shaded box, top-face label text.
- `{kind:'hex', pos, size, color, emissive, label, sub}` — hexagonal prism token chip.
- `{kind:'plate', pos, size:[w,d], color, ring?:color, label?, sub?, active?:bool}` —
  flat rounded slab on the ground with a glowing rim; the main interactive surface.
- `{kind:'wire', points:[[x,y,z],...], color, width?:number, glow?:0..1, dash?:number,
   flow?:0..1 (animated pulse), pulseSpeed?, arrows?:bool}` — 3D polyline, depth-sorted by
  its midpoint; supports animated signal flow.
- `{kind:'sprite', pos, size, draw(ctx, px, timeMs, item), depthBias?, pickRadius?}` —
  custom 2D artwork billboard; used for tokens, NFT crystal, CPU core, "Behemoth" die.
- `{kind:'text', pos, text, size?:px, color, align?, alpha?, sub?}` — billboard text.
- `{kind:'ring', pos, radius, width?, color, glow?, spin?, tilt?}` — orbiting ring.
- `{kind:'beam', pos, radius, color, height}` — additive vertical light column.
- `{kind:'grid', pos?, size:[w,d], cell, color, majorEvery?, activeCell?}` — floor grid.
- `{kind:'glow', pos, radius, color, intensity}` — radial additive glow.
- `{kind:'particles', pos, area:[w,h,d], count, color, size, speed}` — ambient motes.

`handle.set({...})` patches any spec field; `handle.remove()` detaches. Sorting: painter's
algorithm by camera depth; ground `grid` first; labels/sprites drawn as billboards after
their depth peers. Use additive compositing for glow/beams/wire pulses; avoid per-item
`shadowBlur` when it would tank fps.

### Interaction

Pointer drag (mouse or one finger) orbits; wheel/pinch zooms (clamp dist 8..40); drag
movement above 6 px suppresses click. Keyboard: none required. Pointer events must
`preventDefault` on wheel only when the engine owns the gesture.

### Math (must be pure, exported on `TT.Engine.math`)

```js
TT.Engine.math.eye(camera) -> [ex,ey,ez]
TT.Engine.math.project(camera, viewport, point) -> {x,y,scale,depth,visible}
   // viewport {w,h}
TT.Engine.math.screenToPlane(camera, viewport, sx, sy, planeY) -> [x,planeY,z] | null
TT.Engine.math.defaultCamera() -> {yaw:32,pitch:26,dist:18,target:[0,1.2,0]}
TT.Engine.math.pickRadiusFor(spec, projected) -> px
```

Tests (`tests/engine.test.mjs`, `node --test`): load the file text, run
`new Function('TT', 'window', 'document', src)(TT, undefined, undefined)` and assert:
projection of the target maps near viewport center; nearer points project larger;
screenToPlane inverse of projection on the ground; default camera sane; picking radius
scales with distance. Keep `TT.Engine.math` free of DOM access.

## 6. Circuit contract — `src/client/20-circuit.js` (circuit-dev)

Pure model mirroring the protocol's on-chain netlist. Node-testable, no DOM.

```js
TT.Circuit.makeNetlist({ nIn, gates:[{a,b},...], outputs:[nodeId,...],
                         nState=0, firstLatchInput=null }) -> netlist
// netlist = { nIn, nOut, nState, gates:[{a,b}], outputs:[...] } (frozen copy)
// node ids: 0=const0, 1=const1, inputs 2..2+nIn-1, gate i output = 2+nIn+i.
// Latch outputs (for nState > 0) are the first nState nodes after all inputs:
//   node ids 2+nIn .. 2+nIn+nState-1. Gate outputs then start after the latches.
// Provide helper TT.Circuit.nodeIds(netlist) -> {c0:0,c1:1,inputs:[...],latches:[...],gateStart}

TT.Circuit.evaluate(netlist, inputBits /* int, bit i = input i */,
                    opts?) -> { signals:number[], outputs:number[], outputBits:number }
// signals length 2+nIn+nState+gates.length; gate outputs computed in array order (a,b
// must already be computed -> validation); latch values passed in opts.stateBits (int).

TT.Circuit.gateBytes(netlist) -> Uint8Array   // 7 bytes per gate: 00, A>>16, A>>8, A&255, B>>16, B>>8, B&255
TT.Circuit.gateHex(netlist) -> '0x' + lowercase hex (14 hex chars per gate)
TT.Circuit.gateCount(netlist), TT.Circuit.maxDepth(netlist)
TT.Circuit.validateNetlist(netlist) -> { ok, error? } // catches forward refs, out-of-range, missing outputs

TT.Circuit.truthTable(netlist) -> [{ inputBits, outputs:[...], outputBits }]  // 2^nIn rows
TT.Circuit.exhaustiveVerify(netlist, expectedFn) -> {
  passed, rows: [{ inputBits, actualBits, expectedBits, ok }], mismatches, count,
  gateCount, maxDepth }
// expectedFn(inputBits) -> expected output bits (int). Count up to 65536 rows; validate
// first; a mismatch list is capped for display (keep first 8 + total count).
TT.Circuit.equivalent(a, b) -> bool // same nIn/nOut and output bits for all inputs

TT.Circuit.canonical = {
  halfAdder():   netlist nIn=2, 5 gates, outputs [sum, carry],
  fullAdder():   netlist nIn=3, 9 gates, outputs [sum, carry],
  fourBitAdder():netlist nIn=9 (A0..A3,B0..B3,Cin), 36 gates, outputs [S0..S3,Cout],
  srLatch():     nIn=2 (S,R), nState=2, outputs [Q, Qn], 2 gates,
}
// canonical builders must be correct: half adder = XOR/AND of two bits; full adder =
// three-bit sum; 4-bit adder = A + B + Cin over 4 bits; srLatch = classic cross-coupled
// NAND (S=R=1 hold, S=0 sets, R=0 resets).

TT.Circuit.compose({ nIn, parts }) -> netlist
// parts = [{ netlist, inputNodes:[outerNodeId per part input], outputNodes:[...] }]
// Splice part gates into one flat netlist, remapping part node ids to new outer ids.
// Used by the "LEGO" chapter (two half adders + OR -> full adder). Validate that every
// mapped input exists; return a flat netlist whose nodes are renumbered densely.

TT.Circuit.reference = {
  nand(a,b), not(a), and(a,b), or(a,b), xor(a,b) -> truth-table helpers for tests
}
```

Tests (`tests/logic.test.mjs`): exhaustive half-adder/full-adder/4-bit-adder truth tables
against arithmetic; 7-byte layout; validation errors; compose yields the same truth table
as `fullAdder()` when using two half adders + OR; srLatch set/hold/reset sequences; a
16-input netlist exhaustive verify completes and counts 65536.

## 7. Visual/game design (context; Lead implements)

7 chapters, each a self-contained mission on the same 3D die:

1. **铸币 · 晶体管** — mint NAND chips (click glowing chips on the wafer), token counter.
2. **与非门 · 谁都能算** — place a NAND gate, wire two input pads, toggle A/B, verify the
   truth table (4/4 rows light up).
3. **半加器 · 5 颗晶体管** — place 5 gates into guided slots, wire them, exhaustive check
   of SUM/CARRY against real addition.
4. **流片 · 蚀刻成 NFT** — press TAPE OUT: chips dissolve, bytecode streams (7 bytes/gate),
   NFT crystal forms, token balance drops by the gate count.
5. **时钟 · 记忆** — SR latch: set/hold/reset across block beats (0.45 s), state survives
   ticks; shows why the chain drives it.
6. **乐高 · 黑盒复用** — drop two half-adder black boxes + OR, wire 5 connections, verify
   3-bit sum, tape out a 9-transistor full adder.
7. **巨兽 · 链上 CPU** — zoom out to a die-shot Behemoth, run `3 + 5`, watch block-driven
   clock, 7-seg output; free-play end card with the protocol facts.

Chrome: top bar = title + toolbar (chapter dots, camera reset, codex, pause) with a
macOS traffic-light-safe top strip; overlays: mission card (checklist + hint), action dock
(contextual buttons), telemetry panel (NAND balance, circuits, clocks, netlist hex, output
LEDs), bottom block ticker. Everything must work in light and dark themes and at narrow
widths (drawer mode). Lead owns this chrome.

## 8. Coordination

- Reply to the Lead with: files written, tests run + results, deviations from the
  contract, and what the Lead must call. Do not touch the Lead's files.
- Use the shared task board: list tasks, claim your task with its revision, complete it.
- Prefer a clean, dependency-free implementation over cleverness. If in doubt, keep the
  public API exactly as specified here; extra internal helpers are fine.
