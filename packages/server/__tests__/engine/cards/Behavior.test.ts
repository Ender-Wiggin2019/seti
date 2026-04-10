import { DESC, e } from '@seti/common/constant/effect';
import { EResource, ESector, ETech, ETrace } from '@seti/common/types/element';
import { behaviorFromEffects } from '@/engine/cards/Behavior.js';

describe('behaviorFromEffects', () => {
  it('maps base resource effects into behavior DSL', () => {
    const behavior = behaviorFromEffects([
      e.CREDIT(2),
      e.ENERGY(1),
      e.SCORE(3),
      e.MOVE(1),
      e.CARD(2),
    ]);

    expect(behavior.gainResources).toEqual({
      credits: 2,
      energy: 1,
    });
    expect(behavior.gainScore).toBe(3);
    expect(behavior.gainMovement).toBe(1);
    expect(behavior.drawCards).toBe(2);
  });

  it('maps action-like icons and trace/tech icons', () => {
    const behavior = behaviorFromEffects([
      e.LAUNCH(),
      e.ROTATE(),
      e.TECH_SCAN(),
      e.TRACE_BLUE(),
    ]);

    expect(behavior.launchProbe).toBe(true);
    expect(behavior.rotateSolarSystem).toBe(true);
    expect(behavior.researchTech).toBe(ETech.SCAN);
    expect(behavior.markTrace).toBe(ETrace.BLUE);
  });

  it('collects customized effects as custom behavior tokens', () => {
    const custom = DESC('desc.card-custom-test');
    const behavior = behaviorFromEffects([custom, e.CREDIT()]);

    expect(behavior.custom).toContain(custom.desc);
    expect(behavior.gainResources).toEqual({ credits: 1 });
  });

  it('maps signal effects into scan behavior targets', () => {
    const behavior = behaviorFromEffects([e.SIGNAL_RED(), e.SCAN()]);
    expect(behavior.scan?.markSectors).toContain(ESector.RED);
    expect(behavior.scan?.markCardSector).toBe(true);
    expect(behavior.scan?.markEarthSectorIndex).toBe(0);
  });

  it('maps income icons', () => {
    const behavior = behaviorFromEffects([e.CREDIT_INCOME()]);
    expect(behavior.gainIncome).toBe(EResource.CREDIT);
  });

  it('maps any-signal/display-card/signal-token effects', () => {
    const behavior = behaviorFromEffects([
      e.SIGNAL_ANY(2),
      e.SIGNAL_DISPLAY_CARD(3),
      e.SIGNAL_TOKEN(1),
    ]);

    expect(behavior.markAnySignal).toBe(2);
    expect(behavior.markDisplayCardSignal).toBe(3);
    expect(behavior.markSignalToken).toBe(1);
  });
});
