/**
 * 51-ecosystem — the TapeOut ecosystem map: drifting, colorful project bubbles.
 * Canvas 2D physics (no WebGL), click a bubble for its intro and official links.
 * Project data is a community-curated snapshot from TapeOut official/news channels.
 */

TT.Ecosystem = (function () {
  const CATEGORIES = {
    protocol: { key: 'eco.cat.protocol', color: '#2be6c2', glow: 'rgba(43,230,194,.55)' },
    infra: { key: 'eco.cat.infra', color: '#56e1ff', glow: 'rgba(86,225,255,.55)' },
    ai: { key: 'eco.cat.ai', color: '#b38cff', glow: 'rgba(179,140,255,.55)' },
    game: { key: 'eco.cat.game', color: '#ff6ad5', glow: 'rgba(255,106,213,.55)' },
    tool: { key: 'eco.cat.tool', color: '#ffc35c', glow: 'rgba(255,195,92,.55)' },
    community: { key: 'eco.cat.community', color: '#ff8f9a', glow: 'rgba(255,143,154,.55)' },
  }

  const PROJECTS = [
    { id: 'tapeout', name: 'TapeOut', category: 'protocol', radius: 62, desc: '底层协议：把与非门做成 ERC-1155 Token，把电路做成 ERC-721 NFT，用出块当 CPU 时钟。', links: [{ label: '官网', url: 'https://tapeout.link' }, { label: 'X', url: 'https://x.com/TapeOutWorld' }] },
    { id: 'taperelay', name: 'TapeRelay', category: 'infra', radius: 58, desc: '去中心化存储/通讯层：1 MiB 分块、三副本、链下消息零 gas，文件走 relay、链上只记身份。', links: [{ label: '官方详解', url: 'https://tapeout.link/news/2123414239326970035' }] },
    { id: 'tapeai', name: 'TapeAI', category: 'ai', radius: 52, desc: 'Agent 生态与激励层（TAI）：检察官质押、任务激励，探索 Agent 与 TapeOut 电路结合。', links: [{ label: 'X', url: 'https://x.com/TapeAIAgent' }] },
    { id: 'tapefly', name: 'TapeFly', category: 'game', radius: 54, desc: '消费级入口游戏：搭一只果蝇、接上电路大脑，通关获得 Genesis Passport。', links: [{ label: 'X', url: 'https://x.com/fruitfly_world' }] },
    { id: 'tapecircle', name: 'TapeCircle', category: 'community', radius: 50, desc: '社区入口：基于 TapeRelay 的 Chat、红包与 NFT 交易分享卡，目标成为社区协作空间。', links: [{ label: '相关资讯', url: 'https://tapeout.link/news/2123270100350538022' }] },
    { id: 'tapemine', name: 'TapeMine', category: 'infra', radius: 50, desc: '矿机与官方最优矿池：Behemoth 二期集结 NAND，按电路设计与贡献分配算力。', links: [{ label: 'X', url: 'https://x.com/tapemineworld' }] },
    { id: 'behemoth', name: 'Behemoth', category: 'infra', radius: 48, desc: '官方最优矿池与链上 CPU 叙事：按 4004 规格打造的巨兽，矿池二期持续集结。', links: [{ label: '矿池资讯', url: 'https://tapeout.link/news/2123115377332781272' }] },
    { id: 'owlgate', name: 'OwlGate', category: 'tool', radius: 44, desc: '矿机二级市场行情：公平价看板、地板价、24h/7d 成交与折价提醒。', links: [{ label: 'X', url: 'https://x.com/owlgatecli' }] },
    { id: 'market', name: 'TapeOut Market', category: 'tool', radius: 44, desc: '市场与回购燃烧：手续费按承诺回购 BEM 并打入黑洞，同时做画布/链上指针科普。', links: [{ label: 'X', url: 'https://x.com/tapeoutmarket_x' }] },
    { id: 'tapemonkey', name: 'TAPEMONKEY', category: 'game', radius: 46, desc: '游戏化叙事：LATCH 家族角色、一比特记忆撑桥原型与概念短片。', links: [{ label: 'X', url: 'https://x.com/Tapemonkeworld' }] },
    { id: 'ember', name: 'Ember World', category: 'game', radius: 46, desc: '余烬世界：链上游戏经济，铜币流水/销毁与 20 卡收益测算常被社区讨论。', links: [{ label: 'Demo Day', url: 'https://tapeout.link/news/2119045725229380035' }] },
    { id: 'laika', name: 'Laika', category: 'game', radius: 42, desc: 'X Layer × TapeOut 首期 Demo Day 亮相项目之一。', links: [{ label: 'Demo Day', url: 'https://tapeout.link/news/2119045725229380035' }] },
    { id: 'tapelaunch', name: 'TapeLaunch', category: 'tool', radius: 42, desc: 'Demo Day 亮相的发射/应用项目，围绕 TapeOut 资产与社区分发。', links: [{ label: 'Demo Day', url: 'https://tapeout.link/news/2119045725229380035' }] },
    { id: 'fusebox', name: 'Fusebox', category: 'tool', radius: 44, desc: '可验证支付守卫：AI Agent 付款先经已流片电路检查（名单、额度、冻结开关）再放行。', links: [{ label: '应用构想', url: 'https://tapeout.link/news/2123239326687617076' }] },
    { id: 'deweb', name: 'DeWEB / TapeSend / TapeCode', category: 'infra', radius: 48, desc: '去中心化 Web 组件：可验证网站发布、无 gas 消息与大文件传输，围绕 TapeRelay 扩展。', links: [{ label: '相关资讯', url: 'https://tapeout.link/news/2123337199848714626' }] },
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

  function rng(seed) {
    let value = seed >>> 0 || 1
    return () => {
      value ^= value << 13
      value ^= value >>> 17
      value ^= value << 5
      value >>>= 0
      return value / 4294967296
    }
  }

  function makeBubbles(width, height) {
    const random = rng(20261120)
    return PROJECTS.map((project) => {
      const radius = Math.max(30, project.radius * Math.min(1, width / 900))
      return {
        id: project.id,
        x: radius + random() * Math.max(1, width - radius * 2),
        y: radius + random() * Math.max(1, height - radius * 2),
        vx: (random() - 0.5) * 0.35,
        vy: (random() - 0.5) * 0.35,
        r: radius,
        phase: random() * Math.PI * 2,
      }
    })
  }

  function hitTest(bubbles, x, y) {
    for (let index = bubbles.length - 1; index >= 0; index -= 1) {
      const bubble = bubbles[index]
      const dx = x - bubble.x
      const dy = y - bubble.y
      if (dx * dx + dy * dy <= (bubble.r + 4) * (bubble.r + 4)) return bubble.id
    }
    return null
  }

  function step(bubbles, width, height, dt) {
    const time = dt || 1
    for (const bubble of bubbles) {
      // gentle random wander
      bubble.vx += (Math.random() - 0.5) * 0.02 * time
      bubble.vy += (Math.random() - 0.5) * 0.02 * time
      const speed = Math.hypot(bubble.vx, bubble.vy)
      const cap = 0.55
      if (speed > cap) {
        bubble.vx = (bubble.vx / speed) * cap
        bubble.vy = (bubble.vy / speed) * cap
      }
      bubble.x += bubble.vx * time
      bubble.y += bubble.vy * time
      if (bubble.x - bubble.r < 0) { bubble.x = bubble.r; bubble.vx = Math.abs(bubble.vx) }
      if (bubble.x + bubble.r > width) { bubble.x = width - bubble.r; bubble.vx = -Math.abs(bubble.vx) }
      if (bubble.y - bubble.r < 0) { bubble.y = bubble.r; bubble.vy = Math.abs(bubble.vy) }
      if (bubble.y + bubble.r > height) { bubble.y = height - bubble.r; bubble.vy = -Math.abs(bubble.vy) }
      bubble.phase += 0.01 * time
    }
    // soft circle collisions
    for (let i = 0; i < bubbles.length; i += 1) {
      for (let j = i + 1; j < bubbles.length; j += 1) {
        const a = bubbles[i]
        const b = bubbles[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.hypot(dx, dy) || 0.001
        const min = a.r + b.r + 2
        if (distance < min) {
          const push = (min - distance) / 2
          const nx = dx / distance
          const ny = dy / distance
          a.x -= nx * push
          a.y -= ny * push
          b.x += nx * push
          b.y += ny * push
          const dvx = b.vx - a.vx
          const dvy = b.vy - a.vy
          const dot = dvx * nx + dvy * ny
          if (dot < 0) {
            a.vx += nx * dot
            a.vy += ny * dot
            b.vx -= nx * dot
            b.vy -= ny * dot
          }
        }
      }
    }
    return bubbles
  }

  function byId(id) {
    return PROJECTS.find((project) => project.id === id) || null
  }

  return { CATEGORIES, PROJECTS, hash32, makeBubbles, hitTest, step, byId }
})()

// --------------------------------------------------------------------------- UI

TT.EcosystemUI = (function () {
  const h = TT.h

  function Page(props) {
    const { state, t, api } = props
    const canvasRef = React.useRef(null)
    const wrapRef = React.useRef(null)
    const bubblesRef = React.useRef([])
    const sizeRef = React.useRef({ w: 900, h: 600 })
    const runningRef = React.useRef(true)
    const hoverRef = React.useRef(null)
    const selectedRef = React.useRef(null)
    const [running, setRunning] = React.useState(true)
    const [selectedId, setSelectedId] = React.useState(null)
    const [hoverId, setHoverId] = React.useState(null)

    React.useEffect(() => {
      runningRef.current = running
    }, [running])
    React.useEffect(() => {
      hoverRef.current = hoverId
      if (canvasRef.current) canvasRef.current.style.cursor = hoverId ? 'pointer' : 'grab'
    }, [hoverId])
    React.useEffect(() => {
      selectedRef.current = selectedId
    }, [selectedId])

    React.useEffect(() => {
      const canvas = canvasRef.current
      const wrap = wrapRef.current
      if (!canvas || !wrap) return undefined
      const context = canvas.getContext('2d')
      if (!context) return undefined

      const resize = () => {
        const rect = wrap.getBoundingClientRect()
        const width = Math.max(320, rect.width)
        const height = Math.max(260, rect.height)
        const ratio = Math.min(2, window.devicePixelRatio || 1)
        canvas.width = Math.floor(width * ratio)
        canvas.height = Math.floor(height * ratio)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        const previous = sizeRef.current
        if (bubblesRef.current.length === 0) {
          bubblesRef.current = TT.Ecosystem.makeBubbles(width, height)
        } else if (previous.w && previous.h) {
          for (const bubble of bubblesRef.current) {
            bubble.x = (bubble.x / previous.w) * width
            bubble.y = (bubble.y / previous.h) * height
          }
        }
        sizeRef.current = { w: width, h: height }
        context.setTransform(ratio, 0, 0, ratio, 0, 0)
      }
      resize()
      window.addEventListener('resize', resize)

      let frame = 0
      let last = performance.now()
      const draw = (now) => {
        const dt = Math.min(2, (now - last) / 16.7)
        last = now
        const width = sizeRef.current.w
        const height = sizeRef.current.h
        if (runningRef.current) TT.Ecosystem.step(bubblesRef.current, width, height, dt)
        context.clearRect(0, 0, width, height)
        const bg = context.createLinearGradient(0, 0, width, height)
        bg.addColorStop(0, '#050b14')
        bg.addColorStop(0.55, '#071b2a')
        bg.addColorStop(1, '#0d1f33')
        context.fillStyle = bg
        context.fillRect(0, 0, width, height)
        // faint grid
        context.strokeStyle = 'rgba(86,225,255,.05)'
        context.lineWidth = 1
        for (let x = 0; x < width; x += 64) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke() }
        for (let y = 0; y < height; y += 64) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke() }
        for (const bubble of bubblesRef.current) {
          const project = TT.Ecosystem.byId(bubble.id)
          const category = TT.Ecosystem.CATEGORIES[project.category]
          const selected = selectedRef.current === bubble.id
          const hovered = hoverRef.current === bubble.id
          const pulse = 1 + Math.sin(bubble.phase) * 0.02
          const radius = bubble.r * (selected ? 1.08 : hovered ? 1.04 : pulse)
          const gradient = context.createRadialGradient(
            bubble.x - radius * 0.35, bubble.y - radius * 0.4, radius * 0.1,
            bubble.x, bubble.y, radius,
          )
          gradient.addColorStop(0, category.color + 'ee')
          gradient.addColorStop(0.55, category.color + '99')
          gradient.addColorStop(1, category.color + '22')
          context.save()
          context.shadowColor = category.glow
          context.shadowBlur = selected || hovered ? 28 : 14
          context.beginPath()
          context.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2)
          context.fillStyle = gradient
          context.fill()
          context.lineWidth = selected ? 2.4 : 1.2
          context.strokeStyle = selected ? '#e8f6ff' : category.color + 'cc'
          context.stroke()
          context.restore()
          // label
          const label = project.name
          context.fillStyle = 'rgba(4,12,20,.85)'
          context.font = `600 ${Math.max(10, radius * 0.22)}px ui-sans-serif, -apple-system, sans-serif`
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          const lines = label.length > 13 ? label.split(' / ') : [label]
          const lineHeight = Math.max(11, radius * 0.26)
          lines.slice(0, 2).forEach((line, index) => {
            context.fillText(line, bubble.x, bubble.y + (index - (lines.length - 1) / 2) * lineHeight)
          })
        }
        frame = requestAnimationFrame(draw)
      }
      frame = requestAnimationFrame(draw)
      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('resize', resize)
      }
    }, [])

    function coords(event) {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    function onMove(event) {
      const position = coords(event)
      setHoverId(TT.Ecosystem.hitTest(bubblesRef.current, position.x, position.y))
    }

    function onClick(event) {
      const position = coords(event)
      const id = TT.Ecosystem.hitTest(bubblesRef.current, position.x, position.y)
      setSelectedId(id)
    }

    function randomize() {
      bubblesRef.current = TT.Ecosystem.makeBubbles(sizeRef.current.w, sizeRef.current.h)
      setSelectedId(null)
    }

    const project = selectedId ? TT.Ecosystem.byId(selectedId) : null
    const legend = Object.keys(TT.Ecosystem.CATEGORIES).map((key) => {
      const category = TT.Ecosystem.CATEGORIES[key]
      return h('span', { key, className: 'tt-eco-legend' },
        h('i', { style: { background: category.color } }), t(category.key))
    })

    return h('div', { className: 'tt-labview tt-ecoview' },
      h('div', { className: 'tt-eco-head' },
        h('div', { className: 'tt-eco-title' },
          h('div', { className: 'tt-labadge' }, t('eco.badge')),
          h('h2', null, t('eco.title')),
          h('p', null, t('eco.sub')),
        ),
        h('div', { className: 'tt-eco-controls' },
          h('button', { type: 'button', className: 'tt-chip', onClick: () => setRunning((value) => !value) }, running ? `⏸ ${t('eco.pause')}` : `▶ ${t('eco.play')}`),
          h('button', { type: 'button', className: 'tt-chip', onClick: randomize }, `🎲 ${t('eco.shuffle')}`),
          h('span', { className: 'tt-lablabel' }, `${TT.Ecosystem.PROJECTS.length} ${t('eco.projects')}`),
        ),
      ),
      h('div', { className: 'tt-eco-legendrow' }, legend),
      h('div', { className: 'tt-eco-canvaswrap', ref: wrapRef },
        h('canvas', {
          ref: canvasRef,
          className: 'tt-eco-canvas',
          onPointerMove: onMove,
          onPointerLeave: () => setHoverId(null),
          onClick,
        }),
        project
          ? h('aside', { className: 'tt-eco-detail' },
              h('button', { type: 'button', className: 'tt-achvclose', onClick: () => setSelectedId(null) }, '✕'),
              h('span', { className: 'tt-newstag' }, t(TT.Ecosystem.CATEGORIES[project.category].key)),
              h('h3', null, project.name),
              h('p', null, project.desc),
              h('div', { className: 'tt-eco-links' }, project.links.map((link) =>
                h('a', { key: link.url, className: 'tt-chip', href: link.url, target: '_blank', rel: 'noreferrer noopener' }, `${link.label} ↗`))),
            )
          : null,
      ),
      h('p', { className: 'tt-finalenote', style: { marginBottom: 0 } }, t('eco.disclaimer')),
    )
  }

  return { Page }
})()
