# AI Article Summarizer

AI Article Summarizer 是一个基于 Next.js 16 的阅读工具工作台。它合并了 AI 文章摘要、摘要历史和 Markdown 转 HTML 能力：用户输入公开文章 URL 后，服务端会抓取静态 HTML、抽取正文内容、调用 DeepSeek Chat Completions API 生成三种长度的摘要，并将摘要历史保存到 SQLite-compatible 数据库；用户也可以在 `/markdown` 将 Markdown 笔记导出为带样式和代码高亮的 HTML。

## 项目简介

本项目面向「快速理解长文章」和「整理阅读笔记」场景，提供从 URL 到摘要历史、从 Markdown 到 HTML 导出的完整 Web 工作流：

- **URL 输入与校验**：首页提供文章 URL 输入框，支持 `http://` 和 `https://` 链接。
- **文章抓取与正文抽取**：后端抓取静态 HTML，并从页面中提取可摘要的正文内容。
- **三种摘要长度**：生成一句话摘要、短摘要和详细摘要，适配不同阅读深度。
- **历史记录**：保存 URL、标题、excerpt、三种摘要和必要元信息，支持历史页面回看。
- **Markdown 转 HTML**：内置从 `md2html` 合并来的 Markdown 渲染能力，支持安全 HTML 转义、链接识别和代码高亮。
- **安全边界**：服务端模块隔离 API key、数据库连接等 secrets；抓取逻辑包含 SSRF 防护、超时、重定向和响应大小限制等约束。
- **Vercel 友好**：使用 Node.js Runtime 的 Route Handler，不依赖完整 Chromium；静态 HTML 解析不执行 JavaScript。

技术栈：

- Next.js 16 App Router
- React 19.2
- TypeScript strict mode
- Tailwind CSS
- Drizzle ORM
- SQLite-compatible storage（本地 SQLite 文件 / 生产 Turso、libSQL 等）
- DeepSeek Chat Completions API（通过 OpenAI-compatible SDK 调用）
- MarkdownIt + highlight.js
- Vitest + ESLint

## 功能截图占位

> 当前 README 预留截图位置。添加真实截图时，请将图片放在仓库内的公开文档资源目录（例如 `docs/images/`），并更新下方链接。

### 首页：输入 URL 并生成摘要

![首页截图占位](docs/images/home-placeholder.png)

### 摘要结果：三种长度切换

![摘要结果截图占位](docs/images/summary-placeholder.png)

### 历史记录：查看已生成摘要

![历史记录截图占位](docs/images/history-placeholder.png)

### Markdown 工具：转换并下载 HTML

![Markdown 工具截图占位](docs/images/markdown-placeholder.png)

## 安装和运行步骤

### 1. 准备环境

建议使用：

- Node.js 20+
- pnpm（本仓库包含 `pnpm-lock.yaml`；如团队统一使用 npm，也可按同名 `npm run ...` 脚本执行）

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env.local
```

然后按需填写 `.env.local`，详见下方「环境变量配置说明」。

### 4. 初始化或迁移数据库

本地默认数据库地址为 `file:./data/summaries.db`。首次运行前建议执行数据库迁移：

```bash
pnpm db:migrate
```

如需根据 Drizzle schema 重新生成 migration：

```bash
pnpm db:generate
```

### 5. 启动开发服务器

```bash
pnpm dev
```

启动后打开：

- 首页：`http://localhost:3000`
- 历史记录：`http://localhost:3000/history`
- Markdown 转 HTML：`http://localhost:3000/markdown`

### 6. 运行验证命令

代码或文档变更后建议运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 环境变量配置说明

项目会从 `.env.local` 或部署平台的环境变量中读取配置。可参考 `.env.example`：

```bash
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

DATABASE_URL=file:./data/summaries.db
```

