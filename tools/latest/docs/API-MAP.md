# API Map

## Game page

```js
getGamePageTabs(data, { seasonId, gameId, half, player })
```

Returns:

- `tabs.overview`
- `tabs.advanced_box_score`
- `tabs.stat_leaders`
- `tabs.team_summary`
- `tabs.shot_chart_quality`
- `tabs.team_advanced_stats`

## Player page

```js
getPlayerPageTabs(data, { player, seasonId, gameId, half })
```

Returns:

- `tabs.scoring`
- `tabs.creation_passing`
- `tabs.screening`
- `tabs.rebounding_defense`
- `tabs.lineup_impact`

## Homepage Advanced Stats hub

```js
getAdvancedStatsHub(data, { seasonId, gameId, half, view, player, mode })
```

Returns:

- `tabs.overview`
- `tabs.advanced_box_score`
- `tabs.player_leaderboards`
- `tabs.team_advanced_stats`
- `tabs.shot_chart_quality`
- `tabs.creation_passing`
- `tabs.screening`
- `tabs.rebounding_defense`
- `tabs.lineup_impact`

## Shot chart rendering

```js
import { renderShotChart } from './src/shot-chart-renderer.js';
renderShotChart(document.getElementById('chart'), advanced.tabs.shot_chart_quality.shot_chart, {
  showHeatZones: true,
  showRegionLabels: true,
  interactive: true
});
```
