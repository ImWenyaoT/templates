[简体中文](./README.md) | English

# Node.js CLI File Search

A TypeScript Node.js CLI framework for searching a directory by file name.

## Development

```bash
pnpm install
pnpm dev -- search <keyword> --root .   # run src/index.ts directly via tsx
pnpm test                               # vitest run
pnpm typecheck                          # tsc --noEmit
pnpm build                              # compile to dist/
```

Requires Node.js >= 20.

## Command

```bash
file-search search <keyword> --root <directory> --max <number>
```

Arguments:

- `keyword`: file-name keyword to match (case-insensitive substring match)
- `--root` / `-r`: root directory to search from, defaults to the current directory
- `--max` / `-m`: maximum number of results to return, defaults to `50` (must be a positive base-10 integer)

The search walks the directory tree recursively and skips `.git`, `node_modules`, `dist`, and `coverage` by default. When a nested subdirectory cannot be read during the walk (e.g. insufficient permissions), it is skipped instead of failing the whole search; a read failure on the root directory still exits with an error.

## Project structure

```text
src/
  index.ts   # CLI entry point (arg parsing, exit codes, injectable IO)
  search.ts  # file-search core (recursion, ignored directories, fault tolerance)
test/
  search.test.ts  # behavior and edge cases of the search library
  cli.test.ts     # CLI end-to-end (args, exit codes, errors)
```

Tech stack: TypeScript 6 + Node.js (ESM, `NodeNext`), tested with Vitest 4.

## Docs

- [Test contract](docs/test-contract.md): explains the input, core logic, output, invariants that must not break, and what the tests prove.

## License

MIT
