import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { lookupCharacter, type CharacterLookupResult } from '@/server/character.functions'

export const Route = createFileRoute('/tools/character-lookup')({
  component: CharacterLookupPage,
})

type Status = 'idle' | 'loading' | 'error' | 'notfound'

function CharacterLookupPage() {
  const lookup = useServerFn(lookupCharacter)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<CharacterLookupResult | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setStatus('loading')
    setResult(null)
    try {
      const data = await lookup({ data: { name: trimmed } })
      setResult(data)
      setStatus(data ? 'idle' : 'notfound')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf8ef] dark:bg-emerald-950">
      <NavBar />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          追踪工具
        </span>
        <h1 className="mt-2 text-3xl font-bold text-emerald-950 dark:text-white">角色查询</h1>
        <p className="mt-4 text-emerald-950/70 dark:text-white/70">
          输入 GMS 区角色名，查询该角色在 Nexon 官方排行榜中的等级、职业与排名。仅收录已上榜的角色，数据可能存在延迟。
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="输入角色名，如 Keishmer"
            maxLength={20}
            className="flex-1 rounded-xl border border-emerald-900/15 bg-white px-4 py-2.5 text-sm text-emerald-950 outline-none focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !name.trim()}
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? '查询中…' : '查询'}
          </button>
        </form>

        <div className="mt-8">
          {status === 'error' && (
            <p className="rounded-2xl border border-red-400/40 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/5 dark:text-red-300">
              查询失败，请稍后再试。
            </p>
          )}
          {status === 'notfound' && (
            <p className="rounded-2xl border border-dashed border-emerald-900/20 bg-white/60 p-10 text-center text-emerald-950/50 dark:border-white/20 dark:bg-white/5 dark:text-white/50">
              未找到该角色，请检查名称是否正确，或该角色暂未上榜。
            </p>
          )}
          {result && (
            <div className="flex items-center gap-5 rounded-2xl border border-emerald-900/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
              <img
                src={result.imageUrl}
                alt={result.characterName}
                className="h-20 w-20 rounded-xl bg-emerald-700/5 object-contain"
              />
              <div>
                <p className="text-lg font-bold text-emerald-950 dark:text-white">
                  {result.characterName}
                </p>
                <p className="mt-1 text-sm text-emerald-950/70 dark:text-white/70">
                  {result.jobName} · Lv.{result.level}
                </p>
                <p className="mt-1 text-sm text-emerald-950/50 dark:text-white/50">
                  周排行榜第 {result.rank.toLocaleString()} 名
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
