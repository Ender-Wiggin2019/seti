import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { probeOnComet } from '@/engine/missions/QuickMissionConditions.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.104 — Rosetta Probe.
 * QUICK_MISSION: have a probe on a comet → 3 VP + 1 data.
 */
export class RosettaProbe extends MissionCard {
  public constructor() {
    super(loadCardData('104'));
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef('104', probeOnComet());
  }
}
