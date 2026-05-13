import { composeStories } from '@storybook/react-vite';
import { act, cleanup } from '@testing-library/react';
import { afterEach, describe, it } from 'vitest';
import * as PlanetaryBoardViewStories from '@/features/board/PlanetaryBoardView.stories';
import * as CardRenderStories from '@/features/cards/CardRender.stories';
import * as CardRowViewStories from '@/features/cards/CardRowView.stories';
import * as HandViewStories from '@/features/player/HandView.stories';
import * as RivalPanelStories from '@/features/solo/RivalPanel.stories';
import { useDebugStore } from '@/stores/debugStore';

const planetaryBoardViewStories = composeStories(PlanetaryBoardViewStories);
const cardRenderStories = composeStories(CardRenderStories);
const cardRowViewStories = composeStories(CardRowViewStories);
const handViewStories = composeStories(HandViewStories);
const rivalPanelStories = composeStories(RivalPanelStories);

afterEach(() => {
  cleanup();
  act(() => {
    useDebugStore.setState({ textMode: false });
  });
});

async function runStory(
  story: { run: () => Promise<void> | void },
  textMode: boolean,
) {
  act(() => {
    useDebugStore.setState({ textMode });
  });
  await story.run();
  cleanup();
}

describe('Storybook core client stories', () => {
  it('validates card rendering output in text and image modes', async () => {
    await runStory(cardRenderStories.TextModeComplexCard, true);
    await runStory(cardRenderStories.ImageModeCard, false);
  });

  it('validates card row callback output in text and image modes', async () => {
    await runStory(cardRowViewStories.TextModeBuyRow, true);
    await runStory(cardRowViewStories.ImageModeSelectedRow, false);
  });

  it('validates hand selection and inspection output in text and image modes', async () => {
    await runStory(handViewStories.TextModeCardSelection, true);
    await runStory(handViewStories.ImageModeInspect, false);
  });

  it('validates planetary board output and input payloads in text and image modes', async () => {
    await runStory(planetaryBoardViewStories.TextModePlanetSummary, true);
    await runStory(planetaryBoardViewStories.ImageModePlanetInput, false);
  });

  it('validates solo rival panel output in text and image modes', async () => {
    await runStory(rivalPanelStories.ImageModeRivalPanel, false);
    await runStory(rivalPanelStories.TextModeRivalPanel, true);
  });
});
