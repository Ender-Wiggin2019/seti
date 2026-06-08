import type { TFunction } from 'i18next';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { GAME_Z_INDEX } from '@/styles/zIndex';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicTechBoard,
} from '@/types/re-exports';
import {
  EPhase,
  EPlayerInputPresentationMode,
  EPlayerInputType,
} from '@/types/re-exports';
import { SetupChoiceModal } from '../setup/SetupChoiceModal';
import { InputRenderer } from './InputRenderer';
import { translateInputText } from './inputI18n';
import {
  getPlayerInputPresentationMode,
  usesDialogPresentation,
  usesInGamePresentation,
} from './inputPresentation';

interface IBoardInputHint {
  title: string;
  description: string;
  doneLabel?: string;
  onDone?: () => void;
}

export interface IPendingInputPromptProps {
  model: IPlayerInputModel;
  onSubmit: (response: IInputResponse) => void;
  techBoard?: IPublicTechBoard;
  phase?: EPhase;
  boardHint?: IBoardInputHint;
  presentationMode?: EPlayerInputPresentationMode;
}

const COLLAPSE_MS = 220;

export function PendingInputPrompt({
  model,
  onSubmit,
  techBoard,
  phase,
  boardHint,
  presentationMode,
}: IPendingInputPromptProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const titleId = useId();
  const timeoutRef = useRef<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const title = boardHint?.title ?? getPendingInputTitle(t, model);
  const resolvedPresentationMode =
    presentationMode ?? getPlayerInputPresentationMode(model);
  const renderDialog = usesDialogPresentation(resolvedPresentationMode);
  const renderInGame = usesInGamePresentation(resolvedPresentationMode);

  useEffect(() => {
    setIsMinimized(false);
    setIsCollapsing(false);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [model.inputId]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const minimize = (): void => {
    if (isCollapsing) return;
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setIsMinimized(true);
      return;
    }
    setIsCollapsing(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsMinimized(true);
      setIsCollapsing(false);
      timeoutRef.current = null;
    }, COLLAPSE_MS);
  };

  const expand = (): void => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsCollapsing(false);
    setIsMinimized(false);
  };

  return (
    <>
      {renderDialog && (!isMinimized || isCollapsing)
        ? createPortal(
            <div
              className={cn(
                'pending-input-overlay',
                isCollapsing && 'pending-input-overlay--collapsing',
              )}
              data-testid='pending-input-modal'
              style={{ zIndex: GAME_Z_INDEX.overlay }}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  minimize();
                }
              }}
            >
              <section
                aria-labelledby={titleId}
                aria-modal='true'
                className={cn(
                  'pending-input-panel',
                  isCollapsing && 'pending-input-panel--collapsing',
                )}
                role='dialog'
              >
                <div className='mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start'>
                  <div className='min-w-0 space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span
                        aria-hidden
                        className='signal-dot'
                        data-active='true'
                        data-signal='amber'
                      />
                      <p className='micro-label text-[color:var(--signal-amber)]'>
                        {t('client.game_layout.awaiting_input', {
                          defaultValue: 'Input Required',
                        })}
                      </p>
                    </div>
                    <h2
                      id={titleId}
                      className='font-display text-[1.625rem] font-semibold leading-[1.18] text-text-100'
                    >
                      {title}
                    </h2>
                    <p className='max-w-[72ch] text-sm leading-6 text-text-300'>
                      {boardHint?.description ??
                        t('client.game_layout.resolve_input_prompt', {
                          defaultValue:
                            'Resolve this pending decision to continue the mission.',
                        })}
                    </p>
                  </div>
                  <Button
                    aria-label={t('client.game_layout.minimize_input', {
                      defaultValue: 'Minimize input prompt',
                    })}
                    className='h-8 w-8 shrink-0 p-0'
                    data-testid='pending-input-minimize'
                    onClick={minimize}
                    size='icon'
                    variant='ghost'
                  >
                    <svg
                      aria-hidden
                      className='h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <path d='M5 12h14' />
                    </svg>
                  </Button>
                </div>

                <div className='pending-input-panel__body instrument-panel'>
                  {boardHint ? (
                    <BoardInputHint hint={boardHint} />
                  ) : phase === EPhase.SETUP_CHOICE ? (
                    <SetupChoiceModal model={model} onSubmit={onSubmit} />
                  ) : (
                    <InputRenderer
                      model={model}
                      onSubmit={onSubmit}
                      techBoard={techBoard}
                    />
                  )}
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}

      {renderDialog && isMinimized ? (
        <button
          aria-label={t('client.game_layout.expand_input', {
            title,
            defaultValue: `Open pending input: ${title}`,
          })}
          className='pending-input-float'
          data-testid='pending-input-float'
          onClick={expand}
          style={{ zIndex: GAME_Z_INDEX.pendingInput }}
          title={title}
          type='button'
        >
          <span aria-hidden className='pending-input-float__ring' />
          <svg
            aria-hidden
            className='relative h-5 w-5'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M12 7v6' />
            <path d='M12 17h.01' />
            <path d='M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' />
          </svg>
        </button>
      ) : null}

      {renderInGame && !renderDialog
        ? createPortal(
            <InGameInputHint
              title={title}
              description={
                boardHint?.description ??
                (model.description
                  ? translateInputText(t, model.description)
                  : t('client.game_layout.select_highlighted_target', {
                      defaultValue:
                        'Select a highlighted target on the game board.',
                    }))
              }
              doneLabel={boardHint?.doneLabel}
              onDone={boardHint?.onDone}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function InGameInputHint({
  title,
  description,
  doneLabel,
  onDone,
}: {
  title: string;
  description: string;
  doneLabel?: string;
  onDone?: () => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <aside
      className='pending-input-ingame'
      data-testid='pending-input-ingame'
      aria-label={t('client.game_layout.awaiting_input', {
        defaultValue: 'Input Required',
      })}
      style={{ zIndex: GAME_Z_INDEX.pendingInput }}
    >
      <div className='flex min-w-0 items-start gap-2'>
        <span
          aria-hidden
          className='signal-dot mt-1'
          data-active='true'
          data-signal='amber'
        />
        <div className='min-w-0 flex-1'>
          <p className='micro-label text-[color:var(--signal-amber)]'>
            {t('client.game_layout.awaiting_input', {
              defaultValue: 'Input Required',
            })}
          </p>
          <h2 className='mt-1 truncate font-display text-sm font-semibold text-text-100'>
            {title}
          </h2>
          <p className='mt-1 text-xs leading-5 text-text-300'>{description}</p>
        </div>
      </div>
      {doneLabel && onDone ? (
        <Button
          className='mt-3 h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em]'
          onClick={onDone}
          size='sm'
          variant='ghost'
        >
          {translateInputText(t, doneLabel)}
        </Button>
      ) : null}
    </aside>
  );
}

function BoardInputHint({
  hint,
}: {
  hint: IBoardInputHint;
}): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-3'>
      <div className='pending-input-board-hint'>
        <p className='text-sm text-text-100'>{hint.description}</p>
      </div>
      {hint.doneLabel && hint.onDone ? (
        <Button
          className='h-8 px-3 font-mono text-[10px] uppercase tracking-[0.14em]'
          onClick={hint.onDone}
          size='sm'
          variant='ghost'
        >
          {translateInputText(t, hint.doneLabel)}
        </Button>
      ) : null}
    </div>
  );
}

