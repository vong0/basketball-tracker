// Spartans Stats Core — React data engine (v0.6.0)
// Pure stat math. Accepts backend.getStats() shape: { shots, events, freeThrows, lineupStints }.
// Returns card descriptor arrays ({ key, label, value, secondary? }) or table rows
// (where cells may be { value, secondary } objects).
//
// Data taxonomy (from public/data/stats.json):
//   events: event_type ∈ { creation, screen, rebound, steal, block, deflection,
//                           turnover, foul, charge_drawn }
//     creation/{potential_assist, advantage_created, paint_touch_created, drive_kick_created}
//     screen/{screen_assist, screen_opportunity, advantage_created}
//     rebound/{offensive, defensive}
//   No "assist" event — assists are derived from shots[].assisted_by.
//   freeThrows have no points field — a made FT = 1 point.
//   lineupStints use off_poss / def_poss / points_for / points_against.

// ── Internal helpers (NOT exported) ───────────────────────────────────────────

function _num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0 }
function _made(row) { return String(row?.result ?? '').toLowerCase() === 'make' }
function _yes(v) { return String(v ?? '').toLowerCase() === 'yes' || v === true }
function _safe(n, d) { n = Number(n); d = Number(d); return d ? n / d : null }
function _sum(rows, getter) { return (rows ?? []).reduce((t, r) => t + _num(getter(r)), 0) }
function _shotPoints(shots) { return _sum(shots, s => _made(s) ? _num(s.points) : 0) }

function _countEvents(events, type, subtype = null) {
  return _sum(events, e => {
    if (type && e.event_type !== type) return 0
    if (subtype && e.event_subtype !== subtype) return 0
    return _num(e.count) || 1
  })
}
function _eventPoints(events, type, subtype = null) {
  return _sum(events, e => {
    if (type && e.event_type !== type) return 0
    if (subtype && e.event_subtype !== subtype) return 0
    return _num(e.points_created)
  })
}

function _pct(v) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return null
  return Number((Number(v) * 100).toFixed(1))
}
function _pctText(v) {
  const p = _pct(v)
  return p === null ? '—' : `${p}%`
}

function _card(key, label, value, secondary = undefined) {
  return secondary !== undefined ? { key, label, value, secondary } : { key, label, value }
}

function _fgStats(shots = []) {
  const made = shots.filter(_made)
  const FGM = made.length
  const FGA = shots.length
  const FG_pct = _safe(FGM, FGA)
  const threeShots = shots.filter(s => _num(s.points) === 3)
  const twoActual = shots.filter(s => _num(s.points) !== 3)
  const threePM = threeShots.filter(_made).length
  const threePA = threeShots.length
  const twoPM = twoActual.filter(_made).length
  const twoPA = twoActual.length
  const PTS = _shotPoints(shots)
  const eFG = FGA ? (FGM + 0.5 * threePM) / FGA : null
  return {
    FGM, FGA, FG_pct,
    threePM, threePA, threePT_pct: _safe(threePM, threePA),
    twoPM, twoPA, twoPT_pct: _safe(twoPM, twoPA),
    PTS, eFG,
  }
}

// Free throws carry no points field — a made FT is worth 1 point.
function _ftStats(fts = []) {
  const FTM = fts.filter(_made).length
  const FTA = fts.length
  const FT_pct = _safe(FTM, FTA)
  const FT_PTS = FTM
  return { FTM, FTA, FT_pct, FT_PTS }
}

