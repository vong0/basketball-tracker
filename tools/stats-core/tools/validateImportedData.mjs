import fs from 'node:fs';
import { calculateTeamStats, calculateAllPlayerStats, calculateGameReport, formatPct, formatNumber } from '../src/stats/basketballStats.js';

const file = process.argv[2] || './migrated-data/spartans-tracked-data-from-excel-v0.2.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const team = calculateTeamStats(data, { gameId: 'ALL' });
const players = calculateAllPlayerStats(data, { gameId: 'ALL' });
const report = calculateGameReport(data, { gameId: 'G1' });

const out = {
  counts: {
    players: data.players.length,
    games: data.games.length,
    shots: data.shots.length,
    events: data.events.length,
    freeThrows: data.freeThrows.length,
    lineupStints: data.lineupStints.length
  },
  teamCore: {
    PTS: team.PTS,
    FGM: team.FGM,
    FGA: team.FGA,
    FG_pct: formatPct(team.FG_pct),
    threePM: team.threePM,
    threePA: team.threePA,
    threeP_pct: formatPct(team.threeP_pct),
    FTM: team.FTM,
    FTA: team.FTA,
    FT_pct: formatPct(team.FT_pct),
    AST: team.AST,
    TOV: team.TOV,
    REB: team.REB,
    OREB: team.OREB,
    DREB: team.DREB,
    Screen_Created_Total: team.Screen_Created_Total,
    Potential_AST: team.Potential_AST,
    Adv_Created: team.Adv_Created,
    Lineup_Net: team.Lineup_Net,
    Off_Rtg: formatNumber(team.Off_Rtg),
    Def_Rtg: formatNumber(team.Def_Rtg),
    Net_Rtg: formatNumber(team.Net_Rtg)
  },
  playerCore: players.map(p => ({
    player: p.player,
    PTS: p.PTS,
    FGM: p.FGM,
    FGA: p.FGA,
    threePM: p.threePM,
    threePA: p.threePA,
    FTM: p.FTM,
    FTA: p.FTA,
    AST: p.AST,
    TOV: p.TOV,
    REB: p.REB,
    Screen_Created_Total: p.Screen_Created_Total,
    Player_plus_minus: p.Player_plus_minus
  })),
  gameLeaders: Object.fromEntries(Object.entries(report.leaders).map(([key, value]) => [key, value?.player ?? null]))
};

console.log(JSON.stringify(out, null, 2));
