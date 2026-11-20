/**
 * 50-version — version badge, changelog and a GitHub update check.
 * A browser plugin cannot silently replace itself, so the panel reports the latest
 * commit and gives the exact update steps/command instead.
 */

TT.Version = (function () {
  const VERSION = '1.6.3'
  const BUILT_AT = '2026-11-21'
  const REPO = 'https://github.com/Qzy05231/dsh-tapelab'
  const API = 'https://api.github.com/repos/Qzy05231/dsh-tapelab/commits/main'
  const COMMAND = 'git pull && node scripts/build.mjs'
  const CHANGELOG = [
    {
      version: '1.6.3',
      date: '2026-11-21',
      items: [
        '官方生态回归 6 个 Official 项目（TapeOut / Blonskr / TapeHub / TapeKit / TapeCode / TapeRelay）',
        '气泡改为参考图的深色币面 + 发光圆环 + 图标/名称/彩色副标题',
      ],
    },
    {
      version: '1.6.2',
      date: '2026-11-21',
      items: [
        '官方生态改为币圈气泡视觉：深色币面、彩色发光圆环、图标 + 名称 + 彩色副标题',
        '补充官方入口：官网、指南、Dashboard、TapeOut Linux、Relay Nodes、资讯/路线图/里程碑/文章/官方账号，共 16 颗气泡',
      ],
    },
    {
      version: '1.6.1',
      date: '2026-11-21',
      items: [
        '「生态版图」更名为「官方生态」，仅收录 tapeout.link Official 分类的 6 个官方入口',
        '气泡改为葡萄般的玻璃质感：高光、折射、葡萄光晕与半透明体积',
      ],
    },
    {
      version: '1.6.0',
      date: '2026-11-20',
      items: [
        '应用三章随机场景：篡改节点/分块/镜像层每局随机，错误选择计入失误',
        '支持在 3D 场景直接点击 relay 节点、分块和容器层进行检查',
        '挑战模式中错误选择会真实影响星级',
      ],
    },
    {
      version: '1.5.0',
      date: '2026-11-20',
      items: [
        '应用三章加深：DeWeb/ TapeRelay/ 容器从 3 步扩展到 5–7 步',
        '加入策略选择、副本数量、节点下线恢复、篡改校验与资源限额等失败分支',
      ],
    },
    {
      version: '1.4.0',
      date: '2026-11-20',
      items: [
        '主线扩展为 14 章：新增 DeWeb、TapeRelay、容器化部署三个独立章节',
        '三个新章节各有独立 3D 场景与任务/操作坞，终局与成就同步更新',
      ],
    },
    {
      version: '1.3.0',
      date: '2026-11-20',
      items: [
        '章节扩展任务：DeWeb 发布、TapeRelay 存储/消息、容器化部署模拟',
        '30 秒级分步互动：分块、三副本、篡改校验、NFT 权限与资源限额',
      ],
    },
    {
      version: '1.2.0',
      date: '2026-11-20',
      items: [
        'TapeOut 生态版图：漂移气泡、点击查看项目简介与官网/X',
        '顶层资讯板块：真实抓取 tapeout.link，每日 06:00 自动抓取',
        '版本与更新按钮：检查 GitHub 最新提交、更新日志与更新命令',
      ],
    },
    {
      version: '1.1.0',
      date: '2026-11-20',
      items: [
        '每日资讯顶层板块：tapeout.link 真实抓取 + 每日 06:00 自动抓取',
        '章节挑战模式：正常/挑战切换、计时、操作预算、失误、三星与变体挑战',
        '每日挑战、成就墙（18 枚）与 PNG 分享卡',
        'Verilog 导入与 nand-cli（synth / import / eval / verify / disasm）',
        '可验证门禁、抽奖、传感器、DeFi 守卫应用集',
        '街机难度与记录：贪吃蛇三档速度、排行榜、猜数计分、密码锁限次',
      ],
    },
    {
      version: '1.0.0',
      date: '2026-11-19',
      items: [
        '11 章主线：铸币 → 与非门 → 半加器 → 流片 → 锁存器 → 乐高 → 巨兽 → 七段 → 计数器 → 小计算机 → 安全电路',
        '实验室、游乐场、协议档案、音效与电影模式',
        '真实 TapeRover 安全网表与 64 项单测',
      ],
    },
  ]

  function isNewer(remoteIso) {
    const remote = Date.parse(remoteIso)
    const built = Date.parse(BUILT_AT + 'T23:59:59+08:00')
    return Number.isFinite(remote) && Number.isFinite(built) && remote > built
  }

  return { VERSION, BUILT_AT, REPO, API, COMMAND, CHANGELOG, isNewer }
})()

