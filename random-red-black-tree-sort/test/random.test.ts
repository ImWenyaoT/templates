import { describe, expect, it } from 'vitest'
import { createRandomInsertionOrder, range, shuffle } from '../src/random.js'

/**
 * Creates a deterministic pseudo-random function for repeatable shuffle tests.
 */
const seededRandom = (seed: number): (() => number) => {
  let state = seed

  return () => {
    state = (state * 16_807) % 2_147_483_647
    return (state - 1) / 2_147_483_646
  }
}

describe('range', () => {
  it('returns an empty array for zero count', () => {
    expect(range(0)).toEqual([])
  })

  it('returns an empty array for fractional counts below one', () => {
    expect(range(0.5)).toEqual([])
  })

  it('builds a zero-based ordered range', () => {
    expect(range(5)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('shuffle', () => {
  it('does not mutate the source array', () => {
    const source = [1, 2, 3, 4, 5]
    const shuffled = shuffle(source, seededRandom(123))

    expect(source).toEqual([1, 2, 3, 4, 5])
    expect(shuffled).not.toBe(source)
  })

  it('keeps every original value exactly once', () => {
    const source = range(100)
    const shuffled = shuffle(source, seededRandom(456))

    expect([...shuffled].sort((left, right) => left - right)).toEqual(source)
  })

  it('handles arrays containing undefined values', () => {
    const source = [1, undefined, 2, undefined, 3]
    const shuffled = shuffle(source, seededRandom(789))

    expect(shuffled).toHaveLength(source.length)
    expect(shuffled.filter((value) => value === undefined)).toHaveLength(2)
    expect(shuffled.filter((value): value is number => typeof value === 'number').sort()).toEqual([1, 2, 3])
  })

  it('is repeatable when supplied the same random source', () => {
    const source = range(20)

    expect(shuffle(source, seededRandom(42))).toEqual(shuffle(source, seededRandom(42)))
  })

  it('returns a new empty array when shuffling empty input', () => {
    const source: number[] = []
    const shuffled = shuffle(source, seededRandom(1))

    expect(shuffled).toEqual([])
    expect(shuffled).not.toBe(source)
  })
})

describe('createRandomInsertionOrder', () => {
  it('creates an empty insertion order for zero count', () => {
    expect(createRandomInsertionOrder(0)).toEqual([])
  })

  it('creates a permutation with the requested size', () => {
    const values = createRandomInsertionOrder(1_000)

    expect(values).toHaveLength(1_000)
    expect([...values].sort((left, right) => left - right)).toEqual(range(1_000))
  })
})
