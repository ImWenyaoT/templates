export interface RandomResult {
  seed: number
  value: number
}

/**
 * 生成下一个确定性随机数，让游戏规则在测试中可复现。
 */
export function nextRandom(seed: number): RandomResult {
  const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0

  return {
    seed: nextSeed,
    value: nextSeed / 4294967296
  }
}