function _teamStats(data) {
  const { shots = [], events = [], freeThrows = [], lineupStints = [] } = data
  const fg = _fgStats(shots)
  const ft = _ftStats(freeThrows)

  const totalPTS = fg.PTS + ft.FT_PTS
  const TSA = fg.FGA + 0.44 * ft.FTA
  const TS_pct = TSA ? totalPTS / (2 * TSA) : null

  // Assists derive from shots[].assisted_by (no assist event in the data).
  const assistedShots = shots.filter(s => _made(s) && s.assisted_by)
  const AST = assistedShots.length
  const AST_PTS = _shotPoints(assistedShots)

  // Creation events
  const Pot_AST     = _countEvents(events, 'creation', 'potential_assist')
  const Pot_AST_PTS = _eventPoints(events, 'creation', 'potential_assist')
  const Adv_Created = _countEvents(events, 'creation', 'advantage_created')
  const Adv_PTS     = _eventPoints(events, 'creation', 'advantage_created')
  const PaintTouch  = _countEvents(events, 'creation', 'paint_touch_created')
  const DriveKick   = _countEvents(events, 'creation', 'drive_kick_created')

  // Screen events
  const Scr_AST = _countEvents(events, 'screen', 'screen_assist')
  const Scr_Opp = _countEvents(events, 'screen', 'screen_opportunity')
  const Scr_Adv = _countEvents(events, 'screen', 'advantage_created')
  const Scr_PTS = _eventPoints(events, 'screen', 'screen_assist')
              + _eventPoints(events, 'screen', 'screen_opportunity')
              + _eventPoints(events, 'screen', 'advantage_created')

  const TOV = _countEvents(events, 'turnover')
  const OREB = _countEvents(events, 'rebound', 'offensive')
  const DREB = _countEvents(events, 'rebound', 'defensive')
  const REB = OREB + DREB
  const STL = _countEvents(events, 'steal')
  const BLK = _countEvents(events, 'block')
  const Deflections = _countEvents(events, 'deflection')
  const Charges = _countEvents(events, 'charge_drawn')
  const Fouls = _countEvents(events, 'foul')

  const TransPTS = _sum(shots.filter(s => _yes(s.transition) && _made(s)), s => _num(s.points))

  const Poss_Used = fg.FGA + 0.44 * ft.FTA + TOV
  const PTS_per_Poss = _safe(totalPTS, Poss_Used)

  // Shot quality (contest values: wide open / open / light / heavy / blocked/smothered)
  const contestOf = s => String(s.contest ?? '').toLowerCase()
  const openShots  = shots.filter(s => { const c = contestOf(s); return c === 'wide open' || c === 'open' })
  const lightShots = shots.filter(s => contestOf(s) === 'light')
  const badShots   = shots.filter(s => { const c = contestOf(s); return c === 'heavy' || c.includes('block') || c.includes('smothered') })
  const Open_rate  = _safe(openShots.length, fg.FGA)
  const Light_rate = _safe(lightShots.length, fg.FGA)
  const Bad_rate   = _safe(badShots.length, fg.FGA)
  const Assisted_FG = shots.filter(s => _made(s) && s.assisted_by).length
  const Assisted_pct = _safe(Assisted_FG, fg.FGM)

  // Lineup aggregate (off_poss / def_poss / points_for / points_against)
  const totalPossFor     = _sum(lineupStints, st => _num(st.off_poss))
  const totalPossAgainst = _sum(lineupStints, st => _num(st.def_poss))
  const totalPtsFor      = _sum(lineupStints, st => _num(st.points_for))
  const totalPtsAgainst  = _sum(lineupStints, st => _num(st.points_against))
  const Off_Rtg = totalPossFor ? (totalPtsFor / totalPossFor) * 100 : null
  const Def_Rtg = totalPossAgainst ? (totalPtsAgainst / totalPossAgainst) * 100 : null
  const Net_Rtg = (Off_Rtg !== null && Def_Rtg !== null) ? Off_Rtg - Def_Rtg : null

  return {
    PTS: totalPTS, FGM: fg.FGM, FGA: fg.FGA, FG_pct: fg.FG_pct,
    threePM: fg.threePM, threePA: fg.threePA, threePT_pct: fg.threePT_pct,
    twoPM: fg.twoPM, twoPA: fg.twoPA, twoPT_pct: fg.twoPT_pct,
    FTM: ft.FTM, FTA: ft.FTA, FT_pct: ft.FT_pct, FT_PTS: ft.FT_PTS,
    eFG: fg.eFG, TS_pct, AST, AST_PTS, Pot_AST, Pot_AST_PTS,
    Adv_Created, Adv_PTS, Scr_AST, Scr_Opp, Scr_Adv, Scr_PTS,
    PaintTouch, DriveKick, TOV, OREB, DREB, REB, STL, BLK, Deflections, Charges, Fouls,
    TransPTS, Poss_Used, PTS_per_Poss,
    Open_rate, Light_rate, Bad_rate, Assisted_pct,
    Off_Rtg, Def_Rtg, Net_Rtg,
    FGA_total: fg.FGA, shots, events, freeThrows, lineupStints,
  }
}

function _playerStats(data, playerId) {
  const isOnCourt = st =>
    [st.player_1, st.player_2, st.player_3, st.player_4, st.player_5].includes(playerId)
  const filtered = {
    shots: data.shots.filter(s => s.player === playerId),
    events: data.events.filter(e => e.player === playerId),
    freeThrows: data.freeThrows.filter(ft => ft.player === playerId),
    lineupStints: (data.lineupStints ?? []).filter(isOnCourt),
  }
  const t = _teamStats(filtered)

  // Player assists: count made shots (across full team data) credited to this player.
  const assistedShots = data.shots.filter(s => _made(s) && s.assisted_by === playerId)
  t.AST = assistedShots.length
  t.AST_PTS = _shotPoints(assistedShots)
  t.Assisted_pct = _safe(filtered.shots.filter(s => _made(s) && s.assisted_by).length, t.FGM)

  // On-court lineup impact
  const onCourtStints = (data.lineupStints ?? []).filter(isOnCourt)
  const onPossFor     = _sum(onCourtStints, st => _num(st.off_poss))
  const onPossAgainst = _sum(onCourtStints, st => _num(st.def_poss))
  const onPtsFor      = _sum(onCourtStints, st => _num(st.points_for))
  const onPtsAgainst  = _sum(onCourtStints, st => _num(st.points_against))
  const onOff_Rtg = onPossFor ? (onPtsFor / onPossFor) * 100 : null
  const onDef_Rtg = onPossAgainst ? (onPtsAgainst / onPossAgainst) * 100 : null
  const onNet_Rtg = (onOff_Rtg !== null && onDef_Rtg !== null) ? onOff_Rtg - onDef_Rtg : null
  return { ...t, playerId, onCourtStints: onCourtStints.length, onOff_Rtg, onDef_Rtg, onNet_Rtg, onPossFor, onPossAgainst }
}

function _uniquePlayers(data) {
  return [...new Set([
    ...data.shots.map(s => s.player),
    ...data.events.map(e => e.player),
    ...data.freeThrows.map(ft => ft.player),
  ].filter(Boolean))]
}

