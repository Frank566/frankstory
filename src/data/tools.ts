export type ToolMeta = {
  slug: string
  name: string
  group: '追踪工具' | '计算器' | '图鉴与指南'
  description: string
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'roster',
    name: '角色名单',
    group: '追踪工具',
    description: '管理你在冒险岛 GMS 区的所有角色，记录职业、等级与备注，一目了然。',
  },
  {
    slug: 'character-lookup',
    name: '角色查询',
    group: '追踪工具',
    description: '输入角色名，查询该角色在官方排行榜中的等级、职业与排名。',
  },
  {
    slug: 'boss',
    name: 'Boss追踪',
    group: '追踪工具',
    description: '追踪每周/每月 Boss 的击杀状态，避免遗漏可领取的奖励。',
  },
  {
    slug: 'schedule',
    name: '时间看板',
    group: '追踪工具',
    description: '汇总每日、每周需要完成的任务清单，配合倒计时提醒不错过重置。',
  },
  {
    slug: 'expedition',
    name: '怪怪远征',
    group: '计算器',
    description: '计算怪怪远征所需资源与预计完成时间。',
  },
  {
    slug: 'liberation',
    name: '解封进度',
    group: '计算器',
    description: '追踪解放任务链的完成进度，规划下一步该做什么。',
  },
  {
    slug: 'fragment',
    name: '小核进度',
    group: '计算器',
    description: '计算小核（内在能力）养成进度与所需材料。',
  },
  {
    slug: 'equipment',
    name: '角色装备',
    group: '计算器',
    description: '记录角色当前装备配置，方便随时查阅与比较。',
  },
  {
    slug: 'equipment-plan',
    name: '装备计划',
    group: '计算器',
    description: '为角色制定装备升级计划，追踪所需材料与花费。',
  },
  {
    slug: 'checklist',
    name: '超必清单',
    group: '计算器',
    description: '常用超必（必备事项）清单，避免养成路线上遗漏关键步骤。',
  },
  {
    slug: 'cards',
    name: '怪怪卡目录',
    group: '图鉴与指南',
    description: '查阅怪怪卡片图鉴，了解获取方式与效果。',
  },
  {
    slug: 'mystic-river',
    name: '神秘河游戏',
    group: '图鉴与指南',
    description: '神秘河小游戏玩法说明与攻略整理。',
  },
  {
    slug: 'qa-bot',
    name: '问答机器人',
    group: '图鉴与指南',
    description: '常见问题智能问答，快速找到你需要的答案。',
  },
  {
    slug: 'beginner',
    name: '萌新上路',
    group: '图鉴与指南',
    description: '新手入坑指南，从零开始了解冒险岛 GMS 区。',
  },
  {
    slug: 'leveling-maps',
    name: '练级地图',
    group: '图鉴与指南',
    description: '各等级段推荐练级地图整理。',
  },
  {
    slug: 'scam-check',
    name: '避坑查询',
    group: '图鉴与指南',
    description: '查询交易对象是否在骗子名单中，交易前先查一下更安心。',
  },
  {
    slug: 'nav',
    name: '常用导航',
    group: '图鉴与指南',
    description: '常用外部网站与工具的快捷导航合集。',
  },
]

export function getToolBySlug(slug: string) {
  return TOOLS.find((t) => t.slug === slug)
}
