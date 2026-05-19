import { ORGANIZATIONS_BY_ID } from '@seti/common/data/organizations';
import type { EOrganizationId } from '@seti/common/types/organization';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { getOrganizationDisplayName } from '@/lib/organizationText';

interface IOrganizationBadgeProps {
  organizationId: EOrganizationId;
  className?: string;
}

export function OrganizationBadge({
  organizationId,
  className,
}: IOrganizationBadgeProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const organization = ORGANIZATIONS_BY_ID[organizationId];
  const reference = organization?.frontendReference;
  return (
    <span
      className={cn(
        'chip max-w-full gap-1.5 truncate border-[color:var(--accent-600)] bg-accent-950/40 text-[10px] text-accent-200',
        className,
      )}
      data-testid={`organization-badge-${organizationId}`}
      title={reference?.displayName}
    >
      {reference ? (
        <img
          alt={reference.displayName}
          className='h-4 w-6 shrink-0 rounded-[2px] object-cover'
          src={`/assets/seti/${reference.image}`}
        />
      ) : null}
      {getOrganizationDisplayName(t, organizationId)}
    </span>
  );
}
