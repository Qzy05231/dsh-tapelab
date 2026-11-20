/**
 * 52-apps-sim — interactive simulations for DeWeb, TapeRelay and containers,
 * unlocked as bonus tasks inside the relevant chapters.
 */

TT.AppSims = (function () {
  const SIMS = [
    { id: 'deweb', chapter: 3, titleKey: 'sim.deweb.title', subKey: 'sim.deweb.sub', icon: '🌐' },
    { id: 'relay', chapter: 4, titleKey: 'sim.relay.title', subKey: 'sim.relay.sub', icon: '📡' },
    { id: 'container', chapter: 5, titleKey: 'sim.container.title', subKey: 'sim.container.sub', icon: '📦' },
  ]

  function hash32(text) {
    let hash = 0x811c9dc5
    const string = String(text)
    for (let i = 0; i < string.length; i += 1) {
      hash ^= string.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash >>> 0
  }

  function hex(value, pad) {
    return (value >>> 0).toString(16).padStart(pad || 8, '0')
  }

  function chunkFile(name, chunks) {
    const count = Math.max(1, Number(chunks) || 4)
    const list = []
    for (let index = 0; index < count; index += 1) {
      list.push({ index, hash: hex(hash32(`${name}|chunk|${index}`)), size: '1 MiB' })
    }
    return list
  }

  function dewebAddress(name) {
    return `deweb://${hex(hash32('deweb|' + name))}`
  }

  function imageHash(config) {
    return `sha256:${hex(hash32(JSON.stringify(config)))}…`
  }

  function verifyChunk(chunk, tampered) {
    const expected = chunk.hash
    const actual = tampered ? hex(hash32(chunk.hash + '|tampered')) : expected
    return { ok: expected === actual, expected, actual }
  }

  function simByChapter(chapter) {
    return SIMS.find((sim) => sim.chapter === Number(chapter)) || null
  }

  function simById(id) {
    return SIMS.find((sim) => sim.id === id) || null
  }

  return { SIMS, hash32, hex, chunkFile, dewebAddress, imageHash, verifyChunk, simByChapter, simById }
})()

// --------------------------------------------------------------------------- UI

TT.AppSimsUI = (function () {
  const h = TT.h

  function Frame(props) {
    const { sim, t, api, step, total, children, log, onDone, done } = props
    return h('div', { className: 'tt-welcome' },
      h('div', { className: 'tt-welcomecard tt-simcard' },
        h('div', { className: 'tt-achvhead' },
          h('h2', { className: 'tt-introtitle' }, `${sim.icon} ${t(sim.titleKey)}`),
          h('button', { type: 'button', className: 'tt-achvclose', onClick: () => api.dispatch({ type: 'sims/close' }) }, '✕'),
        ),
        h('p', { className: 'tt-introbody' }, t(sim.subKey)),
        h('div', { className: 'tt-simsteps' }, Array.from({ length: total }, (_, index) =>
          h('span', { key: index, className: 'tt-simstep', 'data-active': index === step ? 'true' : 'false', 'data-done': index < step ? 'true' : 'false' },
            `${index + 1}`))),
        h('div', { className: 'tt-simbody' }, children),
        log.length
          ? h('div', { className: 'tt-simlog' }, log.slice(0, 6).map((entry, index) =>
              h('div', { key: index, className: 'tt-simlogline', 'data-tone': entry.tone || 'info' }, entry.text)))
          : null,
        h('div', { className: 'tt-labrow', style: { marginTop: 8 } },
          done
            ? h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: onDone }, t('sim.common.finish'))
            : h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost', onClick: () => api.dispatch({ type: 'sims/close' }) }, t('sim.common.later')),
        ),
      ),
    )
  }

  function DeWeb({ t, api, onDone }) {
    const [step, setStep] = React.useState(0)
    const [log, setLog] = React.useState([])
    const [content, setContent] = React.useState('')
    const add = (text, tone) => setLog((list) => [{ text, tone }, ...list].slice(0, 6))
    const address = content ? TT.AppSims.dewebAddress(content) : ''
    return h(Frame, { sim: TT.AppSims.simById('deweb'), t, api, step, total: 4, log, onDone, done: step >= 4 },
      step === 0 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.deweb.step0')),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => { setContent('landing-page'); add(t('sim.deweb.log.content'), 'good'); setStep(1) } }, t('sim.deweb.contentPage')),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => { setContent('2gb-video'); add(t('sim.deweb.log.contentBig'), 'good'); setStep(1) } }, t('sim.deweb.contentVideo')),
        ),
      ) : null,
      step === 1 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.deweb.step1')),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => { add(t('sim.deweb.log.pointerOk'), 'good'); setStep(2) } }, t('sim.deweb.onlyPointer')),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => add(t('sim.deweb.log.pointerBad'), 'bad') }, t('sim.deweb.wholeChain')),
        ),
      ) : null,
      step === 2 ? h('div', null,
        h('p', { className: 'tt-simtext' }, `${t('sim.deweb.address')} ${address}`),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.deweb.log.published'), 'good'); setStep(3) } }, t('sim.deweb.publish')),
      ) : null,
      step === 3 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.deweb.step3')),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => add(t('sim.deweb.log.tamper'), 'bad') }, t('sim.deweb.tamper')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.deweb.log.open'), 'good'); setStep(4) } }, t('sim.deweb.open')),
        ),
      ) : null,
      step >= 4 ? h('p', { className: 'tt-simtext' }, t('sim.deweb.finish')) : null,
    )
  }

  function Relay({ t, api, onDone }) {
    const [step, setStep] = React.useState(0)
    const [log, setLog] = React.useState([])
    const add = (text, tone) => setLog((list) => [{ text, tone }, ...list].slice(0, 6))
    const chunks = TT.AppSims.chunkFile('demo-video', 4)
    return h(Frame, { sim: TT.AppSims.simById('relay'), t, api, step, total: 5, log, onDone, done: step >= 5 },
      step === 0 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.relay.step0')),
        h('div', { className: 'tt-chunkrow' }, chunks.map((chunk) =>
          h('span', { key: chunk.index, className: 'tt-chunk' }, `#${chunk.index + 1}`, h('em', null, chunk.hash)))),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.relay.log.split'), 'good'); setStep(1) } }, t('sim.relay.split')),
      ) : null,
      step === 1 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.relay.step1')),
        h('div', { className: 'tt-noderow' }, ['A', 'B', 'C'].map((name) =>
          h('span', { key: name, className: 'tt-node' }, `Relay ${name}`, h('em', null, '3/3 chunks')))),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.relay.log.replicated'), 'good'); setStep(2) } }, t('sim.relay.replicate')),
      ) : null,
      step === 2 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.relay.step2')),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.relay.log.recovered'), 'good'); setStep(3) } }, t('sim.relay.recover')),
      ) : null,
      step === 3 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.relay.step3')),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => add(t('sim.relay.log.tampered'), 'bad') }, t('sim.relay.tamper')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.relay.log.verified'), 'good'); setStep(4) } }, t('sim.relay.verify')),
        ),
      ) : null,
      step === 4 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.relay.step4')),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.relay.log.sent'), 'good'); setStep(5) } }, t('sim.relay.send')),
      ) : null,
      step >= 5 ? h('p', { className: 'tt-simtext' }, t('sim.relay.finish')) : null,
    )
  }

  function Container({ t, api, onDone }) {
    const [step, setStep] = React.useState(0)
    const [log, setLog] = React.useState([])
    const add = (text, tone) => setLog((list) => [{ text, tone }, ...list].slice(0, 6))
    const image = TT.AppSims.imageHash({ base: 'tapeos-min', circuit: 'half-adder', app: 'deweb-site' })
    return h(Frame, { sim: TT.AppSims.simById('container'), t, api, step, total: 5, log, onDone, done: step >= 5 },
      step === 0 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.container.step0')),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => { add(t('sim.container.log.baseOk'), 'good'); setStep(1) } }, t('sim.container.baseMin')),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => add(t('sim.container.log.baseBad'), 'bad') }, t('sim.container.baseBig')),
        ),
      ) : null,
      step === 1 ? h('div', null,
        h('p', { className: 'tt-simtext' }, `${t('sim.container.image')} ${image}`),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.container.log.packed'), 'good'); setStep(2) } }, t('sim.container.pack')),
      ) : null,
      step === 2 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.container.step2')),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => { add(t('sim.container.log.authOk'), 'good'); setStep(3) } }, t('sim.container.authNft')),
          h('button', { type: 'button', className: 'tt-chip', onClick: () => add(t('sim.container.log.authBad'), 'bad') }, t('sim.container.authAccount')),
        ),
      ) : null,
      step === 3 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.container.step3')),
        h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.container.log.limited'), 'good'); setStep(4) } }, t('sim.container.limit')),
      ) : null,
      step === 4 ? h('div', null,
        h('p', { className: 'tt-simtext' }, t('sim.container.step4')),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => add(t('sim.container.log.tamper'), 'bad') }, t('sim.container.tamper')),
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => { add(t('sim.container.log.running'), 'good'); setStep(5) } }, t('sim.container.run')),
        ),
      ) : null,
      step >= 5 ? h('p', { className: 'tt-simtext' }, t('sim.container.finish')) : null,
    )
  }

  function Page(props) {
    const { sim, t, api } = props
    const definition = TT.AppSims.simById(sim)
    if (!definition) return null
    const onDone = () => {
      if (TT.Audio) TT.Audio.play('success')
      api.dispatch({ type: 'sims/complete', id: definition.id })
      api.dispatch({ type: 'sims/close' })
    }
    if (sim === 'deweb') return h(DeWeb, { t, api, onDone })
    if (sim === 'relay') return h(Relay, { t, api, onDone })
    return h(Container, { t, api, onDone })
  }

  return { Page }
})()
