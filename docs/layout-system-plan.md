# Game Layout System Redesign Plan

## 目标 (Goals)

### 核心需求
1. **模块化、配置化的布局系统**
   - 每个 section（solar system, sector, tech board, personal board, alien board 等）相对独立
   - 布局可通过配置切换不同模式，而非硬编码

2. **支持多种布局模式**
   - **Tab 模式**（当前默认）：每个 tab 对应一个 section，点击切换
   - **Waterfall 模式**：全屏滚动，所有模块在一个画布上，分三栏布局
   - **移动端单列模式**：响应式降级，所有 section 纵向堆叠

3. **灵活的配置语法**
   - 用户可自定义每个 section 的位置、尺寸、可见性
   - 支持不同布局模式下的独立配置
   - 配置可持久化、导入导出

### Waterfall 模式布局示例

```
┌─────────────────────────────────────────────────────────────┐
│ TopBar (sticky-top)                                         │
├─────────────────────────────────────────────────────────────┤
│ ActionBar (sticky-top, offset: 48px)                        │
├──────────────────┬──────────────────┬──────────────────────┤
│ Left Column      │ Middle Column    │ Right Column         │
│ (380px)          │ (1fr)            │ (420px)              │
│                  │                  │                      │
│ 1. Solar System  │ 1. Tech Board    │ 1. Player Board      │
│ 2. Planet Board  │ 2. Alien Board   │ 2. Log (grow: 1)     │
│ 3. End Game      │ 3. Card Rows     │                      │
│                  │                  │                      │
│ (scroll)         │ (scroll)         │ (scroll)             │
├──────────────────┴──────────────────┴──────────────────────┤
│ Hand (fixed-bottom, height: 120px)                          │
└─────────────────────────────────────────────────────────────┘
```

移动端（< 1024px）自动降级为单列，按 `mobileOrder` 或 slot 优先级排序。

---

## 设计方案 (Design)

### 1. 配置 Schema

**核心类型**：
```typescript
interface LayoutConfig {
  mode: 'tab' | 'waterfall';
  rootGrid: GridConfig;              // waterfall 根布局 + 移动端 fallback
  tabs: TabDef[];                    // tab 模式的 tab 定义
  defaultTab?: string;
  sections: SectionPlacement[];      // 每个 section 的位置配置
  options?: LayoutOptions;           // 全局选项（breakpoint 等）
}

interface SectionPlacement {
  id: SectionId;
  tab?: { container: string; slot: Slot; order: number };       // tab 模式位置
  waterfall?: { slot: Slot; order: number };                    // waterfall 模式位置
  mobileOrder?: number;              // 移动端单列优先级
  pin?: PinMode;                     // sticky-top | fixed-bottom | floating | none
  pinOffset?: { top?: string; right?: string; ... };
  size?: SizeConfig;                 // width/height/minH/maxH/grow
  visible?: boolean;
  collapsible?: boolean;
  responsive?: { mobile?: ...; desktop?: ... };
}
```

**关键设计点**：
- **单一配置源**：同一个 `sections` 数组同时声明 `tab` 和 `waterfall` 位置，切模式时换渲染器，不换配置
- **Tab 内部也是 3 栏 grid**：每个 `TabDef` 有自己的 `grid`，section 用 `tab.slot` 决定在 tab 内哪一栏
- **Chrome（TopBar/ActionBar/Hand）也是 section**：通过 `pin` 字段控制定位方式，默认 `fixed-bottom` / `sticky-top`，可改成 `none` 进流
- **三层优先级**：preset（代码内置）→ localStorage overrides（用户调整）→ responsive（运行时响应式）

### 2. 文件结构

