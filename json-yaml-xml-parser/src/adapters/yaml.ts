import YAML from 'yaml'
import { wrapParseError } from '../errors.js'

/**
 * Parses a YAML document into JavaScript data.
 */
export function parseYaml(source: string): unknown {
  try {
    return YAML.parse(source)
  } catch (error) {
    throw wrapParseError('yaml', error)
  }
}
