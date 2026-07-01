# Test Contract: Web Front-end Snake Game

## 项目目标

这个项目实现一个前端 Snake 游戏。用户通过键盘或按钮输入动作，游戏根据规则推进状态，再把结果画到页面上。

更通用地说，它练的是：

> 用户动作进来后，系统要按固定规则把旧状态变成新状态。

OpenAI 类比：

- 当前游戏状态像 **context**。
- 用户按键像新输入。
- `reduceAction` 和 `stepGame` 像小型 **tool**。
- 状态规则测试像 **evals**。

## 输入

输入包括：

- 键盘：方向键、WASD、空格、Enter。
- 页面按钮：start、pause、restart、方向按钮。
- 固定 tick：游戏每隔一段时间推进一帧。
- localStorage：保存最高分。

## 整理和检查

输入不能直接改游戏状态，要先整理：

- 键盘按键要映射成动作，比如 `ArrowUp -> move-up`。
- 未知按键要忽略。
- 反向移动要拒绝，比如向右时不能立刻向左。
- 游戏结束后普通移动不再生效。
- 最高分从 localStorage 读取时，坏值要回到 0。

这里的 **context** 可以理解成“系统做判断前需要知道的背景”。  
比如 Snake 的 context 就是当前蛇的位置、方向、分数、食物位置、游戏状态。

## 核心处理

核心逻辑是：

- `createInitialState`：创建初始游戏状态。
- `reduceAction`：处理用户动作。
- `stepGame`：推进一帧游戏。
- `isOppositeDirection`：判断反向移动。
- `isOutsideBoard`、`pointIsOnSnake`：判断碰撞。

页面渲染、Canvas 绘制、事件监听都只是外层。真正的游戏规则在纯状态函数里。

## 输出

输出是新的游戏状态：

- 蛇的位置。
- 当前方向。
- 食物位置。
- 分数。
- 最高分。
- 游戏状态：idle、running、paused、game-over。
- 最近事件：started、paused、ate-food、game-over 等。

## 不能破的规则

- idle 或 paused 时不能自动移动。
- game-over 后普通方向动作不能继续改变游戏。
- 反向移动必须被拒绝。
- 吃到食物时蛇变长、分数增加。
- 没吃食物时蛇长度不变。
- 撞墙或撞自己时进入 game-over。
- 最高分不能因为低分新局而下降。
- 食物不能优先放在蛇身上，除非棋盘已经满了。

这些就是本项目的 **guardrails**。

## 测试证明

当前测试证明了：

- 初始状态稳定，蛇、方向、食物、最高分正确。
- start、pause、resume、restart 行为正确。
- 合法转向会生效，反向转向会被拒绝。
- running tick 会移动蛇。
- pending direction 会在下一帧生效。
- 吃食物会增长、加分、更新事件。
- 撞墙和撞自己会 game-over。
- paused 和 idle 不会移动。
- 满盘时食物 fallback 行为明确。
- 坐标比较、出界判断、蛇身碰撞判断正确。
- localStorage 最高分能保存、读取，并拒绝坏值。
- 键盘和按钮绑定能正确派发动作，解绑后不再触发。

## 面试讲法

可以这样讲：

> 这个 Snake 项目我没有把规则写死在 Canvas 里，而是把游戏拆成“状态 + 动作 -> 新状态”。这样测试不需要真的打开浏览器玩游戏，也能证明大部分规则是对的。用 OpenAI 的词讲，当前游戏状态就是 context，用户动作就是输入，规则函数像 tool，测试就是 evals。

