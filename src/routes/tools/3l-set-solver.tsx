import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Footer } from '@/components/Footer'
import { NavBar } from '@/components/NavBar'

export const Route = createFileRoute('/tools/3l-set-solver')({
  head: () => ({ meta: [{ title: '3L 套装求解器 | Frank Story' }] }),
  component: SetSolverPage,
})

// ---------- data ----------
const SLOTS = ['帽子', '上衣', '下装', '披风', '手套', '鞋子']

type StatKey =
  | 'dl'
  | 'wh'
  | 'reg'
  | 'atk'
  | 'mage'
  | 'pirate'
  | 'thief'
  | 'warrior'
  | 'archer'
  | 'crit'
type LineKey = StatKey | 'other'

const STATS: { k: StatKey; n: string; t: number }[] = [
  { k: 'dl', n: 'Dimensional Leap', t: 3 },
  { k: 'wh', n: 'White Hole', t: 3 },
  { k: 'reg', n: 'Registry', t: 3 },
  { k: 'atk', n: '攻击力 ATK', t: 3 },
  { k: 'mage', n: '法师', t: 1 },
  { k: 'pirate', n: '海盗', t: 1 },
  { k: 'thief', n: '飞侠', t: 1 },
  { k: 'warrior', n: '战士', t: 1 },
  { k: 'archer', n: '弓箭手', t: 1 },
  { k: 'crit', n: '暴击伤害', t: 1 },
]

const NAME: Record<LineKey, string> = { other: '其他' } as Record<LineKey, string>
const IDX: Partial<Record<LineKey, number>> = {}
const T: number[] = []
const R: number[] = []
const M: number[] = []
{
  let mult = 1
  STATS.forEach((s, i) => {
    NAME[s.k] = s.n
    IDX[s.k] = i
    T[i] = s.t
    R[i] = s.t + 1
    M[i] = mult
    mult *= R[i]
  })
}
const TOTAL = T.reduce((a, b) => a + b, 0) // 18

const COLOR: Record<LineKey, string> = {
  dl: '#7a5cf0',
  wh: '#2f9bd6',
  reg: '#1fa67a',
  atk: '#e0484d',
  crit: '#d6409f',
  mage: '#c98a1b',
  pirate: '#c98a1b',
  thief: '#c98a1b',
  warrior: '#c98a1b',
  archer: '#c98a1b',
  other: '#8590a3',
}

const GROUPS: LineKey[][] = [
  ['dl', 'wh', 'reg'],
  ['mage', 'pirate', 'thief', 'warrior', 'archer'],
  ['crit', 'atk', 'other'],
]

type Item = { id: number; lines: LineKey[] }

const noDupes = (lines: LineKey[]) => {
  const real = lines.filter((k) => k !== 'other')
  return new Set(real).size === real.length
}

// ---------- solver: DP over capped stat counts ----------
function addLines(st: number, lines: LineKey[]) {
  for (const k of lines) {
    const i = IDX[k]
    if (i === undefined) continue
    if (Math.floor(st / M[i]) % R[i] < T[i]) st += M[i]
  }
  return st
}
const digits = (st: number) => T.map((_, i) => Math.floor(st / M[i]) % R[i])
const score = (st: number) => digits(st).reduce((a, b) => a + b, 0)

type Layer = Map<number, { prev: number; item: Item | null; slot: number; ways: number }>

function runDP(items: Item[][], skip: number) {
  let cur: Map<number, { ways: number }> = new Map([[0, { ways: 1 }]])
  const layers: Layer[] = []
  SLOTS.forEach((_, s) => {
    if (s === skip) return
    const opts: (Item | null)[] = items[s].length ? items[s] : [null]
    const next: Layer = new Map()
    for (const [st, info] of cur)
      for (const it of opts) {
        const ns = it ? addLines(st, it.lines) : st
        const e = next.get(ns)
        if (e) e.ways += info.ways
        else next.set(ns, { prev: st, item: it, slot: s, ways: info.ways })
      }
    layers.push(next)
    cur = next
  })
  return layers
}

type SolveResult = {
  best: number
  counts: number[]
  picks: (Item | null)[]
  used: boolean[][]
  ways: number
  hunt: { slot: number; need: StatKey[] }[]
}

