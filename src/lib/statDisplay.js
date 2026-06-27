// src/lib/statDisplay.js
// Display layer — maps statsCore output to renderable descriptor shapes.
// No JSX. No direct stat math.
//
// Shapes:
//   MetricCard:      { label, main, secondary?, sub? }
//   StatGroup:       { title, rows: [{ label, value, secondary? }] }
//   TableDescriptor: { columns: [{ key, label, type }], rows: [] }
//   NoteBlock:       { title, body, variant? }  ('warn' | 'danger')

import {
  getGameOverview,
  getTeamAdvancedStats,
  getTeamSummaryCards,
  getAllPlayersAdvancedTable,
  getStatLeaders,
  getPlayerAdvancedTabs,
  getPlayerGameLog,
  getPlayerSeasonAverages,
  getShotChartData,
  getHalfSplits,
} from './statsCore.js'

// ── Shape helpers ─────────────────────────────────────────────────────────────

function mc(label, main, secondary, sub) {
  const c = { label, main: main ?? '—' }
  if (secondary !== undefined) c.secondary = secondary
  if (sub !== undefined) c.sub = sub
  return c
}

function gr(label, value, secondary) {
  const r = { label, value: value ?? '—' }
  if (secondary !== undefined) r.secondary = secondary
  return r
}

function group(title, rows) {
  return { title, rows }
}

// statsCore card shape: { key, label, value, secondary? } → StatGroup row
function cardsToGroup(title, cards) {
  return group(title, (cards ?? []).map(c => gr(c.label, String(c.value ?? '—'), c.secondary)))
}

