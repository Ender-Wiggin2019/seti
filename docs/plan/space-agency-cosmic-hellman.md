# Space Agency 扩展架构方案

## Context

把 SETI 的 Space Agency 扩展接入到现有 monorepo (`common` / `server` / `client`) 中，作为 lobby 上的一个总开关 + 4 个可独立勾选的子模块（**Agencies / StartResourceCards / NewDeck / NewAlienSpecies**）。

为什么现在做：
- 规则文档已经齐全 (`docs/arch/spaceAgency/rulebook.md` + `faq.md`)，且 `spaceAgencyCards` (SA.1–SA.42) 与 `spaceAgencyAliens` (SA.ET.1–SA.ET.20，Glyphids/Amoeba) 的卡牌数据已经在 `packages/common/src/data/` 里全量注册（见 `packages/server/src/engine/cards/CardRegistry.ts:38-43`），但 server 完全没有走 SA 路径——既没有机构概念，也没有 quick start cards、新外星 plugin、轮次限制变更、signal-token 扫描互动。
- 现有 lobby 上 `alienModulesEnabled` 单 switch 是 no-op（`GameSettingsPanel.tsx:75`），整个房间设置不可编辑。在加入 SA 这种"含 4 子模块的复合扩展"之前，必须先把 options 链路打通。

**目标产出**：
1. SA 启用/关闭、子模块独立勾选；BASE 模式零回归。
2. 11 个 organization、21 张 quick start cards、3 个新外星种族（Glyphids/Amoeba/Arkhos）、signal-token 扫描互动全量上线。
3. server 用 plugin/registry 模式扩展，不用 if/else。client 完全数据驱动，UI 反映 server 下发的状态。

**用户已确认的关键决策**（替代 agent 草案中的备选）：
- Option 模型：嵌套 `spaceAgencyOptions` 对象。
- `alienModulesEnabled` 迁移到 `Record<EAlienType, boolean>`，**直接用新结构，不做旧 boolean[] 兼容**（项目仍在开发期）。
- 机构 + quick start 选择阶段引入新 phase `EPhase.SETUP_CHOICE`。
- **Organization 像增强版的 Card**：拥有 effects / mission / 起始资源 / 事件驱动 hook；通用事件总线（`onPlayCorporation` 等）替代特化 hook。
- **Player 持有 organization 数组**，未来可一人多机构。
- **Quick Start Card 复用 `preludeCards`**：内部类型保持 `IPreludeCard`（21 张 SR.1–SR.21 数据已就位），展示层用 "Quick Start Card" 文案。
- **SetupChoiceCoordinator 全参数化**：每个候选/选取数量都是 config，且每项配 `canChoose: boolean` 权限点（默认 true，预留未来按角色禁选）。

---

## 1. 顶层 Option 模型

`IGameOptions` 移到 common 单一事实源（`packages/common/src/types/protocol/options.ts`）；client 与 server 都从 common import，删掉 `client/src/api/types.ts:58-65` 与 `server/src/engine/GameOptions.ts:8-16` 的本地定义。

```ts
// packages/common/src/types/protocol/options.ts (NEW)
export enum EExpansion {
  BASE = 'BASE',
  ALIEN = 'ALIEN',
  SPACE_AGENCY = 'SPACE_AGENCY',
}

export interface ISpaceAgencyOptions {
  enabled: boolean;
  agencies: boolean;            // 11 个机构 + 强制 4 轮 / publicity=0 / 3 stacks
  startResourceCards: boolean;  // 21 张 quick start cards (依赖 agencies)
  newDeck: boolean;             // 42 张 SA cards 洗入 main deck
  newAlienSpecies: boolean;     // Glyphids / Amoeba / Arkhos 进选池
}

export type TAlienModulesEnabled = Record<EAlienType, boolean>;

export interface IGameOptions {
  playerCount: number;
  alienModulesEnabled: TAlienModulesEnabled;
  undoAllowed: boolean;
  timerPerTurn: number;
  expansions: EExpansion[];
  isSoloMode: boolean;
  soloDifficulty: TSoloDifficulty;
  spaceAgencyOptions?: ISpaceAgencyOptions; // undefined = 关闭
}

export const DEFAULT_ALIEN_MODULES_ENABLED: TAlienModulesEnabled = {
  [EAlienType.ANOMALIES]: true,
  [EAlienType.CENTAURIANS]: true,
  [EAlienType.EXERTIANS]: true,
  [EAlienType.MASCAMITES]: true,
  [EAlienType.OUMUAMUA]: true,
  [EAlienType.GLYPHIDS]: false,
  [EAlienType.AMOEBA]: false,
  [EAlienType.ARKHOS]: false,
  [EAlienType.DUMMY]: false,
};
```

`validateGameOptions`（搬到 common）补三条：
1. 至少 2 个 alien `enabled`。
2. 若 `spaceAgencyOptions?.enabled === true`：
   - `startResourceCards` 为 true 时必须 `agencies` 为 true。
   - `expansions` 必须含 `SPACE_AGENCY`。
   - `newAlienSpecies=false` 时 Glyphids/Amoeba/Arkhos 三项必须为 false。
3. 否则 Glyphids/Amoeba/Arkhos 三项强制 false。

helpers（同文件）：`isSpaceAgencyEnabled(o)`、`getEnabledSubModules(o)`、`isSignalTokenMechanicEnabled(o)`、`isAlienEnabled(o, alien)`。

> server `GameOptions.ts` 退化为 re-export，让既有 import path 不大动。

---

## 2. Server OOP 设计

### 2.1 ISetupRole — 统一 BaseCorporation 与 OrganizationCard

新增 `packages/server/src/engine/setup/ISetupRole.ts`：