```
packages/client/src/features/layout/
├── types.ts                        # DSL 类型定义
├── presets.ts                      # 内置 preset（tabPreset / waterfallPreset）
├── layoutStore.ts                  # zustand store + localStorage 持久化
├── resolveLayout.ts                # 三层合并逻辑
├── LayoutContext.tsx               # React Context + useLayout hook
├── GameSessionContext.tsx          # 跨 section UI state（hand expanded、armed flags）
├── sectionRegistry.ts              # SectionId → Component 映射表
├── sectionInputs.ts                # pendingInput 类型探测（alien/planet input）
├── sessionHelpers.ts               # 纯工具函数（findOumuamuaTile 等）
├── actionController.tsx            # 跨 section 的 free-action 编排 + dialogs
├── dialogs.tsx                     # 所有 free-action dialogs
├── hooks/
│   └── useResponsiveMode.ts        # 响应式断点检测
├── shells/
│   ├── SectionFrame.tsx            # 统一的 section 容器（锚点 + 折叠 + size）
│   ├── ColumnGrid.tsx              # 共享的 3 栏 grid 渲染器
│   ├── TabShell.tsx                # Tab 模式渲染器
│   ├── WaterfallShell.tsx          # Waterfall 模式渲染器
│   ├── MobileShell.tsx             # 移动端单列渲染器
│   └── PinnedLayer.tsx             # 渲染所有 pin !== 'none' 的 section
├── sections/                       # Section 适配器（薄包装现有视图）
│   ├── index.ts                    # 注册所有 section
│   ├── TopBarSection.tsx
│   ├── ActionBarSection.tsx
│   ├── HandSection.tsx
│   ├── SolarSystemSection.tsx
│   ├── PlanetBoardSection.tsx
│   ├── TechBoardSection.tsx
│   ├── AlienBoardSection.tsx
│   ├── CardRowsSection.tsx
│   ├── PlayerBoardSection.tsx
│   ├── LogSection.tsx
│   └── EndGameSection.tsx
├── devPanel/
│   └── LayoutDevPanel.tsx          # Dev 调试面板（Ctrl+Shift+L）
├── LayoutShell.tsx                 # 根渲染器（选 shell + dev panel）
└── GameLayoutV2.tsx                # 新布局入口（装配 Provider）
```

### 3. 核心抽象

#### SectionRegistry
每个 section 注册一次，声明：
- `id`：唯一标识
- `titleKey`：i18n key
- `Component`：React 组件

Shell 通过 `getSection(id)` 拿到组件渲染，section 适配器不直接 import。

#### SectionFrame
所有 section 都包在 `<SectionFrame>` 里，统一处理：
- 锚点（`id="section-${id}"`）供 `focusSection` 滚动定位
- 折叠/展开（`collapsible` 配置）
- Size 透传（`flex-grow` / `min-height` / `max-height`）
- ErrorBoundary（单个 section 崩溃不影响全局）

#### ColumnGrid
Tab 内部和 Waterfall 根布局共用同一个 3 栏 grid 组件：
- 按 `GridConfig.columns` 决定列宽和可见性
- 按 `slot` + `order` 排序 section
- 每列独立滚动

#### focusSection
跨 section 的焦点调度：
- **Tab 模式**：切到对应 tab + scrollIntoView
- **Waterfall 模式**：直接 scrollIntoView
- 用于 alien input / planet input 自动跳转

### 4. 迁移策略

**Feature Flag 双轨并行**：
- `gameViewStore` 新增 `useNewLayout` flag（默认 `false`）
- `GamePage` 根据 flag 选择 `<GameLayout>` 或 `<GameLayoutV2>`
- 旧布局保留作为 fallback，验证 OK 后再删

**零侵入原则**：
- 现有业务视图（`SolarSystemView` / `PlanetaryBoardView` 等）**完全不动**
- Section 适配器只是薄包装，从 GameContext / GameSessionContext 取数据后透传给视图
- 未来调整布局不会回头碰业务代码

---

## 完成情况 (Status)

### ✅ 已完成

