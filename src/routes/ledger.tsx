import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "RoAI Ledger — AI Cost Canvas" },
      {
        name: "description",
        content: "Track saved AI feature use-cases and RoAI outcomes.",
      },
    ],
  }),
  component: LedgerPage,
});

function LedgerPage() {
  return (
    <div className="dark flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          Module
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          RoAI Ledger
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Coming in Stage 4.</p>
      </div>
    </div>
  );
}
