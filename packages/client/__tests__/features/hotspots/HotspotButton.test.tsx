import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HotspotButton } from '@/features/hotspots/HotspotButton';
import { useDebugStore } from '@/stores/debugStore';

function mockSceneRect(element: HTMLElement): void {
  element.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 400,
    bottom: 200,
    width: 400,
    height: 200,
    toJSON: () => ({}),
  }));
}

function firePointerEvent(
  target: Window | HTMLElement,
  type: string,
  clientX: number,
  clientY: number,
): void {
  fireEvent(
    target,
    new MouseEvent(type, {
      bubbles: true,
      clientX,
      clientY,
    }),
  );
}

describe('HotspotButton', () => {
  beforeEach(() => {
    useDebugStore.setState({
      textMode: false,
      hotspotDebug: false,
      showInteractiveHotspots: true,
      showAnchorHotspots: true,
      hotspotOverrides: {},
      hotspotDraftOverrides: {},
    });
  });

  it('renders a transparent circular button from scene coordinates', () => {
    render(
      <div>
        <HotspotButton
          sceneId='solar'
          hotspotId='earth'
          baseWidth={400}
          baseHeight={200}
          x={100}
          y={50}
          width={40}
          height={40}
          debugLabel='Earth launch'
          ariaLabel='Launch from Earth'
        />
      </div>,
    );

    const hotspot = screen.getByRole('button', { name: 'Launch from Earth' });
    expect(hotspot).toHaveAttribute('data-hotspot-scene', 'solar');
    expect(hotspot).toHaveAttribute('data-hotspot-id', 'earth');
    expect(hotspot).toHaveStyle({
      left: '25%',
      top: '25%',
      width: '10%',
      height: '20%',
    });
    expect(hotspot.style.backgroundColor).toBe('transparent');
    expect(screen.queryByText('Earth launch')).not.toBeInTheDocument();
  });

  it('shows the debug label and writes drag edits to the unsaved draft', () => {
    useDebugStore.getState().setHotspotDebug(true);
    const onClick = vi.fn();

    render(
      <div data-testid='scene' className='relative'>
        <HotspotButton
          sceneId='solar'
          hotspotId='earth'
          baseWidth={400}
          baseHeight={200}
          x={100}
          y={50}
          width={40}
          height={40}
          debugLabel='Earth launch'
          onClick={onClick}
        />
      </div>,
    );
    mockSceneRect(screen.getByTestId('scene'));

    const hotspot = screen.getByTestId('hotspot-solar-earth');
    expect(screen.getByText('Earth launch')).toBeInTheDocument();

    firePointerEvent(hotspot, 'pointerdown', 100, 50);
    firePointerEvent(window, 'pointermove', 140, 70);
    firePointerEvent(window, 'pointerup', 140, 70);
    fireEvent.click(hotspot);

    expect(onClick).not.toHaveBeenCalled();
    expect(useDebugStore.getState().hotspotOverrides.solar?.earth).toBe(
      undefined,
    );
    expect(
      useDebugStore.getState().hotspotDraftOverrides.solar?.earth,
    ).toMatchObject({
      x: 140,
      y: 70,
      width: 40,
      height: 40,
    });
  });

  it('keeps text and image hotspot overrides in separate namespaces', () => {
    useDebugStore.getState().setHotspotDebug(true);
    useDebugStore.setState({
      hotspotOverrides: {
        'solar-system:image': {
          'space-0': { x: 200, y: 100, width: 40, height: 40 },
        },
        'solar-system:text': {
          'space-0': { x: 300, y: 150, width: 60, height: 60 },
        },
      },
    });

    render(
      <div data-testid='scene' className='relative'>
        <HotspotButton
          sceneId='solar-system'
          hotspotId='space-0'
          variant='image'
          baseWidth={400}
          baseHeight={200}
          x={100}
          y={50}
          width={40}
          height={40}
          debugLabel='image space'
          testId='image-space'
        />
        <HotspotButton
          sceneId='solar-system'
          hotspotId='space-0'
          variant='text'
          baseWidth={400}
          baseHeight={200}
          x={100}
          y={50}
          width={40}
          height={40}
          debugLabel='text space'
          testId='text-space'
        />
      </div>,
    );
    mockSceneRect(screen.getByTestId('scene'));

    const imageSpace = screen.getByTestId('image-space');
    const textSpace = screen.getByTestId('text-space');
    expect(imageSpace).toHaveAttribute('data-hotspot-variant', 'image');
    expect(textSpace).toHaveAttribute('data-hotspot-variant', 'text');
    expect(imageSpace).toHaveStyle({ left: '50%', top: '50%' });
    expect(textSpace).toHaveStyle({ left: '75%', top: '75%' });

    firePointerEvent(imageSpace, 'pointerdown', 200, 100);
    firePointerEvent(window, 'pointermove', 240, 120);
    firePointerEvent(window, 'pointerup', 240, 120);

    expect(
      useDebugStore.getState().hotspotDraftOverrides['solar-system:image']?.[
        'space-0'
      ],
    ).toMatchObject({
      x: 240,
      y: 120,
      width: 40,
      height: 40,
    });
    expect(
      useDebugStore.getState().hotspotDraftOverrides['solar-system:text'],
    ).toBeUndefined();
    expect(
      useDebugStore.getState().hotspotDraftOverrides['solar-system'],
    ).toBeUndefined();
  });

  it('uses the offset parent as the coordinate scene when nested in a zero-size wrapper', () => {
    useDebugStore.getState().setHotspotDebug(true);

    render(
      <div data-testid='scene' className='relative'>
        <div>
          <HotspotButton
            sceneId='planet-board'
            hotspotId='mars-orbit-0'
            baseWidth={400}
            baseHeight={200}
            x={100}
            y={50}
            width={40}
            height={40}
            debugLabel='Mars orbit'
          />
        </div>
      </div>,
    );
    const scene = screen.getByTestId('scene');
    const hotspot = screen.getByTestId('hotspot-planet-board-mars-orbit-0');
    mockSceneRect(scene);
    Object.defineProperty(hotspot, 'offsetParent', {
      configurable: true,
      get: () => scene,
    });

    firePointerEvent(hotspot, 'pointerdown', 100, 50);
    firePointerEvent(window, 'pointermove', 140, 70);
    firePointerEvent(window, 'pointerup', 140, 70);

    expect(
      useDebugStore.getState().hotspotDraftOverrides['planet-board']?.[
        'mars-orbit-0'
      ],
    ).toMatchObject({
      x: 140,
      y: 70,
      width: 40,
      height: 40,
    });
  });

  it('resizes from the debug handle and writes the new size to the draft', () => {
    useDebugStore.getState().setHotspotDebug(true);

    render(
      <div data-testid='scene' className='relative'>
        <HotspotButton
          sceneId='planet'
          hotspotId='mars-land'
          baseWidth={400}
          baseHeight={200}
          x={100}
          y={50}
          width={40}
          height={40}
          debugLabel='Mars land'
        />
      </div>,
    );
    mockSceneRect(screen.getByTestId('scene'));

    const handle = screen.getByTestId('hotspot-resize-planet-mars-land');
    firePointerEvent(handle, 'pointerdown', 120, 70);
    firePointerEvent(window, 'pointermove', 150, 100);
    firePointerEvent(window, 'pointerup', 150, 100);

    expect(
      useDebugStore.getState().hotspotDraftOverrides.planet?.['mars-land'],
    ).toMatchObject({
      x: 100,
      y: 50,
      width: 70,
      height: 70,
    });
  });
});
