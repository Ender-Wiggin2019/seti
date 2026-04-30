import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { sel } from './selectors';

/**
 * Page Object for the Game page (`/game/:gameId`).
 * Provides high-level helpers for interacting with game UI elements.
 */
export class GamePage {
  constructor(private readonly page: Page) {}

  // ── Navigation & loading ─────────────────────────────────

  async goto(gameId: string): Promise<void> {
    await this.page.goto(`/game/${gameId}`);
  }

  async waitForGameLoaded(): Promise<void> {
    await this.page.waitForSelector(sel.bottomDashboard, { timeout: 15_000 });
  }

  // ── Board tab switching ──────────────────────────────────

  async switchTab(
    tab: 'Board' | 'Planets' | 'Tech' | 'Cards' | 'Aliens' | 'Scoring',
  ): Promise<void> {
    await this.page.click(sel.boardTab(tab));
  }

  // ── Main actions (bottom-right action menu) ──────────────

  async clickMainAction(
    action:
      | 'LAUNCH_PROBE'
      | 'SCAN'
      | 'PLAY_CARD'
      | 'PASS'
      | 'RESEARCH_TECH'
      | 'ORBIT'
      | 'LAND'
      | 'ANALYZE_DATA',
  ): Promise<void> {
    const locator = this.page.locator(sel.actionMenu(action));
    await locator.waitFor({ state: 'visible', timeout: 5_000 });
    await locator.click();
  }

  async isMainActionVisible(action: string): Promise<boolean> {
    return this.page.locator(sel.actionMenu(action)).isVisible();
  }

  async isMainActionEnabled(action: string): Promise<boolean> {
    return this.page.locator(sel.actionMenu(action)).isEnabled();
  }

  // ── Free actions ─────────────────────────────────────────

  async clickFreeAction(
    action:
      | 'MOVEMENT'
      | 'PLACE_DATA'
      | 'EXCHANGE_RESOURCES'
      | 'CONVERT_ENERGY_TO_MOVEMENT'
      | 'USE_CARD_CORNER'
      | 'BUY_CARD'
      | 'COMPLETE_MISSION',
  ): Promise<void> {
    const bar = this.page.locator(sel.freeActionBar);
    if (!(await bar.isVisible())) {
      await this.page.locator(sel.freeActionToggle).click();
    }
    await this.page.locator(sel.freeAction(action)).click();
  }

  // ── Hand interaction ─────────────────────────────────────

  async getHandCardIds(): Promise<string[]> {
    const cards = this.page.locator('[data-testid^="hand-card-"]');
    const count = await cards.count();
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const testId = await cards.nth(i).getAttribute('data-testid');
      if (testId) ids.push(testId.replace('hand-card-', ''));
    }
    return ids;
  }

  async clickHandCard(cardId: string): Promise<void> {
    await this.page.locator(sel.handCard(cardId)).click();
  }

  // ── Resource reading ─────────────────────────────────────

  async getResourceText(resource: string): Promise<string> {
    const locator = this.page.locator(
      `${sel.resourceBar} [data-resource="${resource}"]`,
    );
    return (await locator.textContent()) ?? '';
  }

  // ── Score reading ────────────────────────────────────────

  async getScoreText(): Promise<string> {
    const locator = this.page.locator('[data-testid="score-value"]');
    if (await locator.isVisible()) {
      return (await locator.textContent()) ?? '';
    }
    return '';
  }

  // ── Solar system interaction ─────────────────────────────

  async clickSolarSpace(spaceId: string): Promise<void> {
    await this.page.locator(sel.solarSpace(spaceId)).click();
  }

  async isSolarSpaceVisible(spaceId: string): Promise<boolean> {
    return this.page.locator(sel.solarSpace(spaceId)).isVisible();
  }

  // ── Input prompt response ────────────────────────────────

  async hasInputPrompt(): Promise<boolean> {
    const bottomActions = this.page.locator(sel.bottomActions);
    const inputRenderer = bottomActions.locator('[class*="accent-500"]');
    return inputRenderer.isVisible();
  }

  async clickOptionById(optionId: string): Promise<void> {
    await this.page.locator(`[data-option-id="${optionId}"]`).click();
  }

  async clickSelectCardById(cardId: string): Promise<void> {
    await this.page.locator(sel.selectCard(cardId)).click();
  }

  // ── Card row interaction ─────────────────────────────────

  async clickCardRowCard(cardId: string): Promise<void> {
    await this.switchTab('Cards');
    await this.page.locator(sel.cardRow(cardId)).click();
  }

  // ── End of round card selection ──────────────────────────

  async clickEndOfRoundCard(cardId: string): Promise<void> {
    await this.switchTab('Cards');
    await this.page.locator(sel.roundStackCard(cardId)).click();
  }

  // ── Computer / data placement ────────────────────────────

  async clickComputerSlot(row: 'top' | 'bottom', index: number): Promise<void> {
    const selector =
      row === 'top'
        ? sel.computerSlotTop(index)
        : sel.computerSlotBottom(index);
    await this.page.locator(selector).click();
  }

  // ── Tech board ───────────────────────────────────────────

  async clickTechStack(tech: string, level: number): Promise<void> {
    await this.switchTab('Tech');
    await this.page.locator(sel.techStack(tech, level)).click();
  }

  // ── Sector nodes ─────────────────────────────────────────

  async clickSectorNode(position: number, index: number): Promise<void> {
    await this.page.locator(sel.sectorNode(position, index)).click();
  }

  // ── Gold tile selection ──────────────────────────────────

  async clickGoldTile(tileId: string): Promise<void> {
    await this.page.locator(sel.goldTile(tileId)).click();
  }

  // ── Generic waits ────────────────────────────────────────

  async waitForRound(round: number, timeoutMs = 10_000): Promise<void> {
    await this.page.waitForFunction(
      (r) => {
        const el = document.querySelector('[data-testid="round-indicator"]');
        return el?.textContent?.includes(String(r));
      },
      round,
      { timeout: timeoutMs },
    );
  }

  async waitForActivePlayer(
    playerName: string,
    timeoutMs = 10_000,
  ): Promise<void> {
    await this.page.waitForFunction(
      (name) => {
        const el = document.querySelector(
          '[data-testid="active-player-indicator"]',
        );
        return el?.textContent?.includes(name);
      },
      playerName,
      { timeout: timeoutMs },
    );
  }

  async waitForPhase(phase: string, timeoutMs = 10_000): Promise<void> {
    await this.page.waitForFunction(
      (p) => {
        const el = document.querySelector('[data-testid="phase-indicator"]');
        return el?.textContent?.includes(p);
      },
      phase,
      { timeout: timeoutMs },
    );
  }

  // ── Screenshot helpers ───────────────────────────────────

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
