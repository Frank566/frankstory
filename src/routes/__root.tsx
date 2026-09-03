import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'


import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Frank Story - 冒险岛 GMS 区工具站',
      },
      {
        name: 'description',
        content:
          'Frank Story 是专为冒险岛（MapleStory）GMS 区玩家打造的工具网站，提供角色管理、Boss追踪、进度计算等实用工具，数据保存在本地浏览器。',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
