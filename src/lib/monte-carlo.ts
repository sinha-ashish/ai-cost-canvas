// Real Monte Carlo simulation for MAU cost scaling.
// Segment mix: 70% standard (×1), 20% heavy (×2), 10% whale (×5).

const P_STD = 0.7;
const P_HEAVY = 0.2;
// P_WHALE = 0.1 (residual)

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller
function randn(rand: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface MonteCarloResult {
  samples: number[];
  mean: number;
  p5: number;
  p50: number;
  p95: number;
  min: number;
  max: number;
  bins: { x0: number; x1: number; count: number }[];
}

const DRAWS = 1000;
const BINS = 28;

export function runMonteCarlo(
  perRun: number,
  users: number,
  seed = 1337,
): MonteCarloResult {
  const rand = mulberry32(seed);
  const samples = new Array<number>(DRAWS);
  const N = Math.max(0, users);

  // std devs for normal approx to Binomial(N, p)
  const sdStd = Math.sqrt(N * P_STD * (1 - P_STD));
  const sdHeavy = Math.sqrt(N * P_HEAVY * (1 - P_HEAVY));

  for (let i = 0; i < DRAWS; i++) {
    let cStd = Math.round(N * P_STD + sdStd * randn(rand));
    let cHeavy = Math.round(N * P_HEAVY + sdHeavy * randn(rand));
    if (cStd < 0) cStd = 0;
    if (cHeavy < 0) cHeavy = 0;
    if (cStd + cHeavy > N) {
      // rescale down
      const s = cStd + cHeavy;
      cStd = Math.floor((cStd / s) * N);
      cHeavy = Math.floor((cHeavy / s) * N);
    }
    const cWhale = N - cStd - cHeavy;
    // effective runs (1× for std, 2× for heavy, 5× for whale)
    const effective = cStd * 1 + cHeavy * 2 + cWhale * 5;
    samples[i] = perRun * effective;
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const pick = (q: number) =>
    sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)))];
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // build histogram
  const bins: { x0: number; x1: number; count: number }[] = [];
  const width = (max - min) / BINS || 1;
  for (let i = 0; i < BINS; i++) {
    bins.push({ x0: min + i * width, x1: min + (i + 1) * width, count: 0 });
  }
  for (const v of samples) {
    let idx = Math.floor((v - min) / width);
    if (idx >= BINS) idx = BINS - 1;
    if (idx < 0) idx = 0;
    bins[idx].count++;
  }

  return {
    samples,
    mean,
    p5: pick(0.05),
    p50: pick(0.5),
    p95: pick(0.95),
    min,
    max,
    bins,
  };
}

// Mean multiplier used by the deterministic legacy helper (kept for compatibility)
export const MC_MEAN_MULTIPLIER = P_STD * 1 + P_HEAVY * 2 + (1 - P_STD - P_HEAVY) * 5;
