import { useCallback, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { AgentNode } from "./AgentNode";
import { LANES, laneCost, useSim } from "@/lib/simulator-store";
import type { LaneId } from "@/lib/pricing";

const LANE_HEIGHT = 260;
const nodeTypes = { agent: AgentNode };

function laneForY(y: number): LaneId {
  const idx = Math.max(0, Math.min(2, Math.floor(y / LANE_HEIGHT)));
  return LANES[idx].id;
}

function LaneOverlay() {
  const nodes = useSim((s) => s.nodes);
  const edges = useSim((s) => s.edges);
  const budgets = useSim((s) => s.budgets);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {LANES.map((lane, i) => {
        const cost = laneCost(lane.id, nodes, edges);
        const cap = budgets[lane.id];
        const over = cap > 0 && cost > cap;
        const bg =
          lane.id === "orchestrator"
            ? "from-indigo-950/40"
            : lane.id === "worker"
              ? "from-cyan-950/30"
              : "from-emerald-950/30";
        return (
          <div
            key={lane.id}
            style={{ top: i * LANE_HEIGHT, height: LANE_HEIGHT }}
            className={`absolute inset-x-0 border-b border-white/5 bg-gradient-to-r ${bg} to-transparent ${
              over ? "animate-pulse !bg-red-950/40" : ""
            }`}
          >
            <div className="absolute left-4 top-3 flex items-center gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-zinc-300">
                  {lane.label}
                </div>
                <div className="text-[10px] text-zinc-500">{lane.sub}</div>
              </div>
            </div>
            <div className="absolute right-4 top-3 text-right">
              <div className="font-mono text-sm text-zinc-200">${cost.toFixed(4)}</div>
              {cap > 0 && (
                <div className={`text-[10px] ${over ? "text-red-400" : "text-zinc-500"}`}>
                  cap ${cap.toFixed(2)} {over ? "· EXCEEDED" : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CanvasInner() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const nodes = useSim((s) => s.nodes);
  const edges = useSim((s) => s.edges);
  const budgets = useSim((s) => s.budgets);
  const onNodesChange = useSim((s) => s.onNodesChange);
  const onEdgesChange = useSim((s) => s.onEdgesChange);
  const onConnect = useSim((s) => s.onConnect);
  const addNode = useSim((s) => s.addNode);
  const select = useSim((s) => s.select);

  const styledEdges: Edge[] = useMemo(() => {
    return edges.map((e) => {
      const tgt = nodes.find((n) => n.id === e.target);
      const laneId = tgt?.data.lane;
      const cost = laneId ? laneCost(laneId, nodes, edges) : 0;
      const cap = laneId ? budgets[laneId] : 0;
      const over = cap > 0 && cost > cap;
      return {
        ...e,
        animated: true,
        style: {
          stroke: over ? "#dc2626" : "#71717a",
          strokeWidth: 1.5,
          strokeDasharray: "6 4",
        },
      };
    });
  }, [edges, nodes, budgets]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const label = e.dataTransfer.getData("application/agent-label");
      if (!label) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const lane = laneForY(pos.y);
      addNode({ label, lane }, pos);
    },
    [addNode, screenToFlowPosition],
  );

  return (
    <div ref={wrapperRef} className="relative h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <LaneOverlay />
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => select(n.id)}
        onPaneClick={() => select(null)}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ animated: true }}
        className="!bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#3f3f46" />
        <Controls className="!bg-zinc-900 !border-zinc-800 [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-300" />
        <MiniMap
          className="!bg-zinc-900 !border !border-zinc-800"
          nodeColor={(n) => {
            const l = (n.data as { lane: LaneId } | undefined)?.lane;
            return l === "orchestrator" ? "#6366f1" : l === "worker" ? "#06b6d4" : "#10b981";
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
