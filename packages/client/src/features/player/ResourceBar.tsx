import { EResource } from '@seti/common/types/element';
import { useTranslation } from 'react-i18next';
import type { IPublicPlayerState } from '@/types/re-exports';

interface IResourceBarProps {
  player: IPublicPlayerState;
  /**
   * Whether the per-player exofossil cell should be rendered. Hidden
   * unless an Oumuamua alien board is discovered in the current game —
   * exofossils are a species-specific currency and the cell is
   * meaningless when Oumuamua is absent.
   */
  showExofossils?: boolean;
}

interface IResourceItem {
  id: string;
  i18nKey: string;
  fallback: string;
  icon: string;
  value: (player: IPublicPlayerState) => number;
  /** "primary" resources live in the main cell row; score gets extra emphasis */
  emphasize?: boolean;
  /** Image-local rotation in degrees, applied to the icon only. */
  iconRotationDeg?: number;
  /** Scale factor on the icon, defaults to 1.0. */
  iconScale?: number;
}

const BASE_RESOURCE_ITEMS: IResourceItem[] = [
  {
    id: 'credit',
    i18nKey: 'client.resource_bar.credit',
    fallback: 'Credits',
    icon: '/assets/seti/icons/money.png',
    value: (p) => p.resources[EResource.CREDIT],
  },
  {
    id: 'energy',
    i18nKey: 'client.resource_bar.energy',
    fallback: 'Energy',
    icon: '/assets/seti/icons/energy.png',
    value: (p) => p.resources[EResource.ENERGY],
  },
  {
    id: 'publicity',
    i18nKey: 'client.resource_bar.publicity',
    fallback: 'Publicity',
    icon: '/assets/seti/icons/pop.png',
    value: (p) => p.resources[EResource.PUBLICITY],
  },
  {
    id: 'signal-token',
    i18nKey: 'client.resource_bar.signal_tokens',
    fallback: 'Signal Tokens',
    icon: '/assets/seti/icons/signalToken.png',
    value: (p) => p.resources[EResource.SIGNAL_TOKEN] ?? 0,
  },
  {
    id: 'score',
    i18nKey: 'client.resource_bar.score',
    fallback: 'Score',
    icon: '/assets/seti/icons/vp.png',
    value: (p) => p.score,
    emphasize: true,
  },
];

const EXOFOSSIL_ITEM: IResourceItem = {
  id: 'exofossils',
  i18nKey: 'client.resource_bar.exofossils',
  fallback: 'Exofossils',
  icon: '/assets/seti/aliens/oumuamua/exofossil.webp',
  value: (p) => p.exofossils ?? 0,
  // The printed token sits at a slight tilt on the species board;
  // rotate +45° clockwise so the fossil glyph reads upright in the
  // resource cell. Scale to 90% so it sits inside the cell without
  // the rotated bounding box crowding the label.
  iconRotationDeg: 45,
  iconScale: 0.8,
};

/**
 * ResourceBar — four instrument cells separated by tick-rule columns.
 * Icon + micro-label + mono readout. Score cell gets a faint accent wash
 * because victory is the point of every readout on this panel.
 */
export function ResourceBar({
  player,
  showExofossils = false,
}: IResourceBarProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const items = showExofossils
    ? [...BASE_RESOURCE_ITEMS, EXOFOSSIL_ITEM]
    : BASE_RESOURCE_ITEMS;
  return (
    <section
      className={`instrument-panel grid overflow-hidden ${
        showExofossils ? 'grid-cols-6' : 'grid-cols-5'
      }`}
      data-testid='resource-bar'
    >
      {items.map((item, index) => {
        const label = t(item.i18nKey, { defaultValue: item.fallback });
        return (
          <div
            key={item.id}
            className='relative flex items-center gap-1.5 px-2 py-1.5'
            data-testid={`resource-${item.id}`}
          >
            {index > 0 ? (
              <span
                aria-hidden
                className='absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 bg-[color:var(--metal-edge-soft)] opacity-80'
              />
            ) : null}
            {item.emphasize ? (
              <span
                aria-hidden
                className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.68_0.11_240/0.10),transparent_70%)]'
              />
            ) : null}
            <img
              src={item.icon}
              alt={label}
              className='relative h-4 w-4 shrink-0 opacity-95'
              style={(() => {
                const transforms: string[] = [];
                if (item.iconRotationDeg) {
                  transforms.push(`rotate(${item.iconRotationDeg}deg)`);
                }
                if (item.iconScale !== undefined && item.iconScale !== 1) {
                  transforms.push(`scale(${item.iconScale})`);
                }
                return transforms.length > 0
                  ? { transform: transforms.join(' ') }
                  : undefined;
              })()}
            />
            <div className='relative min-w-0 flex-1'>
              <p className='micro-label truncate leading-none'>{label}</p>
              <p
                className={
                  item.emphasize
                    ? 'readout mt-0.5 text-[15px] font-semibold text-text-100 leading-none'
                    : 'readout mt-0.5 text-sm font-semibold text-text-100 leading-none'
                }
              >
                {item.value(player)}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