#### 1. 核心基础设施（100%）
- [x] 类型定义（`types.ts`）
- [x] Preset 配置（`presets.ts`）：tab / waterfall 两套预设
- [x] Layout Store（`layoutStore.ts`）：zustand + localStorage 持久化
- [x] 解析器（`resolveLayout.ts`）：三层合并（preset + overrides + responsive）
- [x] Context（`LayoutContext.tsx` / `GameSessionContext.tsx`）
- [x] 响应式 hook（`useResponsiveMode.ts`）

#### 2. Shell 渲染器（100%）
- [x] `SectionFrame`：统一容器 + 锚点 + 折叠 + size
- [x] `ColumnGrid`：共享 3 栏 grid
- [x] `TabShell`：tab 模式渲染 + focusSection 注册
- [x] `WaterfallShell`：waterfall 模式渲染
- [x] `MobileShell`：移动端单列 fallback
- [x] `PinnedLayer`：sticky / fixed / floating 定位
- [x] `LayoutShell`：根渲染器 + 快捷键（Ctrl+Shift+L）

#### 3. Section 适配器（100%）
- [x] 11 个 section 适配器全部完成：
  - TopBar / ActionBar / Hand（chrome）
  - SolarSystem / PlanetBoard / TechBoard / AlienBoard（board）
  - CardRows / PlayerBoard / Log / EndGame（其他）
- [x] Section 注册中心（`sectionRegistry.ts` + `sections/index.ts`）

#### 4. 跨 Section 编排（100%）
- [x] `actionController.tsx`：free-action 编排 + dialogs
- [x] `dialogs.tsx`：BuyCard / Exchange / PlaceData / Sample / ConvertEnergy
- [x] `sectionInputs.ts`：alien/planet input 探测 + slot picker 解析
- [x] `sessionHelpers.ts`：纯工具函数（findOumuamuaTile / buildMilestoneItems 等）

#### 5. Dev Panel（100%）
- [x] `LayoutDevPanel.tsx`：Ctrl+Shift+L 唤出
- [x] Mode 切换（tab ↔ waterfall）
- [x] Export JSON（导出当前配置）
- [x] Reset（重置为 preset）

#### 6. Feature Flag 接入（100%）
- [x] `gameViewStore` 加 `useNewLayout` flag
- [x] `GamePage` 根据 flag 切换 `GameLayout` / `GameLayoutV2`
- [x] TypeScript 编译通过（零错误）

### 🚧 未完成 / 后续扩展

#### 1. Dev Panel 增强
- [ ] GUI 编辑 section 的 slot / order / size
- [ ] 实时预览 grid 列宽调整
- [ ] Import JSON（导入配置）
- [ ] Per-section visibility toggle

#### 2. 遗留组件迁移
- [ ] `EventSidebarDrawer`（右侧抽屉）
- [ ] `SetupChoiceModal`（setup 阶段选择）
- 目前这两个由 legacy GameLayout 提供，切到 V2 时不显示

#### 3. 高级配置
- [ ] Per-tab 的 grid 列宽自定义（目前所有 tab 共用 `DEFAULT_TAB_GRID`）
- [ ] Section 依赖关系（某些 section 只在特定条件下显示）
- [ ] 动画过渡（mode 切换时的平滑动画）

#### 4. 性能优化
- [ ] Section 懒加载（tab 模式下未激活的 tab 不渲染）
- [ ] Virtualized scrolling（waterfall 模式下 section 过多时）

---

## 使用指南 (Usage)

### 开发环境试用

1. **启动 dev server**：
   ```bash
   pnpm dev
   ```

2. **打开任意对局**，在浏览器 console 执行：
   ```javascript
   // 切换到新布局
   useGameViewStore.setState({ useNewLayout: true })
   
   // 切回旧布局
   useGameViewStore.setState({ useNewLayout: false })
   ```

3. **调出 Dev Panel**：
   - 按 `Ctrl+Shift+L`（Windows/Linux）或 `Cmd+Shift+L`（Mac）
   - 切换 Tab / Waterfall 模式
   - Export 当前配置到 JSON
   - Reset 重置为默认

