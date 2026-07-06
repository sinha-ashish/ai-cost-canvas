import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useLedgerData } from "@/components/ledger/useLedgerData";
import { KpiRow } from "@/components/ledger/KpiRow";
import { CompositionStrip } from "@/components/ledger/CompositionStrip";
import { LedgerTable } from "@/components/ledger/LedgerTable";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "RoAI Ledger — AI Cost Canvas" },
      {
        name: "description",
        content:
          "Portfolio view of AI feature use cases: monthly spend, hours saved, blended RoAI, at-risk exposure.",
      },
    ],
  }),
  component: LedgerPage,
});

function LedgerPage() {
  const ledger = useLedgerData();

  return (
    <div className="h-full w-full overflow-y-auto bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
              <BookOpen className="h-3 w-3" /> Portfolio
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-100">
              RoAI Ledger
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Monthly cost, value and health across every tracked AI use case.
            </p>
          </div>
        </header>

        <section className="mb-4">
          <KpiRow
            computed={ledger.computed}
            settings={ledger.settings}
            onUpdateSettings={ledger.updateSettings}
          />
        </section>

        <section className="mb-4">
          <CompositionStrip computed={ledger.computed} />
        </section>

        {ledger.useCases.length === 0 && !ledger.loading && (
          <div className="mb-4 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-4 text-center text-xs text-zinc-500">
            No use cases yet. Save a configuration from the Sandbox, or add a use case manually — coming below.
          </div>
        )}

        <section className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center text-xs text-zinc-500">
          Ledger table — next pass
        </section>
      </div>
    </div>
  );
}
