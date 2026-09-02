import { createFileRoute, Link } from '@tanstack/react-router'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { TOOLS } from '@/data/tools'

export const Route = createFileRoute('/')({
  component: Home,
})

const quickLinks = TOOLS.filter((t) =>
  ['roster', 'character-lookup', 'boss', 'schedule', 'liberation', 'fragment'].includes(t.slug),
)

const updates = [
  {
    date: '2026-08-20',
    title: '新增时间看板每周提醒',
    detail: '时间看板现在支持自定义每周重置提醒，避免错过限时任务。',
  },
  {
    date: '2026-08-05',
    title: '小核进度计算器上线',
    detail: '新增小核（内在能力）养成进度计算，自动汇总所需材料。',
  },
  {
    date: '2026-07-22',
    title: '角色名单支持备注排序',
    detail: '角色名单新增按备注、职业排序功能，管理多角色更方便。',
  },
  {
    date: '2026-07-10',
    title: '修复 Boss 追踪重置时间显示错误',
    detail: '修复了部分时区下 Boss 每周重置倒计时显示不准确的问题。',
  },
]

function Home() {
  return (
    <div className="min-h-screen bg-[#fbf8ef] dark:bg-emerald-950">
      <NavBar />

      <section className="mx-auto max-w-7xl px-5 pt-16 pb-14 text-center">
        <span className="inline-flex items-center rounded-full border border-emerald-700/30 bg-emerald-700/10 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
          冒险岛 GMS 区 · 国人玩家工具站
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight text-emerald-950 sm:text-5xl dark:text-white">
          玩枫谷
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-emerald-950/70 dark:text-white/70">
          专为冒险岛（MapleStory）GMS 区国人玩家打造的工具网站，提供角色管理、进度追踪等实用工具。
          所有数据保存在本地浏览器中，无需注册登录。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/tools/$slug"
            params={{ slug: 'roster' }}
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            开始使用角色名单
          </Link>
          <Link
            to="/tools/$slug"
            params={{ slug: 'boss' }}
            className="rounded-xl border border-emerald-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-900/5 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            查看 Boss 追踪
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {quickLinks.map((tool) => (
            <Link
              key={tool.slug}
              to="/tools/$slug"
              params={{ slug: tool.slug }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-900/10 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700/10 text-lg font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                {tool.name.slice(0, 1)}
              </span>
              <span className="text-sm font-medium text-emerald-950 dark:text-white">
                {tool.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16">
        <h2 className="text-xl font-bold text-emerald-950 dark:text-white">最近更新</h2>
        <div className="mt-6 space-y-6 border-l border-emerald-900/10 pl-6 dark:border-white/10">
          {updates.map((update) => (
            <div key={update.date} className="relative">
              <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-700 dark:bg-emerald-400" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {update.date}
              </p>
              <p className="mt-1 font-semibold text-emerald-950 dark:text-white">
                {update.title}
              </p>
              <p className="mt-1 text-sm text-emerald-950/60 dark:text-white/60">
                {update.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16">
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-8 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-bold text-emerald-950 dark:text-white">关于本站</h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-950/70 dark:text-white/70">
            玩枫谷是一个专为冒险岛（MapleStory）GMS 区国人玩家打造的工具网站，提供角色管理、进度追踪等实用工具。
            我们重视隐私，所有数据保存在本地浏览器中，不会上传到任何服务器。
          </p>
          <p className="mt-3 text-sm leading-relaxed text-emerald-950/70 dark:text-white/70">
            如果你有功能建议或发现问题，欢迎加入 QQ 群与我们反馈：
            <span className="font-semibold text-emerald-800 dark:text-emerald-300"> 123456789</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-20">
        <div className="rounded-2xl border border-amber-400/40 bg-amber-50 p-8 dark:border-amber-400/20 dark:bg-amber-400/5">
          <h2 className="text-xl font-bold text-amber-900 dark:text-amber-300">家族招募</h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-900/80 dark:text-amber-200/80">
            [NERV] 家族正在 GMS Kronos(R1) 区招募新成员，欢迎休闲、活跃的冒险家加入我们，一起打 Boss、刷远征！
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
