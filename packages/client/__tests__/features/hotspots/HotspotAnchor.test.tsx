import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HotspotAnchor } from '@/features/hotspots/HotspotAnchor';
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

describe('HotspotAnchor', () => {
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

  it('renders a non-interactive image anchor from scene coordinates', () => {
    render(
      <div>
        <HotspotAnchor
          sceneId='rival-board'
          hotspotId='progress-marker'
          baseWidth={400}
          baseHeight={200}
          x={100}
          y={50}
          width={40}
          height={40}
          debugLabel='rival progress marker'
        >
          <span data-testid='marker-child' />
        </HotspotAnchor>
      </div>,
    );

    const anchor = screen.getByTestId(
      'hotspot-anchor-rival-board-progress-marker',
    );
    expect(anchor).toHaveAttribute('data-hotspot-scene', 'rival-board');
    expect(anchor).toHaveAttribute('data-hotspot-id', 'progress-marker');
    expect(anchor).toHaveAttribute('data-hotspot-role', 'anchor');
    expect(anchor).toHaveStyle({
      left: '25%',
      top: '25%',
      width: '10%',
      height: '20%',
    });
    expect(anchor.style.backgroundColor).toBe('transparent');
    expect(screen.getByTestId('marker-child')).toBeInTheDocument();
    expect(screen.queryByText('rival progress marker')).not.toBeInTheDocument();
  });

  it('shows debug info only on hover and writes drag edits to the unsaved draft', () => {
    useDebugStore.getState().setHotspotDebug(true);

    render(
      <div data-testid='scene' className='relative'>
        <HotspotAnchor
          sceneId='alien-board'
          hotspotId='centaurians-red-0'
          baseWidth={400}
          baseHeight={200}
          x={100}
          y={50}
          width={40}
          height={40}
          debugLabel='centaurians red trace 0'
          debugInfo='bonus: draw alien card'
        />
      </div>,
    );
    mockSceneRect(screen.getByTestId('scene'));

    const anchor = screen.getByTestId(
      'hotspot-anchor-alien-board-centaurians-red-0',
    );
    expect(
      screen.queryByText('centaurians red trace 0'),
    ).not.toBeInTheDocument();

    fireEvent.mouseEnter(anchor);

    const info = screen.getByTestId(
      'hotspot-anchor-info-alien-board-centaurians-red-0',
    );
    expect(info).toHaveTextContent('centaurians red trace 0');
    expect(info).toHaveTextContent('bonus: draw alien card');

    firePointerEvent(anchor, 'pointerdown', 100, 50);
    firePointerEvent(window, 'pointermove', 140, 70);
    firePointerEvent(window, 'pointerup', 140, 70);

    expect(useDebugStore.getState().hotspotOverrides['alien-board']).toBe(
      undefined,
    );
    expect(
      useDebugStore.getState().hotspotDraftOverrides['alien-board']?.[
        'centaurians-red-0'
      ],
    ).toMatchObject({
      x: 140,
      y: 70,
      width: 40,
      height: 40,
    });
  });

  it('keeps text and image anchor overrides in separate namespaces', () => {
    useDebugStore.getState().setHotspotDebug(true);
    useDebugStore.setState({
      hotspotOverrides: {
        'sector-board:image': {
          'north-sector-0-slot-0': { x: 80, y: 40, width: 24, height: 24 },
        },
        'sector-board:text': {
          'north-sector-0-slot-0': { x: 20, y: 16, width: 30, height: 30 },
        },
      },
    });

    render(
      <div data-testid='scene' className='relative'>
        <HotspotAnchor
          sceneId='sector-board'
          hotspotId='north-sector-0-slot-0'
          variant='image'
          baseWidth={120}
          baseHeight={80}
          x={60}
          y={40}
          width={24}
          height={24}
          debugLabel='image sector signal'
          testId='image-signal'
        />
        <HotspotAnchor
          sceneId='sector-board'
          hotspotId='north-sector-0-slot-0'
          variant='text'
          baseWidth={120}
          baseHeight={80}
          x={60}
          y={40}
          width={24}
          height={24}
          debugLabel='text sector signal'
          testId='text-signal'
        />
      </div>,
    );
    mockSceneRect(screen.getByTestId('scene'));

    const imageSignal = screen.getByTestId('image-signal');
    const textSignal = screen.getByTestId('text-signal');
    expect(imageSignal).toHaveAttribute('data-hotspot-variant', 'image');
    expect(textSignal).toHaveAttribute('data-hotspot-variant', 'text');
    expect(imageSignal).toHaveStyle({
      left: '66.666667%',
      top: '50%',
    });
    expect(textSignal).toHaveStyle({
      left: '16.666667%',
      top: '20%',
    });

    firePointerEvent(textSignal, 'pointerdown', 20, 16);
    firePointerEvent(window, 'pointermove', 60, 36);
    firePointerEvent(window, 'pointerup', 60, 36);

    expect(
      useDebugStore.getState().hotspotDraftOverrides['sector-board:text']?.[
        'north-sector-0-slot-0'
      ],
    ).toMatchObject({
      x: 32,
      y: 24,
      width: 30,
      height: 30,
    });
    expect(
      useDebugStore.getState().hotspotDraftOverrides['sector-board:image'],
    ).toBeUndefined();
    expect(
      useDebugStore.getState().hotspotDraftOverrides['sector-board'],
    ).toBeUndefined();
  });

  it('drags percent-positioned anchors from their visual position', () => {
    useDebugStore.getState().setHotspotDebug(true);

    render(
      <div data-testid='scene' className='relative'>
        <HotspotAnchor
          sceneId='corporation-board'
          hotspotId='agency-power'
          variant='image'
          baseWidth={400}
          baseHeight={200}
          x={0}
          y={0}
          xPercent={50}
          yPercent={40}
          width={40}
          height={40}
          debugLabel='agency power'
        />
      </div>,
    );
    mockSceneRect(screen.getByTestId('scene'));

    const anchor = screen.getByTestId(
      'hotspot-anchor-corporation-board-agency-power',
    );
    firePointerEvent(anchor, 'pointerdown', 200, 80);
    firePointerEvent(window, 'pointermove', 240, 100);
    firePointerEvent(window, 'pointerup', 240, 100);

    expect(
      useDebugStore.getState().hotspotDraftOverrides[
        'corporation-board:image'
      ]?.['agency-power'],
    ).toMatchObject({
      x: 240,
      y: 100,
      width: 40,
      height: 40,
    });
  });

  it('keeps percent-based anchors at their rendered position when resized', () => {
    useDebugStore.getState().setHotspotDebug(true);

    render(
      <div data-testid='scene' className='relative'>
        <HotspotAnchor
          sceneId='corporation-board'
          hotspotId='helion-assembly-power'
          variant='image'
          baseWidth={400}
          baseHeight={200}
          x={0}
          y={0}
          xPercent={75}
          yPercent={40}
          width={40}
          height={40}
          debugLabel='organization use marker'
          testId='organization-use-marker-anchor'
        />
      </div>,
    );
    mockSceneRect(screen.getByTestId('scene'));

    const anchor = screen.getByTestId('organization-use-marker-anchor');
    expect(anchor).toHaveStyle({ left: '75%', top: '40%' });

    const handle = screen.getByTestId(
      'hotspot-anchor-resize-corporation-board-helion-assembly-power',
    );
    firePointerEvent(handle, 'pointerdown', 320, 100);
    firePointerEvent(window, 'pointermove', 340, 120);
    firePointerEvent(window, 'pointerup', 340, 120);

    expect(
      useDebugStore.getState().hotspotDraftOverrides[
        'corporation-board:image'
      ]?.['helion-assembly-power'],
    ).toMatchObject({
      x: 300,
      y: 80,
      width: 60,
      height: 60,
    });
  });

  it('resizes from the debug handle and keeps the edit unsaved', () => {
    useDebugStore.getState().setHotspotDebug(true);

    render(
      <div data-testid='scene' className='relative'>
        <HotspotAnchor
          sceneId='planet-board'
          hotspotId='earth-orbit-token-0'
          baseWidth={400}
          baseHeight={200}
          x={100}
          y={50}
          width={40}
          height={40}
          debugLabel='earth orbit token 0'
        />
      </div>,
    );
    mockSceneRect(screen.getByTestId('scene'));

    const handle = screen.getByTestId(
      'hotspot-anchor-resize-planet-board-earth-orbit-token-0',
    );
    firePointerEvent(handle, 'pointerdown', 120, 70);
    firePointerEvent(window, 'pointermove', 150, 100);
    firePointerEvent(window, 'pointerup', 150, 100);

    expect(
      useDebugStore.getState().hotspotDraftOverrides['planet-board']?.[
        'earth-orbit-token-0'
      ],
    ).toMatchObject({
      x: 100,
      y: 50,
      width: 70,
      height: 70,
    });
    expect(useDebugStore.getState().hotspotOverrides['planet-board']).toBe(
      undefined,
    );
  });

  it('preserves rectangular hotspot dimensions while resizing', () => {
    useDebugStore.getState().setHotspotDebug(true);

    render(
      <div data-testid='scene' className='relative'>
        <HotspotAnchor
          sceneId='player-board'
          hotspotId='tech-slot-probe-0'
          variant='image'
          baseWidth={2160}
          baseHeight={728}
          x={242}
          y={197}
          width={197}
          height={276}
          debugLabel='player board tech slot probe-0'
        />
      </div>,
    );
    mockSceneRect(screen.getByTestId('scene'));

    const handle = screen.getByTestId(
      'hotspot-anchor-resize-player-board-tech-slot-probe-0',
    );
    firePointerEvent(handle, 'pointerdown', 340, 335);
    firePointerEvent(window, 'pointermove', 350, 355);
    firePointerEvent(window, 'pointerup', 350, 355);

    expect(
      useDebugStore.getState().hotspotDraftOverrides['player-board:image']?.[
        'tech-slot-probe-0'
      ],
    ).toMatchObject({
      x: 242,
      y: 197,
      width: 207,
      height: 296,
    });
  });
});
