/* eslint-disable @next/next/no-img-element */
import type { IOrganizationData } from '@seti/common/types/organization';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface IOrganizationCardProps {
  organization: IOrganizationData;
}

export function OrganizationCard({
  organization,
}: IOrganizationCardProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const displayName = t(`client.organizations.names.${organization.id}`, {
    defaultValue: organization.name,
  });
  const imageSrc = `/images/${organization.frontendReference.image}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type='button'
          className='group relative aspect-[671/507] w-full cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-zinc-950/40 text-left shadow-lg shadow-zinc-950/30 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 hover:z-10 hover:scale-[1.04] hover:border-primary-400/50 hover:shadow-2xl hover:shadow-primary-900/40 hover:ring-primary-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400'
          data-testid={`organization-card-${organization.id}`}
          aria-label={displayName}
        >
          <img
            src={imageSrc}
            alt={displayName}
            loading='lazy'
            className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110'
          />
          <span className='absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 py-2 text-sm font-semibold text-zinc-50'>
            {displayName}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className='max-w-5xl border-white/10 bg-zinc-950/95 p-0 text-zinc-100 sm:max-w-5xl'>
        <DialogHeader className='px-6 pt-6'>
          <DialogTitle className='text-xl font-bold tracking-wide text-zinc-50'>
            {displayName}
          </DialogTitle>
        </DialogHeader>
        <div className='px-6 pb-6'>
          <div className='overflow-hidden rounded-md border border-white/10 bg-black/40'>
            <img
              src={imageSrc}
              alt={displayName}
              className='block h-auto w-full object-contain'
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
