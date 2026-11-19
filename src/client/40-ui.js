/**
 * 40-ui — locale dictionaries, panel chrome, HUD, codex.
 *
 * The chrome (top bar) is host-themed and reserves the macOS window-chrome bands:
 * `--dsh-frame-top-clearance` keeps the title and toolbar below the hiddenInset
 * traffic lights, and `--dsh-frame-leading-clearance` keeps them clear of the
 * window controls that mount at the top-left when the sidebar is collapsed.
 * The HUD over the 3D scene is part of the artwork and uses its own dark glass.
 */

TT.dict = {
  zh: {
    'panel.title': 'TapeOut 3D 实验室',
    'panel.subtitle': '从一颗与非门到链上巨兽',
    'panel.close': '返回对话',
    'panel.codex': '协议档案',
    'panel.reset': '重置本关',
    'panel.hint': '提示',
    'panel.pause': '暂停演示',
    'panel.resume': '继续演示',
    'panel.speed': '慢放 ×4',
    'panel.speedNormal': '恢复实时',
    'panel.camera': '重置镜头',
    'panel.chapterRail': '章节',
    'panel.data': '数据面板',
    'panel.dataHide': '收起数据',
    'panel.introStart': '开始任务',
    'panel.intro': '章节说明',
    'panel.guide': '新手引导',
    'welcome.tag': '第一次来？',
    'welcome.title': '3 分钟找到你的入口',
    'welcome.body': '这是个「把与非门做成 Token、把电路做成 NFT」的 3D 实验室。不确定从哪开始？选一个身份，我带你到合适的入口。',
    'welcome.beginner': '我从零开始',
    'welcome.beginnerDesc': '从第 1 章铸一颗与非门开始，有提示和双击式操作',
    'welcome.player': '我想先玩',
    'welcome.playerDesc': '直接进游乐场：链上贪吃蛇、音乐盒、点阵',
    'welcome.tech': '我是技术型',
    'welcome.techDesc': '直接进攻实验室：真值表综合器、3D 沙盒',
    'welcome.skip': '先随便看看',
    'welcome.foot': '之后随时点顶部 🧭 重新打开这个引导；协议细节在 📖 里。',
    'welcome.goBeginner': '已进入第 1 章：先铸出 8 颗与非门。',
    'welcome.goPlayer': '已进入游乐场：试试链上贪吃蛇。',
    'welcome.goTech': '已进入实验室：从真值表综合器开始。',

    'panel.introCodex': '先看协议档案',
    'panel.verifying': '穷举验证中…',
    'panel.foldCard': '收起任务卡',
    'panel.unfoldCard': '展开任务卡',
    'panel.controls': '拖动旋转镜头 · 滚轮缩放 · 点击端口连线 · 点空白取消 · 1–9 跳章 · [ ] 前后章 · H 提示',
    'panel.modeArcade': '游乐场',
    'arcade.badge': 'PLAYGROUND · 游乐场',
    'arcade.title': '逻辑游乐场',
    'arcade.sub': '用出块当节拍演奏、点亮 LED 点阵、解逻辑谜题，或者当一次电路医生。',
    'arcade.game.music': 'NAND 音乐盒',
    'arcade.game.pixel': '8×8 点阵',
    'arcade.game.lock': '密码锁',
    'arcade.game.guess': '猜数字',
    'arcade.game.vote': '表决器',
    'arcade.game.debug': '故障排查',
    'arcade.game.snake': '链上贪吃蛇',

    'arcade.snake.title': '链上贪吃蛇',
    'arcade.snake.hint': '蛇每 0.45 秒走一格——它的状态就是几个寄存器，时钟就是出块。',
    'arcade.snake.play': '▶ 开始',
    'arcade.snake.pause': '⏸ 暂停',
    'arcade.snake.reset': '重开',
    'arcade.snake.score': '得分',
    'arcade.snake.dir': '方向',
    'arcade.snake.keys': '方向键 / WASD',
    'arcade.snake.over': '撞到了！',
    'arcade.snake.how': '它在门级上是什么',
    'arcade.snake.body': '真实实现：8×8 点阵 + 行/列计数器 + 比较器判定蛇头坐标与食物/自身坐标是否相等，状态寄存器每个时钟更新一次。',
    'arcade.snake.clock': '蛇速 = 链上时钟 2.22 Hz（0.45 秒/块）；想更快只能靠更多并行电路，而不是提高出块频率。',
    'lab.export.hex': '复制 hex',
    'lab.export.verilog': '复制 Verilog',
    'lab.export.json': '复制 JSON',
    'lab.export.csv': '复制真值表 CSV',
    'lab.copied': '已复制到剪贴板',
    'lab.export.title': '导出',
    'lab.copyFail': '复制失败，请手动选择文本',
    'lab.archive.title': '存档码',
    'lab.archive.export': '复制存档码',
    'lab.archive.import': '导入存档码',
    'lab.archive.hint': '存档码把整个电路库压成一段文本，换电脑粘贴即可恢复。',
    'lab.archive.placeholder': '粘贴存档码…',
    'lab.importDone': '已导入 {n} 个电路',
    'lab.importFail': '存档码无效：{error}',
    'arcade.scale.major': '大调',
    'arcade.scale.penta': '五声',
    'arcade.scale.minor': '小调',
    'arcade.tune.scale': '音阶练习',
    'arcade.tune.twinkle': '小星星',
    'arcade.tune.beep': '方波练习',
    'arcade.tune.ode': '欢乐颂',
    'arcade.tempo.slow': '慢',
    'arcade.tempo.normal': '中',
    'arcade.tempo.fast': '快',
    'arcade.music.title': 'NAND 音乐盒',
    'arcade.music.hint': '用 4 位计数器分频 + 音阶表，把出块变成节拍。',
    'arcade.music.play': '▶ 播放',
    'arcade.music.stop': '⏸ 停止',
    'arcade.music.tempo': '速度',
    'arcade.music.scale': '音阶',
    'arcade.music.tune': '曲目',
    'arcade.music.now': '当前音',
    'arcade.music.how': '它在门级上是什么',
    'arcade.music.howBody': '真实实现会用一个 4 位计数器（4 个锁存器 + 15 个与非门）驱动音阶表：每个出块计数器加一，取出的值选中一个频率，再由蜂鸣器发声。这就是「用链上出块做音乐」。',
    'arcade.music.scales': '音阶',
    'arcade.music.tunes': '曲目',
    'arcade.music.clock': '默认时钟 2.22 Hz（0.45 秒/块）—— 慢，但永不停机。',
    'arcade.pixel.title': '8×8 LED 点阵',
    'arcade.pixel.hint': '点亮像素画图案，或用链上时钟让它动起来。',
    'arcade.pixel.play': '▶ 动画',
    'arcade.pixel.pause': '⏸ 暂停',
    'arcade.pixel.clear': '清空',
    'arcade.pixel.patterns': '预设图案',
    'arcade.pixel.patternHint': '每个像素在真实电路里对应一个真值表输出。',
    'arcade.pixel.pattern.heart': '爱心',
    'arcade.pixel.pattern.arrow': '箭头',
    'arcade.pixel.pattern.smile': '笑脸',
    'arcade.pixel.playHint': '真实实现：行/列计数器逐拍扫描，点亮对应 LED；8×8 点阵约需数百颗与非门。',
    'arcade.pixel.clock': '每 0.45 秒一个区块 —— 动画速度就是链上时钟。',
    'arcade.lock.title': '4 位密码锁',
    'arcade.lock.hint': '猜出 4 位密码；每次检查会告诉你每一位是否匹配。',
    'arcade.lock.check': '检查',
    'arcade.lock.reset': '重试',
    'arcade.lock.attempts': '尝试',
    'arcade.lock.solved': '开锁成功！',
    'arcade.lock.last': '上次输入',
    'arcade.lock.circuit': '它其实是一个比较器',
    'arcade.lock.body': '4 位密码 = 4 个 XNOR（同或）+ 4 输入 AND；每位相等则输出 1，全相等才开锁。真实电路中 XNOR = 4 个与非门，整把锁约 20 颗晶体管。',
    'arcade.guess.title': '猜数字（LFSR 随机数）',
    'arcade.guess.hint': '系统在 0–15 里藏了一个数，用二进制猜，反馈“大了/小了”。',
    'arcade.guess.value': '当前猜测',
    'arcade.guess.submit': '猜！',
    'arcade.guess.restart': '换一个数',
    'arcade.guess.tries': '次数',
    'arcade.guess.solved': '猜中了！答案是',
    'arcade.guess.how': '它是怎么“随机”的',
    'arcade.guess.body': '链上没有真随机，通常用 LFSR（线性反馈移位寄存器）：几个触发器 + 异或门就能生成伪随机序列；4 位就够了。',
    'arcade.guess.lfsr': '本页的随机数由本地伪随机序列模拟；真实链上随机性需要额外机制。',
    'arcade.vote.title': '三人表决器',
    'arcade.vote.hint': '三人中至少两人同意才通过——多数门。',
    'arcade.vote.table': '真值表',
    'arcade.debug.title': '故障排查实验室',
    'arcade.debug.hint': '每个电路有一根线接错了；看真值表差异，选出正确的修复。',
    'arcade.debug.buggy': '故障电路',
    'arcade.debug.expect': '应有',
    'arcade.debug.actual': '实际',
    'arcade.debug.fixed': '修好了！',
    'arcade.debug.wrong': '还是不对',
    'arcade.debug.inspect': '待排查',
    'arcade.debug.options': '候选修复',
    'arcade.debug.next': '下一台故障电路',
    'arcade.debug.why': '为什么这个练习有用',
    'arcade.debug.body': '真实芯片的调试就是在看“期望 vs 实际”的真值表差异，再定位到某根线。5 关分别覆盖异或、多数门、相等判断、七段段位与奇偶校验。',
    'arcade.debug.scope': '练习中的门编号从 1 开始；网表节点 0/1 是常量，2 起是输入。',
    'arcade.debug.xor': '异或',
    'arcade.debug.majority': '多数门',
    'arcade.debug.equal': '相等判断',
    'arcade.debug.seg': '七段段位',
    'arcade.debug.parity': '奇偶校验',
    'panel.modeMissions': '任务',
    'panel.prevChapter': '上一章',
    'panel.soundOn': '声音：开',
    'panel.soundOff': '声音：关',
    'panel.cinema': '电影模式：自动演示全链路',
    'panel.cinemaStop': '停止演示',
    'cinema.running': '自动演示中',
    'cinema.started': '电影模式开始：从铸币一路演到安全电路。',
    'cinema.stopped': '电影模式已停止。',
    'cinema.done': '自动演示完成：11 章链路已跑完。',
    'panel.nextChapter': '下一章',
    'panel.modeLab': '实验室',
    'panel.progress': '{done}/{total} 章',
    'panel.progressAll': '十一章完成',
    'finale.title': '十一章全部完成',
    'finale.sub': '从一颗 7 字节的与非门，一路走到七段显示、计数器、小计算机和真实项目的安全电路。',
    'finale.stat.chapters': '完成章节',
    'finale.stat.minted': '铸造晶体管',
    'finale.stat.circuits': '流片电路',
    'finale.stat.gates': '销毁 NAND',
    'finale.stat.blocks': '链上区块',
    'finale.chapters': '十一章回顾',
    'finale.note': '这条链路在 TapeOut 协议里是真实存在的：Token → 画布连线 → 流片 → 电路 NFT → 黑盒复用 → 链上 CPU；后四章还把它接到了综合工具、七段显示、计数器和 TapeRover 的真实安全电路。',
    'finale.replay': '再玩一次',
    'finale.stay': '留在实验室',
    'toast.allDone': '十一章全部完成！从晶体管到安全电路，你已经走完整条 TapeOut 链路。',
    'toast.resetAll': '实验室已重置，七章从头再来。',

    'hud.nand': 'NAND 余额',
    'hud.nandUnit': '颗',
    'hud.circuits': '已流片电路',
    'hud.circuitUnit': '块',
    'hud.blocks': '链上区块',
    'hud.clock': '时钟',
    'hud.clockUnit': 'Hz',
    'hud.erc1155': 'ERC-1155 · 7 字节',
    'hud.erc721': 'ERC-721 · 逻辑即数据',
    'hud.gates': '门数',
    'hud.pins': '引脚',
    'hud.state': '状态位',
    'hud.depth': '深度',
    'hud.bytes': '字节码',
    'hud.netlist': '网表',
    'hud.verify': '穷举验证',
    'hud.verifyPass': '通过',
    'hud.verifyFail': '未通过',
    'hud.verifyIncomplete': '待接线',
    'hud.verifyRows': '已核对',
    'hud.rowsUnit': '行',
    'hud.truthTable': '真值表',
    'hud.visited': '已试输入',
    'hud.eval': '只读求值 eval',
    'hud.free': '免费 · 无需钱包 · 不留交易',
    'hud.evalInput': '输入位',
    'hud.evalOutput': '输出位',
    'hud.wave': '时钟波形',
    'hud.waveS': 'S',
    'hud.waveR': 'R',
    'hud.waveQ': 'Q',
    'hud.waveQn': 'Q̄',
    'hud.blockTick': '每个区块推进一个时钟周期',
    'hud.settle': '交叉反馈需要 2 个节拍稳定',
    'hud.program': '程序',
    'hud.programOp': '{a} + {b}',
    'hud.result': '结果',
    'hud.resultSeg': '七段显示',
    'hud.running': '逐位进位中…',
    'hud.cpuStory': '2300 个晶体管 · 4 位 · 2.22 Hz · 永不关机',
    'hud.nft': '新铸造的电路 NFT',
    'hud.token': '晶体管 Token',
    'hud.chip7': '一颗 = 7 字节链上数据',

    'dock.mintAll': '一键铸满',
    'dock.placeGate': '放入与非门',
    'dock.placeGateN': '放入与非门（剩 {left}）',
    'dock.inputOn': '把 {p} 置 1',
    'dock.inputOff': '把 {p} 置 0',
    'dock.assist': '助手接下一根线',
    'dock.clearWires': '清空接线',
    'dock.tapeout': '流片 TAPE OUT',
    'dock.tapeoutLego': '流片全加器',
    'dock.freeEval': '免费 eval 一次',
    'dock.setLow': '拉低 S（置位）',
    'dock.setHigh': '松开 S（保持 1）',
    'dock.resetLow': '拉低 R（复位）',
    'dock.resetHigh': '松开 R（保持 1）',
    'dock.placeBox': '放入黑盒（剩 {left}）',
    'dock.runProgram': '运行 {a} + {b}',
    'dock.again': '再算一组',
    'dock.nextChapter': '完成，进入下一章',

    'goal.mintChips': '铸造 {n} 颗 NAND 晶体管',
    'goal.seeToken': '看清一颗 Token 的链上结构',
    'goal.placeGate': '放入 1 个与非门',
    'goal.wireGate': '把 A、B 接到与非门两个输入',
    'goal.allInputs': '试遍 4 种输入组合（{visited}/4）',
    'goal.verifyPass': '穷举验证与非门真值表',
    'goal.placeGates': '放入 5 个与非门（{placed}/5）',
    'goal.wireCount': '接好导线（{done}/{n}）',
    'goal.verifyHalf': '穷举验证半加器（SUM、CARRY）',
    'goal.chooseDesign': '选择要流片的设计',
    'goal.tapeout': '完成流片，铸造电路 NFT',
    'goal.freeEval': '用只读 eval 调用一次',
    'goal.latchSet': '把锁存器置位（Q=1）',
    'goal.latchHold': '稳定保持 Q=1（{done}/3 个节拍）',
    'goal.latchReset': '复位（Q=0）',
    'goal.placeBoxes': '放入黑盒（{done}/3）',
    'goal.verifyFull': '穷举验证 3 位全加器',
    'goal.runProgram': '让浏览器里的程序跑起来',
    'goal.seeResult': '看到七段显示器亮起结果',

    'hint.mint': '点击硅片上发光的芯片，铸出 {n} 颗与非门。',
    'hint.nandPlace': '先点击下方「放入与非门」，再点击它的输入端口接线。',
    'hint.nextWire': '下一步：把 {source} 接到 {sink}。端口会发光提示。',
    'hint.nandWire': '先点一个输入端口（A 或 B），再点与非门的输入端口。',
    'hint.nandToggle': '点击 A、B 两块输入板，试遍 4 种组合（已试 {n}/4）。',
    'hint.halfPlace': '还差 {n} 个与非门，按提示位置依次放入。',
    'hint.halfFail': '验证未通过：按提示检查每一根线，或点「助手接下一根线」。',
    'hint.halfDone': '半加器验证通过。可以进入下一章流片了。',
    'hint.tapeoutStart': '点击「流片」：晶体管会被销毁，电路变成 NFT。',
    'hint.tapeoutRunning': '正在蚀刻：字节码逐门写入链上数据。',
    'hint.tapeoutDone': '电路已上链。试试免费的只读 eval，答错也没有任何代价。',
    'hint.latchForbidden': 'S、R 同时为 0 是禁态：Q 与 Q̄ 会一起震荡。松开一个输入，让反馈重新稳定。',
    'chapter.7.title': '七段译码器 · 100 颗晶体管',
    'chapter.7.subtitle': '数字第一次亮起来',
    'chapter.7.tag': '第八章',
    'chapter.7.intro': '四个输入位有 16 种组合，把 0–9 翻译成七段显示器的亮灭。协议原文里这是 100 颗晶体管的经典电路；这一次先让自动综合器替你造出 110 个与非门，再穷举验证、流片，最后点亮真正的数字。',
    'chapter.7.fact': '七段译码器 = 4 输入、7 输出；0–9 有效，10–15 熄灭。',
    'chapter.8.title': '计数器 · 时间的形状',
    'chapter.8.subtitle': '每个区块，加一',
    'chapter.8.tag': '第九章',
    'chapter.8.intro': '四个锁存器加上一个加法器，就成了二进制计数器。每来一个区块，它加一，从 0000 数到 1111 再回绕。链上 CPU 的“时间”就是这样一格一格长出来的。',
    'chapter.8.fact': '4 位计数器 = 4 个状态位 + 15 个与非门；每拍加一，第 16 拍回绕。',
    'chapter.9.title': '小计算机 · 跑一段程序',
    'chapter.9.subtitle': '寄存器、ALU 与程序计数器',
    'chapter.9.tag': '第十章',
    'chapter.9.intro': '一台 4 位小计算机：16 字节内存、累加器 A、程序计数器 PC、指令寄存器 IR。载入一段程序，让每个区块执行一条指令，看 3+5、1..5 累加、甚至乘法在门电路之上跑起来。',
    'chapter.9.fact': '取指 → 译码 → 执行：CPU 只是在“时钟 + 寄存器 + ALU”上重复这三步。',
    'chapter.10.title': '安全电路 · 真实项目联动',
    'chapter.10.subtitle': 'TapeRover 的 16 输入 / 80 门安全闸门',
    'chapter.10.tag': '第十一章',
    'chapter.10.intro': '这是 TapeRover 真实使用的安全电路：16 个布尔输入、80 个与非门、4 个互斥输出。拨动输入，看小车被允许前进、减速、返航还是停车；再穷举全部 65536 种输入，验证“永远只有一个输出为真”。',
    'chapter.10.fact': '16 输入 / 80 门 / 4 互斥输出 · 65536 种组合全部审计。',
    'goal.segSynth': '用综合器造出七段译码器',
    'goal.segVerify': '穷举验证 16 种输入',
    'goal.segDigits': '点亮 0–9 十个数字（{n}/10）',
    'goal.countSix': '让计数器数到 6 个节拍',
    'goal.count15': '数到 1111（15）',
    'goal.countWrap': '回绕到 0000',
    'goal.cpuAdd': '跑通 3 + 5 = 8',
    'goal.cpuSum': '跑通 1+2+3+4+5 = 15',
    'goal.cpuMul': '跑通 3 × 4 = 12',
    'goal.cpuStep': '手动单步执行 3 条指令（{n}/3）',
    'goal.safetyModes': '让四种许可都出现（{n}/4）',
    'goal.safetyAudit': '穷举 65536 种输入，验证互斥',
    'hint.segSynth': '点击「综合七段译码器」：自动为 7 个段综合出门级电路。',
    'hint.segVerify': '点击「穷举验证」：把 16 种输入全部跑一遍。',
    'hint.segTapeout': '验证通过后点击「流片」，100 多颗晶体管被销毁。',
    'hint.segDigits': '点四个输入板切换二进制，让显示器亮出 0–9（{n}/10）。',
    'hint.counterBeats': '每 0.45 秒链上出一个块，计数器加一（已 {n} 拍）。',
    'hint.counterWrap': '快到了：数到 1111 之后再等一拍，看它回绕到 0000。',
    'hint.counterDone': '计数器任务完成：你已经看到“时间 = 出块”的形状。',
    'hint.safetyAudit': '点击「穷举审计」：65536 种输入必须恰好一个输出为真。',
    'hint.safetyModes': '用四个预设或手动拨 16 个输入，让 ALLOW / SLOW / RETURN / STOP 都出现（{n}/4）。',
    'hint.safetyTapeout': '审计通过后流片，把这个真实安全电路带上链。',
    'hint.safetyDone': '安全电路任务完成：这是真实 TapeRover 项目使用的逻辑。',
    'dock.segSynth': '综合七段译码器',
    'dock.segVerify': '穷举验证',
    'dock.segTapeout': '流片译码器',
    'dock.counterStep': '手动推进一拍',
    'dock.counterReset': '重置计数',
    'dock.cpuAdd35': '程序：3 + 5',
    'dock.cpuSum15': '程序：1..5 累加',
    'dock.cpuMul12': '程序：3 × 4',
    'dock.cpuRun': '运行程序',
    'dock.cpuStep': '单步执行',
    'dock.cpuReset': '重载程序',
    'dock.safetyAllow': '预设：允许前进',
    'dock.safetySlow': '预设：减速',
    'dock.safetyHome': '预设：返航',
    'dock.safetyStop': '预设：停车',
    'dock.safetyAudit': '穷举审计 65536',
    'dock.safetyTapeout': '流片安全电路',
    'toast.toolMissing': '这个构建缺少对应的逻辑模块。',
    'toast.segSynthDone': '七段译码器已综合：{n} 个与非门。',
    'toast.segVerified': '16 种输入全部验证通过。',
    'toast.segVerifyFail': '验证未通过，检查综合结果。',
    'toast.segDone': '七段译码器已上链：数字第一次亮起来了。',
    'toast.counterDone': '计数器任务完成。',
    'toast.cpuProgramDone': '程序结束，OUT = {out}。',
    'toast.cpuDoneAll': '三个程序全部跑通：小计算机完成。',
    'toast.safetyAuditDone': '65536 种输入审计完成：{n} 行，输出互斥。',
    'toast.safetyAuditFail': '审计发现互斥冲突。',
    'toast.safetyDone': '安全电路已上链：真实项目的逻辑被完整验证。',
    'toast.synthFail': '综合失败：{error}',
    'toast.sandboxEmpty': '沙盒需要先选一个电路。',
    'toast.libraryFull': '电路库已满（最多 24 个）。',
    'toast.cpuError': 'CPU 执行出错：{error}',
    'circuit.sevenSegment': '七段译码器',
    'circuit.safety': '安全电路（16→4）',
    'cpu.prog.add35': '3 + 5',
    'cpu.prog.sum15': '1..5 累加',
    'cpu.prog.mul12': '3 × 4',
    'hud.binary': '二进制',
    'hud.decimal': '十进制',
    'hud.beats': '节拍',
    'hud.next': '下一拍',
    'hud.program': '程序',
    'hud.pc': 'PC',
    'hud.ir': 'IR',
    'hud.acc': 'A',
    'hud.trace': '执行轨迹',
    'hud.mode': '许可',
    'hud.inputs': '输入',
    'hud.violations': '互斥冲突',
    'hud.seen': '已出现',
    'hud.digit': '数字',
    'hud.mask': '段码',
    'hud.segments': '段',
    'safety.allow': '允许前进',
    'safety.slow': '减速',
    'safety.home': '返航',
    'safety.stop': '停车',
    'lab.badge': 'LAB · 工具',
    'lab.title': '实验室',
    'lab.sub': '真值表综合、元件展厅、3D 电路沙盒与本地电路库。任务关卡里的电路也会出现在这里。',
    'lab.tab.synth': '综合器',
    'lab.group.intro': '入门',
    'lab.group.apps': '应用实验',
    'lab.group.eng': '工程落地',
    'lab.paths': '推荐路径',
    'lab.path.beginner': '🐣 先学基础',
    'lab.path.apps': '🎮 做应用',
    'lab.path.eng': '🔧 落地硬件',
    'lab.path.back': '↩ 回主线任务',

    'lab.tab.museum': '元件展厅',
    'lab.tab.sandbox': '电路沙盒',
    'lab.tab.library': '电路库',
    'lab.tab.hardware': '硬件搭建',
    'lab.tab.access': '门禁资格',
    'lab.tab.lottery': '可验证抽奖',
    'lab.tab.art': '生成艺术',
    'lab.tab.sensors': '传感器规则',
    'lab.tab.defi': 'DeFi 守卫',
    'defi.title': 'DeFi 交易守卫',
    'defi.sub': '滑点、额度、预言机、白名单、暂停 → NAND 守卫电路；放行后才在模拟 AMM 成交。',
    'defi.pool.ethusdc': 'ETH / USDC 池',
    'defi.pool.btcusdc': 'BTC / USDC 池',
    'defi.pool.tapbnb': 'NAND / BNB 池',
    'defi.out': '预计得到',
    'defi.impact': '价格冲击',
    'defi.amount': '交易数量',
    'defi.maxImpact': '最大冲击',
    'defi.cap': '单笔上限',
    'defi.flag.allowlisted': '白名单',
    'defi.flag.oracle': '预言机新鲜',
    'defi.flag.paused': '暂停',
    'defi.guards': '守卫条件（实时）',
    'defi.pass': '通过',
    'defi.fail': '拒绝',
    'defi.execute': '执行兑换',
    'defi.reset': '重置池子',
    'defi.simulated': '模拟 AMM · 无钱包、无签名、无链上交易',
    'defi.circuit.title': '守卫电路',
    'defi.circuit.hint': '4 个布尔条件 → 1 个 NAND 网表；任何协议都能公开复算',
    'defi.audit': '穷举审计',
    'defi.issue': '签发凭证',
    'defi.receipt.empty': '先调参数，再签发凭证。',
    'defi.blocked': '守卫拒绝：{reasons}',
    'defi.why.title': '为什么 DeFi 需要这个',
    'defi.why.body': 'DeFi 协议的风控（暂停开关、白名单、额度上限、预言机时效、滑点保护）适合写成公开可验证的逻辑；把守卫编译成网表后，用户能自己复算“这笔交易为什么被放行/被拦下”。',
    'defi.why.note': '本页是模拟 AMM：不连接钱包、不签名、不发交易；真实协议还需要审计、预言机与链上治理。',

    'sensor.title': '传感器规则引擎',
    'sensor.sub': '模拟量 → 阈值 → NAND 逻辑 → 多个执行器；规则可穷举审计，凭证可离线复算。',
    'sensor.inputs': '传感器输入',
    'sensor.actuators': '执行器',
    'sensor.actuatorTitle': '执行器输出（实时）',
    'sensor.on': '触发',
    'sensor.off': '正常',
    'sensor.firing': '动作',
    'sensor.idle': '空闲',
    'sensor.threshold': '阈值',
    'sensor.rows': '项',
    'sensor.none': '无',
    'sensor.auditHint': '穷举布尔组合，验证每条规则',
    'sensor.receipt.title': '可验证凭证',
    'sensor.receipt.hint': '记录原始读数、阈值、布尔位、执行器与网表指纹。',
    'sensor.receipt.empty': '先调好传感器，再签发凭证。',
    'sensor.why.title': '为什么这样做',
    'sensor.why.body': '真实规则引擎先把模拟量按阈值变成布尔位，再用门电路算执行器；本页把两步都摊开：阈值可调、布尔位可见、门数与深度可查、全部组合可穷举。',
    'sensor.why.note': '凭证包含原始读数与阈值，验证器重算布尔位与电路输出；改读数、改阈值、改电路都会被发现。演示为离线复算，真实 TapeOut eval 是链上只读调用。',
    'sensor.scenario.home': '家庭安防',
    'sensor.scenario.homeDesc': '(门磁 OR 窗磁) AND 离家模式 → 报警。',
    'sensor.scenario.fire': '火灾联动',
    'sensor.scenario.fireDesc': '烟雾 AND (高温 OR CO) → 报警；烟雾 AND 高温 → 断电；烟雾 AND CO → 喷淋。',
    'sensor.scenario.air': '新风联动',
    'sensor.scenario.airDesc': '(CO₂高 OR 高温) AND NOT 烟雾 → 开新风；烟雾 → 净化（防串烟）。',
    'sensor.scenario.interlock': '工业联锁',
    'sensor.scenario.interlockDesc': '急停 OR (安全门开 AND 运行中) → 停机；急停 OR 安全门开 → 报警。',
    'sensor.scenario.server': '机房环境',
    'sensor.scenario.serverDesc': '高温 AND 高湿 → 空调；漏水 → 断电；漏水 OR (高温 AND 高湿) → 报警。',
    'sensor.door': '门磁',
    'sensor.window': '窗磁',
    'sensor.away': '离家模式',
    'sensor.smoke': '烟雾',
    'sensor.heat': '温度',
    'sensor.co': '一氧化碳',
    'sensor.co2': '二氧化碳',
    'sensor.humidity': '湿度',
    'sensor.water': '漏水',
    'sensor.estop': '急停',
    'sensor.gate': '安全门',
    'sensor.running': '机器运行',
    'sensor.smoke.th': '烟雾阈值',
    'sensor.heat.th': '温度阈值',
    'sensor.co.th': 'CO 阈值',
    'sensor.co2.th': 'CO₂ 阈值',
    'sensor.humidity.th': '湿度阈值',
    'actuator.alarm': '报警',
    'actuator.powerCut': '断电',
    'actuator.sprinkler': '喷淋',
    'actuator.fan': '新风',
    'actuator.purify': '净化',
    'actuator.stop': '停机',
    'actuator.ac': '空调',

    'art.title': '生成艺术 / 每区块一帧',
    'art.sub': '电路状态决定画面：同一份种子与区块序号永远得到同一帧，可导出、可验证、可收藏。',
    'art.play': '▶ 播放动画',
    'art.pause': '⏸ 暂停动画',
    'art.step': '下一帧',
    'art.reset': '回到第 0 帧',
    'art.block': '每个区块推进一帧',
    'art.seed': '种子',
    'art.circuit': '状态来源',
    'art.circuit.lfsr': '8 位 LFSR',
    'art.circuit.counter': '4 位计数器',
    'art.circuit.gates': '组合逻辑哈希',
    'art.palette': '配色',
    'art.palette.cyber': '赛博',
    'art.palette.riso': '孔版',
    'art.palette.mono': '黑白',
    'art.exportPng': '导出 PNG',
    'art.copyCode': '复制作品码',
    'art.mint': '铸造进画廊',
    'art.hash': '帧哈希',
    'art.exported': '已导出 PNG',
    'art.exportFail': '当前环境无法导出 PNG',
    'art.verify.title': '作品验证',
    'art.verify.hint': '粘贴作品码，任何人可复算出同一帧哈希。',
    'art.verify.placeholder': '粘贴作品码…',
    'art.verify.hashPlaceholder': '期望的帧哈希（可选）',
    'art.verify.run': '验证',
    'art.verify.pass': '验证通过',
    'art.verify.fail': '验证失败',
    'art.gallery.title': '我的画廊',
    'art.gallery.empty': '还没有铸造作品：点「铸造进画廊」。',
    'art.nft': 'NFT 叙事：作品码记录了种子、状态来源、区块序号与帧哈希；画面由电路状态确定性生成，换一个区块就是新的一帧——天然具备收藏与验证叙事。',

    'lottery.title': '可验证抽奖 / 随机数',
    'lottery.sub': '公开种子 + 参与者名单 → 确定性选人；任何人都能离线复算，事后改不了。',
    'lottery.seed': '公开种子 / 区块哈希',
    'lottery.newSeed': '用当前区块生成',
    'lottery.count': '中奖人数',
    'lottery.people': '位参与者',
    'lottery.peoplePlaceholder': '每行一个名字…',
    'lottery.seedHash': '种子哈希',
    'lottery.draw': '抽奖',
    'lottery.winners': '中奖名单',
    'lottery.algorithm': '算法',
    'lottery.empty': '填好参与者名单和种子，点「抽奖」。',
    'lottery.receipt.title': '抽奖凭证',
    'lottery.receipt.hint': '种子、名单、结果打包成一段文本，可离线验证。',
    'lottery.receipt.empty': '抽完奖会自动生成凭证。',
    'lottery.receipt.copy': '复制凭证',
    'lottery.verify.title': '验证凭证',
    'lottery.verify.placeholder': '粘贴抽奖凭证…',
    'lottery.verify.hashPlaceholder': '期望的种子哈希（可选）',
    'lottery.verify.run': '验证',
    'lottery.verify.pass': '验证通过',
    'lottery.verify.fail': '验证失败',
    'lottery.verify.use': '载入',
    'lottery.how.title': '它怎么做到可验证',
    'lottery.how.body': '每位参与者得到 key = FNV1a(种子 | 序号 | 名字)，按 key 升序取前 N 名。种子公开后，任何人用同样的名单重算就能核对结果；改名字、改种子、改中奖顺序都会被发现。',
    'lottery.how.warn': '真实抽奖要防止「事后挑种子」：应先公布承诺再揭晓，或用 drand / VRF 等可验证随机源。本页是离线算法演示。',
    'lottery.lfsr.title': 'LFSR 电路视角（8 位）',
    'lottery.lfsr.note': '真实随机数常由 8 个锁存器 + 3 个异或（约 20 个 NAND）的移位寄存器派生；本演示用软件复算。',
    'lottery.error': '抽奖失败：{error}',

    'access.title': '可验证门禁 / 资格判定',
    'access.sub': '选一条策略，插件把它综合成 NAND 电路；拨动条件看放行，再签发可离线复算的凭证。',
    'access.policy.simple': '简单门禁',
    'access.policy.simpleDesc': '卡有效 AND 成年 —— 最基础的门禁逻辑，2 个输入。',
    'access.policy.member': '会员 + 黑名单',
    'access.policy.memberDesc': '卡有效 AND 成年 AND 不在黑名单。',
    'access.policy.invite': '会员 / 邀请制',
    'access.policy.inviteDesc': '卡有效 AND 成年 AND（会员 OR 邀请码）。',
    'access.policy.multisig': '多签放行',
    'access.policy.multisigDesc': '三名签名者中至少两人签字 AND 金额在限额内。',
    'access.policy.staff': '员工 / 临时授权',
    'access.policy.staffDesc': '卡有效 AND（员工 OR（临时权限 AND 经理批准））。',
    'access.input.card': '卡有效',
    'access.input.adult': '成年',
    'access.input.blacklist': '命中黑名单',
    'access.input.member': '会员',
    'access.input.invite': '邀请码',
    'access.input.signA': '签名 A',
    'access.input.signB': '签名 B',
    'access.input.signC': '签名 C',
    'access.input.amount': '金额合规',
    'access.input.staff': '员工',
    'access.input.temp': '临时权限',
    'access.input.manager': '经理批准',
    'access.issue': '签发凭证',
    'access.verify.fingerprint': '指纹',
    'defi.guard.open': '白名单且未暂停',
    'defi.guard.oracle': '预言机数据新鲜',
    'defi.guard.impact': '价格冲击在限额内',
    'defi.guard.cap': '金额在上限内',
    'hint.chapterDone': '本章已完成 ✓ 点底部「完成，进入下一章」继续。',
    'access.conditions': '条件开关（点击切换）',
    'access.allow': '允许通行',
    'access.deny': '拒绝',
    'access.audit': '穷举审计',
    'access.auditHint': '把全部输入组合跑一遍，验证电路与策略一致',
    'access.fingerprint': '策略指纹',
    'access.allowShort': '放行',
    'access.denyShort': '拒绝',
    'access.receipt.title': '可验证凭证',
    'access.receipt.hint': '把策略、输入、结果与网表指纹打包成一段文本，任何人可离线复算。',
    'access.receipt.empty': '先拨好条件，再点「签发凭证」。',
    'access.receipt.copy': '复制凭证码',
    'access.receipt.fingerprint': '指纹',
    'access.verify.title': '验证凭证',
    'access.verify.codePlaceholder': '粘贴凭证码…',
    'access.verify.hashPlaceholder': '期望的策略指纹（可选）',
    'access.verify.run': '验证',
    'access.verify.pass': '验证通过',
    'access.verify.fail': '验证失败',
    'access.verify.use': '载入',
    'access.why.title': '为什么这算「可验证」',
    'access.why.body': '电路是纯数据、只读函数：没有可写状态、没有外部调用。任何人都能用凭证里自带的网表与输入复算出同样结果；篡改输入、结果或电路都会被发现。',
    'access.why.note': '演示为离线复算；真实 TapeOut 的 eval 是链上只读调用，陌生电路最坏只是返回错误答案，伤不到调用者。',
    'access.why.bytes': '字节/门',
    'access.why.state': '可写状态',
    'access.why.readonly': '求值方式',

    'lab.hardware.title': '真实硬件搭建（74HC00）',
    'lab.hardware.hint': '把组合网表翻译成芯片数量、门级引脚分配、面包板连线与采购清单。',
    'lab.hardware.fromResult': '用综合结果',
    'lab.hardware.fromSandbox': '用沙盒电路',
    'lab.hardware.chips': '74HC00 片数',
    'lab.hardware.wires': '连线数',
    'lab.hardware.boards': '面包板',
    'lab.hardware.bom': '采购清单（BOM）',
    'lab.hardware.item': '元件',
    'lab.hardware.qty': '数量',
    'lab.hardware.note': '说明',
    'lab.hardware.pins': '门 / 引脚分配',
    'lab.hardware.chip': '芯片',
    'lab.hardware.unit': '单元',
    'lab.hardware.wiresTitle': '面包板连线表',
    'lab.hardware.copyBom': '复制 BOM CSV',
    'lab.hardware.copyWires': '复制连线 CSV',
    'lab.hardware.copyGuide': '复制搭建指南',
    'lab.hardware.empty': '还没有可转换的电路：先综合一个逻辑函数，或打开沙盒电路，再回到这里。',
    'lab.hardware.goSynth': '去综合器',
    'lab.hardware.goSandbox': '去沙盒',
    'lab.hardware.steps': '搭建顺序：芯片跨中缝、VCC/GND 与去耦电容 → 按引脚表接输入 → 输出经 330Ω 接 LED → 上电前测短路 → 按真值表拨开关验证。时序电路需要额外时钟芯片。',

    'lab.synth.title': '真值表 → NAND 网表',
    'lab.synth.hint': '点格子循环 0 / 1 / 无关项，综合器会做 Quine–McCluskey 化简并映射到与非门。',
    'lab.synth.inputs': '输入位数',
    'lab.synth.clear': '清空',
    'lab.synth.run': '综合并验证',
    'lab.synth.sandbox': '在沙盒打开',
    'lab.synth.save': '存进电路库',
    'lab.synth.result': '综合结果',
    'lab.synth.gates': '门',
    'lab.synth.literals': '文字量',
    'lab.synth.terms': '项数',
    'lab.synth.rows': '行',
    'lab.synth.empty': '还没有结果。先点几个 1，再点「综合并验证」。',
    'lab.synth.expect': '期望',
    'lab.synth.actual': '实际',
    'lab.verify.pass': '验证通过',
    'lab.verify.fail': '验证失败',
    'lab.museum.title': '元件展厅',
    'lab.museum.hint': '所有门电路最终都由与非门拼出来；点「沙盒打开」能在 3D 里看到真实网表。',
    'lab.museum.stateful': '状态器件 · 需要时钟',
    'lab.museum.open': '沙盒打开',
    'lab.library.title': '我的电路库',
    'lab.library.empty': '还没有保存的电路。去综合器里造一个吧。',
    'lab.sandbox.title': '3D 电路沙盒',
    'lab.sandbox.empty': '还没有装入电路：可以从综合器或元件展厅送一个过来。',
    'lab.sandbox.fromSynth': '从综合结果打开',
    'lab.sandbox.fromMuseum': '去元件展厅',
    'lab.sandbox.inputs': '切换输入',
    'museum.notGate.name': '非门 NOT',
    'museum.andGate.name': '与门 AND',
    'museum.orGate.name': '或门 OR',
    'museum.xorGate.name': '异或门 XOR',
    'museum.nandGate.name': '与非门 NAND',
    'museum.mux2.name': '二选一 MUX',
    'museum.decoder2to4.name': '2-4 译码器',
    'museum.halfAdder.name': '半加器',
    'museum.fullAdder.name': '全加器',
    'museum.srLatch.name': 'SR 锁存器',
    'museum.counter4.name': '4 位计数器',
    'museum.sevenSegment.name': '七段译码器',
    'hint.latchSet': '拉低 S（SET），保持两个节拍，观察 Q 从瞬态稳定到 1。',
    'hint.latchHold': 'Q=1 已稳定 {n} 个节拍…继续让它保持，链上出块就是心跳。',
    'hint.latchReset': '现在拉低 R（RESET），两个节拍后 Q 回到 0。',
    'hint.legoPlace': '还差 {n} 个黑盒：两个半加器 + 一个或门。',
    'hint.legoTapeout': '快完成了：先让验证通过，再流片组合出的全加器。',
    'hint.legoDone': '组合全加器已上链。对比一下：直接设计只要 9 颗门。',
    'hint.cpuRun': '点击「运行 3 + 5」，看四位加法器逐位进位。',
    'hint.cpuRunning': '出块推进，进位在门阵列里传播…',
    'hint.cpuDone': '结果已写入七段显示器。可以再算一组，或回看协议档案。',

    'port.input': '输入 {n}',
    'port.gateIn': '与非门 {n} 的 {pin} 输入',
    'port.gateOut': '与非门 {n} 的输出',
    'port.boxIn': '黑盒 {box} 的 {pin} 输入',
    'port.boxOut': '黑盒 {box} 的 {pin} 输出',
    'port.sum': 'SUM 输出',
    'port.carry': 'CARRY 输出',
    'port.unknown': '端口',
    'hover.chip': '点击铸造这颗 NAND 晶体管',
    'hover.padToggle': '点击切换 {p} 的电平',
    'hover.source': '输出端口，可作连线起点',
    'hover.sink': '输入端口，可作连线终点',
    'hover.machine': '流片机：销毁 NAND Token，铸造电路 NFT',
    'hover.crystal': '新电路 NFT：点击做一次免费只读 eval',
    'hover.cpu': '巨兽：点击运行 3 + 5',
    'hover.display': '七段显示器：点击再算一组',
    'hover.die': '硅片画布',
    'hover.segpad': '切换输入位 D{n}',
    'hover.safepad': '切换安全输入 {n}',


    'toast.chapterDone': '任务完成！',
    'toast.mintDone': '8 颗晶体管已铸造：它们现在是你钱包里的 ERC-1155 Token。',
    'toast.nandDone': '与非门真值表验证通过：整个世界只需要这一种门。',
    'toast.halfDone': '半加器验证通过：5 颗晶体管开始会算加法了。',
    'toast.tapeoutDone': '电路 #{id} 已流片：{n} 颗晶体管被销毁，NFT 永久上链。',
    'toast.legoDone': '组合全加器已上链：{n} 颗晶体管，8 种输入全部验证通过。',
    'toast.latchDone': '锁存器任务完成：你造出了一位记忆。',
    'toast.latchTransient': '这是交叉反馈的瞬态：Q 与 Q̄ 同时为 1，再等一个节拍就会分开。',
    'toast.cpuDone': '巨兽算完了：链上出块驱动着这台处理器。',
    'toast.notEnoughNand': 'NAND 不够：流片需要 {n} 颗，你现在只有 {have} 颗。',
    'toast.verifyFirst': '先让穷举验证通过，再流片。',
    'toast.seedNand': '演示补给：补发 {n} 颗与非门，保证本章可以单独体验。',
    'toast.portArmed': '已选中 {source}：再点一个输入端口完成接线。',

    'log.mintOne': '铸出 1 颗 NAND，余额 {n}',
    'log.mintAll': '一次铸满硅片，余额 {n}',
    'log.tapeout': '流片电路 #{id}：销毁 {n} 颗晶体管',
    'log.tapeoutLego': '组合流片 #{id}：销毁 {n} 颗晶体管',

    'circuit.halfAdder': '半加器',
    'circuit.composed': '组合全加器',

    'codex.title': 'TapeOut 协议档案',
    'codex.lead': '一句话：把与非门做成 Token，把电路做成 NFT，把 BNB Chain 的出块当作 CPU 时钟。',
    'codex.s1.title': '① 晶体管 = ERC-1155 Token',
    'codex.s1.body': '一颗 NAND 就是一颗晶体管，同质化 Token。链上记录只有 7 个字节：1 字节操作码 + 3 字节输入 A + 3 字节输入 B。它只会做一件事：out = NOT(A AND B)。',
    'codex.s2.title': '② 电路 = ERC-721 NFT',
    'codex.s2.body': '流片后的电路是 NFT。它的逻辑是“数据”而不是“代码”：没有调用别人的能力，没有可写状态，所以陌生人写的最坏逻辑也只能返回一个错误答案，伤不到调用者。',
    'codex.s3.title': '③ 流片 = 销毁 Token，铸造电路',
    'codex.s3.body': '画布上的连线在你的浏览器里免费试错。点下「流片」时，NAND Token 被真实销毁，电路 NFT 诞生并记录网表、引脚数与每门 7 字节的字节码。5 颗 = 半加器，9 颗 = 全加器，36 颗 = 四位加法器。',
    'codex.s4.title': '④ 求值 = 永远开着的函数',
    'codex.s4.body': '任何人都能调用 eval：只读查询，不需要钱包，不留交易，不付 gas。节点算完把答案还给你。BNB Chain 上任何合约都可以把你的电路当成自己的一段逻辑。',
    'codex.s5.title': '⑤ 时钟 = 出块',
    'codex.s5.body': 'BNB Chain 平均 0.45 秒出一个区块，于是这台处理器的默认时钟是 2.22 Hz：每个新区块推进一个时钟周期。它由共识驱动，无法被暂停；工厂合约部署后已放弃全部权限。',
    'codex.s6.title': '⑥ 乐高：黑盒复用',
    'codex.s6.body': '已经流片的电路可以当作黑盒拖进下一张画布，接上引脚继续用。晶体管 → 电路 → 处理器，每一层都是同一套结构。本作第六章演示的复用全加器用了 13 颗门，而手工优化版只要 9 颗。',
    'codex.s7.title': '⑦ 巨兽 Behemoth',
    'codex.s7.body': '第一台链上处理器按 1971 年 Intel 4004 的规格打造：2300 个晶体管、4 位、2.22 Hz。只要链还在，它就永远运行，还可以通过继续流片新电路来扩展能力。',
    'codex.close': '关闭档案',
    'codex.note': '本实验室是协议演示，不是真实钱包或链上交易；所有数值为教学用合成数据。',

    'chapter.0.title': '铸币 · 晶体管',
    'chapter.0.subtitle': '一颗 Token，就是一颗晶体管',
    'chapter.0.tag': '第一章',
    'chapter.0.intro': 'TapeOut 把与非门做成 ERC-1155 Token：一颗 Token 就是一颗晶体管，链上记录只占 7 个字节。先在硅片上铸出 8 颗，看看它们长什么样。',
    'chapter.0.fact': '7 字节 = 1 字节操作码 + 3 字节输入 A + 3 字节输入 B',
    'chapter.1.title': '与非门 · 谁都能算',
    'chapter.1.subtitle': '整个世界只需要一种门',
    'chapter.1.tag': '第二章',
    'chapter.1.intro': '与非门接收两个布尔值，输出“取反的交集”：只有两个输入都为 1 时输出才为 0。放入一颗晶体管，把 A、B 接上，再试遍四种输入组合。',
    'chapter.1.fact': 'NAND = NOT(A AND B)。所有计算都可以只用这一种门搭出来。',
    'chapter.2.title': '半加器 · 五颗晶体管',
    'chapter.2.subtitle': '让电路第一次会算加法',
    'chapter.2.tag': '第三章',
    'chapter.2.intro': '把 5 颗与非门按规则连起来，就得到半加器：SUM 输出异或，CARRY 输出进位。穷举 4 种输入，亲眼看到它和真实加法完全一致。',
    'chapter.2.fact': '5 颗晶体管 = 半加器；9 颗 = 全加器；36 颗 = 四位加法器。',
    'chapter.3.title': '流片 · 蚀刻成 NFT',
    'chapter.3.subtitle': '晶体管被销毁，电路永久上链',
    'chapter.3.tag': '第四章',
    'chapter.3.intro': '点击「流片」：晶体管 Token 被销毁，电路以 ERC-721 NFT 的形式登记在链上。它的逻辑变成一段只能计算、无法作恶的数据。',
    'chapter.3.fact': '电路 = NFT；逻辑 = 链上数据，不是代码。它没有调用别人、写入状态的能力。',
    'chapter.4.title': '时钟 · 记忆',
    'chapter.4.subtitle': '第一个节拍让世界有了记忆',
    'chapter.4.tag': '第五章',
    'chapter.4.intro': '只有与非门的世界没有记忆。把两个与非门交叉相连，就得到一位状态：锁存器。BNB Chain 每 0.45 秒出一个块，那就是它的心跳。注意交叉反馈需要两个节拍才能稳定——这是真实电路的行为。',
    'chapter.4.fact': '只有与非门的世界没有记忆，而没有记忆的东西不能称之为计算机。',
    'chapter.5.title': '乐高 · 黑盒复用',
    'chapter.5.subtitle': '把已流片的电路当成积木',
    'chapter.5.tag': '第六章',
    'chapter.5.intro': '已经流片的半加器可以当作黑盒直接放进新画布。两个半加器 + 一个或门就是全加器：复用让设计变简单，代价是 13 颗门，而不是手工优化的 9 颗。',
    'chapter.5.fact': '晶体管 → 电路 → 处理器，每一层用的都是同一套结构。',
    'chapter.6.title': '巨兽 · 链上 CPU',
    'chapter.6.subtitle': '没人能拔掉电源的处理器',
    'chapter.6.tag': '第七章',
    'chapter.6.intro': '把镜头拉远：数以百万计的门排列成裸片，出块就是时钟。这台按 1971 年 Intel 4004 规格打造的链上处理器「巨兽」有 2300 个晶体管、2.22 Hz，只要链还在，它就永远运行。',
    'chapter.6.fact': 'CPU 的时钟来自链上出块：每个新区块推进一个时钟周期。工厂合约已放弃全部权限。',
  },

  en: {
    'panel.title': 'TapeOut 3D Lab',
    'panel.subtitle': 'From one NAND gate to the on-chain Behemoth',
    'panel.close': 'Back to chat',
    'panel.codex': 'Codex',
    'panel.reset': 'Reset mission',
    'panel.hint': 'Hint',
    'panel.pause': 'Pause demo',
    'panel.resume': 'Resume demo',
    'panel.speed': 'Slow ×4',
    'panel.speedNormal': 'Real time',
    'panel.camera': 'Reset camera',
    'panel.chapterRail': 'Chapters',
    'panel.data': 'Data panel',
    'panel.dataHide': 'Hide data',
    'panel.introStart': 'Start mission',
    'panel.intro': 'Chapter brief',
    'panel.guide': 'Getting started',
    'welcome.tag': 'First time here?',
    'welcome.title': 'Find your entry in 3 minutes',
    'welcome.body': 'This is a 3D lab where NAND gates become tokens and circuits become NFTs. Not sure where to start? Pick a path and I will take you there.',
    'welcome.beginner': 'Start from zero',
    'welcome.beginnerDesc': 'Begin at chapter 1 by minting a NAND gate, with hints and guided clicks',
    'welcome.player': 'I want to play',
    'welcome.playerDesc': 'Jump into the playground: chain snake, music box, matrix',
    'welcome.tech': 'I am technical',
    'welcome.techDesc': 'Go straight to the lab: truth-table synthesizer and 3D sandbox',
    'welcome.skip': 'Just look around',
    'welcome.foot': 'Reopen this guide anytime with 🧭 above; protocol details live in 📖.',
    'welcome.goBeginner': 'Chapter 1 opened — mint 8 NAND gates first.',
    'welcome.goPlayer': 'Playground opened — try chain snake.',
    'welcome.goTech': 'Lab opened — start with the truth-table synthesizer.',

    'panel.introCodex': 'Read the codex',
    'panel.verifying': 'Exhaustively verifying…',
    'panel.foldCard': 'Collapse mission card',
    'panel.unfoldCard': 'Expand mission card',
    'panel.controls': 'Drag to orbit · wheel to zoom · click pins to wire · click empty space to cancel · 1–9 chapters · [ ] step · H hint',
    'panel.modeArcade': 'Playground',
    'arcade.badge': 'PLAYGROUND',
    'arcade.title': 'Logic playground',
    'arcade.sub': 'Play a NAND music box, light an 8×8 matrix, solve logic puzzles, or play circuit doctor.',
    'arcade.game.music': 'NAND music box',
    'arcade.game.pixel': '8×8 matrix',
    'arcade.game.lock': 'Code lock',
    'arcade.game.guess': 'Guess number',
    'arcade.game.vote': 'Voter',
    'arcade.game.debug': 'Debug lab',
    'arcade.game.snake': 'Chain snake',

    'arcade.snake.title': 'Chain snake',
    'arcade.snake.hint': 'The snake moves one cell every 0.45 s — its state is a few registers, the clock is block production.',
    'arcade.snake.play': '▶ Start',
    'arcade.snake.pause': '⏸ Pause',
    'arcade.snake.reset': 'Restart',
    'arcade.snake.score': 'Score',
    'arcade.snake.dir': 'Dir',
    'arcade.snake.keys': 'arrows / WASD',
    'arcade.snake.over': 'Crashed!',
    'arcade.snake.how': 'What it is at gate level',
    'arcade.snake.body': 'A real build: 8×8 matrix + row/column counters + comparators checking the head against food and body, with state registers updated every clock.',
    'arcade.snake.clock': 'Snake speed is the chain clock (2.22 Hz); you cannot make blocks faster, only add more parallel circuits.',
    'lab.export.hex': 'Copy hex',
    'lab.export.verilog': 'Copy Verilog',
    'lab.export.json': 'Copy JSON',
    'lab.export.csv': 'Copy truth-table CSV',
    'lab.copied': 'Copied to clipboard',
    'lab.export.title': 'Export',
    'lab.copyFail': 'Copy failed — select the text manually',
    'lab.archive.title': 'Archive code',
    'lab.archive.export': 'Copy archive code',
    'lab.archive.import': 'Import archive code',
    'lab.archive.hint': 'The archive code packs the whole circuit library into one text; paste it on another machine to restore.',
    'lab.archive.placeholder': 'Paste an archive code…',
    'lab.importDone': 'Imported {n} circuits',
    'lab.importFail': 'Invalid archive code: {error}',
    'arcade.scale.major': 'Major',
    'arcade.scale.penta': 'Pentatonic',
    'arcade.scale.minor': 'Minor',
    'arcade.tune.scale': 'Scale run',
    'arcade.tune.twinkle': 'Twinkle',
    'arcade.tune.beep': 'Square practice',
    'arcade.tune.ode': 'Ode to Joy',
    'arcade.tempo.slow': 'Slow',
    'arcade.tempo.normal': 'Medium',
    'arcade.tempo.fast': 'Fast',
    'arcade.music.title': 'NAND music box',
    'arcade.music.hint': 'A 4-bit counter plus a scale table turns blocks into beats.',
    'arcade.music.play': '▶ Play',
    'arcade.music.stop': '⏸ Stop',
    'arcade.music.tempo': 'Tempo',
    'arcade.music.scale': 'Scale',
    'arcade.music.tune': 'Tune',
    'arcade.music.now': 'Now',
    'arcade.music.how': 'What it is at gate level',
    'arcade.music.howBody': 'A real build uses a 4-bit counter (4 latches + 15 NAND gates) to drive a note table: every block increments the counter, selects a frequency and beeps. That is music driven by chain blocks.',
    'arcade.music.scales': 'Scales',
    'arcade.music.tunes': 'Tunes',
    'arcade.music.clock': 'Default clock 2.22 Hz (0.45 s per block): slow, but it never stops.',
    'arcade.pixel.title': '8×8 LED matrix',
    'arcade.pixel.hint': 'Draw pixels and animate them with the chain clock.',
    'arcade.pixel.play': '▶ Animate',
    'arcade.pixel.pause': '⏸ Pause',
    'arcade.pixel.clear': 'Clear',
    'arcade.pixel.patterns': 'Presets',
    'arcade.pixel.patternHint': 'Each pixel is one truth-table output in a real build.',
    'arcade.pixel.pattern.heart': 'Heart',
    'arcade.pixel.pattern.arrow': 'Arrow',
    'arcade.pixel.pattern.smile': 'Smile',
    'arcade.pixel.playHint': 'A real build scans rows/columns with counters and lights the matching LEDs; an 8×8 matrix is hundreds of NAND gates.',
    'arcade.pixel.clock': 'One block every 0.45 s: the animation speed is the chain clock.',
    'arcade.lock.title': '4-bit code lock',
    'arcade.lock.hint': 'Guess the 4-bit code; each check reports which bits match.',
    'arcade.lock.check': 'Check',
    'arcade.lock.reset': 'Retry',
    'arcade.lock.attempts': 'Attempts',
    'arcade.lock.solved': 'Unlocked!',
    'arcade.lock.last': 'Last guess',
    'arcade.lock.circuit': 'It is really a comparator',
    'arcade.lock.body': 'A 4-bit code lock is 4 XNOR gates + a 4-input AND: every bit equal means unlocked. One XNOR is 4 NAND gates, so the whole lock is about 20 transistors.',
    'arcade.guess.title': 'Guess the number (LFSR)',
    'arcade.guess.hint': 'The system hides 0–15; guess in binary and get “too big / too small”.',
    'arcade.guess.value': 'Guess',
    'arcade.guess.submit': 'Guess!',
    'arcade.guess.restart': 'New number',
    'arcade.guess.tries': 'Tries',
    'arcade.guess.solved': 'Correct! The answer was',
    'arcade.guess.how': 'How “random” works',
    'arcade.guess.body': 'Chains have no true randomness: an LFSR (a few flip-flops and XOR gates) produces a pseudo-random sequence. Four bits are enough.',
    'arcade.guess.lfsr': 'This page simulates a local pseudo-random sequence; real on-chain randomness needs extra machinery.',
    'arcade.vote.title': 'Three-person voter',
    'arcade.vote.hint': 'Two out of three yes — a majority gate.',
    'arcade.vote.table': 'Truth table',
    'arcade.debug.title': 'Debug lab',
    'arcade.debug.hint': 'Each circuit has one wrong wire; read the truth-table diff and pick the fix.',
    'arcade.debug.buggy': 'Faulty circuit',
    'arcade.debug.expect': 'Expected',
    'arcade.debug.actual': 'Actual',
    'arcade.debug.fixed': 'Fixed!',
    'arcade.debug.wrong': 'Still wrong',
    'arcade.debug.inspect': 'Inspect',
    'arcade.debug.options': 'Candidate fixes',
    'arcade.debug.next': 'Next faulty circuit',
    'arcade.debug.why': 'Why this is useful',
    'arcade.debug.body': 'Real chip debugging is comparing expected vs actual truth tables and locating one wire. The five levels cover XOR, majority, equality, a seven-segment bit and parity.',
    'arcade.debug.scope': 'Gates are numbered from 1; node 0/1 are constants and nodes 2+ are inputs.',
    'arcade.debug.xor': 'XOR',
    'arcade.debug.majority': 'Majority',
    'arcade.debug.equal': 'Equality',
    'arcade.debug.seg': '7-seg bit',
    'arcade.debug.parity': 'Parity',
    'panel.modeMissions': 'Missions',
    'panel.prevChapter': 'Previous chapter',
    'panel.soundOn': 'Sound: on',
    'panel.soundOff': 'Sound: off',
    'panel.cinema': 'Cinema mode: auto demo',
    'panel.cinemaStop': 'Stop demo',
    'cinema.running': 'Auto demo',
    'cinema.started': 'Cinema mode: minting through safety circuit.',
    'cinema.stopped': 'Cinema mode stopped.',
    'cinema.done': 'Auto demo complete: all 11 chapters ran.',
    'panel.nextChapter': 'Next chapter',
    'panel.modeLab': 'Lab',
    'panel.progress': '{done}/{total} chapters',
    'panel.progressAll': 'all eleven done',
    'finale.title': 'All eleven chapters complete',
    'finale.sub': 'From a 7-byte NAND gate to seven-segment displays, counters, a mini computer and a real project safety circuit.',
    'finale.stat.chapters': 'Chapters',
    'finale.stat.minted': 'Transistors minted',
    'finale.stat.circuits': 'Circuits taped out',
    'finale.stat.gates': 'NAND burned',
    'finale.stat.blocks': 'Chain blocks',
    'finale.chapters': 'Eleven-chapter recap',
    'finale.note': 'Every step exists in the real TapeOut protocol: token → canvas wiring → tape-out → circuit NFT → black-box reuse → a block-driven on-chain CPU.',
    'finale.replay': 'Play again',
    'finale.stay': 'Stay in the lab',
    'toast.allDone': 'All eleven chapters complete! From transistors to a real safety circuit, you have walked the whole TapeOut pipeline.',
    'toast.resetAll': 'Lab reset: all seven chapters are fresh again.',

    'hud.nand': 'NAND balance',
    'hud.nandUnit': 'gates',
    'hud.circuits': 'Taped-out circuits',
    'hud.circuitUnit': 'NFTs',
    'hud.blocks': 'Chain block',
    'hud.clock': 'Clock',
    'hud.clockUnit': 'Hz',
    'hud.erc1155': 'ERC-1155 · 7 bytes',
    'hud.erc721': 'ERC-721 · logic is data',
    'hud.gates': 'Gates',
    'hud.pins': 'Pins',
    'hud.state': 'State bits',
    'hud.depth': 'Depth',
    'hud.bytes': 'Bytecode',
    'hud.netlist': 'Netlist',
    'hud.verify': 'Exhaustive check',
    'hud.verifyPass': 'passed',
    'hud.verifyFail': 'failed',
    'hud.verifyIncomplete': 'wire it up',
    'hud.verifyRows': 'Checked',
    'hud.rowsUnit': 'rows',
    'hud.truthTable': 'Truth table',
    'hud.visited': 'Inputs tried',
    'hud.eval': 'Read-only eval',
    'hud.free': 'Free · no wallet · no transaction left',
    'hud.evalInput': 'Input bits',
    'hud.evalOutput': 'Output bits',
    'hud.wave': 'Clock waveform',
    'hud.waveS': 'S',
    'hud.waveR': 'R',
    'hud.waveQ': 'Q',
    'hud.waveQn': 'Q̄',
    'hud.blockTick': 'One block advances one clock cycle',
    'hud.settle': 'Cross-coupled feedback needs 2 beats to settle',
    'hud.program': 'Program',
    'hud.programOp': '{a} + {b}',
    'hud.result': 'Result',
    'hud.resultSeg': 'Seven-segment',
    'hud.running': 'Rippling carries…',
    'hud.cpuStory': '2300 transistors · 4-bit · 2.22 Hz · never powers off',
    'hud.nft': 'Freshly minted circuit NFT',
    'hud.token': 'NAND transistor token',
    'hud.chip7': 'One chip = 7 bytes of on-chain data',

    'dock.mintAll': 'Mint them all',
    'dock.placeGate': 'Place a NAND gate',
    'dock.placeGateN': 'Place NAND gate ({left} left)',
    'dock.inputOn': 'Set {p} to 1',
    'dock.inputOff': 'Set {p} to 0',
    'dock.assist': 'Assist: next wire',
    'dock.clearWires': 'Clear wiring',
    'dock.tapeout': 'Tape out',
    'dock.tapeoutLego': 'Tape out the adder',
    'dock.freeEval': 'Free eval',
    'dock.setLow': 'Pull S low (set)',
    'dock.setHigh': 'Release S (keep 1)',
    'dock.resetLow': 'Pull R low (reset)',
    'dock.resetHigh': 'Release R (keep 1)',
    'dock.placeBox': 'Drop black box ({left} left)',
    'dock.runProgram': 'Run {a} + {b}',
    'dock.again': 'Another sum',
    'dock.nextChapter': 'Done — next chapter',

    'goal.mintChips': 'Mint {n} NAND transistors',
    'goal.seeToken': 'Inspect what one token is',
    'goal.placeGate': 'Place a NAND gate',
    'goal.wireGate': 'Wire A and B into the gate',
    'goal.allInputs': 'Try all 4 input pairs ({visited}/4)',
    'goal.verifyPass': 'Exhaustively verify the NAND truth table',
    'goal.placeGates': 'Place 5 NAND gates ({placed}/5)',
    'goal.wireCount': 'Wire it up ({done}/{n})',
    'goal.verifyHalf': 'Exhaustively verify SUM and CARRY',
    'goal.chooseDesign': 'Choose the design to tape out',
    'goal.tapeout': 'Tape out and mint the circuit NFT',
    'goal.freeEval': 'Call the read-only eval once',
    'goal.latchSet': 'Set the latch (Q=1)',
    'goal.latchHold': 'Hold Q=1 stable ({done}/3 beats)',
    'goal.latchReset': 'Reset it (Q=0)',
    'goal.placeBoxes': 'Drop black boxes ({done}/3)',
    'goal.verifyFull': 'Exhaustively verify the 3-bit adder',
    'goal.runProgram': 'Run the program',
    'goal.seeResult': 'See the seven-segment result',

    'hint.mint': 'Click the glowing chips on the die to mint {n} NAND transistors.',
    'hint.nandPlace': 'Press “Place a NAND gate”, then click its input pins to wire it.',
    'hint.nextWire': 'Next: connect {source} to {sink}. Pins glow as a guide.',
    'hint.nandWire': 'Click an input pin (A or B), then a gate input pin.',
    'hint.nandToggle': 'Click the A and B pads and try all 4 pairs ({n}/4 done).',
    'hint.halfPlace': '{n} more gate(s) to place in the guided slots.',
    'hint.halfFail': 'Check failed: follow the hint wire, or press “Assist: next wire”.',
    'hint.halfDone': 'Half adder verified. Tape it out in the next chapter.',
    'hint.tapeoutStart': 'Press “Tape out”: the tokens burn and the circuit becomes an NFT.',
    'hint.tapeoutRunning': 'Etching: the bytecode is written gate by gate.',
    'hint.tapeoutDone': 'It is on chain. Try the free read-only eval — a wrong answer costs nothing.',
    'hint.latchForbidden': 'S and R both low is the forbidden state: Q and Q̄ oscillate. Release one input to settle the feedback.',
    'chapter.7.title': 'Seven-segment · 100 transistors',
    'chapter.7.subtitle': 'Numbers light up for the first time',
    'chapter.7.tag': 'Chapter 8',
    'chapter.7.intro': 'Four input bits make sixteen combinations; translate 0–9 into the seven segments. The protocol names this as the 100-transistor classic, so let the synthesizer build the gate-level circuit, exhaustively verify it, tape it out, and light real digits.',
    'chapter.7.fact': 'Seven-segment decoder = 4 inputs, 7 outputs; digits 0–9, blank for 10–15.',
    'chapter.8.title': 'Counter · the shape of time',
    'chapter.8.subtitle': 'Every block, plus one',
    'chapter.8.tag': 'Chapter 9',
    'chapter.8.intro': 'Four latches plus an adder make a binary counter: one block, one increment, from 0000 to 1111 and back. This is how the on-chain CPU’s “time” grows, one block at a time.',
    'chapter.8.fact': '4-bit counter = 4 state bits + 15 NAND gates; +1 per beat, wraps on beat 16.',
    'chapter.9.title': 'Mini computer · run a program',
    'chapter.9.subtitle': 'Registers, ALU and a program counter',
    'chapter.9.tag': 'Chapter 10',
    'chapter.9.intro': 'A 4-bit computer: 16 bytes of RAM, accumulator A, program counter PC and instruction register IR. Load a program and let every chain block execute one instruction: 3+5, sum 1..5 and even a multiply running above the gates.',
    'chapter.9.fact': 'Fetch → decode → execute: a CPU just repeats these three steps over clock, registers and ALU.',
    'chapter.10.title': 'Safety circuit · real project link',
    'chapter.10.subtitle': 'TapeRover’s 16-input / 80-gate safety gate',
    'chapter.10.tag': 'Chapter 11',
    'chapter.10.intro': 'This is the real safety circuit used by TapeRover: 16 boolean inputs, 80 NAND gates, 4 mutually exclusive outputs. Flip the inputs to let the rover move, slow down, return home or stop, then audit all 65,536 combinations to prove exactly one output is ever true.',
    'chapter.10.fact': '16 inputs / 80 gates / 4 exclusive outputs · 65,536 combinations audited.',
    'goal.segSynth': 'Synthesize the seven-segment decoder',
    'goal.segVerify': 'Exhaustively verify all 16 inputs',
    'goal.segDigits': 'Light the digits 0–9 ({n}/10)',
    'goal.countSix': 'Let the counter reach 6 beats',
    'goal.count15': 'Reach 1111 (15)',
    'goal.countWrap': 'Wrap back to 0000',
    'goal.cpuAdd': 'Run 3 + 5 = 8',
    'goal.cpuSum': 'Run 1+2+3+4+5 = 15',
    'goal.cpuMul': 'Run 3 × 4 = 12',
    'goal.cpuStep': 'Single-step 3 instructions ({n}/3)',
    'goal.safetyModes': 'Trigger all four permissions ({n}/4)',
    'goal.safetyAudit': 'Audit 65,536 inputs for exclusivity',
    'hint.segSynth': 'Press “Synthesize the decoder”: seven segment circuits are generated automatically.',
    'hint.segVerify': 'Press “Exhaustively verify” to run all 16 input rows.',
    'hint.segTapeout': 'Once verified, tape out: the hundred-plus transistors burn.',
    'hint.segDigits': 'Toggle the four input pads to show digits 0–9 ({n}/10).',
    'hint.counterBeats': 'A block every 0.45 s advances the counter by one ({n} beats).',
    'hint.counterWrap': 'Almost: after 1111 wait one more beat to see the wrap to 0000.',
    'hint.counterDone': 'Counter complete: you have seen time as blocks.',
    'hint.safetyAudit': 'Press “Audit 65,536”: exactly one output must be true for every input.',
    'hint.safetyModes': 'Use the presets or flip the 16 inputs until ALLOW / SLOW / RETURN / STOP have all appeared ({n}/4).',
    'hint.safetyTapeout': 'Tape out once the audit passes to put the real safety logic on chain.',
    'hint.safetyDone': 'Safety chapter complete: this is the real TapeRover project logic.',
    'dock.segSynth': 'Synthesize decoder',
    'dock.segVerify': 'Exhaustively verify',
    'dock.segTapeout': 'Tape out decoder',
    'dock.counterStep': 'Advance one beat',
    'dock.counterReset': 'Reset counter',
    'dock.cpuAdd35': 'Program: 3 + 5',
    'dock.cpuSum15': 'Program: sum 1..5',
    'dock.cpuMul12': 'Program: 3 × 4',
    'dock.cpuRun': 'Run program',
    'dock.cpuStep': 'Single step',
    'dock.cpuReset': 'Reload program',
    'dock.safetyAllow': 'Preset: ALLOW',
    'dock.safetySlow': 'Preset: SLOW',
    'dock.safetyHome': 'Preset: RETURN',
    'dock.safetyStop': 'Preset: STOP',
    'dock.safetyAudit': 'Audit 65,536',
    'dock.safetyTapeout': 'Tape out safety',
    'toast.toolMissing': 'This build is missing the matching logic module.',
    'toast.segSynthDone': 'Decoder synthesized: {n} NAND gates.',
    'toast.segVerified': 'All 16 input rows verified.',
    'toast.segVerifyFail': 'Verification failed — check the synthesis result.',
    'toast.segDone': 'Decoder taped out: numbers light up.',
    'toast.counterDone': 'Counter mission complete.',
    'toast.cpuProgramDone': 'Program halted with OUT = {out}.',
    'toast.cpuDoneAll': 'All three programs run: mini computer complete.',
    'toast.safetyAuditDone': 'Audited {n} rows: outputs stay mutually exclusive.',
    'toast.safetyAuditFail': 'Audit found an exclusivity violation.',
    'toast.safetyDone': 'Safety circuit taped out: the real project logic is fully verified.',
    'toast.synthFail': 'Synthesis failed: {error}',
    'toast.sandboxEmpty': 'Load a circuit into the sandbox first.',
    'toast.libraryFull': 'Circuit library is full (24).',
    'toast.cpuError': 'CPU error: {error}',
    'circuit.sevenSegment': 'Seven-segment decoder',
    'circuit.safety': 'Safety circuit (16→4)',
    'cpu.prog.add35': '3 + 5',
    'cpu.prog.sum15': 'Sum 1..5',
    'cpu.prog.mul12': '3 × 4',
    'hud.binary': 'Binary',
    'hud.decimal': 'Decimal',
    'hud.beats': 'Beats',
    'hud.next': 'Next',
    'hud.program': 'Program',
    'hud.pc': 'PC',
    'hud.ir': 'IR',
    'hud.acc': 'A',
    'hud.trace': 'Trace',
    'hud.mode': 'Permission',
    'hud.inputs': 'Inputs',
    'hud.violations': 'Violations',
    'hud.seen': 'Seen',
    'hud.digit': 'Digit',
    'hud.mask': 'Segment mask',
    'hud.segments': 'segments',
    'safety.allow': 'ALLOW_MOVE',
    'safety.slow': 'SLOW_MODE',
    'safety.home': 'RETURN_HOME',
    'safety.stop': 'STOP',
    'lab.badge': 'LAB · tools',
    'lab.title': 'Laboratory',
    'lab.sub': 'Truth-table synthesis, a component museum, a 3D circuit sandbox and a local circuit library. Circuits from the missions show up here too.',
    'lab.tab.synth': 'Synthesizer',
    'lab.group.intro': 'Basics',
    'lab.group.apps': 'Apps',
    'lab.group.eng': 'Engineering',
    'lab.paths': 'Suggested paths',
    'lab.path.beginner': '🐣 Learn basics',
    'lab.path.apps': '🎮 Build apps',
    'lab.path.eng': '🔧 Go hardware',
    'lab.path.back': '↩ Back to missions',

    'lab.tab.museum': 'Museum',
    'lab.tab.sandbox': 'Sandbox',
    'lab.tab.library': 'Library',
    'lab.tab.hardware': 'Hardware',
    'lab.tab.access': 'Access',
    'lab.tab.lottery': 'Lottery',
    'lab.tab.art': 'Art',
    'lab.tab.sensors': 'Sensors',
    'lab.tab.defi': 'DeFi guard',
    'defi.title': 'DeFi trade guard',
    'defi.sub': 'Slippage, cap, oracle, allowlist and pause compiled into a NAND guard; only an allowed trade executes in the simulated AMM.',
    'defi.pool.ethusdc': 'ETH / USDC pool',
    'defi.pool.btcusdc': 'BTC / USDC pool',
    'defi.pool.tapbnb': 'NAND / BNB pool',
    'defi.out': 'Expected out',
    'defi.impact': 'Price impact',
    'defi.amount': 'Amount in',
    'defi.maxImpact': 'Max impact',
    'defi.cap': 'Per-trade cap',
    'defi.flag.allowlisted': 'Allowlist',
    'defi.flag.oracle': 'Oracle fresh',
    'defi.flag.paused': 'Paused',
    'defi.guards': 'Guards (live)',
    'defi.pass': 'pass',
    'defi.fail': 'block',
    'defi.execute': 'Execute swap',
    'defi.reset': 'Reset pool',
    'defi.simulated': 'Simulated AMM · no wallet, no signing, no chain transaction',
    'defi.circuit.title': 'Guard circuit',
    'defi.circuit.hint': '4 boolean conditions → one NAND netlist anyone can recompute',
    'defi.audit': 'Exhaustive audit',
    'defi.issue': 'Issue receipt',
    'defi.receipt.empty': 'Tune the parameters, then issue a receipt.',
    'defi.blocked': 'Guard blocked: {reasons}',
    'defi.why.title': 'Why DeFi needs this',
    'defi.why.body': 'DeFi risk controls (pause switch, allowlist, caps, oracle freshness, slippage protection) are ideal as public verifiable logic: once compiled into a netlist, users can recompute for themselves why a trade was allowed or blocked.',
    'defi.why.note': 'This page is a simulated AMM: no wallet, no signatures, no transactions. A real protocol still needs audits, oracles and on-chain governance.',

    'sensor.title': 'Sensor rule engine',
    'sensor.sub': 'Analog sensors → thresholds → NAND logic → multiple actuators; rules are exhaustively auditable and receipts verify offline.',
    'sensor.inputs': 'Sensor inputs',
    'sensor.actuators': 'Actuators',
    'sensor.actuatorTitle': 'Actuator outputs (live)',
    'sensor.on': 'Triggered',
    'sensor.off': 'Normal',
    'sensor.firing': 'FIRING',
    'sensor.idle': 'idle',
    'sensor.threshold': 'threshold',
    'sensor.rows': 'checks',
    'sensor.none': 'none',
    'sensor.auditHint': 'Exhaustively check every boolean combination',
    'sensor.receipt.title': 'Verifiable receipt',
    'sensor.receipt.hint': 'Records raw readings, thresholds, boolean bits, actuators and netlist fingerprint.',
    'sensor.receipt.empty': 'Set the sensors, then issue a receipt.',
    'sensor.why.title': 'Why this design',
    'sensor.why.body': 'A real rule engine first turns analog readings into boolean bits with thresholds, then computes actuators with gates. This page exposes both steps: adjustable thresholds, visible bits, gate/depth stats and exhaustive checks.',
    'sensor.why.note': 'The receipt carries raw readings and thresholds; the verifier recomputes the bits and circuit outputs. Changing readings, thresholds or the circuit is detected. This is an offline demo; real TapeOut eval is an on-chain read-only call.',
    'sensor.scenario.home': 'Home security',
    'sensor.scenario.homeDesc': '(door OR window) AND away mode → alarm.',
    'sensor.scenario.fire': 'Fire interlock',
    'sensor.scenario.fireDesc': 'smoke AND (heat OR CO) → alarm; smoke AND heat → power cut; smoke AND CO → sprinkler.',
    'sensor.scenario.air': 'Ventilation',
    'sensor.scenario.airDesc': '(CO₂ high OR heat high) AND NOT smoke → fan; smoke → purifier (avoid recirculating smoke).',
    'sensor.scenario.interlock': 'Machine interlock',
    'sensor.scenario.interlockDesc': 'E-stop OR (gate open AND running) → stop; E-stop OR gate open → alarm.',
    'sensor.scenario.server': 'Server room',
    'sensor.scenario.serverDesc': 'Heat AND humidity → AC; water leak → power cut; leak OR (heat AND humidity) → alarm.',
    'sensor.door': 'Door contact',
    'sensor.window': 'Window contact',
    'sensor.away': 'Away mode',
    'sensor.smoke': 'Smoke',
    'sensor.heat': 'Temperature',
    'sensor.co': 'Carbon monoxide',
    'sensor.co2': 'Carbon dioxide',
    'sensor.humidity': 'Humidity',
    'sensor.water': 'Water leak',
    'sensor.estop': 'E-stop',
    'sensor.gate': 'Safety gate',
    'sensor.running': 'Machine running',
    'sensor.smoke.th': 'Smoke threshold',
    'sensor.heat.th': 'Heat threshold',
    'sensor.co.th': 'CO threshold',
    'sensor.co2.th': 'CO₂ threshold',
    'sensor.humidity.th': 'Humidity threshold',
    'actuator.alarm': 'Alarm',
    'actuator.powerCut': 'Power cut',
    'actuator.sprinkler': 'Sprinkler',
    'actuator.fan': 'Ventilation',
    'actuator.purify': 'Purifier',
    'actuator.stop': 'Machine stop',
    'actuator.ac': 'Air conditioning',

    'art.title': 'Generative art / one frame per block',
    'art.sub': 'Circuit state determines the picture: the same seed and block index always yield the same frame — exportable, verifiable, collectible.',
    'art.play': '▶ Animate',
    'art.pause': '⏸ Pause',
    'art.step': 'Next frame',
    'art.reset': 'Back to frame 0',
    'art.block': 'one block, one frame',
    'art.seed': 'Seed',
    'art.circuit': 'State source',
    'art.circuit.lfsr': '8-bit LFSR',
    'art.circuit.counter': '4-bit counter',
    'art.circuit.gates': 'Combinational hash',
    'art.palette': 'Palette',
    'art.palette.cyber': 'Cyber',
    'art.palette.riso': 'Riso',
    'art.palette.mono': 'Mono',
    'art.exportPng': 'Export PNG',
    'art.copyCode': 'Copy artwork code',
    'art.mint': 'Mint to gallery',
    'art.hash': 'Frame hash',
    'art.exported': 'PNG exported',
    'art.exportFail': 'PNG export is unavailable here',
    'art.verify.title': 'Verify artwork',
    'art.verify.hint': 'Paste an artwork code; anybody can recompute the same frame hash.',
    'art.verify.placeholder': 'Paste an artwork code…',
    'art.verify.hashPlaceholder': 'Expected frame hash (optional)',
    'art.verify.run': 'Verify',
    'art.verify.pass': 'Verified',
    'art.verify.fail': 'Verification failed',
    'art.gallery.title': 'My gallery',
    'art.gallery.empty': 'Nothing minted yet — press “Mint to gallery”.',
    'art.nft': 'NFT narrative: the artwork code records the seed, state source, block index and frame hash; the picture is deterministic from circuit state, so every block is a new frame — a natural collectible/verifiable story.',

    'lottery.title': 'Verifiable lottery / randomness',
    'lottery.sub': 'Public seed + participant list determines the winners; anyone can recompute offline and nobody can change it afterwards.',
    'lottery.seed': 'Public seed / block hash',
    'lottery.newSeed': 'Use current block',
    'lottery.count': 'Winners',
    'lottery.people': 'participants',
    'lottery.peoplePlaceholder': 'One name per line…',
    'lottery.seedHash': 'Seed hash',
    'lottery.draw': 'Draw',
    'lottery.winners': 'Winners',
    'lottery.algorithm': 'Algorithm',
    'lottery.empty': 'Fill in participants and a seed, then press “Draw”.',
    'lottery.receipt.title': 'Lottery receipt',
    'lottery.receipt.hint': 'Seed, list and result packed into one text for offline verification.',
    'lottery.receipt.empty': 'A receipt is generated automatically after a draw.',
    'lottery.receipt.copy': 'Copy receipt',
    'lottery.verify.title': 'Verify receipt',
    'lottery.verify.placeholder': 'Paste a lottery receipt…',
    'lottery.verify.hashPlaceholder': 'Expected seed hash (optional)',
    'lottery.verify.run': 'Verify',
    'lottery.verify.pass': 'Verified',
    'lottery.verify.fail': 'Verification failed',
    'lottery.verify.use': 'Load',
    'lottery.how.title': 'How verifiability works',
    'lottery.how.body': 'Each participant gets key = FNV1a(seed | index | name); sort ascending and take the top N. Once the seed is public anyone can recompute the same result; changing names, seed or order is detected.',
    'lottery.how.warn': 'Real lotteries must prevent “seed shopping”: commit to the seed first, or use drand / a VRF. This page is an offline algorithm demo.',
    'lottery.lfsr.title': 'LFSR circuit view (8-bit)',
    'lottery.lfsr.note': 'Real randomness is often derived by an 8-latch shift register with 3 XORs (≈20 NAND gates); this demo recomputes in software.',
    'lottery.error': 'Draw failed: {error}',

    'access.title': 'Verifiable access / eligibility',
    'access.sub': 'Pick a policy, the plugin synthesizes it into NAND gates; flip conditions and issue an offline-verifiable receipt.',
    'access.policy.simple': 'Simple gate',
    'access.policy.simpleDesc': 'Valid card AND adult — the simplest access rule, two inputs.',
    'access.policy.member': 'Member + blocklist',
    'access.policy.memberDesc': 'Valid card AND adult AND not on the blocklist.',
    'access.policy.invite': 'Member / invite',
    'access.policy.inviteDesc': 'Valid card AND adult AND (member OR invite code).',
    'access.policy.multisig': 'Multisig release',
    'access.policy.multisigDesc': 'At least two of three signers AND amount within limit.',
    'access.policy.staff': 'Staff / temporary',
    'access.policy.staffDesc': 'Valid card AND (staff OR (temporary AND manager approval)).',
    'access.input.card': 'Valid card',
    'access.input.adult': 'Adult',
    'access.input.blacklist': 'On blocklist',
    'access.input.member': 'Member',
    'access.input.invite': 'Invite code',
    'access.input.signA': 'Signer A',
    'access.input.signB': 'Signer B',
    'access.input.signC': 'Signer C',
    'access.input.amount': 'Amount ok',
    'access.input.staff': 'Staff',
    'access.input.temp': 'Temporary',
    'access.input.manager': 'Manager approval',
    'access.issue': 'Issue receipt',
    'access.verify.fingerprint': 'Fingerprint',
    'defi.guard.open': 'Allowlisted and open',
    'defi.guard.oracle': 'Oracle data fresh',
    'defi.guard.impact': 'Price impact within limit',
    'defi.guard.cap': 'Amount within cap',
    'hint.chapterDone': 'Chapter complete ✓ — use the dock button to continue.',
    'access.conditions': 'Conditions (click to toggle)',
    'access.allow': 'ALLOW',
    'access.deny': 'DENY',
    'access.audit': 'Exhaustive audit',
    'access.auditHint': 'Run every input row and check the circuit matches the policy',
    'access.fingerprint': 'Policy fingerprint',
    'access.allowShort': 'Allow rows',
    'access.denyShort': 'Deny rows',
    'access.receipt.title': 'Verifiable receipt',
    'access.receipt.hint': 'Packs policy, inputs, result and netlist fingerprint into one text anybody can recompute offline.',
    'access.receipt.empty': 'Set the conditions, then press “Issue receipt”.',
    'access.receipt.copy': 'Copy receipt code',
    'access.receipt.fingerprint': 'Fingerprint',
    'access.verify.title': 'Verify receipt',
    'access.verify.codePlaceholder': 'Paste a receipt code…',
    'access.verify.hashPlaceholder': 'Expected policy fingerprint (optional)',
    'access.verify.run': 'Verify',
    'access.verify.pass': 'Verified',
    'access.verify.fail': 'Verification failed',
    'access.verify.use': 'Load',
    'access.why.title': 'Why this is verifiable',
    'access.why.body': 'The circuit is pure data and a read-only function: no writable state, no external calls. Anyone can recompute the same result from the netlist and inputs embedded in the receipt; tampering with inputs, result or circuit is detected.',
    'access.why.note': 'This demo verifies offline; real TapeOut eval is an on-chain read-only call, and a hostile circuit can at worst return a wrong answer.',
    'access.why.bytes': 'Bytes/gate',
    'access.why.state': 'Writable state',
    'access.why.readonly': 'Evaluation',

    'lab.hardware.title': 'Real hardware build (74HC00)',
    'lab.hardware.hint': 'Translate a combinational netlist into chip count, gate pin assignment, breadboard wiring and a shopping list.',
    'lab.hardware.fromResult': 'Use synthesis result',
    'lab.hardware.fromSandbox': 'Use sandbox circuit',
    'lab.hardware.chips': '74HC00 chips',
    'lab.hardware.wires': 'Wires',
    'lab.hardware.boards': 'Breadboards',
    'lab.hardware.bom': 'Bill of materials',
    'lab.hardware.item': 'Part',
    'lab.hardware.qty': 'Qty',
    'lab.hardware.note': 'Note',
    'lab.hardware.pins': 'Gate / pin assignment',
    'lab.hardware.chip': 'Chip',
    'lab.hardware.unit': 'Unit',
    'lab.hardware.wiresTitle': 'Breadboard wiring list',
    'lab.hardware.copyBom': 'Copy BOM CSV',
    'lab.hardware.copyWires': 'Copy wiring CSV',
    'lab.hardware.copyGuide': 'Copy build guide',
    'lab.hardware.empty': 'No circuit yet: synthesize a logic function or open a sandbox circuit, then come back.',
    'lab.hardware.goSynth': 'Go to synthesizer',
    'lab.hardware.goSandbox': 'Go to sandbox',
    'lab.hardware.steps': 'Build order: straddle the chips, wire VCC/GND + decoupling → inputs per pin table → outputs via 330Ω LEDs → check for shorts before power → verify row by row. Sequential circuits need extra clock chips.',

    'lab.synth.title': 'Truth table → NAND netlist',
    'lab.synth.hint': 'Click cells to cycle 0 / 1 / don’t-care; Quine–McCluskey minimization is mapped to NAND gates.',
    'lab.synth.inputs': 'Inputs',
    'lab.synth.clear': 'Clear',
    'lab.synth.run': 'Synthesize & verify',
    'lab.synth.sandbox': 'Open in sandbox',
    'lab.synth.save': 'Save to library',
    'lab.synth.result': 'Result',
    'lab.synth.gates': 'gates',
    'lab.synth.literals': 'Literals',
    'lab.synth.terms': 'Terms',
    'lab.synth.rows': 'Rows',
    'lab.synth.empty': 'No result yet. Set a few 1s, then press “Synthesize & verify”.',
    'lab.synth.expect': 'Expected',
    'lab.synth.actual': 'Actual',
    'lab.verify.pass': 'verified',
    'lab.verify.fail': 'failed',
    'lab.museum.title': 'Component museum',
    'lab.museum.hint': 'Every gate ends up as NAND gates; “Open in sandbox” shows the real netlist in 3D.',
    'lab.museum.stateful': 'Stateful · needs a clock',
    'lab.museum.open': 'Open in sandbox',
    'lab.library.title': 'My circuit library',
    'lab.library.empty': 'Nothing saved yet. Build something in the synthesizer.',
    'lab.sandbox.title': '3D circuit sandbox',
    'lab.sandbox.empty': 'No circuit loaded. Send one from the synthesizer or the museum.',
    'lab.sandbox.fromSynth': 'Open synthesis result',
    'lab.sandbox.fromMuseum': 'Go to museum',
    'lab.sandbox.inputs': 'Toggle inputs',
    'museum.notGate.name': 'NOT gate',
    'museum.andGate.name': 'AND gate',
    'museum.orGate.name': 'OR gate',
    'museum.xorGate.name': 'XOR gate',
    'museum.nandGate.name': 'NAND gate',
    'museum.mux2.name': '2:1 multiplexer',
    'museum.decoder2to4.name': '2-to-4 decoder',
    'museum.halfAdder.name': 'Half adder',
    'museum.fullAdder.name': 'Full adder',
    'museum.srLatch.name': 'SR latch',
    'museum.counter4.name': '4-bit counter',
    'museum.sevenSegment.name': 'Seven-segment decoder',
    'hint.latchSet': 'Pull S low and hold it for two beats; watch Q settle from the transient to 1.',
    'hint.latchHold': 'Q has been stable for {n} beat(s)… keep the chain beating.',
    'hint.latchReset': 'Now pull R low; Q returns to 0 after two beats.',
    'hint.legoPlace': '{n} black box(es) to drop: two half adders + one OR gate.',
    'hint.legoTapeout': 'Nearly there: get the verification green, then tape out the composed adder.',
    'hint.legoDone': 'Composed adder is on chain. Compare: a hand-optimised design needs only 9 gates.',
    'hint.cpuRun': 'Press “Run 3 + 5” and watch the 4-bit ripple carry.',
    'hint.cpuRunning': 'Blocks advance; carries ripple through the gate array…',
    'hint.cpuDone': 'The result is on the seven-segment display. Run another sum or revisit the codex.',

    'port.input': 'input {n}',
    'port.gateIn': 'gate {n} pin {pin}',
    'port.gateOut': 'gate {n} output',
    'port.boxIn': 'box {box} pin {pin}',
    'port.boxOut': 'box {box} {pin} output',
    'port.sum': 'SUM output',
    'port.carry': 'CARRY output',
    'port.unknown': 'pin',
    'hover.chip': 'Click to mint this NAND transistor',
    'hover.padToggle': 'Click to toggle {p}',
    'hover.source': 'output pin — start a wire here',
    'hover.sink': 'input pin — end a wire here',
    'hover.machine': 'Tape-out machine: burns tokens, mints the circuit NFT',
    'hover.crystal': 'Fresh circuit NFT — click for a free read-only eval',
    'hover.cpu': 'Behemoth — click to run 3 + 5',
    'hover.display': 'Seven-segment display — click for another sum',
    'hover.die': 'silicon die canvas',
    'hover.segpad': 'Toggle input bit D{n}',
    'hover.safepad': 'Toggle safety input {n}',


    'toast.chapterDone': 'Mission complete!',
    'toast.mintDone': '8 transistors minted: they are now ERC-1155 tokens in your wallet.',
    'toast.nandDone': 'NAND truth table verified: the whole world needs just this one gate.',
    'toast.halfDone': 'Half adder verified: five transistors now know addition.',
    'toast.tapeoutDone': 'Circuit #{id} taped out: {n} tokens burned, an NFT lives on chain forever.',
    'toast.legoDone': 'Composed adder taped out: {n} transistors, all 8 input rows verified.',
    'toast.latchDone': 'Latch mission complete: you built one bit of memory.',
    'toast.latchTransient': 'That is the cross-coupled transient: Q and Q̄ are both 1 for one beat.',
    'toast.cpuDone': 'Behemoth finished: chain blocks drive this processor.',
    'toast.notEnoughNand': 'Not enough NAND: tape-out needs {n}, you hold {have}.',
    'toast.verifyFirst': 'Get the exhaustive check to pass before taping out.',
    'toast.seedNand': 'Demo supply: {n} extra NAND gates so this chapter stands alone.',
    'toast.portArmed': 'Selected {source}: now click an input pin to finish the wire.',

    'log.mintOne': 'Minted 1 NAND — balance {n}',
    'log.mintAll': 'Minted the whole wafer — balance {n}',
    'log.tapeout': 'Taped out circuit #{id}: {n} transistors burned',
    'log.tapeoutLego': 'Taped out composed #{id}: {n} transistors burned',

    'circuit.halfAdder': 'Half adder',
    'circuit.composed': 'Composed full adder',

    'codex.title': 'TapeOut protocol codex',
    'codex.lead': 'In one line: NAND gates are tokens, circuits are NFTs, and BNB Chain blocks are the CPU clock.',
    'codex.s1.title': '① Transistor = ERC-1155 token',
    'codex.s1.body': 'One NAND gate is one transistor, a fungible token whose on-chain record is just 7 bytes: 1 opcode byte + 3-byte input A + 3-byte input B. It only ever computes out = NOT(A AND B).',
    'codex.s2.title': '② Circuit = ERC-721 NFT',
    'codex.s2.body': 'A taped-out circuit is an NFT whose logic is data, not code. It cannot call out and has no writable state, so a stranger’s circuit can at worst return a wrong answer.',
    'codex.s3.title': '③ Tape-out burns tokens, mints a circuit',
    'codex.s3.body': 'Wiring in the browser canvas is free to rehearse. Tape-out destroys the NAND tokens and mints the circuit NFT with its netlist, pin counts and 7-byte-per-gate bytecode. 5 = half adder, 9 = full adder, 36 = 4-bit adder.',
    'codex.s4.title': '④ eval is an always-open function',
    'codex.s4.body': 'Anyone can call eval: a read-only query with no wallet, no gas and no transaction left behind. Any contract on BNB Chain can use your circuit as part of its own logic.',
    'codex.s5.title': '⑤ Clock = blocks',
    'codex.s5.body': 'BNB Chain produces a block roughly every 0.45 s, so the default clock is 2.22 Hz: every new block advances one cycle. Consensus drives it, it cannot be paused, and the factory renounced ownership after deployment.',
    'codex.s6.title': '⑥ LEGO: black-box reuse',
    'codex.s6.body': 'A taped-out circuit can be dropped into the next canvas as a black box with pins. Transistor → circuit → processor all use the same structure. The reused adder in chapter six needs 13 gates; the hand-optimised one needs 9.',
    'codex.s7.title': '⑦ Behemoth',
    'codex.s7.body': 'The first on-chain processor follows the 1971 Intel 4004 spec: 2300 transistors, 4-bit, 2.22 Hz. It runs as long as the chain exists, and new circuits keep extending what it can do.',
    'codex.close': 'Close codex',
    'codex.note': 'This lab is a protocol demo, not a real wallet or transaction; every number is synthetic teaching data.',

    'chapter.0.title': 'Mint · Transistors',
    'chapter.0.subtitle': 'One token is one transistor',
    'chapter.0.tag': 'Chapter 1',
    'chapter.0.intro': 'TapeOut turns a NAND gate into an ERC-1155 token: one token, one transistor, 7 bytes on chain. Mint 8 chips on the die and look at what they are.',
    'chapter.0.fact': '7 bytes = 1 opcode byte + 3-byte input A + 3-byte input B',
    'chapter.1.title': 'NAND · Anyone can compute',
    'chapter.1.subtitle': 'The whole world needs one gate',
    'chapter.1.tag': 'Chapter 2',
    'chapter.1.intro': 'A NAND gate takes two booleans and outputs the inverted intersection: it is 0 only when both inputs are 1. Place one transistor, wire A and B, and try all four pairs.',
    'chapter.1.fact': 'NAND = NOT(A AND B). Every computation can be built from this single gate.',
    'chapter.2.title': 'Half adder · Five transistors',
    'chapter.2.subtitle': 'The first circuit that adds',
    'chapter.2.tag': 'Chapter 3',
    'chapter.2.intro': 'Wire five NAND gates and you get a half adder: SUM is XOR, CARRY is AND. Verify all four input rows and watch it match real addition.',
    'chapter.2.fact': '5 transistors = half adder; 9 = full adder; 36 = 4-bit adder.',
    'chapter.3.title': 'Tape-out · Etched into an NFT',
    'chapter.3.subtitle': 'Tokens burn, the circuit lives forever',
    'chapter.3.tag': 'Chapter 4',
    'chapter.3.intro': 'Press “Tape out”: the transistor tokens are destroyed and the circuit is registered as an ERC-721 NFT. Its logic becomes data that can only compute.',
    'chapter.3.fact': 'Circuit = NFT; logic = on-chain data, not code. It cannot call out or write state.',
    'chapter.4.title': 'Clock · Memory',
    'chapter.4.subtitle': 'The first beat gives the world memory',
    'chapter.4.tag': 'Chapter 5',
    'chapter.4.intro': 'A world of NAND gates has no memory. Cross-couple two gates and you get one bit of state: a latch. BNB Chain blocks every 0.45 s are its heartbeat. Cross-coupled feedback needs two beats to settle — that is real circuit behaviour.',
    'chapter.4.fact': 'A NAND-only world has no memory, and without memory there is no computer.',
    'chapter.5.title': 'LEGO · Black-box reuse',
    'chapter.5.subtitle': 'Snap taped-out circuits together',
    'chapter.5.tag': 'Chapter 6',
    'chapter.5.intro': 'A taped-out half adder drops into the next canvas as a black box. Two half adders + one OR gate make a full adder: reuse simplifies the design at the cost of 13 gates instead of a hand-optimised 9.',
    'chapter.5.fact': 'Transistor → circuit → processor: every layer uses the same structure.',
    'chapter.6.title': 'Behemoth · The on-chain CPU',
    'chapter.6.subtitle': 'A processor nobody can unplug',
    'chapter.6.tag': 'Chapter 7',
    'chapter.6.intro': 'Zoom out: millions of gates arranged as a die, with blocks as the clock. Behemoth, built to the 1971 Intel 4004 spec, has 2300 transistors at 2.22 Hz and runs as long as the chain does.',
    'chapter.6.fact': 'The CPU clock comes from chain blocks: each new block advances one cycle. The factory renounced all ownership.',
  },
}

