# TypeScript 项目模板集（templates）

一组自包含、生产标准的 TypeScript 起手模板，覆盖数据结构、命令行工具、数据格式解析、纯前端游戏、前后端全栈应用与 AI 应用等不同技术领域，均配套完整测试、严格类型检查与最新技术栈，可直接作为新项目的起点。

## 背景（Situation）

想以工程标准而非一次性 demo 的方式，系统沉淀一套现代 TypeScript 全栈能力，需要一批覆盖不同技术领域、可复用、可维护的高质量脚手架，而不是散落各处、缺测试少规范的练习代码。

## 目标（Task）

设计、实现并持续维护一组自包含的 TypeScript 项目模板：横跨底层数据结构、CLI 工具、数据格式解析、纯前端交互、前后端全栈与 AI 应用；每个模板都要有严格类型、完整自动化测试与统一工程规范，能作为可靠的项目起点开箱即用。

## 行动（Action）

- 用 TypeScript（strict 模式）实现 6 个领域各异的模板：随机插入排序的红黑树、JSON/YAML/XML 解析库 + CLI、递归文件名搜索 CLI、纯前端贪吃蛇、全栈「小号 Twitter」（React + Express + SQLite）、Next.js AI 文章摘要器。
- 为核心逻辑、边界条件与错误路径编写 250+ 个自动化测试（Vitest），并把类型检查、Lint、构建接入为提交门禁，保证每次改动可验证。
- 依据官方文档将技术栈整体升级到最新主版本（Express 5、Zod 4、bcryptjs 3、Drizzle ORM、ESLint 10、Vite 8 / Rolldown、TypeScript 6、Vitest 4），逐项处理破坏性变更与迁移。
- 通过多轮代码评审与对抗式验证（并行子代理独立复跑测试）定位并修复真实缺陷：目录不可读时的容错、浏览器隐私模式下的存储兜底、数据库目录创建顺序、前端写操作的错误处理、游戏循环的帧步长钳位等；并统一工程规范（单引号无分号、函数级注释、构建产物不含测试）。
- 收敛为单一仓库，每个模板均配中英双语文档，便于复用与协作。

## 成果（Result）

- 交付 6 个开箱即用的 TypeScript 模板，全部通过类型检查、测试与构建（250+ 测试全绿），可直接作为新项目起点。
- 技术栈全部处于最新稳定主版本，横跨后端、前端、数据结构与工具链，形成一份可展示的现代全栈工程能力样本。

## 包含的模板

- [`random-red-black-tree-sort/`](./random-red-black-tree-sort/) — 红黑树随机插入排序与不变量校验
- [`json-yaml-xml-parser/`](./json-yaml-xml-parser/) — JSON/YAML/XML 解析库 + CLI
- [`nodejs-cli-file-search/`](./nodejs-cli-file-search/) — 递归文件名搜索 CLI
- [`web-front-end-snake-game/`](./web-front-end-snake-game/) — 纯前端贪吃蛇
- [`trumpet-twitter/`](./trumpet-twitter/) — React + Express + SQLite 全栈小号 Twitter
- [`ai-article-summarizer/`](./ai-article-summarizer/) — Next.js AI 文章摘要与阅读工作台

每个模板目录都提供中文 `README.md` 与英文 `README.en.md`。
