# Bead Buddies: project context for Claude

Read this first. It records what the site is, how it is built, and every teaching decision the owner has made. Follow these decisions unless the owner changes them.

## What this is

Bead Buddies is a website that teaches kids (about ages 6–10) the Japanese abacus (soroban). It is the owner's first coding project. The owner, Jiarui Li, learned the abacus growing up, taught it, hosted competitions, and wrote a children's book about it: *Mochi's Counting Machine* (Amazon). The book's two poodles are the site's characters:

- **Mochi**: white poodle with tan ears and a tan patch around one eye. Mochi is the teacher: explains rules and gives demos.
- **Coco**: brown poodle with a cream muzzle. Coco is the buddy: tries problems with the kid and cheers.

It is a **website, not an app**. It must work well on phones and tablets.

## How it is built

- Everything lives in one file: `index.html` (HTML, CSS and JavaScript together, no build step, no framework, no dependencies).
- The only external resource is the Google Font **Lexend**.
- Progress and settings are saved in the browser with `localStorage` (keys start with `beadbuddies:`). There are no accounts and no server. Keep it that way unless the owner asks: adding logins for kids under 13 brings COPPA obligations.
- The page is written to be dropped into a host as-is (Netlify, GitHub Pages). It has no `<html>`/`<head>` wrapper of its own because it was first published as a claude.ai artifact; browsers handle that fine. If you add a proper wrapper, include `<meta charset="utf-8">` and the viewport meta.

### Map of `index.html`

| Area | What to look for |
|---|---|
| Styles | Design tokens in `:root` at the top of `<style>`. Single light theme on purpose. |
| Sound and voice | `sfx`, `speak()`, `spoken()` (turns display text into natural speech), `bestVoice()` (prefers "Natural"/neural voices), voice picker. |
| Characters | `PUPS`, `poodle()`, `duo()`: inline SVG Mochi and Coco. |
| Abacus | `class Abacus`: any number of rods (`setRods(n)`), tap handling, highlight (gold beads), `lock()`. `toRods(v, n)`, `rodNames(n)`. |
| Technique engine | `canAdd`, `canSub`, `moveSteps()` (direct moves, rod by rod, five bead first), `together()` (two-group "friend" motions), `planOp()` (plans any multi-digit add/subtract using the 34 rules; used by Practice). |
| The 34 rules | `RULE_KINDS` (formula, steps, explanations, and the ones-digit tables that force each rule), `RULE_UNITS`, `buildRuleLessons()`. |
| Curriculum | `UNITS`, `LESSONS` (Unit 0 lessons are written by hand; Units 1–6 are generated). `ALL_UNLOCKED = true`. |
| Lesson flow | `go()`, `renderRule`, `renderWatch` + `playSteps` (demo), `renderTry`, practice (`nextProblem`, `pracChanged`, `finish`). |
| Coaching | `moveFeedback()` decides what a wrong move was; `handleMistake()` shows the message and snaps the beads back. |
| Pointer and hand | `pointAt()` (gold fingertip that glides to the bead), `setHand()` (animated hand card). |
| Practice tab | `DRILL_DEFAULT`, `renderSetup`, `genDrill`, `startDrill`, step-by-step (`drillChanged`), typed answer (`checkTyped`), flash anzan (`runFlash`), `finishDrill`. |

## Curriculum (current)

- **Unit 0: Meet the Abacus**: 0.1 Meet the soroban (parts, beam, five bead, earth beads, ones rod with the dot, read left to right). 0.2 Thumb and index finger (basic one-digit adding and taking away, **no rules**). 0.3 Bigger numbers. 0.4 Adding (direct, multi-digit). 0.5 Taking away (direct).
- **Unit 1**: Small friends adding, rules 1–4: `+n = +5 −(5−n)`
- **Unit 2**: Small friends taking away, rules 5–8: `−n = +(5−n) −5`
- **Unit 3**: Big friends adding, rules 9–17: `+n = −(10−n) +10`
- **Unit 4**: Big friends taking away, rules 18–26: `−n = −10 +(10−n)`
- **Unit 5**: Mixed friends adding, rules 27–30: `+n = +(n−5) −5 +10`
- **Unit 6**: Mixed friends taking away, rules 31–34: `−n = −10 +5 −(n−5)`

Every lesson has four steps: **Learn the rule → Watch Mochi → Try with Coco → Practice** (5 problems, up to 3 stars).

## Teaching rules (owner's decisions: keep these)

1. **Always work left to right**, rod by rod. Exception: a big-friend *adding* rule works on the ones rod first, then adds 10 on the tens rod. Big-friend *taking away* takes 10 from the tens rod first, then adds on the ones rod.
2. **Fingers**: thumb pushes earth beads **up**. Index finger pulls earth beads **down** and moves the five bead (down adds 5, up takes away 5). Every move is labeled with its sign and finger, e.g. `+2 · Thumb`, `−5 · Index finger`.
3. **Five bead first** for direct moves of 6–9, and for small friends *adding* (`+5 −f`: five bead down, then earth beads down).
4. **Earth beads first** for small friends *taking away* and mixed *adding* (`+f −5`: thumb pushes earth beads up, then index finger lifts the five bead). On a real abacus these are simultaneous; on screen they are one after the other in this order.
5. **Move earth beads in one push.** If 2+ earth beads must move, moving them one at a time is a mistake. (On screen, tapping a bead moves it and every bead between it and the beam.)
6. **Mistakes snap back.** A wrong move shows what went wrong plus the correct motion, then the beads return to the last correct position. Technique slips cost the third star.
7. Practice problems in lessons are shown as equations (`4 + 3 = ?`), and the first number is already set on the abacus so the kid has to use the rule.
8. Problems in the Practice tab are shown worksheet style: **no plus sign for adding, only "−" for taking away**.
9. Running totals never go below zero.
10. Tapping a bead stops narration ("skip the listening"); Watch Mochi has a Skip button.
11. Tone: calm and realistic, not cartoonish. Plain kid-friendly language. No emoji.

## Practice tab

Setup: operation (adding / taking away / mixed), digits (1–3), numbers per problem (2–10), problems per round (5/10/20), then a mode:

- **Step by step** (abacus): numbers appear one at a time; the kid works each on the abacus. Optional hints and coaching. Optional stopwatch.
- **Abacus + answer** (no hints): whole problem shown; work on the abacus; type the answer. Optional stopwatch.
- **Flash anzan** (no abacus): numbers flash one at a time; the setting is seconds per number (3 to 0.5 s); type the answer.

The abacus grows to `digits + 2` rods. Best scores are saved per settings combination.

## Testing

- `node tests/verify.mjs` checks the rule tables, every generated lesson problem, and the Practice planner (~50,000 cases). Run it after any change to the technique engine or rules. It must print "All checks passed."
- After UI changes, open `index.html` in a browser and click through: a Unit 0 lesson, one rule from each unit, and each Practice mode. Check the phone width too (about 390px).
- The owner has asked that changes are tested before they are shared.

## Ideas the owner wants next (roadmap)

1. Rule Mixer: mixed practice across all 34 rules, ending with a "Rules Champion" test and badge.
2. Checkpoint "Do you know your times tables?" with a quick quiz; times-table lessons for kids who need them.
3. Multiplication and division on the abacus, using the same lesson flow.
4. A more human voice: pre-recorded clips (the owner's own voice or generated with a TTS service) with the browser voice as fallback.
5. Launch on Netlify or GitHub Pages; optional custom domain.