TT.UI = {}
TT.UI.h = TT.h

TT.UI.Icon = function Icon(props) {
  const size = (props && props.size) || 18
  return TT.h(
    'svg',
    { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': 'true', fill: 'none' },
    TT.h('path', {
      d: 'M12 2.6 20 7.3v9.4L12 21.4 4 16.7V7.3z',
      stroke: 'currentColor',
      strokeWidth: 1.4,
      strokeLinejoin: 'round',
    }),
    TT.h('path', {
      d: 'M8.2 12.2h4.1a1.9 1.9 0 0 1 0 3.8H8.2z',
      stroke: 'currentColor',
      strokeWidth: 1.2,
      strokeLinejoin: 'round',
    }),
    TT.h('circle', { cx: 14.4, cy: 14.1, r: 0.9, stroke: 'currentColor', strokeWidth: 1.1 }),
    TT.h('path', { d: 'M6 10.2h2.2M6 18h2.2M17.6 7.6v2.4', stroke: 'currentColor', strokeWidth: 1.2 }),
  )
}

TT.UI.useGame = function useGame(store) {
  const [state, setState] = React.useState(store.get)
  React.useEffect(() => store.subscribe(setState), [store])
  return state
}

TT.UI.useWidth = function useWidth(ref) {
  const [width, setWidth] = React.useState(900)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = () => setWidth(el.clientWidth || 900)
    read()
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(read)
      observer.observe(el)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [ref])
  return width
}

