import { formatDemoResult, runDemo } from './demo.js'

/**
 * Runs the random insertion red-black tree sorting demo.
 */
const main = (): void => {
  const result = runDemo()

  console.log(formatDemoResult(result))

  if (!result.validRedBlackTree) {
    console.error(result.validationErrors.join('\n'))
    process.exitCode = 1
  }
}

main()
