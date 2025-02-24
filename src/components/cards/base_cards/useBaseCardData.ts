import { useContext } from 'react';

import { AnimalDataContext } from './BaseCardDataContext';

export function useBaseCardData() {
  return useContext(AnimalDataContext);
}
