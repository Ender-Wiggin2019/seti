import type { TFunction } from 'i18next';

/**
 * Maps server-emitted English input strings (titles + option labels)
 * to translation keys under `client.input.*`. The server still emits
 * canonical English so logs/tests/debug stay readable; the client
 * looks the string up here and rewrites it for the active locale.
 *
 * For dynamic strings (e.g. `Choose ${planet}`), match on a regex
 * with named capture groups that feed the translation's interpolation.
 *
 * Add new entries when you spot an English-only string in the input
 * panel. Unknown strings fall through unchanged (English fallback).
 */

const STATIC_DICT: Record<string, string> = {
  // SelectOption titles
  'Choose a card from the row': 'client.input.choose_card_from_row',
  'Choose a card to prepare': 'client.input.choose_card_to_prepare',
  'Choose a hand card to swap': 'client.input.choose_hand_card_to_swap',
  'Choose a Helion Assembly tech to disable':
    'client.input.choose_helion_tech_to_disable',
  'Choose a technology type': 'client.input.choose_tech_type',
  'Choose a temporary Turing Systems tech': 'client.input.choose_turing_tech',
  'Choose alien board to draw from': 'client.input.choose_alien_board',
  'Choose card destination': 'client.input.choose_card_destination',
  'Choose Cosmos Strategy Group reward': 'client.input.choose_cosmos_reward',
  'Choose Fenwick Research Center card source':
    'client.input.choose_fenwick_source',
  'Choose lander to return': 'client.input.choose_lander_to_return',
  'Choose landing position': 'client.input.choose_landing_position',
  'Choose Mission Relay card source':
    'client.input.choose_mission_relay_source',
  'Choose one: pay 1 energy to launch a probe, or gain 1 free movement.':
    'client.input.choose_one_pay_or_gain',
  'Choose orbiter to return': 'client.input.choose_orbiter_to_return',
  'Choose planet to land on': 'client.input.choose_planet_to_land_on',
  'Choose planet to orbit': 'client.input.choose_planet_to_orbit',
  'Choose probe for asteroid survey': 'client.input.choose_probe_asteroid',
  'Choose sector for TESS Satellite': 'client.input.choose_sector_tess',
  'Choose sector to mark signal': 'client.input.choose_sector_to_mark',
  'Choose sector with your probe': 'client.input.choose_sector_with_probe',
  'Choose signal color to mark': 'client.input.choose_signal_color_to_mark',
  'Choose signal color': 'client.input.choose_signal_color',
  'Choose where to mark signal': 'client.input.choose_where_to_mark',
  'Choose which fulfilled sector to resolve next':
    'client.input.choose_fulfilled_sector',
  'Discard 1 card to gain its free-action corner reward':
    'client.input.discard_for_corner_reward',
  'Discard 1 card to gain the resource matching its income':
    'client.input.discard_for_income_resource',
  'Discard a card from hand for a signal': 'client.input.discard_for_signal',
  'Discard a non-alien card': 'client.input.discard_non_alien',
  'Discard cards for income corners': 'client.input.discard_for_income_corners',
  'Discard down to hand limit': 'client.input.discard_to_hand_limit',
  'Discard one hand card, then place one signal in the discarded card sector.':
    'client.input.discard_then_signal',
  'Earth Look: choose sector for earth signal': 'client.input.earth_look',
  'Mark Helion Assembly reward?': 'client.input.mark_helion_reward',
  'Mission triggered! Claim reward?': 'client.input.mission_triggered',
  'Pay 1 publicity to place one extra signal in mercury sector.':
    'client.input.pay_publicity_mercury',
  'Play Exertian card face down': 'client.input.play_exertian_facedown',
  'Return an unfinished mission': 'client.input.return_unfinished_mission',
  'Scan: choose sub-action': 'client.input.scan_sub_action',
  'Select a card from the card row': 'client.input.select_card_from_row',
  'Select a card to tuck for income': 'client.input.select_card_to_tuck',
  'Select a computer column for the tech':
    'client.input.select_computer_column',
  'Select a hand card to discard for signal':
    'client.input.select_hand_card_for_signal',
  'Select a technology researched by another player':
    'client.input.select_other_player_tech',
  'Select a technology to research': 'client.input.select_tech_to_research',
  'Select an orbiter to reassign': 'client.input.select_orbiter_reassign',
  'Select end-of-round card': 'client.input.select_end_of_round_card',
  'Select Scan Energy Launch effect': 'client.input.select_scan_energy_launch',
  'Use exofossil for extra signal?': 'client.input.use_exofossil_signal',
  'Use exofossil to gain data?': 'client.input.use_exofossil_data',
  'Use exofossil to gain movement?': 'client.input.use_exofossil_movement',
  'Choose any card': 'client.input.choose_any_card',
  'Choose sector for signal': 'client.input.choose_sector_for_signal',
  'Choose a probe sector to mark': 'client.input.choose_probe_sector_to_mark',

  // SelectOption option labels
  'Add to hand': 'client.input.opt.add_to_hand',
  'Black signal': 'client.input.opt.signal_black',
  'Blue signal': 'client.input.opt.signal_blue',
  'Card row': 'client.input.opt.card_row',
  Discard: 'client.input.opt.discard',
  'Done (end scan)': 'client.input.opt.done_end_scan',
  'Done (skip remaining scan techs)':
    'client.input.opt.done_skip_remaining_techs',
  Done: 'client.input.opt.done',
  'Draw face-up alien card': 'client.input.opt.draw_faceup_alien',
  'Draw from deck': 'client.input.opt.draw_from_deck',
  'Draw random alien card': 'client.input.opt.draw_random_alien',
  'Energy Launch or Move': 'client.input.opt.energy_launch_or_move',
  Finish: 'client.input.opt.finish',
  'Gain 1 movement instead of 1 publicity':
    'client.input.opt.gain_movement_instead_publicity',
  'Gain 1 movement': 'client.input.opt.gain_movement',
  'Keep 1 publicity': 'client.input.opt.keep_publicity',
  'Main deck': 'client.input.opt.main_deck',
  'Mark Card Row': 'client.input.opt.mark_card_row',
  'Mark Earth or Adjacent': 'client.input.opt.mark_earth_or_adjacent',
  'Mark Earth': 'client.input.opt.mark_earth',
  'Mark Hand Signal': 'client.input.opt.mark_hand_signal',
  'Mark Mercury (1 publicity)': 'client.input.opt.mark_mercury',
  'Mark Oumuamua tile': 'client.input.opt.mark_oumuamua',
  'Mark reward': 'client.input.opt.mark_reward',
  'Mark sector': 'client.input.opt.mark_sector',
  'Other Planet': 'client.input.opt.other_planet',
  'Pay 1 energy to launch a probe': 'client.input.opt.pay_energy_launch_probe',
  'Red signal': 'client.input.opt.signal_red',
  'Research probe tech': 'client.input.opt.research_probe_tech',
  'Research scan tech': 'client.input.opt.research_scan_tech',
  'Skip discard': 'client.input.opt.skip_discard',
  'Skip Exertian face-down play': 'client.input.opt.skip_exertian_facedown',
  Skip: 'client.input.opt.skip',
  'Use Signal Token': 'client.input.opt.use_signal_token',
  'Spend 1 exofossil to gain 1 data': 'client.input.opt.exofossil_for_data',
  'Spend 1 exofossil to gain 2 move': 'client.input.opt.exofossil_for_move',
  'Spend 1 exofossil to mark any signal':
    'client.input.opt.exofossil_for_signal',
  'Yellow signal': 'client.input.opt.signal_yellow',
};

