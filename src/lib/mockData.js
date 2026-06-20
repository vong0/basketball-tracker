export const mockPlayers = [
  { id: 'vong',    name: 'Vong',    number: '4',  position: 'Big',   photo: '' },
  { id: 'mushi',   name: 'Mushi',   number: '7',  position: 'Guard', photo: '' },
  { id: 'matt',    name: 'Matt',    number: '11', position: 'Guard', photo: '' },
  { id: 'emanuel', name: 'Emanuel', number: '5',  position: 'Guard', photo: '' },
  { id: 'alex',    name: 'Alex',    number: '13', position: 'Big',   photo: '' },
  { id: 'george',  name: 'George',  number: '8',  position: 'Guard', photo: '' },
  { id: 'adam',    name: 'Adam',    number: '23', position: 'Wing',  photo: '' },
]

export const mockGames = [
  {
    id: '2026-S2-G1',
    season: '2026-S2',
    game: 'G1',
    date: '2026-06-07',
    opponentName: 'Team TAM',
    teamScore: 52,
    opponentScore: 50,
    result: 'W',
    videoId: '2Y1arwOHfK8',
    youtubeUrl: 'https://www.youtube.com/watch?v=2Y1arwOHfK8',
    gloryLeagueUrl: '',
    halves: { h1: { team: 28, opponent: 22 }, h2: { team: 24, opponent: 28 } },
  },
  {
    id: '2026-S2-Finals',
    season: '2026-S2',
    game: 'Finals',
    date: '2026-06-14',
    opponentName: 'Net Profits',
    teamScore: 37,
    opponentScore: 65,
    result: 'L',
    videoId: 'orgeiVM7074',
    youtubeUrl: 'https://youtu.be/orgeiVM7074',
    gloryLeagueUrl: '',
    halves: { h1: { team: 20, opponent: 30 }, h2: { team: 17, opponent: 35 } },
  },
]

export const mockTakeaways = [
  {
    gameId: '2026-S2-G1',
    team: ['Good ball movement in second half'],
    players: [
      {
        playerId: 'mushi',
        strengths: ['Great job pushing pace on transition', 'Amazing job splitting defense and dumping to cutting bigs'],
        improvements: ['Forced a few passes inside while too congested', 'Sometimes take a look before driving middle'],
      },
      {
        playerId: 'vong',
        strengths: ['Good job cutting and rolling, getting inside and finishing'],
        improvements: ['Vary up your inside moves + do not always settle for push shot', 'On defense pay more attention to backdoor cutters'],
      },
      {
        playerId: 'matt',
        strengths: ['Good job driving corner and dumping', 'Good job passing early on fastbreaks'],
        improvements: ['Rotate and communicate more to contest open shooters'],
      },
    ],
  },
  {
    gameId: '2026-S2-Finals',
    team: ['Need better half-court execution', 'Too many turnovers in second half'],
    players: [
      {
        playerId: 'adam',
        strengths: ['Hit big shots early', 'Good defensive effort'],
        improvements: ['Avoid forcing pull-up 3s late in shot clock'],
      },
      {
        playerId: 'george',
        strengths: ['Good screening off-ball', 'Keep taking open 3s'],
        improvements: [],
      },
    ],
  },
]

export const mockClipCounts = {
  '2026-S2-G1': {
    all: 24,
    goodOffense: 8,
    badOffense: 5,
    goodDefense: 6,
    badDefense: 5,
  },
  '2026-S2-Finals': {
    all: 31,
    goodOffense: 9,
    badOffense: 10,
    goodDefense: 7,
    badDefense: 5,
  },
}

