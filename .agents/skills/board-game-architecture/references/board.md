# Board — Hex Graph, Spaces & Map Variants

> Source: `boards/Board.ts`, `boards/MarsBoard.ts`, `boards/BoardBuilder.ts`, `boards/Space.ts`, `boards/BoardType.ts`, `boards/PlacementType.ts`

## Core Idea

The board is a **hex graph** of `Space` nodes. The abstract `Board` class provides adjacency computation, space queries, placement eligibility, and tile management. Concrete boards (Tharsis, Hellas, Elysium, Moon, etc.) define their map layouts using the fluent `BoardBuilder`.

## Space — Per-Hex State

```typescript
type Space = {
  id: SpaceId;
  spaceType: SpaceType;   // LAND | OCEAN | COVE | COLONY | RESTRICTED | DEFLECTION_ZONE
  x: number;
  y: number;
  bonus: Array<SpaceBonus>;  // Resources gained when placing here
  tile?: Tile;                // Current tile (undefined = empty)
  player?: IPlayer;           // Tile owner
  volcanic?: boolean;
  // Underworld fields
  undergroundResources?: UndergroundResourceToken;
  excavator?: IPlayer;
  coOwner?: IPlayer;
}
```

`SpaceType` governs what can be placed:
- `LAND` — cities, greeneries, special tiles
- `OCEAN` — ocean tiles only
- `COVE` — either ocean or land tiles
- `COLONY` — off-board colony slots (not adjacent to anything)
- `RESTRICTED` — cannot place anything
- `DEFLECTION_ZONE` — special Hollandia rules

## Board — Abstract Hex Graph

```typescript
abstract class Board {
  public readonly spaces: ReadonlyArray<Space>;
  private readonly adjacentSpaces: Map<SpaceId, ReadonlyArray<Space>>;

  constructor(spaces: ReadonlyArray<Space>, noctisCitySpaceId?: SpaceId) {
    // Build adjacency map using hex coordinate math
    spaces.forEach(space => {
      this.adjacentSpaces.set(space.id, this.computeAdjacentSpaces(space));
    });
  }
```

### Adjacency Computation

Uses offset hex coordinates. For a 9-row hex grid (5,6,7,8,9,8,7,6,5 tiles), neighbors are computed based on row position relative to the middle row:

```
     0 1
    5 X 2     (clockwise from top-left)
     4 3
```

Colony spaces have no adjacency (they're off-board).

### Key Query Methods

```typescript
getSpaceOrThrow(id: SpaceId): Space
getAdjacentSpaces(space: Space): ReadonlyArray<Space>
getSpaces(spaceType: SpaceType): ReadonlyArray<Space>
getOceanSpaces(): ReadonlyArray<Space>   // Spaces with ocean tiles
```

### Placement Eligibility

```typescript
// In MarsBoard:
getAvailableSpacesForType(player, placementType, affordOptions?): Array<Space>
getAvailableSpacesForCity(player): Array<Space>
getAvailableSpacesForGreenery(player): Array<Space>
getAvailableSpacesForOcean(player): Array<Space>
getAvailableSpacesOnLand(player): Array<Space>
```

`PlacementType` is a union covering all placement categories:

```typescript
type PlacementType = 'city' | 'greenery' | 'ocean' | 'land' | 'isolated'
  | 'upgradeable-ocean' | 'volcanic' | ...(expansion-specific types)
```

### Additional Costs

`Board` tracks per-space costs (e.g., Hellas ocean bonus cost, Ares hazard adjacency costs):

```typescript
type SpaceCosts = {
  megacredits: number;
  production: number;
  tr: TRSource;
}

// Override in subclasses:
protected spaceCosts(space: Space): SpaceCosts;
```

### Static Helpers

```typescript
static ownedBy(player): (space: Space) => boolean
static isOceanSpace(space): boolean
static hasRealTile(space): boolean
static spaceHasType(space, tileType): boolean
```

## MarsBoard — Mars-Specific Rules

Extends `Board` with Mars-specific logic:
- City placement: must not be adjacent to existing cities (except Noctis City)
- Ocean placement: must be ocean-type space
- Greenery placement: must be adjacent to owned tiles (if possible)
- Edge detection for special cards
- Red city adjacency filtering
- Ocean upgrade support

## BoardBuilder — Fluent Map Construction

```typescript
class BoardBuilder {
  // Fluent API for building rows of spaces
  ocean(...bonus: Array<SpaceBonus>): this;
  land(...bonus: Array<SpaceBonus>): this;
  volcanic(...bonus: Array<SpaceBonus>): this;
  cove(...bonus: Array<SpaceBonus>): this;
  restricted(): this;
  deflectionZone(...bonus: Array<SpaceBonus>): this;

  doNotShuffleLastSpace(): this;  // Pin special spaces during map shuffle
  lastSpaceIsVolcanic(): this;

  build(): Array<Space>;  // Apply shuffle if enabled, assign coordinates
}
```

Assumes a standard 9-row hex grid (5,6,7,8,9,8,7,6,5). The builder:
1. Collects space types and bonuses in declaration order
2. Optionally shuffles (respecting pinned spaces)
3. Assigns `SpaceId` and (x, y) coordinates
4. Adds colony off-board spaces (Ganymede, Phobos)
5. Adds expansion-specific colony spaces if enabled

### Map Variant Example

```typescript
class TharsisBoard {
  static newInstance(gameOptions, rng): MarsBoard {
    const builder = new BoardBuilder(gameOptions, rng);
    // Row 1: 5 spaces
    builder.land(SpaceBonus.STEEL, SpaceBonus.STEEL).land(SpaceBonus.STEEL)
      .land().ocean().ocean(SpaceBonus.DRAW_CARD, SpaceBonus.DRAW_CARD);
    // Row 2: 6 spaces
    builder.land().land(SpaceBonus.STEEL).land().land().land()
      .ocean(SpaceBonus.DRAW_CARD, SpaceBonus.DRAW_CARD);
    // ... more rows
    return new MarsBoard(builder.build(), /* noctisCitySpaceId */);
  }
}
```

Each map variant (Tharsis, Hellas, Elysium, Arabia Terra, Vastitas Borealis, etc.) is a separate class that constructs its layout via `BoardBuilder`.

## BoardType

Simple discriminator for multi-board games:

```typescript
enum BoardType { MARS = 'mars', MOON = 'moon' }
```

Used in card hooks like `onTilePlaced(cardOwner, activePlayer, space, boardType)` so cards can react differently to Mars vs Moon tile placements.

## Key Takeaways

1. **Abstract `Board`** — generic hex graph with adjacency, not Mars-specific
2. **`Space` as mutable state** — tile, player, bonuses, underworld tokens
3. **`BoardBuilder` fluent API** — readable map definitions, supports shuffling
4. **`MarsBoard` rules layer** — city/greenery/ocean placement rules, edge detection
5. **Map variants via subclass** — each map is a separate class building its own layout
6. **`PlacementType` union** — extensible placement categories for different tile types
7. **Space costs** — per-space additional costs enable maps with special mechanics (Hellas, Ares)
