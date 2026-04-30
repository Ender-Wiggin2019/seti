我在 `frontend-reference` 里面提供了可供参考的seti实现代码，主要关注：

- `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti` 游戏前端的demo实现。需要注意的是，我们正式项目的架构和设计可能和参考文件有出入，优先以正式架构为准。参考代码提供思路。
- 游戏UI 交互与展示逻辑，其中例如 `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/tech.js` 是可以沿用的，因为是游戏内的逻辑计算
- 游戏状态初始化 `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/setup.js`
- 组件：`frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/components.js` 项目里面的组件好像是配置化的，你尝试理解一下。具体实现的时候，不要使用 json 的格式，还是通过正常 react 函数组件规范进行设计
- 状态机 `/Users/oushuohuang/Documents/demo-a2ui/frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/states.js`
- 外星人 `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/amoebaLife.js`
- 游戏静态资源 `/Users/oushuohuang/Documents/demo-a2ui/frontend-reference/storage.googleapis.com/cgo-projects/seti` 非常重要，这一部分可以直接复用

你要做的是，先梳理这个 frontend-reference 大致的架构，以为开发提供代码参考为思路，更新 `docs/arch/arch-client.md` 文件。然后同步更新 `/Users/oushuohuang/Documents/demo-a2ui/docs/plan`，里面的前端任务应该可以更加容易的执行了，因为提供了静态资源的参考。