function solve(items: Item[][]): SolveResult {
  const layers = runDP(items, -1)
  const last = layers[layers.length - 1]
  let best = -1
  let bestSt = 0
  for (const st of last.keys()) {
    const sc = score(st)
    if (sc > best) {
      best = sc
      bestSt = st
    }
  }
  const ways = last.get(bestSt)!.ways
  const picks: (Item | null)[] = Array(SLOTS.length).fill(null)
  let st = bestSt
  for (let l = layers.length - 1; l >= 0; l--) {
    const e = layers[l].get(st)!
    picks[e.slot] = e.item
    st = e.prev
  }
  // which lines in the chosen set count toward the goal
  const run = T.map(() => 0)
  const used = picks.map((it) =>
    it
      ? it.lines.map((k) => {
          const i = IDX[k]
          if (i === undefined || run[i] >= T[i]) return false
          run[i]++
          return true
        })
      : [],
  )
  // one-piece-away options: for each slot, which 3 lines would finish the set
  const hunt: SolveResult['hunt'] = []
  if (best < TOTAL)
    SLOTS.forEach((_, s) => {
      const ls = runDP(items, s)
      const seen = new Set<string>()
      for (const st2 of ls[ls.length - 1].keys()) {
        if (score(st2) !== TOTAL - 3) continue
        const d = digits(st2)
        const need: StatKey[] = []
        d.forEach((c, i) => {
          for (let j = c; j < T[i]; j++) need.push(STATS[i].k)
        })
        if (!noDupes(need)) continue // a piece cannot roll the same line twice
        const key = need.join(',')
        if (!seen.has(key)) {
          seen.add(key)
          hunt.push({ slot: s, need })
        }
      }
    })
  return { best, counts: digits(bestSt), picks, used, ways, hunt }
}

// ---------- state ----------
const STORAGE_KEY = 'frankstory:3l-set-solver:v1'
const EXAMPLE: LineKey[][][] = [
  [
    ['dl', 'atk', 'mage'],
    ['atk', 'wh', 'other'],
  ],
  [
    ['wh', 'reg', 'crit'],
    ['dl', 'mage', 'crit'],
  ],
  [['reg', 'dl', 'pirate']],
  [
    ['atk', 'wh', 'thief'],
    ['thief', 'archer', 'dl'],
  ],
  [
    ['dl', 'wh', 'warrior'],
    ['crit', 'wh', 'reg'],
  ],
  [['atk', 'reg', 'archer']],
]
const VALID_KEYS = new Set<string>([...STATS.map((s) => s.k), 'other'])

let uid = 1
const mk = (lines: LineKey[]): Item => ({ id: uid++, lines })
const emptyItems = () => SLOTS.map(() => [] as Item[])

function loadItems(): { items: Item[][]; example: boolean } {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (raw && !raw.example && Array.isArray(raw.items) && raw.items.length === SLOTS.length) {
      return {
        items: raw.items.map((a: unknown) =>
          (Array.isArray(a) ? a : [])
            .filter(
              (l: unknown): l is LineKey[] =>
                Array.isArray(l) && l.length === 3 && l.every((k) => VALID_KEYS.has(k)),
            )
            .filter(noDupes)
            .map((l: LineKey[]) => mk(l)),
        ),
        example: false,
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { items: EXAMPLE.map((a) => a.map((l) => mk(l))), example: true }
}

// ---------- celebration when the set reaches 18/18 ----------
let audioCtx: AudioContext | null = null
function fanfare() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    audioCtx = audioCtx || new AC()
    const audio = audioCtx
    void audio.resume()
    const t0 = audio.currentTime + 0.02
    ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      const o = audio.createOscillator()
      const g = audio.createGain()
      const t = t0 + i * 0.11
      const len = i === 4 ? 0.9 : 0.25
      o.type = 'triangle'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + len)
      o.connect(g)
      g.connect(audio.destination)
      o.start(t)
      o.stop(t + len + 0.05)
    })
    // firework pops: short bursts of filtered noise
    const n = Math.floor(audio.sampleRate * 0.35)
    const buf = audio.createBuffer(1, n, audio.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3)
    ;[0.15, 0.55, 0.9, 1.3, 1.75].forEach((dt) => {
      const s = audio.createBufferSource()
      const f = audio.createBiquadFilter()
      const g = audio.createGain()
      s.buffer = buf
      f.type = 'lowpass'
      f.frequency.value = 900 + Math.random() * 1200
      g.gain.value = 0.25
      s.connect(f)
      f.connect(g)
      g.connect(audio.destination)
      s.start(t0 + dt)
    })
  } catch {
    // audio is optional
  }
}

