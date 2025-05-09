# SETI 基础：模型计算

by Ender

## 前言

按我个人的习惯，我是不喜欢在我没有玩明白一款游戏前就写攻略的，这种感觉就像是没准备好就去考试一样。但是现在愈加发现自己已经没有这么多时间去研究一款桌游了，因此不得不做出一些妥协。这也是本文的初衷——仅仅是一些最基础的模型分享，没有任何上层建筑。

## 结论先行

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

下面会逐一论证。

## 基础模型

### 一、钱 (Credit)

```desc
{credit-1} = 1费 (作为基本单位)
```

游戏的核心资源，也是模型计算的计量单位。钱这个资源最特殊的地方在于，回复手段非常少，除了收入、蓝科、外星人的机制、几张可以回钱的卡牌（应该是只有 5 张）。

另一方面，钱+牌理论上可以实现几乎所有游戏行动，因此钱是资源转换链的最顶端。

基于以上的分析，可以得出几个简单的结论：

1. 发射探测器要克制。因为发射是个标动，2 费点一下似乎当前回合没什么负担。第一轮确实一般要发射，但是中期的一个不合时宜的发射可能会直接打乱自己的操作节奏，另一方面实际上一局游戏并不需要这么多次发射（4-6 次环绕/登陆是合适的数字）。
2. 钱需要过牌量做支撑，这也是卡牌游戏的底层逻辑之一。对于卡牌的部分，会在后文详细介绍。
3. 由于机制设计，目前的基础卡牌暂不支持电表倒转的变魔术操作。

### 二、电 (Energy)

```desc
{energy-1} = {credit-1}
```

最基础的模型之一，几乎没有人会认为电和钱的价值是不等价的。但是电的获取方式多了科技板块的奖励，以及部分卡牌会直接送电，还有一张可以伪电表倒转的`90`。

这里会引入的一个抉择点就是，收入中钱和电的配比问题。从个人经验上来说，电收入不是关键，关键的是**当前的存量**。如果天天用电走路，3 电登陆啥的，那多少电都是不够用的。不过考虑到 1 钱 2 电的标动扫描，以及潜在的用电大户半人马族，对于电一定要有一定警觉感，电量见底是一个危险的信号，很可能会影响资源运转。

几个小结论：

1. 电是运转的核心组件，尤其是对于电脑行动和标动扫描来说，有时候多一个电就又是一波操作。
2. 电不同于钱，电会贬值。如果没有牌做支撑，电会经常用于做一些亏模行动，最典型的就是 1 电走路。这时候电就贬值为 0.5 费了。

### 三、宣传 (Publicity) & 数据 (Data)

```desc
{data-1} = {publicity-1} = 0.5 {credit-0}
```

卡牌左上角的免费行动角告诉了我们，这几种资源理论上是等价的，虽然数据的模型略微有点诡异：

1. 一方面，数据卡牌的比例是最少的，只有 34 张
2. 另一方面，外星人牌里面强化了宣传 （1 -> 2 宣传），但数据和移动只多了一分，可以理解为这二者本身的价值已经偏高，没法做到双倍收益。
3. 以及，卡牌中有非常诡异的数值。如下图，`121`(右一)减`69`(右二)可得 1 数据 = 0.5 钱，而`109`(左一)减右二可得 1 电 = 1 数据？对...对吗？不过我个人的理解是，数据会随着蓝科的增加而提高价值，因此收益是会水涨船高的。随着蓝科越来越多，数据的收益也会渐渐趋向于 1，虽然肯定还是达不到。

```seti
109,69,121
```

### 四、牌 (Card)

```desc
{draw-card-1} = 0.75 {credit-0}<br>
{any-card-1} = 1 {credit-0}<br>
```

对于具有展示区机制的游戏，盲抽和精选都是有模型差异的，这里我对比了多张卡牌后得出了这个结论，并且是比较自洽的。盲抽的 0.75 是一个经验数字，因为卡牌下限是弃掉拿 0.5 收益，如果一张牌愿意打出来，那么基本是至少 1 收益的，因此抽牌的收益肯定是大于 0.5 的。

