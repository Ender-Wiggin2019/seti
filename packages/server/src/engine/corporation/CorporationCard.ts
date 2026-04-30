import type { IGame } from '../IGame.js';
import type { IMissionDef } from '../missions/IMission.js';
import { Income, type TPartialIncomeBundle } from '../player/Income.js';
import type { IPlayer } from '../player/IPlayer.js';
import { Resources } from '../player/Resources.js';

interface ICorporationStartResources {
  credits: number;
  energy: number;
  drawCards: number;
}

interface ICorporationStartActions {
  tuckIncome: number;
}

export interface ICorporationCardConfig {
  id: string;
  name: string;
  startResources: ICorporationStartResources;
  startIncome: TPartialIncomeBundle;
  startActions: ICorporationStartActions;
}

/**
 * Corporation card applied during player setup.
 *
 * Mission support is intentionally reserved for future extension.
 */
export class CorporationCard {
  public readonly id: string;

  public readonly name: string;

  public readonly startResources: ICorporationStartResources;

  public readonly startIncome: TPartialIncomeBundle;

  public readonly startActions: ICorporationStartActions;

  public constructor(config: ICorporationCardConfig) {
    this.id = config.id;
    this.name = config.name;
    this.startResources = { ...config.startResources };
    this.startIncome = { ...config.startIncome };
    this.startActions = { ...config.startActions };
  }

  public getMissionDef(): IMissionDef | undefined {
    return undefined;
  }

  public resolve(player: IPlayer, game: IGame): void {
    player.income = new Income(this.startIncome);
    player.resources = new Resources(
      {
        credits: this.startResources.credits,
        energy: this.startResources.energy,
        publicity: player.publicity,
        data: 0,
      },
      { dataController: player.data },
    );

    player.hand.push(...game.mainDeck.drawN(this.startResources.drawCards));
  }
}
