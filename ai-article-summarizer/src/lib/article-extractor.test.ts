import { describe, expect, it } from 'vitest'

import { AppError } from './errors'
import { extractArticle } from './article-extractor'

const longParagraph = '这是用于测试正文抽取的段落，包含足够多的中文字符来满足最小正文长度要求。'.repeat(12)

describe('article extractor', () => {
  it('prefers article content and removes navigation noise', () => {
    const article = extractArticle(`
      <html>
        <head><meta property="og:title" content="测试文章 &amp; 标题"></head>
        <body>
          <nav>导航内容不应进入正文</nav>
          <article>
            <h1>测试文章</h1>
            <p>${longParagraph}</p>
            <aside>侧栏内容不应进入正文</aside>
          </article>
        </body>
      </html>
    `)

    expect(article.title).toBe('测试文章 & 标题')
    expect(article.text).toContain('测试文章')
    expect(article.text).toContain('足够多的中文字符')
    expect(article.text).not.toContain('导航内容')
    expect(article.text).not.toContain('侧栏内容')
    expect(article.excerpt.length).toBeLessThanOrEqual(280)
  })

  it('rejects pages without enough readable article text', () => {
    expect(() => extractArticle('<html><body><main>太短</main></body></html>')).toThrow(
      AppError,
    )
  })
})