function _normalizedZone(shot) {
  // Prefer geometry from shot_x/shot_y; fall back to stored shot_zone/zone.
  if (shot.shot_x !== undefined && shot.shot_x !== '' && shot.shot_y !== undefined && shot.shot_y !== '') {
    return zoneFromXY(shot.shot_x, shot.shot_y).zone
  }
  const z = String(shot.shot_zone ?? shot.zone ?? '').toLowerCase().trim()
  if (z === 'deep top 3') return 'top 3'
  if (z === 'midrange' || z === 'long midrange') return 'middle midrange'
  return z || 'other'
}

function _normalizedContest(shot) {
  const c = String(shot.contest ?? '').toLowerCase().trim()
  if (c.includes('wide open')) return 'wide open'
  if (c === 'open') return 'open'
  if (c === 'light') return 'light'
  if (c === 'heavy') return 'heavy'
  if (c.includes('block') || c.includes('smothered')) return 'blocked/smothered'
  return c || 'unknown'
}

// ── Constants ────────────────────────────────────────────────────────────────

export const ZONES = ['rim','paint','left midrange','middle midrange','right midrange','left corner 3','right corner 3','left wing 3','top 3','right wing 3']
export const CONTESTS = ['wide open','open','light','heavy','blocked/smothered']

// ── Utilities ────────────────────────────────────────────────────────────────

export function zoneFromXY(xPct, yPct) {
  const x = _num(xPct) / 100 * 15
  const y = _num(yPct) / 100 * 14
  const dx = x - 7.5
  const dy = y - 1.575
  const dist = Math.hypot(dx, dy)
  let zone = 'other'
  if (dist <= 1.35) zone = 'rim'
  else if (x >= 5.05 && x <= 9.95 && y <= 5.8) zone = 'paint'
  else if (dist < 6.75) {
    if (x < 5.2) zone = 'left midrange'
    else if (x > 9.8) zone = 'right midrange'
    else zone = 'middle midrange'
  } else {
    if (y < 3.05 && x < 2.2) zone = 'left corner 3'
    else if (y < 3.05 && x > 12.8) zone = 'right corner 3'
    else if (x < 5.2) zone = 'left wing 3'
    else if (x > 9.8) zone = 'right wing 3'
    else zone = 'top 3'
  }
  return { zone, dist: Math.round(dist * 10) / 10 }
}

export function normalizeShotZone(shot) { return { ...shot, zone: _normalizedZone(shot) } }
export const pctValue = _pct
export const pctText  = _pctText
export function round(v, digits = 2) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return null
  return Number(Number(v).toFixed(digits))
}
export function dashNull(v) { return (v === null || v === undefined || Number.isNaN(v)) ? '—' : v }
export function ratioText(m, a, pct = null) {
  const p = pct ?? _safe(m, a)
  return `${_num(m)}/${_num(a)} (${_pctText(p)})`
}

// ── In-memory refilter ───────────────────────────────────────────────────────

export function filterStats(data, { half, player } = {}) {
  const byHalf   = r => !half   || half   === 'ALL' || r.half   === half
  const byPlayer = r => !player || player === 'ALL' || r.player === player
  return {
    shots:        data.shots.filter(s  => byHalf(s) && byPlayer(s)),
    events:       data.events.filter(e => byHalf(e) && byPlayer(e)),
    freeThrows:   data.freeThrows.filter(ft => byHalf(ft) && byPlayer(ft)),
    lineupStints: (data.lineupStints ?? []).filter(st => byHalf(st)),
  }
}

// ── getHalfSplits ────────────────────────────────────────────────────────────

export function getHalfSplits(data) {
  return ['1H', '2H'].map(half => {
    const d = filterStats(data, { half })
    if (!d.shots.length && !d.events.length && !d.freeThrows.length) return null
    const t = _teamStats(d)
    return {
      half,
      PTS: t.PTS,
      FG: { value: `${t.FGM}/${t.FGA}`, secondary: _pctText(t.FG_pct) },
      threePoint: { value: `${t.threePM}/${t.threePA}`, secondary: _pctText(t.threePT_pct) },
      FT: { value: `${t.FTM}/${t.FTA}`, secondary: _pctText(t.FT_pct) },
      TS_pct: _pctText(t.TS_pct),
      AST: t.AST, TOV: t.TOV, Fouls: t.Fouls, OREB: t.OREB, DREB: t.DREB,
      STL: t.STL, BLK: t.BLK,
      Bad_Shot_Rate_pct: _pctText(t.Bad_rate),
      cards: [
        _card('PTS',  'PTS',   t.PTS),
        _card('FG',   'FG',    `${t.FGM}/${t.FGA}`, _pctText(t.FG_pct)),
        _card('3PT',  '3PT',   `${t.threePM}/${t.threePA}`, _pctText(t.threePT_pct)),
        _card('FT',   'FT',    `${t.FTM}/${t.FTA}`, _pctText(t.FT_pct)),
        _card('TS',   'TS%',   _pctText(t.TS_pct)),
        _card('AST',  'AST',   t.AST),
        _card('TOV',  'TOV',   t.TOV),
        _card('REB',  'REB',   t.REB),
        _card('Bad',  'Bad%',  _pctText(t.Bad_rate)),
      ],
    }
  }).filter(Boolean)
}

