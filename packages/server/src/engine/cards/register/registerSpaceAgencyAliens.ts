import { createGenericCard } from '../base/GenericCards.js';
import type { CardRegistry } from '../CardRegistry.js';
import { loadCardData } from '../loadCardData.js';
import { SaEt1GlyphidsCard } from '../spaceAgency/SaEt1GlyphidsCard.js';
import { SaEt9GlyphidsCard } from '../spaceAgency/SaEt9GlyphidsCard.js';
import { SaEt11BiosignatureScreeningCard } from '../spaceAgency/SaEt11BiosignatureScreeningCard.js';
import { SaEt12PhysicalCharacterizationCard } from '../spaceAgency/SaEt12PhysicalCharacterizationCard.js';
import { SaEt13GenomeCharacterizationCard } from '../spaceAgency/SaEt13GenomeCharacterizationCard.js';
import { SaEt14BreakthroughTheoryCard } from '../spaceAgency/SaEt14BreakthroughTheoryCard.js';

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

  registry.register('SA.ET.1', () => new SaEt1GlyphidsCard());
  registry.register('SA.ET.9', () => new SaEt9GlyphidsCard());

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

  registry.register('SA.ET.11', () => new SaEt11BiosignatureScreeningCard());
  registry.register('SA.ET.12', () => new SaEt12PhysicalCharacterizationCard());
  registry.register('SA.ET.13', () => new SaEt13GenomeCharacterizationCard());

  registry.register('SA.ET.14', () => new SaEt14BreakthroughTheoryCard());

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