/**
 * Dynamic patterns for option labels with interpolation. Each entry's
 * `pattern` parses out named groups that map to translation
 * placeholders.
 */
const DYNAMIC_PATTERNS: Array<{
  pattern: RegExp;
  key: string;
  placeholder?: (match: RegExpMatchArray) => Record<string, string>;
}> = [
  {
    pattern: /^Choose (?<planet>\w+)$/,
    key: 'client.input.opt.choose_planet',
  },
  {
    pattern: /^Orbit (?<planet>[\w\s]+) \((?<costs>[^)]+)\)$/,
    key: 'client.input.opt.orbit_planet_with_cost',
  },
  {
    pattern: /^Orbit (?<planet>\w+)$/,
    key: 'client.input.opt.orbit_planet',
  },
  {
    pattern: /^Land on (?<planet>\w+)$/,
    key: 'client.input.opt.land_on_planet',
  },
  {
    pattern: /^Column (?<index>\d+)$/,
    key: 'client.input.opt.column_n',
  },
  {
    pattern: /^Sector (?<id>\S+)$/,
    key: 'client.input.opt.sector_n',
  },
  {
    pattern: /^Probe (?<id>\S+)$/,
    key: 'client.input.opt.probe_n',
  },
  {
    pattern: /^Spend (?<amount>\d+) credit$/,
    key: 'client.input.opt.spend_n_credit',
  },
  {
    pattern: /^Gain (?<resource>\w+)$/,
    key: 'client.input.opt.gain_resource',
  },
  {
    pattern: /^Gain (?<reward>.+)$/,
    key: 'client.input.opt.gain_reward',
  },
  {
    pattern: /^Return orbiter from (?<planet>\w+)$/,
    key: 'client.input.opt.return_orbiter_from',
  },
  {
    pattern: /^Discard (?<card>.+)$/,
    key: 'client.input.opt.discard_card',
  },
  {
    pattern: /^Use Signal Token \((?<index>\d+)\)$/,
    key: 'client.input.opt.use_signal_token_numbered',
  },
  {
    pattern: /^Take (?<card>.+) from card row$/,
    key: 'client.input.opt.take_from_row',
  },
  {
    pattern: /^Play (?<card>.+) face down$/,
    key: 'client.input.opt.play_facedown',
  },
];

