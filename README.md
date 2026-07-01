简体中文 | [English](./README.en.md)

# templates

一组可直接复用的 TypeScript 项目模板。每个子目录都是自包含的独立项目，采用当前主流技术栈，开箱即有测试与类型检查。

- `ai-article-summarizer/`：基于 Next.js 16 的阅读工作台模板，含 AI 文章摘要、摘要历史与 Markdown 转 HTML 导出。
- `json-yaml-xml-parser/`：TypeScript 库 + CLI，把 JSON、YAML、XML 解析规整为可 JSON 序列化的值（TypeScript 6、Node.js ESM、Vitest 4）。
- `nodejs-cli-file-search/`：TypeScript Node.js CLI，按文件名递归搜索，跳过忽略目录与不可读目录（TypeScript 6、Vitest 4）。
- `random-red-black-tree-sort/`：TypeScript 红黑树，随机插入 10000 个元素并经中序遍历得到有序输出，含完整不变量校验（TypeScript 6、Vitest 4）。
- `trumpet-twitter/`：全栈「小号 Twitter」模板——React 19 + Vite 8 前端、Express 5 API、SQLite（better-sqlite3）、共享 Zod 4 契约、pnpm workspace。
- `web-front-end-snake-game/`：纯前端 TypeScript 贪吃蛇，固定步长游戏循环、Canvas 渲染、最高分持久化（TypeScript 6、Vite 8）。

每个模板目录都提供中文 `README.md` 与英文 `README.en.md`，点击文档顶部的语言链接即可切换。
