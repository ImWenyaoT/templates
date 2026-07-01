import { describe, expect, it } from 'vitest'
import { detectFormat, isDataFormat, parseData, parseDocument, ParserError } from '../src/index.js'
import { toSerializableValue } from '../src/serializable.js'

describe('detectFormat', () => {
  it('detects supported file extensions', () => {
    expect(detectFormat('config.json')).toBe('json')
    expect(detectFormat('config.yaml')).toBe('yaml')
    expect(detectFormat('config.yml')).toBe('yaml')
    expect(detectFormat('config.xml')).toBe('xml')
  })

  it('allows explicit format overrides', () => {
    expect(detectFormat('config.txt', 'json')).toBe('json')
  })

  it('uses explicit format overrides even when no path is available', () => {
    expect(detectFormat(undefined, 'yaml')).toBe('yaml')
  })

  it('normalizes explicit format overrides case-insensitively', () => {
    expect(detectFormat('config.txt', 'JSON')).toBe('json')
    expect(detectFormat('config.txt', 'YaMl')).toBe('yaml')
    expect(detectFormat('config.txt', 'XML')).toBe('xml')
  })

  it('detects extensions case-insensitively', () => {
    expect(detectFormat('CONFIG.JSON')).toBe('json')
    expect(detectFormat('CONFIG.YML')).toBe('yaml')
    expect(detectFormat('CONFIG.XML')).toBe('xml')
  })

  it('rejects missing paths when no explicit format is provided', () => {
    expect(() => detectFormat()).toThrow('Unable to detect format')
  })

  it('rejects unknown extensions', () => {
    expect(() => detectFormat('config.toml')).toThrow(ParserError)
  })

  it('rejects paths without extensions with a readable message', () => {
    expect(() => detectFormat('Dockerfile')).toThrow('Unsupported file extension "(none)"')
  })

  it('rejects unsupported explicit formats', () => {
    expect(() => detectFormat('config.json', 'toml')).toThrow(ParserError)
  })
})

describe('isDataFormat', () => {
  it('accepts supported formats case-insensitively', () => {
    expect(isDataFormat('json')).toBe(true)
    expect(isDataFormat('YAML')).toBe(true)
    expect(isDataFormat('Xml')).toBe(true)
  })

  it('rejects unsupported formats', () => {
    expect(isDataFormat('toml')).toBe(false)
    expect(isDataFormat('')).toBe(false)
  })
})

