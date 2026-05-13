# OUMUAMUA

## Raw Layer

### Source Priority
- Conflict rule: `FAQ > PDF > code`

### FAQ Raw (from `docs/arch/rule-faq.md`)
- Species-specific:
  - Exofossils cannot be traded via normal resource-exchange style conversion.
  - Leftover exofossils are worth 0 endgame points.
- Alien traces generic:
  - Discovery/overflow markers count as species traces when effects reference them.

### PDF Raw (from `SETI_Alien_rule_sheets_(EN).pdf`, pages 5-6)
- Setup:
  - Place Oumuamua tile in specified disc-3 space.
  - If probe already there, place probe on top of tile and that player gains 1 publicity immediately.
  - Place 3 data tokens in Oumuamua tile data slot.
  - Place exofossil tokens beside species board.
- Discovery & cards:
  - Standard discovery card distribution by discovery markers (1 per marker).
  - Keep deck + face-up card beside board.
  - Draw icon supports deck draw or face-up take + refill.
  - If no cards exist, draw icon has no effect.
  - Cards can be tucked/discarded and count toward hand limit.
- Exofossils:
  - Specific icon grants 1 exofossil token.
  - Some board spaces require spending exofossils to mark.
  - If player cannot pay required exofossils, space cannot be marked.
  - Topmost spaces can be marked any number of times; each mark spends one exofossil.
- Signals and tile choice:
  - When marking signal in Oumuamua sector, player may mark either sector or Oumuamua tile.
  - Certain icon also allows same choice.
- Oumuamua data slot:
  - 1-point and 2-point reward tied to first and third marker placement in tile data slot.
  - Completing Oumuamua = taking last data in slot.
  - On completion, each marker owner gains 1 exofossil.
  - No winner determination for Oumuamua completion.
  - Refill Oumuamua data fully and remove all markers.
- Planet behavior:
  - Oumuamua counts as planet for effects referencing planets.
  - Visiting it with probe grants publicity.
  - Players may place lander/orbiter on it as with other planets.
- Solo/rival note:
  - Rival signal icon for Oumuamua always marks on Oumuamua tile.
  - Rival can collect exofossils; if cannot pay exofossil-cost space, treat as occupied.

### Code Raw (from `packages/common/src/data/alienCards.ts`)
- Alien type key: `EAlienType.OUMUAMUA`
- Card IDs and names:
  - `ET.22` Altered Trajectory
  - `ET.29` Comparative Analysis
  - `ET.23` Exofossil Discovery
  - `ET.30` Excavation Rover
  - `ET.28` Exofossil Samples
  - `ET.27` Perfect Timing
  - `ET.25` Probe Customisation
  - `ET.26` Race Against Time
  - `ET.24` Terrain Mapping
  - `ET.21` Visitor in the Sky

## Detailed Layer

### 1. Setup Contract
- Oumuamua introduces a persistent special tile plus its own renewable data-slot mini-track.
- Discovery can trigger immediate publicity if occupied placement occurs.

### 2. Exofossil Economy Contract
- Exofossils are dedicated species currency.
- Physical tokens beside the species board are not modeled as a finite server-side supply.
- Spend gates are hard requirements for specific board spaces.
- Top repeatable spaces consume one exofossil per claim.
- FAQ adds strict boundaries:
  - no generic resource conversion
  - no endgame value for leftovers

### 3. Dual Signal Routing Contract
- Oumuamua sector-related signal effects provide a branch choice:
  - standard sector board
  - Oumuamua tile data slot
- Branch choice influences mini-track completion timing and exofossil distribution.

### 4. Renewable Completion Loop
- Completion trigger: remove last data from Oumuamua slot.
- Completion effects:
  - each marker owner gains exofossil
  - no winner marker assignment
  - reset tile to full data with cleared markers
- This forms repeatable throughput distinct from normal sector-win flow.

### 5. Planet Semantics Contract
- Oumuamua is a fully valid planet target for planet-referential effects.
- Supports visit publicity and orbiter/lander placement like standard planets.

### 6. Implementation Notes for Rule Engine
- Needed state fields:
  - Oumuamua tile position
  - tile data-slot fill and marker occupancy
  - per-player exofossil inventory
  - routing choice for signal effects that can target sector or tile
- Recommended events:
  - `onOumuamuaSignalChoice`
  - `onOumuamuaSlotCompleted`
  - `onExofossilSpent`