export function getPendingInputTitle(
  t: TFunction,
  model: IPlayerInputModel,
): string {
  if (model.title) return translateInputText(t, model.title);

  switch (model.type) {
    case EPlayerInputType.CARD:
      return t('client.input.select_card', { defaultValue: 'Select card' });
    case EPlayerInputType.SECTOR:
      return t('client.input.select_sector', { defaultValue: 'Select sector' });
    case EPlayerInputType.PLANET:
      return t('client.input.select_planet', { defaultValue: 'Select planet' });
    case EPlayerInputType.TECH:
      return t('client.input.select_tech', { defaultValue: 'Select tech' });
    case EPlayerInputType.GOLD_TILE:
      return t('client.input.select_gold_tile', {
        defaultValue: 'Select scoring tile',
      });
    case EPlayerInputType.RESOURCE:
      return t('client.input.select_resource', {
        defaultValue: 'Select resource',
      });
    case EPlayerInputType.TRACE:
      return t('client.input.select_trace', { defaultValue: 'Select trace' });
    case EPlayerInputType.END_OF_ROUND:
      return t('client.input.choose_end_of_round', {
        defaultValue: 'Choose end-of-round card',
      });
    case EPlayerInputType.OR:
    case EPlayerInputType.AND:
    case EPlayerInputType.OPTION:
      return t('client.game_layout.resolve_input', {
        defaultValue: 'Resolve input',
      });
    default:
      return t('client.game_layout.awaiting_input', {
        defaultValue: 'Input Required',
      });
  }
}
