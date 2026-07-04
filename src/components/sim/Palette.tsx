import { Bot, Cog, ShieldCheck } from "lucide-react";
import type { LaneId } from "@/lib/pricing";

const PALETTE: { lane: LaneId; label: string; icon: typeof Cog; accent: string }[] = [
  { lane: "orchestrator", label: "Orchestrator", icon: Cog, accent: "border-indigo-500/50 hover:bg-indigo-500/10" },
  { lane: "worker", label: "Specialist Worker", icon: Bot, accent: "border-cyan-500/50 hover:bg-cyan-500/10" },
  { lane: "validator", label: "Validator", icon: ShieldCheck, accent: "border-emerald-500/50 hover:bg-emerald-500/10" },
];

export function Palette() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500 mr-1">Drag</span>
      {PALETTE.map((p) => {
        const Icon = p.icon;
        return (
          <div
            key={p.lane}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/agent-label", p.label);
              e.dataTransfer.effectAllowed = "move";
            }}
            className={`cursor-grab active:cursor-grabbing flex items-center gap-1.5 rounded-md border bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-200 transition ${p.accent}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {p.label}
          </div>
        );
      })}
    </div>
  );
}
