import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SceneBackground,
  SceneProvider,
  useSceneHero,
} from '@/components/layout/SceneBackground';

function HeroSetter({ src }: { src: string | null }): React.JSX.Element {
  useSceneHero(src);
  return <div data-testid='probe' />;
}

describe('SceneBackground', () => {
  it('renders only the footer banner when no hero is registered', () => {
    render(
      <SceneProvider>
        <SceneBackground />
      </SceneProvider>,
    );

    expect(screen.getByTestId('scene-background')).toBeInTheDocument();
    expect(screen.getByTestId('scene-footer')).toBeInTheDocument();
    expect(screen.queryByTestId('scene-hero')).toBeNull();
  });

  it('renders the hero registered by a route via useSceneHero', () => {
    render(
      <SceneProvider>
        <SceneBackground />
        <HeroSetter src='/assets/seti/scenes/lobby.webp' />
      </SceneProvider>,
    );

    const hero = screen.getByTestId('scene-hero');
    expect(hero.style.backgroundImage).toContain(
      '/assets/seti/scenes/lobby.webp',
    );
  });

  it('clears the hero when the registering component unmounts', () => {
    const { rerender } = render(
      <SceneProvider>
        <SceneBackground />
        <HeroSetter src='/assets/seti/scenes/profile.webp' />
      </SceneProvider>,
    );

    expect(screen.getByTestId('scene-hero')).toBeInTheDocument();

    rerender(
      <SceneProvider>
        <SceneBackground />
      </SceneProvider>,
    );

    expect(screen.queryByTestId('scene-hero')).toBeNull();
  });
});
