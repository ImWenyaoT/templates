import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import type Database from 'better-sqlite3'
import {
  createPostBodySchema,
  followParamsSchema,
  loginBodySchema,
  postParamsSchema,
  registerBodySchema,
  userParamsSchema
} from '@trumpet/shared'
import { createDatabaseClient } from './db/client.js'
import { requireAuth } from './http/context.js'
import { errorHandler, HttpError } from './http/errors.js'
import { createPostRepository } from './repositories/posts.js'
import { createSessionRepository } from './repositories/sessions.js'
import { toUserView } from './repositories/types.js'
import { createUserRepository } from './repositories/users.js'
import { createAuthService } from './services/auth.js'

const sessionCookieName = 'session_id'

export interface AppOptions {
  dbFile?: string
  sqlite?: Database.Database
}

/**
 * Attaches the session cookie to the response.
 */
const setSessionCookie = (response: express.Response, session: { id: string; expiresAt: Date }) => {
  response.cookie(sessionCookieName, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    expires: session.expiresAt,
    secure: false
  })
}

/**
 * Builds the Express app and wires HTTP routes to repositories and services.
 */
export const createApp = (options: AppOptions = {}) => {
  const client = createDatabaseClient({
    ...(options.dbFile ? { filePath: options.dbFile } : {}),
    ...(options.sqlite ? { sqlite: options.sqlite } : {})
  })
  const users = createUserRepository(client)
  const sessions = createSessionRepository(client)
  const posts = createPostRepository(client)
  const auth = createAuthService({ users, sessions })
  const app = express()

  app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173', credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use((request, _response, next) => {
    request.currentUser = auth.getUserBySession(request.cookies?.[sessionCookieName])
    next()
  })

  app.get('/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.post('/auth/register', async (request, response, next) => {
    try {
      const body = registerBodySchema.parse(request.body)
      const result = await auth.register(body)
      setSessionCookie(response, result.session)

      response.status(201).json({
        user: toUserView(result.user)
      })
    } catch (error) {
      next(error)
    }
  })

  app.post('/auth/login', async (request, response, next) => {
    try {
      const body = loginBodySchema.parse(request.body)
      const result = await auth.login(body)
      setSessionCookie(response, result.session)

      response.json({
        user: toUserView(result.user)
      })
    } catch (error) {
      next(error)
    }
  })

  app.post('/auth/logout', (request, response) => {
    auth.logout(request.cookies?.[sessionCookieName])
    response.clearCookie(sessionCookieName)
    response.status(204).end()
  })

  app.get('/me', (request, response) => {
    response.json({
      user: request.currentUser ? toUserView(request.currentUser) : null
    })
  })

  app.post('/posts', requireAuth, (request, response, next) => {
    try {
      const body = createPostBodySchema.parse(request.body)

      if (body.parentId && !posts.exists(body.parentId)) {
        throw new HttpError('parent_not_found', '回复的帖子不存在', 404)
      }

      const id = posts.create({
        authorId: request.currentUser!.id,
        body: body.body,
        parentId: body.parentId ?? null
      })
      const post = posts.findById(id, request.currentUser!.id)

      response.status(201).json({ post })
    } catch (error) {
      next(error)
    }
  })

  app.get('/timeline', requireAuth, (request, response) => {
    const cursor = typeof request.query.cursor === 'string' ? request.query.cursor : null
    response.json(posts.timeline(request.currentUser!.id, cursor))
  })

  app.post('/posts/:id/like', requireAuth, (request, response, next) => {
    try {
      const { id } = postParamsSchema.parse(request.params)

      if (!posts.exists(id)) {
        throw new HttpError('post_not_found', '帖子不存在', 404)
      }

      posts.like(request.currentUser!.id, id)
      response.json({ post: posts.findById(id, request.currentUser!.id) })
    } catch (error) {
      next(error)
    }
  })

  app.delete('/posts/:id/like', requireAuth, (request, response, next) => {
    try {
      const { id } = postParamsSchema.parse(request.params)

      if (!posts.exists(id)) {
        throw new HttpError('post_not_found', '帖子不存在', 404)
      }

      posts.unlike(request.currentUser!.id, id)
      response.json({ post: posts.findById(id, request.currentUser!.id) })
    } catch (error) {
      next(error)
    }
  })

  app.post('/users/:id/follow', requireAuth, (request, response, next) => {
    try {
      const { id } = followParamsSchema.parse(request.params)

      if (!users.exists(id)) {
        throw new HttpError('user_not_found', '用户不存在', 404)
      }

      if (request.currentUser!.id === id) {
        throw new HttpError('self_follow_not_allowed', '不能关注自己', 400)
      }

      users.follow(request.currentUser!.id, id)
      const user = users.findById(id)

      response.json({
        user: toUserView(user!, users.getStats(id, request.currentUser!.id))
      })
    } catch (error) {
      next(error)
    }
  })

  app.delete('/users/:id/follow', requireAuth, (request, response, next) => {
    try {
      const { id } = followParamsSchema.parse(request.params)
      users.unfollow(request.currentUser!.id, id)
      const user = users.findById(id)

      if (!user) {
        throw new HttpError('user_not_found', '用户不存在', 404)
      }

      response.json({
        user: toUserView(user, users.getStats(id, request.currentUser!.id))
      })
    } catch (error) {
      next(error)
    }
  })

  app.get('/users/:handle', (request, response, next) => {
    try {
      const { handle } = userParamsSchema.parse(request.params)
      const user = users.findByHandle(handle)

      if (!user) {
        throw new HttpError('user_not_found', '用户不存在', 404)
      }

      response.json({
        user: toUserView(user, users.getStats(user.id, request.currentUser?.id ?? null))
      })
    } catch (error) {
      next(error)
    }
  })

  app.get('/users/:handle/posts', (request, response, next) => {
    try {
      const { handle } = userParamsSchema.parse(request.params)
      const user = users.findByHandle(handle)

      if (!user) {
        throw new HttpError('user_not_found', '用户不存在', 404)
      }

      const cursor = typeof request.query.cursor === 'string' ? request.query.cursor : null
      response.json({
        user: toUserView(user, users.getStats(user.id, request.currentUser?.id ?? null)),
        ...posts.byAuthor(user.id, request.currentUser?.id ?? '', cursor)
      })
    } catch (error) {
      next(error)
    }
  })

  app.use(errorHandler)

  return {
    app,
    client
  }
}
