简体中文 | [English](./README.en.md)

# JSON/YAML/XML 解析器

一个小巧的 TypeScript 解析器，把 JSON、YAML、XML 统一规整为 JSON 可序列化的 JavaScript 数据。

## 安装

```bash
pnpm install
```

## CLI 用法

```bash
pnpm dev -- parse ./example.yaml
pnpm dev -- parse ./example.txt --format json
```

CLI 会自动识别 `.json`、`.yaml`、`.yml`、`.xml` 文件。使用 `--format`（或短选项 `-f`）可覆盖自动检测。构建后可执行文件名为 `data-parser`，用法为 `data-parser parse <file> [--format json|yaml|xml]`。

## 库 API

```ts
import { parseData, parseDocument } from 'json-yaml-xml-parser'

const data = parseData('{"name":"Ada"}', { format: 'json' })
const document = parseDocument('<user id="1">Ada</user>', { format: 'xml' })
```

- `parseDocument(source, options)`：解析源字符串，返回数据以及解析元信息（`format`、`data`，以及传入 `sourcePath` 时的 `sourcePath`）。
- `parseData(source, options)`：只返回规整后的数据值。
- `detectFormat(sourcePath?, format?)`：根据显式格式或文件扩展名判断该用哪个解析器。

XML 输出把属性放在 `$attributes` 下、文本节点放在 `$text` 下，重复的子元素变成数组，从而让解析后的结构保持稳定、可预测。解析是**单向**规整为 JSON 可序列化数据：本工具读取 JSON/YAML/XML 并输出一个规整后的值，但**不会**反序列化回写 YAML 或 XML（XML 标量保留为字符串）。

基于 TypeScript 6、运行于 Node.js（ESM，`NodeNext`，要求 Node >= 20）；使用 Vitest 4 测试。

## 检查命令

```bash
pnpm typecheck
pnpm test
pnpm build
```

## 文档

- [测试契约](docs/test-contract.md)：说明输入规则、解析逻辑、输出结构、护栏（guardrails）与评测（eval）覆盖范围。