```ts
export interface ISetupRole {
  readonly id: string;
  readonly name: string;
  resolve(player: IPlayer, game: IGame): void;
  getSetupTuckCount(): number; // BaseCorporation=1, organization=0
  dispose?(player: IPlayer, game: IGame): void;
}
```

`BaseCorporation` 改为实现 `ISetupRole`（`tuckIncome=1`）。`GameSetup` 通过 `ISetupRole.resolve(player, game)` 统一入口，不判断角色类型。

### 2.2 Organization — 增强版的 Card

**核心定位**：Organization 本质上是 Card 的超集——既有效果（effects）、又能挂任务（mission）、还能监听全局事件并做响应。设计上**不**为每个具体规则点开特化 hook，而是统一走"事件总线 + Behavior/Effect 编排"。

#### 2.2.1 通用事件总线

新增 `packages/server/src/engine/events/GameEventBus.ts`：

```ts
export enum EGameEvent {
  GAME_SETUP_BEGIN = 'GAME_SETUP_BEGIN',
  GAME_SETUP_END = 'GAME_SETUP_END',
  ROUND_BEGIN = 'ROUND_BEGIN',
  ROUND_END = 'ROUND_END',
  TURN_BEGIN = 'TURN_BEGIN',
  TURN_END = 'TURN_END',
  PLAY_CORPORATION = 'PLAY_CORPORATION',  // 机构上场（resolve 完成）
  PLAY_CARD = 'PLAY_CARD',
  RESEARCH_TECH = 'RESEARCH_TECH',
  SCAN = 'SCAN',
  ANALYZE_DATA = 'ANALYZE_DATA',
  ORBIT = 'ORBIT',
  LAND = 'LAND',
  LAUNCH_PROBE = 'LAUNCH_PROBE',
  PLACE_TRACE = 'PLACE_TRACE',
  MARK_SIGNAL = 'MARK_SIGNAL',
  GAIN_RESOURCE = 'GAIN_RESOURCE',
  SPEND_RESOURCE = 'SPEND_RESOURCE',
  GAIN_CARD = 'GAIN_CARD',
  GAME_END_SCORING = 'GAME_END_SCORING',
}

export interface IGameEventPayload<E extends EGameEvent = EGameEvent> {
  event: E;
  game: IGame;
  player?: IPlayer;
  /** 上下文：每个事件类型有自己的 context shape，由 listener 类型守卫 */
  context: Record<string, unknown>;
}

export interface IGameEventResult {
  /** mutate 型监听可改写 context 字段（如 publicityChoices） */
  contextPatch?: Record<string, unknown>;
  /** 触发的派生 PlayerInput（链式） */
  followUp?: PlayerInput;
}

export type TGameEventListener = (
  payload: IGameEventPayload,
) => IGameEventResult | void;

export class GameEventBus {
  subscribe(event: EGameEvent, listener: TGameEventListener, owner: string): TUnsubscribe;
  emit(payload: IGameEventPayload): IGameEventResult[];
  unsubscribeOwner(owner: string): void; // 玩家退出 / 机构 dispose 时清理
}
```

每个 action（`ResearchTech.ts`、`Scan.ts`、`PlayCard.ts` 等）在关键决策点 `bus.emit({ event: EGameEvent.RESEARCH_TECH, ..., context: { publicityChoices: [5,6] } })`，把 listener 返回的 `contextPatch` 合回 context 后再继续执行。这样 Fenwick 强制锁 5 这种规则只是 RESEARCH_TECH 事件 listener 的一个普通实现，跟"他人 land 时 +1 credit"用同一套机制。

#### 2.2.2 IOrganization 类设计

`packages/server/src/engine/organization/Organization.ts`（**class，不是 plain interface**，方便子类继承扩展）：

```ts
export interface IOrganizationConfig {
  id: EOrganizationId;
  name: string;
  complexity: 'simple' | 'medium' | 'complex';

  // ---- Card-like 部分 ----
  startResources: Effect[];   // 走 BehaviorExecutor，与 ICorp 一致
  income: Effect[];
  /** 静态被动效果描述（仅元数据，不参与执行） */
  passiveEffects?: Effect[];
  /** 机构内置任务（与 Card 的 mission 同结构） */
  missions?: IMissionDef[];
  /** end-of-game 计分项（与 Card.endGameScoring 同结构） */
  endGameScoring?: IEndGameScoringDef[];

  /** once-per-round free action（与 Card.freeAction 同结构）；标记后回合末重置 */
  oncePerRoundFreeAction?: IFreeAction;

  /** 事件订阅清单：声明式而非命令式 */
  eventListeners?: IOrganizationEventListenerSpec[];
}

export interface IOrganizationEventListenerSpec {
  event: EGameEvent;
  /** 过滤条件（例如仅当 player === self、仅当 tech.publicity===6） */
  predicate?: (payload: IGameEventPayload, self: Organization, owner: IPlayer) => boolean;
  /** 副作用 / mutate 实现 */
  handler: (payload: IGameEventPayload, self: Organization, owner: IPlayer) => IGameEventResult | void;
}

export class Organization implements ISetupRole {
  constructor(public readonly config: IOrganizationConfig) {}

  // ISetupRole 实现
  resolve(player: IPlayer, game: IGame): void {
    BehaviorExecutor.applyEffects(player, game, this.config.startResources);
    Income.applyEffects(player, game, this.config.income);
    this.config.missions?.forEach(m => player.playedMissions.push(m.toCardItem(this)));
    this.subscribeListeners(player, game);
    game.eventBus.emit({
      event: EGameEvent.PLAY_CORPORATION,
      game, player,
      context: { organization: this },
    });
  }
  getSetupTuckCount(): number { return 0; }

  dispose(player: IPlayer, game: IGame): void {
    game.eventBus.unsubscribeOwner(this.ownerKey(player));
  }

  // 事件订阅（命令式 escape hatch — 子类可 override）
  protected subscribeListeners(player: IPlayer, game: IGame): void {
    this.config.eventListeners?.forEach(spec => {
      game.eventBus.subscribe(
        spec.event,
        (payload) => {
          if (spec.predicate && !spec.predicate(payload, this, player)) return;
          return spec.handler(payload, this, player);
        },
        this.ownerKey(player),
      );
    });
  }

  protected ownerKey(player: IPlayer): string {
    return `org:${this.config.id}:${player.id}`;
  }
}
```

