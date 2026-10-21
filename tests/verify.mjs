// Checks the abacus logic inside index.html without a browser.
// Run from the repo root:  node tests/verify.mjs
//
// It verifies that:
//  1. every one of the 34 rule lessons only generates problems that truly need that rule,
//  2. every planned bead move is a real single motion (or a valid "together" motion),
//     ends on the right number, and has the right finger and +/- label,
//  3. the general planner used by the Practice tab handles any multi-digit add/subtract.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const js = html.slice(html.indexOf("<script>") + 8, html.indexOf("</script>"));
const slice = (a, b) => js.slice(js.indexOf(a), js.indexOf(b));

// Pull out only the pure logic (no DOM): helpers, rod helpers, rules/lessons, practice generator.
const core =
  slice("const rnd", "const store") +
  slice("// ---------- abacus", "class Abacus") +
  slice("// ---------- technique", "// ---------- progress") +
  slice("function genDrill", "function startDrill");

const api = new Function(core + "; return { LESSONS, RULE_KINDS, toRods, canAdd, canSub, planOp, genDrill };")();
const { LESSONS, RULE_KINDS, toRods, canAdd, canSub, planOp, genDrill } = api;

let failures = 0;
const fail = (...a) => { failures++; if (failures <= 15) console.log("FAIL", ...a); };

function checkSteps(id, start, steps, target, n = 3) {
  let cur = start;
  for (const st of steps) {
    if (st.say) continue;
    const A = toRods(cur, n), B = toRods(st.value, n), diffs = [];
    A.forEach((r, i) => {
      if (r.h !== B[i].h) diffs.push({ i, k: "h", d: B[i].h - r.h });
      if (r.e !== B[i].e) diffs.push({ i, k: "e", d: B[i].e - r.e });
    });
    if (st.together) {
      if (diffs.length !== 2 || diffs[0].i !== diffs[1].i) fail(id, "together move is not on one rod", cur, st.value);
      const h = diffs.find(x => x.k === "h"), e = diffs.find(x => x.k === "e");
      if (st.hand === "index-down" && !(h && e && h.d === 1 && e.d < 0)) fail(id, "five-down/earth-down mismatch", cur, st.value);
      if (st.hand === "pinch-up" && !(h && e && h.d === -1 && e.d > 0)) fail(id, "earth-up/five-up mismatch", cur, st.value);
    } else {
      if (diffs.length !== 1) { fail(id, "step moves more than one bead group", cur, st.value); cur = st.value; continue; }
      const x = diffs[0];
      const finger = x.k === "h" ? (x.d > 0 ? "index-down" : "index-up") : (x.d > 0 ? "thumb-up" : "index-down");
      if (st.hand !== finger) fail(id, "wrong finger", cur, st.value, st.hand, "expected", finger);
      if (st.tag[0] !== (x.d > 0 ? "+" : "−")) fail(id, "wrong sign on label", st.tag);
    }
    cur = st.value;
  }
  if (cur !== target) fail(id, "steps end on", cur, "but answer is", target);
}

// Which ones digits force each kind of rule (tens digit given).
function forced(kind, d, n, tens) {
  const c = 10 - n;
  switch (kind) {
    case "sfAdd": return d + n <= 9 && !canAdd(d, n);
    case "sfSub": return d - n >= 0 && !canSub(d, n);
    case "bfAdd": return d + n >= 10 && canSub(d, c) && canAdd(tens, 1);
    case "bfSub": return d - n < 0 && canAdd(d, c) && canSub(tens, 1);
    case "mxAdd": return d + n >= 10 && !canSub(d, c) && canAdd(tens, 1);
    case "mxSub": return d - n < 0 && !canAdd(d, c) && canSub(tens, 1);
  }
}
const KIND_OF_UNIT = { 1: "sfAdd", 2: "sfSub", 3: "bfAdd", 4: "bfSub", 5: "mxAdd", 6: "mxSub" };

