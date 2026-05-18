import { DescRender } from '@seti/cards';
import { useTranslation } from 'react-i18next';
import type { IPublicGlyphidsBoard } from '@/types/re-exports';
import { TraceColumnGrid } from './AlienBoardTraceGrid';

export function GlyphidsBoard({
  alienIndex,
  board,
  playerColors,
}: {
  alienIndex: number;
  board: IPublicGlyphidsBoard;
  playerColors: Record<string, string>;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='min-w-0 rounded border border-surface-700/50 bg-surface-950/30 p-2' data-testid={`alien-${alienIndex}-glyphids-board`}>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <span className='font-mono text-[10px] uppercase tracking-widest text-text-500'>{t('client.alien_board.types.glyphids')}</span>
        <span className='rounded border border-surface-700/60 bg-surface-900/40 px-2 py-0.5 font-mono text-[10px] text-text-300' data-testid={`alien-${alienIndex}-glyphids-bank`}>
          {t('client.alien_board.glyphids.bank_count', { count: board.glyphTokenBankSize })}
        </span>
      </div>
      <div className='grid gap-2 md:grid-cols-3'>
        <section className='rounded border border-surface-700/50 bg-surface-900/35 p-2'>
          <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>{t('client.alien_board.glyphids.player_rows')}</div>
          <div className='space-y-2'>
            {Object.entries(board.glyphRows).length === 0 ? (
              <div className='rounded border border-dashed border-surface-700/50 px-2 py-3 font-mono text-[10px] text-text-500'>{t('client.alien_board.glyphids.no_glyph_rows')}</div>
            ) : (
              Object.entries(board.glyphRows).flatMap(([playerId, rows]) =>
                rows.map((row, rowIndex) => (
                  <div key={`${playerId}-${rowIndex}`} className='flex items-center justify-between gap-2 rounded border border-surface-700/50 bg-surface-950/40 px-2 py-1.5' data-testid={`alien-${alienIndex}-glyphids-row-${playerId}-${rowIndex}`}>
                    <span className='flex min-w-0 items-center gap-1.5'>
                      <span className='h-2.5 w-2.5 shrink-0 rounded-full border border-surface-200/30' style={{ backgroundColor: playerColors[playerId] ?? '#cbd5e1' }} />
                      <span className='truncate font-mono text-[10px] text-text-300'>{playerId}</span>
                    </span>
                    <GlyphIconRow glyphs={row} />
                  </div>
                )),
              )
            )}
          </div>
        </section>
        <section className='rounded border border-surface-700/50 bg-surface-900/35 p-2'>
          <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>{t('client.alien_board.glyphids.board_tokens')}</div>
          <div className='grid grid-cols-2 gap-2'>
            {board.boardTokens.map((token) => (
              <div key={`${token.position}-${token.glyph}`} className='flex items-center justify-between gap-2 rounded border border-surface-700/50 bg-surface-950/40 px-2 py-1.5' data-testid={`alien-${alienIndex}-glyphids-board-token-${token.position}`}>
                <span className='font-mono text-[10px] text-text-400'>{token.position}</span>
                <GlyphIconRow glyphs={[token.glyph]} />
              </div>
            ))}
          </div>
        </section>
        <section className='rounded border border-surface-700/50 bg-surface-900/35 p-2'>
          <div className='mb-2 font-mono text-[10px] uppercase tracking-widest text-text-500'>{t('client.alien_board.glyphids.translation')}</div>
          <div className='space-y-2'>
            {board.translationRows.map((row) => (
              <div key={row.rowId} className='flex items-center justify-between gap-2 rounded border border-surface-700/50 bg-surface-950/40 px-2 py-1.5' data-testid={`alien-${alienIndex}-glyphids-translation-${row.rowId}`}>
                <span className='font-mono text-[10px] text-text-400'>{t('client.alien_board.glyphids.side', { side: row.side })}</span>
                <GlyphIconRow glyphs={row.glyphs} />
              </div>
            ))}
          </div>
        </section>
      </div>
      {board.traceSlots.length > 0 ? <div className='mt-3'><TraceColumnGrid alienIndex={alienIndex} area='glyphids-trace' slots={board.traceSlots} playerColors={playerColors} /></div> : null}
    </section>
  );
}

function GlyphIconRow({ glyphs }: { glyphs: readonly (string | null)[] }): React.JSX.Element {
  return (
    <span className='flex shrink-0 items-center gap-1'>
      {glyphs.map((glyph, index) => glyph === null ? (
        <span key={`empty-${index}`} className='inline-flex h-5 w-5 items-center justify-center rounded border border-dashed border-surface-700/60' />
      ) : (
        <span key={`${glyph}-${index}`} className='inline-flex h-5 w-5 items-center justify-center'>
          <DescRender desc={`{${glyph}-1}`} size='xs' smartSize />
        </span>
      ))}
    </span>
  );
}
