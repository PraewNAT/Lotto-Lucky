/**
 * Backtest: ทดสอบความแม่นยำของ GA lottery predictor
 *
 * Train: ปี 2564–2567 (BE)
 * Test : ปี 2568–2569 (BE)
 * Science: คณิตศาสตร์ เท่านั้น (ไม่ใช้ user input)
 *
 * run: node scripts/evaluate.mjs
 */

const BASE = "https://lotto.api.rayriffy.com";
const TRAIN_YEARS = [2550,2551,2552,2553,2554,2555,2556,2557,2558,2559,2560];
const TEST_YEARS  = [2561,2562,2563,2564,2565,2566,2567,2568,2569];

// ───────────────────────────────────────────────
// API helpers
// ───────────────────────────────────────────────

const THAI_MONTHS = {
  มกราคม:1,กุมภาพันธ์:2,มีนาคม:3,เมษายน:4,พฤษภาคม:5,มิถุนายน:6,
  กรกฎาคม:7,สิงหาคม:8,กันยายน:9,ตุลาคม:10,พฤศจิกายน:11,ธันวาคม:12,
};

function idToIso(id) {
  const dd = id.slice(0,2), mm = id.slice(2,4), by = +id.slice(4,8);
  const cy = by - 543;
  return `${cy}-${mm}-${dd}`;
}

