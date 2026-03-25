# Task 6-3: SectorGrid + SectorView

## Title
实现扇区网格视图 (8 扇区 + 数据槽 + 信号标记 + 完成状态)

## 描述
实现客户端的扇区棋盘可视化：8 个扇区的网格布局，每个扇区内显示数据槽位、信号标记、溢出标记、胜出标记和完成状态。支持 SelectSector PlayerInput 的交互高亮。

## 功能说明

### SectorGrid
- 8 个扇区的网格布局 (2×4 或响应式)
- 按颜色分组: red / yellow / blue / black

### SectorView (单个扇区)
- 扇区颜色标识
- 数据槽位: 显示已有/已移除的数据 token
- 信号标记: 各玩家的标记位置 (颜色区分)
- 溢出标记区域
- 胜出标记 (第一名/后续)
- 完成状态高亮
- SelectSector input 时可点击 + 脉冲高亮

### 数据映射
- 从 `gameState.sectors[]` 读取:
  - dataSlots, markerSlots, overflowMarkers
  - winnerMarkers, completed

### 涉及文件
```
packages/client/src/features/board/
├── SectorGrid.tsx
├── SectorGrid.test.tsx
├── SectorView.tsx
└── SectorView.test.tsx
```

## 技术实现方案

1. SectorGrid: CSS Grid 2×4 布局
2. SectorView: shadcn Card 内显示各状态
3. 数据槽: 圆形 token 序列 (filled/empty)
4. 标记: 玩家颜色圆形小图标
5. 交互: PlayerInput.type === 'sector' 时添加 click handler + highlight

## 测试要求
- `SectorGrid.test.tsx`: 渲染 8 个 SectorView
- `SectorView.test.tsx`:
  - 数据槽正确渲染 (filled/empty)
  - 标记正确按玩家颜色显示
  - 完成状态样式
  - SelectSector input 时可交互 + 高亮
  - 非选择状态时不可交互

## 完成标准
- [ ] 8 扇区正确渲染
- [ ] 数据和标记状态准确反映
- [ ] 选择交互高亮工作
- [ ] 所有单测通过
