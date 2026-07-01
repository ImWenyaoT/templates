import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runCli } from '../src/cli.js'

let tempRoot = ''

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), 'data-parser-'))
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
 * Runs the CLI with captured output arrays for assertions.
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
    expect(result.stdout.join('\n')).toContain('data-parser parse <file>')
    expect(result.stderr).toEqual([])
  })

  it('prints help successfully when requested explicitly', async () => {
    const result = await runCapturedCli(['--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout.join('\n')).toContain('--format')
    expect(result.stderr).toEqual([])
  })

  it('fails when the command is unknown', async () => {
    const result = await runCapturedCli(['scan', 'input.json'])

    expect(result.exitCode).toBe(1)
    expect(result.stdout.join('\n')).toContain('data-parser parse <file>')
    expect(result.stderr).toEqual(['Error: unknown command "scan"'])
  })

  it('fails when argument parsing fails', async () => {
    const result = await runCapturedCli(['parse', 'input.json', '--format'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('Error:')
  })

  it('fails when the file path is missing', async () => {
    const result = await runCapturedCli(['parse'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toEqual(['Error: missing file path'])
  })

  it('parses JSON files by extension', async () => {
    await writeFile(path.join(tempRoot, 'input.json'), '{"name":"Ada"}')

    const result = await runCapturedCli(['parse', 'input.json'])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({ name: 'Ada' })
    expect(result.stderr).toEqual([])
  })

  it('prints pretty JSON output', async () => {
    await writeFile(path.join(tempRoot, 'input.json'), '{"name":"Ada","active":true}')

    const result = await runCapturedCli(['parse', 'input.json'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout[0]).toContain('\n  "name": "Ada"')
    expect(result.stdout[0]).toContain('\n  "active": true')
  })

  it('parses YAML files by extension', async () => {
    await writeFile(path.join(tempRoot, 'input.yaml'), 'name: Ada\n')

    const result = await runCapturedCli(['parse', 'input.yaml'])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({ name: 'Ada' })
  })

  it('parses YML files by extension', async () => {
    await writeFile(path.join(tempRoot, 'input.yml'), 'name: Grace\n')

    const result = await runCapturedCli(['parse', 'input.yml'])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({ name: 'Grace' })
  })

  it('parses XML files by extension', async () => {
    await writeFile(path.join(tempRoot, 'input.xml'), '<user id="1">Ada</user>')

    const result = await runCapturedCli(['parse', 'input.xml'])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({
      user: {
        $attributes: {
          id: '1'
        },
        $text: 'Ada'
      }
    })
  })

  it('parses XML files with repeated elements through the CLI', async () => {
    await writeFile(path.join(tempRoot, 'input.xml'), '<items><item>a</item><item>b</item></items>')

    const result = await runCapturedCli(['parse', 'input.xml'])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({
      items: {
        item: [
          {
            $text: 'a'
          },
          {
            $text: 'b'
          }
        ]
      }
    })
  })

  it('allows explicit format overrides', async () => {
    await writeFile(path.join(tempRoot, 'input.txt'), '{"name":"Ada"}')

    const result = await runCapturedCli(['parse', 'input.txt', '--format', 'json'])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({ name: 'Ada' })
  })

  it('allows explicit format overrides with the short flag', async () => {
    await writeFile(path.join(tempRoot, 'input.txt'), '{"name":"Ada"}')

    const result = await runCapturedCli(['parse', 'input.txt', '-f', 'json'])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({ name: 'Ada' })
  })

  it('parses absolute file paths without joining them onto cwd', async () => {
    const filePath = path.join(tempRoot, 'absolute.json')
    await writeFile(filePath, '{"absolute":true}')

    const result = await runCapturedCli(['parse', filePath])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({ absolute: true })
  })

  it('allows explicit YAML format overrides', async () => {
    await writeFile(path.join(tempRoot, 'input.data'), 'name: Linus\n')

    const result = await runCapturedCli(['parse', 'input.data', '--format', 'yaml'])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({ name: 'Linus' })
  })

  it('allows explicit XML format overrides', async () => {
    await writeFile(path.join(tempRoot, 'input.data'), '<root ok="yes" />')

    const result = await runCapturedCli(['parse', 'input.data', '--format', 'xml'])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout[0] ?? '')).toEqual({
      root: {
        $attributes: {
          ok: 'yes'
        },
        $text: ''
      }
    })
  })

  it('fails when explicit format is unsupported', async () => {
    await writeFile(path.join(tempRoot, 'input.json'), '{"name":"Ada"}')

    const result = await runCapturedCli(['parse', 'input.json', '--format', 'toml'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('Unsupported format')
  })

  it('fails when the file does not exist', async () => {
    const result = await runCapturedCli(['parse', 'missing.json'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('file not found')
  })

  it('fails when the path is a directory', async () => {
    await mkdir(path.join(tempRoot, 'folder'))

    const result = await runCapturedCli(['parse', 'folder', '--format', 'json'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('expected a file')
  })

  it('fails when the format is unsupported', async () => {
    await writeFile(path.join(tempRoot, 'input.txt'), 'name = "Ada"')

    const result = await runCapturedCli(['parse', 'input.txt'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('Unsupported file extension')
  })

  it('fails when a file has no extension and no explicit format', async () => {
    await writeFile(path.join(tempRoot, 'Dockerfile'), '{"name":"Ada"}')

    const result = await runCapturedCli(['parse', 'Dockerfile'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('Unsupported file extension "(none)"')
  })

  it('fails when parsing invalid JSON data', async () => {
    await mkdir(path.join(tempRoot, 'nested'))
    await writeFile(path.join(tempRoot, 'nested', 'input.json'), '{"name":')

    const result = await runCapturedCli(['parse', 'nested/input.json'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('Failed to parse JSON')
  })

  it('fails when parsing invalid YAML data', async () => {
    await writeFile(path.join(tempRoot, 'input.yaml'), 'name: [unterminated')

    const result = await runCapturedCli(['parse', 'input.yaml'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('Failed to parse YAML')
  })

  it('fails when parsing invalid XML data', async () => {
    await writeFile(path.join(tempRoot, 'input.xml'), '<root><name>Ada</root>')

    const result = await runCapturedCli(['parse', 'input.xml'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('Failed to parse XML')
  })
})
