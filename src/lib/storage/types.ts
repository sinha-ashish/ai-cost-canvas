export interface UseCase {
  id: string;
  name: string;
  businessFunction: string;
  owner: string;
  application: string;
  status: "idea" | "structured" | "poc" | "pilot" | "production";
  category: "gen" | "agent" | "automation" | "hybrid";
  usagePattern: "user-driven" | "system-driven";
  totalUsers: number;
  expectedTimeSavingPerUserPerMonth: number; // hours
  expectedMonthlyCost: number; // dollars
  peakUsagePeriod: string;
  fallbackSolution: string;
  confidence: "low" | "medium" | "high";
  sourceModule: "sandbox" | "manual";
  sandboxSnapshot?: {
    nodes: unknown[];
    edges: unknown[];
    perRunCost: number;
    mauAtSnapshot: number;
  };
  decisionLog: Array<{
    decision: "scale" | "continue" | "refine" | "pause" | "stop";
    timestamp: string;
    note?: string;
  }>;
  history: Array<{ month: string; roaiRatio: number }>;
}

export interface AppSettings {
  blendedHourlyRate: number;
  roaiTarget: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  blendedHourlyRate: 60,
  roaiTarget: 3,
};

export const SETTINGS_KEY = "app";
