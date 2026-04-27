/**
 * Lottery Genetic Algorithm Engine
 * ---------------------------------
 * โมเดล GA สำหรับ "แนะนำ" เลขหวยจากสถิติประวัติย้อนหลัง
 *
 * ⚠️ DISCLAIMER: ผลรางวัลหวยเป็นการสุ่มจริง ไม่มีอัลกอริทึมใดทำนายได้แม่นยำ
 * โมเดลนี้เป็นเพียงตัวช่วยแนะนำเชิงสถิติ/เพื่อความบันเทิงเท่านั้น
 *
 * ใช้งานหลัก:
 *   const result = runGA({ digitCount: 2, history: [...], config: {...} });
 */

// ============================================================
// Types
// ============================================================

export type Chromosome = number[]; // เช่น [4, 7] สำหรับเลข 47

export interface HistoryEntry {
  /** ตัวเลขที่ออกในงวดนั้น เป็น array ของหลัก เช่น [4, 7] = 47 */
  digits: number[];
  /** วันที่ออก ISO string หรือ timestamp (ไม่บังคับ — ใช้คำนวณ recency weight) */
  date?: string | number;
}

export interface GAConfig {
  /** จำนวนประชากรในแต่ละ generation (default 100) */
  populationSize: number;
  /** จำนวน generation ที่จะวิวัฒนาการ (default 50) */
  generations: number;
  /** อัตราการ mutation 0-1 (default 0.1) */
  mutationRate: number;
  /** อัตราการ crossover 0-1 (default 0.8) */
  crossoverRate: number;
  /** จำนวน elite ที่ส่งต่อ generation ถัดไปโดยไม่แตะต้อง (default 2) */
  elitismCount: number;
  /** จำนวนเลขที่จะส่งคืนเป็นคำแนะนำท็อป (default 5) */
  topResults: number;
  /** ถ่วงน้ำหนักประวัติให้งวดล่าสุดมีน้ำหนักมากกว่า (default true) */
  recencyWeighting: boolean;
  /** seed สำหรับ random (optional, สำหรับ reproducibility) */
  seed?: number;
}

export interface GAInput {
  /** จำนวนหลัก เช่น 2 (เลขท้าย 2 ตัว), 3, 6 (รางวัลที่ 1) */
  digitCount: number;
  /** ประวัติผลหวยย้อนหลัง (เรียงจากเก่า → ใหม่ หรือ ใหม่ → เก่าก็ได้ ถ้ามี date) */
  history: HistoryEntry[];
  /** ตั้งค่า GA (optional, มี default ให้ทุกค่า) */
  config?: Partial<GAConfig>;
}

export interface GAResult {
  /** เลขที่แนะนำ เรียงจาก fitness สูง → ต่ำ */
  recommendations: Array<{
    digits: number[];
    asString: string; // เช่น "47"
    fitness: number;
    rank: number;
  }>;
  /** ประวัติ fitness สูงสุดของแต่ละ generation (สำหรับ debug/visualization) */
  fitnessHistory: number[];
  /** เวลาที่ใช้ทั้งหมด (ms) */
  elapsedMs: number;
  /** ค่า config ที่ใช้จริง (รวม default แล้ว) */
  configUsed: GAConfig;
}

// ============================================================
// Default Config
// ============================================================

export const DEFAULT_CONFIG: GAConfig = {
  populationSize: 100,
  generations: 50,
  mutationRate: 0.1,
  crossoverRate: 0.8,
  elitismCount: 2,
  topResults: 5,
  recencyWeighting: true,
};

// ============================================================
// Random utilities (รองรับ seed สำหรับ reproducibility)
// ============================================================

