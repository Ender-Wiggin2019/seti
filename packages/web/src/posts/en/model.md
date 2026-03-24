# SETI Basics: Model Calculations

by Ender

## Introduction

Hello everyone, my game ID is Ender_Wiggin. If you're a player of Through the Ages, Terraforming Mars, or Ark Nova, you might have heard of me. I'm a fan of these games and have played a fair number of sessions. SETI is an outstanding card game, and this article will explore its basic numerical model from the perspective of a card eurogame enthusiast and a SETI beginner (I've only played about 20 games).

Let's begin our expedition!

## TL;DR

```desc
{credit-1} = {energy-1} = {data-2} = {publicity-2} = {move-2} = {score-5}
```

```desc
{draw-card-1} = 0.75 {credit-0}<br>
{any-card-1} = 1 {credit-0}<br>
{draw-alien-card-1} = 1.5 {credit-0}
```

```desc
{any-tech} = {credit-3}<br>
{any-trace} = {credit-2}<br>
{any-signal} = {credit-1}
```

The following sections will provide detailed explanations.

## Basic Models

### 1. Credit

```desc
{credit-1} = 1 Value (as the basic unit)
```

Credits are the core resource and the unit of measurement for model calculations.Credits are unique because they have very few ways to be replenished, aside from income, the first Computer Tech, some Aliens' mechanics, and a few cards that gain Credits (likely only 5 cards).

On the other hand, Credits + Cards can theoretically perform almost all game actions, making Credits the top of the resource conversion chain.

Based on this analysis, here are some simple conclusions:

1. Be cautious with the Launch Action. Although launching seems low-cost at 2 Value, an ill-timed launch in mid-game can disrupt your meta. Generally, 4-6 Orbit/Land Actions are appropriate in a game.
2. Credits require enough cards, a fundamental logic of card games. More details on the model of card will be discussed later.
3. In this game design, cards are quite balance in general. The most OP cards may produce 1 more Credit as the reward than usual cards, but no more. And these cards are usually mission cards.

### 2. Energy

```desc
{energy-1} = {credit-1}
```

One of the most basic models, almost everyone agrees that Energy and Credits are equivalent. However, Energy can also be gained through Tech board rewards and some more cards.

A topic that discussed frequently is the ratio between Credit and Energy income. From personal experience, Energy income isn't that crucial; what's important is the **current stock**. If you frequently use Energy for Moves, 3 Energy for Land Actions, etc., Energy will never be sufficed. Meanwhile, If you save Energy from high-cost action such as preventing heavy land or scan, then your Energy can be in a healthy amount. Since Credit + Cards can cover many actions that need Energy.

However, considering the Standard Scan Action (1 Credit + 2 Energy) and potential high Energy usage by the Centaurians (2/5 probability to appear in a game), it's important to be cautious about Energy resource amount, low amount of Energy may be a dangerous sign.

Key takeaways:

1. Energy is an important element for game meta, especially for computer actions and Scan Actions. Sometimes, having one more Energy can bring you many more actions (for example, 1 Energy for the Blue Trace and then you can use the remaining Data for more resources).
2. Unlike Credits, Energy can depreciate. Without card support, Energy is often used for inefficient actions, like 1 Energy per Move, devaluing Energy to 0.5 Value.

### 3. Publicity & Data

```desc
{data-1} = {publicity-1} = 0.5 {credit-0}
```

The Free Action Corner on cards indicates that these resources (Publicity, Data, Move) are theoretically equivalent, although the Data model is a bit odd:

1. Data Free Action cards are the least common, with only 34 cards.
2. Alien cards' Free Action enhance Publicity (1 -> 2 Publicity), but Data and Move only increase by one VP, suggesting their inherent higher value.
3. Some cards have strange values. For example, `121` minus `69` shows 1 Data = 0.5 Credit, while `109` minus `69` suggests 1 Energy = 1 Data? My understanding is that Data's value increases with more blue Tech, gradually approaching 1, though not quite reaching it.

```seti
109,69,121
```

### 4. Card

```desc
{draw-card-1} = 0.75 {credit-0}<br>
{any-card-1} = 1 {credit-0}<br>
```

> Playing a card incurs a 0.5 Credit opportunity cost.

There is no doubt that drawing random cards is the subset of drawing random cards or from card row. The 0.75 for Draw Cards is an experiential and average number because if the card is great, you can have 1+ value for playing this card. While if the card is too weak, you can still discard it for the free action which is about 0.5 value.

There is a very important concept here: play cost. This is a somewhat complex but common concept in card games. The draw cost and play cost are different; the former is 0.75 (or you can consider it as 1), while the latter is a constant 0.5.

For example, The below card seems to have no cost and can be played without any consideration. However, when you play this card, you lose one move as opportunity cost. If the mission isn't completed at all, you lose 0.5 in benefits. If you complete only one task, the benefit is roughly equivalent to discarding it, so in some cases, it might be better to just discard it.

```seti
2
```

Another important concept to introduce is the **standard action** model and the actual action model. Standard actions are those you can perform without needing a card, such as launching a probe, Scan, or Move.

```seti
130,135
```

Take the above cards as examples. They might seem overpowered, but actually they are considered **balanced cards** by the designer:

- The actual model for a Launch Action is 1.5 Credits, which equals the card cost plus a 0.5 Credit opportunity cost.
- The actual model for a Scan Action is 2 Credits, where 0.5 Credits for Publicity plus 2 Credits for scanning equals 2.5.

In some games, like Terraforming Mars (TFM), we clearly know that standard actions are less efficient, so we often choose to use more cost-effective card actions. But this concept is not so obvious in SETI because there are fewer related cards so that players may have to perform standard actions:

```desc
{launch-action} : 15/140<br>
{scan-action} :  7/140<br>
{land-action} :  3/140<br>
```

> PS: You can view the [**full card list**](https://seti.ender-wiggin.com) for more information.

However, I still believe this concept is important. On one hand, because the proportion of these cards is relatively high in Alien Cards, the Mascamites have 6 Land Action cards, and 'Oumuamua has a total of 5 Launch, Scan, and Land Actions combined. Anomalies have 2 related cards. After the Aliens appear, there's a good chance to use overpowered cards instead of standard actions. On the other hand, knowing the actual model allows us to plan for the future. For example, if you have 2 Credits left and nothing to do, you might think about launching a probe. But maybe saving those 2 Credits will let you draw an overpowered Launch card next turn.

Thus, understanding the model's main significance lies in providing deeper strategic thinking and understanding the game's underlying numerical logic. However, it doesn't mean players should rigidly follow the model. SETI is a very dynamic game; while the model is foundational, **timing** is also crucial. For instance, if you perform a standard Launch Action, move one step, and then gain 2 Publicity with the help of the solar system's rotation, you've made a profitable move.

```seti
9,31,117,105
```

Based on this analysis, we can identify some interesting details:

1. `9` is not overpowered in terms of calculation. It follows the standard model (3.5 = 1.5 + 1.5 + 0.5), which is why the designer added an additional Publicity. However, it is somehow overpowered because it means this one card has the same benefits as playing two `130`. Besides, Launch might be necessary. Without cards, launching requires 2 Credit standard action, making it relatively overpowered.
2. `31` is strictly overpowered if the mission can be completed, offering 1 Value Launch and 1 Move. Most mission cards are overpowered if the mission is completed, so **completing missions as much as possible** is a significant factor in efficiently utilizing resources in this game.
3. Similarly, the left third card is 0.5 Value more powerful than the heavy falcon. Although the mission is delayed, we can consider it this way. The rightmost Scan (`105`) is much more than 0.5 Value if it can be fulfilled. Thus, most good mission cards are at least 0.5 Value overpowered.
4. Therefore, inserting cards into income is usually not a profitable option, as its expected return is less than 1. However, it cannot be viewed this way solely because, apart from Credits with a stable 1 benefit, Energy and cards depreciate due to ratio issues. For example, if a lack of Credits forces you to discard cards, one card yields 0.5 benefit; a lack of Move forces you to use Energy for Moves, devaluing Energy.

### 5. Move

```desc
{move-1} = 0.5 {credit-0}<br>
```

Two derivations: one directly from the Free Action Corner showing 0.5 Value, and the example below, where the rightmost minus the second rightmost shows 1 Signal = 1 Credit, thus 1 Move = 0.5 Credit. `25` and `26` can also be used for verification, with extra scoring and special effects roughly worth 0.5 Credit.

```seti
25,26,27,28
```

The Move model explains the following:

1. Why using Energy for Moves is not recommended, as each step theoretically loses 0.5 Value.
2. The Free Action Corner discard for Move is relatively strong. When you must Move, the Free Action Corner can achieve the effect of 1 Energy. This is the third layer of resource conversion: Credit -> Energy -> Move. Each resource has its role; Energy can Move, but with a hand full of Move Free Action Corners, you can't convert them back to Energy. On the other hand, discarding is a quick action with strategic significance for chasing good planets in timing.
3. Move cards aren't very strong because they yield similar benefits to the Free Action Corner discard but require an extra action, which might cause issues. However, it's usually good to have some Move cards for backup, as they are always better than using Energy.
4. Moves should be used wisely. An interesting phenomenon is that if a player has a 4-step Move card, this player might not hesitate to play it to reach any desired planet. However, if another player is poor, that player might wait to use 2 steps after the solar system rotates, achieving the same effect. Even if the Move card is overpowered, the Move itself is inefficient.
5. Additionally, if a Move passes through a comet or planet, it inherently returns 0.5 benefit. This makes 1 Energy Move a standard model. However, if you can reach a planet at the right time with minimal steps and cost while gaining Publicity, that produces huge benefits. This is why the second orange Tech (ignoring asteroids for Move and gaining Publicity) is very powerful.

### 6. Signal & Scan Action

```desc
{any-signal} = {credit-1}<br>
{scan-action} = {credit-2}
```

```seti
27,28,47,48
```

The Signal model is strictly 1 Credit. Calculating from the above cards confirms this.

This conclusion helps understand some aspects:

For Signal:

Mark the last Signal in a sector (only one Signal for your color in total) means 1 Signal for 1 Data + 1 Publicity, which is 1 value for 1 value. But it benefits the first in the sector slightly. But if you can be the second most player in that sector, you're also benefiting. This is basic mutual benefit logic. Similarly, if one Signal occupies the second position for 2 VP, that Signal is at least breaking even.

For Scan Actions:

1. The actual model for Scan Actions is 2 Credits (`135`), with the standard action being 1 Credit 2 Energy, simply converting to 3 Values. Thus, starting with a Scan Action in Round 1 equals a straight 1 Credit loss. So, it's strongly discouraged to start with a Scan.
2. Scanning a sector yourself, the more you scan, the more you lose. For instance, if you scan a 6-grid sector 5 times, it means 5 Credits for 5 Data + 1 Publicity + first-sector rewards. Except for early red Traces, most situations are losses. Therefore, one strategy is to act opportunistically; Scanning alone isn't very cost-effective. Some players might argue that once their blue Tech is stacked, any Scan is profitable. But that's not entirely correct, as you're profiting from blue Tech, not the Signal itself, which is somewhat misleading. If you profit from both Signal and blue Tech, you'd win twice.
3. The second and third Scan Techs yield roughly 0.5 Value each, making the standard Scan Action itself not that inefficient. This indicates that even with two Scan Techs, the standard Scan Action is still merely inefficient, since two Techs have opportunity costs. Replacing them with other Techs might be more profitable. Of course, with the fourth Scan Tech, standard Scan Actions are certainly profitable.

### 7. Tech

```desc
{any-tech} = {credit-3}<br>
```

This value is evident from 6 Publicity for 1 Tech and the cost of Tech cards.

```seti
85,69
```

Thus, many Tech cards are slightly overpowered, especially those with missions and end-game benefits.

On the other hand, Tech's benefits can be broken down. Acquiring a Tech means its benefits must exceed 3 Credits to break even. For example, Tech for launching ships, if it gives Energy, breaks even immediately. The first Scan Tech provides 2 Data, which is low but might reach 4 Data for an income, yielding 3 Credits (Tech bonus + 2 Data + earlier income). This is break-even but not strong.

### 8. VP

```desc
0.5 {credit-0} = {score-3}<br>
```

```desc
1 {credit-0} = {score-5}
```

Many Missions have 2 or 3 VP as rewards. But only few cards has 5+ VP. I prefer to use 5 VP as the basic calculation, while 1 Credit = 6 VP can be a higher standard. The following two cards from the Mascamites species are good references.

```seti
ET.2,ET.6
```

Most mission cards follow this logic, with missions themselves being 0.5 Value overpowered, matching the 3 VP of the second card. Comparing the first and second cards, 3 VP is exchanged for 1 Data.

```seti
79,132,112,111
```

To be honest, the model of VP is a bit tricky and not that clear, maybe 0.5 Credit = 2 VP and 1 Credit = 4 VP is also a reasonable equation. Though I think 4 VP it too low to win the game.

Some more cards for references:

- 3 VP: `51`, `ET.29`
- 5 VP: `79`, `95`, `SE EN 02`

Here's an interesting calculation: assume starting resources, inserting an income card, which is 5 Credits 3 Energy 4 Cards 4 Publicity with a total of 6 Value income. Over 5 rounds, total economy is 5 + 3 + 4 \* 0.5 + 4 \* 0.5 + 4 \* 7 (4 + 2 + 0.5 + 0.5) = 40 Value. With 1 Credit = 5 VP conversion, a base score is 200. If 1 Credit = 6 VP, it can be 240. Including end-game, the total score is a strong contender for first place (In those games I played, the winner usually have 250 - 290 VP, while some special game can have 300+ but it's not that common). This is similar to the TFM Base game logic (with no expansions): if all your actions are base model, you're likely to win.

### 9. Alien Card & Trace

```desc
{draw-alien-card-1} = 1.5 {credit-0}<br>
{any-trace} = {credit-2}<br>
```

> **Playing an Alien Card incurs one Value opportunity cost**

Anomalies are the standard Alien species, as their cards aren't overpowered, unlike the Mascamites. The following example shows the Trace model: 1 Any Trace = 2 Credits. A specified color Trace yields slightly less.

```seti
ET.18,ET.19
```

Some thoughts:

1. Trace benefits can be reverse-calculated: 3 VP 1 Alien Card = 0.5 + 1.5 = 2. The first Trace yields 5 VP 1 Publicity 1 Alien Card, with explosive benefits.
2. If only pure VP benefits remain, Trace almost never breaks even. Thus, mid-to-late game Traces are more like additional benefits rather than core scoring methods. For instance, late-game 1 Energy marking blue Trace primarily aims to clear Data for further rolling, not for the meager points.
3. Cards with 1 Value Trace marking are strong, mainly for strategically securing good positions below.
4. The 'Oumuamua Alien ExoFossil model is about 0.5 Credit; the Centaurians' model is 0.5 Value more overpowered than normal Alien models; Mascamites cards with Credit/Energy sample rewards are about 1 Value overpowered.

### 10. Land Action

Basic cards have very few Land Actions, making it hard to discuss standard and actual models. If forced, the designer considers Land Action = 1 Credit, which is exaggerated.

```seti
12,13,16
```

Some thoughts:

1. The orange Tech for saving 1 Energy on Land Actions has excellent theoretical benefits (returns after 2 uses), but it's nuanced because there's a 2/5 chance of encountering the Mascamites species, and the few basic Land cards are heavyweights. Moreover, most players prefer Orbit initially, not because Orbit is highly profitable, but because Land is too costly, and the initial yellow Trace is limited.
2. If players can Land at the start, using all standard actions: launch a Probe (2) + 2-step Move (1 - 0.5 Publicity benefit) + Land (2) = 4.5 cost, exchanging for 2 Data (1) + Land 5 VP (1) + yellow Trace (first yields at least 2.5 benefits), it's roughly break-even but likely positions you as the first to mark the end-game tile. If the planet is better, using card actions instead of standard actions, the benefits increase.
3. Comparatively, Orbit Action offers higher resource benefits. Using TFM as an example, the first income equals -0.5 + 5 = 4.5 benefits but slightly weaker in end-game competition. Thus, both strategies are viable, and the game's early routes are diverse.

## Conclusion

In conclusion, the game's foundational models are complete. After calculations, it's evident that the game's underlying logic heavily favors "playing cards." While game actions seem numerous and cards appear as just a component, cards are the core of the core. Without the right cards (and most overpowered cards are mission cards), achieving high operational benefits is challenging.
