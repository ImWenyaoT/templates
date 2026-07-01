#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { parseDocument, ParserError } from './index.js'

type CliOptions = {
  command: string | undefined
  filePath: string | undefined
  format: string | undefined
  help: boolean
}

type CliIo = {
  cwd: () => string
  stdout: (message: string) => void
  stderr: (message: string) => void
}

const defaultCliIo: CliIo = {
  cwd: () => process.cwd(),
  stdout: message => console.log(message),
  stderr: message => console.error(message)
}

/**
 * Parses command-line arguments into typed CLI options.
 */
function parseCliArgs(argv: string[]): CliOptions {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      format: {
        type: 'string',
        short: 'f'
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false
      }
    }
  })

  return {
    command: parsed.positionals[0],
    filePath: parsed.positionals[1],
    format: parsed.values.format,
    help: parsed.values.help ?? false
  }
}

/**
 * Prints CLI usage information.
 */
function printHelp(write: (message: string) => void): void {
  write(`
Usage:
  data-parser parse <file> [--format json|yaml|xml]

Options:
  -f, --format  Override format detection
  -h, --help    Print help
`)
}

/**
 * Runs the data-parser CLI and returns the intended process exit code.
 */
export async function runCli(argv: string[], io: CliIo = defaultCliIo): Promise<number> {
  let options: CliOptions

  try {
    options = parseCliArgs(argv)
  } catch (error) {
    io.stderr(`Error: ${formatUnknownError(error)}`)
    return 1
  }

  if (options.help || !options.command) {
    printHelp(io.stdout)
    return 0
  }

  if (options.command !== 'parse') {
    io.stderr(`Error: unknown command "${options.command}"`)
    printHelp(io.stdout)
    return 1
  }

  if (!options.filePath) {
    io.stderr('Error: missing file path')
    printHelp(io.stdout)
    return 1
  }

  const sourcePath = path.resolve(io.cwd(), options.filePath)

  try {
    const source = await readFile(sourcePath, 'utf8')
    const result = parseDocument(source, {
      sourcePath,
      format: options.format
    })

    io.stdout(JSON.stringify(result.data, null, 2))
    return 0
  } catch (error) {
    io.stderr(formatCliError(error, sourcePath))
    return 1
  }
}

/**
 * Formats known parser and filesystem errors for the command line.
 */
function formatCliError(error: unknown, sourcePath: string): string {
  if (error instanceof ParserError) {
    return `Error: ${error.message}`
  }

  if (error instanceof Error && 'code' in error) {
    const code = String(error.code)

    if (code === 'ENOENT') {
      return `Error: file not found: ${sourcePath}`
    }

    if (code === 'EISDIR') {
      return `Error: expected a file but received a directory: ${sourcePath}`
    }
  }

  return `Error: ${formatUnknownError(error)}`
}

/**
 * Converts any thrown value into a readable message.
 */
function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2)).then(exitCode => {
    process.exitCode = exitCode
  })
}
