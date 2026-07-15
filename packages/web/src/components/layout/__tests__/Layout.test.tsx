import type { ImageProps } from 'next/image';
import Image from 'next/image';
import React from 'react';
import Layout from '../Layout';

jest.mock('next/image', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => null,
}));

jest.mock('@/components/layout/QueryProvider', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => null,
}));

function collectImageProps(node: React.ReactNode): ImageProps[] {
  if (!React.isValidElement(node)) {
    return [];
  }

  const props = node.props as { children?: React.ReactNode } & ImageProps;
  const nestedProps = React.Children.toArray(props.children).flatMap((child) =>
    collectImageProps(child),
  );

  if (node.type === Image) {
    return [props, ...nestedProps];
  }

  return nestedProps;
}

function collectElementProps(
  node: React.ReactNode,
  type: React.ElementType,
): Record<string, unknown>[] {
  if (!React.isValidElement(node)) {
    return [];
  }

  const props = node.props as { children?: React.ReactNode };
  const nestedProps = React.Children.toArray(props.children).flatMap((child) =>
    collectElementProps(child, type),
  );

  if (node.type === type) {
    return [props as Record<string, unknown>, ...nestedProps];
  }

  return nestedProps;
}

describe('Layout', () => {
  it('renders the logo without next/image', () => {
    const tree = Layout({ children: <div>content</div> });

    const nextImageLogoProps = collectImageProps(tree).find(
      (props) => props.src === '/images/logo.png',
    );
    const imgLogoProps = collectElementProps(tree, 'img').find(
      (props) => props.src === '/images/logo.png',
    );

    expect(nextImageLogoProps).toBeUndefined();
    expect(imgLogoProps).toEqual(
      expect.objectContaining({
        alt: 'logo',
        className: expect.stringContaining('w-[60px]'),
        height: 60,
        src: '/images/logo.png',
        width: 60,
      }),
    );
  });
});
