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
  return (
    <span
      className={cn(
        'chip max-w-full truncate border-[color:var(--accent-600)] bg-accent-950/40 text-[10px] text-accent-200',
        className,
      )}
      data-testid={`organization-badge-${organizationId}`}
    >
      {getOrganizationDisplayName(t, organizationId)}
    </span>
  );
}
