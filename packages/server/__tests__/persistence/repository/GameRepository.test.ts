import { getSnapshotEventLastActorId } from '@/persistence/repository/GameRepository.js';

describe('GameRepository', () => {
  it('reads only canonical lastActorId from snapshot events', () => {
    expect(getSnapshotEventLastActorId({ lastActorId: 'p1' })).toBe('p1');
    expect(getSnapshotEventLastActorId({ actorId: 'p1' })).toBeUndefined();
  });
});
