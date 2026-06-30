# AGENTS.md

## 项目概览

这是一个 AI 文章摘要 Web 应用。用户输入文章 URL，系统抓取并抽取文章正文，调用 DeepSeek API 生成三种长度的摘要，并保存历史记录供用户回看。

全局技术栈：

- Next.js 15 App Router
- TypeScript strict mode
- Tailwind CSS
- SQLite-compatible storage
- Drizzle ORM
- DeepSeek Chat Completions API
- Vercel deployment

## 项目结构

- `src/app/`：页面、布局、Server Actions、Route Handlers、loading/error states 和前端入口。
- `src/components/`：跨页面复用的 UI 组件。
- `src/lib/`：后端 service、文章抓取/解析、DeepSeek client、数据库访问、校验和错误处理。
- `src/lib/db/`：Drizzle schema、client、queries、migrations。数据库目录默认放在这里，不再新增平行的 `src/db/`。
- `data/raw/`：如需保存原始数据，只能放在这里，不得覆盖 raw 文件。
- `data/processed/`：清洗后的数据。
- `analysis/`：探索性 notebook 或分析脚本。
- `output/`：最终产物。

## 代码风格

- 使用 TypeScript strict，优先显式类型，避免隐式 `any`。
- 生成新函数时添加函数级注释，说明函数的职责和关键约束。
- 文件名使用 kebab-case，例如 `article-fetcher.ts`、`summary-card.tsx`。
- React 组件使用 PascalCase 导出，例如 `SummaryCard`。
- 普通函数、变量和 Server Actions 使用 camelCase。
- 服务端专用模块默认导入 `server-only`，避免被 Client Component 引用。
- 不在 Client Component 中读取 API key、数据库连接或其他 secrets。
- 保持模块边界清晰：UI 不直接拼 SQL，不直接调用 DeepSeek，不执行文章抓取。

## 数据和安全

- 默认不保存完整文章正文，只保存 URL、标题、excerpt、文章 hash、三种摘要和必要元信息。
- URL 抓取必须做 SSRF 防护，拒绝 localhost、内网地址、file URL 和非 http/https 协议。
- 抓取必须设置超时、重定向上限、响应体大小限制和合理 User-Agent。
- 不把 DeepSeek API key、Turso token、数据库 URL 或第三方原始错误写入日志。
- 用户可见错误要可读，但不能泄露内部栈、请求头、secrets 或完整第三方响应。
- 生产数据库使用 Turso/libSQL 等 SQLite-compatible 服务；本地开发可以使用 SQLite 文件。

## Vercel 约束

- 不要默认在 Vercel Function 中运行完整 Chromium。
- Cheerio 和 Readability 只处理静态 HTML，不执行 JavaScript。
- JavaScript 渲染页面使用外部 Browserless、Firecrawl、Apify 等服务作为可选 fallback。
- 后端抓取和摘要逻辑使用 Node.js runtime，不放到 Edge Runtime。
- 注意 Vercel Function 的包体积、执行时长、内存和响应大小限制。

## 测试和验证

- 使用项目已有脚本。如果没有脚本，新增前先保持命名直观，例如 `lint`、`typecheck`、`test`、`build`。
- 代码变更后至少运行：
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- 涉及文档变更时，运行项目定义的 docs formatting 和 build checks。
- 网络、DeepSeek、Browserless、Firecrawl 等外部依赖在默认测试中必须 mock，不依赖真实请求。

## Review 规则

- typo 和 grammar issues 标为 P0。
- 潜在缺文档标为 P1。
- 缺测试标为 P1。
- 用户可见行为变化时，检查 README、示例和 changelog 是否需要更新。

## 文档规则

- 公共文档只能包含本仓库可见的公开行为或公开信息。
- 保留已有术语和 frontmatter。
- 不编造未实现的功能、参数、价格、模型能力或部署状态。