// Build a lookup map from getTeamSummaryCards
function summaryLookup(data) {
  const map = {}
  getTeamSummaryCards(data).forEach(c => { map[c.key] = c })
  return key => map[key]
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

const LEADER_LABELS = {
  top_scorer:          'Top Scorer',
  top_creator:         'Top Creator',
  best_screener:       'Best Screener',
  top_rebounder:       'Top Rebounder',
  defensive_activity:  'Top Defender',
}

export function displayGameOverview(data, nameMap = {}) {
  const ov = getGameOverview(data)
  if (!ov) return null
  const name = id => nameMap[id] || id
  const s = summaryLookup(data)

  // Leaders: main = player name, sub = stat line
  const leaders = Object.entries(ov.leader_cards)
    .filter(([, lc]) => lc)
    .map(([key, lc]) => mc(
      LEADER_LABELS[key] || lc.label,
      name(lc.player),
      undefined,
      `${lc.value} ${lc.label}`,
    ))

  // Notes
  const notes = []
  if (ov.shot_quality_note) notes.push({ title: 'Shot Quality', body: ov.shot_quality_note })
  if (ov.best_zone) notes.push({
    title: 'Best Zone',
    body: `${ov.best_zone.label}: ${ov.best_zone.FGM}/${ov.best_zone.FGA}, ${ov.best_zone.PPS} PPS`,
  })
  ov.needs_attention.forEach(item => notes.push({
    title: item.title,
    body: item.message,
    variant: item.priority === 'high' ? 'danger' : 'warn',
  }))

  // Metrics (4 cards)
  const fgCard  = s('FG')
  const tptCard = s('threePT')
  const ftCard  = s('FT')
  const metrics = [
    mc('Points',
      String(s('PTS')?.value ?? '—'),
      undefined,
      [fgCard, tptCard, ftCard].filter(Boolean)
        .map(c => `${c.label} ${c.value}`).join(' · '),
    ),
    mc('Efficiency',
      `${s('eFG')?.value ?? '—'} eFG`,
      undefined,
      `${s('TS')?.value ?? '—'} TS · ${s('PPS')?.value ?? '—'} pts/poss`,
    ),
    mc('Creation',
      `${s('AST')?.value ?? '—'} AST`,
      undefined,
      `${s('Pot_AST')?.value ?? '—'} pot · ${s('Adv')?.value ?? '—'} ADV · ${s('TOV')?.value ?? '—'} TOV`,
    ),
    mc('Shot Quality',
      `${s('Open_rate')?.value ?? '—'} open`,
      undefined,
      `${s('Bad_rate')?.value ?? '—'} bad · ${s('Light_rate')?.value ?? '—'} light`,
    ),
  ]

  // Half splits as StatGroups
  const halfSplits = getHalfSplits(data).map(hs => group(
    hs.half === '1H' ? '1st Half' : '2nd Half',
    [
      gr('PTS',   String(hs.PTS)),
      gr('FG',    hs.FG?.value,         hs.FG?.secondary),
      gr('3PT',   hs.threePoint?.value, hs.threePoint?.secondary),
      gr('FT',    hs.FT?.value,         hs.FT?.secondary),
      gr('TS%',   hs.TS_pct),
      gr('AST',   String(hs.AST)),
      gr('TOV',   String(hs.TOV)),
      gr('OREB',  String(hs.OREB)),
      gr('DREB',  String(hs.DREB)),
      gr('STL',   String(hs.STL)),
      gr('BLK',   String(hs.BLK)),
      gr('Bad%',  hs.Bad_Shot_Rate_pct),
    ]
  ))

  // Team control (4 cards)
  const teamControl = [
    mc('eFG%',      String(s('eFG')?.value      ?? '—')),
    mc('Bad Shot%', String(s('Bad_rate')?.value  ?? '—')),
    mc('Turnovers', String(s('TOV')?.value       ?? '—')),
    mc('Rebounds',  String(s('REB')?.value       ?? '—')),
  ]

  return { leaders, notes, metrics, halfSplits, teamControl }
}

export function displayGameBoxScore(data, nameMap = {}) {
  const rows = getAllPlayersAdvancedTable(data).map(r => ({
    ...r,
    player: nameMap[r.player] || r.player,
  }))
  return {
    table: {
      columns: [
        { key: 'player',                type: 'name',   label: 'Player' },
        { key: 'PTS',                   type: 'number', label: 'PTS' },
        { key: 'Usage_pct',             type: 'pct',    label: 'USG%' },
        { key: 'FG',                    type: 'ratio',  label: 'FG' },
        { key: 'threePoint',            type: 'ratio',  label: '3PT' },
        { key: 'FT',                    type: 'ratio',  label: 'FT' },
        { key: 'AST',                   type: 'number', label: 'AST' },
        { key: 'Extra_Potential_AST',   type: 'number', label: 'POT' },
        { key: 'Advantage_Created',     type: 'number', label: 'ADV' },
        { key: 'Screen_OppAst_Created', type: 'number', label: 'SCR' },
        { key: 'REB',                   type: 'number', label: 'REB' },
        { key: 'STL',                   type: 'number', label: 'STL' },
        { key: 'BLK',                   type: 'number', label: 'BLK' },
        { key: 'Deflections',           type: 'number', label: 'DEF' },
        { key: 'TOV',                   type: 'number', label: 'TO' },
        { key: 'Open_pct',              type: 'ratio',  label: 'OPEN%' },
        { key: 'Bad_pct',               type: 'ratio',  label: 'BAD%' },
        { key: 'plus_minus',            type: 'number', label: '+/-' },
      ],
      rows,
    },
  }
}

const SCORING_COLS = [
  { key: 'player',       type: 'name',   label: 'Player' },
  { key: 'PTS',          type: 'number', label: 'PTS' },
  { key: 'FG',           type: 'ratio',  label: 'FG' },
  { key: 'threePoint',   type: 'ratio',  label: '3PT' },
  { key: 'FT',           type: 'ratio',  label: 'FT' },
  { key: 'eFG_pct',      type: 'pct',    label: 'eFG%' },
  { key: 'TS_pct',       type: 'pct',    label: 'TS%' },
  { key: 'PTS_per_Poss', type: 'number', label: 'PTS/P' },
  { key: 'Usage_pct',    type: 'pct',    label: 'USG%' },
]

const CREATION_COLS = [
  { key: 'player',           type: 'name',   label: 'Player' },
  { key: 'AST',              type: 'number', label: 'AST' },
  { key: 'AST_PTS',          type: 'number', label: 'AST PTS' },
  { key: 'Pot_AST',          type: 'number', label: 'POT AST' },
  { key: 'ADV_Created',      type: 'number', label: 'ADV' },
  { key: 'Paint_Touch_Created', type: 'number', label: 'PAINT' },
  { key: 'Drive_Kick_Created',  type: 'number', label: 'DRV/KCK' },
  { key: 'AST_TO',           type: 'number', label: 'AST/TO' },
  { key: 'TOV',              type: 'number', label: 'TOV' },
]

const SCREENING_COLS = [
  { key: 'player',              type: 'name',   label: 'Player' },
  { key: 'Screen_Created_Total', type: 'number', label: 'SCR TOT' },
  { key: 'Screen_AST',          type: 'number', label: 'SCR AST' },
  { key: 'Screen_Opp_Created',  type: 'number', label: 'SCR OPP' },
  { key: 'Screen_Adv_Created',  type: 'number', label: 'SCR ADV' },
  { key: 'Scr_PTS',             type: 'number', label: 'SCR PTS' },
  { key: 'PTS_per_Screen',      type: 'number', label: 'PTS/SCR' },
]

const REBDEF_COLS = [
  { key: 'player',       type: 'name',   label: 'Player' },
  { key: 'REB',          type: 'number', label: 'REB' },
  { key: 'OR',           type: 'number', label: 'OR' },
  { key: 'DR',           type: 'number', label: 'DR' },
  { key: 'STL',          type: 'number', label: 'STL' },
  { key: 'BLK',          type: 'number', label: 'BLK' },
  { key: 'Deflections',  type: 'number', label: 'DEF' },
  { key: 'Charges',      type: 'number', label: 'CHG' },
  { key: 'Def_Activity', type: 'number', label: 'DEF ACT' },
]

export function displayGameStatLeaders(data, nameMap = {}) {
  const leaders = getStatLeaders(data)
  const mapNames = rows => rows.map(r => ({ ...r, player: nameMap[r.player] || r.player }))
  return {
    scoring:   { columns: SCORING_COLS,   rows: mapNames(leaders.scoring) },
    creation:  { columns: CREATION_COLS,  rows: mapNames(leaders.creation) },
    screening: { columns: SCREENING_COLS, rows: mapNames(leaders.screening) },
    defense:   { columns: REBDEF_COLS,    rows: mapNames(leaders.rebounding_defense) },
  }
}

export function displayTeamAdvancedStats(data) {
  const adv = getTeamAdvancedStats(data)
  return {
    groups: [
      cardsToGroup('Scoring & Efficiency', adv.scoring_efficiency),
      cardsToGroup('Creation & Passing',   adv.creation_passing),
      cardsToGroup('Screening',            adv.screening),
      cardsToGroup('Rebounding & Defense', adv.rebounding_defense),
      cardsToGroup('Shot Quality',         adv.shot_quality),
      cardsToGroup('Lineup Impact',        adv.lineup_impact),
    ],
  }
}

export function displayTeamSummary(data) {
  const cards = getTeamSummaryCards(data)
  const pick = (...keys) => keys.map(k => cards.find(c => c.key === k)).filter(Boolean)
  const toGroup = (title, keys) => cardsToGroup(title, pick(...keys))
  return {
    groups: [
      toGroup('Scoring',        ['PTS','FG','FG_pct','twoPT','threePT','threePT_pct','FT','eFG','TS']),
      toGroup('Playmaking',     ['AST','AST_PTS','Pot_AST','Adv','Scr','Scr_PTS','TOV','Poss','PPS']),
      toGroup('Shot Quality',   ['Open_rate','Light_rate','Bad_rate','Trans']),
      toGroup('Defense & Reb',  ['REB','Def_Act']),
      toGroup('Lineup',         ['Off_Rtg','Def_Rtg','Net_Rtg']),
    ].filter(g => g.rows.length > 0),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

export function displayPlayerAdvancedStats(data, playerId) {
  const adv = getPlayerAdvancedTabs(data, playerId)
  if (!adv) return null
  return {
    scoring:   [
      cardsToGroup('Points & Efficiency', adv.scoring.points_efficiency),
      cardsToGroup('Shot Quality',        adv.scoring.shot_quality),
    ],
    creation:  [cardsToGroup('Creation & Passing',   adv.creation_passing)],
    screening: [cardsToGroup('Screening',            adv.screening)],
    defense:   [cardsToGroup('Rebounding & Defense', adv.rebounding_defense)],
    lineup:    [cardsToGroup('Lineup Impact',        adv.lineup_impact)],
  }
}

const GAME_LOG_COLS = [
  { key: 'game_id',    type: 'name',   label: 'Game' },
  { key: 'PTS',        type: 'number', label: 'PTS' },
  { key: 'REB',        type: 'number', label: 'REB' },
  { key: 'AST',        type: 'number', label: 'AST' },
  { key: 'STL',        type: 'number', label: 'STL' },
  { key: 'BLK',        type: 'number', label: 'BLK' },
  { key: 'TO',         type: 'number', label: 'TO' },
  { key: 'FG',         type: 'ratio',  label: 'FG' },
  { key: 'threePoint', type: 'ratio',  label: '3PT' },
  { key: 'FT',         type: 'ratio',  label: 'FT' },
  { key: 'pm',         type: 'number', label: '+/-' },
]

export function displayPlayerBoxScore(data, playerId, scopeType, games = []) {
  if (!data) return { metrics: [], gameLog: null }

  if (scopeType === 'game') {
    const pShots = data.shots.filter(s => s.player === playerId)
    const pFTs   = data.freeThrows.filter(ft => ft.player === playerId)
    const made   = pShots.filter(s => String(s.result).toLowerCase() === 'make')
    const made3  = pShots.filter(s => Number(s.points) === 3 && String(s.result).toLowerCase() === 'make')
    const att3   = pShots.filter(s => Number(s.points) === 3)
    const FTM    = pFTs.filter(ft => String(ft.result).toLowerCase() === 'make').length
    const FTA    = pFTs.length
    const PTS    = made.reduce((t, s) => t + Number(s.points), 0) + FTM
    const pct    = (m, a) => a ? `${((m / a) * 100).toFixed(1)}%` : '—'
    return {
      metrics: [
        mc('PTS', String(PTS)),
        mc('FG',  `${made.length}/${pShots.length}`, pct(made.length, pShots.length)),
        mc('3PT', `${made3.length}/${att3.length}`,  pct(made3.length, att3.length)),
        mc('FT',  `${FTM}/${FTA}`,                   pct(FTM, FTA)),
      ],
      gameLog: null,
    }
  }

  const gameLog = getPlayerGameLog(data, playerId)
  if (!gameLog.length) return { metrics: [], gameLog: null }

  const averages  = getPlayerSeasonAverages(gameLog)
  const gamesMap  = Object.fromEntries(games.map(g => [g.id, g]))
  const namedRows = gameLog.map(r => {
    const g = gamesMap[r.game_id]
    return { ...r, game_id: g ? `${g.opponentName} (${g.result ?? ''})` : r.game_id }
  })

  return {
    metrics: averages.map(c => mc(c.label, String(c.value ?? '—'))),
    gameLog: { columns: GAME_LOG_COLS, rows: namedRows },
  }
}

export function displayShotChart(data, playerId = null) {
  const shots = playerId
    ? data.shots.filter(s => s.player === playerId)
    : data.shots
  const chartData = { ...data, shots }
  const { zone_breakdown, contest_breakdown } = getShotChartData(chartData)

  const cols = labelText => [
    { key: 'label',   type: 'name',   label: labelText },
    { key: 'FG',      type: 'ratio',  label: 'FG' },
    { key: 'FG_pct',  type: 'pct',    label: 'FG%' },
    { key: 'rate',    type: 'pct',    label: 'RATE' },
    { key: 'PTS',     type: 'number', label: 'PTS' },
    { key: 'PPS',     type: 'number', label: 'PPS' },
  ]

  return {
    shots,
    zoneBreakdown:    { columns: cols('Zone'),    rows: zone_breakdown.filter(z => z.FGA > 0) },
    contestBreakdown: { columns: cols('Contest'), rows: contest_breakdown.filter(z => z.FGA > 0) },
  }
}
