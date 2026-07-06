import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import type { UseCase } from "@/lib/storage/types";
import { STATUS_LABEL, STATUS_ORDER } from "./useLedgerData";

const num = "font-mono tabular-nums";

const CATEGORIES: UseCase["category"][] = ["gen", "agent", "automation", "hybrid"];
const USAGE: UseCase["usagePattern"][] = ["user-driven", "system-driven"];
const CONFIDENCES: UseCase["confidence"][] = ["low", "medium", "high"];

export function AddUseCaseDialog({
  onCreate,
}: {
  onCreate: (uc: UseCase) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [businessFunction, setBusinessFunction] = useState("");
  const [owner, setOwner] = useState("");
  const [application, setApplication] = useState("");
  const [status, setStatus] = useState<UseCase["status"]>("idea");
  const [category, setCategory] = useState<UseCase["category"]>("gen");
  const [usagePattern, setUsagePattern] =
    useState<UseCase["usagePattern"]>("user-driven");
  const [totalUsers, setTotalUsers] = useState(0);
  const [timeSaving, setTimeSaving] = useState(0);
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [peakUsagePeriod, setPeakUsagePeriod] = useState("");
  const [fallbackSolution, setFallbackSolution] = useState("");
  const [confidence, setConfidence] = useState<UseCase["confidence"]>("low");

  function reset() {
    setName("");
    setBusinessFunction("");
    setOwner("");
    setApplication("");
    setStatus("idea");
    setCategory("gen");
    setUsagePattern("user-driven");
    setTotalUsers(0);
    setTimeSaving(0);
    setMonthlyCost(0);
    setPeakUsagePeriod("");
    setFallbackSolution("");
    setConfidence("low");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const uc: UseCase = {
        id: crypto.randomUUID(),
        name: name.trim(),
        businessFunction: businessFunction.trim(),
        owner: owner.trim(),
        application: application.trim(),
        status,
        category,
        usagePattern,
        totalUsers,
        expectedTimeSavingPerUserPerMonth: timeSaving,
        expectedMonthlyCost: monthlyCost,
        peakUsagePeriod: peakUsagePeriod.trim(),
        fallbackSolution: fallbackSolution.trim(),
        confidence,
        sourceModule: "manual",
        decisionLog: [],
        history: [],
      };
      await onCreate(uc);
      toast.success("Use case added", { description: uc.name });
      reset();
      setOpen(false);
    } catch (err) {
      toast.error("Could not add", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-indigo-500 text-white hover:bg-indigo-400">
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Use Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add use case</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Track a new AI feature in the Ledger.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-zinc-800 bg-zinc-900 text-zinc-100"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Business function">
              <Input
                value={businessFunction}
                onChange={(e) => setBusinessFunction(e.target.value)}
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
              />
            </Field>
            <Field label="Owner">
              <Input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
              />
            </Field>
            <Field label="Application">
              <Input
                value={application}
                onChange={(e) => setApplication(e.target.value)}
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
              />
            </Field>
            <Field label="Peak usage period">
              <Input
                value={peakUsagePeriod}
                onChange={(e) => setPeakUsagePeriod(e.target.value)}
                placeholder="e.g. weekday mornings"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SelectField
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as UseCase["status"])}
              options={STATUS_ORDER.map((s) => [s, STATUS_LABEL[s]])}
            />
            <SelectField
              label="Category"
              value={category}
              onChange={(v) => setCategory(v as UseCase["category"])}
              options={CATEGORIES.map((c) => [c, c])}
            />
            <SelectField
              label="Confidence"
              value={confidence}
              onChange={(v) => setConfidence(v as UseCase["confidence"])}
              options={CONFIDENCES.map((c) => [c, c])}
            />
          </div>

          <SelectField
            label="Usage pattern"
            value={usagePattern}
            onChange={(v) => setUsagePattern(v as UseCase["usagePattern"])}
            options={USAGE.map((c) => [c, c])}
          />

          <div className="grid grid-cols-3 gap-3">
            <Field label="Total users">
              <Input
                type="number"
                min={0}
                value={totalUsers}
                onChange={(e) => setTotalUsers(Number(e.target.value))}
                className={`${num} border-zinc-800 bg-zinc-900 text-zinc-100`}
              />
            </Field>
            <Field label="Hrs saved / user / mo">
              <Input
                type="number"
                min={0}
                step={0.1}
                value={timeSaving}
                onChange={(e) => setTimeSaving(Number(e.target.value))}
                className={`${num} border-zinc-800 bg-zinc-900 text-zinc-100`}
              />
            </Field>
            <Field label="Monthly cost ($)">
              <Input
                type="number"
                min={0}
                step={1}
                value={monthlyCost}
                onChange={(e) => setMonthlyCost(Number(e.target.value))}
                className={`${num} border-zinc-800 bg-zinc-900 text-zinc-100`}
              />
            </Field>
          </div>

          <Field label="Fallback solution">
            <Textarea
              value={fallbackSolution}
              onChange={(e) => setFallbackSolution(e.target.value)}
              placeholder="What happens if the AI is unavailable?"
              className="min-h-16 border-zinc-800 bg-zinc-900 text-zinc-100"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-500 text-white hover:bg-indigo-400"
            >
              {saving ? "Saving…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-400">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-100 capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          {options.map(([v, label]) => (
            <SelectItem key={v} value={v} className="capitalize">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
