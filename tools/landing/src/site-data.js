// Boilerplate site data. The app starts from this file, then saves edits in localStorage.
// Replace this later with fetch('/data/site-data.json') if preferred.
export const DEFAULT_SITE_DATA = {
  meta: {
    teamName: 'Spartans',
    season: '2026-S2',
    updatedAt: '2026-06-18T00:00:00.000Z',
    notes: 'Boilerplate data for GitHub Pages preview. Replace/edit later.'
  },
  players: {
    emanuel: { id:'emanuel', name:'Emanuel', jersey:'0', position:'Guard', height:'', role:'Creator / guard', photo:'', notes:'Primary ball handler. Edit this later.' },
    adam: { id:'adam', name:'Adam', jersey:'', position:'Wing', height:'', role:'Scorer / shooter', photo:'', notes:'Top scorer sample player.' },
    alex: { id:'alex', name:'Alex', jersey:'', position:'Forward', height:'', role:'Screening / rebounding / defense', photo:'', notes:'High activity player.' },
    mushi: { id:'mushi', name:'Mushi', jersey:'', position:'Guard', height:'', role:'Slasher / creator', photo:'', notes:'Boilerplate profile.' }
  },
  games: {
    '2026-S2-G1': { id:'2026-S2-G1', name:'2026-S2 G1', opponentId:'team-tam', opponentName:'Team Tam', date:'', scoreFor:52, scoreAgainst:50, result:'W', youtubeUrl:'https://www.youtube.com/watch?v=', llc:'games/y26-s2-g01.llc', reportUrl:'reports/2026-s2-g1.html', notes:'Sample game page notes.' },
    '2026-S2-G2': { id:'2026-S2-G2', name:'2026-S2 G2', opponentId:'net-profits', opponentName:'Net Profits', date:'', scoreFor:37, scoreAgainst:65, result:'L', youtubeUrl:'https://youtu.be/orgeiVM7074', llc:'games/y26-s2-g02.llc', reportUrl:'reports/2026-s2-g2.html', notes:'Game 2 sample. Link the locked-game report here later.' }
  },
  opponents: {
    'team-tam': { id:'team-tam', name:'Team Tam', record:'', notes:'Boilerplate opponent notes. Add scouting later.', keyPlayers:'', strategyNotes:'' },
    'net-profits': { id:'net-profits', name:'Net Profits', record:'', notes:'Physical team. Edit/add scout notes here.', keyPlayers:'', strategyNotes:'' }
  },
  strategies: {
    'five-out': { id:'five-out', title:'5-out spacing', category:'Offense', summary:'Keep corners filled, lift on drives, punish help with drive-kick threes.', notes:'Boilerplate strategy note.' },
    'screen-actions': { id:'screen-actions', title:'Screen actions', category:'Offense', summary:'Track screen assists, screen opportunities, and advantage-created possessions.', notes:'Connect this later to screen stats from the tracker.' },
    'transition-defense': { id:'transition-defense', title:'Transition defense', category:'Defense', summary:'First three steps back after shots and turnovers. Stop ball early.', notes:'Boilerplate defensive note.' }
  }
};