function makeRng(seed?: number) {
  if (seed === undefined) return Math.random;
  // Mulberry32 — เรียบง่าย, คุณภาพพอใช้สำหรับ GA
  let state = seed >>> 0;
  return function () {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ============================================================
// Statistics (วิเคราะห์ history เพื่อใช้ใน fitness function)
// ============================================================

interface HistoryStats {
  /** ความถี่ของแต่ละหลัก (0-9) ในแต่ละตำแหน่ง — positionFreq[pos][digit] */
  positionFreq: number[][];
  /** ความถี่รวมของแต่ละหลัก (0-9) ไม่สนตำแหน่ง */
  globalFreq: number[];
  /** ผลรวมเลขในประวัติ (mean, std) — ใช้ดูว่า sum ของชุดที่แนะนำใกล้เคียงค่าเฉลี่ยมั้ย */
  sumStats: { mean: number; std: number };
  /** สัดส่วนเลขคู่ในประวัติ (ใช้เช็ค balance คู่/คี่) */
  evenRatio: number;
  /** จำนวนงวดที่ใช้คำนวณ */
  sampleSize: number;
  /** Set ของเลขที่ออกในประวัติ (ใช้คำนวณ "novelty" — ปกติเลขที่ออกแล้วมักไม่ออกซ้ำเร็ว) */
  recentSet: Set<string>;
}

function analyzeHistory(history: HistoryEntry[], digitCount: number, recencyWeighting: boolean): HistoryStats {
  const positionFreq: number[][] = Array.from({ length: digitCount }, () => new Array(10).fill(0));
  const globalFreq = new Array(10).fill(0);
  const sums: number[] = [];
  let evenCount = 0;
  let totalDigits = 0;

  // เรียงให้แน่ใจว่างวดใหม่อยู่ท้าย (สำหรับ recency weight)
  const sorted = [...history].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return ta - tb;
  });

  const n = sorted.length;
  sorted.forEach((entry, idx) => {
    if (entry.digits.length !== digitCount) return; // ข้ามถ้าขนาดไม่ตรง
    // recency weight: งวดล่าสุด = 1.0, งวดเก่าสุด = 0.3
    const w = recencyWeighting ? 0.3 + 0.7 * (idx / Math.max(n - 1, 1)) : 1;

    let sum = 0;
    entry.digits.forEach((d, pos) => {
      if (d < 0 || d > 9) return;
      positionFreq[pos][d] += w;
      globalFreq[d] += w;
      sum += d;
      if (d % 2 === 0) evenCount += w;
      totalDigits += w;
    });
    sums.push(sum);
  });

  // sum stats
  const meanSum = sums.length ? sums.reduce((a, b) => a + b, 0) / sums.length : 0;
  const variance = sums.length
    ? sums.reduce((acc, s) => acc + (s - meanSum) ** 2, 0) / sums.length
    : 0;
  const stdSum = Math.sqrt(variance);

  // recent set (10 งวดล่าสุด)
  const recentSet = new Set<string>();
  sorted.slice(-10).forEach((e) => recentSet.add(e.digits.join(',')));

  return {
    positionFreq,
    globalFreq,
    sumStats: { mean: meanSum, std: stdSum || 1 }, // กัน div by 0
    evenRatio: totalDigits > 0 ? evenCount / totalDigits : 0.5,
    sampleSize: sorted.length,
    recentSet,
  };
}

// ============================================================
// Fitness Function — หัวใจของ GA
// ============================================================

/**
 * คะแนน fitness ของชุดเลข ประกอบด้วย 4 ส่วน:
 *
 *   1. Position frequency  — เลขในแต่ละตำแหน่งมีความถี่สูงในประวัติมั้ย
 *   2. Sum closeness       — ผลรวมเลขใกล้ค่าเฉลี่ยของประวัติมั้ย
 *   3. Even/odd balance    — สัดส่วนคู่/คี่สอดคล้องกับประวัติมั้ย
 *   4. Novelty penalty     — ลดคะแนนถ้าซ้ำกับเลขที่เพิ่งออก 10 งวดล่าสุด
 *
 * ปรับน้ำหนัก weights ได้ตามต้องการ
 */
function calculateFitness(chromosome: Chromosome, stats: HistoryStats): number {
  const weights = { position: 0.45, sum: 0.25, parity: 0.15, novelty: 0.15 };

  // 1) Position frequency score (normalize to 0-1)
  let positionScore = 0;
  let maxPositionScore = 0;
  chromosome.forEach((d, pos) => {
    positionScore += stats.positionFreq[pos][d] || 0;
    const maxAtPos = Math.max(...stats.positionFreq[pos]);
    maxPositionScore += maxAtPos || 1;
  });
  positionScore = maxPositionScore > 0 ? positionScore / maxPositionScore : 0;

  // 2) Sum closeness (Gaussian-like, ใกล้ mean = คะแนนสูง)
  const sum = chromosome.reduce((a, b) => a + b, 0);
  const z = Math.abs(sum - stats.sumStats.mean) / stats.sumStats.std;
  const sumScore = Math.exp(-(z * z) / 2); // 0-1

  // 3) Parity balance
  const evenInChromo = chromosome.filter((d) => d % 2 === 0).length / chromosome.length;
  const parityScore = 1 - Math.abs(evenInChromo - stats.evenRatio); // 0-1

  // 4) Novelty (ถ้าซ้ำของ 10 งวดล่าสุด จะถูกลด)
  const noveltyScore = stats.recentSet.has(chromosome.join(',')) ? 0 : 1;

  return (
    weights.position * positionScore +
    weights.sum * sumScore +
    weights.parity * parityScore +
    weights.novelty * noveltyScore
  );
}

// ============================================================
// GA Operators
// ============================================================

function createRandomChromosome(digitCount: number, rng: () => number): Chromosome {
  return Array.from({ length: digitCount }, () => randInt(rng, 0, 9));
}

