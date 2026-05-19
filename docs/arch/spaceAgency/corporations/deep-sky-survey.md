## Metadata

- id: deep-sky-survey
- en: Deep Sky Survey
- zh-CN: 深空探测
- frontend-reference type: look
- frontend-reference display name: Deep Sky Survey
- project image: corporations/Deep Sky Survey.jpg

## Start Resource

- credit: 3
- energy: 2
- card: 0
- publicity: 3
- data: 1
- tuck income: 2
- probe: 0

## Income

- credit: 2
- energy: 2
- card: 1
- publicity: 0
- data: 0
- signal token: 1

## Ability

Passive Ability: You don't need energy to perform Analyze Data Main Action.

Free Action Ability (Once per round): switch a card from your hand with a card on card row.

## Reference Logic

- Setup: selecting this corporation grants 3 credit, 2 energy, 3 publicity, and 1 data; it does not grant a starting card.
- Income: corporation production is 2 credit, 2 energy, 1 card, and 1 signal token; it does not produce data.
- Passive rule: analyze data is treated as costing no energy for this player.
- Free action: `activateCorp` marks the once-per-round use token and opens `swap card`, requiring one hand card and one card-row card to exchange places.
- Round reset: the once-per-round use token returns at the start of the next round.
- Completeness: reference implementation covers setup, no-energy analyze-data discount, swap-card free action, and round reset.
