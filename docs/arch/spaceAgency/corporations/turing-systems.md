## Metadata

- id: turing-systems
- en: Turing Systems
- zh-CN: 图灵系统
- frontend-reference type: testTech
- frontend-reference display name: Axion Intelligence
- project image: corporations/Turing Systems.jpg

## Start Resource

- credit: 4
- energy: 2
- card: 1
- publicity: 2
- data: 0
- tuck income: 2
- probe: 0

## Income

- credit: 2
- energy: 2
- card: 1
- publicity: 0
- data: 1
- signal token: 0

## Ability

Passive Ability: When you research a computer/blue tech, gain 1 publicity.

Free Action Ability (Once per round): choose any probe or scan tech. Until the end of this turn, you may use that tech's ability as if you had researched it. This does not count as researching the tech and does not grant its immediate bonuses.

## Reference Logic

- Setup: selecting this corporation immediately grants the start resources listed above, then creates its income display from the corporation data sheet.
- Passive trigger: when the player develops a blue/computer tech, the reference immediately grants 1 publicity.
- Free action: `activateCorp` marks the once-per-round use token and opens `test tech`.
- Test restriction: the card text limits the choice to probe/orange or scan/purple tech, but the frontend-reference `test tech` state currently accepts any acquirable tech tile because `doEffect('testTech')` passes no type condition.
- Tested state: selecting a tech stores `testingTech` on the player and grants no immediate tech bonuses.
- Duration: the tested tech can be used as if developed only for the current turn.
- Completeness: reference implementation covers setup, blue-tech publicity trigger, no immediate bonuses, temporary-use state, and round reset; the only noted gap is the missing probe/scan type restriction during test-tech selection.