/**
 * Server-side sector option labels follow the form
 * "Red Barnard's Star (sector-3)" / "Yellow Tau Ceti (sector-1)".
 * These translate the color word + (when known) the star name without
 * having to enumerate every star in the static dictionary.
 *
 * Falls back to the original string when the input doesn't look like
 * a sector label.
 */
const SECTOR_COLORS: Record<string, string> = {
  Red: 'client.input.opt.sector_color.red',
  Yellow: 'client.input.opt.sector_color.yellow',
  Blue: 'client.input.opt.sector_color.blue',
  Black: 'client.input.opt.sector_color.black',
};

const SECTOR_BANNERS: Record<string, string> = {
  Earth: 'client.input.opt.sector_banner.earth',
  Adjacent: 'client.input.opt.sector_banner.adjacent',
};

/**
 * Server emits formatted English star names ("Barnard's Star",
 * "Tau Ceti", "61 Virginis", etc.) which we re-resolve to the
 * locale-specific name when known. Keys match the rulebook spelling
 * server-side `formatStarName` produces.
 */
const SECTOR_STARS: Record<string, string> = {
  Procyon: 'client.input.opt.sector_star.procyon',
  Vega: 'client.input.opt.sector_star.vega',
  'Sirius A': 'client.input.opt.sector_star.sirius_a',
  // Server's `formatStarName('barnards-star')` produces "Barnards Star"
  // (no apostrophe) — match that exact output.
  'Barnards Star': 'client.input.opt.sector_star.barnards_star',
  'Kepler 22': 'client.input.opt.sector_star.kepler_22',
  'Proxima Centauri': 'client.input.opt.sector_star.proxima_centauri',
  '61 Virginis': 'client.input.opt.sector_star.sixty_one_virginis',
  'Beta Pictoris': 'client.input.opt.sector_star.beta_pictoris',
};

function translateStarName(t: TFunction, star: string | undefined): string {
  if (!star) return '';
  const key = SECTOR_STARS[star];
  if (!key) return star;
  return t(key, { defaultValue: star });
}

