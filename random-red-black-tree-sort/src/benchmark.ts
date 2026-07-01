export interface TimedResult<T> {
  readonly value: T
  readonly elapsedMs: number
}

/**
 * Runs a function and measures its elapsed wall-clock time in milliseconds.
 */
export const time = <T>(operation: () => T): TimedResult<T> => {
  const start = performance.now()
  const value = operation()
  const elapsedMs = performance.now() - start

  return {
    value,
    elapsedMs
  }
}

/**
 * Formats a millisecond value for compact CLI output.
 */
export const formatMs = (elapsedMs: number): string =>
  `${elapsedMs.toFixed(2)}ms`
