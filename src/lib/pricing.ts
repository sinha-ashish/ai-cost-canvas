export type ModelPricing = {
  id: string;
  provider: string;
  name: string;
  input: number; // $ per 1M tokens
  output: number;
  cached: number;
  reasoning?: number; // separate reasoning-token rate
  isReasoning?: boolean;
};

export const MODELS: ModelPricing[] = [
  { id: "gpt-5", provider: "OpenAI", name: "GPT-5", input: 1.25, output: 10.0, cached: 0.125 },
  { id: "o3", provider: "OpenAI", name: "o3", input: 2.0, output: 8.0, cached: 0.2, reasoning: 8.0, isReasoning: true },
  { id: "gpt-4.1-mini", provider: "OpenAI", name: "GPT-4.1 mini", input: 0.4, output: 1.6, cached: 0.1 },
  { id: "sonnet-5", provider: "Anthropic", name: "Claude Sonnet 5", input: 2.0, output: 10.0, cached: 0.2 },
  { id: "opus-4.6", provider: "Anthropic", name: "Claude Opus 4.6", input: 5.0, output: 25.0, cached: 0.5 },
  { id: "deepseek-r1", provider: "DeepSeek", name: "DeepSeek R1", input: 0.55, output: 2.19, cached: 0.14, reasoning: 2.19, isReasoning: true },
  { id: "gemini-2.5-pro", provider: "Google", name: "Gemini 2.5 Pro", input: 1.25, output: 10.0, cached: 0.125 },
];

export const MODEL_BY_ID = Object.fromEntries(MODELS.map((m) => [m.id, m])) as Record<string, ModelPricing>;

export type Effort = "low" | "medium" | "high";
export const EFFORT_MULTIPLIER: Record<Effort, number> = { low: 0.5, medium: 1.5, high: 4 };

export type LaneId = "orchestrator" | "worker" | "validator";

export const LANES: { id: LaneId; label: string; sub: string }[] = [
  { id: "orchestrator", label: "Orchestrators", sub: "Routing · Planning · Dispatch" },
  { id: "worker", label: "Specialist Workers", sub: "RAG · Coding · Retrieval" },
  { id: "validator", label: "Validators / Critics", sub: "Guardrails · Fact-check" },
];