// --------------------------------------------------------------------------- UI

TT.VersionUI = (function () {
  const h = TT.h

  function Page(props) {
    const { t, api } = props
    const [status, setStatus] = React.useState('idle')
    const [commit, setCommit] = React.useState(null)
    const [newer, setNewer] = React.useState(false)

    async function check() {
      if (typeof fetch !== 'function') {
        setStatus('fail')
        return
      }
      setStatus('loading')
      try {
        const response = await fetch(TT.Version.API, { headers: { accept: 'application/vnd.github+json' } })
        if (!response.ok) throw new Error('HTTP ' + response.status)
        const data = await response.json()
        const info = {
          sha: String(data.sha || '').slice(0, 7),
          date: data.commit && data.commit.author ? data.commit.author.date : '',
          message: data.commit && data.commit.message ? data.commit.message.split('\n')[0] : '',
          url: data.html_url || TT.Version.REPO,
        }
        setCommit(info)
        setNewer(TT.Version.isNewer(info.date))
        setStatus('done')
      } catch (error) {
        setStatus('fail')
      }
    }

    function copyCommand() {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(TT.Version.COMMAND).then(
            () => api.dispatch({ type: 'toast/show', key: 'version.copied', tone: 'good' }),
            () => api.dispatch({ type: 'toast/show', key: 'version.copyFail', tone: 'warn' }),
          )
          return
        }
      } catch (error) {
        /* fall through */
      }
      api.dispatch({ type: 'toast/show', key: 'version.copied', tone: 'good' })
    }

    return h('div', { className: 'tt-welcome' },
      h('div', { className: 'tt-welcomecard tt-versioncard' },
        h('div', { className: 'tt-achvhead' },
          h('h2', { className: 'tt-introtitle' }, `🔄 ${t('version.title')}`),
          h('button', { type: 'button', className: 'tt-achvclose', onClick: () => api.dispatch({ type: 'update/close' }) }, '✕'),
        ),
        h('p', { className: 'tt-introbody' }, t('version.sub')),
        h('div', { className: 'tt-versionrow' },
          h('span', null, t('version.current')),
          h('b', null, `v${TT.Version.VERSION}`),
          h('span', null, `${t('version.built')} ${TT.Version.BUILT_AT}`),
        ),
        h('div', { className: 'tt-labrow' },
          h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', disabled: status === 'loading', onClick: check },
            status === 'loading' ? t('version.checking') : t('version.check')),
          h('a', { className: 'tt-chip', href: TT.Version.REPO, target: '_blank', rel: 'noreferrer noopener' }, t('version.github')),
        ),
        status === 'fail' ? h('p', { className: 'tt-finalenote', style: { borderLeftColor: 'var(--tt-red)' } }, t('version.fail')) : null,
        commit
          ? h('div', { className: 'tt-finalenote', style: { borderLeftColor: newer ? 'var(--tt-amber)' : 'var(--tt-mint)' } },
              h('div', null, `${newer ? t('version.hasNew') : t('version.latest')} · ${commit.sha}`),
              h('div', { style: { color: 'var(--tt-dim)', fontSize: 10.5 } }, `${commit.date ? new Date(commit.date).toLocaleString() : ''} · ${commit.message}`),
            )
          : null,
        h('div', { className: 'tt-versionsteps' },
          h('b', null, t('version.how')),
          h('p', null, t('version.howBody')),
          h('div', { className: 'tt-versioncmd' },
            h('code', null, TT.Version.COMMAND),
            h('button', { type: 'button', className: 'tt-chip', onClick: copyCommand }, t('version.copy')),
          ),
          h('p', { className: 'tt-finalenote', style: { marginBottom: 0 } }, t('version.note')),
        ),
        h('h4', { className: 'tt-newshead' }, t('version.changelog')),
        h('div', { className: 'tt-changelog' }, TT.Version.CHANGELOG.map((entry) =>
          h('div', { key: entry.version, className: 'tt-changelogentry' },
            h('b', null, `v${entry.version} · ${entry.date}`),
            h('ul', null, entry.items.map((item) => h('li', { key: item }, item))),
          ))),
      ),
    )
  }

  return { Page }
})()
