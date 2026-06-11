import type {
  IGameEventBase,
  TGameEventLevel,
} from '@/types/re-exports';

type TBaseOverrides = Partial<Omit<IGameEventBase, 'actorId'>>;

let nextSeq = 1;

function baseFields(overrides: TBaseOverrides): Omit<IGameEventBase, 'actorId'> {
  const seq = overrides.seq ?? nextSeq;
  nextSeq = Math.max(nextSeq + 1, seq + 1);
  return {
    id: overrides.id ?? `test-event-${seq}`,
    seq,
    turnIndex: overrides.turnIndex ?? 1,
    round: overrides.round ?? 1,
    level: overrides.level ?? ('info' satisfies TGameEventLevel),
  };
}

export function playerEventBase(
  actorId = 'p1',
  overrides: TBaseOverrides = {},
): IGameEventBase & { actorId: string } {
  return {
    ...baseFields(overrides),
    actorId,
  };
}

export function systemEventBase(
  overrides: TBaseOverrides = {},
): IGameEventBase & { actorId: null } {
  return {
    ...baseFields(overrides),
    actorId: null,
  };
}
