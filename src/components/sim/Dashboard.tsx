import { Fragment, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Skull, Users, Zap } from "lucide-react";
import { LANES, MODELS, type LaneId } from "@/lib/pricing";
import {
  computeNodeCost,
  laneCost,
  mauExpectedCost,
  totalRunCost,
  useSim,
} from "@/lib/simulator-store";

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

export function Dashboard() {
  const nodes = useSim((s) => s.nodes);
  const edges = useSim((s) => s.edges);
  const budgets = useSim((s) => s.budgets);
  const setBudget = useSim((s) => s.setBudget);
  const mau = useSim((s) => s.mau);
  const setMau = useSim((s) => s.setMau);
  const selectedId = useSim((s) => s.selectedNodeId);
  const updateNode = useSim((s) => s.updateNode);
  const poisoned = useSim((s) => s.poisoned);
  const triggerPoisoning = useSim((s) => s.triggerPoisoning);

  const perRun = totalRunCost(nodes, edges);
  const monthly = mauExpectedCost(perRun, mau);

  const chartData = useMemo(() => {
    const pts = [1, 100, 1000, 5000, 10000, 25000, 50000, 100000];
    return pts.map((u) => ({ users: u, cost: mauExpectedCost(perRun, u) }));
  }, [perRun]);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const selectedCost = selectedNode ? computeNodeCost(selectedNode, nodes, edges) : null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Cost / Run" value={fmt(perRun)} icon={<Zap className="h-3.5 w-3.5" />} />
        <Kpi
          label={`${mau.toLocaleString()} MAU / mo`}
          value={fmt(monthly)}
          icon={<Users className="h-3.5 w-3.5" />}
          accent
        />
      </div>

      {/* Poisoning */}
      <button
        onClick={triggerPoisoning}
        className={`group relative overflow-hidden rounded-lg border p-3 text-left transition ${
          poisoned
            ? "border-red-500 bg-red-950/50 animate-pulse"
            : "border-red-900/50 bg-red-950/20 hover:bg-red-950/40"
        }`}
      >
        <div className="flex items-center gap-2 text-red-400">
          <Skull className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {poisoned ? "Poisoning Active — Worst-Case Exposure" : "Simulate Prompt Poisoning"}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-red-200/80">
          Injects 128k-token adversarial context into orchestrator and forces a 10-turn worker↔validator loop.
        </div>
        {poisoned && (
          <div className="mt-2 font-mono text-lg text-red-300">
            {fmt(monthly)} / month per API key
          </div>
        )}
      </button>

      {/* MAU slider */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Monte Carlo MAU Scaler</span>
          <span className="font-mono text-zinc-200">{mau.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={1}
          max={100000}
          step={100}
          value={mau}
          onChange={(e) => setMau(Number(e.target.value))}
          className="mt-2 w-full accent-indigo-500"
        />
        <div className="mt-1 text-[10px] text-zinc-500">
          70% normal · 20% heavy (2×) · 10% whales (5×) — weighted 1.8× multiplier
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
        <div className="px-2 pt-1 text-xs text-zinc-400">Scaling to 100k MAU</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                dataKey="users"
                stroke="#71717a"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
              />
              <YAxis stroke="#71717a" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontSize: 12 }}
                formatter={(v: number) => fmt(v)}
                labelFormatter={(l) => `${l.toLocaleString()} MAU`}
              />
              <Area type="monotone" dataKey="cost" stroke="#818cf8" fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lane budgets */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <AlertTriangle className="h-3.5 w-3.5" /> Swimlane budget caps ($/run)
        </div>
        <div className="space-y-2">
          {LANES.map((l) => {
            const c = laneCost(l.id, nodes, edges);
            const cap = budgets[l.id];
            const over = cap > 0 && c > cap;
            return (
              <div key={l.id} className="flex items-center gap-2">
                <span className="w-24 text-[11px] text-zinc-400">{l.label}</span>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={cap || ""}
                  placeholder="unlimited"
                  onChange={(e) => setBudget(l.id as LaneId, Number(e.target.value))}
                  className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                />
                <span
                  className={`ml-auto font-mono text-[11px] ${over ? "text-red-400" : "text-zinc-400"}`}
                >
                  {fmt(c)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Node inspector */}
      {selectedNode && selectedCost ? (
        <div className="rounded-lg border border-indigo-500/40 bg-zinc-900/70 p-3">
          <div className="flex items-center justify-between">
            <input
              value={selectedNode.data.label}
              onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
              className="bg-transparent text-sm font-semibold text-zinc-100 focus:outline-none"
            />
            <span className="text-[10px] uppercase text-zinc-500">{selectedNode.data.lane}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <label className="flex flex-col gap-1">
              <span className="text-zinc-500">Model</span>
              <select
                value={selectedNode.data.modelId}
                onChange={(e) => updateNode(selectedNode.id, { modelId: e.target.value })}
                className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-zinc-200"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.provider} · {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-zinc-500">Reasoning effort</span>
              <select
                value={selectedNode.data.effort}
                onChange={(e) =>
                  updateNode(selectedNode.id, { effort: e.target.value as "low" | "medium" | "high" })
                }
                className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-zinc-200"
              >
                <option value="low">Low (0.5×)</option>
                <option value="medium">Medium (1.5×)</option>
                <option value="high">High (4×)</option>
              </select>
            </label>
            {(
              [
                ["systemTokens", "System prompt (tok)"],
                ["inputTokens", "User input (tok)"],
                ["outputTokens", "Output (tok)"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex flex-col gap-1">
                <span className="text-zinc-500">{label}</span>
                <input
                  type="number"
                  min={0}
                  value={selectedNode.data[k]}
                  onChange={(e) => updateNode(selectedNode.id, { [k]: Number(e.target.value) })}
                  className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-zinc-200"
                />
              </label>
            ))}
          </div>

          {/* Waterfall */}
          <div className="mt-3">
            <div className="mb-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
              Token Waterfall
            </div>
            <Waterfall
              rows={[
                { k: "Visible input", v: selectedCost.visibleInput, color: "bg-zinc-500" },
                { k: "Cached input (90% off)", v: selectedCost.cachedInput, color: "bg-cyan-500" },
                { k: "Visible output", v: selectedCost.output, color: "bg-indigo-500" },
                { k: "Invisible reasoning", v: selectedCost.reasoning, color: "bg-fuchsia-500" },
              ]}
              total={selectedCost.total}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
          Click a node on the canvas to inspect its token waterfall.
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent
          ? "border-indigo-500/40 bg-gradient-to-br from-indigo-950/60 to-zinc-900/40"
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-400">
        {icon} {label}
      </div>
      <div className="mt-1 font-mono text-lg text-zinc-100">{value}</div>
    </div>
  );
}

function Waterfall({
  rows,
  total,
}: {
  rows: { k: string; v: number; color: string }[];
  total: number;
}) {
  const max = Math.max(total, 1e-9);
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        if (r.v <= 0) return <Fragment key={r.k} />;
        const pct = (r.v / max) * 100;
        return (
          <div key={r.k}>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-zinc-400">{r.k}</span>
              <span className="font-mono text-zinc-200">{fmt(r.v)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800">
              <div className={`h-full rounded-full ${r.color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="mt-2 flex items-baseline justify-between border-t border-zinc-800 pt-2 text-xs">
        <span className="text-zinc-400">Total / run</span>
        <span className="font-mono text-sm text-zinc-100">{fmt(total)}</span>
      </div>
    </div>
  );
}
