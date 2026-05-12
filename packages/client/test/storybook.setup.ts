import '@testing-library/jest-dom/vitest';
import { setProjectAnnotations } from '@storybook/react-vite';
import { beforeAll, beforeEach } from 'vitest';
import { useDebugStore } from '@/stores/debugStore';
import * as previewAnnotations from '../.storybook/preview';

const annotations = setProjectAnnotations([previewAnnotations]);

if (annotations.beforeAll) {
  beforeAll(annotations.beforeAll);
}

beforeEach(() => {
  if (typeof window.localStorage?.clear === 'function') {
    window.localStorage.clear();
  }
  useDebugStore.setState({ textMode: false });
});
