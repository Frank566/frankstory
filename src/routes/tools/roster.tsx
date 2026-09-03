import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Footer } from '@/components/Footer'
import { NavBar } from '@/components/NavBar'
import { lookupCharacter, type CharacterLookupResult } from '@/server/character.functions'

export const Route = createFileRoute('/tools/roster')({
  component: RosterPage,
})

const STORAGE_KEY = 'frankstory:roster:v1'

type RosterEntry = {
  id: string
  characterName: string
  level: number | null
  jobName: string
  rank: number | null
  worldID: number | null
  imageUrl: string
  note: string
  source: 'lookup' | 'custom'
  updatedAt: string
}

type Notice = {
  tone: 'error' | 'success' | 'info'
  text: string
}

type CustomFormState = {
  characterName: string
  level: string
  jobName: string
  note: string
  imageUrl: string
}

const emptyCustomForm: CustomFormState = {
  characterName: '',
  level: '',
  jobName: '',
  note: '',
  imageUrl: '',
}

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}

function sortEntries(entries: RosterEntry[]) {
  return [...entries].sort((left, right) => {
    const leftLevel = left.level ?? -1
    const rightLevel = right.level ?? -1
    if (leftLevel !== rightLevel) return rightLevel - leftLevel
    return left.characterName.localeCompare(right.characterName, 'zh-CN')
  })
}

function loadRoster(): RosterEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return sortEntries(
      parsed.filter((entry): entry is RosterEntry => {
        return Boolean(entry && typeof entry === 'object' && typeof entry.characterName === 'string')
      }),
    )
  } catch {
    return []
  }
}