这里有一个非常重要的概念，即**打出成本**。这是一个有点绕但是很常见的卡牌游戏概念，抽牌成本和打出成本是不同的含义，前者是 0.75 (或者认为是 1 也可以)，而后者是恒定的 0.5。
举个例子：

```seti
2
```

比如这张牌，看似 0 块钱，是毫无心智负担的卡牌，看到就可以直接打出。但是当你打出了这种牌，就失去了一移动。如果这个任务完全没做，那就是血亏 0.5 收益。如果只做了一个，也就差不多和弃掉持平，因此在一些情况下可能不如不直接弃掉。

另外还有一个需要引入的重要概念是：**标准行动**（简称标动）模型和实际行动模型。标准行动意味着你无需卡牌即可执行的行动，例如发射探测器、扫描、移动。

```seti
130,135
```

以上图为例，看似它们是超模牌，但实际上它们是设计师眼中的**均模牌**：

- 发射行动的实际模型是 1.5 钱，正好等于卡牌费用+0.5 钱机会成本
- 扫描行动的实际模型是 2 钱，宣传的 0.5 钱 + 扫描的 2 钱正好等于 2.5。

在一些游戏中，我们能明显知道标准行动是亏模的，往往会选择用更高性价比的卡牌行动。这一点在 SETI 中不是很明朗，因为相关卡片的数量比较少，玩家经常不得不标动：

```desc
{launch-action} : 15/140<br>
{scan-action} :  7/140<br>
{land-action} :  3/140<br>
```

