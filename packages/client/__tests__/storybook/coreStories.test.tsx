import { composeStories } from '@storybook/react-vite';
import { cleanup } from '@testing-library/react';
import { afterEach, describe, it } from 'vitest';
import * as PlanetaryBoardViewStories from '@/features/board/PlanetaryBoardView.stories';
import * as CardRenderStories from '@/features/cards/CardRender.stories';
import * as CardRowViewStories from '@/features/cards/CardRowView.stories';
import * as HandViewStories from '@/features/player/HandView.stories';
import * as RivalPanelStories from '@/features/solo/RivalPanel.stories';

const planetaryBoardViewStories = composeStories(PlanetaryBoardViewStories);
const cardRenderStories = composeStories(CardRenderStories);
const cardRowViewStories = composeStories(CardRowViewStories);
const handViewStories = composeStories(HandViewStories);
const rivalPanelStories = composeStories(RivalPanelStories);

afterEach(() => {
  cleanup();
});

async function runStory(story: { run: () => Promise<void> | void }) {
  await story.run();
  cleanup();
}

describe('Storybook core client stories', () => {
  it('validates card rendering output in text and image modes', async () => {
    await runStory(cardRenderStories.TextModeComplexCard);
    await runStory(cardRenderStories.ImageModeCard);
  });

  it('validates card row callback output in text and image modes', async () => {
    await runStory(cardRowViewStories.TextModeBuyRow);
    await runStory(cardRowViewStories.ImageModeSelectedRow);
  });

  it('validates hand selection and inspection output in text and image modes', async () => {
    await runStory(handViewStories.TextModeCardSelection);
    await runStory(handViewStories.ImageModeInspect);
  });

  it('validates planetary board output and input payloads in text and image modes', async () => {
    await runStory(planetaryBoardViewStories.TextModePlanetSummary);
    await runStory(planetaryBoardViewStories.ImageModePlanetInput);
  });

  it('validates solo rival panel output in text and image modes', async () => {
    await runStory(rivalPanelStories.ImageModeRivalPanel);
    await runStory(rivalPanelStories.TextModeRivalPanel);
  });
});
