import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSim, totalRunCost } from "@/lib/simulator-store";
import { saveUseCase } from "@/lib/storage/usecases";
import type { UseCase } from "@/lib/storage/types";

export function SaveToLedgerDialog({
  perRun,
  monteCarloMean,
}: {
  perRun: number;
  monteCarloMean: number;
}) {
  const nodes = useSim((s) => s.nodes);
  const edges = useSim((s) => s.edges);
  const mau = useSim((s) => s.mau);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [businessFunction, setBusinessFunction] = useState("");
  const [owner, setOwner] = useState("");
  const [totalUsers, setTotalUsers] = useState(mau);
  const [saving, setSaving] = useState(false);

  function openChange(o: boolean) {
    setOpen(o);
    if (o) {
      // refresh defaults from current sim on open
      setTotalUsers(useSim.getState().mau);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please give this use case a name");
      return;
    }
    setSaving(true);
    try {
      // Scale MC mean (computed against current slider mau) to the form's totalUsers
      const currentSliderMau = useSim.getState().mau;
      const perUserExpected =
        currentSliderMau > 0 ? monteCarloMean / currentSliderMau : 0;
      const expectedMonthlyCost = perUserExpected * totalUsers;

      const record: UseCase = {
        id: crypto.randomUUID(),
        name: name.trim(),
        businessFunction: businessFunction.trim(),
        owner: owner.trim(),
        application: "AI Cost Canvas",
        status: "poc",
        category: "agent",
        usagePattern: "user-driven",
        totalUsers,
        expectedTimeSavingPerUserPerMonth: 0,
        expectedMonthlyCost,
        peakUsagePeriod: "",
        fallbackSolution: "",
        confidence: "low",
        sourceModule: "sandbox",
        sandboxSnapshot: {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
          perRunCost: perRun,
          mauAtSnapshot: currentSliderMau,
        },
        decisionLog: [],
        history: [],
      };
      await saveUseCase(record);
      toast.success("Saved to Ledger", { description: record.name });
      setOpen(false);
      setName("");
      setBusinessFunction("");
      setOwner("");
    } catch (err) {
      console.error(err);
      toast.error("Could not save", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-medium text-indigo-200 transition hover:bg-indigo-500/20"
        >
          <Save className="h-3.5 w-3.5" />
          Save to Ledger
        </button>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to RoAI Ledger</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Capture this sandbox configuration as a tracked use case.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSave} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="uc-name" className="text-xs text-zinc-400">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="uc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Support ticket triage"
              className="border-zinc-800 bg-zinc-900 text-zinc-100"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="uc-bf" className="text-xs text-zinc-400">
                Business function
              </Label>
              <Input
                id="uc-bf"
                value={businessFunction}
                onChange={(e) => setBusinessFunction(e.target.value)}
                placeholder="Support"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uc-owner" className="text-xs text-zinc-400">
                Owner
              </Label>
              <Input
                id="uc-owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Team lead"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uc-users" className="text-xs text-zinc-400">
              Total users
            </Label>
            <Input
              id="uc-users"
              type="number"
              min={0}
              value={totalUsers}
              onChange={(e) => setTotalUsers(Number(e.target.value))}
              className="border-zinc-800 bg-zinc-900 text-zinc-100"
            />
            <div className="text-[10px] text-zinc-500">
              Expected monthly cost scales linearly from the current Monte Carlo mean.
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-500 text-white hover:bg-indigo-400"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
