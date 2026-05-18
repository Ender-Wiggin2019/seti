import { ORGANIZATIONS_BY_ID } from '@seti/common/data/organizations';
import type { EOrganizationId } from '@seti/common/types/organization';

type TTranslate = (
  key: string,
  options?: Record<string, unknown> & { defaultValue?: string },
) => string;

export function getOrganizationDisplayName(
  t: TTranslate,
  organizationId: EOrganizationId,
): string {
  const fallback = ORGANIZATIONS_BY_ID[organizationId]?.name ?? organizationId;
  return t(`client.organizations.names.${organizationId}`, {
    defaultValue: fallback,
  });
}