// ── getGameOverview ──────────────────────────────────────────────────────────

export function getGameOverview(data) {
  const t = _teamStats(data)
  const players = _uniquePlayers(data)
  const allPlayers = players.map(pid => _playerStats(data, pid))

  const pick = (cmp) => allPlayers.length ? allPlayers.reduce((a, b) => cmp(b) > cmp(a) ? b : a, allPlayers[0]) : null
  const topScorer    = pick(p => p.PTS)
  const topCreator   = pick(p => p.AST + p.Pot_AST)
  const bestScreener = pick(p => p.Scr_AST + p.Scr_Opp + p.Scr_Adv)
  const topRebounder = pick(p => p.REB)
  const topDefender  = pick(p => p.STL + p.BLK + p.Deflections + p.Charges)

  const leader_cards = {
    top_scorer:      topScorer    ? { player: topScorer.playerId,    value: topScorer.PTS,    label: 'Points' } : null,
    top_creator:     topCreator   ? { player: topCreator.playerId,   value: topCreator.AST + topCreator.Pot_AST, label: 'AST + Pot AST' } : null,
    best_screener:   bestScreener ? { player: bestScreener.playerId, value: bestScreener.Scr_AST + bestScreener.Scr_Opp + bestScreener.Scr_Adv, label: 'Screen Actions' } : null,
    top_rebounder:   topRebounder ? { player: topRebounder.playerId, value: topRebounder.REB, label: 'Rebounds' } : null,
    defensive_activity: topDefender ? { player: topDefender.playerId, value: topDefender.STL + topDefender.BLK + topDefender.Deflections + topDefender.Charges, label: 'Def Activity' } : null,
  }

  const shot_quality_note = [
    `Open ${_pctText(t.Open_rate)}`,
    `Light ${_pctText(t.Light_rate)}`,
    `Bad ${_pctText(t.Bad_rate)}`,
    `Assisted FG ${_pctText(t.Assisted_pct)}`,
  ].join(' · ')

  const zoneGroups = ZONES.map(z => {
    const sub = data.shots.filter(s => _normalizedZone(s) === z)
    const fg = _fgStats(sub)
    return { label: z, FGM: fg.FGM, FGA: fg.FGA, PPS: fg.FGA ? (fg.PTS / fg.FGA).toFixed(2) : '0.00' }
  }).filter(z => z.FGA >= 3)
  const best_zone = zoneGroups.length ? zoneGroups.reduce((a, b) => Number(b.PPS) > Number(a.PPS) ? b : a) : null

  const needs_attention = []
  if (t.Bad_rate !== null && t.Bad_rate > 0.20) needs_attention.push({ title: 'Shot Quality', message: `${_pctText(t.Bad_rate)} contested/bad shots`, priority: 'high' })
  if (t.threePT_pct !== null && t.threePT_pct < 0.25 && t.threePA >= 10) needs_attention.push({ title: '3PT Shooting', message: `${_pctText(t.threePT_pct)} on ${t.threePA} attempts`, priority: 'medium' })
  if (t.TOV > 10) needs_attention.push({ title: 'Turnovers', message: `${t.TOV} turnovers`, priority: 'high' })
  if (t.FT_pct !== null && t.FT_pct < 0.65 && t.FTA >= 10) needs_attention.push({ title: 'Free Throws', message: `${_pctText(t.FT_pct)} on ${t.FTA} attempts`, priority: 'medium' })
  if (t.Assisted_pct !== null && t.Assisted_pct < 0.40 && t.FGM >= 10) needs_attention.push({ title: 'Ball Movement', message: `Only ${_pctText(t.Assisted_pct)} of field goals assisted`, priority: 'medium' })

  const story_cards = [
    _card('efficiency', 'Efficiency', _pctText(t.TS_pct)),
    _card('shot_quality', 'Shot Quality', _pctText(t.Open_rate), 'open shot rate'),
    _card('creation', 'Creation', t.AST + t.Pot_AST + t.Adv_Created, 'total creation actions'),
    _card('possession', 'PTS/Poss', t.PTS_per_Poss !== null ? t.PTS_per_Poss.toFixed(2) : '—'),
  ]

  const team_control_dashboard = [
    _card('shooting_eff', 'eFG%',      _pctText(t.eFG)),
    _card('shot_qual',    'Bad Shot%', _pctText(t.Bad_rate)),
    _card('turnovers',    'TOV',       t.TOV),
    _card('rebounds',     'REB',       t.REB),
  ]

  return {
    leader_cards,
    shot_quality_note,
    best_zone,
    needs_attention,
    story_cards,
    half_splits: getHalfSplits(data),
    team_control_dashboard,
  }
}

// ── getAllPlayersAdvancedTable ─────────────────────────────────────────────────