function saveRoster(entries: RosterEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function makeEntryFromLookup(result: CharacterLookupResult, note = ''): RosterEntry {
  return {
    id: crypto.randomUUID(),
    characterName: result.characterName,
    level: result.level,
    jobName: result.jobName,
    rank: result.rank,
    worldID: result.worldID,
    imageUrl: result.imageUrl,
    note,
    source: 'lookup',
    updatedAt: new Date().toISOString(),
  }
}

function mergeEntries(current: RosterEntry[], incoming: RosterEntry[]) {
  const byName = new Map(current.map((entry) => [normalizeName(entry.characterName), entry]))

  for (const next of incoming) {
    const key = normalizeName(next.characterName)
    const existing = byName.get(key)
    byName.set(
      key,
      existing
        ? {
            ...existing,
            ...next,
            id: existing.id,
            note: next.note || existing.note,
          }
        : next,
    )
  }

  return sortEntries([...byName.values()])
}

function extractCandidateNames(raw: string) {
  const candidates = new Map<string, string>()
  const parts = raw
    .replace(/[|,:;，。·•“”"'`~!@#$%^&*()_+=?<>\[\]{}\\/]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

  for (const token of parts) {
    if (!/^[A-Za-z0-9-]{2,20}$/.test(token)) continue
    if (/^lv\d+$/i.test(token)) continue
    if (/^rank$/i.test(token)) continue
    if (/^level$/i.test(token)) continue
    if (/^job$/i.test(token)) continue
    if (/^\d+$/.test(token)) continue
    const normalized = normalizeName(token)
    if (!candidates.has(normalized)) {
      candidates.set(normalized, token)
    }
  }

  return [...candidates.values()]
}

function RosterPage() {
  const lookup = useServerFn(lookupCharacter)
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [adding, setAdding] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [customForm, setCustomForm] = useState<CustomFormState>(emptyCustomForm)
  const [ocrText, setOcrText] = useState('')
  const [ocrProgress, setOcrProgress] = useState<number | null>(null)
  const [ocrRunning, setOcrRunning] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    setRoster(loadRoster())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveRoster(roster)
  }, [hydrated, roster])

  const lookupCount = useMemo(
    () => roster.filter((entry) => entry.source === 'lookup').length,
    [roster],
  )

  const customCount = roster.length - lookupCount

  const upsertEntry = (entry: RosterEntry) => {
    setRoster((current) => mergeEntries(current, [entry]))
  }

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed) return

    const exists = roster.some((entry) => normalizeName(entry.characterName) === normalizeName(trimmed))
    if (exists) {
      setNotice({ tone: 'info', text: '该角色已经在名单中，可使用“刷新全部”同步最新资料。' })
      return
    }

    setAdding(true)
    setNotice(null)
    try {
      const result = await lookup({ data: { name: trimmed } })
      if (!result) {
        setNotice({ tone: 'error', text: '未找到该角色，请检查名称是否正确或改用自定义添加。' })
        return
      }

      upsertEntry(makeEntryFromLookup(result))
      setNameInput('')
      setNotice({ tone: 'success', text: `已添加角色 ${result.characterName}。` })
    } catch {
      setNotice({ tone: 'error', text: '添加失败，角色查询服务暂时不可用。' })
    } finally {
      setAdding(false)
    }
  }

  const handleCustomSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const characterName = customForm.characterName.trim()
    if (!characterName) {
      setNotice({ tone: 'error', text: '请先填写角色名。' })
      return
    }

    const levelText = customForm.level.trim()
    const parsedLevel = levelText === '' ? null : Number(levelText)
    if (parsedLevel !== null && (!Number.isFinite(parsedLevel) || parsedLevel < 1)) {
      setNotice({ tone: 'error', text: '等级需要是大于 0 的数字。' })
      return
    }

    upsertEntry({
      id: crypto.randomUUID(),
      characterName,
      level: parsedLevel,
      jobName: customForm.jobName.trim(),
      rank: null,
      worldID: null,
      imageUrl: customForm.imageUrl.trim(),
      note: customForm.note.trim(),
      source: 'custom',
      updatedAt: new Date().toISOString(),
    })
    setCustomForm(emptyCustomForm)
    setShowCustomForm(false)
    setNotice({ tone: 'success', text: `已加入自定义角色 ${characterName}。` })
  }

  const handleRefreshAll = async () => {
    const lookupEntries = roster.filter((entry) => entry.source === 'lookup')
    if (lookupEntries.length === 0) {
      setNotice({ tone: 'info', text: '当前没有可刷新的自动角色资料。' })
      return
    }

    setRefreshing(true)
    setNotice(null)
    const refreshed: RosterEntry[] = []
    let failedCount = 0

    for (const entry of lookupEntries) {
      try {
        const result = await lookup({ data: { name: entry.characterName } })
        if (!result) {
          failedCount += 1
          continue
        }
        refreshed.push({
          ...makeEntryFromLookup(result, entry.note),
          id: entry.id,
        })
      } catch {
        failedCount += 1
      }
    }

    if (refreshed.length > 0) {
      setRoster((current) => {
        const others = current.filter((entry) => entry.source !== 'lookup')
        return sortEntries([...others, ...refreshed])
      })
    }

    setRefreshing(false)
    setNotice({
      tone: failedCount > 0 ? 'info' : 'success',
      text:
        failedCount > 0
          ? `刷新完成，成功 ${refreshed.length} 个，失败 ${failedCount} 个。`
          : `已刷新 ${refreshed.length} 个角色。`,
    })
  }

  const handleDelete = (id: string) => {
    setRoster((current) => current.filter((entry) => entry.id !== id))
  }

  const handleNoteChange = (id: string, note: string) => {
    setRoster((current) =>
      current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              note,
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    )
  }

  const handleOcrFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setOcrRunning(true)
    setOcrProgress(0)
    setNotice(null)

    try {
      const { recognize } = await import('tesseract.js')
      const result = await recognize(file, 'eng', {
        logger: (message) => {
          if (message.status === 'recognizing text' && typeof message.progress === 'number') {
            setOcrProgress(Math.round(message.progress * 100))
          }
        },
      })
      setOcrText(result.data.text.trim())
      setNotice({ tone: 'success', text: '截图识别完成，请确认文本后导入。' })
    } catch {
      setNotice({ tone: 'error', text: '截图识别失败，请换一张更清晰的截图或直接粘贴 OCR 文本。' })
    } finally {
      setOcrRunning(false)
      setOcrProgress(null)
      event.target.value = ''
    }
  }

  const handleImportText = async () => {
    const names = extractCandidateNames(ocrText)
    if (names.length === 0) {
      setNotice({ tone: 'error', text: '没有识别出可用的角色名，请检查截图或手动整理文本。' })
      return
    }

    setImporting(true)
    setNotice(null)
    const nextEntries: RosterEntry[] = []
    let duplicateCount = 0
    let failedCount = 0

    for (const name of names) {
      if (
        roster.some((entry) => normalizeName(entry.characterName) === normalizeName(name)) ||
        nextEntries.some((entry) => normalizeName(entry.characterName) === normalizeName(name))
      ) {
        duplicateCount += 1
        continue
      }

      try {
        const result = await lookup({ data: { name } })
        if (!result) {
          failedCount += 1
          continue
        }
        nextEntries.push(makeEntryFromLookup(result))
      } catch {
        failedCount += 1
      }
    }

    if (nextEntries.length > 0) {
      setRoster((current) => mergeEntries(current, nextEntries))
    }

    setImporting(false)
    setNotice({
      tone: nextEntries.length > 0 ? 'success' : 'info',
      text: `导入完成，新增 ${nextEntries.length} 个，重复 ${duplicateCount} 个，未匹配 ${failedCount} 个。`,
    })
  }

  return (
    <div className="min-h-screen bg-[#fbf8ef] dark:bg-emerald-950">
      <NavBar />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              追踪工具
            </span>
            <h1 className="mt-2 text-3xl font-bold text-emerald-950 dark:text-white">角色名单</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-950/70 dark:text-white/70">
              管理你在冒险岛 GMS 区的角色名单。支持按角色名自动添加、截图 OCR 导入、自定义补录与本地浏览器持久化。
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm text-emerald-950/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-700/10 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
                美服
              </span>
              <span>共 {roster.length} 个角色</span>
            </div>
            <p className="mt-2 text-xs text-emerald-950/50 dark:text-white/50">
              自动角色 {lookupCount} 个，自定义角色 {customCount} 个，数据仅保存在当前浏览器。
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-emerald-900/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <form onSubmit={handleAdd} className="flex flex-1 flex-col gap-3 sm:flex-row">
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="输入角色名，如 Keishmer"
                maxLength={20}
                className="flex-1 rounded-2xl border border-emerald-900/15 bg-[#fbf8ef] px-4 py-3 text-sm text-emerald-950 outline-none transition focus:border-emerald-600 dark:border-white/15 dark:bg-emerald-950/70 dark:text-white"
              />
              <button
                type="submit"
                disabled={adding || !nameInput.trim()}
                className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? '添加中…' : '添加'}
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowImportPanel((open) => !open)}
                className="rounded-2xl border border-emerald-900/15 px-4 py-3 text-sm font-medium text-emerald-950 transition hover:bg-emerald-900/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                截图导入
              </button>
              <button
                type="button"
                onClick={() => setShowCustomForm((open) => !open)}
                className="rounded-2xl border border-emerald-900/15 px-4 py-3 text-sm font-medium text-emerald-950 transition hover:bg-emerald-900/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                自定义添加
              </button>
              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={refreshing}
                className="rounded-2xl border border-emerald-900/15 px-4 py-3 text-sm font-medium text-emerald-950 transition hover:bg-emerald-900/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                {refreshing ? '刷新中…' : '刷新全部'}
              </button>
            </div>
          </div>

          {notice && (
            <div
              className={[
                'mt-4 rounded-2xl border px-4 py-3 text-sm',
                notice.tone === 'error'
                  ? 'border-red-400/30 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/5 dark:text-red-300'
                  : notice.tone === 'success'
                    ? 'border-emerald-400/30 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/5 dark:text-emerald-300'
                    : 'border-amber-400/30 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-300',
              ].join(' ')}
            >
              {notice.text}
            </div>
          )}

          {showImportPanel && (
            <div className="mt-5 grid gap-4 rounded-2xl border border-dashed border-emerald-900/15 bg-[#fbf8ef] p-4 dark:border-white/15 dark:bg-emerald-950/50 lg:grid-cols-[1.2fr,1fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800">
                    选择截图识别
                    <input type="file" accept="image/*" onChange={handleOcrFile} className="hidden" />
                  </label>
                  <span className="text-xs text-emerald-950/60 dark:text-white/60">
                    支持直接上传截图，也支持下方粘贴 OCR 文本。
                  </span>
                </div>
                {ocrRunning && (
                  <p className="mt-3 text-sm text-emerald-950/70 dark:text-white/70">
                    识别中{typeof ocrProgress === 'number' ? ` ${ocrProgress}%` : '…'}
                  </p>
                )}
                <textarea
                  value={ocrText}
                  onChange={(event) => setOcrText(event.target.value)}
                  placeholder="可直接粘贴截图 OCR 结果，系统会尽量提取角色名并批量添加。"
                  rows={8}
                  className="mt-4 w-full rounded-2xl border border-emerald-900/15 bg-white px-4 py-3 text-sm text-emerald-950 outline-none transition focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-900/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div>
                  <h2 className="text-base font-semibold text-emerald-950 dark:text-white">导入说明</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-950/70 dark:text-white/70">
                    <li>建议使用清晰的角色列表截图，英文角色名识别效果最好。</li>
                    <li>系统会过滤明显无效的词，并逐个到 GMS 排行榜校验后加入名单。</li>
                    <li>已存在的角色会自动跳过，自定义角色不会被覆盖。</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={handleImportText}
                  disabled={importing || ocrRunning || !ocrText.trim()}
                  className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing ? '导入中…' : '导入识别结果'}
                </button>
              </div>
            </div>
          )}

          {showCustomForm && (
            <form onSubmit={handleCustomSubmit} className="mt-5 grid gap-3 rounded-2xl border border-dashed border-emerald-900/15 bg-[#fbf8ef] p-4 dark:border-white/15 dark:bg-emerald-950/50 md:grid-cols-2">
              <input
                value={customForm.characterName}
                onChange={(event) => setCustomForm((current) => ({ ...current, characterName: event.target.value }))}
                placeholder="角色名"
                className="rounded-2xl border border-emerald-900/15 bg-white px-4 py-3 text-sm text-emerald-950 outline-none focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
              <input
                value={customForm.level}
                onChange={(event) => setCustomForm((current) => ({ ...current, level: event.target.value }))}
                placeholder="等级，可留空"
                inputMode="numeric"
                className="rounded-2xl border border-emerald-900/15 bg-white px-4 py-3 text-sm text-emerald-950 outline-none focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
              <input
                value={customForm.jobName}
                onChange={(event) => setCustomForm((current) => ({ ...current, jobName: event.target.value }))}
                placeholder="职业，可留空"
                className="rounded-2xl border border-emerald-900/15 bg-white px-4 py-3 text-sm text-emerald-950 outline-none focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
              <input
                value={customForm.imageUrl}
                onChange={(event) => setCustomForm((current) => ({ ...current, imageUrl: event.target.value }))}
                placeholder="头像图片链接，可留空"
                className="rounded-2xl border border-emerald-900/15 bg-white px-4 py-3 text-sm text-emerald-950 outline-none focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
              <textarea
                value={customForm.note}
                onChange={(event) => setCustomForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="备注"
                rows={4}
                className="md:col-span-2 rounded-2xl border border-emerald-900/15 bg-white px-4 py-3 text-sm text-emerald-950 outline-none focus:border-emerald-600 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomForm(emptyCustomForm)
                    setShowCustomForm(false)
                  }}
                  className="rounded-2xl border border-emerald-900/15 px-4 py-3 text-sm font-medium text-emerald-950 dark:border-white/15 dark:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  保存角色
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="mt-8">
          {hydrated && roster.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-emerald-900/15 bg-white/70 px-6 py-14 text-center text-emerald-950/55 dark:border-white/15 dark:bg-white/5 dark:text-white/55">
              还没有角色，输入角色名添加第一个吧！
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {roster.map((entry) => (
                <article key={entry.id} className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#fbf8ef] dark:bg-emerald-950/70">
                        {entry.imageUrl ? (
                          <img src={entry.imageUrl} alt={entry.characterName} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                            {entry.characterName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-bold text-emerald-950 dark:text-white">
                            {entry.characterName}
                          </h2>
                          <span className="rounded-full bg-emerald-700/10 px-2 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
                            {entry.source === 'lookup' ? '自动' : '自定义'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-emerald-950/70 dark:text-white/70">
                          {entry.jobName || '职业未填写'}
                          {entry.level ? ` · Lv.${entry.level}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-emerald-950/50 dark:text-white/50">
                          {entry.rank ? `周排行榜第 ${entry.rank.toLocaleString()} 名` : '未记录排行榜信息'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="rounded-xl border border-emerald-900/10 px-3 py-1.5 text-xs font-medium text-emerald-950/70 transition hover:bg-emerald-900/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
                    >
                      删除
                    </button>
                  </div>

                  <textarea
                    value={entry.note}
                    onChange={(event) => handleNoteChange(entry.id, event.target.value)}
                    placeholder="备注：例如主号、河蛋、周常分工、装备计划等"
                    rows={4}
                    className="mt-4 w-full rounded-2xl border border-emerald-900/10 bg-[#fbf8ef] px-4 py-3 text-sm text-emerald-950 outline-none transition focus:border-emerald-600 dark:border-white/10 dark:bg-emerald-950/60 dark:text-white"
                  />
                  <p className="mt-3 text-xs text-emerald-950/45 dark:text-white/45">
                    最近更新 {new Date(entry.updatedAt).toLocaleString('zh-CN')}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}