// TEMPORARY dev harness for Stage 1 persistence layer.
// Safe to delete once the real Sandbox<->Ledger integration ships.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  deleteUseCase,
  getSettings,
  listUseCases,
  saveSettings,
  saveUseCase,
} from "@/lib/storage/usecases";
import type { UseCase, AppSettings } from "@/lib/storage/types";

export const Route = createFileRoute("/persist-test")({
  component: PersistTest,
});

function makeDummy(): UseCase {
  const id = crypto.randomUUID();
  return {
    id,
    name: `Test Use Case ${new Date().toLocaleTimeString()}`,
    businessFunction: "Engineering",
    owner: "test@example.com",
    application: "Internal Tool",
    status: "idea",
    category: "agent",
    usagePattern: "user-driven",
    totalUsers: 100,
    expectedTimeSavingPerUserPerMonth: 4,
    expectedMonthlyCost: 250,
    peakUsagePeriod: "Weekdays 9-5",
    fallbackSolution: "Manual process",
    confidence: "medium",
    sourceModule: "manual",
    decisionLog: [],
    history: [],
  };
}

function PersistTest() {
  const [items, setItems] = useState<UseCase[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [list, s] = await Promise.all([listUseCases(), getSettings()]);
    setItems(list);
    setSettings(s);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Persistence Test Harness</h1>
          <p className="text-sm text-muted-foreground">
            Temporary. Add a dummy use case, refresh the page, verify it persists.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            onClick={async () => {
              await saveUseCase(makeDummy());
              await refresh();
            }}
          >
            + Add dummy use case
          </button>
          <button
            className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
            onClick={async () => {
              for (const uc of items) await deleteUseCase(uc.id);
              await refresh();
            }}
          >
            Clear all
          </button>
          <button
            className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
            onClick={() => void refresh()}
          >
            Reload
          </button>
          <button
            className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
            onClick={async () => {
              await saveSettings({ blendedHourlyRate: Math.round(50 + Math.random() * 100) });
              await refresh();
            }}
          >
            Randomize hourly rate
          </button>
        </div>

        <section className="rounded-md border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Settings</h2>
          <pre className="mt-2 text-xs">{JSON.stringify(settings, null, 2)}</pre>
        </section>

        <section className="rounded-md border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Use cases ({items.length})
          </h2>
          {loading ? (
            <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">None stored yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {items.map((uc) => (
                <li
                  key={uc.id}
                  className="flex items-center justify-between rounded border border-border/60 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{uc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {uc.id} · {uc.status} · {uc.category}
                    </div>
                  </div>
                  <button
                    className="rounded border border-input px-2 py-1 text-xs hover:bg-accent"
                    onClick={async () => {
                      await deleteUseCase(uc.id);
                      await refresh();
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
