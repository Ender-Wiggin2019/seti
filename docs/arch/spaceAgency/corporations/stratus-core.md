## Metadata

- id: stratus-core
- en: Stratus Core
- zh-CN: 层云核心
- frontend-reference type: offerEffects
- frontend-reference display name: Stratus Core
- project image: corporations/Stratus Core.jpg

## Start Resource

- credit: 3
- energy: 2
- card: 1
- publicity: 3
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

Free Action Ability (Once per round): gain the free-action corner effects of all 3 cards in the card row without discarding those cards.

## Reference Logic

- Setup: selecting this corporation immediately grants the start resources listed above, then creates its income display from the corporation data sheet.
- Free action: `activateCorp` marks the once-per-round use token and resolves `useAllOfferAlts` with `keepOffer`.
- Card row handling: `useAllOfferAlts` reads each current card-row card's free-action corner effect and queues all three effects.
- No discard: because the effect includes `keepOffer`, the reference does not discard or refill the card row before resolving the queued effects.
- Round reset: the once-per-round use token returns at the start of the next round.
- Completeness: reference implementation covers setup, all-card-row corner-effect resolution, keeping offered cards in place, and round reset.
