import { useState, useEffect, useCallback } from "react";
import { ChatSettings } from "@/types";

const DEFAULT_SETTINGS: ChatSettings = {
  model: "gpt-4o-mini",
  provider: "openai",
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  enableReasoning: true,
  showReasoning: true,
};

const SETTINGS_STORAGE_KEY = "chat-settings";

function loadSettings(): ChatSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn("Failed to load settings from localStorage:", error);
  }
  
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: ChatSettings): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Failed to save settings to localStorage:", error);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Save settings when they change
  const updateSettings = useCallback((newSettings: ChatSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  return {
    settings,
    updateSettings,
  };
}
