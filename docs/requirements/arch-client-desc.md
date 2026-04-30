参考 arch/prd-rule 和 arch/arch-server，为我实现一下 arch-client，以满足需求。

### 技术栈

- react + vite + shadcn + tailwind + react-query 实现 UI. router 可以考虑使用 react-router 或者 tanstack router。
- 导入 @ender-seti/common 和 @ender-seti/cards 实现卡牌渲染
- 其余库，主要参考 server 的实现，看看如何满足数据交互需求

### 页面

- 登录注册
- 用户中心
- 大厅 & 房间 & 游戏设置
- 游戏主页面 (核心实现，需要参考 rule 列举下需要实现的额外组件，以及交互例如 user input)

UI 暂时使用 shadcn 默认风格即可，暂时不需要主题设计，但需要留好参数以便未来迭代调整。

