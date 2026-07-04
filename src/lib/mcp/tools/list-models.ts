import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MODELS } from "../../pricing";

export default defineTool({
  name: "list_models",
  title: "List AI models",
  description: "List every AI model in the simulator's mid-2026 pricing catalog with per-1M-token rates.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(MODELS, null, 2) }],
    structuredContent: { models: MODELS },
  }),
});

export { z };