export function getAllPlayersAdvancedTable(data) {
  const players = _uniquePlayers(data)
  const team = _teamStats(data)
  return players.map(pid => {
    const p = _playerStats(data, pid)
    const onStints = (data.lineupStints ?? []).filter(st =>
      [st.player_1, st.player_2, st.player_3, st.player_4, st.player_5].includes(pid)
    )
    const plus_minus = _sum(onStints, st => _num(st.points_for) - _num(st.points_against))
    const pShots = data.shots.filter(s => s.player === pid)
    const openP  = pShots.filter(s => ['wide open','open'].includes(_normalizedContest(s))).length
    const lightP = pShots.filter(s => _normalizedContest(s) === 'light').length
    const badP   = pShots.filter(s => ['heavy','blocked/smothered'].includes(_normalizedContest(s))).length
    return {
      player: pid,
      PTS: p.PTS,
      Usage_pct: _pctText(_safe(p.Poss_Used, team.Poss_Used)),
      FG: { value: `${p.FGM}/${p.FGA}`, secondary: _pctText(p.FG_pct) },
      threePoint: { value: `${p.threePM}/${p.threePA}`, secondary: _pctText(p.threePT_pct) },
      FT: { value: `${p.FTM}/${p.FTA}`, secondary: _pctText(p.FT_pct) },
      AST: p.AST,
      Extra_Potential_AST: p.Pot_AST,
      Advantage_Created: p.Adv_Created,
      Screen_OppAst_Created: p.Scr_AST + p.Scr_Opp + p.Scr_Adv,
      REB: p.REB,
      STL: p.STL, BLK: p.BLK, Deflections: p.Deflections,
      TOV: p.TOV,
      Open_pct: { value: `${openP}/${pShots.length}`, secondary: _pctText(_safe(openP, pShots.length)) },
      Light_pct: { value: `${lightP}/${pShots.length}`, secondary: _pctText(_safe(lightP, pShots.length)) },
      Bad_pct: { value: `${badP}/${pShots.length}`, secondary: _pctText(_safe(badP, pShots.length)) },
      plus_minus: plus_minus > 0 ? `+${plus_minus}` : String(plus_minus),
    }
  }).sort((a, b) => b.PTS - a.PTS)
}

// ── getStatLeaders ────────────────────────────────────────────────────────────

export function getStatLeaders(data) {
  const players = _uniquePlayers(data)
  const team = _teamStats(data)
  const rows = players.map(pid => {
    const p = _playerStats(data, pid)
    const TSA = p.FGA + 0.44 * p.FTA
    return {
      player: pid,
      ...p,
      TSA,
      eFG_pct: _pctText(p.eFG),
      TS_pct: _pctText(TSA ? p.PTS / (2 * TSA) : null),
      PTS_per_Poss: p.Poss_Used ? (p.PTS_per_Poss?.toFixed(2) ?? '—') : '—',
      Usage_pct: _pctText(_safe(p.Poss_Used, team.Poss_Used)),
      AST_PTS: p.AST_PTS,
      ADV_Created: p.Adv_Created,
      ADV_PTS: p.Adv_PTS,
      Paint_Touch_Created: p.PaintTouch,
      Drive_Kick_Created: p.DriveKick,
      AST_TO: p.TOV ? (p.AST / p.TOV).toFixed(1) : '—',
      Screen_AST: p.Scr_AST,
      Screen_Opp_Created: p.Scr_Opp,
      Screen_Adv_Created: p.Scr_Adv,
      Screen_Created_Total: p.Scr_AST + p.Scr_Opp + p.Scr_Adv,
      PTS_per_Screen: (p.Scr_AST + p.Scr_Opp + p.Scr_Adv) ? (p.Scr_PTS / (p.Scr_AST + p.Scr_Opp + p.Scr_Adv)).toFixed(1) : '—',
      OR: p.OREB, DR: p.DREB,
      Def_Activity: p.STL + p.BLK + p.Deflections + p.Charges,
      Charges: p.Charges,
      FG: { value: `${p.FGM}/${p.FGA}`, secondary: _pctText(p.FG_pct) },
      threePoint: { value: `${p.threePM}/${p.threePA}`, secondary: _pctText(p.threePT_pct) },
      FT: { value: `${p.FTM}/${p.FTA}`, secondary: _pctText(p.FT_pct) },
    }
  })
  return {
    scoring:           [...rows].sort((a,b) => b.PTS - a.PTS),
    creation:          [...rows].sort((a,b) => (b.AST + b.Pot_AST) - (a.AST + a.Pot_AST)),
    screening:         [...rows].sort((a,b) => b.Screen_Created_Total - a.Screen_Created_Total),
    rebounding_defense:[...rows].sort((a,b) => (b.REB + b.Def_Activity) - (a.REB + a.Def_Activity)),
  }
}

// ── getTeamSummaryCards ───────────────────────────────────────────────────────

