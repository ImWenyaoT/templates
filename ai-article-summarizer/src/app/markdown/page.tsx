import type { Metadata } from 'next'

import { MarkdownWorkspace } from '../_components/markdown-workspace'
import { createPageMetadata } from '../seo'

export const metadata: Metadata = createPageMetadata({
  title: 'Markdown 转 HTML | AI Article Summarizer',
  description: '将 Markdown 内容转换成带样式和代码高亮的 HTML 文档。',
  path: '/markdown',
})

/**
 * Renders the Markdown conversion tool page.
 */
export default function MarkdownPage() {
  return <MarkdownWorkspace />
}
