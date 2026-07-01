[简体中文](./README.md) | English

# Trumpet

Trumpet is a small full-stack Twitter clone written in TypeScript for practice: a React/Vite frontend, an Express API, SQLite persistence, local accounts, a following feed, plain-text posts, likes, and replies.

## Architecture

- `apps/web`: React + Vite product UI; after login you land directly on the Following timeline
- `apps/api`: Express REST API handling authentication, business logic, and SQLite reads/writes
- `packages/shared`: Zod schemas, DTOs, and shared types that keep the frontend and backend contracts from drifting

The backend tables are `users`, `sessions`, `posts`, `follows`, and `likes`. `posts.parent_id` powers replies. The first version deliberately skips images, reposts, direct messages, notifications, and any recommendation algorithm. Expired sessions are cleaned up opportunistically whenever a new session is created.

## Tech Stack

TypeScript 6 (strict + `exactOptionalPropertyTypes`), React 19 + Vite 8, Express 5, Zod 4 (shared schemas), Drizzle ORM + better-sqlite3, bcryptjs 3 (password hashing). Toolchain: pnpm workspace, ESLint 10 (flat config), Vitest 4.

## Running Locally

```bash
pnpm install
pnpm build
pnpm --filter @trumpet/api seed
pnpm dev
```

Default addresses:

- Web: <http://localhost:5173>
- API: <http://localhost:4000>

Seed accounts:

- `mina / password123`
- `leo / password123`
- `ava / password123`

## Common Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` first builds `shared`, then runs the shared contract schema tests, the Express API regression tests, and the React UI interaction tests in order. (`pnpm typecheck` also builds `shared` first.)

Run the API on its own:

```bash
pnpm --filter @trumpet/api dev
```

Run the frontend on its own:

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

## Design Leverage

- The shared contract lives in `packages/shared`, so the frontend and backend share the same validation and types.
- API routes only deal with HTTP; data access is concentrated in a repository layer.
- The following feed is driven by the `follows` table, which extends naturally to recommendations, notifications, search, and activity feeds later.
- The seed data covers multiple users, follow relationships, and posts, making manual verification and regression testing easy.

## Docs

- [Test contract](docs/test-contract.md): documents the inputs, core logic, outputs, invariants that must not break, and the test evidence.
