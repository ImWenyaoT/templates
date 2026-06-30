import { describe, expect, it } from 'vitest'

import { serializeSummaryRecord } from './summary-serializer'
import type { Summary } from './schema'

describe('summary serializer', () => {
  it('maps database rows to the public API summary envelope', () => {
    const createdAt = new Date('2026-06-30T00:00:00.000Z')
    const record = {
      id: 'summary-1',
      url: 'https://example.com/article',
      title: 'Example',
      content: 'Excerpt',
      oneLine: 'One line',
      short: 'Short summary',
      detailed: 'Detailed summary',
      createdAt,
    } satisfies Summary

    expect(serializeSummaryRecord(record)).toEqual({
      id: 'summary-1',
      url: 'https://example.com/article',
      normalized_url: 'https://example.com/article',
      title: 'Example',
      excerpt: 'Excerpt',
      summaries: {
        one_line: 'One line',
        short: 'Short summary',
        detailed: 'Detailed summary',
      },
      status: 'completed',
      created_at: '2026-06-30T00:00:00.000Z',
      updated_at: '2026-06-30T00:00:00.000Z',
    })
  })
})
