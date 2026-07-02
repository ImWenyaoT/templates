简体中文 | [English](./README.en.md)

# Trumpet

Trumpet 是一个用 TypeScript 写的小号 Twitter 全栈练习项目：React/Vite 前端、Express API、SQLite 持久化、本地账号、关注流、纯文本发帖、点赞和回复。

## 架构

- `apps/web`：React + Vite 产品界面，登录后直接进入 Following 时间线
- `apps/api`：Express REST API，负责认证、业务逻辑、SQLite 读写
- `packages/shared`：Zod schema、DTO 和共享类型，避免前后端接口漂移

后端数据表包括 `users`、`sessions`、`posts`、`follows`、`likes`。`posts.parent_id` 用来支持回复，第一版不做图片、转发、私信、通知或推荐算法。过期会话在每次新建会话时被机会性清理。

## 技术栈

TypeScript 6（strict + `exactOptionalPropertyTypes`）、React 19 + Vite 8、Express 5、Zod 4（共享 schema）、SQLite（better-sqlite3，直接用 prepared statement，不引入 ORM）、bcryptjs 3（密码哈希）。工具链：pnpm workspace、ESLint 10（flat config）、Vitest 4。

## 本地运行

```bash
pnpm install
pnpm build
pnpm --filter @trumpet/api seed
pnpm dev
```

默认地址：

- Web：<http://localhost:5173>
- API：<http://localhost:4000>

Seed 账号：

- `mina / password123`
- `leo / password123`
- `ava / password123`

## 常用命令

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` 会先构建 shared，再依次运行 shared contract schema 测试、Express API 回归测试和 React UI 交互测试。（`pnpm typecheck` 同样会先构建 shared。）

API 单独运行：

```bash
pnpm --filter @trumpet/api dev
```

前端单独运行：

```bash
pnpm --filter @trumpet/web dev
```

## API

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /me`
- `POST /posts`
- `GET /timeline?cursor=...`
- `POST /posts/:id/like`
- `DELETE /posts/:id/like`
- `POST /users/:id/follow`
- `DELETE /users/:id/follow`
- `GET /users/:handle`
- `GET /users/:handle/posts`

## 设计杠杆

- 共享 contract 放在 `packages/shared`，前后端共用校验和类型。
- API route 只处理 HTTP，数据访问集中在 repository 层。
- 关注流由 `follows` 表驱动，后续可以自然扩展推荐、通知、搜索和活动流。
- Seed 数据覆盖多用户、多关注关系、多帖子，便于手动验证和回归测试。

## Docs

- [Test contract](docs/test-contract.md)：说明输入、核心逻辑、输出、不能破的规则和测试证明。
