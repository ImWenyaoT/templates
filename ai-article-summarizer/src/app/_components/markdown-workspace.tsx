'use client'

import { type FormEvent, useMemo, useState } from 'react'

type MarkdownRenderPayload = {
  ok: true
  data: {
    document: string
    fragment: string
    output_filename: string
  }
}

type MarkdownErrorPayload = {
  ok: false
  error: {
    message: string
  }
}

const SAMPLE_MARKDOWN = `# Markdown 导出示例

这部分来自合并后的 md2html 能力，可以把 Markdown 转成带样式的 HTML。

- 支持列表
- 支持链接：https://example.com
- 支持代码高亮

\`\`\`ts
const merged = true
\`\`\`
`

/**
 * Renders the in-browser Markdown to HTML conversion workspace.
 */
export function MarkdownWorkspace() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN)
  const [title, setTitle] = useState('Markdown 导出示例')
  const [documentHtml, setDocumentHtml] = useState('')
  const [fragmentHtml, setFragmentHtml] = useState('')
  const [outputFilename, setOutputFilename] = useState('markdown-export.html')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const previewSource = useMemo(
    () => documentHtml || buildPreviewDocument(fragmentHtml),
    [documentHtml, fragmentHtml],
  )

  /**
   * Calls the Markdown render API and stores both full-document and fragment HTML.
   */
  async function handleRender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const response = await fetch('/api/markdown/render', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ markdown, title }),
      })
      const payload = (await response.json()) as MarkdownRenderPayload | MarkdownErrorPayload

      if (!response.ok || !payload.ok) {
        setStatus('error')
        setError(payload.ok ? 'Markdown 转换失败。' : payload.error.message)
        return
      }

      setDocumentHtml(payload.data.document)
      setFragmentHtml(payload.data.fragment)
      setOutputFilename(payload.data.output_filename)
      setStatus('success')
    } catch {
      setStatus('error')
      setError('无法连接 Markdown 转换服务。')
    }
  }

  /**
   * Downloads the rendered full HTML document as a local file.
   */
  function handleDownload() {
    if (!documentHtml) {
      return
    }

    const blob = new Blob([documentHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = outputFilename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-normal text-stone-950 sm:text-3xl">
          Markdown 转 HTML
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">
          将 md2html 的命令行转换能力并入当前应用，用于把摘要、笔记或文档片段导出为带样式的 HTML。
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleRender}>
          <label className="text-sm font-medium text-stone-800" htmlFor="markdown-title">
            文档标题
          </label>
          <input
            className="mt-2 min-h-11 w-full rounded-md border border-stone-300 bg-stone-50 px-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            id="markdown-title"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />

          <label className="mt-4 block text-sm font-medium text-stone-800" htmlFor="markdown-source">
            Markdown 内容
          </label>
          <textarea
            className="mt-2 min-h-[440px] w-full resize-y rounded-md border border-stone-300 bg-stone-50 px-3 py-3 font-mono text-sm leading-6 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            id="markdown-source"
            onChange={(event) => setMarkdown(event.target.value)}
            value={markdown}
          />

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={status === 'loading'}
              type="submit"
            >
              {status === 'loading' ? '转换中...' : '转换 HTML'}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400"
              disabled={!documentHtml}
              onClick={handleDownload}
              type="button"
            >
              下载 HTML
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-stone-950">HTML 预览</h2>
            <p className="mt-1 text-xs text-stone-500">{status === 'success' ? outputFilename : '转换后显示完整文档预览'}</p>
          </div>
          <iframe
            className="h-[580px] w-full bg-white"
            sandbox=""
            srcDoc={previewSource}
            title="Markdown HTML 预览"
          />
        </div>
      </section>
    </div>
  )
}

/**
 * Builds an empty preview shell before the first API render result exists.
 */
function buildPreviewDocument(fragmentHtml: string): string {
  return `<!doctype html><html lang="zh-CN"><body>${fragmentHtml || '<p style="font-family: sans-serif; color: #78716c;">点击转换后显示 HTML 预览。</p>'}</body></html>`
}
