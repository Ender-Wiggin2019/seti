import type {
  IGoldTileInputResponse,
  IInputResponse,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectGoldTileInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export class SelectGoldTile extends BasePlayerInput {
  private readonly options: string[];

  private readonly onSelect: (tileId: string) => PlayerInput | undefined;

  public constructor(
    player: IPlayer,
    options: string[],
    onSelect: (tileId: string) => PlayerInput | undefined,
    title?: string,
  ) {
    super(player, EPlayerInputType.GOLD_TILE, title);
    if (options.length === 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'SelectGoldTile requires at least one option',
      );
    }
    this.options = options;
    this.onSelect = onSelect;
  }

  public toModel(): ISelectGoldTileInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.GOLD_TILE,
      title: this.title,
      options: this.options,
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    this.validateResponseType(response, EPlayerInputType.GOLD_TILE);
    const goldTileResponse = response as IGoldTileInputResponse;

    if (!this.options.includes(goldTileResponse.tileId)) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `Invalid gold tile: ${goldTileResponse.tileId}`,
        { inputId: this.inputId, tileId: goldTileResponse.tileId },
      );
    }

    return this.onSelect(goldTileResponse.tileId);
  }
}
