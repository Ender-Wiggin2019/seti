# Task 4-1: 序列化/反序列化

## Title
实现 GameSerializer + GameDeserializer — 完整游戏状态的 JSON 往返

## 描述
实现游戏状态的序列化（Game → IGameStateDto → JSON）和反序列化（JSON → IGameStateDto → Game）。这是持久化和 Undo 系统的基础。

## 功能说明

### IGameStateDto
完整的游戏快照 DTO（见 arch-server.md §3.3），包含：
- 全局状态: gameId, version, seed, rngState, round, phase, currentPlayerId 等
- 棋盘状态: solarSystem, planetaryBoard, techBoard, sectors
- 卡牌状态: mainDeck, discardPile, cardRow, endOfRoundStacks
- 玩家状态: players[]
- 外星/计分: alienState, milestones, goldScoringTiles
- 事件日志: eventLog

### GameSerializer
- `serializeGame(game: IGame): IGameStateDto` — 纯函数
- 递归遍历 Game 对象树，将每个子系统序列化为对应的子 DTO
- 特别处理: SeededRandom 状态保存、Deck 顺序保存、PlayerInput 续体不保存（重建）

### GameDeserializer
- `deserializeGame(dto: IGameStateDto): Game` — 纯函数
- 从 DTO 重建完整 Game 对象
- 恢复 SeededRandom 状态
- 重建 Deck 顺序
- 重建各子系统引用关系

### State Projection (per-player view)
- `projectGameState(game, viewerId): IPublicGameState`
- 隐藏信息：牌堆顺序、其他玩家手牌、未发现的外星身份
- 公开信息：棋盘、资源、分数、自己的手牌

### 涉及文件
```
packages/server/src/persistence/
├── dto/
│   ├── GameStateDto.ts
│   └── PlayerStateDto.ts
├── serializer/
│   ├── GameSerializer.ts
│   ├── GameSerializer.test.ts
│   ├── GameDeserializer.ts
│   └── GameDeserializer.test.ts
```

## 技术实现方案

1. 定义 IGameStateDto 和所有子 DTO 接口
2. 实现 GameSerializer — 遍历 Game → 逐层转换为 DTO
3. 实现 GameDeserializer — 从 DTO 重建 Game
4. 实现 `projectGameState` — 生成玩家视角的公开状态
5. Round-trip 测试: serialize → deserialize → 重新 serialize → 比较 DTO 相等

## 测试要求
- `GameSerializer.test.ts`:
  - 各子系统序列化正确 (solar system, sectors, players, etc.)
  - SeededRandom 状态保存
  - 空状态 / 满状态边界
- `GameDeserializer.test.ts`:
  - 反序列化后游戏可继续进行
  - RNG 状态恢复后序列一致
- **Round-trip 测试** (关键):
  - `serialize(game) → deserialize → serialize → compare` 二次结果相同
  - 创建游戏 → 执行若干行动 → serialize → deserialize → 继续执行 → 结果与不中断一致
- `projectGameState`:
  - 自己的手牌可见
  - 对手的手牌不可见 (只有 handSize)
  - 牌堆顺序不暴露

## 完成标准
- [ ] IGameStateDto 定义完整
- [ ] serialize → deserialize round-trip 一致
- [ ] 反序列化后游戏可正常继续
- [ ] State projection 信息隐藏正确
- [ ] 所有单测通过
