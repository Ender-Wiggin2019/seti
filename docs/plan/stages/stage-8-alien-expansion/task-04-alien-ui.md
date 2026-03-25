# Task 8-4: Alien UI 组件

## Title
实现外星种族 UI 组件 (AlienBoardView, DiscoveryTrack, AlienCardView)

## 描述
实现客户端的外星种族相关 UI 组件：发现轨道、种族面板、种族特有卡牌渲染。

## 功能说明

### AlienBoardView
- 已发现种族的面板
- 显示种族特定状态
- 种族特有交互 (如有)

### DiscoveryTrack
- 6 个基础发现空间 (3 色 × 2 种族)
- 溢出空间
- 标记放置状态 (玩家颜色 / 中立)
- SelectTrace input 高亮

### AlienCardView
- 种族特有卡牌渲染
- 集成 @ender-seti/cards 或自定义渲染

### 涉及文件
```
packages/client/src/features/alien/
├── AlienBoardView.tsx     + test
├── DiscoveryTrack.tsx     + test
└── AlienCardView.tsx      + test
```

## 技术实现方案

1. DiscoveryTrack: 6 个圆形空间 + 颜色 + 标记
2. AlienBoardView: 条件渲染 (发现后才显示面板)
3. AlienCardView: CardRender variant for alien cards
4. 数据源: `gameState.aliens[]`

## 测试要求
- `DiscoveryTrack.test.tsx`:
  - 6 空间正确渲染
  - 标记正确显示
  - SelectTrace 高亮
  - 未发现时面板隐藏
- `AlienBoardView.test.tsx`:
  - 发现后正确渲染种族面板
  - 种族状态正确

## 完成标准
- [ ] 发现轨道完整渲染
- [ ] 种族面板条件显示
- [ ] SelectTrace 交互工作
- [ ] 所有单测通过
