## Metadata

- id: helion-assembly
- en: Helion Assembly
- zh-CN: 赫利昂联合体
- frontend-reference type: techSeller
- frontend-reference display name: Virelon Technologies
- project image: corporations/Helion Assembly.jpg

## Start Resource

- credit: 3
- energy: 2
- card: 0
- publicity: 7
- data: 0
- tuck income: 0
- probe: 0

## Income

- credit: 3
- energy: 1
- card: 1
- publicity: 1
- data: 0
- signal token: 0

## Ability

Passive Ability: When you develop a tech, you may mark the matching reward space on this organization and gain its reward. Probe/orange tech grants 1 energy, scan/purple tech grants 1 signal token, and computer/blue tech grants 1 data.

Free Action Ability (Once per round): destroy one of your probe/orange or scan/purple techs, then tuck one card from your hand for income and clear all reward spaces marked on this organization. The destroyed tech still counts as developed but its ability can no longer be used.

## Reference Logic

- Setup: selecting this corporation immediately grants the start resources listed above, then creates its income display from the corporation data sheet.
- Passive trigger: `triggerQuest` watches developed tech types; orange/probe marks the energy reward, purple/scan marks the signal-token reward, and blue/computer marks the data reward.
- Reward timing: marking a reward space immediately grants that reward and leaves a player marker on the matching space until cleared.
- Free action: `activateCorp` marks the once-per-round use token, clears marked reward-space tokens, opens `destroy tech`, and opens `add production`.
- Destroy restriction: `destroy tech` only accepts the player's non-computer techs; already destroyed techs cannot be destroyed again.
- Completeness: reference implementation covers setup, passive tech rewards, non-computer tech destruction, income-card tuck, reward clearing, and round reset.
