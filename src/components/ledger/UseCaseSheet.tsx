import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Cpu, ListChecks, Sparkles } from "lucide-react";
import type { UseCase } from "@/lib/storage/types";
import { STATUS_LABEL } from "./useLedgerData";

const num = "font-mono tabular-nums";

type Decision = UseCase["decisionLog"][number]["decision"];

const DECISION_OPTIONS: Decision[] = [
  "scale",
  "continue",
  "refine",
  "pause",
  "stop",
];

function fmt$(n: number) {
  if (!isFinite(n)) return "—";
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(4)}`;
  return "$0";
}

export function UseCaseSheet({
  useCase,
  open,
  onOpenChange,
  hoursSaved,
  value,
  roai,
  onUpdate,
}: {
  useCase: UseCase | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  hoursSaved: number;
  value: number;
  roai: number;
  onUpdate: (uc: UseCase) => Promise<void>;
}) {
  const [decision, setDecision] = useState<Decision>("continue");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const decisions = useMemo(
    () => (useCase ? [...useCase.decisionLog].reverse() : []),
    [useCase],
  );

  if (!useCase) return null;

  async function submit() {
    if (!useCase) return;
    setSubmitting(true);
    try {
      const nextStatus: UseCase["status"] =
        decision === "scale"
          ? "production"
          : decision === "refine"
            ? "structured"
            : useCase.status;
      const next: UseCase = {
        ...useCase,
        status: nextStatus,
        decisionLog: [
          ...useCase.decisionLog,
          {
            decision,
            timestamp: new Date().toISOString(),
            note: note.trim() || undefined,
          },
        ],
      };
      await onUpdate(next);
      toast.success("Decision recorded", { description: decision });
      setNote("");
      setDecision("continue");
    } catch (err) {
      toast.error("Could not record", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg"
      >
        <SheetHeader>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
            {useCase.sourceModule === "sandbox" ? (
              <>
                <Cpu className="h-3 w-3" /> Sandbox-derived
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" /> Manual entry
              </>
            )}
            <span className="text-zinc-700">·</span>
            <span className="capitalize">{useCase.category}</span>
            <span className="text-zinc-700">·</span>
            <span>{STATUS_LABEL[useCase.status]}</span>
          </div>
          <SheetTitle className="text-zinc-100">{useCase.name}</SheetTitle>
          <SheetDescription className="text-zinc-500">
            {useCase.businessFunction || "No business function"} ·{" "}
            {useCase.application || "No application"}
          </SheetDescription>
        </SheetHeader>

        {/* Economic profile */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs">
          <Stat label="Total users" value={useCase.totalUsers.toLocaleString()} />
          <Stat
            label="Hrs / user / mo"
            value={useCase.expectedTimeSavingPerUserPerMonth.toFixed(2)}
          />
          <Stat label="Monthly cost" value={fmt$(useCase.expectedMonthlyCost)} />
          <Stat label="Hours saved / mo" value={hoursSaved.toFixed(0)} />
          <Stat label="Value / mo" value={fmt$(value)} />
          <Stat label="RoAI" value={roai > 0 ? `${roai.toFixed(2)}×` : "—"} />
          <Stat label="Confidence" value={useCase.confidence} />
          <Stat label="Usage pattern" value={useCase.usagePattern} />
        </div>

        <Section title="Problem statement">
          <div className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/20 p-3 text-[11px] text-zinc-500">
            No problem statement field yet — coming in a later stage.
          </div>
        </Section>

        <Section title="Peak usage period">
          <div className="text-xs text-zinc-300">
            {useCase.peakUsagePeriod || <span className="text-zinc-500">—</span>}
          </div>
        </Section>

        <Section title="Fallback solution">
          <div className="whitespace-pre-wrap text-xs text-zinc-300">
            {useCase.fallbackSolution || <span className="text-zinc-500">—</span>}
          </div>
        </Section>

        <Section title="Record decision">
          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Decision
                </Label>
                <Select
                  value={decision}
                  onValueChange={(v) => setDecision(v as Decision)}
                >
                  <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-100 capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                    {DECISION_OPTIONS.map((d) => (
                      <SelectItem key={d} value={d} className="capitalize">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className="w-full bg-indigo-500 text-white hover:bg-indigo-400"
                >
                  {submitting ? "Saving…" : "Record"}
                </Button>
              </div>
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              className="min-h-16 border-zinc-800 bg-zinc-950 text-zinc-100"
            />
          </div>
        </Section>

        <Section
          title={
            <span className="flex items-center gap-1.5">
              <ListChecks className="h-3 w-3" /> Decision log
            </span>
          }
        >
          {decisions.length === 0 ? (
            <div className="text-[11px] text-zinc-500">No decisions recorded.</div>
          ) : (
            <ol className="space-y-2">
              {decisions.map((d, i) => (
                <li
                  key={`${d.timestamp}-${i}`}
                  className="rounded-md border border-zinc-800 bg-zinc-900/40 p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize text-zinc-200">
                      {d.decision}
                    </span>
                    <span className={`${num} text-[10px] text-zinc-500`}>
                      {new Date(d.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {d.note && (
                    <div className="mt-1 text-[11px] text-zinc-400">{d.note}</div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Section>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </div>
      <div className={`${num} mt-0.5 text-sm capitalize text-zinc-100`}>{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="mb-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
        {title}
      </div>
      {children}
    </div>
  );
}
