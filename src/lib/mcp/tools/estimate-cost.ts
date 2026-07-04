import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { EFFORT_MULTIPLIER, MODEL_BY_ID, MODELS, type Effort } from "../../pricing";

export default defineTool({
  name: "estimate_cost",
  title: "Estimate agent-call cost",
  description:
    "Estimate the per-run cost of a single agent call using mid-2026 pricing. Supports cached input, reasoning effort, and MAU scaling with the weighted Monte Carlo distribution (70% normal · 20% heavy 2× · 10% whale 5×).",
  inputSchema: {
    modelId: z.enum(MODELS.map((m) => m.id) as [string, ...string[]]).describe("Model id from list_models"),
    systemTokens: z.number().int().min(0).default(0),
    inputTokens: z.number().int().min(0),
    outputTokens: z.number().int().min(0),
    cachedShare: z.number().min(0).max(1).default(0).describe("Share of input tokens served from prompt cache (0-1)"),
    effort: z.enum(["low", "medium", "high"]).default("medium"),
    mau: z.number().int().min(1).max(1_000_000).default(1),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ modelId, systemTokens, inputTokens, outputTokens, cachedShare, effort, mau }) => {
    const model = MODEL_BY_ID[modelId];
    if (!model) {
      return { content: [{ type: "text", text: `Unknown modelId: ${modelId}` }], isError: true };
    }
    const totalInput = systemTokens + inputTokens;
    const cachedTokens = totalInput * cachedShare;
    const visibleTokens = totalInput - cachedTokens;
    const visibleInput = (visibleTokens / 1_000_000) * model.input;
    const cachedInput = (cachedTokens / 1_000_000) * model.cached;
    const output = (outputTokens / 1_000_000) * model.output;
    const reasoning = model.isReasoning
      ? (outputTokens * EFFORT_MULTIPLIER[effort as Effort] / 1_000_000) * (model.reasoning ?? model.output)
      : 0;
    const perRun = visibleInput + cachedInput + output + reasoning;
    const weighted = 0.7 * 1 + 0.2 * 2 + 0.1 * 5; // 1.8
    const monthly = perRun * mau * weighted;
    const result = {
      model: `${model.provider} · ${model.name}`,
      breakdown: { visibleInput, cachedInput, output, reasoning },
      perRunUSD: perRun,
      mau,
      weightedMultiplier: weighted,
      monthlyUSD: monthly,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
