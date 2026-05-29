/**
 * Resolves the server-emitted player color slug to the hex value of
 * the matching SETI piece color. The retail box ships pieces in
 * **green / orange / purple / white** (rulebook §Components, p.2);
 * we mirror those exact piece tints so probes, markers, capsules and
 * scoring tokens read consistently with what's printed on the table.
 *
 * Falls through unchanged for any input that isn't one of the four
 * canonical slugs — this lets debug fixtures keep using `#hex` literals
 * directly without going through the slug map.
 */
const PLAYER_COLOR_HEX: Record<string, string> = {
  green: '#219449',
  orange: '#d46d1e',
  purple: '#801da1',
  white: '#e6eded',
};

export function resolvePlayerColor(
  slug: string | undefined | null,
): string | undefined {
  if (!slug) return undefined;
  return PLAYER_COLOR_HEX[slug] ?? slug;
}

/**
 * Map every player's slug-or-hex color to a renderable hex/CSS value.
 * Used wherever the board paints player tokens — probes, markers,
 * capsules, claim badges, score chips.
 */
export function mapPlayerColors<T extends { playerId: string; color: string }>(
  players: readonly T[],
): Record<string, string> {
  return players.reduce<Record<string, string>>((acc, p) => {
    acc[p.playerId] = resolvePlayerColor(p.color) ?? p.color;
    return acc;
  }, {});
}
