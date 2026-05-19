## Metadata

- id: futurespan-institute
- en: Futurespan Institute
- zh-CN: 未来跨度研究所
- frontend-reference type: sponsoring
- frontend-reference display name: FutureSpan Institute
- project image: corporations/Futurespan Institute.jpg

## Start Resource

- credit: 3
- energy: 3
- card: 1
- publicity: 3
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

Free Action Ability: prepare one card from your hand by placing it on this organization, then set the Futurespan countdown to that card's credit cost × 10 + 5. You may have only one prepared card at a time.

Main Action Ability: once your score marker reaches or passes the Futurespan token, you may play the prepared card as a main action without paying its credit cost, then return the Futurespan token.

Free Action Ability (Once per round): if the Futurespan token is on the scoring track, move it 3 spaces farther ahead and gain 1 card (from either the card row or from the top of the deck).

## Reference Logic

- Setup: selecting this corporation immediately grants the start resources listed above, then creates its income display from the corporation data sheet.
- Sponsor selection: if no card is sponsored, activating the corporation opens `select sponsor card`; choosing a hand card moves it to `sponsorCard` and creates `sponsor-countdown = cost × 10 + 5`.
- Countdown: whenever the player gains score, `sponsor-countdown` is reduced by the score gained.
- Sponsored play: once the countdown reaches 0 or below, the sponsored card can be played for its main action without spending credit.
- Free action: if a sponsor card already exists, `activateCorp` marks the once-per-round use token, gains 1 card, and increases `sponsor-countdown` by 3.
- Completeness: reference implementation covers card sponsorship, countdown creation/reduction, free sponsored play, once-per-round delay action, and round reset.