function translateSectorLabel(t: TFunction, text: string): string | null {
  // Match e.g. "Red Barnard's Star (sector-3)" or "Yellow Tau Ceti (sector-1)"
  // including "Earth — Red ... (sector-N)" / "Adjacent — Red ... (sector-N)"
  // banner prefixes.
  const bannerMatch = text.match(
    /^(Earth|Adjacent) — ((?:Red|Yellow|Blue|Black))(?:\s+(.+?))?\s*\(sector-(\d+)\)$/,
  );
  if (bannerMatch) {
    const [, banner, color, star, idx] = bannerMatch;
    const bannerKey = SECTOR_BANNERS[banner];
    const colorKey = SECTOR_COLORS[color];
    return t('client.input.opt.sector_banner_full', {
      banner: t(bannerKey, { defaultValue: banner }),
      color: t(colorKey, { defaultValue: color }),
      star: translateStarName(t, star),
      index: idx,
      defaultValue: text,
    });
  }
  const plainMatch = text.match(
    /^(Red|Yellow|Blue|Black)(?:\s+(.+?))?\s*\(sector-(\d+)\)$/,
  );
  if (plainMatch) {
    const [, color, star, idx] = plainMatch;
    const colorKey = SECTOR_COLORS[color];
    return t('client.input.opt.sector_full', {
      color: t(colorKey, { defaultValue: color }),
      star: translateStarName(t, star),
      index: idx,
      defaultValue: text,
    });
  }
  return null;
}

/**
 * "Choose Yellow sector to mark signal" → translate the color word
 * (Yellow → 黄色) and feed it into a single composite translation key
 * so the rest of the sentence localizes too. Returns null when the
 * input doesn't match.
 */
function translateChooseColorSectorTitle(
  t: TFunction,
  text: string,
): string | null {
  const match = text.match(
    /^Choose (Red|Yellow|Blue|Black) sector to mark signal$/,
  );
  if (!match) return null;
  const [, color] = match;
  const colorKey = SECTOR_COLORS[color];
  return t('client.input.choose_color_sector_to_mark', {
    color: t(colorKey, { defaultValue: color }),
    defaultValue: text,
  });
}

/**
 * Resource tokens are emitted by the server as explicit sentinels
 * (`[[res:credit]]`, `[[res:energy]]`, etc.) so they can be localized
 * without touching ordinary words inside card names or other copied
 * text. Only those sentinels are replaced here.
 */
const RESOURCE_TOKEN_KEYS: Record<string, string> = {
  credit: 'client.resources.credit',
  energy: 'client.resources.energy',
  publicity: 'client.resources.publicity',
  data: 'client.resources.data',
  card: 'client.resources.card',
  vp: 'client.input.opt.resource_token.vp',
  move: 'client.input.opt.resource_token.move',
  exofossil: 'client.input.opt.resource_token.exofossil',
};

function translateResourceTokens(t: TFunction, text: string): string {
  return text.replace(
    /\[\[res:(credit|energy|publicity|data|card|vp|move|exofossil)\]\](?:\s*×(\d+))?/gi,
    (_match, type: string, multiplier?: string) => {
      const key = RESOURCE_TOKEN_KEYS[type.toLowerCase()];
      const translated = key ? t(key, { defaultValue: type }) : type;
      return multiplier ? `${translated} ×${multiplier}` : translated;
    },
  );
}

/**
 * Translate a server-emitted input title or option label to the
 * active locale. Falls back to the original string for unknown
 * entries.
 */
export function translateInputText(
  t: TFunction,
  text: string | undefined | null,
): string {
  if (!text) return text ?? '';
  const sector = translateSectorLabel(t, text);
  if (sector !== null) return sector;
  const colorSector = translateChooseColorSectorTitle(t, text);
  if (colorSector !== null) return colorSector;
  const staticKey = STATIC_DICT[text];
  if (staticKey) {
    return t(staticKey, { defaultValue: text });
  }
  for (const entry of DYNAMIC_PATTERNS) {
    const match = text.match(entry.pattern);
    if (match) {
      const params = (match.groups ?? {}) as Record<string, string>;
      const translated = t(entry.key, { ...params, defaultValue: text });
      // After dynamic pattern resolution, resolve any explicit
      // resource sentinels so reward summaries localize without
      // touching arbitrary card names.
      return translateResourceTokens(t, translated);
    }
  }
  // Even when nothing else matched, sweep explicit resource sentinels.
  return translateResourceTokens(t, text);
}
