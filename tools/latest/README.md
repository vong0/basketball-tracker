# Spartans Basketball Stats Core v0.5.7

This package is for using Manny's tracker stats on a free GitHub Pages / Vite website without rebuilding the tracker UI.

Use these files:

- `data/spartans-data.json` — current tracker data.
- `src/spartans-website-api.js` — friendly website functions for Game pages, Player pages, and the Advanced Stats hub.
- `src/spartans-stats-core.js` — lower-level stat calculations.
- `src/shot-chart-renderer.js` — SVG FIBA shot chart renderer.
- `index.html` — standalone tracker copy with the Advanced Stats tab mockup.

## Quick usage

```js
import { getAdvancedStatsHub, getGamePageTabs, getPlayerPageTabs } from './src/spartans-website-api.js';

const data = await fetch('/data/spartans-data.json').then(r => r.json());

const advanced = getAdvancedStatsHub(data, {
  seasonId: '2026-S2',
  gameId: 'ALL',
  half: 'ALL',
  view: 'team',      // team, players, player
  player: 'ALL',
  mode: 'perGame'    // perGame or totals
});

console.log(advanced.tabs.overview);
console.log(advanced.tabs.advanced_box_score.rows);
```

See `docs/ADVANCED-STATS-HUB.md` for the full rundown.
