import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { searchFiles } from '../src/search.js'

let tempRoot = ''

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), 'file-search-'))
})

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true })
})

/**
 * Creates an empty test file and any parent directories it needs.
 */
async function createFile(relativePath: string): Promise<string> {
  const filePath = path.join(tempRoot, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, '')

  return filePath
}

describe('searchFiles', () => {
  it('finds files by case-insensitive filename match', async () => {
    await createFile('notes/ProjectPlan.md')
    await createFile('notes/todo.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: 'plan'
    })

    expect(results.map(result => path.basename(result))).toEqual(['ProjectPlan.md'])
  })

  it('trims whitespace around the query', async () => {
    await createFile('notes/alpha-plan.md')

    const results = await searchFiles({
      root: tempRoot,
      query: '  plan  '
    })

    expect(results).toEqual([path.join(tempRoot, 'notes', 'alpha-plan.md')])
  })

  it('finds files in nested directories', async () => {
    await createFile('src/features/searchService.ts')

    const results = await searchFiles({
      root: tempRoot,
      query: 'service'
    })

    expect(results).toEqual([path.join(tempRoot, 'src', 'features', 'searchService.ts')])
  })

  it('returns absolute file paths', async () => {
    await createFile('src/alpha.ts')

    const results = await searchFiles({
      root: tempRoot,
      query: 'alpha'
    })

    expect(results).toEqual([path.join(tempRoot, 'src', 'alpha.ts')])
    expect(results.every(result => path.isAbsolute(result))).toBe(true)
  })

  it('returns results in deterministic directory entry order', async () => {
    await createFile('zeta-match.txt')
    await createFile('alpha/deep-match.txt')
    await createFile('beta-match.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: 'match'
    })

    expect(results).toEqual([
      path.join(tempRoot, 'alpha', 'deep-match.txt'),
      path.join(tempRoot, 'beta-match.txt'),
      path.join(tempRoot, 'zeta-match.txt')
    ])
  })

  it('respects maxResults', async () => {
    await createFile('alpha.txt')
    await createFile('alphabet.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: 'alpha',
      maxResults: 1
    })

    expect(results).toHaveLength(1)
  })

  it('returns no results when maxResults is zero', async () => {
    await createFile('alpha.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: 'alpha',
      maxResults: 0
    })

    expect(results).toEqual([])
  })

  it('uses 50 as the default max result count', async () => {
    await Promise.all(
      Array.from({ length: 55 }, (_, index) => createFile(`match-${String(index).padStart(2, '0')}.txt`))
    )

    const results = await searchFiles({
      root: tempRoot,
      query: 'match'
    })

    expect(results).toHaveLength(50)
    expect(results.at(0)).toBe(path.join(tempRoot, 'match-00.txt'))
    expect(results.at(-1)).toBe(path.join(tempRoot, 'match-49.txt'))
  })

  it('returns an empty list for blank queries', async () => {
    await createFile('alpha.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: '   '
    })

    expect(results).toEqual([])
  })

  it('does not return directories that match the query', async () => {
    await mkdir(path.join(tempRoot, 'alpha-directory'), { recursive: true })
    await createFile('other/file.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: 'alpha'
    })

    expect(results).toEqual([])
  })

  it('ignores configured directories', async () => {
    await createFile('node_modules/match.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: 'match'
    })

    expect(results).toEqual([])
  })

  it('ignores every default generated or dependency directory', async () => {
    await createFile('.git/match.txt')
    await createFile('coverage/match.txt')
    await createFile('dist/match.txt')
    await createFile('node_modules/match.txt')
    await createFile('src/match.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: 'match'
    })

    expect(results).toEqual([path.join(tempRoot, 'src', 'match.txt')])
  })

  it('uses caller-provided ignored directory names', async () => {
    await createFile('vendor/match.txt')
    await createFile('src/match.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: 'match',
      ignoredDirectories: ['vendor']
    })

    expect(results).toEqual([path.join(tempRoot, 'src', 'match.txt')])
  })

  it('allows callers to replace the default ignored directory set', async () => {
    await createFile('node_modules/match.txt')
    await createFile('vendor/match.txt')

    const results = await searchFiles({
      root: tempRoot,
      query: 'match',
      ignoredDirectories: ['vendor']
    })

    expect(results).toEqual([path.join(tempRoot, 'node_modules', 'match.txt')])
  })

  it('matches substrings across extensions without reading file contents', async () => {
    await createFile('docs/alpha-guide.md')
    await createFile('docs/notes.txt')
    await writeFile(path.join(tempRoot, 'docs', 'notes.txt'), 'alpha only appears in contents')

    const results = await searchFiles({
      root: tempRoot,
      query: 'alpha'
    })

    expect(results).toEqual([path.join(tempRoot, 'docs', 'alpha-guide.md')])
  })

  it('can match hidden files by filename', async () => {
    await createFile('.env.local')

    const results = await searchFiles({
      root: tempRoot,
      query: 'env'
    })

    expect(results).toEqual([path.join(tempRoot, '.env.local')])
  })

  it('rejects when the root directory does not exist', async () => {
    await expect(searchFiles({
      root: path.join(tempRoot, 'missing'),
      query: 'alpha'
    })).rejects.toThrow()
  })

  it('skips unreadable subdirectories instead of failing the whole search', async () => {
    await createFile('readable/alpha.txt')
    await createFile('locked/alpha.txt')
    const lockedDir = path.join(tempRoot, 'locked')
    await chmod(lockedDir, 0o000)

    try {
      const results = await searchFiles({ root: tempRoot, query: 'alpha' })

      // The readable match survives even though "locked" cannot be traversed.
      expect(results).toContain(path.join(tempRoot, 'readable', 'alpha.txt'))
      expect(results).not.toContain(path.join(lockedDir, 'alpha.txt'))
    } finally {
      // Restore permissions so afterEach can remove the temp tree.
      await chmod(lockedDir, 0o755)
    }
  })
})
