简体中文 | [English](./README.en.md)

# Node.js CLI File Search

一个 TypeScript Node.js CLI 框架，用来按文件名搜索目录。

## 开发

```bash
pnpm install
pnpm dev -- search <keyword> --root .   # 用 tsx 直接跑 src/index.ts
pnpm test                               # vitest run
pnpm typecheck                          # tsc --noEmit
pnpm build                              # 编译到 dist/
```

需要 Node.js >= 20。

## 命令

```bash
file-search search <keyword> --root <directory> --max <number>
```

参数：

- `keyword`：要匹配的文件名关键字（大小写不敏感的子串匹配）
- `--root` / `-r`：搜索根目录，默认当前目录
- `--max` / `-m`：最多返回多少条结果，默认 `50`（必须是正十进制整数）

搜索会递归遍历目录树，默认跳过 `.git`、`node_modules`、`dist`、`coverage`；遍历途中遇到
无法读取的子目录（如权限不足）会跳过而非整体失败，但根目录读取失败仍会报错退出。

## 项目结构

```text
src/
  index.ts   # CLI 入口（参数解析、退出码、可注入 IO）
  search.ts  # 文件搜索核心（递归、忽略目录、容错）
test/
  search.test.ts  # 搜索库的行为与边界
  cli.test.ts     # CLI 端到端（参数、退出码、错误）
```

技术栈：TypeScript 6 + Node.js（ESM，`NodeNext`），测试用 Vitest 4。

## Docs

- [Test contract](docs/test-contract.md)：说明输入、核心逻辑、输出、不能破的规则和测试证明。

## License

MIT
