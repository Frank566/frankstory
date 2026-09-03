export function Footer() {
  return (
    <footer className="border-t border-emerald-900/10 bg-[#fbf8ef] dark:border-white/10 dark:bg-emerald-950">
      <div className="mx-auto max-w-7xl px-5 py-10 text-sm text-emerald-950/60 dark:text-white/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-emerald-950 dark:text-white">Frank Story</p>
            <p className="mt-1">专为Frank打造的工具网站</p>
          </div>
          <p>所有数据保存在本地浏览器中，我们不会收集你的角色信息。</p>
        </div>
        <p className="mt-6 text-xs text-emerald-950/40 dark:text-white/40">
          © {new Date().getFullYear()}  本站与 Nexon / MapleStory 官方无关
        </p>
      </div>
    </footer>
  )
}
