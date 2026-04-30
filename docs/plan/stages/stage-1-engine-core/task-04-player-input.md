# Task 1-4: PlayerInput 续体系统

## Title
实现 PlayerInput 基础接口 + 核心输入类型 (Or/And/SelectOption)

## 描述
实现基于续体（continuation）的玩家输入系统。Server 在需要玩家做出选择时创建 PlayerInput 对象，通过 `process(response)` 接收玩家回应并返回后续输入或 undefined（表示完成）。这是 Server-Client 交互的核心协议。

## 功能说明

### PlayerInput 基础接口
- `type: string` — 输入类型标识
- `player: IPlayer` — 需要做出决策的玩家
- `title?: string` — 提示标题
- `toModel(): IPlayerInputModel` — 序列化为可传输的模型（给 Client 渲染）
- `process(response: IInputResponse): PlayerInput | undefined` — 处理玩家回应

### BasePlayerInput 抽象类
- 实现公共字段和验证逻辑
- `validateResponse(response)` — 校验响应基本结构

### 核心输入类型

**SelectOption:**
- 展示一个或多个选项按钮
- options: `{ label: string; onSelect: () => PlayerInput | undefined }[]`
- process: 按 index 选择，执行 onSelect

**OrOptions:**
- 展示 N 个子输入，玩家选择其中一个
- options: `PlayerInput[]`
- 用于主行动菜单（8 个 main actions 的入口）
- process: 按 index 选择子输入，执行子输入的 process

**AndOptions:**
- 展示 N 个子输入，玩家必须依次全部完成
- options: `PlayerInput[]`
- process: 按顺序处理每个子输入，当前完成后推进到下一个

### 涉及文件
```
packages/server/src/engine/input/
├── PlayerInput.ts
├── PlayerInput.test.ts
├── OrOptions.ts
├── OrOptions.test.ts
├── AndOptions.ts
├── AndOptions.test.ts
└── SelectOption.ts
   └── SelectOption.test.ts
```

## 技术实现方案

1. 定义 `IPlayerInput` 接口和 `BasePlayerInput` 抽象类
2. 实现 `SelectOption`：
   - 构造时接收选项数组（label + callback）
   - `toModel()` 序列化为 `{ type: 'option', options: { label, index }[] }`
   - `process({ index })` 执行对应 callback
3. 实现 `OrOptions`：
   - 构造时接收子 PlayerInput 数组
   - `toModel()` 递归序列化子输入
   - `process({ index, response })` 路由到子输入
4. 实现 `AndOptions`：
   - 内部维护 currentIndex 指向当前待处理的子输入
   - `process(response)` 处理当前子输入，完成后推进
5. 后续 task (Stage 2) 实现 SelectCard, SelectSector 等具体类型

## 测试要求
- `PlayerInput.test.ts`: BasePlayerInput 基础校验
- `SelectOption.test.ts`:
  - 单选项 process 正确执行 callback
  - 多选项 process 按 index 选择
  - 非法 index 抛异常
  - toModel() 序列化正确
- `OrOptions.test.ts`:
  - 子输入路由正确
  - 嵌套 OrOptions 工作
  - toModel() 递归序列化
- `AndOptions.test.ts`:
  - 依次完成所有子输入
  - 中间暂停/恢复正确
  - 部分完成后状态正确

## 完成标准
- [ ] PlayerInput 基础架构完成
- [ ] Or/And/SelectOption 三种核心类型工作正确
- [ ] toModel() 序列化与 protocol types 兼容
- [ ] 所有单测通过