TT.UI.CSS = `
.tt-lab { --tt-ink:#e8f6ff; --tt-dim:#8fb3c8; --tt-faint:#4d738a; --tt-cyan:#56e1ff;
  --tt-mint:#2be6c2; --tt-amber:#ffc35c; --tt-magenta:#ff6ad5; --tt-red:#ff5d6c; --tt-gold:#ffd479;
  --tt-glass:rgba(6,14,24,.82); --tt-glass2:rgba(9,20,33,.72); --tt-line:rgba(86,225,255,.18);
  box-sizing:border-box; position:relative; height:100%; width:100%; display:flex; flex-direction:column;
  min-height:0; overflow:hidden; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary);
  font-family:var(--dsh-font-family-ui, system-ui, -apple-system, 'PingFang SC', sans-serif); }
.tt-lab * { box-sizing:border-box; }
.tt-card, .tt-mission, .tt-telemetry { min-width:0; }
.tt-topbar { flex:none; position:relative; z-index:30; display:flex; align-items:center; gap:12px;
  min-height:52px; padding:8px 16px; border-bottom:.5px solid var(--dsw-alias-border-l2);
  background:var(--dsw-alias-bg-layer-1); }
[data-platform="darwin"] .tt-topbar { padding-top:calc(8px + var(--dsh-frame-top-clearance, 0px));
  padding-left:calc(16px + var(--dsh-frame-leading-clearance, 0px)); }
.tt-brand { display:flex; align-items:center; gap:10px; min-width:0; }
.tt-mark { display:grid; place-items:center; width:30px; height:30px; flex:none; border-radius:9px;
  color:#06131d; background:linear-gradient(145deg, #7ce9ff, #2be6c2);
  box-shadow:0 0 14px rgba(86,225,255,.35); }
.tt-brandtext { display:flex; flex-direction:column; min-width:0; gap:1px; }
.tt-title { font-size:13px; font-weight:600; letter-spacing:.02em; white-space:nowrap; }
.tt-sub { font-size:11px; color:var(--dsw-alias-label-tertiary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tt-spacer { flex:1 1 auto; min-width:4px; }
.tt-rail { display:flex; align-items:center; gap:4px; padding:3px; border-radius:10px;
  background:var(--dsw-alias-bg-layer-2, rgba(0,0,0,.06)); flex:none; }
.tt-dot { width:22px; height:22px; border-radius:7px; border:0; cursor:pointer; font-size:11px; font-weight:600;
  color:var(--dsw-alias-label-tertiary); background:transparent; display:grid; place-items:center; }
.tt-dot:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.tt-dot[data-current="true"] { background:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-text, #fff); }
.tt-dot[data-done="true"] { color:var(--dsw-alias-brand-primary); }
.tt-dot[data-done="true"][data-current="true"] { color:var(--dsw-alias-brand-text, #fff); }
.tt-tools { display:flex; align-items:center; gap:4px; flex:none; }
.tt-tool { height:28px; min-width:28px; padding:0 8px; display:inline-flex; align-items:center; gap:6px;
  border:.5px solid transparent; border-radius:8px; cursor:pointer; font-size:12px;
  color:var(--dsw-alias-label-secondary); background:transparent; }
.tt-tool:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.tt-tool[data-active="true"] { background:var(--dsw-alias-interactive-bg-hover); border-color:var(--dsw-alias-border-l2); color:var(--dsw-alias-label-primary); }
.tt-tool .tt-glyph { font-size:14px; line-height:1; }
.tt-stage { position:relative; flex:1 1 auto; min-height:0; overflow:hidden; background:#04070d; }
.tt-canvas { position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none; cursor:grab; }
.tt-canvas:active { cursor:grabbing; }
.tt-scrim { position:absolute; inset:0; background:linear-gradient(180deg, rgba(3,6,12,.55), rgba(3,6,12,0) 22%, rgba(3,6,12,0) 70%, rgba(3,6,12,.6)); pointer-events:none; }
.tt-hud { position:absolute; inset:0; pointer-events:none; display:flex; flex-direction:column; justify-content:space-between; }
.tt-hudrow { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:14px 16px; min-width:0; }
.tt-card { pointer-events:auto; border:1px solid rgba(86,225,255,.16); border-radius:14px;
  background:linear-gradient(180deg, rgba(9,21,35,.9), rgba(5,12,22,.86));
  box-shadow:0 18px 44px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.05);
  backdrop-filter:blur(14px); color:var(--tt-ink); }
.tt-mission { width:min(330px, 38%); padding:14px 15px 13px; max-height:min(52vh, 440px); overflow-y:auto; }
.tt-mission::-webkit-scrollbar, .tt-telemetry::-webkit-scrollbar { width:5px; }
.tt-mission::-webkit-scrollbar-thumb, .tt-telemetry::-webkit-scrollbar-thumb { background:rgba(86,225,255,.22); border-radius:3px; }
.tt-mission[data-narrow="true"] { width:min(300px, 56%); padding:11px 12px; max-height:min(46vh, 360px); }
.tt-mission[data-collapsed="true"] .tt-goals,
.tt-mission[data-collapsed="true"] .tt-hint,
.tt-mission[data-collapsed="true"] .tt-fact,
.tt-mission[data-collapsed="true"] .tt-progress,
.tt-mission[data-collapsed="true"] .tt-msub,
.tt-mission[data-collapsed="true"] .tt-controls { display:none; }
.tt-cardfold { border:0; background:transparent; color:var(--tt-faint); cursor:pointer; font-size:13px;
  width:20px; height:20px; border-radius:6px; display:grid; place-items:center; padding:0; margin-left:auto; }
.tt-cardfold:hover { color:var(--tt-ink); background:rgba(86,225,255,.12); }
.tt-controls { margin-top:9px; font-size:10px; color:var(--tt-faint); line-height:1.5; }
.tt-mtag { display:flex; }
.tt-mtag .tt-mtagtext { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tt-mtag { display:flex; align-items:center; gap:7px; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--tt-mint); margin-bottom:6px; }
.tt-mtag .tt-pip { width:5px; height:5px; border-radius:50%; background:var(--tt-mint); box-shadow:0 0 8px var(--tt-mint); }
.tt-mtitle { font-size:16px; font-weight:650; letter-spacing:.01em; margin:0; }
.tt-msub { margin:3px 0 10px; font-size:11.5px; color:var(--tt-dim); }
.tt-goals { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
.tt-goal { display:flex; align-items:flex-start; gap:8px; font-size:12px; line-height:1.45; color:#cfe6f4; }
.tt-goal[data-done="true"] { color:#7ef0c8; }
.tt-check { width:14px; height:14px; flex:none; margin-top:1px; border-radius:50%; border:1px solid rgba(120,190,220,.45);
  display:grid; place-items:center; font-size:9px; color:transparent; }
.tt-goal[data-done="true"] .tt-check { background:rgba(43,230,194,.18); border-color:var(--tt-mint); color:var(--tt-mint); }
.tt-fact { margin-top:10px; padding:8px 9px; border-radius:9px; border-left:2px solid var(--tt-amber);
  background:rgba(255,195,92,.07); font-size:11.5px; line-height:1.5; color:#ffe4b0; }
.tt-hint { margin-top:10px; display:flex; gap:8px; align-items:flex-start; font-size:11.5px; line-height:1.5; color:#a9d8ee; }
.tt-hint b { color:var(--tt-cyan); font-weight:600; }
.tt-progress { margin-top:10px; height:4px; border-radius:2px; background:rgba(120,180,210,.16); overflow:hidden; }
.tt-progress > i { display:block; height:100%; border-radius:2px; background:linear-gradient(90deg, var(--tt-cyan), var(--tt-mint)); transition:width .35s ease; }
.tt-telemetry { width:min(300px, 34%); padding:12px 13px; display:flex; flex-direction:column; gap:9px; max-height:min(52vh, 440px); overflow-y:auto; min-width:0; }
.tt-telemetry[data-narrow="true"] { width:min(250px, 46%); }
.tt-trow { display:flex; align-items:baseline; justify-content:space-between; gap:10px; font-size:11.5px; }
.tt-tlabel { color:var(--tt-dim); display:flex; align-items:center; gap:6px; }
.tt-tval { font-variant-numeric:tabular-nums; font-weight:600; color:var(--tt-ink); }
.tt-tval small { font-weight:400; color:var(--tt-faint); font-size:10px; margin-left:2px; }
.tt-mono { font-family:var(--dsh-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace); }
.tt-hex { font-size:10px; line-height:1.5; color:#9fe7ff; word-break:break-all; padding:7px 8px; border-radius:8px;
  background:rgba(4,12,20,.6); border:1px solid rgba(86,225,255,.12); max-height:74px; overflow:hidden; }
.tt-badge { display:inline-flex; align-items:center; gap:5px; padding:2px 7px; border-radius:999px; font-size:10px; font-weight:600; }
.tt-badge[data-tone="good"] { color:#7ef0c8; background:rgba(43,230,194,.14); border:1px solid rgba(43,230,194,.3); }
.tt-badge[data-tone="bad"] { color:#ff9aa4; background:rgba(255,93,108,.14); border:1px solid rgba(255,93,108,.32); }
.tt-badge[data-tone="muted"] { color:var(--tt-dim); background:rgba(143,179,200,.1); border:1px solid rgba(143,179,200,.22); }
.tt-table { width:100%; border-collapse:collapse; font-size:10.5px; font-variant-numeric:tabular-nums; }
.tt-table th { color:var(--tt-faint); font-weight:500; text-align:left; padding:2px 3px; border-bottom:1px solid rgba(86,225,255,.12); }
.tt-table td { padding:2px 3px; color:#cfe6f4; border-bottom:1px solid rgba(86,225,255,.06); }
.tt-table tr[data-ok="false"] td { color:#ff9aa4; }
.tt-bit { font-family:var(--dsh-font-family-mono, ui-monospace, Menlo, monospace); letter-spacing:.08em; }
.tt-leds { display:flex; gap:6px; flex-wrap:wrap; }
.tt-led { display:flex; align-items:center; gap:5px; font-size:10.5px; color:var(--tt-dim); }
.tt-led i { width:8px; height:8px; border-radius:50%; background:#12303f; border:1px solid rgba(120,190,220,.3); }
.tt-led[data-on="true"] i { background:var(--tt-mint); border-color:var(--tt-mint); box-shadow:0 0 9px rgba(43,230,194,.85); }
.tt-wave { display:flex; align-items:flex-end; gap:2px; padding:6px 4px; border-radius:8px; background:rgba(4,12,20,.55); border:1px solid rgba(86,225,255,.1); min-height:52px; }
.tt-wcol { display:flex; flex-direction:column; gap:1px; flex:1 1 0; min-width:3px; }
.tt-wcell { height:7px; border-radius:1px; background:rgba(120,180,210,.14); }
.tt-wcell[data-on="true"][data-ch="0"] { background:#5bd8ff; }
.tt-wcell[data-on="true"][data-ch="1"] { background:#ffb45c; }
.tt-wcell[data-on="true"][data-ch="2"] { background:var(--tt-mint); }
.tt-wcell[data-on="true"][data-ch="3"] { background:var(--tt-magenta); }
.tt-wlabels { display:flex; justify-content:space-between; font-size:9px; color:var(--tt-faint); margin-top:3px; }
.tt-dockwrap { display:flex; justify-content:center; padding:0 16px 18px; }
.tt-dock { pointer-events:auto; display:flex; flex-wrap:wrap; justify-content:center; gap:7px; padding:8px 10px;
  border-radius:14px; border:1px solid rgba(86,225,255,.16); background:var(--tt-glass); backdrop-filter:blur(16px);
  box-shadow:0 18px 40px rgba(0,0,0,.45); max-width:min(860px, 94%); }
.tt-btn { height:32px; padding:0 13px; border-radius:9px; font-size:12px; font-weight:600; cursor:pointer;
  border:1px solid transparent; display:inline-flex; align-items:center; gap:6px; transition:transform .12s ease, background .2s ease; }
.tt-btn:active:not(:disabled) { transform:translateY(1px); }
.tt-btn:disabled { opacity:.38; cursor:not-allowed; }
.tt-btn[data-kind="primary"] { color:#04121c; background:linear-gradient(160deg, #8df0ff, #2be6c2); border-color:rgba(255,255,255,.25); }
.tt-btn[data-kind="secondary"] { color:#dff6ff; background:rgba(86,225,255,.12); border-color:rgba(86,225,255,.3); }
.tt-btn[data-kind="ghost"] { color:#a9cbe0; background:rgba(255,255,255,.04); border-color:rgba(120,190,220,.2); }
.tt-btn[data-kind="active"] { color:#0a1c26; background:linear-gradient(160deg, #ffe1a1, #ffb45c); border-color:rgba(255,255,255,.3); }
.tt-toast { position:absolute; left:50%; top:16px; transform:translateX(-50%); z-index:24; pointer-events:none;
  max-width:min(560px, 80%); padding:9px 14px; border-radius:10px; font-size:12px; line-height:1.5;
  color:#e9fbff; background:rgba(7,19,32,.94); border:1px solid rgba(86,225,255,.34);
  box-shadow:0 12px 32px rgba(0,0,0,.5); animation:tt-toast-in .22s ease; }
.tt-toast[data-tone="good"] { border-color:rgba(43,230,194,.55); box-shadow:0 12px 32px rgba(20,120,100,.35); }
.tt-toast[data-tone="warn"] { border-color:rgba(255,180,92,.55); }
@keyframes tt-toast-in { from { opacity:0; transform:translate(-50%, -6px); } to { opacity:1; transform:translate(-50%, 0); } }
.tt-tooltip { position:absolute; left:16px; bottom:86px; z-index:20; pointer-events:none; font-size:11px; color:#bfe9ff;
  background:rgba(6,16,27,.88); border:1px solid rgba(86,225,255,.25); padding:4px 9px; border-radius:7px; }
.tt-intro { position:absolute; inset:0; z-index:26; display:grid; place-items:center; padding:18px;
  background:radial-gradient(60% 60% at 50% 45%, rgba(5,14,24,.62), rgba(2,6,12,.88)); backdrop-filter:blur(3px); }
.tt-introcard { pointer-events:auto; width:min(560px, 94%); padding:22px 24px 20px; border-radius:18px;
  color:var(--tt-ink); border:1px solid rgba(86,225,255,.24);
  background:linear-gradient(165deg, rgba(12,30,48,.97), rgba(5,12,22,.97));
  box-shadow:0 30px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06); position:relative; overflow:hidden; }
.tt-introcard:before { content:''; position:absolute; inset:-40% -20% auto; height:70%;
  background:radial-gradient(50% 60% at 30% 0%, rgba(86,225,255,.2), transparent 70%); pointer-events:none; }
.tt-introtag { font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--tt-mint); }
.tt-introtitle { font-size:22px; font-weight:650; margin:8px 0 4px; }
.tt-introsub { color:var(--tt-dim); font-size:12px; margin-bottom:12px; }
.tt-introbody { font-size:13px; line-height:1.65; color:#d5ecf7; }
.tt-introfact { margin-top:12px; padding:9px 11px; border-radius:9px; border-left:2px solid var(--tt-amber);
  background:rgba(255,195,92,.08); color:#ffe4b0; font-size:11.5px; line-height:1.55; }
.tt-introactions { display:flex; gap:8px; margin-top:16px; flex-wrap:wrap; }
.tt-skip { margin-left:auto; }
.tt-codex { position:absolute; inset:0; z-index:28; display:flex; justify-content:flex-end;
  background:rgba(2,6,12,.6); backdrop-filter:blur(2px); }
.tt-codexcard { pointer-events:auto; width:min(520px, 94%); height:100%; overflow:auto; padding:18px 20px 26px;
  color:var(--tt-ink); border-left:1px solid rgba(86,225,255,.24);
  background:linear-gradient(180deg, rgba(10,24,39,.98), rgba(4,10,18,.99)); }
.tt-codexhead { position:sticky; top:0; display:flex; align-items:center; gap:8px; padding:4px 0 10px;
  background:linear-gradient(180deg, rgba(10,24,39,.99), rgba(10,24,39,.9)); }
.tt-codexlead { font-size:12px; line-height:1.6; color:#bfe9ff; padding:9px 11px; border-radius:9px;
  background:rgba(86,225,255,.07); border:1px solid rgba(86,225,255,.16); margin-bottom:14px; }
.tt-codexsec { margin-bottom:13px; }
.tt-codexsec h4 { margin:0 0 4px; font-size:12.5px; color:var(--tt-mint); }
.tt-codexsec p { margin:0; font-size:12px; line-height:1.65; color:#cfe6f4; }
.tt-codexnote { margin-top:18px; font-size:10.5px; color:var(--tt-faint); line-height:1.5; }
.tt-close { border:0; width:26px; height:26px; border-radius:7px; cursor:pointer; font-size:14px;
  color:var(--dsw-alias-label-secondary); background:transparent; display:grid; place-items:center; }
.tt-close:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.tt-seg { display:flex; gap:8px; align-items:center; }
.tt-seven { width:44px; height:68px; }
.tt-nft { display:flex; gap:9px; align-items:center; padding:8px 9px; border-radius:10px;
  border:1px solid rgba(255,212,121,.28); background:rgba(255,212,121,.07); }
.tt-nftmark { width:26px; height:26px; border-radius:8px; display:grid; place-items:center; color:#241a05;
  background:linear-gradient(150deg, #ffe9ae, #ffc35c); font-size:13px; }
.tt-nfttext { display:flex; flex-direction:column; gap:1px; min-width:0; }
.tt-nfttitle { font-size:11.5px; font-weight:600; color:#ffe9ae; }
.tt-nftsub { font-size:10.5px; color:var(--tt-dim); }
.tt-secbutton { pointer-events:auto; }
.tt-beatbar { height:3px; border-radius:2px; background:rgba(120,180,210,.16); overflow:hidden; }
.tt-beatbar > i { display:block; height:100%; background:linear-gradient(90deg, var(--tt-mint), var(--tt-cyan));
  animation:tt-beat 0.45s linear infinite; }
.tt-lab[data-paused="true"] .tt-beatbar > i { animation-play-state:paused; }
@keyframes tt-beat { from { width:0%; } to { width:100%; } }

.tt-fade { position:absolute; inset:0; pointer-events:none; z-index:5;
  background:radial-gradient(60% 55% at 50% 45%, rgba(86,225,255,.16), rgba(2,6,12,.9));
  animation:tt-fade-out .55s ease forwards; }
@keyframes tt-fade-out { from { opacity:1; } to { opacity:0; } }
button.tt-progress-pill { cursor:default; font-family:inherit; }
button.tt-progress-pill[data-done="true"] { cursor:pointer; }
.tt-progress-pill { display:inline-flex; align-items:center; gap:5px; height:24px; padding:0 9px; border-radius:999px;
  font-size:10.5px; font-variant-numeric:tabular-nums; color:#a9d8ee; background:rgba(86,225,255,.08);
  border:1px solid rgba(86,225,255,.22); white-space:nowrap; flex:none; }
.tt-progress-pill[data-done="true"] { color:#241a05; background:linear-gradient(150deg,#ffe9ae,#ffc35c);
  border-color:rgba(255,255,255,.4); box-shadow:0 0 16px rgba(255,195,92,.45); font-weight:700; }
.tt-progress-pill b { font-weight:700; color:inherit; }
.tt-stamp { position:absolute; inset:0; display:grid; place-items:center; pointer-events:none; z-index:6; }
.tt-stamp > span { font-size:clamp(26px, 6vw, 62px); font-weight:750; letter-spacing:.2em; color:rgba(140,235,255,.15);
  text-shadow:0 0 34px rgba(86,225,255,.35); animation:tt-stamp 1.9s cubic-bezier(.2,.8,.3,1) forwards; white-space:nowrap; }
@keyframes tt-stamp { 0% { opacity:0; transform:scale(1.14) translateY(8px); } 16% { opacity:1; }
  62% { opacity:.85; } 100% { opacity:0; transform:scale(.97) translateY(-10px); } }
.tt-finale { position:absolute; inset:0; z-index:29; display:grid; place-items:center; padding:18px;
  background:radial-gradient(70% 70% at 50% 42%, rgba(22,48,66,.72), rgba(2,6,12,.93));
  backdrop-filter:blur(4px); animation:tt-finale-in .5s ease; }
.tt-finalecard { pointer-events:auto; position:relative; width:min(600px, 95%); max-height:100%; overflow:auto;
  padding:24px 26px 22px; border-radius:20px; color:var(--tt-ink); border:1px solid rgba(255,212,121,.4);
  background:linear-gradient(168deg, rgba(16,32,46,.98), rgba(7,12,20,.99));
  box-shadow:0 40px 100px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.08); }
.tt-finalecard:before { content:''; position:absolute; inset:-30% -10% auto; height:60%; pointer-events:none;
  background:radial-gradient(50% 60% at 50% 0%, rgba(255,195,92,.28), transparent 70%); }
.tt-trophy { width:54px; height:54px; display:grid; place-items:center; border-radius:16px; margin-bottom:10px;
  color:#241a05; background:linear-gradient(150deg,#fff1c4,#ffc35c); box-shadow:0 0 34px rgba(255,195,92,.55);
  animation:tt-trophy 2.6s ease-in-out infinite; }
@keyframes tt-trophy { 0%,100% { transform:translateY(0) rotate(-2deg); } 50% { transform:translateY(-4px) rotate(2deg); } }
.tt-finaletitle { font-size:24px; font-weight:750; letter-spacing:.01em; margin:0 0 5px; }
.tt-finalesub { font-size:12.5px; color:var(--tt-dim); margin-bottom:14px; }
.tt-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(96px,1fr)); gap:8px; margin-bottom:14px; }
.tt-stat { padding:9px 10px; border-radius:10px; border:1px solid rgba(86,225,255,.14); background:rgba(86,225,255,.05); }
.tt-stat b { display:block; font-size:18px; font-variant-numeric:tabular-nums; color:#eafaff; }
.tt-stat span { font-size:10px; color:var(--tt-faint); }
.tt-finalelabel { font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--tt-faint);
  margin: 0 0 6px; }
.tt-recap { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:5px; margin-bottom:14px; }
.tt-recap > span { display:flex; align-items:center; gap:6px; font-size:11px; color:#bfe9ff;
  padding:5px 8px; border-radius:8px; background:rgba(43,230,194,.06); border:1px solid rgba(43,230,194,.16); }
.tt-recap i { color:var(--tt-mint); font-style:normal; }
.tt-finalenote { font-size:11px; line-height:1.6; color:#ffd479; padding:9px 11px; border-radius:9px;
  background:rgba(255,195,92,.08); border-left:2px solid rgba(255,195,92,.65); margin-bottom:16px; }
.tt-finaleactions { display:flex; gap:9px; flex-wrap:wrap; }
.tt-confetti { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:1; }
.tt-confetti i { position:absolute; top:-12px; width:6px; height:11px; border-radius:1px; opacity:.85;
  animation:tt-confetti linear forwards; }
@keyframes tt-confetti { to { transform:translateY(115vh) rotate(540deg); opacity:0; } }
@keyframes tt-finale-in { from { opacity:0; } to { opacity:1; } }

.tt-cinema { position:absolute; left:50%; top:12px; transform:translateX(-50%); z-index:22;
  display:flex; align-items:center; gap:9px; padding:6px 8px 6px 12px; border-radius:999px;
  background:rgba(7,19,32,.92); border:1px solid rgba(255,195,92,.45); color:#ffe9ae; font-size:11px;
  box-shadow:0 10px 30px rgba(0,0,0,.5); pointer-events:auto; }
.tt-cinema b { color:#fff; font-weight:600; }
.tt-cinema .tt-cinema-stop { height:24px; padding:0 10px; border-radius:999px; border:0; cursor:pointer;
  font-size:11px; font-weight:600; color:#241a05; background:linear-gradient(150deg,#ffe9ae,#ffc35c); }
.tt-modes { display:flex; align-items:center; gap:2px; padding:2px; border-radius:9px; flex:none;
  background:var(--dsw-alias-bg-layer-2, rgba(0,0,0,.06)); }
.tt-modebtn { height:24px; padding:0 10px; border:0; border-radius:7px; cursor:pointer; font-size:11.5px; font-weight:600;
  color:var(--dsw-alias-label-tertiary); background:transparent; }
.tt-modebtn:hover { color:var(--dsw-alias-label-primary); }
.tt-modebtn[data-active="true"] { background:var(--dsw-alias-button-elevated-fill, #fff); color:var(--dsw-alias-label-primary);
  box-shadow:0 1px 4px rgba(0,0,0,.18); }
.tt-rail { max-width:min(360px, 34%); overflow-x:auto; scrollbar-width:none; flex:none; }
.tt-rail::-webkit-scrollbar { display:none; }
.tt-dot { width:18px; height:18px; font-size:9.5px; border-radius:6px; }
.tt-rail { gap:2px; padding:2px; }
.tt-chapnav { display:flex; align-items:center; gap:2px; flex:none; }
.tt-navbtn { width:20px; height:24px; border:0; border-radius:6px; background:transparent; cursor:pointer;
  color:var(--dsw-alias-label-tertiary); font-size:12px; line-height:1; padding:0; }
.tt-navbtn:hover:not(:disabled) { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.tt-navbtn:disabled { opacity:.3; cursor:not-allowed; }
.tt-lab[data-mode="lab"] .tt-canvas,
.tt-lab[data-mode="lab"] .tt-scrim,
.tt-lab[data-mode="lab"] .tt-hud,
.tt-lab[data-mode="lab"] .tt-stamp,
.tt-lab[data-mode="lab"] .tt-fade,
.tt-lab[data-mode="lab"] .tt-tooltip,
.tt-lab[data-mode="arcade"] .tt-canvas,
.tt-lab[data-mode="arcade"] .tt-scrim,
.tt-lab[data-mode="arcade"] .tt-hud,
.tt-lab[data-mode="arcade"] .tt-stamp,
.tt-lab[data-mode="arcade"] .tt-fade,
.tt-lab[data-mode="arcade"] .tt-tooltip { display:none; }
.tt-labview { position:absolute; inset:0; z-index:9; overflow-y:auto; pointer-events:auto;
  padding:18px clamp(14px, 3vw, 40px) 30px; color:var(--tt-ink);
  background:
    radial-gradient(60% 45% at 18% 0%, rgba(86,225,255,.12), transparent 70%),
    radial-gradient(50% 40% at 85% 8%, rgba(255,195,92,.09), transparent 70%),
    #060d16; }
.tt-labhero { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:16px; }
.tt-labadge { font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--tt-mint); margin-bottom:5px; }
.tt-labhero h2 { margin:0 0 4px; font-size:22px; font-weight:700; }
.tt-labhero p { margin:0; max-width:640px; font-size:12px; line-height:1.6; color:var(--tt-dim); }
.tt-labtabs { display:flex; gap:6px; flex-wrap:wrap; }
.tt-labtab { height:30px; padding:0 13px; border-radius:9px; border:1px solid rgba(86,225,255,.2);
  background:rgba(255,255,255,.03); color:var(--tt-dim); font-size:12px; font-weight:600; cursor:pointer; }
.tt-labtab:hover { color:var(--tt-ink); border-color:rgba(86,225,255,.45); }
.tt-labtab[data-active="true"] { color:#04121c; background:linear-gradient(160deg, #8df0ff, #2be6c2); border-color:transparent; }
.tt-labgrid { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr); gap:14px; align-items:start; }
.tt-labcard { background:linear-gradient(168deg, rgba(12,27,42,.95), rgba(6,13,22,.96));
  border:1px solid rgba(86,225,255,.16); border-radius:14px; padding:14px 15px; display:flex;
  flex-direction:column; gap:10px; min-width:0; }
.tt-labcardhead { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.tt-labcardhead strong { font-size:13px; }
.tt-labcardhead span { font-size:10.5px; color:var(--tt-faint); line-height:1.5; flex:1; min-width:0; }
.tt-labrow { display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
.tt-lablabel { font-size:11px; color:var(--tt-dim); }
.tt-chip { height:26px; min-width:26px; padding:0 9px; border-radius:7px; cursor:pointer; font-size:11px; font-weight:600;
  border:1px solid rgba(86,225,255,.22); background:rgba(255,255,255,.03); color:var(--tt-dim); }
.tt-chip:hover { color:var(--tt-ink); border-color:rgba(86,225,255,.45); }
.tt-chip[data-active="true"] { color:#04121c; background:linear-gradient(160deg, #8df0ff, #2be6c2); border-color:transparent; }
.tt-truthgrid { display:grid; grid-template-columns:repeat(var(--cols, 4), minmax(0, 1fr)); gap:5px; }
.tt-truthcell { display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 2px; border-radius:8px;
  cursor:pointer; border:1px solid rgba(86,225,255,.16); background:rgba(4,12,20,.5); color:var(--tt-dim); }
.tt-truthcell:hover { border-color:rgba(86,225,255,.45); }
.tt-truthcell b { font-size:13px; }
.tt-truthbits { font-family:var(--dsh-font-family-mono, monospace); font-size:9px; color:var(--tt-faint); }
.tt-truthcell[data-value="1"] { color:#04121c; background:linear-gradient(160deg, #8df0ff, #2be6c2); border-color:transparent; }
.tt-truthcell[data-value="1"] .tt-truthbits { color:rgba(4,18,28,.65); }
.tt-truthcell[data-value="-1"] { color:var(--tt-amber); background:rgba(255,195,92,.12); border-color:rgba(255,195,92,.45); }
.tt-labstats { display:grid; grid-template-columns:repeat(auto-fit, minmax(64px, 1fr)); gap:6px; }
.tt-labstat { padding:7px 8px; border-radius:9px; background:rgba(86,225,255,.05); border:1px solid rgba(86,225,255,.12); }
.tt-labstat b { display:block; font-size:16px; font-variant-numeric:tabular-nums; }
.tt-labstat span { font-size:9.5px; color:var(--tt-faint); }
.tt-labempty { margin:0; padding:10px 0; font-size:11.5px; color:var(--tt-faint); line-height:1.6; }
.tt-museum { display:flex; flex-direction:column; gap:10px; }
.tt-museumgrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:10px; }
.tt-museumcard { display:flex; flex-direction:column; gap:8px; padding:11px 12px; border-radius:12px;
  background:linear-gradient(168deg, rgba(12,27,42,.95), rgba(6,13,22,.96)); border:1px solid rgba(86,225,255,.16); }
.tt-museumart { min-height:30px; display:flex; align-items:center; }
.tt-museumglyph { font-family:var(--dsh-font-family-mono, monospace); font-size:11px; color:var(--tt-cyan); line-height:1.4; }
.tt-museumtext { display:flex; flex-direction:column; gap:2px; min-width:0; }
.tt-museumtext strong { font-size:12.5px; }
.tt-museumformula { font-family:var(--dsh-font-family-mono, monospace); font-size:9.5px; color:var(--tt-dim); overflow-wrap:anywhere; }
.tt-museuminfo { font-size:10px; color:var(--tt-faint); }
.tt-librarylist { display:flex; flex-direction:column; gap:6px; }
.tt-libraryrow { display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:9px; background:rgba(4,12,20,.5);
  border:1px solid rgba(86,225,255,.1); flex-wrap:wrap; }
.tt-libraryname { font-size:11.5px; font-weight:600; }
.tt-libraryhex { font-size:9.5px; color:var(--tt-faint); flex:1; min-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tt-sandboxcanvaswrap { height:min(42vh, 360px); border-radius:11px; overflow:hidden; border:1px solid rgba(86,225,255,.18); background:#04070d; }
.tt-sandboxcanvas { width:100%; height:100%; display:block; touch-action:none; cursor:grab; }
.tt-safetypads { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:4px; }
.tt-safetypad { height:24px; border-radius:6px; border:1px solid rgba(120,190,220,.25); background:rgba(4,12,20,.5);
  color:var(--tt-dim); font-size:9px; cursor:pointer; font-family:var(--dsh-font-family-mono, monospace); }
.tt-safetypad[data-on="true"] { color:#04121c; background:linear-gradient(160deg, #8df0ff, #2be6c2); border-color:transparent; }
.tt-segmask { display:flex; gap:3px; }
.tt-segmask i { width:16px; height:8px; border-radius:2px; background:rgba(255,195,92,.12); }
.tt-segmask i[data-on="true"] { background:var(--tt-amber); box-shadow:0 0 7px rgba(255,195,92,.7); }

.tt-arcadecards { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:8px; margin-bottom:14px; }
.tt-arcadecard { display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:11px; cursor:pointer;
  border:1px solid rgba(86,225,255,.18); background:rgba(255,255,255,.03); color:var(--tt-dim); font-size:12px; font-weight:600; }
.tt-arcadecard:hover { color:var(--tt-ink); border-color:rgba(86,225,255,.45); }
.tt-arcadecard[data-active="true"] { color:#04121c; background:linear-gradient(160deg,#8df0ff,#2be6c2); border-color:transparent; }
.tt-arcadeicon { font-size:16px; }
.tt-musicsteps { display:flex; align-items:flex-end; gap:3px; min-height:96px; padding:6px; border-radius:10px;
  background:rgba(4,12,20,.5); border:1px solid rgba(86,225,255,.12); overflow:hidden; }
.tt-musicstep { flex:1 1 0; min-width:0; border-radius:4px 4px 2px 2px; background:rgba(86,225,255,.18);
  display:flex; align-items:flex-end; justify-content:center; padding-bottom:3px; transition:height .12s ease, background .1s ease; }
.tt-musicstep span { font-size:8px; color:rgba(3,10,16,.75); font-family:var(--dsh-font-family-mono, monospace); }
.tt-musicstep[data-active="true"] { background:linear-gradient(180deg,#ffe9ae,#ffc35c); box-shadow:0 0 12px rgba(255,195,92,.55); }
.tt-musicstep[data-rest="true"] { background:rgba(120,180,210,.08); }
.tt-pixelgrid { display:grid; grid-template-columns:repeat(8, 1fr); gap:4px; width:min(320px, 100%); aspect-ratio:1; }
.tt-pixel { border-radius:4px; border:1px solid rgba(86,225,255,.12); background:rgba(4,12,20,.6); cursor:pointer; padding:0; }
.tt-pixel:hover { border-color:rgba(86,225,255,.45); }
.tt-pixel[data-on="true"] { background:var(--tt-amber); border-color:transparent; box-shadow:0 0 10px rgba(255,195,92,.55); }
.tt-debugoptions { display:flex; flex-direction:column; gap:6px; }
.tt-debugoption { text-align:left; padding:8px 10px; border-radius:8px; cursor:pointer; font-size:11.5px;
  font-family:var(--dsh-font-family-mono, monospace); border:1px solid rgba(86,225,255,.18); background:rgba(4,12,20,.5); color:var(--tt-dim); }
.tt-debugoption:hover { color:var(--tt-ink); border-color:rgba(86,225,255,.45); }
.tt-debugoption[data-kind="good"] { color:#04121c; background:linear-gradient(160deg,#8df0ff,#2be6c2); border-color:transparent; }
.tt-debugoption[data-kind="bad"] { color:#ff9aa4; border-color:rgba(255,93,108,.55); background:rgba(255,93,108,.08); }

.tt-snakewrap { position:relative; width:min(400px, 100%); }
.tt-snakegrid { display:grid; grid-template-columns:repeat(8, 1fr); gap:3px; width:min(400px, 100%); aspect-ratio:1;
  padding:6px; border-radius:12px; background:rgba(4,12,20,.7); border:1px solid rgba(86,225,255,.18); }
.tt-snakecell { border-radius:4px; background:rgba(86,225,255,.04); }
.tt-snakecell[data-kind="head"] { background:linear-gradient(150deg,#ffe9ae,#ffc35c); box-shadow:0 0 12px rgba(255,195,92,.7); }
.tt-snakecell[data-kind="body"] { background:rgba(255,195,92,.55); }
.tt-snakecell[data-kind="food"] { background:var(--tt-mint); box-shadow:0 0 12px rgba(43,230,194,.8); }
.tt-snakeover { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:4px; border-radius:12px; background:rgba(4,12,20,.72); color:#ff9aa4; font-size:13px; }
.tt-archivebox { width:100%; min-height:72px; resize:vertical; border-radius:9px; padding:8px 10px; font-size:11px;
  font-family:var(--dsh-font-family-mono, monospace); color:var(--tt-ink); background:rgba(4,12,20,.6);
  border:1px solid rgba(86,225,255,.22); }
.tt-archivebox:focus { outline:none; border-color:rgba(86,225,255,.6); }

.tt-hardwarewires { display:flex; flex-direction:column; gap:4px; max-height:260px; overflow:auto; padding:6px 8px;
  border-radius:9px; background:rgba(4,12,20,.5); border:1px solid rgba(86,225,255,.12); }
.tt-hardwarewire { display:flex; gap:6px; align-items:baseline; font-size:10.5px; color:var(--tt-dim); flex-wrap:wrap; }
.tt-hardwarewire b { color:var(--tt-mint); }
.tt-hardwarewire em { color:var(--tt-faint); font-style:normal; font-size:9.5px; }

.tt-winners { display:flex; flex-direction:column; gap:4px; }
.tt-winner { display:flex; align-items:baseline; gap:8px; padding:5px 9px; border-radius:8px;
  background:rgba(255,195,92,.07); border:1px solid rgba(255,195,92,.2); font-size:12px; color:#ffe9ae; }
.tt-winner b { color:var(--tt-amber); }
.tt-winner span { flex:1; color:var(--tt-ink); }
.tt-winner em { color:var(--tt-faint); font-style:normal; font-family:var(--dsh-font-family-mono, monospace); font-size:10px; }

.tt-artwrap { position:relative; display:flex; justify-content:center; }
.tt-artcanvas { border-radius:12px; border:1px solid rgba(86,225,255,.2);
  box-shadow:0 18px 44px rgba(0,0,0,.5); max-width:100%; height:auto; }
.tt-artbadge { position:absolute; left:10px; bottom:10px; display:flex; gap:6px; flex-wrap:wrap; max-width:92%;
  padding:4px 8px; border-radius:8px; background:rgba(4,12,20,.78); border:1px solid rgba(86,225,255,.18);
  color:var(--tt-dim); font-size:9.5px; font-family:var(--dsh-font-family-mono, monospace); }
.tt-artbadge span:first-child { color:var(--tt-amber); font-weight:700; }
.tt-artgallery { display:grid; grid-template-columns:repeat(auto-fill, minmax(96px, 1fr)); gap:8px; }
.tt-artthumb { padding:0; border:1px solid rgba(86,225,255,.2); background:none; border-radius:10px;
  overflow:hidden; cursor:pointer; display:block; }
.tt-artthumb:hover { border-color:rgba(86,225,255,.6); }
.tt-artthumb canvas { display:block; width:100%; height:auto; }

.tt-sensorrow { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:5px 0;
  border-bottom:1px solid rgba(86,225,255,.07); }
.tt-sensorname { display:flex; align-items:center; gap:6px; min-width:96px; font-size:11.5px; color:var(--tt-dim); }
.tt-sensorname i { width:7px; height:7px; border-radius:50%; background:#12303f; border:1px solid rgba(120,190,220,.35); }
.tt-sensorname i[data-on="true"] { background:var(--tt-red); border-color:var(--tt-red); box-shadow:0 0 8px rgba(255,93,108,.8); }
.tt-slider { flex:1 1 160px; accent-color:var(--tt-mint); height:20px; }
.tt-sensorval { display:flex; align-items:center; gap:5px; font-size:10.5px; color:var(--tt-ink);
  font-variant-numeric:tabular-nums; min-width:120px; }
.tt-sensorthreshold { width:56px; height:24px; border-radius:6px; border:1px solid rgba(86,225,255,.25);
  background:rgba(4,12,20,.6); color:var(--tt-ink); font-size:10.5px; padding:0 4px; }
.tt-actuators { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:6px; }
.tt-actuator { display:flex; align-items:center; gap:7px; padding:7px 9px; border-radius:9px; font-size:11.5px;
  border:1px solid rgba(120,190,220,.2); background:rgba(4,12,20,.45); color:var(--tt-dim); }
.tt-actuator i { width:9px; height:9px; border-radius:50%; background:#0e2534; border:1px solid rgba(120,190,220,.35); }
.tt-actuator span { flex:1; }
.tt-actuator b { font-size:10px; font-weight:600; }
.tt-actuator[data-on="true"][data-tone="bad"] { color:#ffd7db; border-color:rgba(255,93,108,.6); background:rgba(255,93,108,.12); }
.tt-actuator[data-on="true"][data-tone="bad"] i { background:var(--tt-red); border-color:var(--tt-red); box-shadow:0 0 10px rgba(255,93,108,.85); }
.tt-actuator[data-on="true"][data-tone="warn"] { color:#ffe9ae; border-color:rgba(255,195,92,.6); background:rgba(255,195,92,.1); }
.tt-actuator[data-on="true"][data-tone="warn"] i { background:var(--tt-amber); border-color:var(--tt-amber); box-shadow:0 0 10px rgba(255,195,92,.8); }
.tt-actuator[data-on="true"][data-tone="good"] { color:#bfffe9; border-color:rgba(43,230,194,.6); background:rgba(43,230,194,.1); }
.tt-actuator[data-on="true"][data-tone="good"] i { background:var(--tt-mint); border-color:var(--tt-mint); box-shadow:0 0 10px rgba(43,230,194,.8); }



.tt-labgroup { align-self:center; font-size:9.5px; letter-spacing:.08em; color:var(--tt-faint);
  padding:0 4px 0 10px; border-left:1px solid rgba(86,225,255,.14); text-transform:uppercase; }
.tt-labgroup:first-child { border-left:0; padding-left:0; }
.tt-labpaths { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:6px; }
.tt-labpaths .tt-lablabel { font-size:10px; color:var(--tt-faint); }
.tt-welcome { position:absolute; inset:0; z-index:60; display:flex; align-items:center; justify-content:center;
  padding:24px; background:rgba(3,8,14,.72); backdrop-filter:blur(7px); overflow:auto; }
.tt-welcomecard { width:min(620px,92%); padding:22px 24px; border-radius:18px; background:linear-gradient(170deg,#0a1a27,#061019);
  border:1px solid rgba(86,225,255,.28); box-shadow:0 30px 80px rgba(0,0,0,.6); }
.tt-welcomepaths { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:12px 0 10px; }
.tt-welcomepath { display:flex; flex-direction:column; align-items:flex-start; gap:3px; padding:11px 12px; border-radius:12px;
  border:1px solid rgba(86,225,255,.22); background:rgba(86,225,255,.05); color:var(--tt-ink); cursor:pointer;
  transition:transform .12s ease, border-color .12s ease, background .12s ease; }
.tt-welcomepath:hover { transform:translateY(-2px); border-color:var(--tt-mint); background:rgba(43,230,194,.1); }
.tt-welcomepath .tt-welcomeicon { font-size:22px; }
.tt-welcomepath b { font-size:12.5px; }
.tt-welcomepath em { font-style:normal; font-size:10px; color:var(--tt-dim); line-height:1.45; }
.tt-welcomeactions { display:flex; justify-content:flex-end; margin-top:4px; }

@media (max-width: 1000px) {
  .tt-labgrid { grid-template-columns: 1fr; }
}
@media (max-width: 1180px) {
  .tt-rail { display:none; }
}
@media (max-width: 900px) {
  .tt-sub { display:none; }
  .tt-rail { display:none; }
  .tt-mission { width:min(300px, 50%); }
  .tt-telemetry { width:min(240px, 42%); }
}
@media (max-width: 620px) {
  .tt-hudrow { padding:9px 10px; gap:8px; }
  .tt-mission { width:64%; padding:10px; }
  .tt-telemetry { display:none; }
  .tt-telemetry[data-forced="true"] { display:flex; position:absolute; right:10px; top:52px; }
  .tt-dockwrap { padding:0 8px 10px; }
  .tt-btn { height:30px; padding:0 10px; font-size:11px; }
}
@media (prefers-reduced-motion: reduce) {
  .tt-toast, .tt-beatbar > i { animation:none; }
  .tt-progress > i { transition:none; }
  .tt-confetti i, .tt-trophy, .tt-stamp > span, .tt-finale { animation:none; }
  .tt-stamp { display:none; }
}
`

