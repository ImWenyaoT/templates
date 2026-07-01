import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runCli } from '../src/index.js'

let tempRoot = ''

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), 'file-search-cli-'))
})

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true })
})

type RunResult = {
  exitCode: number
  stdout: string[]
  stderr: string[]
}

/**
 * Runs the CLI with captured standard output and standard error lines.
 */
async function runCapturedCli(argv: string[]): Promise<RunResult> {
  const stdout: string[] = []
  const stderr: string[] = []
  const exitCode = await runCli(argv, {
    cwd: () => tempRoot,
    stdout: message => stdout.push(message),
    stderr: message => stderr.push(message)
  })

  return {
    exitCode,
    stdout,
    stderr
  }
}

describe('runCli', () => {
  it('prints help successfully when no command is provided', async () => {
    const result = await runCapturedCli([])

    expect(result.exitCode).toBe(0)
    expect(result.stdout.join('\n')).toContain('file-search search <keyword>')
    expect(result.stderr).toEqual([])
  })

  it('fails when the command is unknown', async () => {
    const result = await runCapturedCli(['scan', 'alpha'])

    expect(result.exitCode).toBe(1)
    expect(result.stdout.join('\n')).toContain('file-search search <keyword>')
  })

  it('does not print errors for unknown commands because help explains the contract', async () => {
    const result = await runCapturedCli(['scan', 'alpha'])

    expect(result.stderr).toEqual([])
  })

  it('fails when the search keyword is missing', async () => {
    const result = await runCapturedCli(['search'])

    expect(result.exitCode).toBe(1)
    expect(result.stdout.join('\n')).toContain('file-search search <keyword>')
  })

  it.each(['0', '1.5', 'not-a-number', '0x10', '1e2', '08', '5.0'])(
    'fails when max is %s',
    async max => {
      const result = await runCapturedCli(['search', 'alpha', '--max', max])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toEqual(['Error: --max must be a positive integer'])
    }
  )

  it('fails when max is a negative integer passed with equals syntax', async () => {
    const result = await runCapturedCli(['search', 'alpha', '--max=-1'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toEqual(['Error: --max must be a positive integer'])
  })

  it('prints matching file paths', async () => {
    await mkdir(path.join(tempRoot, 'src'))
    await writeFile(path.join(tempRoot, 'src', 'alpha.ts'), '')

    const result = await runCapturedCli(['search', 'alpha', '--root', tempRoot, '--max', '5'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toEqual([path.join(tempRoot, 'src', 'alpha.ts')])
    expect(result.stderr).toEqual([])
  })

  it('uses the injected current working directory as the default root', async () => {
    await writeFile(path.join(tempRoot, 'alpha.ts'), '')

    const result = await runCapturedCli(['search', 'alpha'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toEqual([path.join(tempRoot, 'alpha.ts')])
  })

  it('supports short root and max flags', async () => {
    await mkdir(path.join(tempRoot, 'src'))
    await writeFile(path.join(tempRoot, 'src', 'alpha.ts'), '')
    await writeFile(path.join(tempRoot, 'src', 'alphabet.ts'), '')

    const result = await runCapturedCli(['search', 'alpha', '-r', tempRoot, '-m', '1'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toEqual([path.join(tempRoot, 'src', 'alpha.ts')])
  })

  it('supports equals syntax for root and max flags', async () => {
    await mkdir(path.join(tempRoot, 'src'))
    await writeFile(path.join(tempRoot, 'src', 'alpha.ts'), '')
    await writeFile(path.join(tempRoot, 'src', 'alphabet.ts'), '')

    const result = await runCapturedCli(['search', 'alpha', `--root=${tempRoot}`, '--max=2'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toEqual([
      path.join(tempRoot, 'src', 'alpha.ts'),
      path.join(tempRoot, 'src', 'alphabet.ts')
    ])
  })

  it('uses the default max result count through the CLI', async () => {
    await Promise.all(
      Array.from({ length: 55 }, async (_, index) => {
        await writeFile(path.join(tempRoot, `match-${String(index).padStart(2, '0')}.txt`), '')
      })
    )

    const result = await runCapturedCli(['search', 'match'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toHaveLength(50)
    expect(result.stdout.at(0)).toBe(path.join(tempRoot, 'match-00.txt'))
    expect(result.stdout.at(-1)).toBe(path.join(tempRoot, 'match-49.txt'))
  })

  it('returns success with no output when there are no matches', async () => {
    await writeFile(path.join(tempRoot, 'alpha.ts'), '')

    const result = await runCapturedCli(['search', 'beta'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toEqual([])
    expect(result.stderr).toEqual([])
  })

  it('passes whitespace-padded queries to the search layer successfully', async () => {
    await writeFile(path.join(tempRoot, 'alpha.ts'), '')

    const result = await runCapturedCli(['search', '  alpha  '])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toEqual([path.join(tempRoot, 'alpha.ts')])
  })

  it('treats a whitespace-only query as a missing search keyword result set', async () => {
    await writeFile(path.join(tempRoot, 'alpha.ts'), '')

    const result = await runCapturedCli(['search', '   '])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toEqual([])
    expect(result.stderr).toEqual([])
  })

  it('reports parser errors for missing option values', async () => {
    const result = await runCapturedCli(['search', 'alpha', '--root'])

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toEqual([])
    expect(result.stderr.join('\n')).toContain('Option')
  })

  it('reports parser errors for unsupported flags', async () => {
    const result = await runCapturedCli(['search', 'alpha', '--json'])

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toEqual([])
    expect(result.stderr.join('\n')).toContain('Unknown option')
  })

  it('reports search errors without throwing to the caller', async () => {
    const result = await runCapturedCli(['search', 'alpha', '--root', path.join(tempRoot, 'missing')])

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toEqual([])
    expect(result.stderr.join('\n')).toContain('ENOENT')
  })
})
