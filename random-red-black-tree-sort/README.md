# Random Red-Black Tree Sort

This project inserts 10,000 randomly ordered numbers into a red-black tree, then
uses in-order traversal to produce sorted output.

## Run

```sh
npm install
npm run start
```

## Check

```sh
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run check       # typecheck + test
```

The test suite covers:

- red-black invariants for empty, tiny, sequential, reverse, duplicate, and 10,000 element workloads
- a seeded, reproducible 10,000 element run (the random source is injectable)
- explicit rotation cases for left, right, left-right, and right-left repairs
- custom comparator sorting for object and string values
- random range and shuffle behavior
- benchmark formatting and CLI result formatting

## Architecture

- `src/red-black-tree.ts`: generic red-black tree implementation, metrics, and validation.
- `src/demo.ts`: reusable demo runner and output formatter.
- `src/random.ts`: range generation and Fisher-Yates shuffle.
- `src/benchmark.ts`: small timing helpers.
- `src/index.ts`: CLI entry point for the 10,000 element run.
- `test/red-black-tree.test.ts`: behavior, invariant, and 10,000 element coverage.
- `test/demo.test.ts`, `test/random.test.ts`, `test/benchmark.test.ts`: demo, shuffle, and timing coverage.

Built with TypeScript 6 on Node.js (ESM, `NodeNext`); tested with Vitest 4.

## Why This Works

The insertion order is random, but each insertion is repaired with local rotations
and recoloring. That keeps the tree height near logarithmic, so the final sorted
array is available through a single in-order traversal.

## Docs

- [Test contract](docs/test-contract.md): Explains the inputs, ordering rules, tree invariants, guardrails, and eval coverage.
