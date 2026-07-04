import { create } from "zustand";
import type { Edge, Node } from "reactflow";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "reactflow";
import type { EdgeChange, NodeChange, Connection } from "reactflow";
import { EFFORT_MULTIPLIER, LANES, MODEL_BY_ID, type Effort, type LaneId } from "./pricing";

export type AgentNodeData = {
  label: string;
  lane: LaneId;
  modelId: string;
  systemTokens: number;
  inputTokens: number;
  outputTokens: number;
  effort: Effort;
};

export type NodeCost = {
  visibleInput: number;
  cachedInput: number;
  output: number;
  reasoning: number;
  total: number;
  cachedShare: number;
};

type BudgetMap = Record<LaneId, number>;

type SimState = {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  budgets: BudgetMap;
  mau: number;
  poisoned: boolean;
  setNodes: (updater: (n: Node<AgentNodeData>[]) => Node<AgentNodeData>[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (c: Connection) => void;
  addNode: (data: Partial<AgentNodeData> & { lane: LaneId }, position: { x: number; y: number }) => void;
  updateNode: (id: string, patch: Partial<AgentNodeData>) => void;
  removeNode: (id: string) => void;
  select: (id: string | null) => void;
  setBudget: (lane: LaneId, val: number) => void;
  setMau: (val: number) => void;
  triggerPoisoning: () => void;
  reset: () => void;
};

let idc = 1;
const uid = () => `n_${idc++}`;

const defaultData = (lane: LaneId): AgentNodeData => ({
  label:
    lane === "orchestrator" ? "Orchestrator" : lane === "worker" ? "Worker" : "Validator",
  lane,
  modelId: lane === "orchestrator" ? "gpt-5" : lane === "worker" ? "gpt-4.1-mini" : "sonnet-5",
  systemTokens: 800,
  inputTokens: 1200,
  outputTokens: 400,
  effort: "medium",
});

const initialNodes: Node<AgentNodeData>[] = [
  { id: uid(), type: "agent", position: { x: 60, y: 60 }, data: { ...defaultData("orchestrator"), label: "Router" } },
  { id: uid(), type: "agent", position: { x: 40, y: 60 }, data: { ...defaultData("worker"), label: "RAG Retriever" } },
  { id: uid(), type: "agent", position: { x: 320, y: 60 }, data: { ...defaultData("worker"), label: "Code Synthesizer" } },
  { id: uid(), type: "agent", position: { x: 180, y: 60 }, data: { ...defaultData("validator"), label: "Guardrail" } },
];

export const useSim = create<SimState>((set, get) => ({
  nodes: initialNodes,
  edges: [
    { id: "e1", source: initialNodes[0].id, target: initialNodes[1].id, animated: true },
    { id: "e2", source: initialNodes[0].id, target: initialNodes[2].id, animated: true },
    { id: "e3", source: initialNodes[1].id, target: initialNodes[3].id, animated: true },
    { id: "e4", source: initialNodes[2].id, target: initialNodes[3].id, animated: true },
  ],
  selectedNodeId: initialNodes[0].id,
  budgets: { orchestrator: 0, worker: 0, validator: 0 },
  mau: 10000,
  poisoned: false,
  setNodes: (updater) => set((s) => ({ nodes: updater(s.nodes) })),
  onNodesChange: (changes) => set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as Node<AgentNodeData>[] })),
  onEdgesChange: (changes) => set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),
  onConnect: (c) => set((s) => ({ edges: addEdge({ ...c, animated: true }, s.edges) })),
  addNode: (data, position) =>
    set((s) => {
      const id = uid();
      const merged = { ...defaultData(data.lane), ...data };
      return {
        nodes: [...s.nodes, { id, type: "agent", position, data: merged }],
        selectedNodeId: id,
      };
    }),
  updateNode: (id, patch) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    })),
  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    })),
  select: (id) => set({ selectedNodeId: id }),
  setBudget: (lane, val) => set((s) => ({ budgets: { ...s.budgets, [lane]: val } })),
  setMau: (val) => set({ mau: val }),
  triggerPoisoning: () =>
    set((s) => {
      const poisoned = !s.poisoned;
      if (!poisoned) return { poisoned: false };
      const nodes = s.nodes.map((n) => {
        if (n.data.lane === "orchestrator") {
          return { ...n, data: { ...n.data, inputTokens: 128000, systemTokens: 4000, outputTokens: 2000, effort: "high" as Effort } };
        }
        // 10-turn loop between workers/validators — apply 10x multiplier
        return { ...n, data: { ...n.data, inputTokens: n.data.inputTokens * 10, outputTokens: n.data.outputTokens * 10 } };
      });
      return { poisoned: true, nodes };
    }),
  reset: () => set({ poisoned: false }),
}));

// --- cost math ---

export function computeNodeCost(node: Node<AgentNodeData>, allNodes: Node<AgentNodeData>[], edges: Edge[]): NodeCost {
  const model = MODEL_BY_ID[node.data.modelId];
  const totalInput = node.data.systemTokens + node.data.inputTokens;

  // Parallel caching: if this node shares a parent with another same-model sibling,
  // apply 90% discount to input.
  const parents = edges.filter((e) => e.target === node.id).map((e) => e.source);
  let cachedShare = 0;
  for (const p of parents) {
    const siblings = edges
      .filter((e) => e.source === p && e.target !== node.id)
      .map((e) => allNodes.find((n) => n.id === e.target))
      .filter((n): n is Node<AgentNodeData> => !!n);
    if (siblings.some((s) => s.data.modelId === node.data.modelId)) {
      cachedShare = 0.9;
      break;
    }
  }

  const cachedTokens = totalInput * cachedShare;
  const visibleTokens = totalInput - cachedTokens;

  const visibleInput = (visibleTokens / 1_000_000) * model.input;
  const cachedInput = (cachedTokens / 1_000_000) * model.cached;
  const output = (node.data.outputTokens / 1_000_000) * model.output;

  let reasoning = 0;
  if (model.isReasoning) {
    const reasoningTokens = node.data.outputTokens * EFFORT_MULTIPLIER[node.data.effort];
    reasoning = (reasoningTokens / 1_000_000) * (model.reasoning ?? model.output);
  }

  const total = visibleInput + cachedInput + output + reasoning;
  return { visibleInput, cachedInput, output, reasoning, total, cachedShare };
}

export function laneCost(lane: LaneId, nodes: Node<AgentNodeData>[], edges: Edge[]) {
  return nodes
    .filter((n) => n.data.lane === lane)
    .reduce((acc, n) => acc + computeNodeCost(n, nodes, edges).total, 0);
}

export function totalRunCost(nodes: Node<AgentNodeData>[], edges: Edge[]) {
  return nodes.reduce((acc, n) => acc + computeNodeCost(n, nodes, edges).total, 0);
}

export function mauExpectedCost(perRun: number, users: number) {
  // 70% normal (1x), 20% heavy (2x), 10% whales (5x) → weighted 1.8x
  const weighted = 0.7 * 1 + 0.2 * 2 + 0.1 * 5;
  return perRun * users * weighted;
}

export { LANES };
