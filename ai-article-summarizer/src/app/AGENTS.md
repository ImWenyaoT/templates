# AGENTS.md

## 目录职责

`src/app/` 负责 Next.js 15 App Router 层：页面、布局、表单交互、Server Actions、Route Handlers、loading/error/empty states，以及把服务端数据组合成用户可见界面。

这里应该像一个产品工作台，不要做营销落地页。核心体验是输入 URL、等待摘要、查看三种摘要、回看历史记录。

## 页面和组件规范

- `page.tsx` 默认写成 Server Component。
- 只有交互状态、输入控制、tabs、toast、乐观 UI、客户端动画等确实需要浏览器状态时，才使用 Client Component。
- 表单提交优先使用 Server Actions。
- 只有外部 API、webhook、健康检查或必须暴露 HTTP 接口时，才新增 Route Handler。
- `loading.tsx`、`error.tsx`、空状态和失败状态都要面向真实用户，不要显示调试堆栈。
- 页面可以组合 `src/components/` 的复用组件；本路由私有组件放在 `_components/`。

## UI 风格

- 使用 Tailwind CSS。
- 采用工作台式界面：清晰、克制、适合反复使用，不做夸张 hero 或营销文案。
- 保持桌面和移动端布局稳定，按钮、输入框、卡片、tabs 中的文字不得溢出或互相遮挡。
- 所有核心状态都要完整：idle、loading、success、empty、error。
- 表单必须有可见 label 或清晰的 accessible name。
- 按钮要有明确 disabled/loading 状态，避免重复提交。
- 对历史记录、摘要结果和错误消息使用一致的间距、字号和信息层级。

## 文件命名

- route segment 使用 kebab-case，例如 `summary-history/`。
- App Router 特殊文件保持约定命名：
  - `page.tsx`
  - `layout.tsx`
  - `loading.tsx`
  - `error.tsx`
  - `not-found.tsx`
  - `route.ts`
- 本目录私有组件放在 `_components/`，文件名使用 kebab-case。
- 全局复用组件放到 `src/components/`，不要在多个 route segment 中复制粘贴。
- Server Actions 可以放在当前 route 的 `actions.ts`，跨页面复用时再提升到更上层。

## 前后端边界

- 不在 Client Component 中直接调用 DeepSeek、Drizzle、Turso/libSQL 或任何服务端 secrets。
- 前端只提交 URL 和用户动作；抓取、正文解析、摘要生成和存储都由服务端完成。
- 不在 UI 层拼接 SQL 或实现数据库查询细节。
- 不在 UI 层实现 SSRF 防护、文章抓取或模型 response parsing；这些逻辑属于 `src/lib/`。
- 传给 Client Component 的数据必须是可序列化对象，不传数据库连接、Response、Error 实例或复杂 class。

## Server Actions 和 Route Handlers

- Server Actions 只做请求入口和轻量编排，复杂逻辑调用 `src/lib/` service。
- Server Actions 必须重复做服务端校验，不信任前端校验结果。
- Mutation 成功后使用 `revalidatePath` 或明确刷新相关数据。
- Route Handler 返回 JSON 时使用稳定的字段名和状态码。
- 不把第三方 API 原始错误完整返回给浏览器。

## 验证

- UI 变更后至少运行：
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- 重要交互增加组件测试或 E2E 测试。
- 涉及用户可见文案、行为、错误状态时，检查 README、示例或 changelog 是否需要更新。
