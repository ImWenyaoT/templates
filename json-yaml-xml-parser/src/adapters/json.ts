import { wrapParseError } from '../errors.js'

/**
 * Parses a JSON document with the native JSON parser.
 */
export function parseJson(source: string): unknown {
  try {
    return JSON.parse(source)
  } catch (error) {
    throw wrapParseError('json', error)
  }
}