/** Tournament selection — เลือก k ตัวสุ่ม คืนตัวที่ fitness สูงสุด */
function tournamentSelect(
  population: Chromosome[],
  fitnesses: number[],
  k: number,
  rng: () => number,
): Chromosome {
  let bestIdx = randInt(rng, 0, population.length - 1);
  for (let i = 1; i < k; i++) {
    const idx = randInt(rng, 0, population.length - 1);
    if (fitnesses[idx] > fitnesses[bestIdx]) bestIdx = idx;
  }
  return [...population[bestIdx]];
}

/** Single-point crossover */
function crossover(parent1: Chromosome, parent2: Chromosome, rng: () => number): [Chromosome, Chromosome] {
  if (parent1.length < 2) return [[...parent1], [...parent2]];
  const point = randInt(rng, 1, parent1.length - 1);
  const child1 = [...parent1.slice(0, point), ...parent2.slice(point)];
  const child2 = [...parent2.slice(0, point), ...parent1.slice(point)];
  return [child1, child2];
}

/** Mutation — สุ่มเปลี่ยนหลักบางตัวเป็นเลข 0-9 */
function mutate(chromosome: Chromosome, rate: number, rng: () => number): Chromosome {
  return chromosome.map((d) => (rng() < rate ? randInt(rng, 0, 9) : d));
}

// ============================================================
// Main Function
// ============================================================

export function runGA(input: GAInput): GAResult {
  const startTime = Date.now();
  const config: GAConfig = { ...DEFAULT_CONFIG, ...(input.config || {}) };
  const rng = makeRng(config.seed);

  // กรณี history ว่าง — fallback เป็นการสุ่มล้วน
  if (!input.history || input.history.length === 0) {
    const recommendations = Array.from({ length: config.topResults }, (_, i) => {
      const digits = createRandomChromosome(input.digitCount, rng);
      return {
        digits,
        asString: digits.join(''),
        fitness: 0,
        rank: i + 1,
      };
    });
    return {
      recommendations,
      fitnessHistory: [],
      elapsedMs: Date.now() - startTime,
      configUsed: config,
    };
  }

  const stats = analyzeHistory(input.history, input.digitCount, config.recencyWeighting);

  // Initial population
  let population: Chromosome[] = Array.from({ length: config.populationSize }, () =>
    createRandomChromosome(input.digitCount, rng),
  );
  let fitnesses = population.map((c) => calculateFitness(c, stats));
  const fitnessHistory: number[] = [Math.max(...fitnesses)];

  // Evolution loop
  for (let gen = 0; gen < config.generations; gen++) {
    // Sort population by fitness (desc) สำหรับ elitism
    const indexed = population.map((c, i) => ({ c, f: fitnesses[i] }));
    indexed.sort((a, b) => b.f - a.f);

    const newPopulation: Chromosome[] = [];

    // Elitism — เก็บ top N ไว้
    for (let i = 0; i < config.elitismCount && i < indexed.length; i++) {
      newPopulation.push([...indexed[i].c]);
    }

    // Generate offspring
    while (newPopulation.length < config.populationSize) {
      const p1 = tournamentSelect(population, fitnesses, 3, rng);
      const p2 = tournamentSelect(population, fitnesses, 3, rng);

      let child1: Chromosome;
      let child2: Chromosome;
      if (rng() < config.crossoverRate) {
        [child1, child2] = crossover(p1, p2, rng);
      } else {
        child1 = p1;
        child2 = p2;
      }

      newPopulation.push(mutate(child1, config.mutationRate, rng));
      if (newPopulation.length < config.populationSize) {
        newPopulation.push(mutate(child2, config.mutationRate, rng));
      }
    }

    population = newPopulation;
    fitnesses = population.map((c) => calculateFitness(c, stats));
    fitnessHistory.push(Math.max(...fitnesses));
  }

  // เลือก top N ที่ unique
  const uniqueMap = new Map<string, { digits: number[]; fitness: number }>();
  population.forEach((c, i) => {
    const key = c.join(',');
    const existing = uniqueMap.get(key);
    if (!existing || fitnesses[i] > existing.fitness) {
      uniqueMap.set(key, { digits: c, fitness: fitnesses[i] });
    }
  });

  const recommendations = Array.from(uniqueMap.values())
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, config.topResults)
    .map((item, i) => ({
      digits: item.digits,
      asString: item.digits.join(''),
      fitness: Number(item.fitness.toFixed(4)),
      rank: i + 1,
    }));

  return {
    recommendations,
    fitnessHistory,
    elapsedMs: Date.now() - startTime,
    configUsed: config,
  };
}

// ============================================================
// Helper: แปลง string เลข เช่น "47" → [4, 7]
// ============================================================

export function digitsFromString(s: string): number[] {
  return s.split('').map((c) => parseInt(c, 10)).filter((n) => !isNaN(n));
}

export function stringFromDigits(d: number[]): string {
  return d.join('');
}
