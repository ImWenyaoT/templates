# TypeScript 项目模板集（templates）

[![CI](https://github.com/ImWenyaoT/templates/actions/workflows/ci.yml/badge.svg)](https://github.com/ImWenyaoT/templates/actions/workflows/ci.yml)

一组自包含、生产标准的 TypeScript 项目模板，覆盖算法、命令行工具、前端与前后端全栈等不同领域，每个都配套完整测试、可独立作为新项目的起点。以下逐个概述，每段描述均可直接用作简历项目经历。

## [trumpet-twitter](./trumpet-twitter/) · 全栈「小号 Twitter」

实现了一个「小号 Twitter」全栈应用，用于练透前后端一体的完整闭环：前端 React 19 + Vite、后端 Express + better-sqlite3，前后端通过 `packages/shared` 中的 Zod 契约共享校验与类型以避免接口漂移，并用 pnpm workspace 将代码分为 api/web/shared 三层。功能覆盖注册/登录/会话（bcrypt 哈希 + cookie）、发帖与回复、关注流时间线（游标分页）、点赞与用户主页。46 个测试贯穿 shared 契约、Express API 集成与 React 交互，全部通过。

## [ai-article-summarizer](./ai-article-summarizer/) · AI 文章摘要工作台

基于 Next.js 16 App Router 构建的 AI 阅读工作台：用户输入文章 URL 后，服务端抓取静态 HTML、抽取正文、调用 DeepSeek Chat Completions 生成一句话/短/详细三档摘要并存入 SQLite-compatible 数据库，另提供 Markdown 转带样式 HTML 的导出。工程上把 API key、数据库连接等 secret 限制在服务端，抓取逻辑内置 SSRF 防护、超时与响应大小限制，并用 Node Runtime 的 Route Handler 适配 Vercel 部署。技术栈为 React 19、TypeScript strict、Tailwind、Drizzle ORM 与 Vitest。

## [json-yaml-xml-parser](./json-yaml-xml-parser/) · JSON/YAML/XML 解析库 + CLI

为在同一套代码里统一处理多种数据/配置格式，用 TypeScript 实现了把 JSON、YAML、XML 规整为 JSON 可序列化值的解析库与命令行工具：以适配器模式隔离三种格式（原生 JSON、yaml、fast-xml-parser），用统一的 `ParserError` 承载错误信息与原始 cause，并通过依赖注入 IO 的 CLI 支持按扩展名自动识别与 `--format` 覆盖；有意保持「单向规整、不做回写」的诚实边界。64 个测试覆盖三种格式解析、错误路径与 CLI 行为，全部通过。

## [random-red-black-tree-sort](./random-red-black-tree-sort/) · 红黑树随机插入排序

为系统验证自平衡二叉搜索树的实现，用 TypeScript（strict）从零实现了一棵带父指针的红黑树：支持任意比较器，插入时以旋转与重着色维持平衡，并提供单遍不变量校验（根黑、无连续红节点、各路径黑高一致、BST 有序），随机源可注入以复现结果。随机插入 10000 个元素后经中序遍历稳定得到有序输出；42 个测试覆盖四种旋转、重复键、正负值、对数高度上界与万级压力，全部通过。

## [web-front-end-snake-game](./web-front-end-snake-game/) · 纯前端贪吃蛇

用纯前端 TypeScript（无后端）实现贪吃蛇，重点是把游戏规则与渲染彻底解耦：核心是基于 reducer 的不可变状态机 + 确定性随机，可在 Node 环境纯函数测试；渲染层只读状态绘制 Canvas，输入层支持键盘/WASD/触控。工程上处理了固定步长循环的帧步长钳位（防止切后台回来时的「死亡螺旋」）与 localStorage 在隐私模式下的容错。59 个测试覆盖状态转移、碰撞、计分与边界，全部通过。

## [nodejs-cli-file-search](./nodejs-cli-file-search/) · 递归文件搜索 CLI

用 TypeScript 实现了一个零运行时依赖、仅用 Node 内置模块的递归文件名搜索 CLI：大小写不敏感子串匹配、默认跳过 `.git`/`node_modules` 等目录、支持结果上限，并把 IO 通过依赖注入抽象以便端到端测试。健壮性上，遇到不可读目录（EACCES）跳过而非整体失败、根目录错误仍如实上报、`--max` 严格校验为正整数。41 个测试覆盖搜索逻辑、CLI 参数与权限边界，全部通过。

---

每个模板目录都提供中文 `README.md` 与英文 `README.en.md`。
