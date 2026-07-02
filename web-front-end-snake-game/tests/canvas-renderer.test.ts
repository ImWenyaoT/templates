import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultGameConfig } from '../src/game/config'
import { createInitialState } from '../src/game/state'
import type { GameStatus } from '../src/game/types'
import { createCanvasRenderer } from '../src/renderer/canvasRenderer'

/**
 * 创建一个记录所有绘制调用的 2D 上下文替身。
 */
function createMockContext() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    roundRect: vi.fn(),
    setTransform: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    shadowColor: '',
    shadowBlur: 0
  }
}

/**
 * 创建带可注入上下文的 canvas 替身，返回固定的 CSS 尺寸。
 */
function createMockCanvas(context: unknown): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    getBoundingClientRect: vi.fn(() => ({ width: 480 }))
  } as unknown as HTMLCanvasElement
}

/**
 * 用默认配置构造一份指定状态的游戏状态。
 */
function stateWithStatus(status: GameStatus) {
  return { ...createInitialState(defaultGameConfig), status }
}

describe('createCanvasRenderer', () => {
  let addEventListener: ReturnType<typeof vi.fn>
  let removeEventListener: ReturnType<typeof vi.fn>

  beforeEach(() => {
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    vi.stubGlobal('window', { devicePixelRatio: 1, addEventListener, removeEventListener })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws when the 2D context is unavailable', () => {
    expect(() => createCanvasRenderer(createMockCanvas(null), defaultGameConfig)).toThrow(
      'Canvas rendering context is not available'
    )
  })

  it('sizes the canvas and registers a resize listener on creation', () => {
    const context = createMockContext()
    const canvas = createMockCanvas(context)

    createCanvasRenderer(canvas, defaultGameConfig)

    expect(context.setTransform).toHaveBeenCalledTimes(1)
    expect(canvas.width).toBe(480)
    expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('draws background, food, and every snake segment while running', () => {
    const context = createMockContext()
    const renderer = createCanvasRenderer(createMockCanvas(context), defaultGameConfig)
    const state = stateWithStatus('running')

    renderer.render(state)

    expect(context.clearRect).toHaveBeenCalledTimes(1)
    // 无覆盖层时只画一次背景矩形。
    expect(context.fillRect).toHaveBeenCalledTimes(1)
    // 食物用一个圆。
    expect(context.arc).toHaveBeenCalledTimes(1)
    // 每段蛇身画一个圆角格子。
    expect(context.roundRect).toHaveBeenCalledTimes(state.snake.length)
  })

  it('draws a paused overlay on top of the board', () => {
    const context = createMockContext()
    const renderer = createCanvasRenderer(createMockCanvas(context), defaultGameConfig)

    renderer.render(stateWithStatus('paused'))

    // 背景 + 覆盖层 = 两次 fillRect。
    expect(context.fillRect).toHaveBeenCalledTimes(2)
  })

  it('draws a danger overlay on game over', () => {
    const context = createMockContext()
    const renderer = createCanvasRenderer(createMockCanvas(context), defaultGameConfig)

    renderer.render(stateWithStatus('game-over'))

    expect(context.fillRect).toHaveBeenCalledTimes(2)
  })

  it('removes the resize listener on destroy', () => {
    const context = createMockContext()
    const renderer = createCanvasRenderer(createMockCanvas(context), defaultGameConfig)
    const handler = addEventListener.mock.calls[0]?.[1]

    renderer.destroy()

    expect(removeEventListener).toHaveBeenCalledWith('resize', handler)
  })
})
