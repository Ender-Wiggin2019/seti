## Metadata

- id: cosmos-strategy-group
- en: Cosmos Strategy Group
- zh-CN: 宇宙战略集团
- frontend-reference type: cards
- frontend-reference display name: Cosmos Strategy Group
- project image: corporations/Cosmos Strategy Group.jpg

## Start Resource

- credit: 4
- energy: 2
- card: 1
- publicity: 1
- data: 0
- tuck income: 2
- probe: 0

## Income

- credit: 2
- energy: 1
- card: 1
- publicity: 0
- data: 0
- signal token: 0

## Ability

Passive Ability: When you play a card as a main action, you may mark one matching reward space if the card's sector color matches an unmarked space on this organization. Yellow or black cards can mark the credit space, red or black cards can mark the publicity space, and blue or black cards can mark the data space.

Free Action Ability (Once per round): gain 1 card (from either the card row or from the top of the deck), then clear all reward spaces marked on this organization.

## Reference Logic

- Setup: selecting this corporation immediately grants the start resources listed above, then creates its income display from the corporation data sheet.
- Passive trigger: `triggerQuest` watches main-action card signal colors; yellow or black marks the credit reward, red or black marks the publicity reward, and blue or black marks the data reward.
- Reward timing: marking a reward space immediately grants that reward and leaves a player marker on the matching space until cleared.
- Free action: `activateCorp` marks the once-per-round use token, grants 1 card, and returns all marked reward-space tokens to the player's supply.
- Round reset: the once-per-round use token returns at the start of the next round; reward-space markers stay until the free action clears them.
- Completeness: reference implementation covers setup, passive reward marking, free-action reset, and round reset.
