#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { searchFiles } from './search.js'

type CliOptions = {
  command: string | undefined
  query: string | undefined
  root: string
  maxResults: number
}

type CliIo = {
  cwd: () => string
  stdout: (message: string) => void
  stderr: (message: string) => void
}

/**
 * Default IO bound to the real process: stdout/stderr and the working directory.
 * Tests inject their own implementation to capture output without spawning a process.
 */
const defaultCliIo: CliIo = {
  cwd: () => process.cwd(),
  stdout: message => console.log(message),
  stderr: message => console.error(message)
}

/**
 * Parses a base-10 positive integer string, returning NaN for any other format.
 * Rejects hex, scientific notation, decimals, and leading zeros (e.g. 0x10, 1e2, 08, 5.0).
 */
function parsePositiveInteger(value: string): number {
  return /^[1-9][0-9]*$/.test(value) ? Number(value) : Number.NaN
}

/**
 * Parses command-line arguments into a small typed options object.
 */
function parseCliArgs(argv: string[], cwd: string): CliOptions {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      root: {
        type: 'string',
        short: 'r',
        default: cwd
      },
      max: {
        type: 'string',
        short: 'm',
        default: '50'
      }
    }
  })

  return {
    command: parsed.positionals[0],
    query: parsed.positionals[1],
    root: parsed.values.root ?? cwd,
    maxResults: parsePositiveInteger(parsed.values.max ?? '50')
  }
}

/**
 * Prints the CLI help text.
 */
function printHelp(write: (message: string) => void): void {
  write(`
Usage:
  file-search search <keyword> [--root <directory>] [--max <number>]

Options:
  -r, --root  Directory to search from
  -m, --max   Maximum number of results
`)
}

/**
 * Runs the file-search command and returns the intended process exit code.
 */
export async function runCli(argv: string[], io: CliIo = defaultCliIo): Promise<number> {
  let options: CliOptions

  try {
    options = parseCliArgs(argv, io.cwd())
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error))
    return 1
  }

  if (options.command !== 'search' || !options.query) {
    // Help is the contract here, so it goes to stdout. A wrong/incomplete command
    // (e.g. "scan" or "search" with no keyword) is a usage error -> exit 1; no
    // command at all is a plain help request -> exit 0.
    printHelp(io.stdout)
    return options.command ? 1 : 0
  }

  if (!Number.isInteger(options.maxResults) || options.maxResults < 1) {
    io.stderr('Error: --max must be a positive integer')
    return 1
  }

  try {
    const matches = await searchFiles({
      root: options.root,
      query: options.query,
      maxResults: options.maxResults
    })

    matches.forEach(match => io.stdout(match))

    return 0
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error))
    return 1
  }
}

// Run the CLI only when this file is the entry point, not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2)).then(exitCode => {
    process.exitCode = exitCode
  })
}
