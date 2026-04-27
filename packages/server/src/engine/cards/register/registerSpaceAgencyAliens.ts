import { createGenericCard } from '../base/GenericCards.js';
import type { CardRegistry } from '../CardRegistry.js';
import { loadCardData } from '../loadCardData.js';

function g(registry: CardRegistry, id: string): void {
  registry.register(id, () => createGenericCard(loadCardData(id)));
}

/**
 * All space-agency alien cards require custom implementation.
 * They involve alien-specific mechanics (glyphs, organelles, etc.)
 * layered on top of agency-specific abilities.
 */
export function registerSpaceAgencyAliens(registry: CardRegistry): void {
  // ============================================================
  // GLYPHIDS — glyph resource cards
  // SA.ET.1-10: glyphid alien species mechanic
  // ============================================================

  // Glyph immediate + endgame. Glyph resource accounting is deferred until
  // Glyphids are enabled in the game setup flow.
  g(registry, 'SA.ET.1'); // Glyphids               | glyph-yellow, glyph-green OR glyph-blue, glyph-purple, EG
  g(registry, 'SA.ET.9'); // Glyphids               | glyph-yellow, glyph-purple OR glyph-blue, glyph-orange, EG

  // Glyph pattern matching (pure DESC)
  g(registry, 'SA.ET.2'); // Glyphids               | DESC(glyph patterns)
  g(registry, 'SA.ET.8'); // Glyphids               | DESC(glyph patterns)

  // Glyph full missions
  g(registry, 'SA.ET.3'); // Glyphids               | FM
  g(registry, 'SA.ET.4'); // Glyphids               | FM
  g(registry, 'SA.ET.5'); // Glyphids               | SIGNAL_TOKEN, FM
  g(registry, 'SA.ET.6'); // Glyphids               | PUBLICITY, DATA, FM
  g(registry, 'SA.ET.7'); // Glyphids               | CARD_ANY, FM

  // Glyph quick mission. Glyph resource accounting is deferred until Glyphids
  // are enabled in the game setup flow.
  g(registry, 'SA.ET.10'); // Glyphids               | LAUNCH, glyph-green, QM

  // ============================================================
  // AMOEBA — organelle resource cards
  // SA.ET.11-20: amoeba alien species mechanic
  // ============================================================

  // Organelle + endgame. Organelle resource accounting is deferred until
  // Amoeba is enabled in the game setup flow.
  g(registry, 'SA.ET.11'); // Biosignature Screening | CARD_ANY, organelle-red, EG
  g(registry, 'SA.ET.12'); // Physical Characterize  | CARD_ANY, organelle-yellow, EG
  g(registry, 'SA.ET.13'); // Genome Characterize    | CARD_ANY, organelle-blue, EG

  // Organelle quick mission
  g(registry, 'SA.ET.14'); // Breakthrough Theory    | PUBLICITY(3), QM

  // Organelle full missions. Organelle resource accounting is deferred until
  // Amoeba is enabled in the game setup flow.
  g(registry, 'SA.ET.15'); // Low-gravity Research   | LAUNCH, organelle-yellow, FM
  g(registry, 'SA.ET.16'); // Automated Analysis     | DATA(3), organelle-blue, FM
  g(registry, 'SA.ET.17'); // Safety Protocols       | PUBLICITY, FM
  g(registry, 'SA.ET.18'); // Scientific Papers      | CARD(2), FM

  // Organelle special
  g(registry, 'SA.ET.19'); // Extreme Conditions Test | DESC
  // Signal-token behavior is generic; organelle accounting is deferred until
  // Amoeba is enabled in the game setup flow.
  g(registry, 'SA.ET.20'); // Place of Origin        | SIGNAL_TOKEN, PUBLICITY, organelle-red
}
