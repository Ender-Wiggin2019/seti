# Task 6-5: CardRowView + EndOfRoundStacks + CardDetail

## Title
实现卡牌行视图、回合末卡堆和卡牌详情

## 描述
实现游戏中的卡牌展示组件：3 张公开卡牌行、4 个回合末卡堆、卡牌放大详情视图、以及选卡交互。集成 `@ender-seti/cards` 的 CardRender 组件。

## 功能说明

### CardRowView
- 3 张公开卡牌水平排列
- 每张卡使用 `@ender-seti/cards` 的 CardRender 渲染
- 交互状态:
  - 闲置: hover 预览放大
  - Buy Card free action: 点击购买 (发光效果)
  - Scan 弃牌: 点击选择弃掉 (红色边框)

### EndOfRoundStacks
- 4 个卡堆 (对应 4 个回合)
- 当前回合堆高亮
- Pass 时选择: 展开当前堆 → 点击选择

### CardDetail
- 放大卡牌视图 (Dialog 或 Popover)
- 使用 CardRender 全尺寸渲染
- 显示卡牌详细信息

### CardPreview
- Hover tooltip 预览
- 缩放版卡牌渲染

### CardList
- 可选择的卡牌列表
- 用于 SelectCard PlayerInput
- 支持 min..max 多选 + 确认按钮

### 数据映射
- `gameState.cardRow` → CardRowView
- `gameState.endOfRoundStacks` → EndOfRoundStacks
- `gameState.players[me].hand` → CardList (in HandView, Stage 7)

### 涉及文件
```
packages/client/src/features/cards/
├── CardRowView.tsx
├── CardRowView.test.tsx
├── EndOfRoundStacks.tsx
├── EndOfRoundStacks.test.tsx
├── CardDetail.tsx
├── CardDetail.test.tsx
├── CardList.tsx
├── CardList.test.tsx
└── CardPreview.tsx
   └── CardPreview.test.tsx
```

## 技术实现方案

1. 引入 `@ender-seti/cards` 的 CardRender + CSS
2. CardRowView: Flex 布局 3 张卡
3. EndOfRoundStacks: 4 列堆叠视觉 (显示数量, 当前高亮)
4. CardDetail: shadcn Dialog + CardRender
5. CardList: Grid 布局 + 选择逻辑 + min/max 控制 + 确认按钮
6. CardPreview: shadcn Tooltip + 小尺寸 CardRender

## 测试要求
- `CardRowView.test.tsx`:
  - 3 张卡正确渲染
  - Buy Card 模式下可点击
  - Scan 弃牌模式下可点击
  - 闲置模式只有 hover 效果
- `EndOfRoundStacks.test.tsx`:
  - 4 个堆叠渲染
  - 当前回合高亮
  - Pass 选择模式展开
- `CardList.test.tsx`:
  - 单选/多选
  - min/max 约束
  - 确认按钮 enable/disable
  - 选择状态视觉反馈

## 参考代码 & 静态资源

### 参考文件
- **`frontend-reference/.../seti/playCard.js`** — `playCard()`, `initialIncomeCard()` — 打牌逻辑、成本计算、任务触发
- **`frontend-reference/.../seti/components.js`** — 搜索 `__card-actions`, `deck-actions`, `sky` — 卡牌区域的配置化布局
- **`frontend-reference/.../seti/states.js`** — `"start income"` state 展示了回合末选卡的交互流程

### 静态资源
- `cardBacks/back_base.jpg` → 默认卡背
- `cardBacks/back_4.jpg`, `back_6.jpg` → 回合特定卡背
- `cardBacks/goalBack.jpg` → 目标/任务卡背
- `icons/draw.png` → 抽卡图标

## 完成标准
- [ ] CardRender 集成工作
- [ ] 卡牌行 3 张正确显示
- [ ] 回合末卡堆正确显示（使用卡背静态资源）
- [ ] CardList 选择交互完整
- [ ] 所有单测通过
