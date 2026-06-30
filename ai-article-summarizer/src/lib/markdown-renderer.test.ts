import { describe, expect, it } from 'vitest'

import {
  renderMarkdownDocument,
  renderMarkdownFragment,
  resolveMarkdownOutputPath,
} from './markdown-renderer'

describe('markdown renderer', () => {
  it('renders markdown into a complete styled HTML document', () => {
    const html = renderMarkdownDocument({
      markdown: '# 合并说明\n\n- 摘要\n- 转 HTML',
      title: '合并说明',
    })

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<title>合并说明</title>')
    expect(html).toContain('<h1>合并说明</h1>')
    expect(html).toContain('<li>摘要</li>')
    expect(html).toContain('<main>')
  })

  it('escapes raw HTML while allowing Markdown formatting', () => {
    const html = renderMarkdownFragment('Hello **world** <script>alert(1)</script>')

    expect(html).toContain('<strong>world</strong>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('highlights known code fences and escapes unknown code fences', () => {
    const html = renderMarkdownFragment('```ts\nconst name = "codex"\n```\n\n```wat\n<x>\n```')

    expect(html).toContain('language-ts')
    expect(html).toContain('hljs')
    expect(html).toContain('&lt;x&gt;')
  })

  it('resolves default and explicit output paths for markdown exports', () => {
    expect(resolveMarkdownOutputPath('/tmp/post.md')).toBe('/tmp/post.html')
    expect(resolveMarkdownOutputPath('/tmp/post.md', '/tmp/out/result.html')).toBe(
      '/tmp/out/result.html',
    )
  })
})
