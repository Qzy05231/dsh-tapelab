/**
 * 51-ecosystem — the TapeOut ecosystem map: drifting, colorful project bubbles.
 * Canvas 2D physics (no WebGL), click a bubble for its intro and official links.
 * Project data is a community-curated snapshot from TapeOut official/news channels.
 */

TT.Ecosystem = (function () {
  const CATEGORIES = {
    protocol: { key: 'eco.cat.protocol', color: '#b38cff' },
    official: { key: 'eco.cat.official', color: '#ffc35c' },
    infra: { key: 'eco.cat.infra', color: '#56e1ff' },
    ai: { key: 'eco.cat.ai', color: '#2be6c2' },
    launchpad: { key: 'eco.cat.launchpad', color: '#ff8fd0' },
    community: { key: 'eco.cat.community', color: '#ff8f9a' },
  }

  // TapeOut official entry points (Official category) plus the official protocol site.
  const PROJECTS = [
    { id: 'tapeout', name: 'TapeOut', symbol: '⊗', sub: '协议主站', category: 'protocol', radius: 78, desc: '官方链上流片协议：铸造 NAND / LATCH 元件，在画布上连线组成电路，再流片为电路 NFT。', links: [{ label: '官网', url: 'https://tapeout.net/' }] },
    { id: 'linux', name: 'TapeOut Linux', symbol: '🐧', sub: '链上 Linux', category: 'official', radius: 52, desc: '官方展示：第一条原生运行在 L1 主网上的 Linux，每条 RISC-V 指令由真实的 BNB Chain 交易执行。', links: [{ label: '体验', url: 'https://tapeout.net/linux.html' }] },
    { id: 'dashboard', name: 'Dashboard', symbol: '📊', sub: '官方数据', category: 'official', radius: 46, desc: 'TapeOut 官方数据面板：处理器与电路数量、铸造进度、BEM 交易、空投领取与活动热力图。', links: [{ label: '打开', url: 'https://tapeout.link/dashboard' }] },
    { id: 'guide', name: 'Beginner Guide', symbol: '📖', sub: '新手指南', category: 'official', radius: 44, desc: '官方新手指南：从 NAND 元件、画布连线到流片、挖矿与电路 NFT 的完整入门路径。', links: [{ label: '阅读', url: 'https://tapeout.link/guide' }] },
    { id: 'blonskr', name: 'Blonskr', symbol: 'X', sub: '官方公告', category: 'official', radius: 52, desc: 'TapeOut 发起人的官方账号：协议公告、产品发布与重大决策的首要发布渠道。', links: [{ label: 'X', url: 'https://x.com/blonskr' }] },
    { id: 'taperelay', name: 'TapeRelay', symbol: '📡', sub: '文件与消息', category: 'infra', radius: 66, desc: '官方 XIP 提案（与 X Layer）：客户端验证的去中心化文件与消息网络；1 MiB SHA-256 分块、零 gas 消息、5 个官方节点。', links: [{ label: '官网', url: 'https://taperelay.com/' }] },
    { id: 'relay', name: 'Relay Nodes', symbol: '🛰️', sub: '官方节点', category: 'infra', radius: 48, desc: 'TapeRelay 官方节点入口：relay1–relay5 五个官方节点，每电路每节点 5 GiB 免费额度。', links: [{ label: '节点页', url: 'https://tapeout.link/relay' }] },
    { id: 'tapekit', name: 'TapeKit', symbol: '🌐', sub: 'tape:// 网关', category: 'infra', radius: 60, desc: 'tape:// 的官方公共网关：把链上电路容器里的网站用普通浏览器打开；按链上地址跳转，内容哈希在浏览器端验证。', links: [{ label: '官网', url: 'https://tapekit.org/' }] },
    { id: 'tapecode', name: 'TapeCode.ai', symbol: '🤖', sub: 'AI 构建器', category: 'ai', radius: 60, desc: '官方 AI 应用构建器：一句话生成合约与前端，约 10 分钟上线；合约归你的电路容器所有。', links: [{ label: '官网', url: 'https://tapecode.ai/' }] },
    { id: 'tapehub', name: 'TapeHub.ai', symbol: '🚀', sub: '发行台', category: 'launchpad', radius: 62, desc: '官方生态发射台：创建挖矿币项目并用它铸造晶体管；毕业后 99% 池币与 5000 万项目币配对并上 PancakeSwap，95% 代币用于挖矿。', links: [{ label: '官网', url: 'https://tapehub.ai/' }] },
    { id: 'tapeoutx', name: 'TapeOut X', symbol: '𝕏', sub: '官方账号', category: 'community', radius: 46, desc: 'TapeOut 官方 X 账号：协议公告、产品更新与社区活动。', links: [{ label: 'X', url: 'https://x.com/TapeOutWorld' }] },
    { id: 'telegram', name: 'Telegram', symbol: '✈️', sub: '官方社区', category: 'community', radius: 42, desc: 'TapeOut 官方 Telegram 社区：公告、进展与日常讨论。', links: [{ label: '加入', url: 'https://t.me/TapeOutnet' }] },
    { id: 'news', name: 'News', symbol: '📰', sub: '官方资讯', category: 'official', radius: 44, desc: '官方每日资讯聚合：X 上 TapeOut 相关动态按事件合并，每日更新。', links: [{ label: '阅读', url: 'https://tapeout.link/news' }] },
    { id: 'roadmap', name: 'Roadmap', symbol: '🗺️', sub: '路线图', category: 'official', radius: 42, desc: 'TapeOut 官方路线图：协议、生态与产品的阶段规划。', links: [{ label: '查看', url: 'https://tapeout.link/roadmap' }] },
    { id: 'milestones', name: 'Milestones', symbol: '🏁', sub: '里程碑', category: 'official', radius: 40, desc: 'TapeOut 官方里程碑：协议与生态的关键进展记录。', links: [{ label: '查看', url: 'https://tapeout.link/milestones' }] },
    { id: 'articles', name: 'Articles', symbol: '📚', sub: '精选文章', category: 'official', radius: 40, desc: '官方精选文章与深度解读。', links: [{ label: '阅读', url: 'https://tapeout.link/articles' }] },
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
      const radius = Math.max(24, project.radius * Math.min(0.9, width / 1150))
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

  function hexToRgba(hex, alpha) {
    const value = String(hex || '#ffffff').replace('#', '')
    const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  function byId(id) {
    return PROJECTS.find((project) => project.id === id) || null
  }

  return { CATEGORIES, PROJECTS, hash32, makeBubbles, hitTest, step, byId, hexToRgba }
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
        // dark crypto-board background with colored nebulas
        context.fillStyle = '#070406'
        context.fillRect(0, 0, width, height)
        const nebula = (cx, cy, radius, color) => {
          const g = context.createRadialGradient(cx, cy, 0, cx, cy, radius)
          g.addColorStop(0, color)
          g.addColorStop(1, 'rgba(0,0,0,0)')
          context.fillStyle = g
          context.fillRect(0, 0, width, height)
        }
        nebula(width * 0.22, height * 0.18, Math.max(width, height) * 0.55, 'rgba(255,70,95,.10)')
        nebula(width * 0.82, height * 0.75, Math.max(width, height) * 0.5, 'rgba(140,80,255,.09)')
        // faint halo behind the whole cluster
        const cluster = context.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height) * 0.65)
        cluster.addColorStop(0, 'rgba(255,255,255,.025)')
        cluster.addColorStop(1, 'rgba(0,0,0,0)')
        context.fillStyle = cluster
        context.fillRect(0, 0, width, height)

        for (const bubble of bubblesRef.current) {
          const project = TT.Ecosystem.byId(bubble.id)
          const category = TT.Ecosystem.CATEGORIES[project.category]
          const selected = selectedRef.current === bubble.id
          const hovered = hoverRef.current === bubble.id
          const pulse = 1 + Math.sin(bubble.phase) * 0.015
          const radius = bubble.r * (selected ? 1.08 : hovered ? 1.04 : pulse)
          const color = category.color
          const rgba = TT.Ecosystem.hexToRgba

          // outer glow ring
          context.save()
          context.shadowColor = rgba(color, selected || hovered ? 0.85 : 0.55)
          context.shadowBlur = selected ? 34 : 20
          // transparent coin body: no colored fill, just a faint dark glass wash
          const body = context.createRadialGradient(
            bubble.x - radius * 0.18, bubble.y - radius * 0.22, radius * 0.1,
            bubble.x, bubble.y, radius,
          )
          body.addColorStop(0, 'rgba(18,10,14,0.34)')
          body.addColorStop(0.7, 'rgba(12,7,10,0.24)')
          body.addColorStop(1, 'rgba(8,4,7,0.1)')
          context.beginPath()
          context.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2)
          context.fillStyle = body
          context.fill()
          context.restore()

          // colored glowing rim (the only color in the bubble)
          context.beginPath()
          context.arc(bubble.x, bubble.y, radius * 0.985, 0, Math.PI * 2)
          context.lineWidth = selected ? 2.8 : 2
          context.strokeStyle = rgba(color, selected ? 1 : 0.88)
          context.stroke()
          // faint inner highlight ring for a glass edge
          context.beginPath()
          context.arc(bubble.x, bubble.y, radius * 0.94, 0, Math.PI * 2)
          context.lineWidth = 0.8
          context.strokeStyle = 'rgba(255,255,255,.08)'
          context.stroke()
          if (selected) {
            context.beginPath()
            context.arc(bubble.x, bubble.y, radius + 5, 0, Math.PI * 2)
            context.lineWidth = 1
            context.strokeStyle = 'rgba(255,255,255,.6)'
            context.stroke()
          }

          // icon
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillStyle = '#f6eef2'
          context.font = `700 ${Math.max(16, radius * 0.4)}px ui-sans-serif, -apple-system, sans-serif`
          context.fillText(project.symbol || project.name.slice(0, 2), bubble.x, bubble.y - radius * 0.2)

          // name
          const nameSize = Math.max(9, Math.min(15, radius * 0.17))
          context.fillStyle = '#f4edf1'
          context.font = `700 ${nameSize}px ui-sans-serif, -apple-system, sans-serif`
          context.shadowColor = 'rgba(0,0,0,.65)'
          context.shadowBlur = 4
          const words = String(project.name).split(' ')
          if (words.length > 1 && radius < 58) {
            context.fillText(words[0], bubble.x, bubble.y + radius * 0.12)
            context.fillText(words.slice(1).join(' '), bubble.x, bubble.y + radius * 0.12 + nameSize + 1)
          } else {
            context.fillText(project.name, bubble.x, bubble.y + radius * 0.14)
          }

          // colored sub label (like a percentage line)
          if (radius >= 48) {
            const subSize = Math.max(8, Math.min(12, radius * 0.11))
            context.fillStyle = rgba(color, 0.95)
            context.font = `600 ${subSize}px ui-sans-serif, -apple-system, sans-serif`
            context.shadowBlur = 3
            context.fillText(project.sub || '', bubble.x, bubble.y + radius * 0.44)
          }
          context.shadowColor = 'transparent'
          context.shadowBlur = 0
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
          h('a', { className: 'tt-chip', href: 'https://tapeout.link', target: '_blank', rel: 'noreferrer noopener' }, `${t('eco.source')} ↗`),
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
