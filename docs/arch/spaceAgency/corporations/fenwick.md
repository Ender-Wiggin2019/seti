## Metadata

- id: fenwick-research-center
- en: Fenwick Research Center
- zh-CN: 芬威克研究中心
- frontend-reference type: publ
- frontend-reference display name: NovaTek Industries
- project image: corporations/Fenwick Research Center.jpg

## Start Resource

- credit: 3
- energy: 1
- card: 0
- publicity: 4
- data: 0
- tuck income: 3
- probe: 0

## Income

- credit: 3
- energy: 1
- card: 0
- publicity: 1
- data: 0
- signal token: 0

## Ability

Passive Ability: You only need 5 publicity to research tech.

Free Action Ability (Once per round): spend 1 publicity to gain any card from the card row or a random card from the main deck, then gain that card's free-action corner bonus.

## Reference Logic

- Setup: selecting this corporation immediately grants the start resources listed above, then creates its income display from the corporation data sheet.
- Passive rule: tech development uses a 5-publicity threshold for this player instead of the normal cost.
- Free action: `activateCorp` marks the once-per-round use token, spends 1 publicity, gains 1 card, and immediately resolves that card's free-action corner effect.
- Card source: the reference effect is a generic card gain with `doTopLeft`, so the player may take a card-row card or draw from the deck according to the normal card-gain flow.
- Round reset: the once-per-round use token returns at the start of the next round.
- Completeness: reference implementation covers setup, cheaper tech threshold, card gain with corner effect, and round reset.
