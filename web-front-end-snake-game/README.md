简体中文 | [English](./README.en.md)

# 贪吃蛇

一个纯前端的贪吃蛇游戏，使用 TypeScript、Vite 和原生 Canvas 构建。

## 特性

- 确定性的游戏模拟，与渲染彻底解耦
- Canvas 棋盘配合 DOM 的 HUD 与控制按钮
- 支持方向键、WASD 和屏幕方向按钮
- 通过 `localStorage` 持久化最高分（存储不可用时安全兜底）
- 帧间隔（frame delta）钳位，避免标签页被切到后台后恢复时"雪崩"
- 用 Vitest 覆盖核心游戏规则

基于 TypeScript 6 和 Vite 8（Rolldown）构建；使用 Vitest 4 测试。

## 命令

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run build
```

## 架构

- `src/game/`：纯游戏状态、规则、配置以及确定性随机数辅助函数
- `src/renderer/`：只读取游戏状态的 Canvas 渲染器
- `src/input.ts`：把物理输入映射为游戏动作
- `src/main.ts`：固定步长的游戏循环与 DOM HUD 绑定

## 文档

- [测试契约](docs/test-contract.md)：说明输入动作、状态规则、护栏（guardrails）与评测（eval）覆盖范围。

## 许可证

MIT
