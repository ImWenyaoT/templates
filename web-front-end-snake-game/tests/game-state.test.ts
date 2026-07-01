import { describe, expect, it } from 'vitest'
import { defaultGameConfig } from '../src/game/config'
import {
  createInitialState,
  isOppositeDirection,
  isOutsideBoard,
  pointIsOnSnake,
  pointsAreEqual,
  reduceAction,
  stepGame
} from '../src/game/state'
import type { Direction, GameConfig, GameState, Point } from '../src/game/types'

const testConfig: GameConfig = {
  ...defaultGameConfig,
  gridSize: 8,
  initialLength: 3,
  tickMs: 100,
  pointsPerFood: 10,
  startSeed: 7
}

/**
 * 用局部覆盖构造测试状态，避免每个用例重复完整字段。
 */
function buildState(overrides: Partial<GameState> = {}): GameState {
  return {
    snake: [
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 }
    ],
    direction: 'right',
    pendingDirection: 'right',
    food: { x: 6, y: 6 },
    score: 0,
    bestScore: 0,
    status: 'running',
    rngSeed: 123,
    event: { type: 'none' },
    ...overrides
  }
}

describe('game state', () => {
  it('creates an idle initial state with snake, food and best score', () => {
    const state = createInitialState(testConfig, 40)

    expect(state.status).toBe('idle')
    expect(state.snake).toHaveLength(3)
    expect(state.direction).toBe('right')
    expect(state.bestScore).toBe(40)
    expect(state.food).not.toEqual(state.snake[0])
  })

  it('accepts legal turns and rejects immediate reversals', () => {
    const state = buildState()
    const turned = reduceAction(state, 'move-up', testConfig)
    const reversed = reduceAction(state, 'move-left', testConfig)

    expect(turned.pendingDirection).toBe('up')
    expect(reversed.pendingDirection).toBe('right')
  })

  it.each<[Direction, Direction]>([
    ['up', 'down'],
    ['down', 'up'],
    ['left', 'right'],
    ['right', 'left']
  ])('detects %s to %s as an opposite direction', (current, next) => {
    expect(isOppositeDirection(current, next)).toBe(true)
  })

  it.each<[Direction, Direction]>([
    ['up', 'left'],
    ['down', 'right'],
    ['left', 'up'],
    ['right', 'down']
  ])('does not treat %s to %s as an opposite direction', (current, next) => {
    expect(isOppositeDirection(current, next)).toBe(false)
  })

  it('starts, pauses, and resumes with explicit events', () => {
    const idle = createInitialState(testConfig, 20)
    const running = reduceAction(idle, 'start', testConfig)
    const paused = reduceAction(running, 'pause', testConfig)
    const resumedByPause = reduceAction(paused, 'pause', testConfig)
    const pausedAgain = reduceAction(resumedByPause, 'pause', testConfig)
    const resumedByStart = reduceAction(pausedAgain, 'start', testConfig)

    expect(running.status).toBe('running')
    expect(running.event).toEqual({ type: 'started' })
    expect(paused.status).toBe('paused')
    expect(paused.event).toEqual({ type: 'paused' })
    expect(resumedByPause.status).toBe('running')
    expect(resumedByPause.event).toEqual({ type: 'resumed' })
    expect(resumedByStart.status).toBe('running')
    expect(resumedByStart.event).toEqual({ type: 'resumed' })
  })

  it('ignores movement and pause actions after game over', () => {
    const state = buildState({
      status: 'game-over',
      pendingDirection: 'right'
    })

    expect(reduceAction(state, 'move-up', testConfig)).toBe(state)
    expect(reduceAction(state, 'pause', testConfig)).toEqual(state)
  })

  it('moves one cell on each running tick', () => {
    const state = buildState()
    const nextState = stepGame(state, testConfig)

    expect(nextState.snake[0]).toEqual({ x: 4, y: 3 })
    expect(nextState.snake).toHaveLength(3)
    expect(nextState.status).toBe('running')
  })

  it('applies a pending turn on the next tick', () => {
    const state = reduceAction(buildState(), 'move-up', testConfig)
    const nextState = stepGame(state, testConfig)

    expect(nextState.direction).toBe('up')
    expect(nextState.pendingDirection).toBe('up')
    expect(nextState.snake[0]).toEqual({ x: 3, y: 2 })
  })

  it('allows moving into the previous tail cell when not eating', () => {
    const state = buildState({
      snake: [
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
        { x: 2, y: 3 }
      ],
      direction: 'up',
      pendingDirection: 'left',
      food: { x: 7, y: 7 }
    })
    const nextState = stepGame(state, testConfig)

    expect(nextState.status).toBe('running')
    expect(nextState.snake[0]).toEqual({ x: 2, y: 3 })
    expect(nextState.snake).toHaveLength(4)
  })

  it('grows and scores when eating food', () => {
    const state = buildState({
      food: { x: 4, y: 3 }
    })
    const nextState = stepGame(state, testConfig)

    expect(nextState.snake[0]).toEqual({ x: 4, y: 3 })
    expect(nextState.snake).toHaveLength(4)
    expect(nextState.score).toBe(10)
    expect(nextState.bestScore).toBe(10)
    expect(nextState.event).toEqual({ type: 'ate-food' })
  })

  it('keeps an existing higher best score after eating food', () => {
    const state = buildState({
      bestScore: 50,
      food: { x: 4, y: 3 }
    })
    const nextState = stepGame(state, testConfig)

    expect(nextState.score).toBe(10)
    expect(nextState.bestScore).toBe(50)
  })

  it('places food on the head when the board becomes full', () => {
    const fullBoardConfig: GameConfig = {
      ...testConfig,
      gridSize: 2,
      initialLength: 1
    }
    const state = buildState({
      snake: [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ],
      direction: 'right',
      pendingDirection: 'right',
      food: { x: 1, y: 0 }
    })
    const nextState = stepGame(state, fullBoardConfig)

    expect(nextState.snake).toHaveLength(4)
    expect(nextState.food).toEqual(nextState.snake[0])
    expect(nextState.status).toBe('running')
  })

  it('ends the game when the snake hits a wall', () => {
    const state = buildState({
      snake: [
        { x: 7, y: 3 },
        { x: 6, y: 3 },
        { x: 5, y: 3 }
      ],
      score: 20
    })
    const nextState = stepGame(state, testConfig)

    expect(nextState.status).toBe('game-over')
    expect(nextState.bestScore).toBe(20)
    expect(nextState.event).toEqual({ type: 'game-over' })
  })

  it('ends the game when the snake hits itself', () => {
    const state = buildState({
      snake: [
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
        { x: 2, y: 3 },
        { x: 3, y: 3 }
      ],
      direction: 'up',
      pendingDirection: 'down'
    })
    const nextState = stepGame(state, testConfig)

    expect(nextState.status).toBe('game-over')
  })

  it('does not move while paused', () => {
    const state = buildState({
      status: 'paused'
    })
    const nextState = stepGame(state, testConfig)

    expect(nextState.snake).toEqual(state.snake)
    expect(nextState.status).toBe('paused')
  })

  it('does not move while idle', () => {
    const state = buildState({
      status: 'idle'
    })
    const nextState = stepGame(state, testConfig)

    expect(nextState.snake).toEqual(state.snake)
    expect(nextState.status).toBe('idle')
    expect(nextState.event).toEqual({ type: 'none' })
  })

  it('restarts with a clean running state and preserved best score', () => {
    const state = buildState({
      score: 30,
      bestScore: 50,
      status: 'game-over'
    })
    const nextState = reduceAction(state, 'restart', testConfig)

    expect(nextState.status).toBe('running')
    expect(nextState.score).toBe(0)
    expect(nextState.bestScore).toBe(50)
    expect(nextState.snake).toHaveLength(3)
  })
})

describe('point helpers', () => {
  it('compares points by coordinates', () => {
    expect(pointsAreEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true)
    expect(pointsAreEqual({ x: 1, y: 2 }, { x: 2, y: 1 })).toBe(false)
  })

  it.each<[Point, boolean]>([
    [{ x: 0, y: 0 }, false],
    [{ x: 7, y: 7 }, false],
    [{ x: -1, y: 0 }, true],
    [{ x: 0, y: -1 }, true],
    [{ x: 8, y: 0 }, true],
    [{ x: 0, y: 8 }, true]
  ])('detects board bounds for %j', (point, expected) => {
    expect(isOutsideBoard(point, 8)).toBe(expected)
  })

  it('detects whether a point is on the snake', () => {
    const snake = [
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ]

    expect(pointIsOnSnake({ x: 2, y: 1 }, snake)).toBe(true)
    expect(pointIsOnSnake({ x: 3, y: 1 }, snake)).toBe(false)
  })
})
