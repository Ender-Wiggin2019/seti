import { ESector } from '@seti/common/types/element';
import type {
  IInputResponse,
  ISectorInputResponse,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectSectorInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export class SelectSector extends BasePlayerInput {
  private readonly options: ESector[];

  private readonly onSelect: (sector: ESector) => PlayerInput | undefined;

  public constructor(
    player: IPlayer,
    options: ESector[],
    onSelect: (sector: ESector) => PlayerInput | undefined,
    title?: string,
  ) {
    super(player, EPlayerInputType.SECTOR, title);
    if (options.length === 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'SelectSector requires at least one option',
      );
    }
    this.options = options;
    this.onSelect = onSelect;
  }

  public toModel(): ISelectSectorInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.SECTOR,
      title: this.title,
      options: this.options,
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    this.validateResponseType(response, EPlayerInputType.SECTOR);
    const sectorResponse = response as ISectorInputResponse;

    if (!this.options.includes(sectorResponse.sector)) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `Invalid sector: ${sectorResponse.sector}`,
        { inputId: this.inputId, sector: sectorResponse.sector },
      );
    }

    return this.onSelect(sectorResponse.sector);
  }
}
