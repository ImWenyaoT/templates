[简体中文](./README.md) | English

# JSON/YAML/XML Parser

A small TypeScript parser for normalizing JSON, YAML, and XML into JSON-serializable JavaScript data.

## Install

```bash
npm install
```

## CLI

```bash
npm run dev -- parse ./example.yaml
npm run dev -- parse ./example.txt --format json
```

The CLI detects `.json`, `.yaml`, `.yml`, and `.xml` files automatically. Use `--format` (or the short option `-f`) to override detection. After building, the executable is named `data-parser`, invoked as `data-parser parse <file> [--format json|yaml|xml]`.

## Library

```ts
import { parseData, parseDocument } from 'json-yaml-xml-parser'

const data = parseData('{"name":"Ada"}', { format: 'json' })
const document = parseDocument('<user id="1">Ada</user>', { format: 'xml' })
```

- `parseDocument(source, options)`: parses a source string and returns the data plus parser metadata (`format`, `data`, and `sourcePath` when a `sourcePath` is passed).
- `parseData(source, options)`: returns only the normalized data value.
- `detectFormat(sourcePath?, format?)`: decides which parser to use from an explicit format or a file extension.

XML output keeps attributes under `$attributes` and text nodes under `$text`, and repeated child elements become arrays, so the parsed shape stays stable and predictable. Parsing is one-way normalization into JSON-serializable data: the tool reads JSON/YAML/XML and emits a normalized value, but it does not serialize back to YAML or XML (XML scalars are kept as strings).

Built with TypeScript 6 on Node.js (ESM, `NodeNext`, requires Node >= 20); tested with Vitest 4.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

## Docs

- [Test contract](docs/test-contract.md): Explains the input rules, parser logic, output shape, guardrails, and eval coverage.