**特化机构走继承**：复杂机构（5–11 中那些靠纯 config 表达不完的）继承 `Organization` 并 override `subscribeListeners` / `resolve`，例如：

```ts
export class FenwickOrganization extends Organization {
  // 不需要 override 任何方法，纯靠 config.eventListeners 即可：
  //   { event: RESEARCH_TECH, handler: ({context}) => ({ contextPatch: { publicityChoices: [5] } }) }
}

export class XenolabOrganization extends Organization {
  protected override subscribeListeners(player, game) {
    super.subscribeListeners(player, game);
    // Xenolab 特有的 3 个瓷砖状态机
    player.organizationState ??= {};
    player.organizationState.xenolabTiles = [...];
  }
}
```

> **为什么 class + config 双层**：1–4 简单机构靠纯 config 表达，写在 `packages/common/src/data/organizations.ts`；5–11 中复杂机构需要私有状态字段或非声明式逻辑，子类 + override。两层共用同一个父类、同一套事件订阅入口。

#### 2.2.3 OrganizationRegistry（与 AlienRegistry 同构）

```ts
// packages/server/src/engine/organization/OrganizationRegistry.ts
export class OrganizationRegistry {
  static register(factory: () => Organization): void; // factory 而非实例，支持每局独立状态
  static create(id: EOrganizationId): Organization;
  static getAllIds(): EOrganizationId[];
  static getByComplexity(c: 'simple'|'medium'|'complex'): EOrganizationId[];
}
```

`packages/server/src/engine/organization/index.ts` 模块加载时 register 11 个 factory：

```ts
ORGANIZATION_DATA.filter(d => d.complexity === 'simple')
  .forEach(d => OrganizationRegistry.register(() => new Organization(d)));
OrganizationRegistry.register(() => new FenwickOrganization(FENWICK_CONFIG));
OrganizationRegistry.register(() => new XenolabOrganization(XENOLAB_CONFIG));
// ... 其余 medium / complex
```

#### 2.2.4 Player 持有 organization **数组**（多机构预留）

`packages/server/src/engine/player/IPlayer.ts`：

```ts
interface IPlayer {
  // ...
  organizations: Organization[];      // 数组形式；BASE 模式空数组
  /** Organization 私有状态（如 Xenolab 瓷砖、Helion 关闭的科技），按 organizationId 隔离 */
  organizationState: Record<string, unknown>;
  /** 每轮 1 次能力使用记录，按 organizationId 归档 */
  oncePerRoundUsed: Record<EOrganizationId, boolean>;
  quickStartCardIds: string[];        // 同样数组（默认 0/2 张，未来允许更多）
  setupChoiceContext?: ISetupChoiceContext;
}
```

`GameSetup.initialize` 中 SA 路径：

```ts
player.organizations = [];
player.organizationState = {};
player.oncePerRoundUsed = {} as Record<EOrganizationId, boolean>;
```

`SetupChoiceCoordinator` resolve 时按选择把机构 push 进数组、依次调用 `org.resolve(player, game)`。BaseCorporation 仍是 `ISetupRole`，但不进入 `player.organizations`（BaseCorporation 是 fallback setup role，不是机构）。

#### 2.2.5 多机构的事件叠加约定

- 多个 Organization 监听同一事件时，按 player.organizations 的顺序顺序执行 listener；前一个的 `contextPatch` 作为后一个的输入。
- 冲突场景（两个机构都改写 publicityChoices）由 listener 自己决定合并策略（取交集/取并集/后写入覆盖）。每个 listener spec 可声明 `priority?: number` 控制顺序。
- 单局玩家 `organizations.length === 1` 时行为与单机构等价。

#### 2.2.6 Once-per-round Free Action

free action 从 `Card.freeAction` 复用。机构的 `oncePerRoundFreeAction` 注册到 `EFreeAction.USE_ORGANIZATION_POWER` 派遣表，参数为 `organizationId`：

- `packages/server/src/engine/freeActions/UseOrganizationPower.ts` 接 dispatcher：根据 `organizationId` 取出 `org.config.oncePerRoundFreeAction`，校验 `player.oncePerRoundUsed[id] !== true`，执行 → 标记 used。
- 回合末事件 `ROUND_END` 默认 listener 把所有 `oncePerRoundUsed[*]` 重置。

### 2.3 Quick Start Card（沿用 preludeCards 数据）

**复用既有 `IPreludeCard` / `preludeCards`**（`packages/common/src/data/preludeCards.ts`，21 张 SR.1–SR.21 已就位）。**不再新增 `IQuickStartCard` 类型**。

| 层 | 命名 |
|----|------|
| 数据/类型 | `IPreludeCard` / `preludeCards` / 字段名 `upperEffects` / `lowerEffects`（保持现状） |
| Server runtime | `PreludeCardRuntime`（新建 `packages/server/src/engine/prelude/PreludeCardRuntime.ts`） |
| 显示文案 | i18n 的 namespace 与按钮文字均用 "Quick Start Card"（用户习惯） |

```ts
export class PreludeCardRuntime {
  constructor(public readonly data: IPreludeCard) {}
  /** lowerEffects：走 BehaviorExecutor 标准路径，触发 GAIN_RESOURCE / SCORE 等事件 */
  resolveLower(player: IPlayer, game: IGame): void;
  /** upperEffects：silent 模式 — 仅在棋盘上落标记，不发任何 GameEvent，
   *  避免 alien plugin 的 onTraceMark / mission / 任务联动 */
  resolveUpper(player: IPlayer, game: IGame): void;
}
```