export function getTeamSummaryCards(data) {
  const t = _teamStats(data)
  return [
    _card('PTS',      'PTS',             t.PTS),
    _card('FG',       'FG',              `${t.FGM}/${t.FGA}`, _pctText(t.FG_pct)),
    _card('FG_pct',   'FG%',             _pctText(t.FG_pct)),
    _card('twoPT',    '2PT',             `${t.twoPM}/${t.twoPA}`, _pctText(t.twoPT_pct)),
    _card('threePT',  '3PT',             `${t.threePM}/${t.threePA}`, _pctText(t.threePT_pct)),
    _card('threePT_pct','3PT%',          _pctText(t.threePT_pct)),
    _card('FT',       'FT',              `${t.FTM}/${t.FTA}`, _pctText(t.FT_pct)),
    _card('eFG',      'eFG%',            _pctText(t.eFG)),
    _card('TS',       'TS%',             _pctText(t.TS_pct)),
    _card('AST',      'AST',             t.AST),
    _card('AST_PTS',  'AST PTS',         t.AST_PTS),
    _card('Pot_AST',  'Pot AST',         t.Pot_AST),
    _card('Adv',      'ADV Created',     t.Adv_Created),
    _card('Scr',      'Screen Created',  t.Scr_AST + t.Scr_Opp + t.Scr_Adv),
    _card('Scr_PTS',  'Screen PTS',      t.Scr_PTS),
    _card('TOV',      'TOV',             t.TOV),
    _card('Poss',     'Est Poss Used',   Math.round(t.Poss_Used)),
    _card('PPS',      'PTS/Poss',        t.PTS_per_Poss !== null ? t.PTS_per_Poss.toFixed(2) : '—'),
    _card('Open_rate','Open Shot Rate',  _pctText(t.Open_rate)),
    _card('Light_rate','Light Contest%', _pctText(t.Light_rate)),
    _card('Bad_rate', 'Bad Shot Rate',   _pctText(t.Bad_rate)),
    _card('Trans',    'Transition PTS',  t.TransPTS),
    _card('REB',      'REB',             t.REB),
    _card('Def_Act',  'Def Activity',    t.STL + t.BLK + t.Deflections + t.Charges),
    _card('Off_Rtg',  'Off Rtg',         t.Off_Rtg !== null ? t.Off_Rtg.toFixed(1) : '—'),
    _card('Def_Rtg',  'Def Rtg',         t.Def_Rtg !== null ? t.Def_Rtg.toFixed(1) : '—'),
    _card('Net_Rtg',  'Net',             t.Net_Rtg !== null ? (t.Net_Rtg > 0 ? `+${t.Net_Rtg.toFixed(1)}` : t.Net_Rtg.toFixed(1)) : '—'),
  ]
}

// ── getTeamAdvancedStats ──────────────────────────────────────────────────────

export function getTeamAdvancedStats(data) {
  const t = _teamStats(data)
  const pct = v => _pctText(v)
  return {
    scoring_efficiency: [
      _card('PTS',    'PTS',       t.PTS),
      _card('eFG',    'eFG%',      pct(t.eFG)),
      _card('TS',     'TS%',       pct(t.TS_pct)),
      _card('PPS',    'PTS/Poss',  t.PTS_per_Poss?.toFixed(2) ?? '—'),
      _card('FG',     'FG',        `${t.FGM}/${t.FGA}`, pct(t.FG_pct)),
      _card('3PT',    '3PT',       `${t.threePM}/${t.threePA}`, pct(t.threePT_pct)),
      _card('2PT',    '2PT',       `${t.twoPM}/${t.twoPA}`, pct(t.twoPT_pct)),
      _card('FT',     'FT',        `${t.FTM}/${t.FTA}`, pct(t.FT_pct)),
      _card('Trans',  'Trans PTS', t.TransPTS),
    ],
    creation_passing: [
      _card('AST',    'AST',       t.AST),
      _card('ASTPTS', 'AST PTS',   t.AST_PTS),
      _card('PotAST', 'Pot AST',   t.Pot_AST),
      _card('PotPTS', 'Pot AST PTS', t.Pot_AST_PTS),
      _card('Adv',    'ADV Created', t.Adv_Created),
      _card('AdvPTS', 'ADV PTS',   t.Adv_PTS),
      _card('Paint',  'Paint Touch', t.PaintTouch),
      _card('Drive',  'Drive/Kick', t.DriveKick),
      _card('TOV',    'TOV',       t.TOV),
    ],
    screening: [
      _card('ScrAST',  'Screen AST',  t.Scr_AST),
      _card('ScrOpp',  'Screen Opp',  t.Scr_Opp),
      _card('ScrAdv',  'Screen Adv',  t.Scr_Adv),
      _card('ScrTot',  'Screen Total', t.Scr_AST + t.Scr_Opp + t.Scr_Adv),
      _card('ScrPTS',  'Screen PTS',  t.Scr_PTS),
    ],
    rebounding_defense: [
      _card('OREB',   'OREB',      t.OREB),
      _card('DREB',   'DREB',      t.DREB),
      _card('REB',    'REB',       t.REB),
      _card('STL',    'STL',       t.STL),
      _card('BLK',    'BLK',       t.BLK),
      _card('DEF',    'Deflections', t.Deflections),
      _card('Chg',    'Charges',   t.Charges),
      _card('Fouls',  'Fouls',     t.Fouls),
    ],
    shot_quality: [
      _card('Open',   'Open Shot%',  pct(t.Open_rate)),
      _card('Light',  'Light%',      pct(t.Light_rate)),
      _card('Bad',    'Bad Shot%',   pct(t.Bad_rate)),
      _card('AstFG',  'Assisted FG%', pct(t.Assisted_pct)),
    ],
    lineup_impact: data.lineupStints?.length
      ? [
          _card('OffRtg',  'Off Rtg',  t.Off_Rtg?.toFixed(1) ?? '—'),
          _card('DefRtg',  'Def Rtg',  t.Def_Rtg?.toFixed(1) ?? '—'),
          _card('NetRtg',  'Net Rtg',  t.Net_Rtg !== null ? (t.Net_Rtg > 0 ? `+${t.Net_Rtg.toFixed(1)}` : t.Net_Rtg.toFixed(1)) : '—'),
        ]
      : [_card('lineup_note', 'Lineup Impact', 'No lineup data recorded.')],
  }
}

