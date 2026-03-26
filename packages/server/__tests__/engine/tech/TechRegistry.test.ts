import { ETechId } from '@seti/common/types/tech';
import { createAllTechs, createTech } from '@/engine/tech/TechRegistry.js';

describe('TechRegistry', () => {
  it('creates expected tech instance by id', () => {
    const tech = createTech(ETechId.PROBE_DOUBLE_PROBE);
    expect(tech.id).toBe(ETechId.PROBE_DOUBLE_PROBE);
  });

  it('creates all 12 tech instances', () => {
    const techs = createAllTechs();
    expect(techs.size).toBe(12);
  });
});
