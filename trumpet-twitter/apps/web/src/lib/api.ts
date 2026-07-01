import type { AuthResponse, CreatePostBody, MeResponse, PostView, TimelineResponse, UserPostsResponse, UserView } from '@trumpet/shared'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

/**
 * Sends a JSON request to the API and unwraps the response body.
 */
const requestJson = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    cache: 'no-store',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new Error(payload?.error?.message ?? '请求失败')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  /**
   * Registers a local account and starts a session.
   */
  register: (input: { handle: string; displayName: string; password: string }) => {
    return requestJson<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input)
    })
  },

  /**
   * Logs in with a local account.
   */
  login: (input: { handle: string; password: string }) => {
    return requestJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input)
    })
  },

  /**
   * Ends the current session.
   */
  logout: () => requestJson<void>('/auth/logout', { method: 'POST' }),

  /**
   * Loads the current viewer.
   */
  me: () => requestJson<MeResponse>('/me'),

  /**
   * Loads the following timeline.
   */
  timeline: (cursor?: string | null) => {
    const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    return requestJson<TimelineResponse>(`/timeline${suffix}`)
  },

  /**
   * Creates a root post or reply.
   */
  createPost: (input: CreatePostBody) => {
    return requestJson<{ post: PostView }>('/posts', {
      method: 'POST',
      body: JSON.stringify(input)
    })
  },

  /**
   * Adds a like to a post.
   */
  likePost: (id: string) => requestJson<{ post: PostView }>(`/posts/${id}/like`, { method: 'POST' }),

  /**
   * Removes a like from a post.
   */
  unlikePost: (id: string) => requestJson<{ post: PostView }>(`/posts/${id}/like`, { method: 'DELETE' }),

  /**
   * Loads a public user profile.
   */
  user: (handle: string) => requestJson<{ user: UserView }>(`/users/${handle}`),

  /**
   * Loads root posts for a public user profile.
   */
  userPosts: (handle: string, cursor?: string | null) => {
    const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    return requestJson<UserPostsResponse>(`/users/${handle}/posts${suffix}`)
  },

  /**
   * Follows a user by id.
   */
  follow: (id: string) => requestJson<{ user: UserView }>(`/users/${id}/follow`, { method: 'POST' }),

  /**
   * Unfollows a user by id.
   */
  unfollow: (id: string) => requestJson<{ user: UserView }>(`/users/${id}/follow`, { method: 'DELETE' })
}
