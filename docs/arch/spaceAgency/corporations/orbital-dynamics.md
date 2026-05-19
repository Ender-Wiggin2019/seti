## Metadata

- id: orbital-dynamics
- en: Orbital Dynamics
- zh-CN: 寰宇动力
- frontend-reference type: probes
- frontend-reference display name: Orbital Dynamics
- project image: corporations/Orbital Dynamics.jpg

## Start Resource

- credit: 2
- energy: 2
- card: 0
- publicity: 3
- data: 0
- tuck income: 2
- probe: 2

## Income

- credit: 3
- energy: 1
- card: 1
- publicity: 0
- data: 0
- signal token: 0

## Ability

Passive Ability: Your probe capacity is 1 higher.

Free Action Ability (Once per round): Move at most 2 probes of yours with 1 step. (one step per probe)

## Reference Logic

- Setup: selecting this corporation immediately grants the start resources listed above, including 2 probe launches, then creates its income display from the corporation data sheet.
- Passive rule: the player's in-space probe limit is increased by 1.
- Free action: `activateCorp` marks the once-per-round use token and opens a move flow for exactly up to 2 different probes, one step per selected probe.
- Probe selection: the move state tracks used probes so the same probe cannot receive both moves from this action.
- Round reset: the once-per-round use token returns at the start of the next round.
- Completeness: reference implementation covers setup, increased probe capacity, two-different-probe movement, and round reset.
