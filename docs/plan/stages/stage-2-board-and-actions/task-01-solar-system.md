# Task 2-1: SolarSystem 棋盘 + 旋转机制

## Title
实现太阳系同心环棋盘、圆盘旋转、探针移动与邻接图

## 描述
SETI 的太阳系不是标准网格，而是由 3 个可独立旋转的圆盘组成的同心环结构。实现完整的 SolarSystem 类，包括空间定义、邻接关系、圆盘旋转、探针位置管理和移动逻辑。

## 功能说明

### SolarSystem 类
- `spaces: SolarSystemSpace[]` — 所有可行走空间
- `discs: [Disc, Disc, Disc]` — 上/中/下三个可旋转圆盘
- `adjacency: Map<string, string[]>` — 邻接图
- `rotate(discIndex)` — 旋转指定圆盘
- `getAdjacentSpaces(spaceId)` — 获取相邻空间
- `getSpacesOnPlanet(planet)` — 获取行星上的空间
- `getProbesAt(spaceId)` — 获取某空间上的探针
- `moveProbe(probeId, fromId, toId)` — 移动探针
- `placeProbe(playerId, spaceId)` — 放置新探针

### SolarSystemSpace
- id, position (环/角度), type (普通/小行星/行星/地球/太阳)
- discIndex (属于哪个圆盘, null=外圈)
- hasPublicityIcon (经过时获得宣传)
- occupants (当前在此空间的探针列表)

### Disc (圆盘)
- index (0=top, 1=middle, 2=bottom)
- currentRotation (当前旋转角度/步数)
- spaces (属于此圆盘的空间 ID 列表)

### 旋转机制
- 旋转序列循环: top → middle(top跟随) → bottom(全部跟随) → repeat
- `rotationCounter` 全局计数器决定下一次旋转哪个盘
- 旋转时探针跟随圆盘移动
- 被挤占的探针前进到下一个有效空间
- 经过宣传图标获得宣传值

### BoardBuilder
- 根据随机 seed 构建太阳系布局
- 验证约束：恰好 8 个扇区，每扇区 1 颗近星

### 涉及文件
```
packages/server/src/engine/board/
├── SolarSystem.ts
├── SolarSystem.test.ts
└── BoardBuilder.ts
   └── BoardBuilder.test.ts
```

## 技术实现方案

1. 定义空间类型和圆盘数据结构
2. 实现邻接图构建（基于同心环拓扑，非对角线移动）
3. 实现旋转逻辑：
   - 移动圆盘上所有空间的位置
   - 重新计算邻接关系
   - 处理探针跟随和挤占
4. 实现 BoardBuilder 用 SeededRandom 构建布局
5. 移动逻辑：验证邻接 + 小行星额外消耗 + 宣传图标触发

## 测试要求
- `SolarSystem.test.ts`:
  - 初始布局空间数量正确
  - 邻接关系对称性
  - 旋转后探针位置正确更新
  - 旋转序列循环 (top → middle → bottom → top)
  - 挤占探针前进到正确位置
  - 宣传图标触发
  - 太阳不可穿越
  - 小行星离开额外移动消耗
- `BoardBuilder.test.ts`:
  - 同 seed 产生相同布局
  - 恰好 8 扇区, 每扇区 1 近星
  - 不同 seed 产生不同布局

## 完成标准
- [ ] SolarSystem 完整实现（空间、邻接、旋转、移动）
- [ ] BoardBuilder 能生成合法布局
- [ ] 旋转机制完全符合 PRD §9
- [ ] 所有单测通过
