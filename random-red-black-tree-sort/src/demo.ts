import { formatMs, time } from './benchmark.js'
import { createRandomInsertionOrder } from './random.js'
import { RedBlackTree } from './red-black-tree.js'

export interface DemoResult {
  readonly elementCount: number
  readonly inserted: number
  readonly insertTimeMs: number
  readonly traversalTimeMs: number
  readonly treeHeight: number
  readonly rotations: number
  readonly recolors: number
  readonly validRedBlackTree: boolean
  readonly blackHeight: number
  readonly sortedOutput: boolean
  readonly firstValues: number[]
  readonly lastValues: number[]
  readonly validationErrors: string[]
}

/**
 * Orders numbers ascending (negative when left precedes right).
 */
const numberComparator = (left: number, right: number): number => left - right

/**
 * Checks whether the array is sorted in nondecreasing order.
 */
export const isSorted = (values: readonly number[]): boolean =>
  values.every((value, index) => index === 0 || values[index - 1]! <= value)

/**
 * Runs the random insertion red-black tree sorting workload and returns metrics.
 * The random source is injectable so a run can be reproduced deterministically.
 */
export const runDemo = (elementCount = 10_000, random = Math.random): DemoResult => {
  const insertionOrder = createRandomInsertionOrder(elementCount, random)
  const tree = new RedBlackTree(numberComparator)

  const insertTiming = time(() => {
    insertionOrder.forEach((value) => tree.insert(value))
  })

  const traversalTiming = time(() => tree.toArray())
  const sortedValues = traversalTiming.value
  const validation = tree.validate()
  const metrics = tree.metrics()

  return {
    elementCount,
    inserted: metrics.insertions,
    insertTimeMs: insertTiming.elapsedMs,
    traversalTimeMs: traversalTiming.elapsedMs,
    treeHeight: tree.height(),
    rotations: metrics.rotations,
    recolors: metrics.recolors,
    validRedBlackTree: validation.valid,
    blackHeight: validation.blackHeight,
    sortedOutput: isSorted(sortedValues),
    firstValues: sortedValues.slice(0, 10),
    lastValues: sortedValues.slice(-10),
    validationErrors: validation.errors
  }
}

/**
 * Formats a demo result for human-readable CLI output.
 */
export const formatDemoResult = (result: DemoResult): string => {
  const lines = [
    'Red-black tree random insertion sort',
    `Elements: ${result.elementCount}`,
    `Inserted: ${result.inserted}`,
    `Insert time: ${formatMs(result.insertTimeMs)}`,
    `Traversal time: ${formatMs(result.traversalTimeMs)}`,
    `Tree height: ${result.treeHeight}`,
    `Rotations: ${result.rotations}`,
    `Recolors: ${result.recolors}`,
    `Valid red-black tree: ${result.validRedBlackTree}`,
    `Black height: ${result.blackHeight}`,
    `Sorted output: ${result.sortedOutput}`,
    `First 10 values: ${result.firstValues.join(', ')}`,
    `Last 10 values: ${result.lastValues.join(', ')}`
  ]

  return lines.join('\n')
}
