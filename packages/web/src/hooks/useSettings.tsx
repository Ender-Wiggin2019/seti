/*
 * @Author: Oushuo Huang
 * @Date: 2025-02-05 10:59:59
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-29 01:49:02
 * @Description:
 */

import { useEffect, useState } from 'react';

import { ISettings } from '@/types/settings';

const SETTINGS_KEY = 'enable-alien-settings';

const DEFAULT_SETTINGS: ISettings = {
  enableAlien: false,
};

export const useSettings = (onSubmit?: (settings: ISettings) => void) => {
  // 始终使用默认值初始化，避免 SSR 和客户端不一致
  const [settings, setSettings] = useState<ISettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  // 在客户端挂载后从 localStorage 读取真实值
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
        } catch {
          // 如果解析失败，使用默认值
          setSettings(DEFAULT_SETTINGS);
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // 当 settings 更新时，同步到 localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, isHydrated]);

  const updateSettings = (update: Partial<ISettings>) => {
    setSettings((prev) => ({ ...prev, ...update }));
  };

  const handleSubmit = (_setting?: ISettings) => {
    const targetSettings = _setting || settings;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(targetSettings));
    }
    onSubmit?.(targetSettings);
  };

  return {
    settings,
    setSettings: updateSettings,
    updateSettings,
    handleSubmit,
    isHydrated,
  };
};
