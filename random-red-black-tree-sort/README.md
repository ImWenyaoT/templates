简体中文 | [English](./README.en.md)

# 随机红黑树排序

本项目将 10,000 个随机顺序的数字插入一棵红黑树，再通过中序遍历输出有序结果。

## 运行

```sh
npm install
npm run start
```

## 检查

```sh
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run check       # 先 typecheck 再 test
```

测试套件覆盖：

- 空树、极小规模、顺序、逆序、重复值以及 10,000 元素工作负载下的红黑树不变量
- 带 seed、可复现的 10,000 元素运行（随机源可注入）
- 左旋、右旋、左右旋、右左旋四种修复情形的显式用例
- 针对对象与字符串值的自定义 comparator 排序
- 随机区间生成与洗牌行为
- benchmark 格式化与 CLI 结果格式化

## 架构

- `src/red-black-tree.ts`：泛型红黑树实现、指标统计与不变量校验。
- `src/demo.ts`：可复用的演示运行器与输出格式化。
- `src/random.ts`：区间生成与 Fisher-Yates 洗牌。
- `src/benchmark.ts`：轻量计时辅助函数。
- `src/index.ts`：面向 10,000 元素运行的 CLI 入口。
- `test/red-black-tree.test.ts`：行为、不变量与 10,000 元素覆盖。
- `test/demo.test.ts`、`test/random.test.ts`、`test/benchmark.test.ts`：演示、洗牌与计时覆盖。

采用 TypeScript 6 构建，运行于 Node.js（ESM，`NodeNext`）；使用 Vitest 4 测试。

## 原理

插入顺序是随机的，但每次插入都会通过局部旋转与重新着色进行修复，从而让树高保持在接近对数的水平，因此最终的有序数组只需一次中序遍历即可得到。

## 文档

- [测试契约](docs/test-contract.md)：说明输入、排序规则、树不变量、guardrails 以及 eval 覆盖。
