import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadJson, saveJson } from "../utils/storage";

const STORAGE_KEY = "dota-companion-app-settings";

export const VOLUME_MIN = 0.1;
export const VOLUME_MAX = 1;
export const VOLUME_STEP = 0.1;

export interface AppSettings {
  muted: boolean;
  volume: number;
  vibration: boolean;
  soundOnWarn: boolean;
  soundOnSpawn: boolean;
  keepAwake: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  muted: false,
  volume: 0.8,
  vibration: true,
  soundOnWarn: true,
  soundOnSpawn: true,
  keepAwake: true,
};

interface AppSettingsContextValue {
  settings: AppSettings;
  toggleMuted: () => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setVibration: (vibration: boolean) => void;
  setSoundOnWarn: (soundOnWarn: boolean) => void;
  setSoundOnSpawn: (soundOnSpawn: boolean) => void;
  setKeepAwake: (keepAwake: boolean) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.volume;
  const stepped = Math.round(value / VOLUME_STEP) * VOLUME_STEP;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Number(stepped.toFixed(1))));
}

function normalize(raw: Partial<AppSettings> | null): AppSettings {
  return {
    muted: Boolean(raw?.muted),
    volume: clampVolume(raw?.volume ?? DEFAULT_SETTINGS.volume),
    vibration: raw?.vibration !== false,
    soundOnWarn: raw?.soundOnWarn !== false,
    soundOnSpawn: raw?.soundOnSpawn !== false,
    keepAwake: raw?.keepAwake !== false,
  };
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadJson<Partial<AppSettings>>(STORAGE_KEY, {}).then((stored) => {
      if (cancelled) return;
      setSettings(normalize(stored));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void saveJson(STORAGE_KEY, settings);
  }, [loaded, settings]);

  const patch = useCallback((update: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...update }));
  }, []);

  const toggleMuted = useCallback(() => {
    setSettings((prev) => ({ ...prev, muted: !prev.muted }));
  }, []);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      toggleMuted,
      setMuted: (muted) => patch({ muted }),
      setVolume: (volume) => patch({ volume: clampVolume(volume), muted: false }),
      setVibration: (vibration) => patch({ vibration }),
      setSoundOnWarn: (soundOnWarn) => patch({ soundOnWarn }),
      setSoundOnSpawn: (soundOnSpawn) => patch({ soundOnSpawn }),
      setKeepAwake: (keepAwake) => patch({ keepAwake }),
    }),
    [patch, settings, toggleMuted],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }
  return ctx;
}
