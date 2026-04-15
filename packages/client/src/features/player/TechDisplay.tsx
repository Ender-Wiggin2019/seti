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
    <section className='rounded border border-surface-700/55 bg-surface-950/65 p-2'>
      <p className='mb-1.5 font-mono text-[10px] uppercase tracking-wide text-text-500'>
        {t('client.tech_display.title')}
      </p>

      {techs.length === 0 ? (
        <p className='text-xs text-text-500'>
          {t('client.tech_display.empty')}
        </p>
      ) : (
        <div className='space-y-1'>
          {[ETech.PROBE, ETech.SCAN, ETech.COMPUTER].map((techType) => {
            const typeTechs = grouped.get(techType) ?? [];
            return (
              <div key={techType} className='flex items-center gap-1'>
                <span className='w-14 font-mono text-[10px] text-text-400'>
                  {t(`client.tech_display.types.${TYPE_I18N_KEY[techType]}`)}
                </span>
                <div className='flex flex-wrap gap-1'>
                  {typeTechs.map((techId) => {
                    const descriptor = getTechDescriptor(techId);
                    return (
                      <span
                        key={techId}
                        className='rounded border border-info-400/50 bg-info-500/10 px-1 py-[1px] font-mono text-[10px] text-info-300'
                      >
                        L{descriptor.level + 1}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