> 注: 你可以查看[**完整卡表**](https://seti.ender-wiggin.com)了解更多信息。

但是我依然认为这个概念是重要的。一方面因为外星人里面这些卡的占比比较高，虫族有 6 张登陆，'Oumuamua 的发射扫描登录加起来也有 5 张，Anomalies (水滴) 有 2 张，在外星人出来后是挺有机会可以超模一波放弃标动的。另一方面，知道实际的模型，可以让我们对于未来有更多的规划。比如本来没事干了正好剩了 2 块钱，玩家就可能想着反着也是没事不如发射个探测器。但也许这 2 块钱省着，下轮就摸到一张超模的发射牌了。

因此，知道模型的主要意义在于提供更深层次的思考，了解游戏的一些底层数值逻辑。但并不是让玩家一板一眼的按照模型操作。 SETI 是一个非常灵动的游戏，模型是基础，但是操作和对时机的把握也很重要。比如标动发射之后，移动一步然后利用太阳系旋转蹭了 2 点声望，那这收益就赚回来了。

```seti
9,31,117,105
```

基于上述的分析，可以发现几个有趣的细节：

1. `9` 从计算上来说是不超模的。他是标准模型（3.5 = 1.5 + 1.5 + 0.5），这也是为什么设计师还会给它加上一个宣传。但是它又是超模的，一方面因为它赚了卡差 (等于摸了两张`130`)，另一方面因为发射可能是刚需，没牌发射就只能标动发射，也就相对超模了。
2. `31` 如果任务能完成，就严格意义超模 1 费发射 1 移动，这就是真正意义的超模牌。可以说，多数任务牌能做完任务都是超模的，因此**尽量多做任务**是这游戏资源高效利用的一个大因素。
3. 同理，左三比重型猎鹰超模 0.5 费。虽然任务是延后的，但是我们姑且就这么算。右一的扫描如果任务完成了也是轻轻松松超模 0.5+ 费。由此观之多数好任务牌都是至少超模 0.5 费的。
4. 因此多数时候收入插卡牌并不是一个划算的方案，因为它的期望收益是小于 1 的。但是又不能单纯这么看，因为除了钱是稳定的 1 收益，电和牌都会因为一些配比问题导致贬值。比如缺钱导致不得不弃牌，那一张牌就是 0.5 收益了；缺移动导致不得不用电走路，那电也贬值了。
5. 由此观之，牌收入一般但是又不能无牌可打，对于这种困境应该如何解决呢？我个人的想法是 R2 R3 靠外星人补牌运营，中期之后经济上来后可以适当插牌收入补牌，以及考虑提前 PASS。五选一是必有好牌的，挑剩的二选一基本就没眼看了。

### 五、移动 (Move)

```desc
{move-1} = 0.5 {credit-0}<br>
```

两种推导方式，一是直接看左上角可得 0.5 收益，二是以下图为例，右一减右二可得 1 信号 = 1 钱，因此 1 移动 = 0.5 钱。 左一和左二都可以用来佐证，多了些计分和特殊效果差不多值 0.5 钱。

```seti
25,26,27,28
```

移动的模型解释了如下事情：

1. 为什么不建议用电走路，因为理论上每走一步都亏 0.5 费
2. 角标弃牌移动还是比较强的。因为当你不得不移动的时候，左上角弃牌可以实现 1 电的效果。这也是第三层资源转换：钱 -> 电 -> 移动。每种资源有每种资源的本职工作，电可以移动，但是当你手上一手移动角标时你却变不出电了。另一方面，弃牌是快速行动，非常有战略意义。
3. 移动牌没有很强，因为和角标弃牌差不多收益，并且还要花一动，可能会误事。但是还是那个逻辑，最好备一点移动牌，以备不时之需，毕竟是比标动强的。
4. 移动要花在刀刃上。一个很有趣的现象是，如果玩家有一张 4 步移动牌，那么他可以会不怎么犹豫地打出来然后四步到达任何一个自己喜欢的地方。但是如果另一个玩家很贫穷，那么它可以等一等，在太阳系旋转后用 2 步达到了同样的效果。那么即便移动牌是超模的，但是移动这个行为本身亏了，也是一种亏。
5. 另外，如果一个移动经过了彗星或行星，那么本身就回了 0.5 收益。这会让 1 电移动成为标准模型。但还是那句话，这样只是不亏，如果可以在合适的时间用最少的步数以及最低的成本到达行星，路上还能获得声望的话，那不就赚麻了。这也是第二个橙色科技（无视小行星移动且获得宣传）非常强势的原因。

### 六、信号 (Signal) & 扫描行动 (Scan)

```desc
{any-signal} = {credit-1}<br>
{scan-action} = {credit-2}
```

```seti
27,28,47,48
```

信号的模型是严格的 1 钱。从上面的几张牌随便计算一下可得。

这个结论可以用于理解一些事情，对于信号而言：

蹭扇区的最后一个格子（自己只有唯一一个信号），等于 1 信号换 1 数据 + 1 声望，对于自己而言是不亏的行动。但是会让扇区第一略赚。但如果自己可以蹭个第二，那自己也是赚的。这是互利互惠的基本逻辑。同理，只要一个信号蹭到了第二格的 2 分，那么这个信号基本至少也是回本的。

对于扫描而言行动而言：

1. 扫描行动的标准模型是 2 钱，标动是 1 钱 2 电 简单换算成 3 钱。因此开局直接扫描等于硬生生亏 1 钱。所以强烈不建议开局扫描。
2. 自己扫描一个扇区，扫得越多越亏。比如如果自己扫 6 格的扇区 5 下，那么等于 5 钱换了 5 数据 + 1 宣传 + 扇区第一的奖励。除了早期的红色踪迹，其余情况基本都是亏的。因此一个思路是多伺机而动，一个人硬扫是不太划算的。有的玩家可能会说，当他蓝科叠起来了之后，那怎么扫描都是赚的了。但是也不能这么理解，因为你赚的是蓝科的收益，不是信号是收益，这就有点狐假虎威的意味了。如果能信号赚，蓝科又赚，那不就赢两次了。
3. 第二第三个粉色扫描科技带来的收益基本等于一次 0.5 费，两个都有等于标动扫描行动本身不亏模。但是至于扫出来的信号亏不亏信号本身的模型，那就得另算了。但是这背后透露出的信号是，即便双扫描科技了，标动扫描本身也只是不亏模，而这是占据了玩家的两个科技板位置的。如果换成其余科技说不定更赚了。当然，如果配合上第四个扫描科技，那标动扫描肯定是赚的了。

### 七、科技

```desc
{any-tech} = {credit-3}<br>
```

从 6 声望换 1 科技，以及科技牌的费用基本都可以看出这个数值。

```seti
85,69
```

因为不少科技牌都有任务和终局，加上科技牌的一些引擎构筑机制，科技牌整体可以认为是小超模的（上图属于标准模型）。

另一方面，科技的引擎构筑效果没有那么明显，并不是说科技越多就越强，因为科技的成本很高。科技的收益可以拆解出来看，拿取一个科技意味着它的收益需要超过 3 钱才算回本。比如发射飞船的科技，如果本身是一电奖励，那么拿取的那一刻已经回本了。而第一个扫描科技给的 2 数据实际上收益是非常低的，但是因为可能可以达到 4 数据获得一个收入，提前一回合拿到收入收益也就达到 3 钱了，属于不赚不亏，但是也确实不强。

### 八、分数

```desc
0.5 {credit-0} = {score-3}<br>
```

```desc
1 {credit-0} = {score-5}
```

一个观察是，设计师在卡牌中比较少提供大于 5 分收益的卡牌 (除了几张发射)。 其中 3 分的占比是比较多的，并且考虑到踪迹的第一个 5 分和第二个 3 分，我个人猜想分数的模型是 0.5 钱 = 3 分，因为 3 这个数字出现频率非常高。

另一方面，一次性用越多的钱换分，换算比反而会减少，设计的目的应该是避免玩家突然分数攀升太快，也鼓励玩家从各种地方一点点拿分，而不是想着一波分数大爆发。这个现象在殖民火星的基础也非常常见，小分符合模型是很常见的，比如 5 块钱换 1 分，但是 20 块钱可能就只能换 3 分了。背后的原因也和卡差有关系，换分效率越高意味着打出的卡牌数量越少，隐含了额外的过牌量收益。

虫族的如下两张牌是 0.5 钱 3 分比较好的佐证：

```seti
ET.2,ET.6
```

多数任务卡也是这样的一个逻辑，任务本身超模 0.5 费，正好等于左二多出来的 3 分。右一和右二对比也是 3 分换了 1 数据：

```seti
79,132,112,111
```

另外的一些参考卡。还有一种可能的模型是 0.5 钱 2 分，1 钱 4 分，其实也是有解释空间的，不过我体感上来说感觉这个换算比太低了。

- 3 VP: `51`, `ET.29`
- 5 VP: `79`, `95`, `SE EN 02`

这里还有个非常有趣的计算，假设就以开局的资源，插一张收入牌，也就是 5 钱 3 电 4 牌 4 宣传以及共计 7 费的收入 (4 钱 2 电 2 牌)。一共 5 轮的话总经济是 5 + 3 + 4 \* 0.5 + 4 \* 0.5 + 4 \* 7 = 40 费用。按 1 钱 5 分的换算比来算，终局裸分是 200，算上终局，基本是稳一的水平。这也是这游戏和火星**基础**非常相似的一点，如果你的所有操作都不亏模，那差不多就可以赢了。而按 1 钱 6 分来算是 240，意味着这游戏的上界估计都不到 400 分，甚至想要达到这个分数都得是其他玩家送了一堆超模行动送出来的。

### 九、外星人卡牌 (Alien Card) & 踪迹 (Trace)

```desc
{draw-alien-card-1} = 1.5 {credit-0}<br>
{any-trace} = {credit-2}<br>
```

> **打出外星人卡牌自带 1 钱成本**

Anomalies (水滴) 是最标准的外星人种族，因为它的牌一点都不超模，和虫族不是一个级别的。下图一方面可以再次论证上面关于科技的模型，另一方面也可以非常明确的显示踪迹的模型：1 任意踪迹 = 2 钱。一个指定颜色的踪迹，收益会稍微下降一点点。

```seti
ET.18,ET.19
```

几个想法：

1. 踪迹的收益也可以逆向计算回来：3 分 1 外星人牌 = 0.5 + 1.5 = 2。第一个踪迹的收益是 5 分 1 宣传 1 外星人牌，收益是非常爆炸的。
2. 如果只有纯分收益了，那么踪迹几乎没有可以回本的位置。因此中后期的踪迹更像是其余操作的附带收益，而不是核心拿分手段。比如大后期的 1 电标记蓝色踪迹，主要目的是为了清空数据再次滚动起来，而不是为了拿那点少得可怜的分。
3. 卡牌中的一费标记踪迹牌都是有强度的，主要战略意义是可以抢到下面的好位置。
4. 'Oumuamua 的外星化石的模型差不多是 0.5 钱；半人马族 (电外星人)的模型比正常外星人模型再超模 0.5 费；虫族牌如果有钱/电奖励，比正常外星人牌超模了 1 费左右，非常离谱。

### 十、着陆 (Land)

因为基础卡牌中的着陆牌非常少，所以着陆很难谈及什么标动模型和实际模型。如果硬要说的话，设计师是认为着陆等于或者稍贵于 1 钱的，很夸张。

```seti
12,13,16
```

几个想法：

1. 橙色的登陆省 1 电科技理论收益是非常不错的 (2 次回本)，但是比较微妙的点在于游戏中会有 2/5 概率开出虫族，并且基础的几张登陆牌也都是重量级。另一方面，前期多数人还是会倾向于环绕，倒不是环绕有多赚，而是一方面登陆太贵，另一方面一开始最划算的黄色踪迹只有一个。
2. 开局如果玩家可以着陆，以全标动为例，那就是发射火箭 (2) + 移动 2 步 (1 - 0.5 宣传收益) + 着陆 (2) = 4.5 成本，换取了 2 数据 (1) + 着陆 5 分 (1) + 黄色踪迹 (第一个至少有 2.5 收益)，差不多是不赚不亏，但是大概率可以成为第一个标记终局的人。如果星球再好一点，不是用标动而是用卡牌行动，那么收益会更高。
3. 相比之下，环绕在资源收益上是更高的。以火星为例，第一个收入等于是 -0.5 + 5 = 4.5 收益，但是会在终局争夺上略显劣势。因此其实两种打法都可以，这游戏的前期路线还是比较多的。

### 十一、收入 (Income) & 环绕 (Orbit)

```desc
{income} =  4.5 {credit-0} (第一大轮)
```

收入的模型很好理解，也透露出了几个信息：

1. 收入是开局少有的超模行动。为什么开局拿收入是一种常见开局，就是因为发射+移动+环绕的所花费的成本是小于收入带来的收益的。以全标动上火星为例，那就是发射火箭 (2) + 移动 2 步 (2 - 0.5 宣传收益) + 环绕 (2) = 5.5 成本，换取了收入(4.5) + 其余的一些收益，例如信号和卡牌。 也就是说作为一个开局的选择，纯标动都是可以回本的。
2. 另外一个获取收入的地方是数据快速行动。一般一个不错的开局是双额外收入开局（双环绕或环绕+4 数据），或者一踪迹（一般是黄色踪迹）一收入开。而 4 数据作为开局除了登陆水星和环绕海王星之外，基本都需要第一个扫描科技（地球扇区）提供额外 2 数据。至于这个科技的战略意义到底如何我还没有定论，这种偏进阶的内容也就不在基础模型的文章里面讨论了。
3. 因此，环绕是一个前期的高收益行动位，也是玩家开局的常见定式。这里有一个更加常见的定式就是 3 步上水星，以全标动为例是 6.5 成本，换取 4.5+1+2+0.5=8 收益，依然挺赚（顺便一说，水星登陆的收益是 6.5+(有人环绕的情况下)，并且基本稳定抢终局板，也是不错的选择）。而金星等于 5.5 收益换取 4.5+2=6.5 收益，不能说弱但是收益是比较一般的，并且金星环绕不提供额外数据会让后续节奏很不顺滑。海王星理想情况也是 3 步到，并且有机会经过额外的行星，因此成本是 6，收益是 4 数据（2）+1 信号（1）+10 分（2）= 5，算上 4 数据拿收入的收益等于回本，并且是有力的第一个蓝色踪迹标记者以及有望冲击 25 分，也是一个还不错的开局。但是缺点是需要天时地利，因此这个位置更适合作为一个中期的爆发点，比 26 分这种陷阱位置好多了。

## 结语

至此，游戏的一些最基础的模型就算完了。算完后可以发现，这游戏的底层逻辑是非常倾向于“打牌”的。看似游戏行动非常多，卡牌似乎只是游戏的一环，但实际上卡牌是核心中的核心。如果没有合适的牌（并且超模牌大多是任务牌），操作收益是很难非常高的。
