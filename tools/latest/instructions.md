-----Prompt 1-----

Yes. The clean way is: give him the full API package, but tell him to mainly use one file: src/spartans-website-api.js.

Use this package:

Download full API package v0.5.7

What each file is for
1. data/spartans-data.json

This is your actual tracker data.

It contains the raw stuff:

games
players / roster
shots
events
free throws
lineup stints
seasons
team info

This is the only stats data file he needs right now.

Later, he can add separate manual JSONs for:

player bios`
opponent notes
strategies
website-only notes

But for stats, this one JSON is enough.

2. src/spartans-website-api.js

This is the main file your friend should use.

It turns your raw tracker JSON into ready-to-render page objects.

He should import from here:

import {
  getWebsiteIndex,
  getGamePageTabs,
  getPlayerPageTabs,
  getAdvancedStatsHub
} from './src/spartans-website-api.js';

This file is basically the bridge between your tracker and his website.

3. src/spartans-stats-core.js

This is the lower-level calculation engine.

It has the actual stat logic:

FG%
3PT%
FT%
TS%
Usage%
AST/TO
screen creation
paint touch creation
drive kick creation
rebounds
defense
shot quality
zone breakdown
contest breakdown
lineup stats
needs attention
half splits

He does not need to use this directly most of the time.

But it is there if he wants lower-level functions like:

import {
  getTeamStats,
  getPlayerStats,
  getShotChartData,
  getZoneBreakdown,
  getContestBreakdown
} from './src/spartans-stats-core.js';
4. src/shot-chart-renderer.js

This renders the actual court/shot chart.

It takes a shot_chart object from the API and draws the SVG.

Example:

import { renderShotChart } from './src/shot-chart-renderer.js';

renderShotChart(
  document.getElementById('shot-chart'),
  advanced.tabs.shot_chart_quality.shot_chart,
  {
    showHeatZones: true,
    showRegionLabels: true,
    interactive: true
  }
);

This handles:

court drawing
made/miss markers
heat zones
region labels
clickable shot popup
click empty court to clear popup
5. src/tracker-app.js and src/styles.css

These are mostly for the tracker itself.

He probably does not need these for his website unless he wants to copy tracker/report styling.

For his site, he mainly needs:

spartans-website-api.js
spartans-stats-core.js
shot-chart-renderer.js
spartans-data.json
How he should set it up

In his repo, put it roughly like this:

his-website/
  src/
    spartans/
      spartans-website-api.js
      spartans-stats-core.js
      shot-chart-renderer.js

  public/
    data/
      spartans-data.json

Then in React/Vite:

import {
  getWebsiteIndex,
  getGamePageTabs,
  getPlayerPageTabs,
  getAdvancedStatsHub
} from './spartans/spartans-website-api.js';

const data = await fetch('/data/spartans-data.json').then(r => r.json());

If GitHub Pages/Vite has a base path issue, he may need:

const data = await fetch(`${import.meta.env.BASE_URL}data/spartans-data.json`).then(r => r.json());
Main functions
1. getWebsiteIndex(data)

Use this for the site landing page / menus.

const index = getWebsiteIndex(data);

Returns:

{
  team,
  seasons,
  games,
  players,
  opponents,
  strategies
}

Use it for:

homepage links
players list
games list
season dropdowns
opponent pages
strategy pages
2. getGamePageTabs(data, filters)

Use this when someone clicks into a game.

const gamePage = getGamePageTabs(data, {
  seasonId: '2026-S2',
  gameId: '2026-S2 G2',
  half: 'ALL',
  player: 'ALL'
});

Returns:

gamePage.tabs.overview
gamePage.tabs.advanced_box_score
gamePage.tabs.stat_leaders
gamePage.tabs.team_summary
gamePage.tabs.shot_chart_quality
gamePage.tabs.team_advanced_stats
gamePage.tabs.overview

Use this for the first game tab.

Has:

game title
score / opponent
leader cards
game story cards
needs attention
half splits
team control dashboard
gamePage.tabs.advanced_box_score

Use this for the advanced box score.

gamePage.tabs.advanced_box_score.table
gamePage.tabs.advanced_box_score.columns

Rows include:

player
PTS
Usage%
FG
3PT
FT
TS%
AST
TOV
AST/TO
Extra Potential AST
Created Paint Touch/Drive Kick/Adv
Screen ADV/OPP/AST
OR
DR
STL
BLK
Deflections
Bad Shot Rate %
+/-
gamePage.tabs.stat_leaders

Use this for the four leaders tables:

gamePage.tabs.stat_leaders.scoring_leaders
gamePage.tabs.stat_leaders.creation_leaders
gamePage.tabs.stat_leaders.screening_leaders
gamePage.tabs.stat_leaders.rebounding_defense_leaders
gamePage.tabs.team_summary

Use this for Team Summary.

gamePage.tabs.team_summary.cards
gamePage.tabs.team_summary.compact
gamePage.tabs.team_summary.raw

cards is easiest to render.

gamePage.tabs.shot_chart_quality

Use this for Shot Chart + Shot Quality.

gamePage.tabs.shot_chart_quality.shot_chart
gamePage.tabs.shot_chart_quality.zone_breakdown
gamePage.tabs.shot_chart_quality.contest_breakdown
gamePage.tabs.team_advanced_stats

Use this for grouped advanced stat tables.

gamePage.tabs.team_advanced_stats.scoring_efficiency
gamePage.tabs.team_advanced_stats.creation_passing
gamePage.tabs.team_advanced_stats.screening
gamePage.tabs.team_advanced_stats.rebounding_defense
gamePage.tabs.team_advanced_stats.lineup_impact
3. getPlayerPageTabs(data, filters)

Use this when someone clicks a player page.

const playerPage = getPlayerPageTabs(data, {
  player: 'Emanuel',
  seasonId: '2026-S2',
  gameId: 'ALL',
  half: 'ALL'
});

Returns:

playerPage.tabs.scoring
playerPage.tabs.creation_passing
playerPage.tabs.screening
playerPage.tabs.rebounding_defense
playerPage.tabs.lineup_impact
playerPage.tabs.scoring

Has:

points / efficiency
shot quality
shot chart
zone breakdown
contest breakdown

Useful fields:

playerPage.tabs.scoring.points_efficiency
playerPage.tabs.scoring.shot_quality
playerPage.tabs.scoring.shot_chart
playerPage.tabs.scoring.zone_breakdown
playerPage.tabs.scoring.contest_breakdown
playerPage.tabs.creation_passing

Has that player’s:

AST
AST PTS
AST rate
AST/TO
Extra Potential AST
ADV Created
Paint Touch Created
Drive Kick Created
playerPage.tabs.screening

Has:

Screen AST
Screen Opp Created
Screen Adv Created
Screen total
Screen created points
PTS per screen created
playerPage.tabs.rebounding_defense

Has:

OR
DR
REB
STL
BLK
Deflections
Charges
Fouls
Def Activity
+/-
playerPage.tabs.lineup_impact

Has player on-court lineup impact:

off poss
def poss
points for
points against
net
off rating
def rating
net rating
4. getAdvancedStatsHub(data, filters)

Use this for the new homepage Advanced Stats page.

const advanced = getAdvancedStatsHub(data, {
  seasonId: '2026-S2',
  gameId: 'ALL',
  half: 'ALL',
  view: 'team',      // 'team', 'players', or 'player'
  player: 'ALL',
  mode: 'perGame'    // 'perGame' or 'totals'
});

Returns:

advanced.tabs.overview
advanced.tabs.advanced_box_score
advanced.tabs.player_leaderboards
advanced.tabs.team_advanced_stats
advanced.tabs.shot_chart_quality
advanced.tabs.creation_passing
advanced.tabs.screening
advanced.tabs.rebounding_defense
advanced.tabs.lineup_impact
Filter meanings
seasonId: '2026-S2'   // or 'ALL'
gameId: 'ALL'         // or '2026-S2 G2'
half: 'ALL'           // or '1H', '2H', 'OT'
view: 'team'          // team summary
view: 'players'       // all players comparison
view: 'player'        // one selected player
player: 'Emanuel'     // only used when view is 'player'
mode: 'perGame'       // averages as main values
mode: 'totals'        // totals as main values
Average logic

When mode: 'perGame', a counting stat looks like this:

{
  total: 74,
  per_game: 37,
  main: 37,
  secondary: '74 total',
  display: '37'
}

So his UI should show:

37
74 total

When mode: 'totals', it looks like this:

{
  total: 74,
  per_game: 37,
  main: 74,
  secondary: '37/g',
  display: '74'
}

So his UI should show:

74
37/g

Percentages like FG%, 3PT%, FT%, TS%, Usage%, Bad Shot Rate are not averaged together. They are recalculated from the filtered data.

How to render common things
Advanced box score row

Example row:

const row = advanced.tabs.advanced_box_score.rows[0];

row.player
row.GP
row.values.PTS.main
row.values.PTS.secondary
row.Usage_pct
row.FG.display
row.threePoint.display
row.FT.display
row.TS_pct
row.values.AST.main
row.values.TOV.main
row.AST_TO
row.values.OR.main
row.values.DR.main
row.Bad_Shot_Rate_pct
row.plus_minus

FG / 3PT / FT are already made for display:

row.FG.display        // "5/11 (45.5%)"
row.threePoint.display
row.FT.display

But if he wants custom layout:

row.FG.made
row.FG.attempted
row.FG.pct
Shot chart page
const shotPage = advanced.tabs.shot_chart_quality;

renderShotChart(document.getElementById('chart'), shotPage.shot_chart, {
  showHeatZones: true,
  showRegionLabels: true,
  interactive: true
});

Below the chart:

shotPage.zone_breakdown
shotPage.contest_breakdown
shotPage.shot_quality_summary

Each zone row has things like:

label
FGM
FGA
FG_pct
PTS
PPS
Rate

Each contest row has the same style, grouped by:

wide open
open
light
heavy
blocked/smothered
Best rule for your friend

Tell him:

Use spartans-website-api.js first. Only use spartans-stats-core.js when you need custom calculations.

For page rendering:

Homepage / menus        → getWebsiteIndex
Game pages              → getGamePageTabs
Player pages            → getPlayerPageTabs
Advanced Stats homepage → getAdvancedStatsHub
Shot chart SVG          → renderShotChart

He does not need to scrape your tracker HTML. He does not need to rebuild the formulas. He just imports the functions and feeds them spartans-data.json.


-----Prompt 2-----
He does not need to rebuild his React site around our files. He just copies the stat files into his project, fetches the tracker JSON, then uses the returned objects inside his existing React components.

Use this package:

Download full API package v0.5.7

What he actually needs to copy

Into his React project:

src/lib/spartans/
  spartans-website-api.js
  spartans-stats-core.js
  shot-chart-renderer.js

public/data/
  spartans-data.json

That’s it.

His own React pages/components stay his own.

Mental model

His React code is the frontend layout.

Our files are just the stats calculator.

So instead of him calculating:

points = shots + freeThrows + ...
usage = ...
ts = ...
zoneBreakdown = ...

he just calls:

getAdvancedStatsHub(data, filters)

and receives ready-to-render data.

Example in React
import { useEffect, useMemo, useState } from 'react';
import { getAdvancedStatsHub } from '../lib/spartans/spartans-website-api.js';

export default function AdvancedStatsPage() {
  const [data, setData] = useState(null);

  const [gameId, setGameId] = useState('ALL');
  const [view, setView] = useState('team');
  const [player, setPlayer] = useState('ALL');

  useEffect(() => {
    fetch('/data/spartans-data.json')
      .then(res => res.json())
      .then(setData);
  }, []);

  const advanced = useMemo(() => {
    if (!data) return null;

    return getAdvancedStatsHub(data, {
      seasonId: '2026-S2',
      gameId,
      half: 'ALL',
      view,        // team, players, player
      player,
      mode: 'perGame'
    });
  }, [data, gameId, view, player]);

  if (!advanced) return <div>Loading...</div>;

  return (
    <div>
      <h1>Advanced Stats</h1>

      <select value={gameId} onChange={e => setGameId(e.target.value)}>
        <option value="ALL">All games</option>
        <option value="2026-S2 G1">Game 1</option>
        <option value="2026-S2 G2">Game 2</option>
      </select>

      <select value={view} onChange={e => setView(e.target.value)}>
        <option value="team">Team</option>
        <option value="players">All players</option>
        <option value="player">Selected player</option>
      </select>

      <h2>Advanced Box Score</h2>

      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>PTS</th>
            <th>Usage%</th>
            <th>FG</th>
            <th>3PT</th>
            <th>FT</th>
            <th>TS%</th>
            <th>AST</th>
            <th>TOV</th>
            <th>AST/TO</th>
            <th>OR</th>
            <th>DR</th>
          </tr>
        </thead>
        <tbody>
          {advanced.tabs.advanced_box_score.rows.map(row => (
            <tr key={row.player}>
              <td>{row.player}</td>

              <td>
                <strong>{row.values.PTS.main}</strong>
                <br />
                <small>{row.values.PTS.secondary}</small>
              </td>

              <td>{row.Usage_pct}%</td>

              <td>
                <strong>{row.FG.made}/{row.FG.attempted}</strong>
                <br />
                <small>{row.FG.pct}%</small>
              </td>

              <td>
                <strong>{row.threePoint.made}/{row.threePoint.attempted}</strong>
                <br />
                <small>{row.threePoint.pct}%</small>
              </td>

              <td>
                <strong>{row.FT.made}/{row.FT.attempted}</strong>
                <br />
                <small>{row.FT.pct}%</small>
              </td>

              <td>{row.TS_pct}%</td>
              <td>{row.values.AST.main}</td>
              <td>{row.values.TOV.main}</td>
              <td>{row.AST_TO}</td>
              <td>{row.values.OR.main}</td>
              <td>{row.values.DR.main}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
Shot chart in React
import { useEffect, useRef } from 'react';
import { renderShotChart } from '../lib/spartans/shot-chart-renderer.js';

export function ShotChart({ shotChartData }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !shotChartData) return;

    renderShotChart(ref.current, shotChartData, {
      showHeatZones: true,
      showRegionLabels: true,
      interactive: true
    });
  }, [shotChartData]);

  return <div ref={ref} />;
}

Then use it like:

<ShotChart shotChartData={advanced.tabs.shot_chart_quality.shot_chart} />
For his existing pages
Game page
import { getGamePageTabs } from '../lib/spartans/spartans-website-api.js';

const gamePage = getGamePageTabs(data, {
  seasonId: '2026-S2',
  gameId: '2026-S2 G2',
  half: 'ALL',
  player: 'ALL'
});

Then he uses:

gamePage.tabs.overview
gamePage.tabs.advanced_box_score
gamePage.tabs.stat_leaders
gamePage.tabs.team_summary
gamePage.tabs.shot_chart_quality
gamePage.tabs.team_advanced_stats
Player page
import { getPlayerPageTabs } from '../lib/spartans/spartans-website-api.js';

const playerPage = getPlayerPageTabs(data, {
  seasonId: '2026-S2',
  gameId: 'ALL',
  half: 'ALL',
  player: 'Emanuel'
});

Then he uses:

playerPage.tabs.scoring
playerPage.tabs.creation_passing
playerPage.tabs.screening
playerPage.tabs.rebounding_defense
playerPage.tabs.lineup_impact
Homepage Advanced Stats page
import { getAdvancedStatsHub } from '../lib/spartans/spartans-website-api.js';

const advanced = getAdvancedStatsHub(data, {
  seasonId: '2026-S2',
  gameId: 'ALL',
  half: 'ALL',
  view: 'team',
  player: 'ALL',
  mode: 'perGame'
});

Then he uses:

advanced.tabs.overview
advanced.tabs.advanced_box_score
advanced.tabs.player_leaderboards
advanced.tabs.team_advanced_stats
advanced.tabs.shot_chart_quality
advanced.tabs.creation_passing
advanced.tabs.screening
advanced.tabs.rebounding_defense
advanced.tabs.lineup_impact
Important thing to tell him

He should not copy the tracker HTML into his site.

He should only use:

spartans-data.json = the raw stats data
spartans-website-api.js = turns raw data into page data
spartans-stats-core.js = calculation engine
shot-chart-renderer.js = draws the shot chart

His React components just render the data however he wants.