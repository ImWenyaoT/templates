import { relations } from 'drizzle-orm'
import { type AnySQLiteColumn, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    handle: text('handle').notNull(),
    displayName: text('display_name').notNull(),
    bio: text('bio').notNull().default(''),
    passwordHash: text('password_hash').notNull(),
    createdAt: text('created_at').notNull()
  },
  (table) => [uniqueIndex('users_handle_unique').on(table.handle)]
)

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull()
})

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  parentId: text('parent_id').references((): AnySQLiteColumn => posts.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull()
})

export const follows = sqliteTable(
  'follows',
  {
    followerId: text('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followingId: text('following_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull()
  },
  (table) => [primaryKey({ columns: [table.followerId, table.followingId] })]
)

export const likes = sqliteTable(
  'likes',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull()
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] })]
)

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  sessions: many(sessions)
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id]
  }),
  parent: one(posts, {
    fields: [posts.parentId],
    references: [posts.id]
  })
}))
