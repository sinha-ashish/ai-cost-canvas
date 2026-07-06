import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Lock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { UseCase } from "@/lib/storage/types";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_ORDER,
  roaiHealth,
  type ComputedUseCase,
} from "./useLedgerData";
import { AddUseCaseDialog } from "./AddUseCaseDialog";
import { UseCaseSheet } from "./UseCaseSheet";

const num = "font-mono tabular-nums";

const CATEGORY_OPTIONS: (UseCase["category"] | "all")[] = [
  "all",
  "gen",
  "agent",
  "automation",
  "hybrid",
];
const CONFIDENCE_OPTIONS: (UseCase["confidence"] | "all")[] = [
  "all",
  "low",
  "medium",
  "high",
];

const CONFIDENCE_ORDER: Record<UseCase["confidence"], number> = {
  low: 0,
  medium: 1,
  high: 2,
};
const STATUS_INDEX: Record<UseCase["status"], number> = Object.fromEntries(
  STATUS_ORDER.map((s, i) => [s, i]),
) as Record<UseCase["status"], number>;

const CONFIDENCE_DOT: Record<UseCase["confidence"], string> = {
  low: "bg-zinc-500",
  medium: "bg-sky-400",
  high: "bg-violet-400",
};

type SortKey =
  | "name"
  | "owner"
  | "monthlyCost"
  | "hoursSaved"
  | "value"
  | "roai"
  | "confidence"
  | "status"
  | "trend";