// ── getShotChartData ──────────────────────────────────────────────────────────

function _shotChartBreakdown(shots, classify, buckets) {
  return buckets.map(label => {
    const sub = shots.filter(s => classify(s) === label)
    const fg = _fgStats(sub)
    return {
      label, FGM: fg.FGM, FGA: fg.FGA,
      FG: { value: `${fg.FGM}/${fg.FGA}`, secondary: _pctText(fg.FG_pct) },
      FG_pct: _pctText(fg.FG_pct),
      rate: shots.length ? _pctText(_safe(sub.length, shots.length)) : '—',
      PTS: fg.PTS,
      PPS: fg.FGA ? (fg.PTS / fg.FGA).toFixed(2) : '—',
    }
  })
}

export function getShotChartData(data) {
  const shots = data.shots
  return {
    shots,
    zone_breakdown: _shotChartBreakdown(shots, _normalizedZone, ZONES),
    contest_breakdown: _shotChartBreakdown(shots, _normalizedContest, CONTESTS),
  }
}

// ── getPlayerGameLog ──────────────────────────────────────────────────────────

export function getPlayerGameLog(data, playerId) {
  const pShots  = data.shots.filter(s => s.player === playerId)
  const pEvents = data.events.filter(e => e.player === playerId)
  const pFTs    = data.freeThrows.filter(ft => ft.player === playerId)
  const allStints = data.lineupStints ?? []

  const gameIds = [...new Set([
    ...pShots.map(s => s.game_id),
    ...pEvents.map(e => e.game_id),
    ...pFTs.map(ft => ft.game_id),
  ].filter(Boolean))].sort()

  return gameIds.map(gid => {
    const gs = pShots.filter(s => s.game_id === gid)
    const ge = pEvents.filter(e => e.game_id === gid)
    const gft = pFTs.filter(ft => ft.game_id === gid)
    const fg = _fgStats(gs)
    const ft = _ftStats(gft)
    const PTS = fg.PTS + ft.FT_PTS
    const AST = data.shots.filter(s => s.game_id === gid && _made(s) && s.assisted_by === playerId).length
    const REB = _countEvents(ge, 'rebound', 'offensive') + _countEvents(ge, 'rebound', 'defensive')
    const STL = _countEvents(ge, 'steal')
    const BLK = _countEvents(ge, 'block')
    const TO  = _countEvents(ge, 'turnover')
    const onStints = allStints.filter(st =>
      st.game_id === gid &&
      [st.player_1, st.player_2, st.player_3, st.player_4, st.player_5].includes(playerId)
    )
    const pm = _sum(onStints, st => _num(st.points_for) - _num(st.points_against))
    return {
      game_id: gid, PTS, REB, AST, STL, BLK, TO,
      FG: { value: `${fg.FGM}/${fg.FGA}`, secondary: _pctText(fg.FG_pct) },
      threePoint: { value: `${fg.threePM}/${fg.threePA}`, secondary: _pctText(fg.threePT_pct) },
      FT: { value: `${ft.FTM}/${ft.FTA}`, secondary: _pctText(ft.FT_pct) },
      pm: pm > 0 ? `+${pm}` : String(pm),
    }
  })
}

// ── getPlayerSeasonAverages ───────────────────────────────────────────────────

export function getPlayerSeasonAverages(gameLogRows) {
  if (!gameLogRows?.length) return []
  const GP = gameLogRows.length
  const tot = field => _sum(gameLogRows, r => {
    const v = r[field]
    if (v !== null && typeof v === 'object' && 'value' in v) return 0
    return _num(v)
  })
  const PPG = (tot('PTS') / GP).toFixed(1)
  const RPG = (tot('REB') / GP).toFixed(1)
  const APG = (tot('AST') / GP).toFixed(1)
  const SPG = (tot('STL') / GP).toFixed(1)
  const BPG = (tot('BLK') / GP).toFixed(1)
  const TOPG = (tot('TO') / GP).toFixed(1)
  let totalFGM=0, totalFGA=0, total3PM=0, total3PA=0, totalFTM=0, totalFTA=0
  gameLogRows.forEach(r => {
    const parsePair = obj => {
      if (!obj?.value) return [0,0]
      const parts = String(obj.value).split('/')
      return [_num(parts[0]), _num(parts[1])]
    }
    const [fgm,fga] = parsePair(r.FG); totalFGM+=fgm; totalFGA+=fga
    const [tpm,tpa] = parsePair(r.threePoint); total3PM+=tpm; total3PA+=tpa
    const [ftm,fta] = parsePair(r.FT); totalFTM+=ftm; totalFTA+=fta
  })
  return [
    _card('GP',   'GP',   GP),
    _card('PPG',  'PPG',  PPG),
    _card('RPG',  'RPG',  RPG),
    _card('APG',  'APG',  APG),
    _card('SPG',  'SPG',  SPG),
    _card('BPG',  'BPG',  BPG),
    _card('TOPG', 'TO',   TOPG),
    _card('FGP',  'FG%',  _pctText(_safe(totalFGM, totalFGA))),
    _card('3PP',  '3P%',  _pctText(_safe(total3PM, total3PA))),
    _card('FTP',  'FT%',  _pctText(_safe(totalFTM, totalFTA))),
  ]
}

