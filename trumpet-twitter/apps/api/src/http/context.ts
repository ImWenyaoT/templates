import type { NextFunction, Request, Response } from 'express'
import type { StoredUser } from '../repositories/types.js'
import { HttpError } from './errors.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser: StoredUser | null
    }
  }
}

/**
 * Requires a request to already have an authenticated user.
 */
export const requireAuth = (request: Request, _response: Response, next: NextFunction) => {
  if (!request.currentUser) {
    return next(new HttpError('unauthorized', '请先登录', 401))
  }

  return next()
}
