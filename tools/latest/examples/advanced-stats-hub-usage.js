import { getAdvancedStatsHub } from '../src/spartans-website-api.js';
import { renderShotChart } from '../src/shot-chart-renderer.js';

const data = await fetch('/data/spartans-data.json').then(r => r.json());

const advanced = getAdvancedStatsHub(data, {
  seasonId: '2026-S2',
  gameId: 'ALL',
  half: 'ALL',
  view: 'team',
  player: 'ALL',
  mode: 'perGame'
});

console.log('Overview', advanced.tabs.overview);
console.log('Advanced box score', advanced.tabs.advanced_box_score.rows);
console.log('Scoring leaders', advanced.tabs.player_leaderboards?.scoring);

renderShotChart(document.getElementById('shot-chart'), advanced.tabs.shot_chart_quality.shot_chart, {
  showHeatZones: true,
  showRegionLabels: true,
  interactive: true
});