function fireworks() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const c = document.createElement('canvas')
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100'
  document.body.appendChild(c)
  const dpr = window.devicePixelRatio || 1
  const W = innerWidth
  const H = innerHeight
  c.width = W * dpr
  c.height = H * dpr
  const x = c.getContext('2d')
  if (!x) {
    c.remove()
    return
  }
  x.scale(dpr, dpr)
  const cols = ['#7a5cf0', '#2f9bd6', '#1fa67a', '#e0484d', '#f0a92b', '#d6409f', '#ff8a4c']
  const BURSTS = 9
  type P = { x: number; y: number; vx: number; vy: number; life: number; decay: number; col: string }
  let parts: P[] = []
  let bursts = 0
  let nextAt = 0
  let last = performance.now()
  const start = last
  function burst() {
    const bx = W * (0.12 + Math.random() * 0.76)
    const by = H * (0.12 + Math.random() * 0.45)
    const col = cols[Math.floor(Math.random() * cols.length)]
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2
      const v = 60 + Math.random() * 300
      parts.push({ x: bx, y: by, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: 0.55 + Math.random() * 0.5, col })
    }
  }
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (bursts < BURSTS && now - start >= nextAt) {
      burst()
      bursts++
      nextAt = now - start + 220 + Math.random() * 220
    }
    x!.clearRect(0, 0, W, H)
    parts = parts.filter((p) => p.life > 0)
    for (const p of parts) {
      p.vx *= 0.985
      p.vy = p.vy * 0.985 + 160 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= p.decay * dt
      x!.globalAlpha = Math.max(0, p.life)
      x!.fillStyle = p.col
      x!.beginPath()
      x!.arc(p.x, p.y, 2.3, 0, Math.PI * 2)
      x!.fill()
    }
    if (bursts < BURSTS || parts.length) requestAnimationFrame(frame)
    else c.remove()
  }
  requestAnimationFrame(frame)
}

// ---------- UI pieces ----------
const ICON_PATHS: Partial<Record<LineKey, ReactNode>> = {
  mage: (
    <>
      <path d="M3 13 10 6" />
      <path d="M12 1.5v5M9.5 4h5" />
    </>
  ),
  pirate: (
    <>
      <circle cx="8" cy="3" r="1.5" />
      <path d="M8 4.5V14M5 7.5h6M3 10c0 2.5 2 4 5 4s5-1.5 5-4" />
    </>
  ),
  thief: <path d="M8 1.5 9.5 6.5 14.5 8 9.5 9.5 8 14.5 6.5 9.5 1.5 8 6.5 6.5Z" fill="currentColor" />,
  warrior: <path d="M13.5 2.5 6 10M4 8l4 4M5 11l-2.5 2.5" />,
  archer: <path d="M4 2q9 6 0 12M4 2v12M2 8h11M11 6l2 2-2 2" />,
}

function Mark({ k }: { k: LineKey }) {
  const c = COLOR[k]
  const icon = ICON_PATHS[k]
  if (icon)
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-3.5 w-3.5 flex-none"
        style={{ color: c }}
      >
        {icon}
      </svg>
    )
  return <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: c }} />
}

const chipStyle = (k: LineKey) => ({
  background: `color-mix(in oklab, ${COLOR[k]} 16%, transparent)`,
  borderColor: `color-mix(in oklab, ${COLOR[k]} 50%, transparent)`,
})

