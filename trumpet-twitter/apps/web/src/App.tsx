import { useEffect, useMemo, useState } from 'react'
import type { PostView, UserView } from '@trumpet/shared'
import { AuthForm } from './components/AuthForm.js'
import { Composer } from './components/Composer.js'
import { PostCard } from './components/PostCard.js'
import { RightPanel } from './components/RightPanel.js'
import { Sidebar } from './components/Sidebar.js'
import { api } from './lib/api.js'

type View = { name: 'home' } | { name: 'profile'; handle: string }

/**
 * Replaces one post inside a list while preserving order.
 */
const replacePost = (items: PostView[], nextPost: PostView | null) => {
  if (!nextPost) {
    return items
  }

  return items.map((item) => (item.id === nextPost.id ? nextPost : item))
}

/**
 * Renders the authenticated home timeline surface.
 */
const Timeline = ({
  posts,
  nextCursor,
  isLoading,
  composerValue,
  replyValues,
  openReplyId,
  onComposerChange,
  onCreatePost,
  onLoadMore,
  onOpenProfile,
  onLike,
  onToggleReply,
  onReplyValueChange,
  onSubmitReply
}: {
  posts: PostView[]
  nextCursor: string | null
  isLoading: boolean
  composerValue: string
  replyValues: Record<string, string>
  openReplyId: string | null
  onComposerChange: (value: string) => void
  onCreatePost: () => void
  onLoadMore: () => void
  onOpenProfile: (handle: string) => void
  onLike: (post: PostView) => void
  onToggleReply: (postId: string) => void
  onReplyValueChange: (postId: string, value: string) => void
  onSubmitReply: (postId: string) => void
}) => (
  <section className="feed">
    <header className="feed-header">
      <div>
        <h1>Following</h1>
        <p>自己和已关注用户的文本时间线</p>
      </div>
    </header>

    <Composer value={composerValue} onChange={onComposerChange} onSubmit={onCreatePost} />

    <div className="post-list">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          replyValue={replyValues[post.id] ?? ''}
          isReplying={openReplyId === post.id}
          onOpenProfile={onOpenProfile}
          onLike={onLike}
          onToggleReply={onToggleReply}
          onReplyValueChange={onReplyValueChange}
          onSubmitReply={onSubmitReply}
        />
      ))}
    </div>

    {posts.length === 0 && !isLoading ? (
      <div className="empty-state">
        <h2>时间线还很安静</h2>
        <p>先发一条帖子，或者去右侧打开 seed 用户主页再关注他们。</p>
      </div>
    ) : null}

    {nextCursor ? (
      <button className="load-more" type="button" onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? '加载中...' : '加载更多'}
      </button>
    ) : null}
  </section>
)

/**
 * Renders a public profile with follow state and user posts.
 */
const Profile = ({
  currentUser,
  profile,
  posts,
  isLoading,
  onBack,
  onFollowToggle,
  onOpenProfile,
  onLike
}: {
  currentUser: UserView
  profile: UserView | null
  posts: PostView[]
  isLoading: boolean
  onBack: () => void
  onFollowToggle: (user: UserView) => void
  onOpenProfile: (handle: string) => void
  onLike: (post: PostView) => void
}) => (
  <section className="feed">
    <header className="profile-hero">
      <button className="ghost-button" type="button" onClick={onBack}>
        返回
      </button>
      {profile ? (
        <>
          <div className="profile-avatar">{profile.displayName.slice(0, 1).toUpperCase()}</div>
          <div>
            <h1>{profile.displayName}</h1>
            <p>@{profile.handle}</p>
            <p>{profile.bio || '这个用户还没有写简介。'}</p>
          </div>
          <div className="profile-stats">
            <span>{profile.followerCount ?? 0} followers</span>
            <span>{profile.followingCount ?? 0} following</span>
          </div>
          {currentUser.id !== profile.id ? (
            <button className="primary-button small" type="button" onClick={() => onFollowToggle(profile)}>
              {profile.followedByMe ? 'Unfollow' : 'Follow'}
            </button>
          ) : null}
        </>
      ) : (
        <p>{isLoading ? '加载中...' : '用户不存在'}</p>
      )}
    </header>

    <div className="post-list">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          replyValue=""
          isReplying={false}
          onOpenProfile={onOpenProfile}
          onLike={onLike}
          onToggleReply={() => undefined}
          onReplyValueChange={() => undefined}
          onSubmitReply={() => undefined}
        />
      ))}
    </div>
  </section>
)

/**
 * Coordinates auth, timeline, profile, and post interactions for the web app.
 */