describe('parseData', () => {
  it('parses JSON objects, arrays, and primitives', () => {
    expect(parseData('{"name":"Ada","scores":[1,2],"active":true}', { format: 'json' })).toEqual({
      name: 'Ada',
      scores: [1, 2],
      active: true
    })
    expect(parseData('"ready"', { format: 'json' })).toBe('ready')
  })

  it('parses JSON null and arrays at the document root', () => {
    expect(parseData('null', { format: 'json' })).toBeNull()
    expect(parseData('[{"name":"Ada"},{"name":"Grace"}]', { format: 'json' })).toEqual([
      { name: 'Ada' },
      { name: 'Grace' }
    ])
  })

  it('parses JSON using a source path when no explicit format is given', () => {
    expect(parseData('{"from":"path"}', { sourcePath: 'input.json' })).toEqual({ from: 'path' })
  })

  it('parses numbers and nested arrays without changing JSON semantics', () => {
    expect(parseData('{"count":3,"matrix":[[1,2],[3,4]]}', { format: 'json' })).toEqual({
      count: 3,
      matrix: [
        [1, 2],
        [3, 4]
      ]
    })
  })

  it('wraps invalid JSON errors', () => {
    expect(() => parseData('{"name":', { format: 'json' })).toThrow('Failed to parse JSON')
  })

  it('forwards the original error onto the ParserError cause chain', () => {
    try {
      parseData('{"name":', { format: 'json' })
      expect.unreachable('parsing invalid JSON should throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ParserError)
      expect((error as ParserError).format).toBe('json')
      expect((error as ParserError).cause).toBeInstanceOf(SyntaxError)
    }
  })

  it('parses YAML objects and nested arrays', () => {
    const data = parseData('name: Ada\nitems:\n  - json\n  - yaml\n', { format: 'yaml' })

    expect(data).toEqual({
      name: 'Ada',
      items: ['json', 'yaml']
    })
  })

  it('parses YAML scalars and nulls', () => {
    expect(parseData('true\n', { format: 'yaml' })).toBe(true)
    expect(parseData('null\n', { format: 'yaml' })).toBeNull()
  })

  it('parses YAML arrays at the document root', () => {
    const data = parseData('- json\n- yaml\n- xml\n', { format: 'yaml' })

    expect(data).toEqual(['json', 'yaml', 'xml'])
  })

  it('parses YAML nested maps and numbers', () => {
    const data = parseData('service:\n  port: 8080\n  tags:\n    - api\n    - test\n', { format: 'yaml' })

    expect(data).toEqual({
      service: {
        port: 8080,
        tags: ['api', 'test']
      }
    })
  })

  it('parses YAML through .yml source path detection', () => {
    const data = parseData('enabled: true\n', { sourcePath: 'config.yml' })

    expect(data).toEqual({ enabled: true })
  })

  it('wraps invalid YAML errors', () => {
    expect(() => parseData('name: [unterminated', { format: 'yaml' })).toThrow('Failed to parse YAML')
  })

  it('parses XML with attributes and text nodes preserved', () => {
    const data = parseData('<user id="1"><name>Ada</name><role>admin</role></user>', { format: 'xml' })

    expect(data).toEqual({
      user: {
        $attributes: {
          id: '1'
        },
        name: {
          $text: 'Ada'
        },
        role: {
          $text: 'admin'
        }
      }
    })
  })

  it('keeps XML root text and attributes together', () => {
    const data = parseData('<user id="1" role="admin">Ada</user>', { format: 'xml' })

    expect(data).toEqual({
      user: {
        $attributes: {
          id: '1',
          role: 'admin'
        },
        $text: 'Ada'
      }
    })
  })

  it('preserves nested XML attributes without parsing attribute values', () => {
    const data = parseData('<settings><flag enabled="true">yes</flag><count value="42" /></settings>', { format: 'xml' })

    expect(data).toEqual({
      settings: {
        flag: {
          $attributes: {
            enabled: 'true'
          },
          $text: 'yes'
        },
        count: {
          $attributes: {
            value: '42'
          },
          $text: ''
        }
      }
    })
  })

  it('keeps repeated XML child elements as arrays', () => {
    const data = parseData('<tags><tag>json</tag><tag>yaml</tag></tags>', { format: 'xml' })

    expect(data).toEqual({
      tags: {
        tag: [
          {
            $text: 'json'
          },
          {
            $text: 'yaml'
          }
        ]
      }
    })
  })

  it('keeps nested repeated XML children under their parent element', () => {
    const data = parseData('<feed><item><tag>a</tag><tag>b</tag></item></feed>', { format: 'xml' })

    expect(data).toEqual({
      feed: {
        item: {
          tag: [
            {
              $text: 'a'
            },
            {
              $text: 'b'
            }
          ]
        }
      }
    })
  })

  it('ignores XML declarations while preserving the document element', () => {
    const data = parseData('<?xml version="1.0"?><root><name>Ada</name></root>', { format: 'xml' })

    expect(data).toEqual({
      root: {
        name: {
          $text: 'Ada'
        }
      }
    })
  })

  it('parses XML using a source path when no explicit format is given', () => {
    expect(parseData('<root>ok</root>', { sourcePath: 'input.xml' })).toEqual({
      root: {
        $text: 'ok'
      }
    })
  })

  it('wraps invalid XML errors', () => {
    expect(() => parseData('<user><name>Ada</user>', { format: 'xml' })).toThrow('Failed to parse XML')
  })
})

describe('parseDocument', () => {
  it('returns parser metadata with data', () => {
    expect(parseDocument('{"ok":true}', { sourcePath: 'input.json' })).toEqual({
      format: 'json',
      data: {
        ok: true
      },
      sourcePath: 'input.json'
    })
  })

  it('omits sourcePath metadata when the caller only passes a format', () => {
    expect(parseDocument('{"ok":true}', { format: 'json' })).toEqual({
      format: 'json',
      data: {
        ok: true
      }
    })
  })

  it('lets explicit format override the source path extension', () => {
    expect(parseDocument('name: Ada\n', { sourcePath: 'input.json', format: 'yaml' })).toEqual({
      format: 'yaml',
      data: {
        name: 'Ada'
      },
      sourcePath: 'input.json'
    })
  })
})

describe('toSerializableValue', () => {
  it('converts undefined object values by omitting them', () => {
    expect(toSerializableValue({ keep: 'yes', drop: undefined })).toEqual({
      keep: 'yes'
    })
  })

  it('converts undefined array items to null', () => {
    expect(toSerializableValue(['a', undefined, 'c'])).toEqual(['a', null, 'c'])
  })

  it('converts Date values to ISO strings', () => {
    expect(toSerializableValue({ createdAt: new Date('2026-06-17T00:00:00.000Z') })).toEqual({
      createdAt: '2026-06-17T00:00:00.000Z'
    })
  })

  it('rejects non-finite numbers', () => {
    expect(() => toSerializableValue(Number.NaN)).toThrow('Non-finite number')
    expect(() => toSerializableValue(Number.POSITIVE_INFINITY)).toThrow('Non-finite number')
  })

  it('reports nested non-finite number paths', () => {
    expect(() => toSerializableValue({ metrics: [{ value: Number.NEGATIVE_INFINITY }] })).toThrow(
      'value.metrics[0].value'
    )
  })

  it('rejects unsupported primitive types', () => {
    expect(() => toSerializableValue(Symbol('bad'))).toThrow('Unsupported value')
    expect(() => toSerializableValue(1n)).toThrow('Unsupported value')
  })
})
