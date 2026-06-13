# Integration notes for the existing React/Vite site

Do not touch the existing video clip page yet. Build this as portable code first.

The uploaded site is a React/Vite frontend. The clean integration path later is:

```text
src/lib/basketballStats/        <- copy the stat engine here
src/components/stats/           <- React stat cards/tables/shot chart
public/data/basketball-data.json <- JSON data export from the tracking frontend
```

Then pages can do:

```js
import { calculatePlayerStats, calculateTeamStats } from './lib/basketballStats/basketballStats.js';

const playerStats = calculatePlayerStats(data, {
  player: selectedPlayer,
  gameId: selectedGame
});
```

Recommended future pages/sections:

```text
Games
  - game cards
  - game report
  - team box score
  - team advanced stats
  - lineup impact
  - FIBA shot chart
  - clips

Players
  - player profile/hero
  - box score style season averages
  - advanced stats section
  - shot chart with FIBA geometry
  - zone breakdown
  - contest breakdown
  - game log
  - clips

Opponents
  - opponent profile
  - game history
  - tendencies
  - best/worst actions against them

Strategies
  - team strategies
  - opponent-specific strategies
  - linked clips
```

Data should live in JSON first. Excel export stays optional.
