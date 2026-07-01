/**
 * Builds an ordered range from 0 up to count - 1.
 */
export const range = (count: number): number[] =>
  Array.from({ length: count }, (_, index) => index)

/**
 * Returns a shuffled copy of the supplied values using Fisher-Yates.
 */
export const shuffle = <T>(values: readonly T[], random = Math.random): T[] => {
  const shuffled = [...values]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index] as T
    const swap = shuffled[swapIndex] as T

    shuffled[index] = swap
    shuffled[swapIndex] = current
  }

  return shuffled
}

/**
 * Creates count unique numbers and randomizes their insertion order.
 * Accepts an injectable random source so callers (and tests) can reproduce a run.
 */
export const createRandomInsertionOrder = (count: number, random = Math.random): number[] =>
  shuffle(range(count), random)
