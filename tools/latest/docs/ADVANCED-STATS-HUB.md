# Advanced Stats Hub API

The Advanced Stats hub is the homepage-level analytics page. It is not locked to a game page or a player page. It lets the website compare team and player stats across a season, all games, one game, one half, or one player.

## Function

```js
import { getAdvancedStatsHub } from './src/spartans-website-api.js';

const advanced = getAdvancedStatsHub(data, {
  seasonId: '2026-S2',
  gameId: 'ALL',      // 'ALL' or '2026-S2 G2'
  half: 'ALL',        // 'ALL', '1H', '2H', 'OT'
  view: 'team',       // 'team', 'players', 'player'
  player: 'ALL',      // player name when view is 'player'
  mode: 'perGame'     // 'perGame' or 'totals'
});
```

## Average / total rule

When `mode: 'perGame'` and `gameId: 'ALL'`, the API marks titles with ` (averages)` and counting stats return:

```js
{
  total: 37,
  per_game: 18.5,
  main: 18.5,
  secondary: '37 total'
}
```

When `mode: 'totals'`, counting stats return:

```js
{
  total: 37,
  per_game: 18.5,
  main: 37,
  secondary: '18.5/g'
}
```

Percentages and rates stay percentages. They are not averaged by adding percentages together; they are calculated from the filtered makes/attempts or events.

## Tabs returned

### `tabs.overview`

Use this for top cards on the Advanced Stats homepage.

Includes:

- scope label
- game count
- scoring/efficiency KPI objects
- creation/passing KPI objects
- screening KPI objects
- rebounding/defense KPI objects
- leader cards

### `tabs.advanced_box_score`

Matches the tracker Advanced Stats table style.

Rows include:

- `player`
- `GP`
- `values.PTS`
- `Usage_pct`
- `FG`
- `threePoint`
- `FT`
- `TS_pct`
- `values.AST`
- `values.Extra_Potential_AST`
- `values.Created_Paint_Touch_Drive_Kick_Adv`
- `values.Screen_ADV_OPP_AST`
- `values.OR`, `values.DR`
- `values.STL`, `values.BLK`, `values.Deflections`
- `values.TOV`
- `AST_TO`
- `Bad_Shot_Rate_pct`
- `plus_minus`

### `tabs.player_leaderboards`

Hidden/null when `view: 'player'`. Otherwise includes:

- `scoring`
- `creation_passing`
- `screening`
- `rebounding_defense`

Each row uses the same objects as advanced box score rows, so the website can sort/render consistently.

### `tabs.team_advanced_stats`

Shows grouped stats for whichever scope is selected:

- Team view: team totals/averages.
- Player view: selected player's totals/averages.

Groups:

- `scoring_efficiency`
- `creation_passing`
- `screening`
- `rebounding_defense`

### `tabs.shot_chart_quality`

Includes everything needed for the shot chart page:

- `shot_chart` — pass this into `renderShotChart`
- `zone_breakdown`
- `contest_breakdown`
- `shot_quality_summary`

### `tabs.creation_passing`, `tabs.screening`, `tabs.rebounding_defense`

These adapt to the selected view.

- `view: 'team'` returns team summary objects.
- `view: 'player'` returns selected-player summary objects.
- `view: 'players'` returns ranked player rows.

### `tabs.lineup_impact`

Returns the filtered lineup table. For player-specific lineup impact, use `getPlayerPageTabs(...).tabs.lineup_impact`.
