import type { DataFormat } from './types.js'

export type ParserErrorOptions = {
  format?: DataFormat
  cause?: unknown
}

export class ParserError extends Error {
  format?: DataFormat

  /**
   * Creates a parser error with optional format and original error context.
   * The original error is forwarded to the native Error `cause` chain.
   */
  constructor(message: string, options: ParserErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause })
    this.name = 'ParserError'
    this.format = options.format
  }
}

/**
 * Wraps any thrown value into a ParserError tagged with the format and original cause.
 * Centralizes the identical catch handling shared by the JSON, YAML, and XML adapters.
 */
export function wrapParseError(format: DataFormat, error: unknown): ParserError {
  const detail = error instanceof Error ? error.message : String(error)
  return new ParserError(`Failed to parse ${format.toUpperCase()}: ${detail}`, {
    format,
    cause: error
  })
}
