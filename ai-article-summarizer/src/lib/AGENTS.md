# AGENTS.md

## 目录职责

`src/lib/` 负责后端核心逻辑：URL 校验、文章抓取、正文解析、DeepSeek 调用、摘要编排、数据库访问、错误处理，以及与 Vercel 部署约束相关的服务端实现。

这里的模块默认是服务端代码。需要被 Client Component 使用的纯工具必须明确保持无 secrets、无数据库、无网络副作用。

## 推荐模块

- `validators.ts`：URL 校验、SSRF 防护、输入 schema 和共享类型。
- `article-fetcher.ts`：HTTP fetch、超时、重定向限制、响应大小限制和 content-type 检查。
- `article-extractor.ts`：统一正文抽取入口，先站点 adapter，再 Readability/Cheerio fallback。
- `extractors/`：站点专用解析器，例如 `wechat.ts`。
- `deepseek.ts`：DeepSeek API client、请求构造、超时、错误归一化。
- `summarizer.ts`：编排抓取、解析、调用模型、校验结果和保存记录。
- `errors.ts`：领域错误类型和用户可读错误映射。
- `db/`：Drizzle schema、client、queries、migrations。

## 后端代码风格

- 服务端专用文件导入 `server-only`。
- 新函数必须有函数级注释，说明职责、输入限制和失败行为。
- 文件名使用 kebab-case，普通函数使用 camelCase，类型和 class 使用 PascalCase。
- 优先返回 typed result，不让底层第三方异常直接穿透到 UI。
- 避免在一个函数里同时做抓取、解析、模型调用和数据库写入；复杂流程放到 `summarizer.ts` 编排。
- 默认使用 `async`/`await`，显式处理超时和 abort。
- 外部 API response 必须经过 schema 或类型守卫校验后再使用。

## URL 抓取和正文解析

- 只允许 `http:` 和 `https:` URL。
- 必须拒绝 localhost、内网 IP、link-local、loopback、metadata service 地址和非网页协议。
- 必须设置请求超时、最大重定向次数、最大响应体大小和合理 User-Agent。
- Cheerio 和 Readability 只处理静态 HTML，不执行 JavaScript。
- 微信公众号等站点先走专用 extractor，例如优先读取 `#js_content`、Open Graph meta 和可解析的内嵌变量。
- 如果静态 HTML 无法得到正文，可以通过可选外部渲染服务 fallback，不要默认本地运行 Chromium。
- 不长期保存完整正文；默认只保存 excerpt、hash 和摘要结果。

## DeepSeek 集成

- DeepSeek API key 只能从服务端环境变量读取，例如 `DEEPSEEK_API_KEY`。
- 默认 base URL 为 `https://api.deepseek.com`，模型名通过 `DEEPSEEK_MODEL` 配置。
- 请求模型时要求返回严格 JSON，字段为：
  - `oneSentence`
  - `shortSummary`
  - `detailedSummary`
- 必须校验模型返回结构；JSON 解析失败可以做一次轻量修复或重试。
- 不把 prompt、文章全文、API key 或第三方完整响应写入日志。
- 限流、超时、认证失败和模型返回异常要映射成用户可读错误。

## 数据库规范

- 使用 Drizzle ORM 管理 schema、queries 和 migrations。
- schema 变更必须生成并提交 migration。
- Query 函数集中封装在 `src/lib/db/`，页面和 Server Actions 不直接拼 SQL。
- 生产数据库使用 Turso/libSQL 等 SQLite-compatible 服务；本地开发可以使用 SQLite 文件。
- 数据库记录默认包含 URL、normalized URL、标题、excerpt、文章 hash、三种摘要、模型名、状态、错误消息和时间戳。
- 不保存完整正文，除非后续产品需求明确要求并同步更新隐私和文档说明。

## Vercel 限制

- 默认不要在 Vercel Function 中运行完整 Chromium。
- 如必须使用浏览器渲染，优先调用 Browserless、Firecrawl、Apify 等外部服务，并通过环境变量开关启用。
- 浏览器渲染 fallback 必须有超时、成本控制和失败降级。
- 需要 Node.js API 的模块不要放到 Edge Runtime。
- 注意 Vercel Function 的包体积、执行时长、内存、响应大小和冷启动影响。

## 错误处理

- 抓取失败、正文过短、DeepSeek 限流、DeepSeek 超时、JSON 解析失败、数据库写入失败都要有明确错误类型。
- 用户可见错误要短、清楚、可行动。
- 日志中可以记录 request id、URL hash、错误类型和状态码，但不要记录 secrets 或完整正文。
- 第三方 API 原始错误只在服务端做安全摘要，不直接返回给浏览器。

## 测试

- 为 URL 校验和 SSRF 防护写单元测试。
- 为 extractor 写 fixture 测试，包括普通 HTML、微信公众号 HTML、正文过短和无正文页面。
- 为 DeepSeek response parsing 写测试，包括合法 JSON、缺字段、非法 JSON 和空响应。
- 为数据库 query 写测试，覆盖 insert、list、get by id、delete 和失败记录。
- 默认测试必须 mock 网络、DeepSeek 和外部渲染服务，不依赖真实外部请求。
