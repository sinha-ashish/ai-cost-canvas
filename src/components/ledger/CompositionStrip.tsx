import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_ORDER,
  type ComputedUseCase,
} from "./useLedgerData";

const num = "font-mono tabular-nums";

function fmt$(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

export function CompositionStrip({ computed }: { computed: ComputedUseCase[] }) {
  const totals = useMemo(() => {
    const t = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<
      (typeof STATUS_ORDER)[number],
      number
    >;
    for (const { useCase } of computed) t[useCase.status] += useCase.expectedMonthlyCost;
    return t;
  }, [computed]);

  const grand = STATUS_ORDER.reduce((a, s) => a + totals[s], 0);

  const data = useMemo(
    () => [
      {
        name: "spend",
        ...(Object.fromEntries(STATUS_ORDER.map((s) => [s, totals[s]])) as Record<
          string,
          number
        >),
      },
    ],
    [totals],
  );

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          Portfolio composition · spend by stage
        </div>
        <div className={`${num} text-[11px] text-zinc-500`}>
          {fmt$(grand)} / mo
        </div>
      </div>
      <div className="h-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis type="number" hide domain={[0, Math.max(grand, 1)]} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{
                background: "#09090b",
                border: "1px solid #27272a",
                fontSize: 11,
              }}
              formatter={(v: number, name) => [fmt$(v), STATUS_LABEL[name as never]]}
              labelFormatter={() => ""}
            />
            {STATUS_ORDER.map((s, i) => (
              <Bar
                key={s}
                dataKey={s}
                stackId="a"
                fill={STATUS_COLOR[s]}
                radius={
                  i === 0
                    ? [4, 0, 0, 4]
                    : i === STATUS_ORDER.length - 1
                      ? [0, 4, 4, 0]
                      : 0
                }
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-[11px]">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: STATUS_COLOR[s] }}
            />
            <span className="text-zinc-400">{STATUS_LABEL[s]}</span>
            <span className={`${num} text-zinc-500`}>{fmt$(totals[s])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
