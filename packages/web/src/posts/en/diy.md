# DIY Tool Usage Guide

Currently, this DIY tool is seeing some use, but users may encounter the following issues:

1. What if I can't implement some icons?
2. The layout doesn't quite meet my expectations. Can it be adjusted?

This article will provide some additional guidance on these issues.

## Issue 1: Icon Display Problem

Typically, you can click a button to add an icon directly. If you want to display it within text, you can use text input. For example:

```txt
You can insert an icon like this {any-trace}.
```

Result:

```desc
You can insert an icon like this {any-trace}.
```

A complete list of icons can be viewed by expanding the section below. This table is also available on the DIY page:

```table
Placeholder
```

## Issue 2: Icons Are Too Large. Can They Be Made Smaller?

A recommended approach is not to click the icon button but to use the text input method above, which will naturally reduce the size.

If you want more precise control over the size, you can use square brackets within the text to specify the size. The available sizes from largest to smallest are:
md > sm > xs > xxs > desc (default size)

For example:

```txt
{publicity-1[md]}
{publicity-1[sm]}
{publicity-1[xs]}
{publicity-1[xxs]}
{publicity-1[desc]}
```

Result:

```desc
{publicity-1[md]}
{publicity-1[sm]}
{publicity-1[xs]}
{publicity-1[xxs]}
{publicity-1[desc]}
```

## Issue 3: Can Icons Be Displayed Without Numbers?

Yes, you can add a 0 at the end.

```txt
{move} defaults to 1, equivalent to {move-1},
{move-0} will not display a number
```

```desc
{move} defaults to 1, equivalent to {move-1}, {move-0} will not display a number
```

## Issue 4: Sometimes the Layout Doesn't Meet My Expectations. Can I Break Lines?

The new version now supports automatic line breaks. If you want more precise control, you can manually break lines by entering `br`. The effect is as follows:

```txt
{land-action}<br>Forced line break
```

```desc
{land-action}<br>Forced line break
```

Using this feature can make the layout more aesthetically pleasing and prevent situations like this:

```desc
Long sentence makes strange line break <br>{score-2}.
```

By manually breaking lines in the middle,the layout can be more aesthetically pleasing:

```txt
By manually breaking lines in the middle<br>
the layout can be more aesthetically pleasing,
<br> like this {score-2}.
```

Result:

```desc
By manually breaking lines in the middle<br>the layout can be more aesthetical,<br> like this {score-2}.
```
