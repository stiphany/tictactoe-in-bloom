# Tic-Tac-Toe in Bloom 🌸

Every legal game of tic-tac-toe — all **255,168** of them — grown into one interactive dahlia-mandala. The empty board sits at the center as a golden lattice; each ring outward holds every position reachable in that many moves, spaced evenly like rows of petals. Blue stems are X's moves, pink are O's, and where two move orders arrive at the same position the strands fuse lilac. A golden vine ramps from amber to champagne toward the fastest possible finish.

**Live version:** https://claude.ai/code/artifact/677a495b-4084-495c-9d7b-bb34164ac75b

No build, no dependencies: it is one self-contained `index.html`. Open it in any browser.

## The graph

| | full | folded (8 symmetries) |
|---|---|---|
| positions | 5,478 | 765 |
| moves (edges) | 16,167 | 2,096 |
| complete games | 255,168 | 255,168 (via edge multiplicities) |
| endings | 958 (626 X · 316 O · 16 draws) | 138 |

Under perfect play the game is a draw in 9 moves; the built-in bot plays that minimax line (fastest win, longest resistance) and cannot lose.

## Interacting

- **Hover** any blossom for its board and live odds; **click** to replant the flower at that position
- **Play on the board** in the side panel — hovering a square lights up its branch
- **🤖 opponent** — let the perfect bot play O (or X, it opens)
- **✿ let it play** — watch a random game unfold petal by petal
- **Tour** ◀ ▶ (or arrow keys) — six curated stops through the garden
- **Fold symmetries** — collapse the 5,478 positions to 765 canonical blossoms
- Scroll to zoom, drag to pan, `c` or double-click to recenter, `esc` to step back a move
- The URL hash tracks your moves (`#0314`), so positions are shareable links

There are a few things hidden in the night sky. Pisces knows where.

## Tests

`node test/smoke.js` runs the headless suite: graph counts against the classical values, ring-layout symmetry, navigation, fold-mode path counting, and 120 simulated games proving the bot never loses.

---

MIT licensed. Grown with love, from S₀ to S₉ ♥
