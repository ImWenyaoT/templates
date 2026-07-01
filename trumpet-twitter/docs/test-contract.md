# Test Contract: Trumpet Twitter

## 项目目标

这个项目是一个小型全栈 Twitter：用户可以注册、登录、发帖、回复、点赞、关注，并查看时间线和用户主页。

更通用地说，它练的是：

> 从表单和 HTTP 请求开始，经过输入检查、登录态判断、业务处理、数据库读写，最后返回稳定的页面和 API 结果。

OpenAI 类比：

- shared schemas 像输入 **schema**。
- API route 像 **tool interface**，也就是工具对外暴露的入口。
- service/repository 像真正执行的 **tool**。
- API/UI 测试像 **evals**。
- 登录态、权限、重复点赞限制像 **guardrails**。

## 输入

输入包括：

- 注册表单：handle、display name、password。
- 登录表单：handle、password。
- 发帖和回复内容。
- like/unlike/follow/unfollow 请求。
- cookie 里的 session id。
- timeline 和 profile 的 cursor。
- SQLite 里的已有数据。

## 整理和检查

系统先做这些事：

- shared schema 检查 handle、password、post body、UUID。
- cookie parser 读取 session。
- auth service 根据 session 找当前用户。
- route 层拒绝未登录请求。
- 对不存在的 user/post/parent post 返回明确错误。
- 对重复注册、错误密码、自关注等情况给稳定错误 code。

这里的 **schema** 很重要。  
人话解释：schema 是输入检查规则，避免坏数据进到业务逻辑里。

## 核心处理

核心逻辑分几层：

- shared：定义输入规则和前后端共享类型。
- API route：接收 HTTP 请求，调用对应服务。
- auth service：注册、登录、登出、session 查询。
- repositories：读写 users、sessions、posts、likes、follows。
- web app：根据 API 结果更新页面状态。

## 输出

输出包括：

- API JSON response。
- 稳定 error code 和 message。
- 用户视图，不包含 password hash。
- 帖子视图：作者、点赞数、回复数、是否 liked by me。
- 页面状态：登录页、时间线、用户主页、错误提示。

## 不能破的规则

- 未登录不能发帖、看 following timeline、点赞、关注。
- 重复 handle 不能注册。
- 错误密码不能登录。
- 自己不能关注自己。
- 不存在的 user/post/parent post 必须返回明确错误。
- 重复点赞不能重复计数。
- 取消点赞后计数和 `likedByMe` 必须同步。
- 回复是帖子，但不能混进 root timeline。
- timeline 和 profile posts 分页不能丢数据、重复数据。
- API 不能把 password hash 暴露给前端。

这些规则就是项目的 **guardrails**。

## 测试证明

当前测试证明了：

- health、register、login、logout、me 行为正确。
- session cookie 会设置，并且是 HttpOnly。
- stale cookie 返回未登录。
- duplicate handle、坏注册输入、错误密码、未知账号都被拒绝。
- 未登录请求会被挡住。
- 发帖 body 和 parent id 会被检查。
- following timeline 只显示自己和已关注用户。
- reply 会增加 parent reply count，但不会混入 root timeline。
- like/unlike 不会重复计数。
- 缺失 post/user/profile 会返回明确错误。
- timeline 和 profile posts 支持 cursor 分页。
- shared schema 覆盖 handle、post body、UUID 边界。
- Web UI 覆盖登录、注册、登出、发帖、回复、点赞、加载更多、关注、取关、profile 错误。
- Web API client 覆盖 fetch 参数、cursor 编码、204 响应、错误消息。

## 面试讲法

可以这样讲：

> Trumpet 是这 5 个项目里最接近真实产品的一个。我把它当成一个完整工具链来讲：前端表单和 HTTP 请求是输入，shared schema 负责先把输入检查干净，API/service/repository 负责执行，最后返回固定 JSON 和页面状态。测试覆盖了登录态、权限、数据关系、分页、UI 行为和错误路径。用 OpenAI 的词讲，它是 schema、tools、guardrails、evals 在一个全栈小产品里的组合。

