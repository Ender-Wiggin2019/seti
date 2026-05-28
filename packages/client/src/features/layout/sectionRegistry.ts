import type { ComponentType } from 'react';
import type { ResolvedSection, SectionId } from './types';

/**
 * Section registry — the only place that knows how a SectionId maps to a
 * concrete React component. Shells call into this to render bodies; they
 * don't import the section adapters directly. Adding a new section means
 * registering it once here.
 *
 * Adapters wrap the underlying feature view (SolarSystemView, EventLog,
 * PlayerDashboard…) and pull data from GameContext / GameSessionContext —
 * the registry stays purely structural.
 */
export interface ISectionRenderProps {
  section: ResolvedSection;
}

export interface ISectionDefinition {
  id: SectionId;
  /** i18n key used by SectionFrame's optional header. */
  titleKey: string;
  Component: ComponentType<ISectionRenderProps>;
  /** When true, render with a SectionFrame header by default. */
  showHeader?: boolean;
}

const registry = new Map<SectionId, ISectionDefinition>();

export function registerSection(def: ISectionDefinition): void {
  registry.set(def.id, def);
}

export function getSection(id: SectionId): ISectionDefinition | undefined {
  return registry.get(id);
}

export function listSections(): ISectionDefinition[] {
  return Array.from(registry.values());
}