TT.UI.sevenSegmentMap = {
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 1, 1, 0, 0, 0, 0],
  2: [1, 1, 0, 1, 1, 0, 1],
  3: [1, 1, 1, 1, 0, 0, 1],
  4: [0, 1, 1, 0, 0, 1, 1],
  5: [1, 0, 1, 1, 0, 1, 1],
  6: [1, 0, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 0, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 1, 1],
  10: [1, 1, 1, 0, 1, 1, 1],
  11: [0, 0, 1, 1, 1, 1, 1],
  12: [1, 0, 0, 1, 1, 1, 0],
  13: [0, 1, 1, 1, 1, 0, 1],
  14: [1, 0, 0, 1, 1, 1, 1],
  15: [1, 0, 0, 0, 1, 1, 1],
}

TT.UI.SevenSeg = function SevenSeg(props) {
  const value = Math.max(0, Math.min(15, props.value === undefined || props.value === null ? 0 : props.value))
  const seg = TT.UI.sevenSegmentMap[value] || TT.UI.sevenSegmentMap[0]
  const on = '#ffc35c'
  const off = 'rgba(255,195,92,.10)'
  const color = (i) => (seg[i] ? on : off)
  return TT.h(
    'svg',
    { className: 'tt-seven', viewBox: '0 0 44 68', 'aria-label': `seven-segment ${value}` },
    TT.h('rect', { x: 0.5, y: 0.5, width: 43, height: 67, rx: 6, fill: 'rgba(4,12,20,.75)', stroke: 'rgba(255,195,92,.18)' }),
    TT.h('rect', { x: 11, y: 6, width: 22, height: 5, rx: 2.5, fill: color(0) }),
    TT.h('rect', { x: 34, y: 12, width: 5, height: 19, rx: 2.5, fill: color(1) }),
    TT.h('rect', { x: 34, y: 37, width: 5, height: 19, rx: 2.5, fill: color(2) }),
    TT.h('rect', { x: 11, y: 57, width: 22, height: 5, rx: 2.5, fill: color(3) }),
    TT.h('rect', { x: 5, y: 37, width: 5, height: 19, rx: 2.5, fill: color(4) }),
    TT.h('rect', { x: 5, y: 12, width: 5, height: 19, rx: 2.5, fill: color(5) }),
    TT.h('rect', { x: 11, y: 31.5, width: 22, height: 5, rx: 2.5, fill: color(6) }),
  )
}