function fmt$(n: number) {
  if (!isFinite(n)) return "—";
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(4)}`;
  return "$0";
}
function fmtHours(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}
function initials(owner: string) {
  const parts = owner.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function latestDecision(uc: UseCase) {
  return uc.decisionLog.length ? uc.decisionLog[uc.decisionLog.length - 1] : null;
}
function latestTrendValue(uc: UseCase) {
  if (uc.history.length === 0) return -Infinity;
  return uc.history[uc.history.length - 1].roaiRatio;
}

export function LedgerTable({
  computed,
  target,
  onUpdate,
  onCreate,
}: {
  computed: ComputedUseCase[];
  target: number;
  onUpdate: (uc: UseCase) => Promise<void>;
  onCreate: (uc: UseCase) => Promise<void>;
}) {
  const [catFilter, setCatFilter] = useState<(typeof CATEGORY_OPTIONS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<UseCase["status"] | "all">("all");
  const [confFilter, setConfFilter] =
    useState<(typeof CONFIDENCE_OPTIONS)[number]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("roai");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [openId, setOpenId] = useState<string | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "owner" ? "asc" : "desc");
    }
  }

  const filtered = useMemo(() => {
    return computed.filter(({ useCase }) => {
      if (catFilter !== "all" && useCase.category !== catFilter) return false;
      if (statusFilter !== "all" && useCase.status !== statusFilter) return false;
      if (confFilter !== "all" && useCase.confidence !== confFilter) return false;
      return true;
    });
  }, [computed, catFilter, statusFilter, confFilter]);

  const sorted = useMemo(() => {
    const arr = filtered.slice();
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const av = accessor(a, sortKey);
      const bv = accessor(b, sortKey);
      if (typeof av === "string" && typeof bv === "string") {
        return av.localeCompare(bv) * dir;
      }
      return ((av as number) - (bv as number)) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const maxRoai = useMemo(
    () => sorted.reduce((m, r) => Math.max(m, r.roai), 0),
    [sorted],
  );

  const openRow = openId
    ? computed.find((c) => c.useCase.id === openId) ?? null
    : null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <FilterSelect
          label="Category"
          value={catFilter}
          onChange={(v) => setCatFilter(v as (typeof CATEGORY_OPTIONS)[number])}
          options={CATEGORY_OPTIONS.map((c) => [c, c === "all" ? "All categories" : c])}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as UseCase["status"] | "all")}
          options={[
            ["all", "All stages"] as [string, string],
            ...STATUS_ORDER.map((s) => [s, STATUS_LABEL[s]] as [string, string]),
          ]}
        />
        <FilterSelect
          label="Confidence"
          value={confFilter}
          onChange={(v) => setConfFilter(v as (typeof CONFIDENCE_OPTIONS)[number])}
          options={CONFIDENCE_OPTIONS.map((c) => [c, c === "all" ? "All confidence" : c])}
        />
        <div className={`${num} ml-2 text-[11px] text-zinc-500`}>
          {sorted.length} of {computed.length}
        </div>
        <div className="ml-auto">
          <AddUseCaseDialog onCreate={onCreate} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <SortHead label="Use Case" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHead label="Owner" k="owner" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortHead
                label="Monthly Cost"
                k="monthlyCost"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
                align="right"
              />
              <SortHead
                label="Hours / mo"
                k="hoursSaved"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
                align="right"
              />
              <SortHead
                label="Value ($)"
                k="value"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
                align="right"
              />
              <SortHead
                label="RoAI Ratio"
                k="roai"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
              />
              <SortHead
                label="Conf."
                k="confidence"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
                align="center"
              />
              <SortHead
                label="Trend"
                k="trend"
                sortKey={sortKey}
                sortDir={sortDir}
                onClick={toggleSort}
              />
              <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                Fallback
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-xs text-zinc-500"
                >
                  No use cases match these filters.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((row) => (
              <LedgerRow
                key={row.useCase.id}
                row={row}
                maxRoai={maxRoai}
                target={target}
                onUpdate={onUpdate}
                onOpen={() => setOpenId(row.useCase.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <UseCaseSheet
        useCase={openRow?.useCase ?? null}
        hoursSaved={openRow?.hoursSaved ?? 0}
        value={openRow?.value ?? 0}
        roai={openRow?.roai ?? 0}
        open={!!openRow}
        onOpenChange={(o) => !o && setOpenId(null)}
        onUpdate={onUpdate}
      />
    </div>
  );
}

function accessor(c: ComputedUseCase, key: SortKey): number | string {
  switch (key) {
    case "name":
      return c.useCase.name.toLowerCase();
    case "owner":
      return c.useCase.owner.toLowerCase();
    case "monthlyCost":
      return c.useCase.expectedMonthlyCost;
    case "hoursSaved":
      return c.hoursSaved;
    case "value":
      return c.value;
    case "roai":
      return c.roai;
    case "confidence":
      return CONFIDENCE_ORDER[c.useCase.confidence];
    case "status":
      return STATUS_INDEX[c.useCase.status];
    case "trend":
      return latestTrendValue(c.useCase);
  }
}

function LedgerRow({
  row,
  maxRoai,
  target,
  onUpdate,
  onOpen,
}: {
  row: ComputedUseCase;
  maxRoai: number;
  target: number;
  onUpdate: (uc: UseCase) => Promise<void>;
  onOpen: () => void;
}) {
  const { useCase, hoursSaved, value, roai } = row;
  const isManual = useCase.sourceModule === "manual";
  const last = latestDecision(useCase);
  const paused = last?.decision === "pause" || last?.decision === "stop";

  const [editing, setEditing] = useState<null | "cost" | "hours">(null);
  const [draft, setDraft] = useState("");
  const [flash, setFlash] = useState(false);
  const rowRef = useRef<HTMLTableRowElement>(null);

  const prevKey = useRef(`${useCase.expectedMonthlyCost}|${hoursSaved}|${value}|${roai}`);
  useEffect(() => {
    const key = `${useCase.expectedMonthlyCost}|${hoursSaved}|${value}|${roai}`;
    if (key !== prevKey.current) {
      prevKey.current = key;
      const mql =
        typeof window !== "undefined"
          ? window.matchMedia("(prefers-reduced-motion: reduce)")
          : null;
      if (!mql?.matches) {
        setFlash(true);
        const t = setTimeout(() => setFlash(false), 600);
        return () => clearTimeout(t);
      }
    }
  }, [useCase.expectedMonthlyCost, hoursSaved, value, roai]);

  function startEdit(kind: "cost" | "hours") {
    if (!isManual) return;
    setEditing(kind);
    setDraft(
      kind === "cost" ? String(useCase.expectedMonthlyCost) : String(hoursSaved),
    );
  }

  async function commit() {
    if (!editing) return;
    const v = Number(draft);
    if (!isFinite(v) || v < 0) {
      setEditing(null);
      return;
    }
    let next: UseCase = useCase;
    if (editing === "cost") {
      if (v === useCase.expectedMonthlyCost) {
        setEditing(null);
        return;
      }
      next = { ...useCase, expectedMonthlyCost: v };
    } else {
      // Hours-saved back-solve: hours = totalUsers × timePerUser.
      // We back-solve timePerUser = newHours / totalUsers (guard div0).
      if (useCase.totalUsers <= 0) {
        setEditing(null);
        return;
      }
      const perUser = v / useCase.totalUsers;
      if (perUser === useCase.expectedTimeSavingPerUserPerMonth) {
        setEditing(null);
        return;
      }
      next = { ...useCase, expectedTimeSavingPerUserPerMonth: perUser };
    }
    setEditing(null);
    await onUpdate(next);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(null);
    }
  }

  const barWidth =
    maxRoai > 0 && roai > 0 ? Math.min(100, (roai / maxRoai) * 100) : 0;
  const health = roaiHealth(roai, target);
  const barColor =
    health === "green"
      ? "bg-emerald-400"
      : health === "amber"
        ? "bg-amber-400"
        : health === "red"
          ? "bg-red-400"
          : "bg-zinc-600";

  return (
    <TableRow
      ref={rowRef}
      onClick={(e) => {
        if (editing) return;
        // Don't trigger open when clicking on editable cells while editing / inputs
        const el = e.target as HTMLElement;
        if (el.closest("[data-stop-row]")) return;
        onOpen();
      }}
      className={`cursor-pointer border-zinc-800/60 transition-colors hover:bg-zinc-900/40 ${
        paused ? "opacity-60" : ""
      } ${flash ? "motion-safe:bg-indigo-500/10" : ""}`}
      style={{ height: 38 }}
    >
      {/* Use case */}
      <TableCell className="max-w-[240px] py-1.5">
        <div className="truncate text-sm text-zinc-100">{useCase.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-[1px] text-[9px] uppercase tracking-wide text-zinc-400">
            {useCase.category}
          </span>
          <span
            className="rounded px-1.5 py-[1px] text-[9px] font-medium uppercase tracking-wide text-zinc-100"
            style={{ backgroundColor: STATUS_COLOR[useCase.status] }}
          >
            {STATUS_LABEL[useCase.status]}
          </span>
          {paused && (
            <span className="rounded border border-zinc-700 px-1.5 py-[1px] text-[9px] uppercase tracking-wide text-zinc-400">
              {last?.decision}
            </span>
          )}
        </div>
      </TableCell>

      {/* Owner */}
      <TableCell className="py-1.5">
        {useCase.owner ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-medium text-zinc-200">
                  {initials(useCase.owner)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                {useCase.owner}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-zinc-600">—</span>
        )}
      </TableCell>

      {/* Monthly cost */}
      <TableCell
        data-stop-row
        className={`${num} py-1.5 text-right text-sm text-zinc-100`}
        onClick={(e) => {
          e.stopPropagation();
          startEdit("cost");
        }}
      >
        {editing === "cost" && isManual ? (
          <input
            autoFocus
            type="number"
            min={0}
            step={0.01}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
            className={`${num} w-24 rounded border border-indigo-500/60 bg-zinc-950 px-1 py-0.5 text-right text-sm text-zinc-100 focus:outline-none`}
          />
        ) : isManual ? (
          <span className="cursor-text">{fmt$(useCase.expectedMonthlyCost)}</span>
        ) : (
          <SandboxLocked>{fmt$(useCase.expectedMonthlyCost)}</SandboxLocked>
        )}
      </TableCell>

      {/* Hours saved */}
      <TableCell
        data-stop-row
        className={`${num} py-1.5 text-right text-sm text-zinc-100`}
        onClick={(e) => {
          e.stopPropagation();
          startEdit("hours");
        }}
      >
        {editing === "hours" && isManual ? (
          <input
            autoFocus
            type="number"
            min={0}
            step={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
            className={`${num} w-24 rounded border border-indigo-500/60 bg-zinc-950 px-1 py-0.5 text-right text-sm text-zinc-100 focus:outline-none`}
          />
        ) : isManual ? (
          <span className="cursor-text">{fmtHours(hoursSaved)}</span>
        ) : (
          <SandboxLocked>{fmtHours(hoursSaved)}</SandboxLocked>
        )}
      </TableCell>

      {/* Value */}
      <TableCell className={`${num} py-1.5 text-right text-sm text-zinc-100`}>
        {fmt$(value)}
      </TableCell>

      {/* RoAI ratio with bar */}
      <TableCell className="py-1.5">
        <div className="flex items-center gap-2">
          <div
            className={`${num} w-10 text-sm ${
              health === "green"
                ? "text-emerald-300"
                : health === "amber"
                  ? "text-amber-300"
                  : health === "red"
                    ? "text-red-300"
                    : "text-zinc-500"
            }`}
          >
            {roai > 0 ? `${roai.toFixed(1)}×` : "—"}
          </div>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full ${barColor} transition-[width] duration-300`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
      </TableCell>

      {/* Confidence dot */}
      <TableCell className="py-1.5 text-center">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`inline-block h-2 w-2 rounded-full ${CONFIDENCE_DOT[useCase.confidence]}`}
              />
            </TooltipTrigger>
            <TooltipContent className="border-zinc-800 bg-zinc-950 text-zinc-100 capitalize">
              {useCase.confidence} confidence
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Trend sparkline */}
      <TableCell className="py-1.5">
        {useCase.history.length >= 2 ? (
          <div className="h-6 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={useCase.history.map((h) => ({ v: h.roaiRatio }))}
                margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
              >
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
          </div>
        ) : (
          <span className="text-zinc-600">—</span>
        )}
      </TableCell>

      {/* Fallback */}
      <TableCell className="py-1.5">
        {useCase.fallbackSolution ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[140px] truncate text-xs text-zinc-400">
                  {useCase.fallbackSolution}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs border-zinc-800 bg-zinc-950 text-zinc-100">
                {useCase.fallbackSolution}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-zinc-600">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function SandboxLocked({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-zinc-400">
            {children}
            <Lock className="h-3 w-3 opacity-40" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          Derived from Sandbox simulation
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SortHead({
  label,
  k,
  sortKey,
  sortDir,
  onClick,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onClick: (k: SortKey) => void;
  align?: "left" | "right" | "center";
}) {
  const active = sortKey === k;
  return (
    <TableHead
      className={`select-none text-[10px] uppercase tracking-widest text-zinc-500 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 hover:text-zinc-200 ${
          active ? "text-zinc-200" : ""
        }`}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

function FilterSelect({
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
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-40 border-zinc-800 bg-zinc-900 text-xs capitalize text-zinc-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          {options.map(([v, label]) => (
            <SelectItem key={v} value={v} className="text-xs capitalize">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
