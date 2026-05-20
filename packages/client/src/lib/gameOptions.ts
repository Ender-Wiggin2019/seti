import {
  createGameOptions,
  type IGameOptions,
  type IGameOptionsPatch,
} from '@seti/common/types/protocol/options';

export function applyGameOptionsPatch(
  options: IGameOptions,
  patch: IGameOptionsPatch,
): IGameOptions {
  return createGameOptions({
    ...options,
    ...patch,
    alienModulesEnabled: {
      ...options.alienModulesEnabled,
      ...(patch.alienModulesEnabled ?? {}),
    },
  }) as IGameOptions;
}