silent 实现路径：给 `PlanetaryBoard.placeTraceMark` 与 `SolarSystem.placeOrbiterMark` 加 `silent?: boolean` 参数，silent=true 时不调 `eventBus.emit(PLACE_TRACE / MARK_SIGNAL / ...)` 也不触发 alien plugin 钩子。

解析顺序：**机构 resolve → prelude lower（21 张选中的 2 张，按选择顺序）→ prelude upper → 进入第 2 轮**。

1–2 人 dummy 中立标记：`playerCount ≤ 2 && spaceAgencyOptions.startResourceCards` 时，随机 4 张 prelude 仅 `resolveUpper`，不发 lower 资源。

### 2.4 Phase 与 Setup 重构

新增 `EPhase.SETUP_CHOICE`（`packages/common/src/types/protocol/enums.ts`）。`packages/server/src/engine/Phase.ts:5-19` transitions 表加：

```ts
[EPhase.SETUP, [EPhase.AWAIT_MAIN_ACTION, EPhase.SETUP_CHOICE]],
[EPhase.SETUP_CHOICE, [EPhase.AWAIT_MAIN_ACTION]],
```

`IGame` 加 `roundIndex: number` + `maxRounds: number`：
- BASE：`roundIndex=0, maxRounds=5`。
- SA agencies=true：`roundIndex=1, maxRounds=5`（跳过第 1 轮，仍玩 4 个回合 2/3/4/5；终局判定由 round count 控制）。

`Game.resolveEndOfRound`（`Game.ts:738` 附近）改为：
```ts
this.roundIndex += 1;
this.players.forEach(p => {
  if (p.organizationId !== undefined) {
    OrganizationRegistry.get(p.organizationId)?.onRoundEnd?.(this, p);
  }
});
if (this.roundIndex >= this.maxRounds) {
  this.transitionTo(EPhase.FINAL_SCORING);
}
```

`GameSetup.initialize`（`packages/server/src/engine/GameSetup.ts:36-110`）按以下方式分流：

```ts
const sa = game.options.spaceAgencyOptions;
const useAgencies = sa?.enabled && sa.agencies;
const useStartCards = sa?.enabled && sa.startResourceCards;
const useNewDeck = sa?.enabled && sa.newDeck;
const useNewAliens = sa?.enabled && sa.newAlienSpecies;

// main deck —— newDeck 控制是否洗入 SA 卡
const baseIds = baseCards.map(c => c.id);
const saIds = useNewDeck ? spaceAgencyCards.map(c => c.id) : [];
game.mainDeck = new Deck([...baseIds, ...saIds]);

// stacks 数 / round 计数
game.maxRounds = 5;
game.roundIndex = useAgencies ? 1 : 0;
const stackCount = useAgencies ? 3 : 4;
game.endOfRoundStacks = Array.from({ length: stackCount }, () =>
  game.mainDeck.drawN(game.options.playerCount + 1));

// alien 选池 —— 合并 core 与新 alien
const selectableAliens = GameSetup.getSelectableAliens(game);

// 玩家初始化
game.players.forEach(p => {
  p.publicity = useAgencies ? 0 : 4;
  // ... 其他清零字段 ...
});

if (useAgencies) {
  const choiceConfig = SetupChoiceCoordinator.buildConfigFromOptions(game.options);
  SetupChoiceCoordinator.begin(game, choiceConfig);
  game.transitionTo(EPhase.SETUP_CHOICE);
} else {
  game.players.forEach(p => BaseCorporation.resolve(p, game));
  // 既有 tuck-income 链路保留
  game.transitionTo(EPhase.AWAIT_MAIN_ACTION);
}
```

`getSelectableAliens` 改为：

```ts
private static getSelectableAliens(game: Game): EAlienType[] {
  const enabled = game.options.alienModulesEnabled;
  const core = CORE_RANDOM_ALIENS.filter(a => enabled[a]);
  const useNewAliens = game.options.spaceAgencyOptions?.enabled
                    && game.options.spaceAgencyOptions.newAlienSpecies;
  const next = useNewAliens
    ? [EAlienType.GLYPHIDS, EAlienType.AMOEBA, EAlienType.ARKHOS].filter(a => enabled[a])
    : [];
  return [...core, ...next];
}
```

### 2.5 SetupChoiceCoordinator — 全参数化 + 权限点

设计原则：所有候选数量 / 选取数量 / 候选池 / 是否允许选择都是配置项，**不写死任何数字**。每个配置项都伴随 `canChoose: boolean` 权限点（默认 true，未来可按用户角色 / 房主等下发不同值）。

#### 2.5.1 Config 接口

`packages/server/src/engine/setup/SetupChoiceConfig.ts`：

