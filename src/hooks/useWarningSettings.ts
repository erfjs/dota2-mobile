import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_WARN_SECONDS,
  WarnId,
  clampWarn,
} from "../utils/objectives";
import { loadJson, saveJson } from "../utils/storage";

const STORAGE_KEY = "dota-companion-timer-warnings";

export function useWarningSettings() {
  const [warnSeconds, setWarnSeconds] = useState<Record<WarnId, number>>(DEFAULT_WARN_SECONDS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadJson<Partial<Record<WarnId, number>>>(STORAGE_KEY, {}).then((stored) => {
      if (cancelled) return;
      setWarnSeconds({ ...DEFAULT_WARN_SECONDS, ...stored });
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void saveJson(STORAGE_KEY, warnSeconds);
  }, [loaded, warnSeconds]);

  const setWarn = useCallback((id: WarnId, value: number) => {
    setWarnSeconds((prev) => ({ ...prev, [id]: clampWarn(value) }));
  }, []);

  const resetWarn = useCallback(() => {
    setWarnSeconds({ ...DEFAULT_WARN_SECONDS });
  }, []);

  return { warnSeconds, setWarn, resetWarn };
}