export const App = () => {
  const [currentUser, setCurrentUser] = useState<UserView | null>(null)
  const [view, setView] = useState<View>({ name: 'home' })
  const [posts, setPosts] = useState<PostView[]>([])
  const [profilePosts, setProfilePosts] = useState<PostView[]>([])
  const [profile, setProfile] = useState<UserView | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [composerValue, setComposerValue] = useState('')
  const [replyValues, setReplyValues] = useState<Record<string, string>>({})
  const [openReplyId, setOpenReplyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const visiblePosts = useMemo(() => (view.name === 'home' ? posts : profilePosts), [posts, profilePosts, view.name])

  /**
   * Surfaces a failed action in the error banner with a sensible fallback message.
   */
  const reportError = (cause: unknown, fallback: string) => {
    setError(cause instanceof Error ? cause.message : fallback)
  }

  /**
   * Loads the authenticated viewer and timeline.
   */
  const boot = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const me = await api.me()
      setCurrentUser(me.user)

      if (me.user) {
        const timeline = await api.timeline()
        setPosts(timeline.items)
        setNextCursor(timeline.nextCursor)
      }
    } catch (bootError) {
      setError(bootError instanceof Error ? bootError.message : '启动失败')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Refreshes the home following timeline from the API.
   */
  const refreshTimeline = async () => {
    const timeline = await api.timeline()
    setPosts(timeline.items)
    setNextCursor(timeline.nextCursor)
  }

  /**
   * Opens a profile page and loads its posts.
   */
  const openProfile = async (handle: string) => {
    setView({ name: 'profile', handle })
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.userPosts(handle)
      setProfile(response.user)
      setProfilePosts(response.items)
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : '用户加载失败')
      setProfile(null)
      setProfilePosts([])
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Creates a new root post and prepends it to the timeline.
   */
  const createRootPost = async () => {
    if (!composerValue.trim()) {
      return
    }

    try {
      setError(null)
      const response = await api.createPost({ body: composerValue })
      setComposerValue('')
      setPosts((current) => [response.post, ...current])
    } catch (cause) {
      reportError(cause, '发帖失败')
    }
  }

  /**
   * Creates a reply and refreshes the timeline counters.
   */
  const createReply = async (postId: string) => {
    const body = replyValues[postId]?.trim()

    if (!body) {
      return
    }

    try {
      setError(null)
      await api.createPost({ body, parentId: postId })
      setReplyValues((current) => ({ ...current, [postId]: '' }))
      setOpenReplyId(null)
      await refreshTimeline()
    } catch (cause) {
      reportError(cause, '回复失败')
    }
  }

  /**
   * Toggles a like on the provided post and patches local lists.
   */
  const toggleLike = async (post: PostView) => {
    try {
      setError(null)
      const response = post.likedByMe ? await api.unlikePost(post.id) : await api.likePost(post.id)
      setPosts((current) => replacePost(current, response.post))
      setProfilePosts((current) => replacePost(current, response.post))
    } catch (cause) {
      reportError(cause, '操作失败')
    }
  }

  /**
   * Loads another page from the timeline cursor.
   */
  const loadMore = async () => {
    if (!nextCursor) {
      return
    }

    setIsLoading(true)

    try {
      setError(null)
      const timeline = await api.timeline(nextCursor)
      setPosts((current) => [...current, ...timeline.items])
      setNextCursor(timeline.nextCursor)
    } catch (cause) {
      reportError(cause, '加载更多失败')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Toggles follow state for the visible profile and refreshes timeline scope.
   */
  const toggleFollow = async (user: UserView) => {
    try {
      setError(null)
      const response = user.followedByMe ? await api.unfollow(user.id) : await api.follow(user.id)
      setProfile(response.user)
      await refreshTimeline()
    } catch (cause) {
      reportError(cause, '关注操作失败')
    }
  }

  /**
   * Logs out and clears local authenticated state.
   */
  const logout = async () => {
    await api.logout()
    setCurrentUser(null)
    setPosts([])
    setProfilePosts([])
    setView({ name: 'home' })
  }

  useEffect(() => {
    void boot()
  }, [])

  if (isLoading && !currentUser) {
    return <div className="loading-screen">Loading Trumpet...</div>
  }

  if (!currentUser) {
    return <AuthForm onAuthenticated={() => void boot()} />
  }

  return (
    <main className="app-shell">
      <Sidebar
        user={currentUser}
        onHome={() => setView({ name: 'home' })}
        onProfile={() => void openProfile(currentUser.handle)}
        onLogout={() => void logout()}
      />

      <div className="content-column">
        {error ? <p className="error-banner">{error}</p> : null}

        {view.name === 'home' ? (
          <Timeline
            posts={visiblePosts}
            nextCursor={nextCursor}
            isLoading={isLoading}
            composerValue={composerValue}
            replyValues={replyValues}
            openReplyId={openReplyId}
            onComposerChange={setComposerValue}
            onCreatePost={() => void createRootPost()}
            onLoadMore={() => void loadMore()}
            onOpenProfile={(handle) => void openProfile(handle)}
            onLike={(post) => void toggleLike(post)}
            onToggleReply={(postId) => setOpenReplyId((current) => (current === postId ? null : postId))}
            onReplyValueChange={(postId, value) => setReplyValues((current) => ({ ...current, [postId]: value }))}
            onSubmitReply={(postId) => void createReply(postId)}
          />
        ) : (
          <Profile
            currentUser={currentUser}
            profile={profile}
            posts={profilePosts}
            isLoading={isLoading}
            onBack={() => setView({ name: 'home' })}
            onFollowToggle={(user) => void toggleFollow(user)}
            onOpenProfile={(handle) => void openProfile(handle)}
            onLike={(post) => void toggleLike(post)}
          />
        )}
      </div>

      <RightPanel user={currentUser} onOpenProfile={(handle) => void openProfile(handle)} />
    </main>
  )
}