function Chip({ k, wasted = false }: { k: LineKey; wasted?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[12.5px] font-medium text-emerald-950 dark:text-white ${
        wasted ? 'line-through opacity-50' : ''
      }`}
      style={chipStyle(k)}
    >
      <Mark k={k} />
      {NAME[k]}
    </span>
  )
}

function EmptyChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-md border border-dashed border-emerald-900/20 px-2 py-0.5 text-[12.5px] text-emerald-950/50 dark:border-white/20 dark:text-white/50">
      {label}
    </span>
  )
}

const panel =
  'flex min-w-0 flex-col gap-4 rounded-3xl border border-emerald-900/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5'
const label = 'text-[11px] font-semibold uppercase tracking-wider text-emerald-950/50 dark:text-white/50'
const ghost =
  'rounded-lg border border-emerald-900/15 px-2.5 py-1 text-xs text-emerald-950/60 transition hover:border-emerald-900/40 hover:text-emerald-950 dark:border-white/15 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white'
const muted = 'text-emerald-950/55 dark:text-white/55'

// ---------- page ----------
function SetSolverPage() {
  const [items, setItems] = useState<Item[][]>(emptyItems)
  const [active, setActive] = useState(0)
  const [pending, setPending] = useState<LineKey[]>([])
  const [example, setExample] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const wasDone = useRef<boolean | null>(null)

  useEffect(() => {
    const data = loadItems()
    setItems(data.items)
    setExample(data.example)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items: items.map((a) => a.map((i) => i.lines)), example }),
      )
    } catch {
      // storage unavailable
    }
  }, [items, example, loaded])

  const res = useMemo(() => solve(items), [items])
  const done = res.best === TOTAL

  useEffect(() => {
    if (!loaded) return
    if (wasDone.current === false && done) {
      fireworks()
      fanfare()
    }
    wasDone.current = done
  }, [done, loaded])

  const total = items.reduce((a, b) => a + b.length, 0)
  const missing: StatKey[] = []
  res.counts.forEach((c, i) => {
    for (let j = c; j < T[i]; j++) missing.push(STATS[i].k)
  })

  const pickSlot = (i: number) => {
    setConfirmClear(false)
    setActive(i)
    setPending([])
  }
  const pickStat = (k: LineKey) => {
    setConfirmClear(false)
    if (k !== 'other' && pending.includes(k)) return
    const next = [...pending, k]
    if (next.length === 3) {
      setItems((cur) => cur.map((a, s) => (s === active ? [...a, mk(next)] : a)))
      setPending([])
      setExample(false)
    } else setPending(next)
  }
  const undo = () => {
    setConfirmClear(false)
    setPending((p) => p.slice(0, -1))
  }
  const del = (s: number, id: number) => {
    setConfirmClear(false)
    setItems((cur) => cur.map((a, i) => (i === s ? a.filter((it) => it.id !== id) : a)))
  }
  const clearAll = () => {
    setItems(emptyItems())
    setPending([])
    setExample(false)
    setConfirmClear(false)
  }

  const short = TOTAL - res.best
  const shownHunt = res.hunt.slice(0, 8)

  return (
    <div className="min-h-screen bg-[#fbf8ef] dark:bg-emerald-950">
      <NavBar />
      <main className="mx-auto max-w-6xl px-5 py-16 text-sm text-emerald-950 dark:text-white">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          计算器
        </span>
        <h1 className="mt-2 text-3xl font-bold">3L 套装求解器</h1>
        <p className="mt-3 max-w-3xl leading-6 text-emerald-950/70 dark:text-white/70">
          录入你拥有的每一件三排属性装备，求解器会为每个部位挑选一件，凑齐 3 条 Dimensional Leap、3 条 White
          Hole、3 条 Registry、3 条攻击力、五大职业（法师、海盗、飞侠、战士、弓箭手）各 1 条，以及 1 条暴击伤害。数据仅保存在当前浏览器。
        </p>

        {example && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-emerald-900/20 bg-emerald-900/5 px-4 py-3 dark:border-white/20 dark:bg-white/5">
            <span>
              <b>已载入示例装备。</b>这些装备是虚构的，方便你了解使用方式。
            </span>
            <button type="button" className={ghost} onClick={clearAll}>
              清空并录入我的装备
            </button>
          </div>
        )}

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-5">
            {/* add a piece */}
            <section className={panel}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold">添加装备</h2>
                <span className={muted}>先选部位，再依次点选 3 条不同属性</span>
              </div>
              <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                <div className="grid grid-flow-col grid-cols-2 grid-rows-3 gap-1.5">
                  {SLOTS.map((s, i) => {
                    const on = i === active
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => pickSlot(i)}
                        className={`flex justify-between gap-3 rounded-lg border px-3 py-1.5 text-left font-semibold transition ${
                          on
                            ? 'border-emerald-700 bg-emerald-700 text-white'
                            : 'border-emerald-900/15 bg-emerald-900/5 hover:border-emerald-700/50 dark:border-white/15 dark:bg-white/5'
                        }`}
                      >
                        {s}
                        <span className={`font-medium tabular-nums ${on ? 'opacity-80' : muted}`}>
                          {items[i].length}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="grid grid-cols-[repeat(3,auto)] items-start gap-x-3 gap-y-1.5">
                  {GROUPS.map((g, gi) => (
                    <div key={gi} className="flex min-w-0 flex-col gap-1.5">
                      {g.map((k) => {
                        const disabled = k !== 'other' && pending.includes(k)
                        return (
                          <button
                            key={k}
                            type="button"
                            disabled={disabled}
                            onClick={() => pickStat(k)}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-2 text-[13.5px] font-medium transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                            style={chipStyle(k)}
                          >
                            <Mark k={k} />
                            {NAME[k]}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={label}>新{SLOTS[active]}</span>
                {[0, 1, 2].map((i) =>
                  pending[i] ? <Chip key={i} k={pending[i]} /> : <EmptyChip key={i} label={`第 ${i + 1} 排`} />,
                )}
                {pending.length > 0 && (
                  <button type="button" className={ghost} onClick={undo}>
                    撤销一排
                  </button>
                )}
              </div>
            </section>

            {/* inventory */}
            <section className={panel}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold">
                  我的 3L 装备 <span className={`font-medium ${muted}`}>（{total}）</span>
                </h2>
                {total > 0 && (
                  <button
                    type="button"
                    className={`${ghost} ${confirmClear ? '!border-red-500 !text-red-500' : ''}`}
                    onClick={() => (confirmClear ? clearAll() : setConfirmClear(true))}
                  >
                    {confirmClear ? '再点一次以清空全部' : '清空全部'}
                  </button>
                )}
              </div>
              <div className="grid gap-x-5 gap-y-4 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-3">
                {SLOTS.map((s, si) => (
                  <div key={s} className="flex min-w-0 flex-col gap-2">
                    <div className="flex items-baseline justify-between border-b border-emerald-900/10 pb-1.5 dark:border-white/10">
                      <h3 className="font-bold">{s}</h3>
                      <span className={muted}>{items[si].length} 件</span>
                    </div>
                    {items[si].length ? (
                      items[si].map((it, n) => {
                        const picked = res.picks[si] === it
                        return (
                          <div
                            key={it.id}
                            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                              picked
                                ? 'border-emerald-600 bg-emerald-600/10'
                                : 'border-transparent'
                            }`}
                          >
                            <span
                              className={`w-6 flex-none font-semibold tabular-nums ${
                                picked ? 'text-emerald-600 dark:text-emerald-400' : muted
                              }`}
                            >
                              #{n + 1}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                              {it.lines.map((k, j) => (
                                <Chip key={j} k={k} />
                              ))}
                            </span>
                            <button
                              type="button"
                              aria-label={`删除${s} #${n + 1}`}
                              onClick={() => del(si, it.id)}
                              className={`flex-none rounded px-1.5 py-1 text-base leading-none hover:text-red-500 ${muted}`}
                            >
                              ×
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className={`px-2 py-1.5 ${muted}`}>暂无 3L {s}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* result */}
          <section className={`${panel} lg:sticky lg:top-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">最佳组合</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  done
                    ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                }`}
              >
                {done ? '已凑齐' : `还差 ${short} 排`}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="text-4xl font-bold leading-none tabular-nums">{res.best}</span>
              <span className={muted}>
                / {TOTAL} 排{done ? `，共 ${res.ways} 种达成组合` : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {STATS.map((s, i) => {
                const miss = res.counts[i] < s.t
                return (
                  <div key={s.k} className="flex items-center justify-between gap-2">
                    <span className={miss ? 'font-semibold text-amber-700 dark:text-amber-400' : ''}>{s.n}</span>
                    <span className="flex gap-[3px]" title={`${res.counts[i]} / ${s.t}`}>
                      {Array.from({ length: s.t }, (_, j) => (
                        <span
                          key={j}
                          className="h-2.5 w-2.5 rounded-[2px] border-[1.5px]"
                          style={{
                            borderColor: COLOR[s.k],
                            background: j < res.counts[i] ? COLOR[s.k] : 'transparent',
                          }}
                        />
                      ))}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>装备这些</span>
              {SLOTS.map((s, si) => {
                const it = res.picks[si]
                return (
                  <div key={s} className="flex items-center gap-2 py-1">
                    <span className="w-12 flex-none font-semibold">{s}</span>
                    {it ? (
                      <>
                        <span className={`flex-none font-semibold tabular-nums ${muted}`}>
                          #{items[si].indexOf(it) + 1}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                          {it.lines.map((k, j) => (
                            <Chip key={j} k={k} wasted={!res.used[si][j]} />
                          ))}
                        </span>
                      </>
                    ) : (
                      <span className={muted}>暂无</span>
                    )}
                  </div>
                )
              })}
              {res.used.some((u) => u.includes(false)) && (
                <span className={muted}>划线的属性不计入目标。</span>
              )}
            </div>
            {!done && (
              <div className="flex flex-col gap-2 border-t border-emerald-900/10 pt-3 dark:border-white/10">
                {res.hunt.length ? (
                  <>
                    <span className={label}>再掉一件即可完成</span>
                    {shownHunt.map((h, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-1">
                        <b className="w-12 flex-none">{SLOTS[h.slot]}</b>
                        {h.need.map((k, j) => (
                          <Chip key={j} k={k} />
                        ))}
                      </div>
                    ))}
                    {res.hunt.length > shownHunt.length && (
                      <span className={muted}>以及另外 {res.hunt.length - shownHunt.length} 种选择</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className={label}>仍然缺少</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {missing.map((k, j) => (
                        <Chip key={j} k={k} />
                      ))}
                    </div>
                    <span className={muted}>距离完成还差不止一件，继续收集 3L 装备吧。</span>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
