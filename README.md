# 玩枫谷

一个仿照 [maplestory.wanniwa.cn](https://maplestory.wanniwa.cn) 打造的冒险岛（MapleStory）GMS 区玩家工具网站首页与框架。

## 这是什么

玩枫谷为冒险岛 GMS 区的国人玩家提供角色管理、进度追踪等实用工具的入口。首页展示了核心工具入口（角色名单、Boss 追踪、时间看板等）、计算器与图鉴/指南分类导航、最近更新日志、关于本站说明，以及家族招募信息。所有工具页面目前为占位页面，后续会逐步实现具体功能。

网站强调隐私：所有用户数据都保存在浏览器本地（`localStorage`），不会上传到任何服务器。当前已实现的本地存储示例是深浅色主题切换。

## 技术栈

- [TanStack Start](https://tanstack.com/start) + React 19
- Tailwind CSS 4
- 部署在 Netlify

## 本地运行

```bash
pnpm install
pnpm dev
```

默认在 `http://localhost:3000` 打开。
