/*
 * @Author: Oushuo Huang
 * @Date: 2025-02-05 10:59:59
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-27 01:49:02
 * @Description:
 */

import { useState } from "react";

import { ISettings } from "@/types/settings";

const SETTINGS_KEY = "enable-alien-settings";

export const useSettings = (onSubmit?: (settings: ISettings) => void) => {
	const [settings, setSettings] = useState<ISettings>(() => {
		if (typeof window !== "undefined") {
			const savedSettings = localStorage.getItem(SETTINGS_KEY);
			if (savedSettings) {
				return JSON.parse(savedSettings);
			}
		}
		return {
			enableAlien: false,
		};
	});

	const updateSettings = (update: Partial<ISettings>) => {
		setSettings((prev) => ({ ...prev, ...update }));
	};

	const handleSubmit = (_setting?: ISettings) => {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(_setting || settings));
		onSubmit?.(settings);
	};

	return { settings, setSettings, updateSettings, handleSubmit };
}