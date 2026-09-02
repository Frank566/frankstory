import { createFileRoute, notFound } from '@tanstack/react-router'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { getToolBySlug } from '@/data/tools'

export const Route = createFileRoute('/tools/$slug')({
  loader: ({ params }) => {
    const tool = getToolBySlug(params.slug)
    if (!tool) throw notFound()
    return tool
  },
  component: ToolPage,
})

function ToolPage() {
  const tool = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-[#fbf8ef] dark:bg-emerald-950">
      <NavBar />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          {tool.group}
        </span>
        <h1 className="mt-2 text-3xl font-bold text-emerald-950 dark:text-white">
          {tool.name}
        </h1>
        <p className="mt-4 text-emerald-950/70 dark:text-white/70">
          {tool.description}
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-emerald-900/20 bg-white/60 p-10 text-center text-emerald-950/50 dark:border-white/20 dark:bg-white/5 dark:text-white/50">
          该工具正在建设中，敬请期待。
        </div>
      </main>
      <Footer />
    </div>
  )
}
