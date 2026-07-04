import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Bot, Cog, ShieldCheck, Trash2 } from "lucide-react";
import { MODEL_BY_ID } from "@/lib/pricing";
import { computeNodeCost, useSim, type AgentNodeData } from "@/lib/simulator-store";

const laneIcon = {
  orchestrator: Cog,
  worker: Bot,
  validator: ShieldCheck,
};

const laneAccent = {
  orchestrator: "border-indigo-500/60 shadow-indigo-500/20",
  worker: "border-cyan-500/60 shadow-cyan-500/20",
  validator: "border-emerald-500/60 shadow-emerald-500/20",
};

function AgentNodeInner({ id, data, selected }: NodeProps<AgentNodeData>) {
  const model = MODEL_BY_ID[data.modelId];
  const nodes = useSim((s) => s.nodes);
  const edges = useSim((s) => s.edges);
  const remove = useSim((s) => s.removeNode);
  const node = nodes.find((n) => n.id === id);
  const cost = node ? computeNodeCost(node, nodes, edges) : null;
  const Icon = laneIcon[data.lane];

  return (
    <div
      className={`group relative w-[220px] rounded-xl border bg-zinc-900/90 backdrop-blur px-3 py-2.5 shadow-lg transition ${
        laneAccent[data.lane]
      } ${selected ? "ring-2 ring-white/40" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-300" />
        <div className="text-sm font-semibold text-zinc-100 truncate">{data.label}</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            remove(id);
          }}
          className="ml-auto opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
        {model.provider} · {model.name}
      </div>
      {cost && (
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-[10px] text-zinc-500">per run</span>
          <span className="font-mono text-sm text-zinc-100">
            ${cost.total < 0.001 ? cost.total.toFixed(6) : cost.total.toFixed(4)}
          </span>
        </div>
      )}
      {cost && cost.cachedShare > 0 && (
        <div className="mt-1 text-[10px] text-cyan-400">↳ 90% cache hit</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-500 !w-2 !h-2" />
    </div>
  );
}

export const AgentNode = memo(AgentNodeInner);
