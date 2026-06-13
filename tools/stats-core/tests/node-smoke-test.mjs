import data from '../sample-data/sampleData.json' with { type: 'json' };
import { calculatePlayerStats, calculateTeamStats, calculateGameReport } from '../src/stats/basketballStats.js';

const adam = calculatePlayerStats(data, { player: 'Adam', gameId: 'G1' });
const team = calculateTeamStats(data, { gameId: 'G1' });
const report = calculateGameReport(data, { gameId: 'G1' });

console.log('Adam PTS:', adam.PTS);
console.log('Adam AST:', adam.AST);
console.log('Team PTS:', team.PTS);
console.log('Report leader points:', report.leaders.points?.player);

if (adam.PTS !== 4) throw new Error('Adam PTS should be 4');
if (team.PTS !== 7) throw new Error('Team PTS should be 7');
