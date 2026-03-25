import { useContext } from 'react';

import { BaseCardDataContext } from './BaseCardDataContext';

export function useBaseCardData() {
  return useContext(BaseCardDataContext);
}
