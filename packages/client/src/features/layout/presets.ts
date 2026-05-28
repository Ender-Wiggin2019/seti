import type { GridConfig, LayoutConfig } from './types';

export const DEFAULT_TAB_GRID: GridConfig = {
  columns: {
    left: { width: '0px', visible: false },
    middle: { width: '1fr' },
    right: { width: '420px' },
  },
  gap: '12px',
};

const SHARED_TABS = [
  {
    id: 'board',
    labelKey: 'client.game_layout.tabs.board',
    grid: DEFAULT_TAB_GRID,
  },
  {
    id: 'planets',
    labelKey: 'client.game_layout.tabs.planets',
    grid: DEFAULT_TAB_GRID,
  },
  {
    id: 'tech',
    labelKey: 'client.game_layout.tabs.tech',
    grid: DEFAULT_TAB_GRID,
  },
  {
    id: 'cards',
    labelKey: 'client.game_layout.tabs.cards',
    grid: DEFAULT_TAB_GRID,
  },
  {
    id: 'aliens',
    labelKey: 'client.game_layout.tabs.aliens',
    grid: DEFAULT_TAB_GRID,
  },
  {
    id: 'scoring',
    labelKey: 'client.game_layout.tabs.scoring',
    grid: DEFAULT_TAB_GRID,
  },
];

export const tabPreset: LayoutConfig = {
  mode: 'tab',
  rootGrid: {
    columns: {
      left: { width: '0px', visible: false },
      middle: { width: '1fr' },
      right: { width: '440px' },
    },
    gap: '12px',
  },
  tabs: SHARED_TABS,
  defaultTab: 'board',
  sections: [
    // chrome
    { id: 'topBar', pin: 'sticky-top', size: { height: '48px' }, zIndex: 40 },
    {
      id: 'actionBar',
      pin: 'sticky-top',
      pinOffset: { top: '48px' },
      zIndex: 39,
    },
    {
      id: 'hand',
      pin: 'fixed-bottom',
      size: { height: '120px' },
      zIndex: 38,
    },
    // section bodies — all live in their dedicated tab's middle column
    {
      id: 'solarSystem',
      tab: { container: 'board', slot: 'middle', order: 1 },
    },
    {
      id: 'planetBoard',
      tab: { container: 'planets', slot: 'middle', order: 1 },
    },
    {
      id: 'techBoard',
      tab: { container: 'tech', slot: 'middle', order: 1 },
    },
    {
      id: 'alienBoard',
      tab: { container: 'aliens', slot: 'middle', order: 1 },
    },
    {
      id: 'cardRows',
      tab: { container: 'cards', slot: 'middle', order: 1 },
    },
    {
      id: 'endGame',
      tab: { container: 'scoring', slot: 'middle', order: 1 },
      collapsible: true,
    },
    // PlayerBoard floats in board tab's right column to mirror the legacy
    // PersonalColumn placement; users can move it via the dev panel.
    {
      id: 'playerBoard',
      tab: { container: 'board', slot: 'right', order: 1 },
    },
    {
      id: 'log',
      tab: { container: 'board', slot: 'right', order: 2 },
      size: { grow: 1, minH: '180px' },
    },
  ],
  options: {
    showTopBar: true,
    showActionBar: true,
    showHandDock: true,
    mobileBreakpoint: 1024,
  },
};

export const waterfallPreset: LayoutConfig = {
  mode: 'waterfall',
  rootGrid: {
    columns: {
      left: { width: '380px' },
      middle: { width: '1fr' },
      right: { width: '420px' },
    },
    gap: '12px',
  },
  tabs: SHARED_TABS,
  defaultTab: 'board',
  sections: [
    // chrome
    { id: 'topBar', pin: 'sticky-top', size: { height: '48px' }, zIndex: 40 },
    {
      id: 'actionBar',
      pin: 'sticky-top',
      pinOffset: { top: '48px' },
      zIndex: 39,
    },
    {
      id: 'hand',
      pin: 'fixed-bottom',
      size: { height: '120px' },
      zIndex: 38,
    },
    // left column
    {
      id: 'solarSystem',
      waterfall: { slot: 'left', order: 1 },
      mobileOrder: 1,
      size: { minH: '320px' },
    },
    {
      id: 'planetBoard',
      waterfall: { slot: 'left', order: 2 },
      mobileOrder: 2,
      size: { minH: '280px' },
    },
    {
      id: 'endGame',
      waterfall: { slot: 'left', order: 3 },
      mobileOrder: 8,
      collapsible: true,
    },
    // middle column
    {
      id: 'techBoard',
      waterfall: { slot: 'middle', order: 1 },
      mobileOrder: 3,
    },
    {
      id: 'alienBoard',
      waterfall: { slot: 'middle', order: 2 },
      mobileOrder: 4,
    },
    {
      id: 'cardRows',
      waterfall: { slot: 'middle', order: 3 },
      mobileOrder: 5,
    },
    // right column
    {
      id: 'playerBoard',
      waterfall: { slot: 'right', order: 1 },
      mobileOrder: 6,
    },
    {
      id: 'log',
      waterfall: { slot: 'right', order: 2 },
      mobileOrder: 7,
      size: { grow: 1, minH: '240px' },
    },
  ],
  options: {
    showTopBar: true,
    showActionBar: true,
    showHandDock: true,
    mobileBreakpoint: 1024,
  },
};

export function getPreset(mode: 'tab' | 'waterfall'): LayoutConfig {
  return mode === 'tab' ? tabPreset : waterfallPreset;
}