### 自定义配置

配置存储在 `localStorage` 的 `seti-layout-v1` key 下，格式：
```json
{
  "mode": "waterfall",
  "overrides": {
    "log": {
      "size": { "grow": 0, "height": "240px" }
    },
    "solarSystem": {
      "waterfall": { "slot": "middle", "order": 1 }
    }
  },
  "collapsed": {
    "endGame": true
  },
  "rootColumns": {
    "left": "320px",
    "middle": "1fr",
    "right": "480px"
  }
}
```

直接编辑 localStorage 或通过 Dev Panel 的 Export/Import（待实现）。

### 配置示例

#### 示例 1：把 Log 改成定高
```json
{
  "overrides": {
    "log": {
      "size": { "grow": 0, "height": "300px" }
    }
  }
}
```

#### 示例 2：移动端优先显示 PlayerBoard
```json
{
  "overrides": {
    "playerBoard": {
      "mobileOrder": 1
    },
    "solarSystem": {
      "mobileOrder": 2
    }
  }
}
```

#### 示例 3：把 Hand 改成 sticky（跟随滚动）
```json
{
  "overrides": {
    "hand": {
      "pin": "sticky-bottom"
    }
  }
}
```

---

## 技术债务 & 注意事项

### 已知限制

1. **Section 适配器假设 GameContext 非空**
   - 大部分 section 在 `if (!gameState) return null` 后直接用 `gameState.xxx`
   - 如果 GameContext 提供方式变化，需要同步修改所有适配器

2. **ActionMenu / FreeActionBar 内部逻辑未抽离**
   - 这两个组件自己处理 PLAY_CARD 选择、available actions 计算
   - ActionBarSection 只是透传 props，无法完全控制其行为

3. **移动端单列排序逻辑较简单**
   - 当前只支持 `mobileOrder` 或 slot 优先级
   - 未来可能需要更复杂的排序规则（如按 section 类型分组）

### 代码质量

- **TypeScript 覆盖率**：100%，零 `any`
- **Lint 状态**：通过（除了 exhaustive-deps 的有意禁用）
- **测试覆盖**：0%（V1 未写测试，依赖手动验证）

### 性能考量

- **Waterfall 模式下所有 section 同时渲染**，如果 section 过多可能影响性能
- **每次 layoutStore 变化都会重新 resolve 整个 layout**，频繁调整配置时可能卡顿
- 建议后续加入：
  - Section 懒加载（tab 模式）
  - Memoization（resolveLayout 结果缓存）
  - Virtualized scrolling（waterfall 模式）

---

## 下一步 (Next Steps)

### 短期（V1.1）
1. **补齐遗留组件**：EventSidebarDrawer / SetupChoiceModal 适配器
2. **Dev Panel 增强**：GUI 编辑 section 配置 + Import JSON
3. **移动端优化**：测试各种屏幕尺寸，调整 breakpoint 和默认 mobileOrder

### 中期（V2）
1. **性能优化**：Section 懒加载 + Virtualized scrolling
2. **动画过渡**：Mode 切换时的平滑动画
3. **高级配置**：Per-tab grid 自定义、Section 依赖关系

### 长期（V3）
1. **多 Preset 支持**：用户可保存多套配置，快速切换
2. **云端同步**：配置跨设备同步
3. **AI 推荐布局**：根据用户习惯推荐最优布局

---

## 参考资料

- **原始需求**：见本文档「目标」章节
- **代码位置**：`packages/client/src/features/layout/`
- **Feature Flag**：`gameViewStore.useNewLayout`
- **Dev Panel 快捷键**：`Ctrl+Shift+L`
- **配置存储**：`localStorage['seti-layout-v1']`

---

**文档版本**：v1.0  
**最后更新**：2025-01-XX  
**维护者**：Layout System Team
