import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { TOOLS } from '@/data/tools'
import { ThemeToggle } from './ThemeToggle'

const primaryLinks = [
  { slug: 'roster', label: '角色名单' },
  { slug: 'character-lookup', label: '角色查询' },
  { slug: 'boss', label: 'Boss追踪' },
  { slug: 'schedule', label: '时间看板' },
]

const calcTools = TOOLS.filter((t) => t.group === '计算器')
const guideTools = TOOLS.filter((t) => t.group === '图鉴与指南')

function Dropdown({
  label,
  items,
}: {
  label: string
  items: { slug: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-emerald-950/80 transition hover:bg-emerald-900/5 dark:text-white/80 dark:hover:bg-white/10"
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 w-56 rounded-xl border border-emerald-900/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-emerald-950">
          {items.map((item) => (
            <Link
              key={item.slug}
              to="/tools/$slug"
              params={{ slug: item.slug }}
              className="block rounded-lg px-3 py-2 text-sm text-emerald-950/80 transition hover:bg-emerald-900/5 dark:text-white/80 dark:hover:bg-white/10"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-[#fbf8ef]/90 backdrop-blur dark:border-white/10 dark:bg-emerald-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-lg font-bold text-white">
            🍁
          </span>
          <span className="text-lg font-bold text-emerald-950 dark:text-white">
            Frank Story
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.slug}
              to="/tools/$slug"
              params={{ slug: link.slug }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-950/80 transition hover:bg-emerald-900/5 dark:text-white/80 dark:hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
          <Dropdown label="计算" items={calcTools} />
          <Dropdown label="图鉴与指南" items={guideTools} />
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label="展开菜单"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-900/10 text-emerald-900/70 md:hidden dark:border-white/10 dark:text-white/70"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-emerald-900/10 px-5 py-3 md:hidden dark:border-white/10">
          <div className="flex flex-col gap-1">
            {[...primaryLinks.map((l) => ({ slug: l.slug, name: l.label })), ...calcTools, ...guideTools].map(
              (item) => (
                <Link
                  key={item.slug}
                  to="/tools/$slug"
                  params={{ slug: item.slug }}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-emerald-950/80 dark:text-white/80"
                >
                  {item.name}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </header>
  )
}