```ts
export interface ISetupChoicePermission {
  /** 该项是否允许玩家自主选择；false 时由 server 按 strategy 自动决定 */
  canChoose: boolean;
  /** 自动决策策略：random / firstN / 指定 ids；canChoose=false 时使用 */
  autoStrategy?: 'random' | 'firstN' | { ids: string[] };
}

export interface ISetupChoiceConfig {
  /** 机构候选 / 选取数量 */
  organizations: {
    candidatesPerPlayer: number;     // 默认 2（规则书）
    pickCount: number;               // 默认 1，未来可 ≥ 1 实现多机构
    /** 候选池过滤器：默认全部 ORGANIZATION_DATA；可按 complexity 过滤 */
    candidatePoolFilter?: (org: Organization) => boolean;
    permission: ISetupChoicePermission;  // 默认 { canChoose: true }
  };
  /** Quick Start (Prelude) Card 候选 / 选取数量 */
  quickStartCards: {
    enabled: boolean;                // 由 spaceAgencyOptions.startResourceCards 决定
    candidatesPerPlayer: number;     // 默认 3
    pickCount: number;               // 默认 2
    permission: ISetupChoicePermission;
  };
  /** 主卡组初始展示牌：通常 4 张供玩家辅助决策 */
  mainDeckPreview: {
    candidatesPerPlayer: number;     // 默认 4
    keepAll: boolean;                // 默认 true（规则书要求保留全部）
    /** 若 keepAll=false：pickCount 表示要保留的张数 */
    pickCount?: number;
    permission: ISetupChoicePermission;
  };
}

export const DEFAULT_SETUP_CHOICE_CONFIG: ISetupChoiceConfig = {
  organizations: {
    candidatesPerPlayer: 2,
    pickCount: 1,
    permission: { canChoose: true },
  },
  quickStartCards: {
    enabled: true,
    candidatesPerPlayer: 3,
    pickCount: 2,
    permission: { canChoose: true },
  },
  mainDeckPreview: {
    candidatesPerPlayer: 4,
    keepAll: true,
    permission: { canChoose: true },
  },
};
```

`SetupChoiceCoordinator.begin(game, config)` 接收完整 config（默认 `DEFAULT_SETUP_CHOICE_CONFIG`，由 `GameSetup` 根据 options 拼装）。permission 落到具体玩家：单局通常所有玩家共享同一 config，但接口预留 `Map<PlayerId, ISetupChoiceConfig>` 形态以便未来房主权限差异化。

#### 2.5.2 状态机

每位玩家状态独立追踪 step 序列；config 中的每个段落（organizations / quickStartCards / mainDeckPreview）都对应一个 step：

```ts
type TSetupStep =
  | { kind: 'organization', candidates: EOrganizationId[], picks: EOrganizationId[] }
  | { kind: 'quickStart',   candidates: string[],          picks: string[] }
  | { kind: 'mainDeckPreview', candidates: string[],       kept: string[] }
  | { kind: 'done' };

interface ISetupChoiceContext {
  config: ISetupChoiceConfig;
  steps: TSetupStep[];
  currentStepIndex: number;
}
```

每个 step：
1. **构造候选**：按 `candidatesPerPlayer` 从对应 pool 抽取（已 reshuffle 过的随机）。
2. **派发**：
   - `permission.canChoose === true` → 通过 `SelectCard` / `SelectOption` 发给玩家，等待 PlayerInput 回包。
   - `permission.canChoose === false` → 按 `autoStrategy` 立即决定 picks；不需要玩家交互，无缝推进到下一 step。
3. **校验**：picks.length === pickCount（或 mainDeckPreview.keepAll 时全部 kept）。
4. 推进到下一 step。

全员到达 `done` 后，按 seatIndex 顺序 resolve：`organizations[i].resolve(player, game)` → `prelude.resolveLower` → `prelude.resolveUpper` → `mainDeck` 牌进 hand → `transitionTo(EPhase.AWAIT_MAIN_ACTION)`。

#### 2.5.3 GameSetup 拼装 config 的逻辑

```ts
const sa = game.options.spaceAgencyOptions!;
const config: ISetupChoiceConfig = {
  organizations: {
    ...DEFAULT_SETUP_CHOICE_CONFIG.organizations,
    permission: { canChoose: true },  // 未来由权限服务下发
  },
  quickStartCards: {
    ...DEFAULT_SETUP_CHOICE_CONFIG.quickStartCards,
    enabled: sa.startResourceCards,
    permission: { canChoose: sa.startResourceCards },  // 关闭子模块时 canChoose=false 直接跳过
  },
  mainDeckPreview: { ...DEFAULT_SETUP_CHOICE_CONFIG.mainDeckPreview, permission: { canChoose: true } },
};
SetupChoiceCoordinator.begin(game, config);
```

### 2.6 Signal Token 扫描互动

现状：`Resources.signalTokens` 字段已存在；`EFreeAction.SPEND_SIGNAL_TOKEN` 已存在。

新需求：**扫描时弃 signal token 多翻 1 张并标记 signal**。改造 `packages/server/src/engine/effects/scan/ScanActionPool.ts`：进入 sub-action 选择前插入"是否花费 signal token 多翻 1 张"的 SelectOption。可见条件 `player.signalTokens > 0 && isSignalTokenMechanicEnabled(game.options)`。同一次扫描最多花 2 个（卡行只有 3 张，规则约束）。

### 2.7 New Alien Species

3 个新 plugin（接口已就位 `IAlienPlugin.ts:7-48`）：
- `packages/server/src/engine/alien/plugins/GlyphidsAlienPlugin.ts` — 7 色字形令牌、翻译板、卡数据复用 SA.ET.1–10。
- `packages/server/src/engine/alien/plugins/AmoebaAlienPlugin.ts` — 5 细胞器令牌 + overflow 区，复用 SA.ET.11–20。
- `packages/server/src/engine/alien/plugins/ArkhosAlienPlugin.ts` — 9 探索 + 12 安全卡（卡数据需新建 `packages/common/src/data/arkhosCards.ts` 并在 CardRegistry 注册）。

`AlienBoard.ts` 加三个子类（`GlyphidsAlienBoard`、`AmoebaAlienBoard`、`ArkhosAlienBoard`）+ 对应 `isXxxAlienBoard` 类型守卫。`alien/index.ts:45-50` 模块加载时再 register 3 个；选池由 options 控制。

### 2.8 IPlayer 字段扩展

详见 §2.2.4，关键字段：

```ts
organizations: Organization[];
organizationState: Record<string, unknown>;
oncePerRoundUsed: Record<EOrganizationId, boolean>;
quickStartCardIds: string[];      // 内部命名沿用现有 prelude 数据，仅 UI 文案叫 Quick Start
setupChoiceContext?: ISetupChoiceContext;
```

