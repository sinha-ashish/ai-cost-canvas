import { defineMcp } from "@lovable.dev/mcp-js";
import listModelsTool from "./tools/list-models";
import estimateCostTool from "./tools/estimate-cost";
import compareModelsTool from "./tools/compare-models";

export default defineMcp({
  name: "agent-cost-simulator-mcp",
  title: "Agent Cost Simulator",
  version: "0.1.0",
  instructions:
    "Tools for the B2B AI Agent Cost Simulator. Use `list_models` to browse the mid-2026 pricing catalog, `estimate_cost` to price a single agent call (with cache/reasoning/MAU scaling), and `compare_models` to rank models for a given workload.",
  tools: [listModelsTool, estimateCostTool, compareModelsTool],
});
