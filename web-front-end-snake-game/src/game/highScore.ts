const storageKey = 'snake.bestScore'

/**
 * 从浏览器存储读取最高分，读取失败时安全返回 0。
 * localStorage 在隐私模式/被禁用时访问会抛 SecurityError，这里统一兜底为 0，
 * 避免模块初始化阶段抛错导致游戏白屏；脏值（负数、小数、超大值）也归零。
 */
export function loadBestScore(): number {
  try {
    const storedScore = window.localStorage.getItem(storageKey)
    const parsedScore = Number(storedScore)

    return Number.isSafeInteger(parsedScore) && parsedScore >= 0 ? parsedScore : 0
  } catch {
    return 0
  }
}

/**
 * 将最高分写入浏览器存储，供下一局继续显示。
 * 存储不可用（隐私模式/超额）时静默忽略，最高分仅在本局内有效。
 */
export function saveBestScore(score: number): void {
  try {
    window.localStorage.setItem(storageKey, String(score))
  } catch {
    // 存储被禁用时忽略，不影响游戏进行。
  }
}