// Per-game box score stats keyed by playerId
export const mockStats = {
  '2026-S2-G1': {
    team: { pts: 52, reb: 25, ast: 16, stl: 5, blk: 6, to: 11, fg: '22/49', threes: '6/17', ft: '2/4' },
    players: {
      vong:    { pts: 10, reb: 6, ast: 1, stl: 0, blk: 2, to: 2, pm: '+2',  fg: '5/9',  threes: '0/0', ft: '0/0' },
      mushi:   { pts: 16, reb: 3, ast: 6, stl: 2, blk: 0, to: 3, pm: '+6',  fg: '6/13', threes: '3/7', ft: '1/2' },
      matt:    { pts: 8,  reb: 4, ast: 4, stl: 1, blk: 0, to: 2, pm: '+4',  fg: '3/8',  threes: '2/4', ft: '0/0' },
      emanuel: { pts: 10, reb: 2, ast: 5, stl: 1, blk: 1, to: 2, pm: '+6',  fg: '4/10', threes: '0/2', ft: '2/2' },
      alex:    { pts: 6,  reb: 8, ast: 1, stl: 0, blk: 3, to: 1, pm: '+4',  fg: '3/5',  threes: '0/0', ft: '0/0' },
      george:  { pts: 2,  reb: 2, ast: 2, stl: 1, blk: 0, to: 1, pm: '+2',  fg: '1/5',  threes: '1/4', ft: '0/0' },
    },
  },
  '2026-S2-Finals': {
    team: { pts: 37, reb: 18, ast: 10, stl: 3, blk: 2, to: 13, fg: '14/40', threes: '5/17', ft: '4/5' },
    players: {
      vong:    { pts: 6,  reb: 5, ast: 1, stl: 0, blk: 1, to: 2, pm: '-18', fg: '3/7',  threes: '0/0', ft: '0/0' },
      mushi:   { pts: 10, reb: 2, ast: 3, stl: 1, blk: 0, to: 4, pm: '-20', fg: '4/10', threes: '2/6', ft: '0/0' },
      matt:    { pts: 6,  reb: 3, ast: 2, stl: 1, blk: 0, to: 2, pm: '-22', fg: '2/8',  threes: '2/5', ft: '0/0' },
      emanuel: { pts: 8,  reb: 2, ast: 3, stl: 0, blk: 0, to: 3, pm: '-24', fg: '3/9',  threes: '0/3', ft: '2/3' },
      alex:    { pts: 4,  reb: 7, ast: 0, stl: 0, blk: 1, to: 1, pm: '-20', fg: '2/4',  threes: '0/0', ft: '0/0' },
      george:  { pts: 3,  reb: 1, ast: 1, stl: 1, blk: 0, to: 1, pm: '-16', fg: '1/4',  threes: '1/3', ft: '0/0' },
    },
  },
}

// Shot zone breakdown per game (team totals)
export const mockZones = {
  '2026-S2-G1': [
    { zone: 'Rim',       fg: '6/9',  pct: '67%', pts: 12, freq: '18%' },
    { zone: 'Paint',     fg: '4/11', pct: '36%', pts: 8,  freq: '22%' },
    { zone: 'Mid-range', fg: '2/6',  pct: '33%', pts: 4,  freq: '12%' },
    { zone: 'Corner 3',  fg: '2/4',  pct: '50%', pts: 6,  freq: '8%'  },
    { zone: 'Wing 3',    fg: '3/10', pct: '30%', pts: 9,  freq: '20%' },
    { zone: 'Top 3',     fg: '1/3',  pct: '33%', pts: 3,  freq: '6%'  },
  ],
  '2026-S2-Finals': [
    { zone: 'Rim',       fg: '3/7',  pct: '43%', pts: 6,  freq: '18%' },
    { zone: 'Paint',     fg: '3/9',  pct: '33%', pts: 6,  freq: '22%' },
    { zone: 'Mid-range', fg: '1/5',  pct: '20%', pts: 2,  freq: '13%' },
    { zone: 'Corner 3',  fg: '1/3',  pct: '33%', pts: 3,  freq: '8%'  },
    { zone: 'Wing 3',    fg: '3/9',  pct: '33%', pts: 9,  freq: '22%' },
    { zone: 'Top 3',     fg: '1/5',  pct: '20%', pts: 3,  freq: '13%' },
  ],
}

// "G1" → "Game 1", "Finals" → "Finals"
export function gameLabel(game) {
  const m = game.game.match(/^G(\d+)$/)
  return m ? `Game ${m[1]}` : game.game
}