---

## 3. Client 架构

### 3.1 Lobby

把 `IGameOptions` 改 import from common，删 `client/src/api/types.ts:58-65` 本地定义。`GameSettingsPanel.tsx` 改 mutable，新增 `onChange?: (patch: Partial<IGameOptions>) => void`，由 `RoomPage.tsx` 实现并调 `lobbyApi.updateRoomOptions(roomId, patch)`（如 server 没有该 endpoint 需新增 PATCH `/api/rooms/:id/options`）。

新增组件：
- `packages/client/src/pages/lobby/SpaceAgencyOptionsSection.tsx`：顶层 toggle + 4 子模块 + 3 新外星种族；联动逻辑（关 SA → 全关；关 agencies → startResourceCards 强禁；关 newAlienSpecies → 三新种族 toggle 强禁）。
- `packages/client/src/pages/lobby/CoreAlienModulesSection.tsx`：把现有"alien on/off 单 switch"拆成 5 个 core alien 的细分 toggle。

### 3.2 In-game

- `features/setup/SetupChoiceModal.tsx`：当 `game.phase === SETUP_CHOICE` 且本地玩家有未完成的 PlayerInput 时弹出，三步 Stepper（机构→quick start→手牌确认）。
- `features/player/OrganizationBadge.tsx` + `QuickStartCardsThumbnail.tsx`：嵌入 `PlayerDashboard.tsx` 顶部。
- `features/freeActions/OrganizationPowerButton.tsx`：注册到 free action bar，`disabled = oncePerRoundUsed`。
- `features/actions/ScanModal.tsx`：增加"花 signal token 多翻 1 张"选项（仅 `isSignalTokenMechanicEnabled` 返回 true 时显示）。
- `features/alien/{GlyphidBoard,AmoebaBoard,ArkhosBoard}.tsx`：复用现有 5 个外星棋盘组件结构。

### 3.3 数据驱动一致性

- 所有 SA i18n 文案放 `packages/common/src/locales/{en,zh}/spaceAgency.json`。
- Client 不缓存任何 SA 衍生状态，全部从 `gameViewStore.gameState` 派生。
- Mandatory 被动（如 Fenwick 锁科技 5 publicity）：server 在 `ResearchTechPlayerInput` 下发的 `publicityChoices` 数组里直接剔除 6，client 只负责渲染 server 给的 options。

---

## 4. Common 层

需要从 server 抽到 common 的：option 类型 / validate / helper / 机构静态元数据 / Arkhos 卡数据 / Glyphids/Amoeba/Arkhos UI 常量 / SA i18n。**Quick Start Card 数据复用现有 `preludeCards`**，无需新增数据文件。完整列表见 §6。

`IOrganizationData` 草签（`packages/common/src/types/organization.ts`，**只放静态元数据**，runtime 行为在 server 层 Organization class）：

```ts
export interface IOrganizationData {
  id: EOrganizationId;
  name: string;
  i18nKey: string;
  complexity: 'simple' | 'medium' | 'complex';
  /** Card-like 字段，与 IBaseCard / ICorp 保持同构 */
  startResources: Effect[];
  income: Effect[];
  passiveEffects?: Effect[];
  oncePerRoundFreeAction?: IFreeAction;
  missions?: IMissionDefData[];      // 与 IBaseCard 的 mission 字段同结构
  endGameScoring?: IEndGameScoringDef[];
  flavorTextKey?: string;
  image: string;
  /** 是否需要 server 层提供独立 class（不能纯靠 config 表达） */
  requiresCustomClass: boolean;
}
```

`packages/common/src/data/organizations.ts` 导出 `ORGANIZATIONS: readonly IOrganizationData[]` （11 项）。简单机构 `requiresCustomClass=false`，server 直接 `new Organization(data)`；复杂机构 `requiresCustomClass=true`，server 层有对应子类工厂，common 仅负责元数据。

> **Quick Start Card**：内部继续用 `IPreludeCard` / `preludeCards`（`packages/common/src/data/preludeCards.ts:14-202` 已就位）。仅在 i18n 文案、UI 组件名、tooltip 标题层面统一为 "Quick Start Card"；类型层面不重命名以避免大规模改动。

---

## 5. 兼容性 / 迁移

- **DB**：`rooms.options` 是 JSONB（看 `server/src/persistence/`），新增 `spaceAgencyOptions` 字段无需 ALTER。
- **alienModulesEnabled boolean[] → Record**：项目仍在开发期，**直接破坏式迁移**，不写兼容层；DB 里若有老房间数据由 PR1 配套清理脚本一次性更新（或允许重置）。
- **存档**：旧 game state 反序列化时，反序列化层填默认值 `roundIndex=0 / maxRounds=5 / spaceAgencyOptions=undefined / organizationId=undefined`，BASE 模式行为完全不变。
- **测试**：现有 BaseCorporation / GameSetup 单测 mock `spaceAgencyOptions=undefined` 即可。

---

## 6. 文件清单

### Common
```
[NEW] packages/common/src/types/protocol/options.ts             IGameOptions/EExpansion/ISpaceAgencyOptions/validate/helper
[NEW] packages/common/src/types/organization.ts                  IOrganizationData/EOrganizationId
[NEW] packages/common/src/data/organizations.ts                  ORGANIZATIONS[11]
[NEW] packages/common/src/data/arkhosCards.ts                    Arkhos 9 探索 + 12 安全
[NEW] packages/common/src/constant/{glyphids,amoeba,arkhos}.ts   UI 常量
[NEW] packages/common/src/locales/{en,zh}/spaceAgency.json       SA 文案 + Quick Start 显示名
[MOD] packages/common/src/types/protocol/enums.ts                EAlienType.ARKHOS / EPhase.SETUP_CHOICE / EGameEvent
[MOD] packages/common/src/types/BaseCard.ts                      EAlienMap 补 arkhos
[MOD] packages/common/src/index.ts                               re-export
（preludeCards.ts 不动；UI 端用 i18n 把 "Prelude" 显示成 "Quick Start Card"）
```

