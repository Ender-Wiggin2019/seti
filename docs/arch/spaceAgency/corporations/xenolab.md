## Metadata

- id: xenolab
- en: Xenolab
- zh-CN: 异星实验室
- frontend-reference type: traces
- frontend-reference display name: XenoLab
- project image: corporations/Xenolab.jpg

## Start Resource

- credit: 2
- energy: 2
- card: 1
- publicity: 1
- data: 0
- tuck income: 3
- probe: 0

## Income

- credit: 2
- energy: 1
- card: 1
- publicity: 0
- data: 0
- signal token: 0

## Ability

Main Action Ability: Xenolab starts with three active action tiles. You may use an active tile as a discounted main action, then flip that tile inactive: spend 1 credit to launch a probe, spend 2 energy to scan, or spend 4 publicity to research any tech.

Passive Ability: When you gain the trace shown on an inactive tile, flip that tile back active. The trace is still gained normally and is not spent.

## Reference Logic

- Setup: selecting this corporation immediately grants the start resources listed above, then creates three active action tiles in blue, purple, and yellow.
- Direct activation: `activateCorp` prevents direct corporation use; the action tiles are used instead.
- Tile actions: an active blue trace tile spends 1 credit to launch a probe, an active yellow trace tile spends 2 energy to scan, and an active purple trace tile spends 4 publicity to develop any tech.
- Tile state: using a tile flips it inactive; gaining the matching alien trace flips an inactive matching tile back active without spending the trace.
- Round reset: this corporation has no once-per-round use token; tile readiness is controlled only by tile use and matching trace gain.
- Completeness: reference implementation covers setup tile creation, direct-use prevention, three discounted main actions, tile flipping, and matching-trace reactivation.
