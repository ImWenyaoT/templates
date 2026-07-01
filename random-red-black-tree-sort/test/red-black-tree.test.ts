import { describe, expect, it } from 'vitest'
import { createRandomInsertionOrder } from '../src/random.js'
import { RedBlackTree } from '../src/red-black-tree.js'

/**
 * Orders numbers ascending (negative when left precedes right).
 */
const numberComparator = (left: number, right: number): number => left - right

/**
 * Returns the textbook upper bound on red-black tree height for a given size.
 */
const logarithmicHeightLimit = (size: number): number =>
  2 * Math.ceil(Math.log2(size + 1))

/**
 * Creates a deterministic pseudo-random function so a 10k workload is reproducible.
 */
const seededRandom = (seed: number): (() => number) => {
  let state = seed

  return () => {
    state = (state * 16_807) % 2_147_483_647
    return (state - 1) / 2_147_483_646
  }
}

/**
 * Builds a tree from the supplied values.
 */
const buildTree = (values: readonly number[]): RedBlackTree<number> => {
  const tree = new RedBlackTree(numberComparator)
  values.forEach((value) => tree.insert(value))
  return tree
}

/**
 * Checks whether the array is sorted in nondecreasing order.
 */
const isSorted = (values: readonly number[]): boolean =>
  values.every((value, index) => index === 0 || values[index - 1]! <= value)

/**
 * Asserts the common correctness contract for a tree built from numeric values.
 */
const expectValidSortedTree = (values: readonly number[]): void => {
  const tree = buildTree(values)
  const sorted = tree.toArray()
  const validation = tree.validate()

  expect(sorted).toHaveLength(values.length)
  expect(sorted).toEqual([...values].sort(numberComparator))
  expect(validation.errors).toEqual([])
  expect(validation.valid).toBe(true)
  expect(tree.size()).toBe(values.length)

  if (values.length > 0) {
    expect(tree.height()).toBeLessThanOrEqual(logarithmicHeightLimit(values.length))
  }
}