### Server
```
[MOD] packages/server/src/engine/GameOptions.ts                  re-export from common
[MOD] packages/server/src/engine/IGame.ts                        +roundIndex/+maxRounds/+eventBus
[MOD] packages/server/src/engine/Game.ts                         resolveEndOfRound 加 round counter；初始化 GameEventBus
[MOD] packages/server/src/engine/Phase.ts                        SETUP/SETUP_CHOICE 转换表
[MOD] packages/server/src/engine/GameSetup.ts                    SA 分流 / publicity / stack / alien 池
[MOD] packages/server/src/engine/player/IPlayer.ts               +organizations[] /+organizationState/+oncePerRoundUsed map/+quickStartCardIds[]/+setupChoiceContext
[NEW] packages/server/src/engine/events/GameEventBus.ts           通用事件总线 / EGameEvent / TGameEventListener
[MOD] packages/server/src/engine/actions/ResearchTech.ts          关键决策点 emit RESEARCH_TECH，合并 contextPatch
[MOD] packages/server/src/engine/actions/Scan.ts                  emit SCAN
[MOD] packages/server/src/engine/actions/PlayCard.ts              emit PLAY_CARD（成本计算前）
[MOD] packages/server/src/engine/actions/{Land,Orbit,LaunchProbe,AnalyzeData}.ts  emit 对应事件
[NEW] packages/server/src/engine/setup/ISetupRole.ts
[NEW] packages/server/src/engine/setup/SetupChoiceConfig.ts       ISetupChoiceConfig + ISetupChoicePermission + DEFAULT
[NEW] packages/server/src/engine/setup/SetupChoiceCoordinator.ts  全参数化状态机；buildConfigFromOptions
[MOD] packages/server/src/engine/corporation/BaseCorporation.ts   实现 ISetupRole
[NEW] packages/server/src/engine/organization/Organization.ts     class Organization implements ISetupRole；config 驱动
[NEW] packages/server/src/engine/organization/OrganizationRegistry.ts  factory 注册
[NEW] packages/server/src/engine/organization/index.ts            register all 11 factories
[NEW] packages/server/src/engine/organization/configs/SimpleOrganizationConfigs.ts    1-4 纯 config
[NEW] packages/server/src/engine/organization/subclasses/{Fenwick,DeepSkySurvey,Turing,Cosmos,Sentinel,MissionRelay,Xenolab,Futurespan,Helion}Organization.ts  5-11 子类
[NEW] packages/server/src/engine/prelude/PreludeCardRuntime.ts    resolveLower / resolveUpper（silent 模式）
[NEW] packages/server/src/engine/prelude/PreludeRegistry.ts       按 id 取 IPreludeCard 数据
[NEW] packages/server/src/engine/freeActions/UseOrganizationPower.ts   dispatcher：以 organizationId 为参数
[MOD] packages/server/src/engine/freeActions/processFreeAction.ts  USE_ORGANIZATION_POWER 路由
[MOD] packages/server/src/engine/effects/scan/ScanActionPool.ts    signal token 多翻；emit MARK_SIGNAL
[MOD] packages/server/src/engine/board/PlanetaryBoard.ts            placeTraceMark + silent
[MOD] packages/server/src/engine/board/SolarSystem.ts               placeOrbiterMark + silent
[NEW] packages/server/src/engine/alien/plugins/{Glyphids,Amoeba,Arkhos}AlienPlugin.ts
[MOD] packages/server/src/engine/alien/AlienBoard.ts                 +3 子类 + type guard
[MOD] packages/server/src/engine/alien/index.ts                       register 3 新 plugin
[NEW] packages/server/src/engine/cards/register/registerArkhosCards.ts
[MOD] packages/server/src/engine/cards/CardRegistry.ts                调用 registerArkhosCards
[MOD] packages/server/src/lobby/dto/CreateRoomDto.ts                  spaceAgencyOptions
[MOD] packages/server/src/lobby/lobby.service.ts                       updateRoomOptions endpoint
```

### Client
```
[MOD] packages/client/src/api/types.ts                            删本地 IGameOptions
[MOD] packages/client/src/api/lobbyApi.ts                          updateRoomOptions
[MOD] packages/client/src/pages/lobby/GameSettingsPanel.tsx        mutable + onChange
[MOD] packages/client/src/pages/lobby/RoomPage.tsx                 onChange handler
[NEW] packages/client/src/pages/lobby/SpaceAgencyOptionsSection.tsx
[NEW] packages/client/src/pages/lobby/CoreAlienModulesSection.tsx
[NEW] packages/client/src/features/setup/SetupChoiceModal.tsx     按 ISetupChoiceConfig 渲染步骤；canChoose=false 时跳过该 step
[NEW] packages/client/src/features/player/OrganizationBadgeRow.tsx 多机构数组渲染
[NEW] packages/client/src/features/player/QuickStartCardsThumbnail.tsx  显示文案 "Quick Start Cards"
[MOD] packages/client/src/features/player/PlayerDashboard.tsx
[NEW] packages/client/src/features/freeActions/OrganizationPowerButton.tsx  按 organizationId 列表渲染多个按钮
[MOD] packages/client/src/features/actions/ScanModal.tsx          signal token 多翻
[NEW] packages/client/src/features/alien/{GlyphidBoard,AmoebaBoard,ArkhosBoard}.tsx
[MOD] packages/client/src/features/alien/index.ts
```

