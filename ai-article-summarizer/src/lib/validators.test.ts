import { describe, expect, it } from 'vitest'

import { AppError } from './errors'
import { parseArticleUrl } from './validators'

describe('article URL parser', () => {
  it('accepts http and https URLs and strips hash fragments', () => {
    expect(parseArticleUrl(' https://example.com/post#section ').toString()).toBe(
      'https://example.com/post',
    )
    expect(parseArticleUrl('http://example.com/post').protocol).toBe('http:')
  })

  it('rejects unsupported protocols, credentials, empty values, and overlong input', () => {
    expect(() => parseArticleUrl('file:///etc/passwd')).toThrow(AppError)
    expect(() => parseArticleUrl('https://user:pass@example.com')).toThrow(AppError)
    expect(() => parseArticleUrl('')).toThrow(AppError)
    expect(() => parseArticleUrl(`https://example.com/${'a'.repeat(2050)}`)).toThrow(
      AppError,
    )
  })
})
