## Metadata

- id: mission-relay
- en: Mission Relay
- zh-CN: 任务中继站
- frontend-reference type: missions
- frontend-reference display name: Mission Broadcast
- project image: corporations/Mission Relay.jpg

## Start Resource

- credit: 3
- energy: 2
- card: 2
- publicity: 2
- data: 0
- tuck income: 3
- probe: 0

## Income

- credit: 1
- energy: 1
- card: 1
- publicity: 0
- data: 0
- signal token: 0

## Ability

Setup Ability: At the start of the game, mark the lowest-scoring space on the mission gold scoring tile.

Passive Ability: When you play a card with a mission, gain 1 publicity.

Free Action Ability (Once per round): spend 2 publicity to gain any card from the card row or a random card from the main deck, then immediately gain the resource matching that card's income corner.

## Reference Logic

- Setup: `gainCorp` places the player's scoring token on position 2 of final scoring tile id 1 or 5, matching the mission/gold mission scoring tile variant.
- Passive trigger: when the player plays a card with a mission, the reference grants 1 publicity.
- Free action: `activateCorp` marks the once-per-round use token, spends 2 publicity, gains 1 card, and resolves that card's production/income corner immediately.
- Card source: the reference effect is a generic card gain with `getProduction`, so the player may take a card-row card or draw from the deck according to the normal card-gain flow.
- Round reset: the once-per-round use token returns at the start of the next round.
- Completeness: reference implementation covers setup scoring-token placement, mission-card publicity trigger, production-corner card gain, and round reset.