### E2E
```
[NEW] packages/e2e/tests/space-agency-setup.spec.ts
[NEW] packages/e2e/tests/space-agency-organization-power.spec.ts
[NEW] packages/e2e/tests/space-agency-new-aliens.spec.ts
[NEW] packages/e2e/tests/space-agency-event-bus.spec.ts          验证 PLAY_CARD / RESEARCH_TECH 等事件触发与多机构叠加
```

---

## 7. PR 分阶段

| PR | 目标 | 依赖 |
|----|------|------|
| **PR1** Foundation | IGameOptions 入 common；alienModulesEnabled 改 Record；lobby UI 可编辑（不引入 SA） | – |
| **PR2** Round counter + ISetupRole + GameEventBus | `roundIndex/maxRounds`；`ISetupRole`；BaseCorporation 适配；`GameEventBus` 接入所有 action 关键决策点（BASE 模式 noop 路径）；BASE 零回归测试 | – |
| **PR3** SpaceAgencyOptions UI + SETUP_CHOICE | `spaceAgencyOptions` 入 IGameOptions；validate；`SpaceAgencyOptionsSection`；`EPhase.SETUP_CHOICE` 转换表 | PR1+PR2 |
| **PR4** Organization core + 简单机构 | `Organization` class + `OrganizationRegistry` + `IOrganizationData`；config 驱动的 1–4 简单机构；`SetupChoiceConfig` + `SetupChoiceCoordinator`（全参数化 + canChoose）；`UseOrganizationPower`；IPlayer organizations 数组字段；`SetupChoiceModal` 渲染 step | PR2+PR3 |
| **PR5** 中复杂机构 + Quick Start (Prelude) | 5–11 机构子类；复用 preludeCards 数据 + `PreludeCardRuntime` resolveLower/Upper；silent 棋盘 API；dummy 中立逻辑 | PR4 |
| **PR6** New Deck + Signal Token | newDeck 注入 main deck；ScanActionPool signal-token 多翻 | PR3 |
| **PR7** New Alien Species | 3 plugin + AlienBoard 子类 + Arkhos 卡数据 + 客户端棋盘 | PR3+PR4 |
| **PR8** i18n + E2E + 文档 | 文案完整（"Prelude" → "Quick Start Card" 显示替换）；E2E 全链路；多机构叠加测试；arch 文档更新 | 全部 |

---

## 8. 风险与缓解

| Risk | 等级 | 缓解 |
|------|------|------|
| 被动能力对基础 action 计算流的拦截深度 | 高 | PR2 在 ResearchTech / Scan / PlayCard / Land / Orbit / AnalyzeData 入口加统一 `eventBus.emit` + `contextPatch` 合并层；BASE 模式无 listener，等价于 noop；为每个 emit 点写"无 listener 时行为不变"单测 |
| 多 Organization 监听同一事件时的合并语义 | 中-高 | listener spec 支持 `priority`；context patch 顺序合并由前一个 listener 输出作为后一个的输入；冲突字段（如 publicityChoices）由 listener 自己定义合并函数；E2E 覆盖双机构同事件用例 |
| Quick Start 顶半部分"标记不触发" | 中 | 给 PlanetaryBoard / SolarSystem 的 mark API 加 `silent` 选项；silent 时不调 `eventBus.emit`、不调 alien plugin onTraceMark；测试 silent 模式下 alienState / missionTracker 状态零变化 |
| SETUP_CHOICE 多人异步 + canChoose=false 自动决策 race | 中-低 | Coordinator 把每个 player 当独立状态机；canChoose=false 的 step 同步原子推进；canChoose=true 的 step 等待 PlayerInput；全员 done 才整体 resolve |
| Mandatory 改写在 client 重复实现导致漂移 | 中 | server 通过 PlayerInput options 数组下发已 patch 后的可选项作为唯一事实源；client 只渲染、不本地计算 |
| Player.organizations 数组带来的状态体积 | 低 | 单局通常长度 ≤ 1（规则书默认）；多机构是预留能力，listener / state 按 organizationId 隔离避免互相污染 |

---

## 9. 验证步骤

**端到端验证（PR8 完成后）**：

1. 单元测试：
   - `pnpm --filter @seti/server test` — 包含每个 organization plugin / quick start runtime / SetupChoiceCoordinator / 3 个新外星 plugin / round counter / silent board API。
   - `pnpm --filter @seti/common test` — `validateGameOptions` 全分支覆盖。

2. 类型与 lint：
   - `pnpm build` — turbo 全 monorepo 构建通过。
   - `pnpm lint` — 包括禁止 client redefine IGameOptions 的规则。

3. E2E（Playwright）：
   - `space-agency-setup.spec.ts`：开 SA + agencies + startResourceCards → 4 玩家分别选机构 + 2 quick start → 进入 round 2 → publicity=0 / endOfRoundStacks.length=3。
   - `space-agency-organization-power.spec.ts`：Fenwick 玩家研究科技时 publicity 选项只剩 5；点击机构 free action 按钮后变灰，回合末重置。
   - `space-agency-new-aliens.spec.ts`：开 newAlienSpecies + Glyphids/Amoeba → 选池只能选这两个 → AlienBoard 渲染 Glyphid/Amoeba 棋盘。

4. 手测：
   - lobby 创建房间，开启/关闭 SA 总开关 + 各子模块组合，确认设置广播给其他玩家。
   - BASE 模式整局回归（5 轮、publicity=4、4 个 stacks），确认零行为差异。
   - SA 模式整局：agencies 选 1 + quickStart 选 2 + 4 张主卡组手牌确认 → round 2 起 → 4 轮终局。
   - signal token 扫描时弃 1 个多翻 1 张并标 signal。

5. 反序列化兼容：用一份 main 分支存档 game state 加载到带 SA 的代码上，确认旧 BASE 局照常运行（roundIndex=0, maxRounds=5, organizationId=undefined）。
