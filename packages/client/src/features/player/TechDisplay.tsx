import { type ETechId, getTechDescriptor } from '@seti/common/types/tech';
import { useTranslation } from 'react-i18next';
import { ETech } from '@/types/re-exports';

interface ITechDisplayProps {
  techs: ETechId[];
}

const TYPE_I18N_KEY: Record<ETech, string> = {
  [ETech.PROBE]: 'probe',
  [ETech.SCAN]: 'scan',
  [ETech.COMPUTER]: 'computer',
  [ETech.ANY]: 'any',
};

const TYPE_ORDER: readonly ETech[] = [
  ETech.PROBE,
  ETech.SCAN,
  ETech.COMPUTER,
] as const;

export function TechDisplay({ techs }: ITechDisplayProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const grouped = new Map<ETech, ETechId[]>();

  for (const techId of techs) {
    const descriptor = getTechDescriptor(techId);
    const current = grouped.get(descriptor.type) ?? [];
    current.push(techId);
    grouped.set(descriptor.type, current);
  }

  return (
    <section className='instrument-panel p-2'>
      <div className='section-head mb-1.5'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>{t('client.tech_display.title')}</p>
        <div aria-hidden className='section-head__rule' />
      </div>

      {techs.length === 0 ? (
        <p className='font-mono text-[10px] tracking-[0.08em] text-text-500'>
          {t('client.tech_display.empty')}
        </p>
      ) : (
        <div className='space-y-1'>
          {TYPE_ORDER.map((techType) => {
            const typeTechs = grouped.get(techType) ?? [];
            return (
              <div key={techType} className='flex items-center gap-1.5'>
                <span className='w-14 shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-text-500'>
                  {t(`client.tech_display.types.${TYPE_I18N_KEY[techType]}`)}
                </span>
                {typeTechs.length === 0 ? (
                  <span
                    aria-hidden
                    className='inline-block h-px w-3 bg-[color:var(--surface-700)]'
                  />
                ) : (
                  <div className='flex flex-wrap gap-1'>
                    {typeTechs.map((techId) => {
                      const descriptor = getTechDescriptor(techId);
                      return (
                        <span
                          key={techId}
                          className='chip'
                          data-active='true'
                          title={techId}
                        >
                          L{descriptor.level + 1}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
