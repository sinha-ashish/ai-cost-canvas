import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Gauge,
  Settings2,
  Timer,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppSettings } from "@/lib/storage/types";
import {
  HOURS_PER_FTE,
  roaiHealth,
  type ComputedUseCase,
} from "./useLedgerData";

const num = "font-mono tabular-nums";

function fmt$(n: number) {
  if (!isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(4)}`;
  return "$0";
}
function fmtHours(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k h`;
  return `${n.toFixed(0)} h`;
}

const healthClasses: Record<
  ReturnType<typeof roaiHealth>,
  { text: string; ring: string; dot: string }
> = {
  green: {
    text: "text-emerald-300",
    ring: "border-emerald-500/40",
    dot: "bg-emerald-400",
  },
  amber: {
    text: "text-amber-300",
    ring: "border-amber-500/40",
    dot: "bg-amber-400",
  },
  red: {
    text: "text-red-300",
    ring: "border-red-500/40",
    dot: "bg-red-400",
  },
  neutral: {
    text: "text-zinc-400",
    ring: "border-zinc-800",
    dot: "bg-zinc-600",
  },
};

export function KpiRow({
  computed,
  settings,
  onUpdateSettings,
}: {
  computed: ComputedUseCase[];
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void | Promise<void>;
}) {
  const totalSpend = computed.reduce(
    (a, c) => a + c.useCase.expectedMonthlyCost,
    0,
  );
  const totalHours = computed.reduce((a, c) => a + c.hoursSaved, 0);
  const totalValue = computed.reduce((a, c) => a + c.value, 0);
  const blendedRoai = totalSpend > 0 ? totalValue / totalSpend : 0;
  const atRisk = computed
    .filter((c) => c.useCase.expectedMonthlyCost > 0 && c.roai < settings.roaiTarget)
    .reduce((a, c) => a + c.useCase.expectedMonthlyCost, 0);

  const fte = totalHours / HOURS_PER_FTE;
  const health = roaiHealth(blendedRoai, settings.roaiTarget);
  const atRiskHealth: keyof typeof healthClasses =
    atRisk > 0 ? (atRisk / Math.max(totalSpend, 1) > 0.4 ? "red" : "amber") : "neutral";

  // Aggregate portfolio trend from history entries (real data only).
  const spendTrend = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const { useCase } of computed) {
      for (const h of useCase.history) {
        const monthCost =
          h.roaiRatio > 0
            ? (useCase.totalUsers *
                useCase.expectedTimeSavingPerUserPerMonth *
                settings.blendedHourlyRate) /
              h.roaiRatio
            : 0;
        byMonth.set(h.month, (byMonth.get(h.month) ?? 0) + monthCost);
      }
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, v }));
  }, [computed, settings.blendedHourlyRate]);

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Monthly AI Spend"
          value={fmt$(totalSpend)}
          icon={<DollarSign className="h-3.5 w-3.5" />}
          sparkline={<Sparkline data={spendTrend} />}
        />
        <KpiCard
          label="Hours Saved / Month"
          value={fmtHours(totalHours)}
          icon={<Timer className="h-3.5 w-3.5" />}
          sub={`≈ ${fte.toFixed(1)} FTE`}
        />
        <KpiCard
          label="Blended RoAI Ratio"
          value={blendedRoai > 0 ? `${blendedRoai.toFixed(1)}×` : "—"}
          icon={<Gauge className="h-3.5 w-3.5" />}
          valueClass={healthClasses[health].text}
          ringClass={healthClasses[health].ring}
          sub={
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${healthClasses[health].dot}`} />
              target {settings.roaiTarget}×
            </span>
          }
        />
        <KpiCard
          label="At-Risk Spend"
          value={fmt$(atRisk)}
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          leftAccent={atRiskHealth}
          sub={
            atRisk > 0
              ? `${computed.filter((c) => c.useCase.expectedMonthlyCost > 0 && c.roai < settings.roaiTarget).length} below target`
              : "all healthy"
          }
        />
      </div>

      <div className="absolute right-0 top-0 -translate-y-full pb-2">
        <SettingsPopover settings={settings} onUpdate={onUpdateSettings} />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  sub,
  sparkline,
  valueClass,
  ringClass,
  leftAccent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: React.ReactNode;
  sparkline?: React.ReactNode;
  valueClass?: string;
  ringClass?: string;
  leftAccent?: keyof typeof healthClasses;
}) {
  const accent = leftAccent && leftAccent !== "neutral" ? healthClasses[leftAccent] : null;
  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-zinc-900/50 p-4 ${
        ringClass ?? "border-zinc-800"
      }`}
    >
      {accent && (
        <div
          className={`absolute inset-y-0 left-0 w-1 ${
            leftAccent === "red" ? "bg-red-500/70" : "bg-amber-500/70"
          }`}
        />
      )}
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
        {icon}
        {label}
      </div>
      <div
        className={`${num} mt-2 text-3xl font-semibold tracking-tight ${
          valueClass ?? "text-zinc-100"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 flex items-end justify-between">
        <div className={`${num} text-[11px] text-zinc-500`}>{sub ?? ""}</div>
        {sparkline && <div className="h-8 w-24 opacity-70">{sparkline}</div>}
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: { month: string; v: number }[] }) {
  if (data.length < 2) {
    return (
      <svg viewBox="0 0 100 32" className="h-full w-full">
        <line
          x1="0"
          y1="16"
          x2="100"
          y2="16"
          stroke="#3f3f46"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke="#818cf8"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SettingsPopover({
  settings,
  onUpdate,
}: {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void | Promise<void>;
}) {
  const [rate, setRate] = useState(String(settings.blendedHourlyRate));
  const [target, setTarget] = useState(String(settings.roaiTarget));

  return (
    <Popover
      onOpenChange={(o) => {
        if (o) {
          setRate(String(settings.blendedHourlyRate));
          setTarget(String(settings.roaiTarget));
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-[11px] text-zinc-400 transition hover:text-zinc-200"
          aria-label="Ledger settings"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Settings
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 border-zinc-800 bg-zinc-950 text-zinc-100"
      >
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
          <Activity className="h-3 w-3" /> RoAI parameters
        </div>
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ledger-rate" className="text-xs text-zinc-400">
              Blended hourly rate ($/hr)
            </Label>
            <Input
              id="ledger-rate"
              type="number"
              min={0}
              step={5}
              value={rate}
              onChange={(e) => {
                setRate(e.target.value);
                const v = Number(e.target.value);
                if (isFinite(v) && v >= 0) onUpdate({ blendedHourlyRate: v });
              }}
              className={`${num} border-zinc-800 bg-zinc-900 text-zinc-100`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ledger-target" className="text-xs text-zinc-400">
              RoAI target (×)
            </Label>
            <Input
              id="ledger-target"
              type="number"
              min={0}
              step={0.5}
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                const v = Number(e.target.value);
                if (isFinite(v) && v >= 0) onUpdate({ roaiTarget: v });
              }}
              className={`${num} border-zinc-800 bg-zinc-900 text-zinc-100`}
            />
          </div>
          <div className="text-[10px] text-zinc-500">
            Green ≥ target · Amber ≥ 60% of target · Red below.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
