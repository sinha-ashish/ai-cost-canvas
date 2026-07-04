import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MODELS } from "../../pricing";

export default defineTool({
  name: "compare_models",
  title: "Compare model costs",
  description:
    "Compare the per-run cost of the same workload across all models in the catalog. Returns ranked cheapest-first.",
  inputSchema: {
    inputTokens: z.number().int().min(0),
    outputTokens: z.number().int().min(0),
    cachedShare: z.number().min(0).max(1).default(0),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ inputTokens, outputTokens, cachedShare }) => {
    const rows = MODELS.map((m) => {
      const cached = inputTokens * cachedShare;
      const visible = inputTokens - cached;
      const cost =
        (visible / 1_000_000) * m.input +
        (cached / 1_000_000) * m.cached +
        (outputTokens / 1_000_000) * m.output;
      return { id: m.id, provider: m.provider, name: m.name, perRunUSD: cost };
    }).sort((a, b) => a.perRunUSD - b.perRunUSD);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { ranked: rows },
    };
  },
});
