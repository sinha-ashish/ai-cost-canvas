import { storage, STORES } from "./adapter";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  type AppSettings,
  type UseCase,
} from "./types";

export async function listUseCases(): Promise<UseCase[]> {
  return storage.getAll<UseCase>(STORES.useCases);
}

export async function getUseCase(id: string): Promise<UseCase | undefined> {
  return storage.get<UseCase>(STORES.useCases, id);
}

export async function saveUseCase(uc: UseCase): Promise<UseCase> {
  await storage.set<UseCase>(STORES.useCases, uc.id, uc);
  return uc;
}

export async function deleteUseCase(id: string): Promise<void> {
  await storage.delete(STORES.useCases, id);
}

export async function getSettings(): Promise<AppSettings> {
  const existing = await storage.get<AppSettings>(STORES.settings, SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(existing ?? {}) };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await storage.set<AppSettings>(STORES.settings, SETTINGS_KEY, next);
  return next;
}