// 1 + 2. Rule lessons
const ruleLessons = LESSONS.filter(l => l.formula);
let problems = 0;
for (const L of ruleLessons) {
  const n = +L.formula.lhs.slice(1), add = L.formula.lhs[0] === "+", kind = KIND_OF_UNIT[L.unit];
  const answer = x => (add ? x + n : x - n);
  checkSteps(L.id + " watch", L.watch.start, L.watch.steps, answer(L.watch.start));
  checkSteps(L.id + " try", L.tryIt.start, L.tryIt.steps, answer(L.tryIt.start));
  for (let i = 0; i < 300; i++) {
    const p = L.gen(); problems++;
    checkSteps(L.id + " practice", p.start, p.steps, p.target);
    if (!forced(kind, p.start % 10, n, Math.floor(p.start / 10))) fail(L.id, "problem does not need this rule:", p.prompt);
  }
  const K = RULE_KINDS[kind];
  for (let d = 0; d <= 9; d++) {
    if (K.digits[n].includes(d) !== forced(kind, d, n, K.tens[0])) fail(L.id, "digit table is wrong for ones digit", d);
  }
}
for (const L of LESSONS.filter(l => l.unit === 0)) for (let i = 0; i < 200; i++) { const p = L.gen(); problems++; checkSteps(L.id, p.start, p.steps, p.target); }

// Unit 7: Rule Mixer and the Rules Champion test
const mixer = LESSONS.find(l => l.id === "7-1"), champ = LESSONS.find(l => l.id === "7-2");
if (!mixer || !champ) fail("Unit 7 lessons are missing");
else {
  for (let i = 0; i < 2000; i++) { const p = mixer.gen(); problems++; checkSteps("7-1", p.start, p.steps, p.target); }
  for (let r = 0; r < 200; r++) {
    champ.start();
    if (champ.queue.length !== 12) fail("7-2", "test should have 12 problems, has", champ.queue.length);
    const hints = new Set();
    for (let i = 0; i < 12; i++) { const p = champ.gen(); problems++; hints.add(p.hint); checkSteps("7-2", p.start, p.steps, p.target); }
    const perUnit = {};
    for (const h of hints) { const no = +h.match(/rule (\d+)/)[1], u = ruleLessons[no - 1].unit; perUnit[u] = (perUnit[u] || 0) + 1; }
    if ([1, 2, 3, 4, 5, 6].some(u => perUnit[u] !== 2)) fail("7-2", "should test two different rules from every unit", JSON.stringify(perUnit));
  }
}

// 3. Practice-tab planner
let ops = 0;
for (const digits of [1, 2, 3]) for (const op of ["add", "sub", "mixed"]) for (const terms of [2, 3, 5, 10]) for (let r = 0; r < 60; r++) {
  const rods = digits + 2, P = genDrill({ op, digits, terms }, rods);
  if (P.totals.some(v => v < 0)) fail("practice", "running total went below zero");
  let cur = 0;
  P.terms.forEach((x, k) => { checkSteps(`practice ${op}`, cur, planOp(cur, k ? x.sign : "+", x.n, rods), P.totals[k], rods); cur = P.totals[k]; ops++; });
}
for (let cur = 0; cur < 1000; cur += 7) for (let k = 1; k <= 99; k++) {
  checkSteps("planner +", cur, planOp(cur, "+", k, 4), cur + k, 4); ops++;
  if (cur >= k) { checkSteps("planner −", cur, planOp(cur, "−", k, 4), cur - k, 4); ops++; }
}

console.log(`Rule lessons: ${ruleLessons.length} (expected 34)`);
console.log(`Lesson problems checked: ${problems}`);
console.log(`Practice operations checked: ${ops}`);
if (ruleLessons.length !== 34) fail("expected 34 rule lessons");
console.log(failures ? `FAILED: ${failures} problem(s)` : "All checks passed.");
process.exit(failures ? 1 : 0);
