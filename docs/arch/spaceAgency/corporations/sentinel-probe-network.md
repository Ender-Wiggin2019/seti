## Metadata

- id: sentinel-probe-network
- en: Sentinel Probe Network
- zh-CN: 哨兵探测网络
- frontend-reference type: probeSignal
- frontend-reference display name: Sentinel Probe Network
- project image: corporations/Sentinel Probe Network.jpg

## Start Resource

- credit: 4
- energy: 2
- card: 0
- publicity: 3
- data: 0
- tuck income: 1
- probe: 0

## Income

- credit: 3
- energy: 1
- card: 1
- publicity: 0
- data: 0
- signal token: 1

## Ability

Passive Ability: When you launch a probe, mark a signal in that probe's sector.

Free Action Ability (Once per round): after you play and fully resolve a non-alien card as a main action this turn, gain that card's free-action corner effect.

## Reference Logic

- Setup: selecting this corporation immediately grants the start resources listed above, then creates its income display from the corporation data sheet.
- Passive trigger: after launching a probe, the reference marks a signal in that probe's sector by resolving `planetSignal` from Earth.
- Free-action eligibility: `lastCardTopLeftEffect` is recorded only after a played basic/non-alien card's card-effect state fully resolves this turn.
- Free action: `activateCorp` marks the once-per-round use token and resolves the stored free-action corner effect; if no stored effect exists, the action is prevented.
- Round reset: the once-per-round use token returns at the start of the next round, and `lastCardTopLeftEffect` is cleared by turn/round management.
- Completeness: reference implementation covers setup, launch-probe signal marking, fully-resolved-card gating, stored corner-effect replay, and reset behavior.
