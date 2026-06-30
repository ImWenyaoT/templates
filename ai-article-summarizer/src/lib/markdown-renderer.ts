import path from 'node:path'

import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'

type RenderMarkdownDocumentInput = {
  markdown: string
  title: string
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  shell: 'bash',
  sh: 'bash',
  ts: 'typescript',
  tsx: 'typescript',
}

const DEFAULT_STYLE = `
:root {
  color-scheme: light;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #20242a;
  background: #f5f7fb;
}

body {
  margin: 0;
  padding: 32px 18px;
}

main {
  max-width: 860px;
  margin: 0 auto;
  padding: 36px;
  background: #ffffff;
  border: 1px solid #d8dee8;
  border-radius: 8px;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  line-height: 1.25;
  margin: 1.35em 0 0.55em;
  color: #111827;
}

h1 {
  margin-top: 0;
  font-size: 2.1rem;
}

p,
li {
  line-height: 1.7;
}

ul,
ol {
  margin: 0.75em 0 1em;
  padding-left: 1.55rem;
}

li {
  padding-left: 0.25rem;
}

li + li {
  margin-top: 0.28em;
}

a {
  color: #0b63ce;
}

img {
  max-width: 100%;
  height: auto;
}

pre {
  overflow-x: auto;
  margin: 1.15em 0;
  padding: 18px 20px;
  background: #0f172a;
  color: #d6deeb;
  border: 1px solid #1e293b;
  border-radius: 8px;
}

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.94em;
}

p code,
li code {
  padding: 0.12em 0.34em;
  background: #eef2f7;
  border-radius: 4px;
}

pre code {
  display: block;
  padding: 0;
  background: transparent;
  color: inherit;
  line-height: 1.65;
  tab-size: 2;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-title.function_ {
  color: #c792ea;
}

.hljs-string,
.hljs-attr,
.hljs-template-string {
  color: #ecc48d;
}

.hljs-title,
.hljs-name,
.hljs-section {
  color: #82aaff;
}

.hljs-built_in,
.hljs-type,
.hljs-class .hljs-title {
  color: #ffcb6b;
}

.hljs-comment,
.hljs-quote {
  color: #637777;
  font-style: italic;
}

blockquote {
  margin-left: 0;
  padding-left: 16px;
  color: #4b5563;
  border-left: 4px solid #cbd5e1;
}
`.trim()

const markdownRenderer = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: highlightCode,
})

/**
 * Resolves the output HTML path for a Markdown export.
 */
export function resolveMarkdownOutputPath(inputPath: string, outputPath?: string): string {
  if (outputPath) {
    return path.resolve(outputPath)
  }

  const parsed = path.parse(path.resolve(inputPath))

  return path.join(parsed.dir, `${parsed.name}.html`)
}

/**
 * Renders Markdown into an embeddable HTML fragment.
 */
export function renderMarkdownFragment(markdown: string): string {
  return markdownRenderer.render(markdown)
}

/**
 * Renders Markdown into a complete, styled HTML document.
 */
export function renderMarkdownDocument(input: RenderMarkdownDocumentInput): string {
  const body = renderMarkdownFragment(input.markdown).trimEnd()
  const escapedTitle = escapeHtml(input.title)

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <style>
${DEFAULT_STYLE}
  </style>
</head>
<body>
  <main>
${body}
  </main>
</body>
</html>
`
}

/**
 * Highlights fenced code blocks when the declared language is known.
 */
function highlightCode(source: string, language: string): string {
  const normalizedLanguage = LANGUAGE_ALIASES[language] ?? language

  if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
    return hljs.highlight(source, {
      language: normalizedLanguage,
      ignoreIllegals: true,
    }).value
  }

  return escapeHtml(source)
}

/**
 * Escapes text before embedding it in generated HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
