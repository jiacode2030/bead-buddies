# Bead Buddies

A website that teaches kids the Japanese abacus (soroban), step by step, with Mochi and Coco, the poodles from the book *Mochi's Counting Machine* by Jiarui Li.

## What's inside

- **Unit 0: Meet the Abacus.** The parts of the soroban, reading left to right, and which finger adds and takes away.
- **Units 1–6: all 34 rules.** Small friends, big friends and mixed friends, for adding and taking away.
- **Every lesson:** learn the rule, watch Mochi demonstrate it (with an animated pointer and hand), try it with Coco, then practice. Wrong moves are explained and the beads snap back.
- **Practice room:** three modes.
  - Step by step on the abacus, with optional hints.
  - Abacus plus a typed answer.
  - Flash anzan (mental math).
- **Practice settings:** adding, taking away or mixed; 1 to 3 digits; a stopwatch; flash speeds.
- **Extras:** narration you can turn off, and progress and best scores saved in the browser.

## Run it

It is a single file with no build step. Open `index.html` in a web browser.

## Check the abacus logic

```
node tests/verify.mjs
```

This checks all 34 rules and the practice problem generator. It needs Node.js 18 or newer.

## Put it online (free)

- **Netlify:** go to app.netlify.com/drop and drag this folder onto the page.
- **GitHub Pages:**
  1. In this repository, open **Settings → Pages**.
  2. Under "Build and deployment", choose **Deploy from a branch**.
  3. Pick the `main` branch and the `/ (root)` folder, then save.
  4. The site appears at `https://<your-username>.github.io/<repo-name>/` after a minute or two.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole website |
| `CLAUDE.md` | Project notes and teaching decisions, read automatically by Claude Code |
| `tests/verify.mjs` | Automated checks for the rules |
