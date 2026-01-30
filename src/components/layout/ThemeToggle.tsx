/*
 * @Author: Ender-Wiggin
 * @Date: 2025-01-30
 * @Description: Theme toggle button for switching between accent color themes
 */
import { Hexagon, Snowflake } from 'lucide-react';
import React from 'react';

import { useTheme } from '@/components/layout/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className='group relative flex h-9 w-9 items-center justify-center rounded-lg bg-space-800/60 ring-1 ring-space-700/30 backdrop-blur-sm transition-all duration-300 hover:ring-primary/50 hover:bg-space-800/80'
      title={`Switch to ${theme === 'silver' ? 'Ice' : 'Silver'} accent`}
      aria-label={`Current accent: ${theme === 'silver' ? 'Silver' : 'Ice'}. Click to switch.`}
    >
      {theme === 'silver' ? (
        <Hexagon className='h-4 w-4 text-silver-300 transition-transform duration-300 group-hover:scale-110' />
      ) : (
        <Snowflake className='h-4 w-4 text-ice-300 transition-transform duration-300 group-hover:scale-110' />
      )}

      {/* Subtle glow effect */}
      <span
        className={`absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
          theme === 'silver'
            ? 'shadow-[0_0_12px_rgba(156,163,175,0.3)]'
            : 'shadow-[0_0_12px_rgba(103,232,249,0.3)]'
        }`}
      />
    </button>
  );
}

// Expanded toggle with labels for settings/preference pages
export function ThemeToggleExpanded() {
  const { theme, setTheme } = useTheme();

  return (
    <div className='flex items-center gap-2 rounded-xl bg-space-900/60 p-1 ring-1 ring-space-700/30'>
      <button
        onClick={() => setTheme('silver')}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
          theme === 'silver'
            ? 'bg-silver-500/10 text-silver-300 ring-1 ring-silver-500/30'
            : 'text-space-400 hover:text-space-200'
        }`}
      >
        <Hexagon className='h-4 w-4' />
        <span>Silver</span>
      </button>
      <button
        onClick={() => setTheme('ice')}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
          theme === 'ice'
            ? 'bg-ice-500/10 text-ice-300 ring-1 ring-ice-500/30'
            : 'text-space-400 hover:text-space-200'
        }`}
      >
        <Snowflake className='h-4 w-4' />
        <span>Ice</span>
      </button>
    </div>
  );
}
