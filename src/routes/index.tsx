import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@/components/sim/Canvas";
import { Dashboard } from "@/components/sim/Dashboard";
import { Palette } from "@/components/sim/Palette";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent Cost Simulator — B2B AI Sandbox" },
      {
        name: "description",
        content:
          "Model multi-turn agent loops, token consumption and mid-2026 AI pricing across orchestrators, workers and validators.",
      },
      { property: "og:title", content: "Agent Cost Simulator — B2B AI Sandbox" },
      {
        property: "og:description",
        content: "Interactive B2B AI cost sandbox for software architects.",
      },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="flex h-11 shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-950/70 px-4 backdrop-blur">
        <div>
          <div className="text-xs font-semibold tracking-tight text-zinc-200">
            Agent Cost Simulator
          </div>
          <div className="text-[10px] text-zinc-500">
            Mid-2026 pricing · Multi-turn loop modeling
          </div>
        </div>
        <div className="mx-2 h-6 w-px bg-zinc-800" />
        <Palette />
        <div className="ml-auto flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Orchestrator
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" /> Worker
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Validator
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative min-h-0 w-[65%] border-r border-zinc-800">
          <Canvas />
        </main>
        <aside className="min-h-0 w-[35%] bg-zinc-950">
          <Dashboard />
        </aside>
      </div>
    </div>
  );
}
