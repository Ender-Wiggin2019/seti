import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EEffectType } from '@seti/common/types/effect';
import { EResource } from '@seti/common/types/element';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IMissionDef } from '../missions/IMission.js';
import { behaviorFromEffects, type IBehavior } from './Behavior.js';
import { getBehaviorExecutor } from './BehaviorExecutor.js';
import {
  EServerCardKind,
  type ICard,
  type ICardRuntimeContext,
} from './ICard.js';
import { type ICardRequirements, Requirements } from './Requirements.js';

function toCostRequirements(cardData: IBaseCard): ICardRequirements {
  const costType = cardData.priceType ?? EResource.CREDIT;
  if (costType === EResource.CREDIT) {
    return { resources: { credits: cardData.price } };
  }
  if (costType === EResource.ENERGY) {
    return { resources: { energy: cardData.price } };
  }
  if (costType === EResource.PUBLICITY) {
    return { resources: { publicity: cardData.price } };
  }
  if (costType === EResource.DATA) {
    return { resources: { data: cardData.price } };
  }
  return {};
}

function inferCardKind(cardData: IBaseCard): EServerCardKind {
  if (
    cardData.effects.some(
      (effect) => effect.effectType === EEffectType.END_GAME,
    )
  ) {
    return EServerCardKind.END_GAME;
  }
  if (
    cardData.effects.some(
      (effect) =>
        effect.effectType === EEffectType.MISSION_FULL ||
        effect.effectType === EEffectType.MISSION_QUICK,
    )
  ) {
    return EServerCardKind.MISSION;
  }
  return EServerCardKind.IMMEDIATE;
}

export abstract class Card implements ICard {
  public readonly id: string;

  public readonly name: string;

  public readonly position?: { src: string; row: number; col: number };

  public readonly image?: string;

  public readonly freeAction?: IBaseCard['freeAction'];

  public readonly sector?: IBaseCard['sector'];

  public readonly price: number;

  public readonly priceType?: IBaseCard['priceType'];

  public readonly income: IBaseCard['income'];

  public readonly effects: IBaseCard['effects'];

  public readonly description?: string;

  public readonly flavorText?: string;

  public readonly special?: IBaseCard['special'];

  public readonly source?: IBaseCard['source'];

  public readonly cardType?: IBaseCard['cardType'];

  public readonly alien?: IBaseCard['alien'];

  public readonly kind: EServerCardKind;

  public readonly behavior: IBehavior;

  public readonly requirements: ICardRequirements;

  public constructor(
    cardData: IBaseCard,
    options: {
      kind?: EServerCardKind;
      behavior?: IBehavior;
      requirements?: ICardRequirements;
    } = {},
  ) {
    this.id = cardData.id;
    this.name = cardData.name;
    this.position = cardData.position;
    this.image = cardData.image;
    this.freeAction = cardData.freeAction;
    this.sector = cardData.sector;
    this.price = cardData.price;
    this.priceType = cardData.priceType;
    this.income = cardData.income;
    this.effects = cardData.effects;
    this.description = cardData.description;
    this.flavorText = cardData.flavorText;
    this.special = cardData.special;
    this.source = cardData.source;
    this.cardType = cardData.cardType;
    this.alien = cardData.alien;
    this.kind = options.kind ?? inferCardKind(cardData);
    this.behavior = options.behavior ?? behaviorFromEffects(cardData.effects);
    this.requirements = {
      ...toCostRequirements(cardData),
      ...(options.requirements ?? {}),
    };
  }

  public canPlay(context: ICardRuntimeContext): boolean {
    if (
      !Requirements.checkRequirements(
        context.player,
        context.game,
        this.requirements,
      )
    ) {
      return false;
    }
    if (
      !getBehaviorExecutor().canExecute(
        this.behavior,
        context.player,
        context.game,
      )
    ) {
      return false;
    }
    return this.bespokeCanPlay(context);
  }

  public play(context: ICardRuntimeContext): IPlayerInput | undefined {
    getBehaviorExecutor().execute(
      this.behavior,
      context.player,
      context.game,
      this,
    );
    return this.bespokePlay(context);
  }

  protected bespokeCanPlay(_context: ICardRuntimeContext): boolean {
    return true;
  }

  protected bespokePlay(
    _context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    return undefined;
  }
}

export abstract class ImmediateCard extends Card {
  public constructor(
    cardData: IBaseCard,
    options: { behavior?: IBehavior; requirements?: ICardRequirements } = {},
  ) {
    super(cardData, { ...options, kind: EServerCardKind.IMMEDIATE });
  }
}

export abstract class MissionCard extends Card {
  public constructor(
    cardData: IBaseCard,
    options: { behavior?: IBehavior; requirements?: ICardRequirements } = {},
  ) {
    super(cardData, { ...options, kind: EServerCardKind.MISSION });
  }

  public getMissionDef(): IMissionDef | undefined {
    return undefined;
  }
}

export abstract class EndGameScoringCard extends Card {
  public constructor(
    cardData: IBaseCard,
    options: { behavior?: IBehavior; requirements?: ICardRequirements } = {},
  ) {
    super(cardData, { ...options, kind: EServerCardKind.END_GAME });
  }
}
