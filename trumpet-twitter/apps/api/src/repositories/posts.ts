import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import type { PostView } from '@trumpet/shared'
import type { DatabaseClient } from '../db/client.js'

const defaultLimit = 20

interface PostRow {
  id: string
  body: string
  parent_id: string | null
  created_at: string
  author_id: string
  handle: string
  display_name: string
  bio: string
  author_created_at: string
  like_count: number
  reply_count: number
  liked_by_me: number
}

interface CursorPayload {
  createdAt: string
  id: string
}

/**
 * Encodes a stable timeline cursor from the last returned post.
 */
const encodeCursor = (post: Pick<PostView, 'createdAt' | 'id'>) => {
  return Buffer.from(JSON.stringify({ createdAt: post.createdAt, id: post.id })).toString('base64url')
}

/**
 * Decodes a cursor into the pair used by timeline ordering.
 */
const decodeCursor = (cursor: string | null | undefined): CursorPayload | null => {
  if (!cursor) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorPayload

    if (!parsed.createdAt || !parsed.id) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

/**
 * Converts a post aggregate row into the API view shape.
 */
const toPostView = (row: PostRow): PostView => ({
  id: row.id,
  body: row.body,
  parentId: row.parent_id,
  createdAt: row.created_at,
  likeCount: Number(row.like_count),
  replyCount: Number(row.reply_count),
  likedByMe: Boolean(row.liked_by_me),
  author: {
    id: row.author_id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    createdAt: row.author_created_at
  }
})

/**
 * Splits one over-fetched page into visible items and next cursor.
 */
const paginate = (rows: PostRow[], limit: number) => {
  const items = rows.slice(0, limit).map(toPostView)
  const nextCursor = rows.length > limit && items.length > 0 ? encodeCursor(items.at(-1)!) : null

  return {
    items,
    nextCursor
  }
}

/**
 * Provides post, timeline, reply, and like persistence operations.
 */
export const createPostRepository = (client: DatabaseClient) => {
  const selectPostFragment = `
    SELECT
      p.id,
      p.body,
      p.parent_id,
      p.created_at,
      u.id AS author_id,
      u.handle,
      u.display_name,
      u.bio,
      u.created_at AS author_created_at,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM posts child WHERE child.parent_id = p.id) AS reply_count,
      CASE
        WHEN EXISTS (SELECT 1 FROM likes viewer_like WHERE viewer_like.post_id = p.id AND viewer_like.user_id = ?)
        THEN 1
        ELSE 0
      END AS liked_by_me
    FROM posts p
    INNER JOIN users u ON u.id = p.author_id
  `

  const byIdStatement = client.sqlite.prepare(`
    ${selectPostFragment}
    WHERE p.id = ?
  `)

  return {
    /**
     * Creates a root post or reply.
     */
    create: (input: { authorId: string; body: string; parentId?: string | null }) => {
      const id = randomUUID()
      const now = new Date().toISOString()

      client.sqlite
        .prepare('INSERT INTO posts (id, author_id, body, parent_id, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(id, input.authorId, input.body, input.parentId ?? null, now)

      return id
    },

    /**
     * Returns a single post aggregate for the viewer.
     */
    findById: (id: string, viewerId: string) => {
      const row = byIdStatement.get(viewerId, id) as PostRow | undefined
      return row ? toPostView(row) : null
    },

    /**
     * Returns whether a post id exists.
     */
    exists: (id: string) => {
      return Boolean(client.sqlite.prepare('SELECT 1 FROM posts WHERE id = ?').get(id))
    },

    /**
     * Returns the viewer's following timeline with cursor pagination.
     */
    timeline: (viewerId: string, cursor?: string | null, limit = defaultLimit) => {
      const decoded = decodeCursor(cursor)
      const cursorClause = decoded ? 'AND (p.created_at < ? OR (p.created_at = ? AND p.id < ?))' : ''
      const params = decoded
        ? [viewerId, viewerId, viewerId, decoded.createdAt, decoded.createdAt, decoded.id, limit + 1]
        : [viewerId, viewerId, viewerId, limit + 1]

      const rows = client.sqlite
        .prepare(`
          ${selectPostFragment}
          WHERE p.parent_id IS NULL
            AND (
              p.author_id = ?
              OR EXISTS (
                SELECT 1 FROM follows f
                WHERE f.follower_id = ? AND f.following_id = p.author_id
              )
            )
            ${cursorClause}
          ORDER BY p.created_at DESC, p.id DESC
          LIMIT ?
        `)
        .all(...params) as PostRow[]

      return paginate(rows, limit)
    },

    /**
     * Returns one user's root posts with cursor pagination.
     */
    byAuthor: (authorId: string, viewerId: string, cursor?: string | null, limit = defaultLimit) => {
      const decoded = decodeCursor(cursor)
      const cursorClause = decoded ? 'AND (p.created_at < ? OR (p.created_at = ? AND p.id < ?))' : ''
      const params = decoded
        ? [viewerId, authorId, decoded.createdAt, decoded.createdAt, decoded.id, limit + 1]
        : [viewerId, authorId, limit + 1]

      const rows = client.sqlite
        .prepare(`
          ${selectPostFragment}
          WHERE p.parent_id IS NULL
            AND p.author_id = ?
            ${cursorClause}
          ORDER BY p.created_at DESC, p.id DESC
          LIMIT ?
        `)
        .all(...params) as PostRow[]

      return paginate(rows, limit)
    },

    /**
     * Likes a post once per user.
     */
    like: (userId: string, postId: string) => {
      client.sqlite
        .prepare('INSERT OR IGNORE INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)')
        .run(userId, postId, new Date().toISOString())
    },

    /**
     * Removes a user's like from a post.
     */
    unlike: (userId: string, postId: string) => {
      client.sqlite.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(userId, postId)
    }
  }
}