// ── getPlayerAdvancedTabs ─────────────────────────────────────────────────────

export function getPlayerAdvancedTabs(data, playerId) {
  const p = _playerStats(data, playerId)
  const pData = filterStats(data, { player: playerId })
  const TSA = p.FGA + 0.44 * p.FTA
  const TS_pct = TSA ? p.PTS / (2 * TSA) : null
  const pct = v => _pctText(v)

  const pShots = data.shots.filter(s => s.player === playerId)
  const openP  = pShots.filter(s => ['wide open','open'].includes(_normalizedContest(s))).length
  const lightP = pShots.filter(s => _normalizedContest(s) === 'light').length
  const badP   = pShots.filter(s => ['heavy','blocked/smothered'].includes(_normalizedContest(s))).length
  const assistedP = pShots.filter(s => _made(s) && s.assisted_by).length

  return {
    scoring: {
      points_efficiency: [
        _card('PTS',   'PTS',    p.PTS),
        _card('FG',    'FG',     `${p.FGM}/${p.FGA}`, pct(p.FG_pct)),
        _card('2PT',   '2PT',    `${p.twoPM}/${p.twoPA}`, pct(p.twoPT_pct)),
        _card('3PT',   '3PT',    `${p.threePM}/${p.threePA}`, pct(p.threePT_pct)),
        _card('FT',    'FT',     `${p.FTM}/${p.FTA}`, pct(p.FT_pct)),
        _card('eFG',   'eFG%',   pct(p.eFG)),
        _card('TS',    'TS%',    pct(TS_pct)),
        _card('PPS',   'PTS/Poss', p.PTS_per_Poss?.toFixed(2) ?? '—'),
        _card('Trans', 'Trans PTS', p.TransPTS),
      ],
      shot_quality: [
        _card('Open',  'Open Shot%',   pct(_safe(openP, pShots.length))),
        _card('Light', 'Light%',       pct(_safe(lightP, pShots.length))),
        _card('Bad',   'Bad Shot%',    pct(_safe(badP, pShots.length))),
        _card('AstFG', 'Assisted FG%', pct(_safe(assistedP, p.FGM))),
      ],
      shot_chart: getShotChartData(pData),
    },
    creation_passing: [
      _card('AST',    'AST',         p.AST),
      _card('ASTPTS', 'AST PTS',     p.AST_PTS),
      _card('PotAST', 'Pot AST',     p.Pot_AST),
      _card('PotPTS', 'Pot AST PTS', p.Pot_AST_PTS),
      _card('Adv',    'ADV Created', p.Adv_Created),
      _card('AdvPTS', 'ADV PTS',     p.Adv_PTS),
      _card('Paint',  'Paint Touch', p.PaintTouch),
      _card('Drive',  'Drive/Kick',  p.DriveKick),
      _card('TOV',    'TOV',         p.TOV),
      _card('AST_TO', 'AST/TO',      p.TOV ? (p.AST / p.TOV).toFixed(1) : '—'),
    ],
    screening: [
      _card('ScrAST', 'Screen AST',   p.Scr_AST),
      _card('ScrOpp', 'Screen Opp',   p.Scr_Opp),
      _card('ScrAdv', 'Screen Adv',   p.Scr_Adv),
      _card('ScrTot', 'Screen Total', p.Scr_AST + p.Scr_Opp + p.Scr_Adv),
      _card('ScrPTS', 'Screen PTS',   p.Scr_PTS),
      _card('PPS',    'PTS/Screen',   (p.Scr_AST + p.Scr_Opp + p.Scr_Adv) ? (p.Scr_PTS / (p.Scr_AST + p.Scr_Opp + p.Scr_Adv)).toFixed(1) : '—'),
    ],
    rebounding_defense: [
      _card('OREB',  'OREB',       p.OREB),
      _card('DREB',  'DREB',       p.DREB),
      _card('REB',   'REB',        p.REB),
      _card('STL',   'STL',        p.STL),
      _card('BLK',   'BLK',        p.BLK),
      _card('DEF',   'Deflections', p.Deflections),
      _card('Chg',   'Charges',    p.Charges),
      _card('Fouls', 'Fouls',      p.Fouls),
    ],
    lineup_impact: p.onCourtStints > 0
      ? [
          _card('Stints', 'Stints On Court', p.onCourtStints),
          _card('OffRtg', 'Off Rtg',  p.onOff_Rtg?.toFixed(1) ?? '—'),
          _card('DefRtg', 'Def Rtg',  p.onDef_Rtg?.toFixed(1) ?? '—'),
          _card('NetRtg', 'Net Rtg',  p.onNet_Rtg !== null ? (p.onNet_Rtg > 0 ? `+${p.onNet_Rtg.toFixed(1)}` : p.onNet_Rtg.toFixed(1)) : '—'),
          _card('PossFor',  'Poss For',     p.onPossFor),
          _card('PossAgainst','Poss Against', p.onPossAgainst),
        ]
      : [_card('lineup_note', 'Lineup Impact', 'No lineup data recorded.')],
  }
}