| 变量名 | 必填 | 默认值 / 示例 | 说明 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | 是 | `sk-...` | DeepSeek API key。仅在服务端读取，不要提交到 Git。未配置时后端无法生成真实摘要。 |
| `DEEPSEEK_BASE_URL` | 否 | `https://api.deepseek.com` | DeepSeek OpenAI-compatible API 地址。通常保持默认即可。 |
| `DEEPSEEK_MODEL` | 否 | `deepseek-chat` | 用于生成摘要的 DeepSeek 模型名称。 |
| `DATABASE_URL` | 是 | `file:./data/summaries.db` | SQLite-compatible 数据库连接地址。本地可使用 SQLite 文件；生产建议使用 Turso/libSQL 等托管服务。 |

安全提示：

- 不要将 `.env.local`、DeepSeek API key、生产数据库 URL 或 token 提交到仓库。
- 不要在 Client Component 中读取 API key、数据库连接或其他 secrets。
- 生产环境应为数据库配置最小权限凭据，并结合平台密钥管理能力定期轮换。

## API 概览

### `POST /api/summarize`

生成并保存指定 URL 的摘要。

请求示例：

```json
{
  "url": "https://example.com/article"
}
```

响应会返回保存后的摘要记录，摘要字段位于：

- `summaries.one_line`
- `summaries.short`
- `summaries.detailed`

### `GET /api/history`

返回最近摘要记录。支持查询参数：

- `page`：页码
- `limit`：每页数量，默认 50，最大 50

### `GET /api/history/[id]`

返回单条摘要详情。

### `POST /api/markdown/render`

将 Markdown 转换为 HTML fragment 和完整 HTML document。

请求示例：

```json
{
  "title": "阅读笔记",
  "markdown": "# 标题\n\n正文内容"
}
```

响应字段：

- `document`：完整 HTML 文档，可直接下载保存。
- `fragment`：可嵌入页面的 HTML 片段。
- `output_filename`：根据标题生成的默认 HTML 文件名。

## 部署到 Vercel 的步骤

### 1. 准备生产数据库

Vercel Serverless 环境不适合依赖持久化本地文件数据库。生产部署建议准备 SQLite-compatible 托管数据库，例如 Turso/libSQL，并获取生产可用的 `DATABASE_URL`。

> 如果所选数据库还需要额外 token，请先确认当前代码是否已接入对应变量；公共文档不要添加尚未实现的变量。

### 2. 推送代码到 Git 平台

将仓库推送到 GitHub、GitLab 或 Bitbucket，供 Vercel 导入。

### 3. 在 Vercel 导入项目

1. 登录 Vercel Dashboard。
2. 点击 **Add New... → Project**。
3. 选择本仓库。
4. Framework Preset 选择 **Next.js**。
5. 保持默认构建设置，或按团队约定调整：
   - Install Command：`pnpm install`
   - Build Command：`pnpm build`
   - Output Directory：Next.js 默认值即可

### 4. 配置环境变量

在 Vercel 项目的 **Settings → Environment Variables** 中添加：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`（可选，默认 `https://api.deepseek.com`）
- `DEEPSEEK_MODEL`（可选，默认 `deepseek-chat`）
- `DATABASE_URL`

建议至少为 **Production** 和 **Preview** 环境分别配置合适的数据库与 API key。

### 5. 执行数据库迁移

部署前或部署后，根据团队流程对生产数据库执行 migration：

```bash
pnpm db:migrate
```

可在本地临时设置生产 `DATABASE_URL` 后运行，也可以接入团队已有的 CI/CD migration 步骤。执行前请确认目标数据库和凭据，避免误操作本地或生产数据。

### 6. 部署并验证

1. 点击 Vercel 的 **Deploy**。
2. 部署完成后访问生产 URL。
3. 验证首页、历史记录页和 `POST /api/summarize` 是否正常工作。
4. 如摘要生成失败，优先检查 Vercel 环境变量、DeepSeek API key、数据库连接和函数日志中的安全错误信息。

## 常用脚本

```bash
pnpm dev        # 启动本地开发服务器
pnpm build      # 构建生产版本
pnpm start      # 启动生产服务器
pnpm lint       # 运行 ESLint
pnpm typecheck  # 运行 TypeScript 类型检查
pnpm test       # 运行 Vitest 测试
pnpm db:generate # 生成 Drizzle migration
pnpm db:migrate  # 应用数据库 migration
```
