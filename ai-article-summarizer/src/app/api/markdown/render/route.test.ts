import { describe, expect, it } from 'vitest'

import { POST } from './route'

describe('markdown render API', () => {
  it('returns rendered document and fragment for valid markdown', async () => {
    const response = await POST(
      new Request('http://localhost/api/markdown/render', {
        method: 'POST',
        body: JSON.stringify({
          markdown: '# 标题\n\n```ts\nconst value = 1\n```',
          title: 'Title',
        }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.data.document).toContain('<!doctype html>')
    expect(payload.data.fragment).toContain('<h1>标题</h1>')
    expect(payload.data.output_filename).toBe('title.html')
  })

  it('rejects empty or oversized markdown payloads', async () => {
    const emptyResponse = await POST(
      new Request('http://localhost/api/markdown/render', {
        method: 'POST',
        body: JSON.stringify({ markdown: ' ', title: 'Empty' }),
      }),
    )
    const oversizedResponse = await POST(
      new Request('http://localhost/api/markdown/render', {
        method: 'POST',
        body: JSON.stringify({ markdown: 'a'.repeat(200_001), title: 'Big' }),
      }),
    )

    expect(emptyResponse.status).toBe(400)
    expect(oversizedResponse.status).toBe(413)
  })
})
