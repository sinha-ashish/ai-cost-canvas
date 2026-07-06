import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSettings,
  listUseCases,
  saveSettings,
  saveUseCase,
} from "@/lib/storage/usecases";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type UseCase,
} from "@/lib/storage/types";

export const HOURS_PER_FTE = 160;

export type UseCaseStatus = UseCase["status"];

export const STATUS_ORDER: UseCaseStatus[] = [
  "idea",
  "structured",
  "poc",
  "pilot",
  "production",
];

export const STATUS_LABEL: Record<UseCaseStatus, string> = {
  idea: "Idea",
  structured: "Structured",
  poc: "POC",
  pilot: "Pilot",
  production: "Production",
};

// Muted, zinc-tinted (NOT traffic-light) palette for the composition strip.
export const STATUS_COLOR: Record<UseCaseStatus, string> = {
  idea: "#3f3f46",
  structured: "#52525b",
  poc: "#64748b",
  pilot: "#6b7280",
  production: "#94a3b8",
};

export interface ComputedUseCase {
  useCase: UseCase;
  hoursSaved: number;
  value: number;
  roai: number;
}

export interface LedgerData {
  loading: boolean;
  useCases: UseCase[];
  computed: ComputedUseCase[];
  settings: AppSettings;
  refresh: () => Promise<void>;
  updateUseCase: (uc: UseCase) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

export function useLedgerData(): LedgerData {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    const [ucs, s] = await Promise.all([listUseCases(), getSettings()]);
    setUseCases(ucs);
    setSettings(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateUseCase = useCallback(async (uc: UseCase) => {
    await saveUseCase(uc);
    setUseCases((prev) => {
      const idx = prev.findIndex((p) => p.id === uc.id);
      if (idx === -1) return [...prev, uc];
      const next = prev.slice();
      next[idx] = uc;
      return next;
    });
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await saveSettings(patch);
    setSettings(next);
  }, []);

  const computed = useMemo<ComputedUseCase[]>(() => {
    return useCases.map((uc) => {
      const hoursSaved = uc.totalUsers * uc.expectedTimeSavingPerUserPerMonth;
      const value = hoursSaved * settings.blendedHourlyRate;
      const roai = uc.expectedMonthlyCost > 0 ? value / uc.expectedMonthlyCost : 0;
      return { useCase: uc, hoursSaved, value, roai };
    });
  }, [useCases, settings.blendedHourlyRate]);

  return {
    loading,
    useCases,
    computed,
    settings,
    refresh,
    updateUseCase,
    updateSettings,
  };
}

export function roaiHealth(
  roai: number,
  target: number,
): "green" | "amber" | "red" | "neutral" {
  if (!isFinite(roai) || roai <= 0) return "neutral";
  if (roai >= target) return "green";
  if (roai >= target * 0.6) return "amber";
  return "red";
}