function parseThaiDate(s) {
  const p = s.trim().split(/\s+/);
  if (p.length < 3) return null;
  const day = +p[0], month = THAI_MONTHS[p[1]], by = +p[p.length-1];
  if (!day||!month||isNaN(by)) return null;
  const cy = by - 543;
  return `${cy}-${month.toString().padStart(2,"0")}-${day.toString().padStart(2,"0")}`;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { "User-Agent": "EvalScript/1.0" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

async function fetchAllIds() {
  const ids = [];
  for (let page = 1; page <= 20; page++) {
    const d = await fetchJSON(`${BASE}/list/${page}`);
    const batch = (d.response || []).map(x => x.id).filter(id => /^\d{8}$/.test(id));
    if (!batch.length) break;
    ids.push(...batch);
    await sleep(80);
  }
  return ids;
}

async function fetchDraw(id) {
  try {
    const isoDate = idToIso(id);
    const d = await fetchJSON(`${BASE}/lotto/${id}`);
    const r = d.response;
    if (!r) return null;
    const find = (arr, key) => (arr||[]).find(p=>p.id===key)?.number??[];
    const first   = find(r.prizes,"prizeFirst")[0] ?? "";
    const front3  = find(r.runningNumbers,"runningNumberFrontThree");
    const back3   = find(r.runningNumbers,"runningNumberBackThree");
    const back2   = find(r.runningNumbers,"runningNumberBackTwo")[0] ?? "";
    if (!first && !back2) return null;
    const date = isoDate || (r.date ? parseThaiDate(r.date) : null) || "";
    return { date, prizes: { first, front3, back3, back2 } };
  } catch { return null; }
}

// ───────────────────────────────────────────────
// GA engine (ported from lib/lotteryGA.ts)
// ───────────────────────────────────────────────

function makeRng(seed) {
  if (seed === undefined) return Math.random;
  let state = seed >>> 0;
  return function() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) { return Math.floor(rng()*(max-min+1))+min; }

function analyzeHistory(history, digitCount, recencyWeighting) {
  const positionFreq = Array.from({length:digitCount}, ()=>new Array(10).fill(0));
  const globalFreq   = new Array(10).fill(0);
  const sums = [];
  let evenCount=0, totalDigits=0;

  const sorted = [...history].sort((a,b)=>{
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return ta-tb;
  });
  const n = sorted.length;

  sorted.forEach((entry, idx) => {
    if (entry.digits.length !== digitCount) return;
    const w = recencyWeighting ? 0.3 + 0.7*(idx/Math.max(n-1,1)) : 1;
    let sum=0;
    entry.digits.forEach((d,pos) => {
      if (d<0||d>9) return;
      positionFreq[pos][d]+=w;
      globalFreq[d]+=w;
      sum+=d;
      if (d%2===0) evenCount+=w;
      totalDigits+=w;
    });
    sums.push(sum);
  });

  const meanSum = sums.length ? sums.reduce((a,b)=>a+b,0)/sums.length : 0;
  const variance = sums.length ? sums.reduce((a,s)=>a+(s-meanSum)**2,0)/sums.length : 0;
  const stdSum = Math.sqrt(variance);
  const recentSet = new Set(sorted.slice(-10).map(e=>e.digits.join(",")));
  return { positionFreq, globalFreq, sumStats:{mean:meanSum,std:stdSum||1}, evenRatio:totalDigits>0?evenCount/totalDigits:0.5, sampleSize:sorted.length, recentSet };
}

function calculateFitness(chromosome, stats) {
  const w = { position:0.45, sum:0.25, parity:0.15, novelty:0.15 };
  let posScore=0, maxPos=0;
  chromosome.forEach((d,pos) => {
    posScore += stats.positionFreq[pos][d]||0;
    maxPos   += Math.max(...stats.positionFreq[pos])||1;
  });
  posScore = maxPos>0 ? posScore/maxPos : 0;
  const sum = chromosome.reduce((a,b)=>a+b,0);
  const z = Math.abs(sum-stats.sumStats.mean)/stats.sumStats.std;
  const sumScore = Math.exp(-(z*z)/2);
  const evenInC = chromosome.filter(d=>d%2===0).length/chromosome.length;
  const parityScore = 1-Math.abs(evenInC-stats.evenRatio);
  const noveltyScore = stats.recentSet.has(chromosome.join(",")) ? 0 : 1;
  return w.position*posScore + w.sum*sumScore + w.parity*parityScore + w.novelty*noveltyScore;
}

function createRandom(digitCount, rng) {
  return Array.from({length:digitCount},()=>randInt(rng,0,9));
}

function tournamentSelect(population, fitnesses, k, rng) {
  let best = randInt(rng,0,population.length-1);
  for (let i=1;i<k;i++) {
    const idx = randInt(rng,0,population.length-1);
    if (fitnesses[idx]>fitnesses[best]) best=idx;
  }
  return [...population[best]];
}

function crossover(p1,p2,rng) {
  if (p1.length<2) return [[...p1],[...p2]];
  const pt = randInt(rng,1,p1.length-1);
  return [[...p1.slice(0,pt),...p2.slice(pt)],[...p2.slice(0,pt),...p1.slice(pt)]];
}

function mutate(c,rate,rng) { return c.map(d=>rng()<rate?randInt(rng,0,9):d); }

function runGA(input) {
  const cfg = {
    populationSize:100, generations:50, mutationRate:0.1,
    crossoverRate:0.8, elitismCount:2, topResults:5,
    recencyWeighting:true, ...input.config
  };
  const rng = makeRng(cfg.seed);

  if (!input.history||input.history.length===0) {
    return { recommendations:Array.from({length:cfg.topResults},(_,i)=>({
      digits:createRandom(input.digitCount,rng),
      asString:"",fitness:0,rank:i+1
    })), fitnessHistory:[] };
  }

  const stats = analyzeHistory(input.history, input.digitCount, cfg.recencyWeighting);
  let population = Array.from({length:cfg.populationSize},()=>createRandom(input.digitCount,rng));
  let fitnesses  = population.map(c=>calculateFitness(c,stats));

  for (let gen=0;gen<cfg.generations;gen++) {
    const indexed = population.map((c,i)=>({c,f:fitnesses[i]}));
    indexed.sort((a,b)=>b.f-a.f);
    const next = [];
    for (let i=0;i<cfg.elitismCount&&i<indexed.length;i++) next.push([...indexed[i].c]);
    while (next.length<cfg.populationSize) {
      const p1=tournamentSelect(population,fitnesses,3,rng);
      const p2=tournamentSelect(population,fitnesses,3,rng);
      let c1,c2;
      if (rng()<cfg.crossoverRate) [c1,c2]=crossover(p1,p2,rng);
      else [c1,c2]=[p1,p2];
      next.push(mutate(c1,cfg.mutationRate,rng));
      if (next.length<cfg.populationSize) next.push(mutate(c2,cfg.mutationRate,rng));
    }
    population=next;
    fitnesses=population.map(c=>calculateFitness(c,stats));
  }

  const map = new Map();
  population.forEach((c,i)=>{
    const key=c.join(",");
    const ex=map.get(key);
    if (!ex||fitnesses[i]>ex.fitness) map.set(key,{digits:c,fitness:fitnesses[i]});
  });
  const recs = Array.from(map.values())
    .sort((a,b)=>b.fitness-a.fitness).slice(0,cfg.topResults)
    .map((item,i)=>({digits:item.digits,asString:item.digits.join(""),fitness:+item.fitness.toFixed(4),rank:i+1}));
  return { recommendations:recs };
}

// ───────────────────────────────────────────────
// Prediction helpers
// ───────────────────────────────────────────────

function predictBack2GA(draws, topN=5) {
  const history = draws
    .filter(d=>/^\d{2}$/.test(d.prizes.back2))
    .map(d=>({ digits:d.prizes.back2.split("").map(Number), date:d.date }));
  if (history.length<5) return [];
  const result = runGA({ digitCount:2, history, config:{populationSize:80,generations:50,topResults:topN} });
  return result.recommendations.map(r=>r.asString);
}

function predictBack2Baseline(draws, topN=5) {
  // gap-based (random-ish baseline)
  const freq   = new Array(100).fill(0);
  const lastSeen = new Array(100).fill(null);
  for (const d of draws) {
    if (!/^\d{2}$/.test(d.prizes.back2)) continue;
    const b2 = parseInt(d.prizes.back2);
    freq[b2]++;
    if (!lastSeen[b2]||d.date>lastSeen[b2]) lastSeen[b2]=d.date;
  }
  const total = freq.reduce((a,b)=>a+b,0)||1;
  const scored = freq.map((f,idx)=>{
    const ls = lastSeen[idx];
    const days = ls ? (Date.now()-new Date(ls).getTime())/86400000 : 9999;
    const gap = Math.min(1, days/365);
    const rarity = 1-f/total*100;
    return { idx, score:(rarity*0.4+gap*0.6)*100 };
  });
  scored.sort((a,b)=>b.score-a.score);
  return scored.slice(0,topN).map(s=>s.idx.toString().padStart(2,"0"));
}

// ───────────────────────────────────────────────
// Math score for 6-digit (ported from lib/lottery.ts mathScore)
// ───────────────────────────────────────────────

function digitSum(num) { return num.split("").reduce((a,c)=>a+Number(c),0); }

function mathScore(num) {
  const digits = num.split("").map(Number);
  const counts = {};
  digits.forEach(d=>(counts[d]=(counts[d]||0)+1));
  const max = Math.max(...Object.values(counts));
  const unique = Object.keys(counts).length;
  const diversity = unique>=4 ? 25 : unique*5;
  const repeatPenalty = max>=5?-20:max===4?-8:0;
  const sum = digitSum(num);
  const sumScore = 25-Math.min(25,Math.abs(sum-27));
  return Math.max(0,Math.min(100, 30+diversity+repeatPenalty+sumScore));
}

function generatePool6(trainDraws, poolSize=15) {
  // GA evolve 6-digit pool from prizes.first history
  const history = trainDraws
    .filter(d=>/^\d{6}$/.test(d.prizes.first))
    .map(d=>({ digits:d.prizes.first.split("").map(Number), date:d.date }));

  let pool = [];
  if (history.length>=5) {
    const ga = runGA({ digitCount:6, history, config:{ populationSize:80, generations:40, topResults:poolSize } });
    pool = ga.recommendations.map(r=>r.asString.padStart(6,"0"));
  }
  // fill to poolSize with random
  const seen = new Set(pool);
  while (pool.length<poolSize) {
    const n = Math.floor(Math.random()*1000000).toString().padStart(6,"0");
    if (!seen.has(n)) { seen.add(n); pool.push(n); }
  }
  // rank by math score
  pool.sort((a,b)=>mathScore(b)-mathScore(a));
  return pool;
}

// ───────────────────────────────────────────────
// Main evaluation
// ───────────────────────────────────────────────

async function main() {
  console.log("📥 กำลังดึงข้อมูลจาก API...\n");

  const allIds = await fetchAllIds();
  const year = id => +id.slice(-4);

  const trainIds = allIds.filter(id=>TRAIN_YEARS.includes(year(id)));
  const testIds  = allIds.filter(id=>TEST_YEARS.includes(year(id))).reverse(); // เรียงเก่า→ใหม่

  console.log(`Train IDs: ${trainIds.length}  |  Test IDs: ${testIds.length}\n`);
  console.log("📥 ดึงรายละเอียดแต่ละงวด (อาจใช้เวลา 1-2 นาที)...\n");

  async function fetchBatch(ids) {
    const draws = [];
    for (let i=0;i<ids.length;i++) {
      const d = await fetchDraw(ids[i]);
      if (d) draws.push(d);
      if ((i+1)%10===0) process.stdout.write(`  ดึงมาแล้ว ${i+1}/${ids.length}\r`);
      await sleep(60);
    }
    return draws;
  }

  const trainDraws = await fetchBatch(trainIds);
  console.log(`\n✅ Train draws: ${trainDraws.length}`);
  const testDraws  = await fetchBatch(testIds);
  console.log(`✅ Test draws:  ${testDraws.length}\n`);

  // ─── Evaluation 1: predictNext (back2) ───
  console.log("═══════════════════════════════════════════");
  console.log("📊 ผล Evaluation 1: ทำนายเลขท้าย 2 ตัว");
  console.log("   (GA vs Baseline gap-based vs Random)");
  console.log("═══════════════════════════════════════════\n");

  const TOPN = 5;
  let gaHit1=0, gaHit3=0, gaHit5=0;
  let blHit1=0, blHit3=0, blHit5=0;
  let rnHit5=0;

  const rows = [];

  for (const testDraw of testDraws) {
    if (!/^\d{2}$/.test(testDraw.prizes.back2)) continue;
    const actual = testDraw.prizes.back2;

    // ใช้ train draws เท่านั้น (static split)
    const gaTop5 = predictBack2GA(trainDraws, TOPN);
    const blTop5 = predictBack2Baseline(trainDraws, TOPN);
    const rnTop5 = Array.from({length:TOPN},()=>Math.floor(Math.random()*100).toString().padStart(2,"0"));

    if (gaTop5[0]===actual) gaHit1++;
    if (gaTop5.slice(0,3).includes(actual)) gaHit3++;
    if (gaTop5.includes(actual)) gaHit5++;
    if (blTop5[0]===actual) blHit1++;
    if (blTop5.slice(0,3).includes(actual)) blHit3++;
    if (blTop5.includes(actual)) blHit5++;
    if (rnTop5.includes(actual)) rnHit5++;

    rows.push({
      date: testDraw.date,
      actual,
      gaPred: gaTop5.join(" "),
      gaHit: gaTop5.includes(actual) ? "✅" : "—",
      blPred: blTop5.join(" "),
      blHit: blTop5.includes(actual) ? "✅" : "—",
    });
  }

  const n = rows.length;
  const pct = x => `${((x/n)*100).toFixed(1)}%`;
  const expected5 = (5/100*100).toFixed(1)+"%";

  console.log(`งวดทดสอบทั้งหมด: ${n} งวด\n`);
  console.log("┌─────────────────┬────────────┬────────────┬────────────┐");
  console.log("│ Metric          │ GA         │ Baseline   │ Random     │");
  console.log("│                 │            │ (gap-based)│ (expected) │");
  console.log("├─────────────────┼────────────┼────────────┼────────────┤");
  console.log(`│ Hit rate @top1  │ ${pct(gaHit1).padEnd(10)} │ ${pct(blHit1).padEnd(10)} │ 1.0%       │`);
  console.log(`│ Hit rate @top3  │ ${pct(gaHit3).padEnd(10)} │ ${pct(blHit3).padEnd(10)} │ 3.0%       │`);
  console.log(`│ Hit rate @top5  │ ${pct(gaHit5).padEnd(10)} │ ${pct(blHit5).padEnd(10)} │ ${expected5.padEnd(10)} │`);
  console.log("└─────────────────┴────────────┴────────────┴────────────┘");

  console.log("\n📋 รายละเอียดทุกงวด:");
  console.log("┌────────────┬────────┬──────────────────────┬──────┬──────────────────────┬──────┐");
  console.log("│ วันที่     │ จริง  │ GA top5              │ Hit  │ Baseline top5        │ Hit  │");
  console.log("├────────────┼────────┼──────────────────────┼──────┼──────────────────────┼──────┤");
  for (const r of rows) {
    const dt = r.date.slice(5);
    console.log(`│ ${dt.padEnd(10)} │  ${r.actual}   │ ${r.gaPred.padEnd(20)} │ ${r.gaHit.padEnd(4)} │ ${r.blPred.padEnd(20)} │ ${r.blHit.padEnd(4)} │`);
  }
  console.log("└────────────┴────────┴──────────────────────┴──────┴──────────────────────┴──────┘");

  // ─── Evaluation 2: generateRank (6-digit, math only) ───
  console.log("\n═══════════════════════════════════════════");
  console.log("📊 ผล Evaluation 2: สุ่มเลข 6 หลัก (math science)");
  console.log("   ตรวจว่า back2/back3/front3 ของชุดที่สุ่ม ตรงกับงวดจริงไหม");
  console.log("═══════════════════════════════════════════\n");

  const POOL = 5;
  let b2Hit=0, b3Hit=0, f3Hit=0;
  let b2RndHit=0, b3RndHit=0, f3RndHit=0;

  const rows2 = [];

  for (const testDraw of testDraws) {
    const actual = { b2: testDraw.prizes.back2, b3: testDraw.prizes.back3, f3: testDraw.prizes.front3 };
    const pool = generatePool6(trainDraws, POOL);
    const rndPool = Array.from({length:POOL},()=>Math.floor(Math.random()*1000000).toString().padStart(6,"0"));

    const poolB2 = pool.map(n=>n.slice(-2));
    const poolB3 = pool.map(n=>n.slice(-3));
    const poolF3 = pool.map(n=>n.slice(0,3));
    const rndB2  = rndPool.map(n=>n.slice(-2));
    const rndB3  = rndPool.map(n=>n.slice(-3));
    const rndF3  = rndPool.map(n=>n.slice(0,3));

    const hitB2 = poolB2.includes(actual.b2);
    const hitB3 = poolB3.some(x=>actual.b3.includes(x));
    const hitF3 = poolF3.some(x=>actual.f3.includes(x));

    if (hitB2) b2Hit++;
    if (hitB3) b3Hit++;
    if (hitF3) f3Hit++;
    if (rndB2.includes(actual.b2)) b2RndHit++;
    if (rndB3.some(x=>actual.b3.includes(x))) b3RndHit++;
    if (rndF3.some(x=>actual.f3.includes(x))) f3RndHit++;

    rows2.push({ date:testDraw.date, pool, hitB2:hitB2?"✅":"—", hitB3:hitB3?"✅":"—", hitF3:hitF3?"✅":"—" });
  }

  const n2 = rows2.length;
  const pct2 = x => `${((x/n2)*100).toFixed(1)}%`;
  const expB2 = (POOL/100*100).toFixed(1)+"%";
  const expB3 = (POOL/1000*100).toFixed(2)+"%";
  const expF3 = (POOL/1000*100).toFixed(2)+"%";

  console.log(`งวดทดสอบทั้งหมด: ${n2} งวด  |  ชุดเลขที่สุ่มต่องวด: ${POOL} ชุด\n`);
  console.log("┌────────────────────────┬────────────┬────────────┬────────────┐");
  console.log("│ Metric                 │ GA+math    │ Random     │ Expected   │");
  console.log("├────────────────────────┼────────────┼────────────┼────────────┤");
  console.log(`│ ท้าย 2 ตรง (1 รางวัล) │ ${pct2(b2Hit).padEnd(10)} │ ${pct2(b2RndHit).padEnd(10)} │ ${expB2.padEnd(10)} │`);
  console.log(`│ ท้าย 3 ตรง (2 รางวัล) │ ${pct2(b3Hit).padEnd(10)} │ ${pct2(b3RndHit).padEnd(10)} │ ~${expB3.padEnd(9)} │`);
  console.log(`│ หน้า 3 ตรง (2 รางวัล) │ ${pct2(f3Hit).padEnd(10)} │ ${pct2(f3RndHit).padEnd(10)} │ ~${expF3.padEnd(9)} │`);
  console.log("└────────────────────────┴────────────┴────────────┴────────────┘");

  console.log("\n⚠️  หมายเหตุ: หวยไทยเป็นการสุ่มจริง ผลลัพธ์ที่ดีกว่า random อาจเกิดจาก chance เท่านั้น");
  console.log("   ไม่ควรใช้ตัดสินใจซื้อหวย — ใช้เพื่อความบันเทิงเท่านั้น\n");
}

main().catch(err => { console.error(err); process.exit(1); });
