import type { Dirent } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

export type SearchOptions = {
  root: string
  query: string
  maxResults?: number
  ignoredDirectories?: string[]
}

const defaultIgnoredDirectories = ['.git', 'node_modules', 'dist', 'coverage']

/**
 * Searches file names under a root directory and returns matching absolute paths.
 */
export async function searchFiles(options: SearchOptions): Promise<string[]> {
  const root = path.resolve(options.root)
  const query = options.query.trim().toLowerCase()
  const maxResults = options.maxResults ?? 50
  const ignoredDirectories = new Set(options.ignoredDirectories ?? defaultIgnoredDirectories)

  if (!query) {
    return []
  }

  return collectMatches({
    directory: root,
    query,
    maxResults,
    ignoredDirectories,
    results: [],
    isRoot: true
  })
}

type CollectOptions = {
  directory: string
  query: string
  maxResults: number
  ignoredDirectories: Set<string>
  results: string[]
  isRoot: boolean
}

/**
 * Walks a directory recursively until enough matching files have been collected.
 * Unreadable nested directories (e.g. EACCES) are skipped so a single permission
 * error does not discard the whole search; a failure on the root still propagates.
 */
async function collectMatches(options: CollectOptions): Promise<string[]> {
  if (options.results.length >= options.maxResults) {
    return options.results
  }

  let entries: Dirent[]

  try {
    entries = await readdir(options.directory, { withFileTypes: true })
  } catch (error) {
    if (options.isRoot) {
      throw error
    }

    return options.results
  }

  const sortedEntries = entries.slice().sort((left, right) => left.name.localeCompare(right.name))

  for (const entry of sortedEntries) {
    if (options.results.length >= options.maxResults) {
      break
    }

    const entryPath = path.join(options.directory, entry.name)

    if (entry.isDirectory()) {
      if (!options.ignoredDirectories.has(entry.name)) {
        await collectMatches({ ...options, directory: entryPath, isRoot: false })
      }

      continue
    }

    if (entry.isFile() && entry.name.toLowerCase().includes(options.query)) {
      options.results.push(entryPath)
    }
  }

  return options.results
}