describe('RedBlackTree', () => {
  it('starts empty with zero height and zero metrics', () => {
    const tree = new RedBlackTree(numberComparator)

    expect(tree.toArray()).toEqual([])
    expect(tree.size()).toBe(0)
    expect(tree.height()).toBe(0)
    expect(tree.metrics()).toEqual({
      rotations: 0,
      recolors: 0,
      insertions: 0
    })
    expect(tree.validate()).toEqual({
      valid: true,
      blackHeight: 1,
      errors: []
    })
  })

  it('keeps a single inserted root valid and black-height consistent', () => {
    const tree = buildTree([42])

    expect(tree.toArray()).toEqual([42])
    expect(tree.height()).toBe(1)
    expect(tree.size()).toBe(1)
    expect(tree.validate()).toEqual({
      valid: true,
      blackHeight: 2,
      errors: []
    })
  })

  it('sorts inserted values with in-order traversal', () => {
    const tree = buildTree([7, 3, 18, 10, 22, 8, 11, 26])

    expect(tree.toArray()).toEqual([3, 7, 8, 10, 11, 18, 22, 26])
  })

  it('sorts negative, zero, and positive values', () => {
    expectValidSortedTree([0, -10, 4, -3, 12, 8, -1])
  })

  it('allows duplicate values while preserving sorted order', () => {
    const tree = buildTree([5, 1, 5, 3, 1])

    expect(tree.toArray()).toEqual([1, 1, 3, 5, 5])
    expect(tree.size()).toBe(5)
    expect(tree.metrics().insertions).toBe(5)
  })

  it('keeps heavy duplicate input valid', () => {
    expectValidSortedTree([8, 8, 8, 8, 3, 3, 12, 12, 1, 1, 20, 20])
  })

  it('supports descending input without degenerating into a linked list', () => {
    const values = Array.from({ length: 256 }, (_, index) => 255 - index)

    expectValidSortedTree(values)
  })

  it('supports a custom comparator for object values', () => {
    interface RecordValue {
      readonly id: string
      readonly score: number
    }

    const tree = new RedBlackTree<RecordValue>((left, right) => left.score - right.score)
    const values = [
      { id: 'middle', score: 50 },
      { id: 'low', score: 10 },
      { id: 'high', score: 90 },
      { id: 'also-middle', score: 50 }
    ]

    values.forEach((value) => tree.insert(value))

    expect(tree.toArray().map((value) => value.id)).toEqual(['low', 'middle', 'also-middle', 'high'])
    expect(tree.validate().valid).toBe(true)
  })

  it('supports string values with a locale comparator', () => {
    const tree = new RedBlackTree<string>((left, right) => left.localeCompare(right))
    const values = ['delta', 'alpha', 'charlie', 'bravo', 'alpha']

    values.forEach((value) => tree.insert(value))

    expect(tree.toArray()).toEqual(['alpha', 'alpha', 'bravo', 'charlie', 'delta'])
    expect(tree.validate().valid).toBe(true)
  })

  it('performs a left rotation for a simple increasing triplet', () => {
    const tree = buildTree([1, 2, 3])

    expect(tree.toArray()).toEqual([1, 2, 3])
    expect(tree.height()).toBe(2)
    expect(tree.metrics().rotations).toBe(1)
    expect(tree.validate().valid).toBe(true)
  })

  it('performs a right rotation for a simple decreasing triplet', () => {
    const tree = buildTree([3, 2, 1])

    expect(tree.toArray()).toEqual([1, 2, 3])
    expect(tree.height()).toBe(2)
    expect(tree.metrics().rotations).toBe(1)
    expect(tree.validate().valid).toBe(true)
  })

  it('performs a left-right rotation for a zig-zag triplet', () => {
    const tree = buildTree([3, 1, 2])

    expect(tree.toArray()).toEqual([1, 2, 3])
    expect(tree.height()).toBe(2)
    expect(tree.metrics().rotations).toBe(2)
    expect(tree.validate().valid).toBe(true)
  })

  it('performs a right-left rotation for a mirrored zig-zag triplet', () => {
    const tree = buildTree([1, 3, 2])

    expect(tree.toArray()).toEqual([1, 2, 3])
    expect(tree.height()).toBe(2)
    expect(tree.metrics().rotations).toBe(2)
    expect(tree.validate().valid).toBe(true)
  })

  it('keeps red-black invariants after sequential insertions', () => {
    const tree = buildTree(Array.from({ length: 1_000 }, (_, index) => index))
    const validation = tree.validate()

    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
    expect(tree.height()).toBeLessThanOrEqual(logarithmicHeightLimit(tree.size()))
  })

  it('keeps red-black invariants after every insertion in a mixed workload', () => {
    const tree = new RedBlackTree(numberComparator)
    const values = [17, 4, 29, 1, 9, 22, 31, 7, 12, 20, 24, 30, 35]

    values.forEach((value, index) => {
      tree.insert(value)

      const validation = tree.validate()
      expect(validation.errors).toEqual([])
      expect(validation.valid).toBe(true)
      expect(tree.size()).toBe(index + 1)
      expect(tree.toArray()).toEqual(values.slice(0, index + 1).sort(numberComparator))
    })
  })

  it('keeps red-black invariants after reverse sequential insertions', () => {
    const values = Array.from({ length: 1_000 }, (_, index) => 999 - index)
    const tree = buildTree(values)
    const validation = tree.validate()

    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
    expect(tree.height()).toBeLessThanOrEqual(logarithmicHeightLimit(tree.size()))
  })

  it('tracks insertions, rotations, and recolors for balancing-heavy input', () => {
    const tree = buildTree(Array.from({ length: 128 }, (_, index) => index))
    const metrics = tree.metrics()

    expect(metrics.insertions).toBe(128)
    expect(metrics.rotations).toBeGreaterThan(0)
    expect(metrics.recolors).toBeGreaterThan(0)
    expect(metrics.rotations).toBeLessThan(metrics.insertions)
  })

  it('sorts 10,000 randomly ordered values', () => {
    const values = createRandomInsertionOrder(10_000)
    const tree = buildTree(values)
    const sorted = tree.toArray()
    const validation = tree.validate()

    expect(sorted).toHaveLength(10_000)
    expect(sorted[0]).toBe(0)
    expect(sorted.at(-1)).toBe(9_999)
    expect(isSorted(sorted)).toBe(true)
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
    expect(tree.height()).toBeLessThanOrEqual(logarithmicHeightLimit(tree.size()))
  })

  it('reproduces the same 10,000-element random order from a fixed seed', () => {
    const first = createRandomInsertionOrder(10_000, seededRandom(2024))
    const second = createRandomInsertionOrder(10_000, seededRandom(2024))

    expect(first).toEqual(second)

    const tree = buildTree(first)
    const sorted = tree.toArray()

    expect(sorted).toHaveLength(10_000)
    expect(isSorted(sorted)).toBe(true)
    expect(tree.validate().valid).toBe(true)
    expect(tree.height()).toBeLessThanOrEqual(logarithmicHeightLimit(tree.size()))
  })

  it('stays valid across several fixed shuffled workloads', () => {
    const workloads = [
      [11, 4, 22, 7, 15, 1, 30, 19, 3, 9],
      [40, 10, 70, 20, 60, 80, 50, 30, 90, 0],
      [6, 2, 8, 1, 4, 7, 9, 3, 5, 0],
      [13, 21, 5, 34, 2, 8, 1, 55, 3, 89]
    ]

    workloads.forEach(expectValidSortedTree)
  })

  it('sorts sparse large and small numeric values', () => {
    expectValidSortedTree([
      Number.MAX_SAFE_INTEGER,
      -1_000_000,
      42,
      0,
      7_777,
      Number.MIN_SAFE_INTEGER + 1
    ])
  })
})