TT.UI.Panel = function Panel(props) {
  const store = props.store
  const api = props.api
  const ctx = props.ctx
  const t = props.t
  const state = TT.UI.useGame(store)
  const rootRef = React.useRef(null)
  const canvasRef = React.useRef(null)
  const stateRef = React.useRef(state)
  stateRef.current = state
  const width = TT.UI.useWidth(rootRef)
  const [hover, setHover] = React.useState(null)
  const [dataOpen, setDataOpen] = React.useState(false)
  const [cardOpen, setCardOpen] = React.useState(true)
  const narrow = width < 760
  const medium = width < 1000
  const status = TT.Missions.status(state)
  const doneChapters = TT.Missions.completedCount(state)
  const allDone = TT.Missions.allDone(state)
  const totalChapters = TT.protocol.CHAPTERS.length
  const inLab = state.mode === 'lab'
  const inArcade = state.mode === 'arcade'

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !TT.WorldView) return undefined
    const view = TT.WorldView.mount(canvas, { store, api, t, setHover })
    const stopClock = api.startClock ? api.startClock() : () => {}
    return () => {
      stopClock()
      if (api.stopCinema) api.stopCinema(true)
      view.dispose()
    }
  }, [canvasRef, store, api, t])

  React.useEffect(() => {
    if (api.setWorldActive) api.setWorldActive(!inLab && !inArcade)
  }, [inLab, inArcade, api])

  React.useEffect(() => {
    if (!state.toast) return undefined
    const id = state.toast.id
    const timer = setTimeout(() => api.dispatch({ type: 'toast/clear', id }), 3200)
    return () => clearTimeout(timer)
  }, [state.toast, api])

  React.useEffect(() => {
    const onKey = (event) => {
      const target = event.target
      const tag = (target && target.tagName) || ''
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (target && target.isContentEditable)) return
      // Read live state through a ref: the listener is bound once, so a closure over
      // the first render's state would never see the arcade mode or the current chapter.
      const current = stateRef.current
      if (event.key === 'Escape') {
        if (current.welcome) api.dispatch({ type: 'welcome/close' })
        else if (current.codex) api.dispatch({ type: 'codex/close' })
        else if (current.intro) api.dispatch({ type: 'intro/close' })
        else if (!current.finaleDismissed && TT.Missions.allDone(current)) api.dispatch({ type: 'finale/close' })
        return
      }
      if (current.mode === 'arcade' && current.arcade.game === 'snake') {
        const dirs = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', a: 'left', s: 'down', d: 'right' }
        const dir = dirs[event.key] || dirs[(event.key || '').toLowerCase()]
        if (dir) {
          event.preventDefault()
          event.stopPropagation()
          api.dispatch({ type: 'snake/dir', dir })
          return
        }
      }
      if (/^[1-9]$/.test(event.key)) {
        api.dispatch({ type: 'chapter/select', index: Number(event.key) - 1 })
        return
      }
      if (event.key === '[') {
        api.dispatch({ type: 'chapter/select', index: Math.max(0, current.chapter - 1) })
        return
      }
      if (event.key === ']') {
        api.dispatch({ type: 'chapter/select', index: Math.min(TT.protocol.CHAPTERS.length - 1, current.chapter + 1) })
        return
      }
      const key = (event.key || '').toLowerCase()
      if (key === 'h') api.dispatch({ type: 'hint' })
      else if (key === 'r') api.dispatch({ type: 'chapter/reset' })
      else if (key === 'c') api.dispatch({ type: 'codex/toggle' })
      else if (key === 'm') api.dispatch({ type: 'sound/toggle' })
      else if (key === 'f') api.dispatch({ type: current.cinema ? 'cinema/stop' : 'cinema/start' })
      else if (key === ' ') {
        event.preventDefault()
        api.dispatch({ type: 'pause/toggle' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [api])

  const chapter = TT.Missions.chapterMeta(state.chapter)
  const goals = status.goals
  const doneCount = goals.filter((goal) => goal.done).length
  const hint = TT.Missions.nextHint(state)
  const hintText = hint.key === 'hint.nextWire'
    ? t(hint.key, {
        source: t(hint.params.sourceKey, hint.params.sourceParams),
        sink: t(hint.params.sinkKey, hint.params.sinkParams),
      })
    : t(hint.key, hint.params)

  const resolve = (key, params) => (key ? t(key, params || {}) : '')
  const dock = TT.Missions.dock(state)

  const closePanel = () => {
    if (ctx && ctx.layout && typeof ctx.layout.selectPanel === 'function') {
      ctx.layout.selectPanel(null)
    }
  }

  const intro = state.intro ? TT.h('div', { className: 'tt-intro' },
    TT.h('div', { className: 'tt-introcard' },
      TT.h('div', { className: 'tt-introtag' }, resolve(chapter.tagKey)),
      TT.h('h2', { className: 'tt-introtitle' }, resolve(chapter.titleKey)),
      TT.h('div', { className: 'tt-introsub' }, resolve(chapter.subtitleKey)),
      TT.h('p', { className: 'tt-introbody' }, resolve(chapter.introKey)),
      TT.h('div', { className: 'tt-introfact' }, resolve(chapter.factKey)),
      TT.h('div', { className: 'tt-introactions' },
        TT.h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'primary', onClick: () => api.dispatch({ type: 'intro/close' }) }, t('panel.introStart')),
        TT.h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost', onClick: () => {
          api.dispatch({ type: 'intro/close' })
          api.dispatch({ type: 'codex/open' })
        } }, t('panel.introCodex')),
      ),
    ),
  ) : null

  const welcome = state.welcome ? TT.h('div', { className: 'tt-welcome' },
    TT.h('div', { className: 'tt-welcomecard' },
      TT.h('div', { className: 'tt-introtag' }, t('welcome.tag')),
      TT.h('h2', { className: 'tt-introtitle' }, t('welcome.title')),
      TT.h('p', { className: 'tt-introbody' }, t('welcome.body')),
      TT.h('div', { className: 'tt-welcomepaths' },
        [
          ['beginner', '🐣', 'welcome.beginner', 'welcome.beginnerDesc'],
          ['player', '🎮', 'welcome.player', 'welcome.playerDesc'],
          ['tech', '🔬', 'welcome.tech', 'welcome.techDesc'],
        ].map(([id, icon, title, desc]) => TT.h('button', {
          key: id,
          type: 'button',
          className: 'tt-welcomepath',
          onClick: () => {
            api.dispatch({ type: 'welcome/close' })
            if (TT.Audio) TT.Audio.play('click')
            if (id === 'beginner') {
              api.dispatch({ type: 'chapter/select', index: 0 })
              api.dispatch({ type: 'intro/open' })
            } else if (id === 'player') {
              api.dispatch({ type: 'arcade/open' })
              api.dispatch({ type: 'arcade/game', game: 'snake' })
            } else {
              api.dispatch({ type: 'lab/open' })
              api.dispatch({ type: 'lab/tab', tab: 'synth' })
            }
            api.dispatch({ type: 'toast/show', key: id === 'beginner' ? 'welcome.goBeginner' : id === 'player' ? 'welcome.goPlayer' : 'welcome.goTech', tone: 'info' })
          },
        }, TT.h('span', { className: 'tt-welcomeicon' }, icon), TT.h('b', null, t(title)), TT.h('em', null, t(desc)))),
      ),
      TT.h('div', { className: 'tt-welcomeactions' },
        TT.h('button', { type: 'button', className: 'tt-btn', 'data-kind': 'ghost', onClick: () => api.dispatch({ type: 'welcome/close' }) }, t('welcome.skip')),
      ),
      TT.h('p', { className: 'tt-finalenote', style: { marginBottom: 0 } }, t('welcome.foot')),
    ),
  ) : null

  return TT.h('div', {
    className: 'tt-lab',
    ref: rootRef,
    'data-paused': state.paused ? 'true' : 'false',
    'data-mode': state.mode || 'missions',
  },
    TT.h('style', null, TT.UI.CSS),
    TT.h('header', { className: 'tt-topbar', 'data-window-drag': '' },
      TT.h('div', { className: 'tt-brand' },
        TT.h('span', { className: 'tt-mark' }, TT.UI.Icon({ size: 18 })),
        TT.h('div', { className: 'tt-brandtext' },
          TT.h('div', { className: 'tt-title' }, t('panel.title')),
          TT.h('div', { className: 'tt-sub' }, t('panel.subtitle')),
        ),
      ),
      TT.h('span', { className: 'tt-spacer' }),
      TT.h('button', {
        type: 'button',
        className: 'tt-progress-pill',
        'data-done': allDone ? 'true' : 'false',
        title: allDone ? t('finale.title') : t('panel.progress', { done: doneChapters, total: totalChapters }),
        onClick: allDone ? () => api.dispatch({ type: 'finale/open' }) : undefined,
      }, allDone ? `🏆 ${t('panel.progressAll')}` : TT.h('b', null, `${doneChapters}/${totalChapters}`)),
      TT.h('nav', { className: 'tt-rail', 'aria-label': t('panel.chapterRail') },
        TT.protocol.CHAPTERS.map((id, index) => {
          const isDone = Boolean(state.completed[index])
          return TT.h('button', {
            key: id,
            type: 'button',
            className: 'tt-dot',
            title: resolve(`chapter.${index}.title`),
            'aria-label': resolve(`chapter.${index}.title`),
            'data-current': state.chapter === index ? 'true' : 'false',
            'data-done': isDone ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'chapter/select', index }),
          }, isDone && state.chapter !== index ? '✓' : String(index + 1))
        }),
      ),
      TT.h('div', { className: 'tt-chapnav' },
        TT.h('button', {
          type: 'button',
          className: 'tt-navbtn',
          title: t('panel.prevChapter'),
          'aria-label': t('panel.prevChapter'),
          disabled: state.chapter <= 0,
          onClick: () => api.dispatch({ type: 'chapter/select', index: state.chapter - 1 }),
        }, '‹'),
        TT.h('button', {
          type: 'button',
          className: 'tt-navbtn',
          title: t('panel.nextChapter'),
          'aria-label': t('panel.nextChapter'),
          disabled: state.chapter >= totalChapters - 1,
          onClick: () => api.dispatch({ type: 'chapter/select', index: state.chapter + 1 }),
        }, '›'),
      ),
      TT.h('div', { className: 'tt-tools' },
        TT.h('div', { className: 'tt-modes', role: 'group', 'aria-label': t('lab.title') },
          TT.h('button', {
            type: 'button',
            className: 'tt-modebtn',
            'data-active': inLab ? 'false' : 'true',
            onClick: () => api.dispatch({ type: 'lab/close' }),
          }, t('panel.modeMissions')),
          TT.h('button', {
            type: 'button',
            className: 'tt-modebtn',
            'data-active': inLab ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'lab/open' }),
          }, t('panel.modeLab')),
          TT.h('button', {
            type: 'button',
            className: 'tt-modebtn',
            'data-active': inArcade ? 'true' : 'false',
            onClick: () => api.dispatch({ type: 'arcade/open' }),
          }, t('panel.modeArcade')),
        ),
        TT.h('button', {
          type: 'button',
          className: 'tt-tool',
          title: t('panel.guide'),
          onClick: () => api.dispatch({ type: 'welcome/open' }),
        }, '🧭'),
        TT.h('button', {
          type: 'button',
          className: 'tt-tool',
          title: t('panel.intro'),
          'data-active': state.intro ? 'true' : 'false',
          onClick: () => api.dispatch({ type: state.intro ? 'intro/close' : 'intro/open' }),
        }, '📖'),
        TT.h('button', { type: 'button', className: 'tt-tool', title: t('panel.hint'), onClick: () => api.dispatch({ type: 'hint' }) }, '💡'),
        TT.h('button', { type: 'button', className: 'tt-tool', title: t('panel.reset'), onClick: () => api.dispatch({ type: 'chapter/reset' }) }, '↺'),
        TT.h('button', { type: 'button', className: 'tt-tool', title: t('panel.camera'), onClick: () => api.resetCamera() }, '⌖'),
        TT.h('button', {
          type: 'button',
          className: 'tt-tool',
          title: state.soundMuted ? t('panel.soundOff') : t('panel.soundOn'),
          'data-active': state.soundMuted ? 'false' : 'true',
          onClick: () => api.dispatch({ type: 'sound/toggle' }),
        }, state.soundMuted ? '🔇' : '🔊'),
        TT.h('button', {
          type: 'button',
          className: 'tt-tool',
          title: state.cinema ? t('panel.cinemaStop') : t('panel.cinema'),
          'data-active': state.cinema ? 'true' : 'false',
          onClick: () => api.dispatch({ type: state.cinema ? 'cinema/stop' : 'cinema/start' }),
        }, state.cinema ? '⏹' : '🎬'),
        TT.h('button', {
          type: 'button',
          className: 'tt-tool',
          title: state.paused ? t('panel.resume') : t('panel.pause'),
          'data-active': state.paused ? 'true' : 'false',
          onClick: () => api.dispatch({ type: 'pause/toggle' }),
        }, state.paused ? '▶' : '⏸'),
        TT.h('button', {
          type: 'button',
          className: 'tt-tool',
          title: state.speed === 1 ? t('panel.speed') : t('panel.speedNormal'),
          onClick: () => api.dispatch({ type: 'speed/toggle' }),
        }, state.speed === 1 ? '1×' : '¼×'),
        narrow ? TT.h('button', {
          type: 'button',
          className: 'tt-tool',
          title: dataOpen ? t('panel.dataHide') : t('panel.data'),
          'data-active': dataOpen ? 'true' : 'false',
          onClick: () => setDataOpen((open) => !open),
        }, '▤') : null,
        TT.h('button', { type: 'button', className: 'tt-tool', title: t('panel.codex'), onClick: () => api.dispatch({ type: 'codex/toggle' }) }, '☰'),
        TT.h('button', { type: 'button', className: 'tt-close', title: t('panel.close'), onClick: closePanel }, '✕'),
      ),
    ),

    TT.h('div', { className: 'tt-stage' },
      TT.h('canvas', { className: 'tt-canvas', ref: canvasRef }),
      TT.h('div', { className: 'tt-scrim' }),
      state.intro ? null : TT.h('div', { className: 'tt-fade', key: `fade-${state.epoch}`, 'aria-hidden': 'true' }),
      state.intro ? null : TT.h('div', {
        className: 'tt-stamp',
        key: `stamp-${state.chapter}-${state.epoch}`,
        'aria-hidden': 'true',
      }, TT.h('span', null, resolve(chapter.titleKey))),
      TT.h('div', { className: 'tt-hud' },
        TT.h('div', { className: 'tt-hudrow' },
          TT.h('section', {
            className: 'tt-card tt-mission',
            'data-narrow': narrow ? 'true' : 'false',
            'data-collapsed': cardOpen ? 'false' : 'true',
          },
            TT.h('div', { className: 'tt-mtag' },
              TT.h('span', { className: 'tt-pip' }),
              TT.h('span', { className: 'tt-mtagtext' }, `${resolve(chapter.tagKey)}${narrow ? '' : ` · ${doneCount}/${goals.length}`}`),
              TT.h('button', {
                type: 'button',
                className: 'tt-cardfold',
                title: cardOpen ? t('panel.foldCard') : t('panel.unfoldCard'),
                'aria-expanded': cardOpen ? 'true' : 'false',
                onClick: () => setCardOpen((open) => !open),
              }, cardOpen ? '⌃' : '⌄'),
            ),
            TT.h('h3', { className: 'tt-mtitle' }, resolve(chapter.titleKey)),
            narrow ? null : TT.h('div', { className: 'tt-msub' }, resolve(chapter.subtitleKey)),
            TT.h('ul', { className: 'tt-goals' }, goals.map((goal, index) =>
              TT.h('li', { key: index, className: 'tt-goal', 'data-done': goal.done ? 'true' : 'false' },
                TT.h('span', { className: 'tt-check' }, '✓'),
                TT.h('span', null, resolve(goal.key, goal.params)),
              ),
            )),
            TT.h('div', { className: 'tt-progress' }, TT.h('i', { style: { width: `${goals.length ? (doneCount / goals.length) * 100 : 0}%` } })),
            TT.h('div', { className: 'tt-hint' }, TT.h('b', null, `${t('panel.hint')}: `), hintText),
            narrow ? null : TT.h('div', { className: 'tt-fact' }, resolve(chapter.factKey)),
            TT.h('div', { className: 'tt-controls' }, t('panel.controls')),
          ),
          TT.h('aside', {
            className: 'tt-card tt-telemetry',
            'data-narrow': medium ? 'true' : 'false',
            'data-forced': dataOpen ? 'true' : 'false',
            style: narrow && !dataOpen ? { display: 'none' } : undefined,
          },
            TT.UI.Telemetry({ state, t, resolve, api, chapterIndex: state.chapter }),
          ),
        ),
        TT.h('div', { className: 'tt-dockwrap' },
          TT.h('div', { className: 'tt-dock' },
            dock.map((item) => TT.h('button', {
              key: item.id,
              type: 'button',
              className: 'tt-btn',
              'data-kind': item.kind,
              disabled: Boolean(item.disabled),
              title: resolve(item.key, item.params),
              onClick: () => api.dispatch(item.action),
            }, resolve(item.key, item.params))),
            TT.h('span', { style: { flex: 1 } }),
            TT.h('span', { style: { alignSelf: 'center', fontSize: 10, color: 'var(--tt-faint)' } }, t('hud.blockTick')),
          ),
        ),
      ),
      state.cinema ? TT.h('div', { className: 'tt-cinema' },
        TT.h('span', null, '🎬', ' ', t('cinema.running')),
        TT.h('b', null, resolve(chapter.titleKey)),
        TT.h('button', {
          type: 'button',
          className: 'tt-cinema-stop',
          onClick: () => api.dispatch({ type: 'cinema/stop' }),
        }, '⏹ ', t('panel.cinemaStop')),
      ) : null,
      hover ? TT.h('div', { className: 'tt-tooltip' }, hover) : null,
      state.toast ? TT.h('div', { className: 'tt-toast', 'data-tone': state.toast.tone || 'info' }, resolve(state.toast.key, state.toast.params)) : null,
      inLab && TT.LabUI ? TT.LabUI.Lab({ state, t, resolve, api }) : null,
      inArcade && TT.ArcadeUI ? TT.ArcadeUI.Page({ state, t, resolve, api }) : null,
      intro,
      welcome,
      allDone && !state.finaleDismissed ? TT.UI.Finale({ state, t, resolve, api }) : null,
      state.codex ? TT.UI.Codex({ t, resolve, api }) : null,
    ),
  )
}

