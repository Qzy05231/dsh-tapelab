/**
 * 50-version — version badge, changelog and a GitHub update check.
 * A browser plugin cannot silently replace itself, so the panel reports the latest
 * commit and gives the exact update steps/command instead.
 */

TT.Version = (function () {
  const VERSION = '1.10.3'
  const BUILT_AT = '2026-11-21'
  const REPO = 'https://github.com/Qzy05231/dsh-tapelab'
  const API = 'https://api.github.com/repos/Qzy05231/dsh-tapelab/commits/main'
  const COMMAND = 'git pull && node scripts/build.mjs'
  const CHANGELOG = [
    {
      version: '1.10.3',
      date: '2026-11-22',
      items: ['密码锁/猜数字/表决器改为单列，网表嵌入游戏卡内部，消除空白'],
    },
    {
      version: '1.10.2',
      date: '2026-11-22',
      items: ['修复猜数字页面误用密码锁变量导致的黑屏，全部街机页已逐一渲染验证'],
    },
    {
      version: '1.10.1',
      date: '2026-11-22',
      items: [
        '密码锁页面改为单列布局，消除左右卡片高度差造成的空白',
        '比较器网表实时跟随猜测位；密码位在结束前隐藏，避免泄露答案',
      ],
    },
    {
      version: '1.10.0',
      date: '2026-11-22',
      items: [
        '密码锁升级为 Mastermind 规则：仅提示匹配位数并记录历史推理',
        '第 7 章巨兽 CPU 支持加减调整两个 4 位操作数，观察加法与溢出',
        '抽离硬件规划器与传感器模块中的硬编码中文，完善 i18n 多语言对齐',
        '补齐 README 完整 14 章节介绍与最新测试数据统计',
      ],
    },
    {
      version: '1.9.11',
      date: '2026-11-22',
      items: ['放大钢琴下方键位图例的按键与音名字号'],
    },
    {
      version: '1.9.10',
      date: '2026-11-22',
      items: [
        '曲目播放到结尾会自动停止并显示“播放完毕”，再次播放从头开始',
        '弹奏钢琴时每个音都会推进计数器，右侧网表实时变化',
      ],
    },
    {
      version: '1.9.9',
      date: '2026-11-22',
      items: [
        '音乐盒计数器改为按拍累计，长音也会正确跳计数',
        '章节↔网表映射集中到一处并加测试，避免再次错配',
      ],
    },
    {
      version: '1.9.8',
      date: '2026-11-22',
      items: ['修复音乐盒网表未渲染的问题，进入页面即可在控制区右侧看到'],
    },
    {
      version: '1.9.7',
      date: '2026-11-22',
      items: [
        '音乐盒页改为左宽右窄（约 1.7:0.55），游戏区、钢琴和网表更大',
        '计数器网表默认展开，进入即可看到，仍可一键收起',
      ],
    },
    {
      version: '1.9.6',
      date: '2026-11-22',
      items: ['音乐盒右上角网表按宽度放大（最高 1.35×），门卡片和文字更清楚'],
    },
    {
      version: '1.9.5',
      date: '2026-11-22',
      items: ['音乐盒计数器网表回到右上角，宽度加至约 470px，并带独立收起按钮'],
    },
    {
      version: '1.9.4',
      date: '2026-11-22',
      items: [
        '音乐盒网表改为下方通栏大图，门卡片更大；标题栏与展开按钮都可收起',
      ],
    },
    {
      version: '1.9.3',
      date: '2026-11-22',
      items: ['音乐盒网表按内容自动收高，消除下方的大块空白'],
    },
    {
      version: '1.9.2',
      date: '2026-11-22',
      items: ['数字键/快捷键仅在主线任务里生效，不再从实验室或游乐场误跳章节'],
    },
    {
      version: '1.9.1',
      date: '2026-11-22',
      items: ['元件展厅补齐 NAND、2-4 译码器、4 位计数器的网表，所有展品都能预览'],
    },
    {
      version: '1.9.0',
      date: '2026-11-22',
      items: [
        '元件展厅与电路库的「网表视图」改为弹出大窗，关闭即返回列表',
      ],
    },
    {
      version: '1.8.9',
      date: '2026-11-22',
      items: ['沙盒的返回键会回到打开它的页面（综合/展厅/电路库），不再固定跳综合器'],
    },
    {
      version: '1.8.8',
      date: '2026-11-22',
      items: [
        '网表与演示联动：第 1/2/5/7 章的网表可直接拨输入，输出和连线实时刷新',
        '网表仍位于演示画面右侧遥测框内，展开即可对照观看',
      ],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: [
        '故障排查实验室支持网表视图：红色高亮故障门，修复后变绿',
      ],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['实验室综合结果、元件展厅、电路库都支持直接预览网表'],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['钢琴键位说明改为键盘下方一排「按键 = 音名」图例，随八度更新'],
    },
    {
      version: '1.8.5',
      date: '2026-11-22',
      items: ['切换章节时自动切换/关闭网表，不再停留在上一章的网表'],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['钢琴键位说明改为键盘下方一排「按键 = 音名」图例，随八度更新'],
    },
    {
      version: '1.8.5',
      date: '2026-11-22',
      items: ['钢琴键盘在每个键下方显示对应的电脑键盘字母，随八度切换更新'],
    },
    {
      version: '1.8.4',
      date: '2026-11-22',
      items: [
        '修正各章网表映射：第 1 章与非门、第 2 章半加器、第 5 章乐高全加器补齐入口',
        '巨兽 CPU 章移除错误的 4 位加法器网表；第 7 章改用实际综合出的网表',
      ],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['钢琴键位说明改为键盘下方一排「按键 = 音名」图例，随八度更新'],
    },
    {
      version: '1.8.5',
      date: '2026-11-22',
      items: ['钢琴键盘在每个键下方显示对应的电脑键盘字母，随八度切换更新'],
    },
    {
      version: '1.8.4',
      date: '2026-11-22',
      items: [
        '网表动态性检查与修复：多数表决网表与游戏按钮联动',
        '密码锁/猜数字/调试实验室网表支持点击输入实时求值',
      ],
    },
    {
      version: '1.8.3',
      date: '2026-11-22',
      items: ['第 14 章容器化部署也加入网表入口，显示被打包的半加器电路'],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['钢琴键位说明改为键盘下方一排「按键 = 音名」图例，随八度更新'],
    },
    {
      version: '1.8.5',
      date: '2026-11-22',
      items: ['钢琴键盘在每个键下方显示对应的电脑键盘字母，随八度切换更新'],
    },
    {
      version: '1.8.4',
      date: '2026-11-22',
      items: [
        '网表动态性检查与修复：多数表决网表与游戏按钮联动',
        '密码锁/猜数字/调试实验室网表支持点击输入实时求值',
      ],
    },
    {
      version: '1.8.3',
      date: '2026-11-22',
      items: [
        '游乐场接入网表：多数表决、密码锁、猜数字、音乐盒在游戏下方可展开网表',
        '调试实验室保留故障门高亮网表',
      ],
    },
    {
      version: '1.8.2',
      date: '2026-11-22',
      items: ['框内网表固定为与框同宽、约 460px 高，展开后完整显示不再被压成一条'],
    },
    {
      version: '1.8.1',
      date: '2026-11-22',
      items: ['框内网表展开时收起统计行并占满卡片，全部门无需放大即可完整显示'],
    },
    {
      version: '1.8.0',
      date: '2026-11-22',
      items: [
        '遥测框新增紧凑网表：可展开/收起，演示运行时实时刷新并高亮变化的门',
        '保留大窗「放大查看」用于按原始大小仔细看网表',
      ],
    },
    {
      version: '1.7.9',
      date: '2026-11-22',
      items: ['贪吃蛇从 8×8 网格升级为 16×16，格子更小、活动空间更大'],
    },
    {
      version: '1.9.11',
      date: '2026-11-22',
      items: ['放大钢琴下方键位图例的按键与音名字号'],
    },
    {
      version: '1.9.10',
      date: '2026-11-22',
      items: [
        '曲目播放到结尾会自动停止并显示“播放完毕”，再次播放从头开始',
        '弹奏钢琴时每个音都会推进计数器，右侧网表实时变化',
      ],
    },
    {
      version: '1.9.9',
      date: '2026-11-22',
      items: [
        '音乐盒计数器改为按拍累计，长音也会正确跳计数',
        '章节↔网表映射集中到一处并加测试，避免再次错配',
      ],
    },
    {
      version: '1.9.8',
      date: '2026-11-22',
      items: ['修复音乐盒网表未渲染的问题，进入页面即可在控制区右侧看到'],
    },
    {
      version: '1.9.7',
      date: '2026-11-22',
      items: [
        '音乐盒页改为左宽右窄（约 1.7:0.55），游戏区、钢琴和网表更大',
        '计数器网表默认展开，进入即可看到，仍可一键收起',
      ],
    },
    {
      version: '1.9.6',
      date: '2026-11-22',
      items: ['音乐盒右上角网表按宽度放大（最高 1.35×），门卡片和文字更清楚'],
    },
    {
      version: '1.9.5',
      date: '2026-11-22',
      items: ['音乐盒计数器网表回到右上角，宽度加至约 470px，并带独立收起按钮'],
    },
    {
      version: '1.9.4',
      date: '2026-11-22',
      items: [
        '音乐盒网表改为下方通栏大图，门卡片更大；标题栏与展开按钮都可收起',
      ],
    },
    {
      version: '1.9.3',
      date: '2026-11-22',
      items: ['音乐盒网表按内容自动收高，消除下方的大块空白'],
    },
    {
      version: '1.9.2',
      date: '2026-11-22',
      items: ['数字键/快捷键仅在主线任务里生效，不再从实验室或游乐场误跳章节'],
    },
    {
      version: '1.9.1',
      date: '2026-11-22',
      items: ['元件展厅补齐 NAND、2-4 译码器、4 位计数器的网表，所有展品都能预览'],
    },
    {
      version: '1.9.0',
      date: '2026-11-22',
      items: [
        '元件展厅与电路库的「网表视图」改为弹出大窗，关闭即返回列表',
      ],
    },
    {
      version: '1.8.9',
      date: '2026-11-22',
      items: ['沙盒的返回键会回到打开它的页面（综合/展厅/电路库），不再固定跳综合器'],
    },
    {
      version: '1.8.8',
      date: '2026-11-22',
      items: [
        '网表与演示联动：第 1/2/5/7 章的网表可直接拨输入，输出和连线实时刷新',
        '网表仍位于演示画面右侧遥测框内，展开即可对照观看',
      ],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: [
        '故障排查实验室支持网表视图：红色高亮故障门，修复后变绿',
      ],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['实验室综合结果、元件展厅、电路库都支持直接预览网表'],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['钢琴键位说明改为键盘下方一排「按键 = 音名」图例，随八度更新'],
    },
    {
      version: '1.8.5',
      date: '2026-11-22',
      items: ['切换章节时自动切换/关闭网表，不再停留在上一章的网表'],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['钢琴键位说明改为键盘下方一排「按键 = 音名」图例，随八度更新'],
    },
    {
      version: '1.8.5',
      date: '2026-11-22',
      items: ['钢琴键盘在每个键下方显示对应的电脑键盘字母，随八度切换更新'],
    },
    {
      version: '1.8.4',
      date: '2026-11-22',
      items: [
        '修正各章网表映射：第 1 章与非门、第 2 章半加器、第 5 章乐高全加器补齐入口',
        '巨兽 CPU 章移除错误的 4 位加法器网表；第 7 章改用实际综合出的网表',
      ],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['钢琴键位说明改为键盘下方一排「按键 = 音名」图例，随八度更新'],
    },
    {
      version: '1.8.5',
      date: '2026-11-22',
      items: ['钢琴键盘在每个键下方显示对应的电脑键盘字母，随八度切换更新'],
    },
    {
      version: '1.8.4',
      date: '2026-11-22',
      items: [
        '网表动态性检查与修复：多数表决网表与游戏按钮联动',
        '密码锁/猜数字/调试实验室网表支持点击输入实时求值',
      ],
    },
    {
      version: '1.8.3',
      date: '2026-11-22',
      items: ['第 14 章容器化部署也加入网表入口，显示被打包的半加器电路'],
    },
    {
      version: '1.8.7',
      date: '2026-11-22',
      items: ['NAND 音乐盒的网表视图移到界面右上角，与播放控制同排'],
    },
    {
      version: '1.8.6',
      date: '2026-11-22',
      items: ['钢琴键位说明改为键盘下方一排「按键 = 音名」图例，随八度更新'],
    },
    {
      version: '1.8.5',
      date: '2026-11-22',
      items: ['钢琴键盘在每个键下方显示对应的电脑键盘字母，随八度切换更新'],
    },
    {
      version: '1.8.4',
      date: '2026-11-22',
      items: [
        '网表动态性检查与修复：多数表决网表与游戏按钮联动',
        '密码锁/猜数字/调试实验室网表支持点击输入实时求值',
      ],
    },
    {
      version: '1.8.3',
      date: '2026-11-22',
      items: [
        '游乐场接入网表：多数表决、密码锁、猜数字、音乐盒在游戏下方可展开网表',
        '调试实验室保留故障门高亮网表',
      ],
    },
    {
      version: '1.8.2',
      date: '2026-11-22',
      items: ['框内网表固定为与框同宽、约 460px 高，展开后完整显示不再被压成一条'],
    },
    {
      version: '1.8.1',
      date: '2026-11-22',
      items: ['框内网表展开时收起统计行并占满卡片，全部门无需放大即可完整显示'],
    },
    {
      version: '1.8.0',
      date: '2026-11-22',
      items: [
        '遥测框新增紧凑网表：可展开/收起，演示运行时实时刷新并高亮变化的门',
        '保留大窗「放大查看」用于按原始大小仔细看网表',
      ],
    },
    {
      version: '1.7.9',
      date: '2026-11-22',
      items: ['恢复网表查看：改为大窗展示，网表接近原始大小，可缩放/滚动'],
    },
    {
      version: '1.7.8',
      date: '2026-11-22',
      items: ['移除网表视图（章节展开面板与沙盒切换），恢复简洁 HUD'],
    },
    {
      version: '1.7.7',
      date: '2026-11-22',
      items: [
        '紧凑网表放大：改为 6 列排布、门卡片 46px 宽、字体加大',
        '第 3/6/7 章（半加器/4 位加法器/七段显示）也加入网表展开按钮',
      ],
    },
    {
      version: '1.7.6',
      date: '2026-11-22',
      items: ['窄框内网表改用紧凑排版：80 门 8×10 全部一屏显示，无滚动条'],
    },
    {
      version: '1.7.5',
      date: '2026-11-22',
      items: ['框内网表默认按 100% 原始大小显示，可滚动查看；点「适应」再缩放'],
    },
    {
      version: '1.7.4',
      date: '2026-11-22',
      items: ['展开网表时限制右侧卡片高度，修复底部操作按键被顶出画面'],
    },
    {
      version: '1.7.3',
      date: '2026-11-22',
      items: ['右侧遥测框宽度与左上角任务框一致，展开网表时保持同宽'],
    },
    {
      version: '1.7.2',
      date: '2026-11-21',
      items: [
        '右上角遥测框加宽并贴近右侧边缘，展开网表时宽度不再变化',
        '展开只向下延展，避免宽面板遮挡中间的 3D 演示',
      ],
    },
    {
      version: '1.7.1',
      date: '2026-11-21',
      items: [
        '网表展开/收起按钮移入右上角遥测框内部，同一个框向下展开网表',
        '展开时遥测框向右加宽（约 76%），网表更大且贴近右侧边缘',
      ],
    },
    {
      version: '1.7.0',
      date: '2026-11-21',
      items: [
        '网表改为右侧宽抽屉：宽度接近整个面板，默认收起，一键展开/收起',
        '抽屉内完整显示 8×10 门矩阵，不再被右栏挤窄',
      ],
    },
    {
      version: '1.6.9',
      date: '2026-11-21',
      items: [
        '网表改为右侧遥测卡下方的可折叠面板，不再使用全屏弹窗',
        '展开时右列自动变宽，网表与演示画面并排；收起后恢复原布局',
      ],
    },
    {
      version: '1.6.8',
      date: '2026-11-21',
      items: [
        '锁存器与计数器也支持网表视图，每拍对比上一拍并高亮变化的门',
        '时序网表显示状态位 Q0…，计数器可点「下一拍」推进',
      ],
    },
    {
      version: '1.6.7',
      date: '2026-11-21',
      items: [
        '网表网格改为 8 列矩阵布局：80 个门 = 8×10，整张一屏显示且文字可读',
        '输入改为顶部「位值 + 按键字母」的紧凑标签，门卡片显示 N节点 · L层 与输出值',
      ],
    },
    {
      version: '1.6.6',
      date: '2026-11-21',
      items: [
        '网表网格默认自适应缩放，整张 80 门 / 32 层网表一屏显示，不再滚动',
        '网格顶端新增 − / 适应 / + 缩放按钮，需要时可放大查看单个门',
      ],
    },
    {
      version: '1.6.5',
      date: '2026-11-21',
      items: [
        '通用门级网表网格：按逻辑深度分层、自动连线、拨输入、点门看 a/b/y 与信号值',
        '第 11 章安全电路与实验室沙盒都支持 3D / 网表视图切换',
      ],
    },
    {
      version: '1.6.4',
      date: '2026-11-21',
      items: [
        'NAND 音乐盒新增完整 88 键钢琴（A0–C8），可点击或键盘两排弹奏',
        '修复《欢乐颂》音高与《小星星》节奏，音符按拍数播放',
      ],
    },
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
