import type { GameConfig, GameState, Point } from '../game/types'

interface CanvasTheme {
  background: string
  grid: string
  snakeHead: string
  snakeBody: string
  food: string
  pausedOverlay: string
  dangerOverlay: string
}

const theme: CanvasTheme = {
  background: '#07110f',
  grid: 'rgba(126, 242, 203, 0.08)',
  snakeHead: '#7ef2cb',
  snakeBody: '#15c986',
  food: '#ff6b5f',
  pausedOverlay: 'rgba(7, 17, 15, 0.58)',
  dangerOverlay: 'rgba(255, 107, 95, 0.18)'
}

/**
 * 创建 Canvas 渲染器，渲染器只读取状态，不拥有游戏规则。
 */
export function createCanvasRenderer(canvas: HTMLCanvasElement, config: GameConfig) {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas rendering context is not available')
  }

  const resize = () => resizeCanvas(canvas, context, config.gridSize)

  resize()
  window.addEventListener('resize', resize)

  return {
    render(state: GameState) {
      renderBoard(context, canvas, state, config)
    },
    destroy() {
      window.removeEventListener('resize', resize)
    }
  }
}

/**
 * 根据可用 CSS 尺寸同步 Canvas 像素密度，避免高清屏发虚。
 */
function resizeCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, gridSize: number): void {
  const size = Math.floor(canvas.getBoundingClientRect().width)
  const deviceScale = window.devicePixelRatio || 1
  const physicalSize = Math.max(gridSize, Math.floor(size * deviceScale))

  canvas.width = physicalSize
  canvas.height = physicalSize
  context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0)
}

/**
 * 绘制完整棋盘，包括背景、蛇、食物和状态层。
 */
function renderBoard(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: GameState,
  config: GameConfig
): void {
  const size = canvas.width / (window.devicePixelRatio || 1)
  const cellSize = size / config.gridSize

  context.clearRect(0, 0, size, size)
  drawBackground(context, size, cellSize, config.gridSize)
  drawFood(context, state.food, cellSize)
  drawSnake(context, state.snake, cellSize)

  if (state.status === 'paused') {
    drawStatusOverlay(context, size, theme.pausedOverlay)
  }

  if (state.status === 'game-over') {
    drawStatusOverlay(context, size, theme.dangerOverlay)
  }
}

/**
 * 绘制棋盘背景和细网格，提供空间感但不抢主体。
 */
function drawBackground(
  context: CanvasRenderingContext2D,
  size: number,
  cellSize: number,
  gridSize: number
): void {
  context.fillStyle = theme.background
  context.fillRect(0, 0, size, size)
  context.strokeStyle = theme.grid
  context.lineWidth = 1

  for (let index = 0; index <= gridSize; index += 1) {
    const position = Math.round(index * cellSize) + 0.5

    context.beginPath()
    context.moveTo(position, 0)
    context.lineTo(position, size)
    context.stroke()

    context.beginPath()
    context.moveTo(0, position)
    context.lineTo(size, position)
    context.stroke()
  }
}

/**
 * 绘制蛇身，蛇头使用更亮颜色强调方向和主体。
 */
function drawSnake(context: CanvasRenderingContext2D, snake: Point[], cellSize: number): void {
  snake.forEach((part, index) => {
    const inset = Math.max(3, cellSize * 0.12)
    const radius = Math.max(4, cellSize * 0.18)

    context.fillStyle = index === 0 ? theme.snakeHead : theme.snakeBody
    drawRoundedCell(context, part, cellSize, inset, radius)
  })
}

/**
 * 绘制食物，用圆形和光晕让目标更容易被看到。
 */
function drawFood(context: CanvasRenderingContext2D, food: Point, cellSize: number): void {
  const centerX = food.x * cellSize + cellSize / 2
  const centerY = food.y * cellSize + cellSize / 2
  const radius = cellSize * 0.28

  context.save()
  context.shadowColor = theme.food
  context.shadowBlur = 16
  context.fillStyle = theme.food
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

/**
 * 绘制暂停或失败时的轻量覆盖层，不遮挡棋盘整体结构。
 */
function drawStatusOverlay(context: CanvasRenderingContext2D, size: number, color: string): void {
  context.fillStyle = color
  context.fillRect(0, 0, size, size)
}

/**
 * 绘制单个圆角格子，保持蛇身在不同尺寸下稳定。
 */
function drawRoundedCell(
  context: CanvasRenderingContext2D,
  point: Point,
  cellSize: number,
  inset: number,
  radius: number
): void {
  const x = point.x * cellSize + inset
  const y = point.y * cellSize + inset
  const size = cellSize - inset * 2

  context.beginPath()
  context.roundRect(x, y, size, size, radius)
  context.fill()
}