TT.UI.Telemetry = function Telemetry(props) {
  const { state, t, resolve, api, chapterIndex } = props
  const play = state.play
  const rows = []
  rows.push(TT.h('div', { className: 'tt-trow', key: 'nand' },
    TT.h('span', { className: 'tt-tlabel' }, t('hud.nand')),
    TT.h('span', { className: 'tt-tval' }, `${state.nand}`, TT.h('small', null, t('hud.nandUnit'))),
  ))
  rows.push(TT.h('div', { className: 'tt-trow', key: 'circuits' },
    TT.h('span', { className: 'tt-tlabel' }, t('hud.circuits')),
    TT.h('span', { className: 'tt-tval' }, `${state.circuits.length}`, TT.h('small', null, t('hud.circuitUnit'))),
  ))
  rows.push(TT.h('div', { className: 'tt-trow', key: 'blocks' },
    TT.h('span', { className: 'tt-tlabel' }, t('hud.blocks')),
    TT.h('span', { className: 'tt-tval tt-mono' }, TT.util.int(state.blocks), TT.h('small', null, 'BNB')),
  ))
  rows.push(TT.h('div', { className: 'tt-trow', key: 'clock' },
    TT.h('span', { className: 'tt-tlabel' }, t('hud.clock')),
    TT.h('span', { className: 'tt-tval' }, TT.protocol.CLOCK_HZ.toFixed(2), TT.h('small', null, t('hud.clockUnit'))),
  ))
  rows.push(TT.h('div', { className: 'tt-beatbar', key: 'beat' }, TT.h('i', null)))

  if (chapterIndex === 0) {
    rows.push(TT.h('div', { key: 'token', className: 'tt-nft' },
      TT.h('span', { className: 'tt-nftmark' }, '◈'),
      TT.h('span', { className: 'tt-nfttext' },
        TT.h('span', { className: 'tt-nfttitle' }, t('hud.token')),
        TT.h('span', { className: 'tt-nftsub' }, t('hud.erc1155')),
      ),
    ))
    rows.push(TT.h('div', { key: 'chip', className: 'tt-hex tt-mono' }, `opcode 00 · A 000000 · B 000000`, TT.h('br'), TT.h('span', { style: { color: 'var(--tt-dim)' } }, t('hud.chip7'))))
  }

  if (chapterIndex === 1 || chapterIndex === 2) {
    const verify = play.verify || { status: 'incomplete', rows: [], count: 0, mismatchCount: 0 }
    const tone = verify.status === 'pass' ? 'good' : verify.status === 'fail' ? 'bad' : 'muted'
    const label = verify.status === 'pass' ? t('hud.verifyPass') : verify.status === 'fail' ? t('hud.verifyFail') : t('hud.verifyIncomplete')
    rows.push(TT.h('div', { key: 'verify', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.verify')),
      TT.h('span', { className: `tt-badge`, 'data-tone': tone }, label),
    ))
    if (verify.count) {
      rows.push(TT.h('div', { key: 'rows', className: 'tt-trow' },
        TT.h('span', { className: 'tt-tlabel' }, t('hud.verifyRows')),
        TT.h('span', { className: 'tt-tval' }, `${verify.count}`, TT.h('small', null, t('hud.rowsUnit'))),
      ))
    }
    if (verify.rows && verify.rows.length) {
      rows.push(TT.h('table', { key: 'table', className: 'tt-table' },
        TT.h('thead', null, TT.h('tr', null,
          TT.h('th', null, t('hud.evalInput')),
          TT.h('th', null, t('hud.evalOutput')),
        )),
        TT.h('tbody', null, verify.rows.map((row, index) => TT.h('tr', { key: index, 'data-ok': row.ok === false ? 'false' : 'true' },
          TT.h('td', { className: 'tt-bit' }, TT.util.formatBits(row.inputBits, play.netlist ? play.netlist.nIn : 2)),
          TT.h('td', { className: 'tt-bit' }, TT.util.formatBits(row.actualBits, play.netlist ? play.netlist.outputs.length : 2)),
        ))),
      ))
    }
    if (chapterIndex === 1) {
      const visited = play.visited || 0
      rows.push(TT.h('div', { key: 'visited', className: 'tt-leds' },
        [0, 1, 2, 3].map((bits) => TT.h('span', { key: bits, className: 'tt-led', 'data-on': (visited & (1 << bits)) ? 'true' : 'false' },
          TT.h('i', null), TT.util.formatBits(bits, 2),
        )),
      ))
    }
    if (chapterIndex === 2 && play.netlist) {
      rows.push(TT.h('div', { key: 'gatecount', className: 'tt-trow' },
        TT.h('span', { className: 'tt-tlabel' }, t('hud.gates')),
        TT.h('span', { className: 'tt-tval' }, `${TT.Circuit.gateCount(play.netlist)}`, TT.h('small', null, TT.Circuit.maxDepth(play.netlist) ? `d${TT.Circuit.maxDepth(play.netlist)}` : '')),
      ))
      rows.push(TT.h('div', { key: 'netlist', className: 'tt-hex tt-mono' }, (play.hex || '').slice(0, 84) + ((play.hex || '').length > 84 ? '…' : '')))
    }
  }

  if (chapterIndex === 3) {
    const netlist = play.halfNetlist
    if (netlist) {
      rows.push(TT.h('div', { key: 'pins', className: 'tt-trow' },
        TT.h('span', { className: 'tt-tlabel' }, t('hud.pins')),
        TT.h('span', { className: 'tt-tval tt-mono' }, `${netlist.nIn} in · ${netlist.outputs.length} out · ${netlist.nState || 0} state`),
      ))
      rows.push(TT.h('div', { key: 'gates', className: 'tt-trow' },
        TT.h('span', { className: 'tt-tlabel' }, t('hud.gates')),
        TT.h('span', { className: 'tt-tval' }, TT.Circuit.gateCount(netlist)),
      ))
      rows.push(TT.h('div', { key: 'hex', className: 'tt-hex tt-mono' }, (play.halfHex || '').slice(0, 84) + '…'))
    }
    if (play.phase === 'done') {
      rows.push(TT.h('div', { key: 'nft', className: 'tt-nft' },
        TT.h('span', { className: 'tt-nftmark' }, '◈'),
        TT.h('span', { className: 'tt-nfttext' },
          TT.h('span', { className: 'tt-nfttitle' }, `${t('hud.nft')} #${play.nftId}`),
          TT.h('span', { className: 'tt-nftsub' }, t('hud.erc721')),
        ),
      ))
    }
    if (play.evalRows && play.evalRows.length) {
      rows.push(TT.h('div', { key: 'eval', className: 'tt-trow' },
        TT.h('span', { className: 'tt-tlabel' }, t('hud.eval')),
        TT.h('span', { style: { fontSize: 10, color: 'var(--tt-mint)' } }, t('hud.free')),
      ))
      rows.push(TT.h('table', { key: 'evaltable', className: 'tt-table' },
        TT.h('thead', null, TT.h('tr', null, TT.h('th', null, t('hud.evalInput')), TT.h('th', null, t('hud.evalOutput')))),
        TT.h('tbody', null, play.evalRows.map((row, index) => TT.h('tr', { key: index },
          TT.h('td', { className: 'tt-bit' }, TT.util.formatBits(row.inputBits, 2)),
          TT.h('td', { className: 'tt-bit' }, TT.util.formatBits(row.outputBits, 2)),
        ))),
      ))
    }
  }

  if (chapterIndex === 4) {
    const wave = play.wave || []
    rows.push(TT.h('div', { key: 'wave', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.wave')),
      TT.h('span', { style: { fontSize: 10, color: 'var(--tt-faint)' } }, t('hud.settle')),
    ))
    rows.push(TT.h('div', { key: 'wavebox', className: 'tt-wave' },
      wave.map((cell, index) => TT.h('span', { key: index, className: 'tt-wcol' },
        [cell.S, cell.R, cell.Q, cell.Qn].map((value, ch) => TT.h('i', {
          key: ch,
          className: 'tt-wcell',
          'data-on': value ? 'true' : 'false',
          'data-ch': ch,
        })),
      )),
    ))
    rows.push(TT.h('div', { key: 'wavelabels', className: 'tt-wlabels' },
      TT.h('span', null, `S/R/Q/Q̄`),
      TT.h('span', null, `${play.stableQ || 0} × Q=1 · ${play.stableQn || 0} × Q=0`),
    ))
  }

  if (chapterIndex === 5) {
    const verify = play.verify || { status: 'incomplete', count: 0 }
    const tone = verify.status === 'pass' ? 'good' : verify.status === 'fail' ? 'bad' : 'muted'
    const label = verify.status === 'pass' ? t('hud.verifyPass') : verify.status === 'fail' ? t('hud.verifyFail') : t('hud.verifyIncomplete')
    rows.push(TT.h('div', { key: 'verify', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.verify')),
      TT.h('span', { className: 'tt-badge', 'data-tone': tone }, `${label} · ${verify.count || 0} ${t('hud.rowsUnit')}`),
    ))
    if (play.netlist) {
      rows.push(TT.h('div', { key: 'gates', className: 'tt-trow' },
        TT.h('span', { className: 'tt-tlabel' }, t('hud.gates')),
        TT.h('span', { className: 'tt-tval' }, TT.Circuit.gateCount(play.netlist), TT.h('small', null, ' vs 9')),
      ))
      rows.push(TT.h('div', { key: 'hex', className: 'tt-hex tt-mono' }, (play.hex || '').slice(0, 84) + '…'))
    }
    if (play.taped) {
      const last = state.circuits[state.circuits.length - 1]
      rows.push(TT.h('div', { key: 'nft', className: 'tt-nft' },
        TT.h('span', { className: 'tt-nftmark' }, '◈'),
        TT.h('span', { className: 'tt-nfttext' },
          TT.h('span', { className: 'tt-nfttitle' }, `${t('hud.nft')} #${last ? last.id : '?'}`),
          TT.h('span', { className: 'tt-nftsub' }, t('hud.erc721')),
        ),
      ))
    }
  }

  if (chapterIndex === 6) {
    const playState = play
    const result = playState.result
    const value = result && playState.showResult ? result.outputBits & 15 : null
    rows.push(TT.h('div', { key: 'program', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.program')),
      TT.h('span', { className: 'tt-tval tt-mono' }, t('hud.programOp', { a: playState.operands[0], b: playState.operands[1] })),
    ))
    rows.push(TT.h('div', { key: 'running', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.result')),
      TT.h('span', { className: 'tt-tval tt-mono' }, value === null ? '—' : `${value}`, TT.h('small', null, value === null ? t('hud.running') : '')),
    ))
    rows.push(TT.h('div', { key: 'seg', className: 'tt-seg' },
      TT.UI.SevenSeg({ value: value === null ? 0 : value }),
      TT.h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3 } },
        TT.h('div', { style: { fontSize: 10, color: 'var(--tt-dim)' } }, t('hud.resultSeg')),
        TT.h('div', { className: 'tt-bit', style: { fontSize: 10.5, color: '#9fe7ff' } },
          result ? `C ${result.outputBits & 16 ? 1 : 0} · S ${TT.util.formatBits(result.outputBits & 15, 4)}` : '—'),
        TT.h('div', { style: { fontSize: 10, color: 'var(--tt-faint)' } }, t('hud.cpuStory')),
      ),
    ))
  }

  if (chapterIndex === 7) {
    const verify = play.verify || { status: 'idle', rows: [], count: 0 }
    const tone = verify.status === 'pass' ? 'good' : verify.status === 'fail' ? 'bad' : 'muted'
    const mask = play.mask || 0
    rows.push(TT.h('div', { key: 'segverify', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.verify')),
      TT.h('span', { className: 'tt-badge', 'data-tone': tone },
        verify.status === 'pass' ? t('hud.verifyPass') : verify.status === 'fail' ? t('hud.verifyFail') : t('hud.verifyIncomplete')),
    ))
    if (play.netlist) {
      rows.push(TT.h('div', { key: 'seggates', className: 'tt-trow' },
        TT.h('span', { className: 'tt-tlabel' }, t('hud.gates')),
        TT.h('span', { className: 'tt-tval' }, TT.Circuit.gateCount(play.netlist)),
      ))
    }
    rows.push(TT.h('div', { key: 'segdigit', className: 'tt-seg' },
      TT.UI.SevenSeg({ value: play.digit || 0 }),
      TT.h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
        TT.h('div', { style: { fontSize: 10, color: 'var(--tt-dim)' } }, `${t('hud.digit')} ${play.digit || 0} · ${t('hud.mask')} ${TT.util.formatBits(mask, 7)}`),
        TT.h('div', { className: 'tt-segmask' }, [0, 1, 2, 3, 4, 5, 6].map((index) =>
          TT.h('i', { key: index, 'data-on': (mask >> index) & 1 ? 'true' : 'false' }))),
        TT.h('div', { className: 'tt-leds' }, [0, 1, 2, 3].map((index) =>
          TT.h('span', { key: index, className: 'tt-led', 'data-on': play.inputs && play.inputs[index] ? 'true' : 'false' }, TT.h('i', null), `D${index}`))),
      ),
    ))
    rows.push(TT.h('div', { key: 'segvisited', className: 'tt-leds' },
      Array.from({ length: 10 }, (_, index) =>
        TT.h('span', { key: index, className: 'tt-led', 'data-on': ((play.visitedMask || 0) >> index) & 1 ? 'true' : 'false' }, TT.h('i', null), String(index))),
    ))
  }

  if (chapterIndex === 8) {
    const bits = play.stateBits || 0
    rows.push(TT.h('div', { key: 'counterbin', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.binary')),
      TT.h('span', { className: 'tt-tval tt-bit' }, TT.util.formatBits(bits, 4)),
    ))
    rows.push(TT.h('div', { key: 'counterdec', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.decimal')),
      TT.h('span', { className: 'tt-tval' }, bits),
    ))
    rows.push(TT.h('div', { key: 'counterbeats', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.beats')),
      TT.h('span', { className: 'tt-tval' }, play.beats || 0),
    ))
    rows.push(TT.h('div', { key: 'counternext', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.next')),
      TT.h('span', { className: 'tt-tval tt-bit' }, TT.util.formatBits((bits + 1) & 15, 4)),
    ))
    rows.push(TT.h('div', { key: 'counterleds', className: 'tt-leds' },
      [0, 1, 2, 3].map((index) =>
        TT.h('span', { key: index, className: 'tt-led', 'data-on': (bits >> index) & 1 ? 'true' : 'false' }, TT.h('i', null), `Q${index}`)),
    ))
  }

  if (chapterIndex === 9) {
    const cpu = play.state
    const results = play.results || {}
    rows.push(TT.h('div', { key: 'cpuprog', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.program')),
      TT.h('span', { className: 'tt-tval' }, t(`cpu.prog.${play.programId}`)),
    ))
    if (cpu) {
      rows.push(TT.h('div', { key: 'cpureg', className: 'tt-leds' },
        [['PC', cpu.PC], ['IR', cpu.IR], ['A', cpu.A], ['OUT', cpu.OUT]].map(([label, value]) =>
          TT.h('span', { key: label, className: 'tt-led', 'data-on': 'false' }, TT.h('i', null), `${label} ${value}`)),
      ))
      rows.push(TT.h('div', { key: 'cpuflags', className: 'tt-trow' },
        TT.h('span', { className: 'tt-tlabel' }, 'Z / C / halted'),
        TT.h('span', { className: 'tt-tval tt-mono' }, `${cpu.Z ? 1 : 0} / ${cpu.C ? 1 : 0} / ${cpu.halted ? 1 : 0}`),
      ))
      rows.push(TT.h('table', { key: 'cputrace', className: 'tt-table' },
        TT.h('thead', null, TT.h('tr', null, TT.h('th', null, 'PC'), TT.h('th', null, 'IR'), TT.h('th', null, 'A'))),
        TT.h('tbody', null, (play.trace || []).slice(-4).map((entry, index) =>
          TT.h('tr', { key: index },
            TT.h('td', { className: 'tt-bit' }, entry.pc),
            TT.h('td', { className: 'tt-bit' }, `${entry.name || '?'} ${entry.arg}`),
            TT.h('td', { className: 'tt-bit' }, entry.a),
          ))),
      ))
    }
    rows.push(TT.h('div', { key: 'cpuresults', className: 'tt-leds' },
      ['add35', 'sum15', 'mul12'].map((id) =>
        TT.h('span', { key: id, className: 'tt-led', 'data-on': results[id] !== undefined ? 'true' : 'false' },
          TT.h('i', null), t(`cpu.prog.${id}`)),
      ),
    ))
  }

  if (chapterIndex === 10) {
    const safety = TT.Safety
    const modal = ['allow', 'slow', 'home', 'stop']
    rows.push(TT.h('div', { key: 'safetymode', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.mode')),
      TT.h('span', { className: 'tt-tval' }, t(`safety.${modal[play.mode || 0]}`)),
    ))
    rows.push(TT.h('div', { key: 'safetypads', className: 'tt-safetypads' },
      safety.KEYS.map((key, index) =>
        TT.h('button', {
          key,
          type: 'button',
          className: 'tt-safetypad',
          'data-on': ((play.bits || 0) >> index) & 1 ? 'true' : 'false',
          title: `${key} · ${safety.LABELS[index]}`,
          onClick: () => api.dispatch({ type: 'safety/toggle', index }),
        }, key),
      ),
    ))
    const verify = play.verify || { status: 'idle' }
    rows.push(TT.h('div', { key: 'safetyaudit', className: 'tt-trow' },
      TT.h('span', { className: 'tt-tlabel' }, t('hud.verify')),
      TT.h('span', { className: 'tt-badge', 'data-tone': verify.status === 'pass' ? 'good' : verify.status === 'fail' ? 'bad' : 'muted' },
        verify.status === 'pass' ? t('hud.verifyPass') : verify.status === 'fail' ? t('hud.verifyFail') : t('hud.verifyIncomplete')),
    ))
    rows.push(TT.h('div', { key: 'safetyseen', className: 'tt-leds' },
      [0, 1, 2, 3].map((index) =>
        TT.h('span', { key: index, className: 'tt-led', 'data-on': ((play.seenMask || 0) >> index) & 1 ? 'true' : 'false' },
          TT.h('i', null), t(`safety.${modal[index]}`)),
      ),
    ))
  }

  if (state.log.length) {
    rows.push(TT.h('div', { key: 'log', style: { display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 } },
      state.log.slice(0, 3).map((entry) => TT.h('div', {
        key: entry.id,
        style: { fontSize: 10.5, color: entry.tone === 'good' ? '#7ef0c8' : 'var(--tt-faint)', lineHeight: 1.4 },
      }, `#${entry.block} ${resolve(entry.key, entry.params)}`)),
    ))
  }

  return rows
}

TT.UI.Finale = function Finale(props) {
  const { state, t, resolve, api } = props
  const stats = TT.Missions.stats(state)
  const colors = ['#56e1ff', '#ffc35c', '#2be6c2', '#ff6ad5', '#8fb3c8']
  const confetti = []
  for (let i = 0; i < 24; i += 1) {
    confetti.push({
      left: `${(i * 43 + 7) % 100}%`,
      delay: `${((i * 137) % 900) / 1000}s`,
      duration: `${2.4 + ((i * 7) % 18) / 10}s`,
      color: colors[i % colors.length],
      height: `${8 + (i % 4) * 3}px`,
      rotate: `${(i * 29) % 360}deg`,
    })
  }
  const statItems = [
    [t('finale.stat.chapters'), `${stats.chapters}/7`],
    [t('finale.stat.minted'), TT.util.int(stats.minted)],
    [t('finale.stat.circuits'), TT.util.int(stats.circuits)],
    [t('finale.stat.gates'), TT.util.int(stats.gatesBurned)],
    [t('finale.stat.blocks'), TT.util.int(stats.blocks)],
  ]
  return TT.h('div', { className: 'tt-finale' },
    TT.h('div', { className: 'tt-confetti', 'aria-hidden': 'true' }, confetti.map((piece, index) =>
      TT.h('i', {
        key: index,
        style: {
          left: piece.left,
          background: piece.color,
          height: piece.height,
          animationDuration: piece.duration,
          animationDelay: piece.delay,
          transform: `rotate(${piece.rotate})`,
        },
      }),
    )),
    TT.h('div', { className: 'tt-finalecard', role: 'dialog', 'aria-label': t('finale.title') },
      TT.h('div', { className: 'tt-trophy' }, TT.UI.Icon({ size: 28 })),
      TT.h('h2', { className: 'tt-finaletitle' }, t('finale.title')),
      TT.h('div', { className: 'tt-finalesub' }, t('finale.sub')),
      TT.h('div', { className: 'tt-stats' }, statItems.map((item, index) =>
        TT.h('div', { key: index, className: 'tt-stat' }, TT.h('b', null, item[1]), TT.h('span', null, item[0])),
      )),
      TT.h('div', { className: 'tt-finalelabel' }, t('finale.chapters')),
      TT.h('div', { className: 'tt-recap' }, TT.protocol.CHAPTERS.map((id, index) =>
        TT.h('span', { key: id }, TT.h('i', null, '✓'), resolve(`chapter.${index}.title`)),
      )),
      TT.h('div', { className: 'tt-finalenote' }, t('finale.note')),
      TT.h('div', { className: 'tt-finaleactions' },
        TT.h('button', {
          type: 'button',
          className: 'tt-btn',
          'data-kind': 'primary',
          onClick: () => api.dispatch({ type: 'game/reset' }),
        }, t('finale.replay')),
        TT.h('button', {
          type: 'button',
          className: 'tt-btn',
          'data-kind': 'ghost',
          onClick: () => api.dispatch({ type: 'finale/close' }),
        }, t('finale.stay')),
      ),
    ),
  )
}

TT.UI.Codex = function Codex(props) {
  const { t, resolve, api } = props
  const sections = [1, 2, 3, 4, 5, 6, 7].map((n) => TT.h('div', { key: n, className: 'tt-codexsec' },
    TT.h('h4', null, t(`codex.s${n}.title`)),
    TT.h('p', null, t(`codex.s${n}.body`)),
  ))
  return TT.h('div', { className: 'tt-codex' },
    TT.h('div', { className: 'tt-codexcard', role: 'dialog', 'aria-label': t('codex.title') },
      TT.h('div', { className: 'tt-codexhead' },
        TT.h('strong', { style: { fontSize: 14 } }, t('codex.title')),
        TT.h('span', { style: { flex: 1 } }),
        TT.h('button', { type: 'button', className: 'tt-close', title: t('codex.close'), onClick: () => api.dispatch({ type: 'codex/close' }) }, '✕'),
      ),
      TT.h('div', { className: 'tt-codexlead' }, t('codex.lead')),
      sections,
      TT.h('div', { className: 'tt-codexnote' }, t('codex.note')),
    ),
  )
}
