# Snake

A pure frontend Snake game built with TypeScript, Vite, and Vanilla Canvas.

## Features

- Deterministic game simulation separated from rendering
- Canvas playfield with DOM HUD and controls
- Keyboard, WASD, and on-screen directional controls
- Persisted best score through `localStorage` (falls back safely when storage is unavailable)
- Frame-delta clamping so a backgrounded tab does not "spiral" on resume
- Vitest coverage for core game rules

Built with TypeScript 6 and Vite 8 (Rolldown); tested with Vitest 4.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run build
```

## Architecture

- `src/game/`: pure game state, rules, config, and deterministic random helpers
- `src/renderer/`: Canvas renderer that only reads game state
- `src/input.ts`: physical input to game action mapping
- `src/main.ts`: fixed-tick game loop and DOM HUD binding

## Docs

- [Test contract](docs/test-contract.md): Explains the input actions, state rules, guardrails, and eval coverage.

## License

MIT
