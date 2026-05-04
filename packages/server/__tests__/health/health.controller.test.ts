import { HealthController } from '@/health/health.controller.js';

describe('HealthController', () => {
  it('returns an ok status for readiness checks', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
