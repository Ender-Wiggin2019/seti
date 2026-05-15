import { ORGANIZATIONS_BY_ID } from '@seti/common/data/organizations';
import type { EOrganizationId } from '@seti/common/types/organization';
import { cn } from '@/lib/cn';

interface IOrganizationBadgeProps {
  organizationId: EOrganizationId;
  className?: string;
}

export function OrganizationBadge({
  organizationId,
  className,
}: IOrganizationBadgeProps): React.JSX.Element {
  const organization = ORGANIZATIONS_BY_ID[organizationId];
  return (
    <span
      className={cn(
        'chip max-w-full truncate border-[color:var(--accent-600)] bg-accent-950/40 text-[10px] text-accent-200',
        className,
      )}
      data-testid={`organization-badge-${organizationId}`}
    >
      {organization?.name ?? organizationId}
    </span>
  );
}
