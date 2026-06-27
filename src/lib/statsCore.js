// Spartans Stats — unified data + display engine (v0.7.0)
// Computes stats from backend.getStats() shape: { shots, events, freeThrows, lineupStints }
// and returns display-ready descriptor objects for MetricRow, GroupRow, and DataTable.
//
// Data taxonomy:
//   events: event_type ∈ { creation, screen, rebound, steal, block, deflection, turnover, foul, charge_drawn }
//     creation subtypes: potential_assist, advantage_created, paint_touch_created, drive_kick_created
//     screen subtypes:   screen_assist, screen_opportunity, advantage_created
//   No "assist" event — assists derived from shots[].assisted_by.
//   freeThrows have no points field — a made FT = 1 point.
//   lineupStints use off_poss / def_poss / points_for / points_against.
//
// Display descriptor shapes:
//   MetricCard:      { label, main, secondary?, sub? }
//   StatGroup:       { title, rows: [{ label, value, secondary? }] }
//   TableDescriptor: { columns: [{ key, label, type }], rows: [] }
//   NoteBlock:       { title, body, variant? }  ('warn' | 'danger')
//
// Public API:
//   Utilities: filterStats, getShotChartData, zoneFromXY, normalizeShotZone,
//              pctText, pctValue, round, dashNull, ratioText, ZONES, CONTESTS
//   Display:   display*

// ── Internal helpers ──────────────────────────────────────────────────────────

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

function _normText(v) {
  return String(v ?? '').toLowerCase().trim().replace(/[\s-]+/g, '_')
}
function _creationMethod(e) {
  if (e?.event_type !== 'creation') return null
  const raw = _normText(e.creation_method ?? e.creationMethod ?? e.creation_type ?? e.creationType ?? e.method ?? e.method_type)
  const sub = _normText(e.event_subtype)
  const v = raw || sub
  if (['paint_touch','painttouch','paint_touch_created','paint','paint_dump','dump_off','dumpoff','drive_dump','drive_and_dump','interior','interior_dump'].includes(v)) return 'paint_touch'
  if (['drive_kick','drivekick','drive_kick_created','kickout','kick_out','drive_and_kick','drive_to_kick'].includes(v)) return 'drive_kick'
  if (['other','advantage','advantage_created','other_advantage','general_advantage','extra_pass','pass_advantage'].includes(v)) return 'other'
  return null
}
function _creationOutcome(e) {
  if (e?.event_type !== 'creation') return null
  const raw = _normText(e.creation_outcome ?? e.creationOutcome ?? e.outcome ?? e.result_type)
  const sub = _normText(e.event_subtype)
  const v = raw || sub
  if (['potential_assist','potential_ast','pot_ast','missed_assist','miss_assist'].includes(v)) return 'potential_assist'
  if (['made_assist','assist','made_ast','ast'].includes(v)) return 'made_assist'
  if (['foul_created','ft_created','free_throws_created','shooting_foul_created'].includes(v)) return 'foul_created'
  if (['advantage_only','advantage','advantage_created','paint_touch_created','drive_kick_created','other'].includes(v)) return 'advantage_only'
  return null
}
function _countCreation(events, { outcome = null, method = null } = {}) {
  return _sum(events, e => {
    if (e.event_type !== 'creation') return 0
    if (outcome && _creationOutcome(e) !== outcome) return 0
    if (method && _creationMethod(e) !== method) return 0
    return _num(e.count) || 1
  })
}
function _creationPoints(events, { outcome = null, method = null } = {}) {
  return _sum(events, e => {
    if (e.event_type !== 'creation') return 0
    if (outcome && _creationOutcome(e) !== outcome) return 0
    if (method && _creationMethod(e) !== method) return 0
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

function _fgStats(shots = []) {
  const made = shots.filter(_made)
  const FGM = made.length
  const FGA = shots.length
  const threeShots = shots.filter(s => _num(s.points) === 3)
  const twoActual  = shots.filter(s => _num(s.points) !== 3)
  const threePM = threeShots.filter(_made).length
  const threePA = threeShots.length
  const twoPM = twoActual.filter(_made).length
  const twoPA = twoActual.length
  const PTS = _shotPoints(shots)
  const eFG = FGA ? (FGM + 0.5 * threePM) / FGA : null
  return {
    FGM, FGA, FG_pct: _safe(FGM, FGA),
    threePM, threePA, threePT_pct: _safe(threePM, threePA),
    twoPM, twoPA, twoPT_pct: _safe(twoPM, twoPA),
    PTS, eFG,
  }
}

function _ftStats(fts = []) {
  const FTM = fts.filter(_made).length
  const FTA = fts.length
  return { FTM, FTA, FT_pct: _safe(FTM, FTA), FT_PTS: FTM }
}

function _teamStats(data) {
  const { shots = [], events = [], freeThrows = [], lineupStints = [] } = data
  const fg = _fgStats(shots)
  const ft = _ftStats(freeThrows)

  const totalPTS = fg.PTS + ft.FT_PTS
  const TSA = fg.FGA + 0.44 * ft.FTA
  const TS_pct = TSA ? totalPTS / (2 * TSA) : null

  const assistedShots = shots.filter(s => _made(s) && s.assisted_by)
  const AST     = assistedShots.length
  const AST_PTS = _shotPoints(assistedShots)

  const Pot_AST     = _countCreation(events, { outcome: 'potential_assist' })
  const Pot_AST_PTS = _creationPoints(events, { outcome: 'potential_assist' })
  const Adv_Created = _countCreation(events, { method: 'other' })
  const Adv_PTS     = _creationPoints(events, { method: 'other' })
  const PaintTouch  = _countCreation(events, { method: 'paint_touch' })
  const PaintTouch_PTS = _creationPoints(events, { method: 'paint_touch' })
  const DriveKick   = _countCreation(events, { method: 'drive_kick' })
  const DriveKick_PTS  = _creationPoints(events, { method: 'drive_kick' })
  const Creation_Total = Adv_Created + PaintTouch + DriveKick

  const Pot_AST_PaintTouch = _countCreation(events, { outcome: 'potential_assist', method: 'paint_touch' })
  const Pot_AST_DriveKick  = _countCreation(events, { outcome: 'potential_assist', method: 'drive_kick' })
  const Pot_AST_Other      = _countCreation(events, { outcome: 'potential_assist', method: 'other' })

  const Scr_AST = _countEvents(events, 'screen', 'screen_assist')
  const Scr_Opp = _countEvents(events, 'screen', 'screen_opportunity')
  const Scr_Adv = _countEvents(events, 'screen', 'advantage_created')
  const Scr_PTS = _eventPoints(events, 'screen', 'screen_assist')
              + _eventPoints(events, 'screen', 'screen_opportunity')
              + _eventPoints(events, 'screen', 'advantage_created')

  const TOV         = _countEvents(events, 'turnover')
  const OREB        = _countEvents(events, 'rebound', 'offensive')
  const DREB        = _countEvents(events, 'rebound', 'defensive')
  const REB         = OREB + DREB
  const STL         = _countEvents(events, 'steal')
  const BLK         = _countEvents(events, 'block')
  const Deflections = _countEvents(events, 'deflection')
  const Charges     = _countEvents(events, 'charge_drawn')
  const Fouls       = _countEvents(events, 'foul')

  const TransPTS = _sum(shots.filter(s => _yes(s.transition) && _made(s)), s => _num(s.points))

  const Poss_Used    = fg.FGA + 0.44 * ft.FTA + TOV
  const PTS_per_Poss = _safe(totalPTS, Poss_Used)

  const contestOf  = s => String(s.contest ?? '').toLowerCase()
  const openShots  = shots.filter(s => { const c = contestOf(s); return c === 'wide open' || c === 'open' })
  const lightShots = shots.filter(s => contestOf(s) === 'light')
  const badShots   = shots.filter(s => { const c = contestOf(s); return c === 'heavy' || c.includes('block') || c.includes('smothered') })
  const Open_rate  = _safe(openShots.length, fg.FGA)
  const Light_rate = _safe(lightShots.length, fg.FGA)
  const Bad_rate   = _safe(badShots.length, fg.FGA)
  const Assisted_pct = _safe(shots.filter(s => _made(s) && s.assisted_by).length, fg.FGM)

  const totalPossFor     = _sum(lineupStints, st => _num(st.off_poss))
  const totalPossAgainst = _sum(lineupStints, st => _num(st.def_poss))
  const totalPtsFor      = _sum(lineupStints, st => _num(st.points_for))
  const totalPtsAgainst  = _sum(lineupStints, st => _num(st.points_against))
  const Off_Rtg = totalPossFor     ? (totalPtsFor     / totalPossFor)     * 100 : null
  const Def_Rtg = totalPossAgainst ? (totalPtsAgainst / totalPossAgainst) * 100 : null
  const Net_Rtg = (Off_Rtg !== null && Def_Rtg !== null) ? Off_Rtg - Def_Rtg : null

  return {
    PTS: totalPTS, FGM: fg.FGM, FGA: fg.FGA, FG_pct: fg.FG_pct,
    threePM: fg.threePM, threePA: fg.threePA, threePT_pct: fg.threePT_pct,
    twoPM: fg.twoPM, twoPA: fg.twoPA, twoPT_pct: fg.twoPT_pct,
    FTM: ft.FTM, FTA: ft.FTA, FT_pct: ft.FT_pct, FT_PTS: ft.FT_PTS,
    eFG: fg.eFG, TS_pct, AST, AST_PTS, Pot_AST, Pot_AST_PTS,
    Adv_Created, Adv_PTS, PaintTouch_PTS, DriveKick_PTS, Creation_Total,
    Pot_AST_PaintTouch, Pot_AST_DriveKick, Pot_AST_Other,
    Scr_AST, Scr_Opp, Scr_Adv, Scr_PTS,
    PaintTouch, DriveKick, TOV, OREB, DREB, REB, STL, BLK, Deflections, Charges, Fouls,
    TransPTS, Poss_Used, PTS_per_Poss, Open_rate, Light_rate, Bad_rate, Assisted_pct,
    Off_Rtg, Def_Rtg, Net_Rtg,
  }
}

function _playerStats(data, playerId) {
  const isOnCourt = st =>
    [st.player_1, st.player_2, st.player_3, st.player_4, st.player_5].includes(playerId)
  const filtered = {
    shots:        data.shots.filter(s => s.player === playerId),
    events:       data.events.filter(e => e.player === playerId),
    freeThrows:   data.freeThrows.filter(ft => ft.player === playerId),
    lineupStints: (data.lineupStints ?? []).filter(isOnCourt),
  }
  const t = _teamStats(filtered)

  const assistedShots = data.shots.filter(s => _made(s) && s.assisted_by === playerId)
  t.AST      = assistedShots.length
  t.AST_PTS  = _shotPoints(assistedShots)
  t.Assisted_pct = _safe(filtered.shots.filter(s => _made(s) && s.assisted_by).length, t.FGM)

  const onCourtStints = (data.lineupStints ?? []).filter(isOnCourt)
  const onPossFor     = _sum(onCourtStints, st => _num(st.off_poss))
  const onPossAgainst = _sum(onCourtStints, st => _num(st.def_poss))
  const onPtsFor      = _sum(onCourtStints, st => _num(st.points_for))
  const onPtsAgainst  = _sum(onCourtStints, st => _num(st.points_against))
  const onOff_Rtg = onPossFor     ? (onPtsFor     / onPossFor)     * 100 : null
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

function _shotChartBreakdown(shots, classify, buckets) {
  return buckets.map(label => {
    const sub = shots.filter(s => classify(s) === label)
    const fg = _fgStats(sub)
    return {
      label, FGM: fg.FGM, FGA: fg.FGA,
      FG:     { value: `${fg.FGM}/${fg.FGA}`, secondary: _pctText(fg.FG_pct) },
      FG_pct: _pctText(fg.FG_pct),
      rate:   shots.length ? _pctText(_safe(sub.length, shots.length)) : '—',
      PTS:    fg.PTS,
      PPS:    fg.FGA ? (fg.PTS / fg.FGA).toFixed(2) : '—',
    }
  })
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const ZONES    = ['rim','paint','left midrange','middle midrange','right midrange','left corner 3','right corner 3','left wing 3','top 3','right wing 3']
export const CONTESTS = ['wide open','open','light','heavy','blocked/smothered']

// ── Utilities ─────────────────────────────────────────────────────────────────

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
    if (y < 3.05 && x < 2.2)  zone = 'left corner 3'
    else if (y < 3.05 && x > 12.8) zone = 'right corner 3'
    else if (x < 5.2)  zone = 'left wing 3'
    else if (x > 9.8)  zone = 'right wing 3'
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

// ── filterStats ───────────────────────────────────────────────────────────────

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

// ── getShotChartData ──────────────────────────────────────────────────────────

export function getShotChartData(data) {
  const shots = data.shots
  return {
    shots,
    zone_breakdown:    _shotChartBreakdown(shots, _normalizedZone,    ZONES),
    contest_breakdown: _shotChartBreakdown(shots, _normalizedContest, CONTESTS),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

export function displayGameOverview(data, nameMap = {}) {
  const t = _teamStats(data)
  const allPlayers = _uniquePlayers(data).map(pid => _playerStats(data, pid))
  const name = id => nameMap[id] || id

  // Leaders — pick best player per category
  const pick = cmp => allPlayers.length ? allPlayers.reduce((a, b) => cmp(b) > cmp(a) ? b : a, allPlayers[0]) : null
  const topScorer    = pick(p => p.PTS)
  const topCreator   = pick(p => p.AST + p.Pot_AST)
  const bestScreener = pick(p => p.Scr_AST + p.Scr_Opp + p.Scr_Adv)
  const topRebounder = pick(p => p.REB)
  const topDefender  = pick(p => p.STL + p.BLK + p.Deflections + p.Charges)

  const leaders = [
    topScorer    && { label: 'Top Scorer',    main: name(topScorer.playerId),    sub: `${topScorer.PTS} Points` },
    topCreator   && { label: 'Top Creator',   main: name(topCreator.playerId),   sub: `${topCreator.AST + topCreator.Pot_AST} AST + Pot AST` },
    bestScreener && { label: 'Best Screener', main: name(bestScreener.playerId), sub: `${bestScreener.Scr_AST + bestScreener.Scr_Opp + bestScreener.Scr_Adv} Screen Actions` },
    topRebounder && { label: 'Top Rebounder', main: name(topRebounder.playerId), sub: `${topRebounder.REB} Rebounds` },
    topDefender  && { label: 'Top Defender',  main: name(topDefender.playerId),  sub: `${topDefender.STL + topDefender.BLK + topDefender.Deflections + topDefender.Charges} Def Activity` },
  ].filter(Boolean)

  // Notes
  const notes = [
    { title: 'Shot Quality', body: `Open ${_pctText(t.Open_rate)} · Light ${_pctText(t.Light_rate)} · Bad ${_pctText(t.Bad_rate)} · Assisted FG ${_pctText(t.Assisted_pct)}` },
  ]
  const zoneGroups = ZONES.map(z => {
    const sub = data.shots.filter(s => _normalizedZone(s) === z)
    const fg  = _fgStats(sub)
    return { label: z, FGM: fg.FGM, FGA: fg.FGA, PPS: fg.FGA ? (fg.PTS / fg.FGA).toFixed(2) : '0.00' }
  }).filter(z => z.FGA >= 3)
  const bestZone = zoneGroups.length ? zoneGroups.reduce((a, b) => Number(b.PPS) > Number(a.PPS) ? b : a) : null
  if (bestZone) notes.push({ title: 'Best Zone', body: `${bestZone.label}: ${bestZone.FGM}/${bestZone.FGA}, ${bestZone.PPS} PPS` })
  if (t.Bad_rate !== null && t.Bad_rate > 0.20)                         notes.push({ title: 'Shot Quality',  body: `${_pctText(t.Bad_rate)} contested/bad shots`,                     variant: 'danger' })
  if (t.threePT_pct !== null && t.threePT_pct < 0.25 && t.threePA >= 10) notes.push({ title: '3PT Shooting',  body: `${_pctText(t.threePT_pct)} on ${t.threePA} attempts`,            variant: 'warn' })
  if (t.TOV > 10)                                                         notes.push({ title: 'Turnovers',     body: `${t.TOV} turnovers`,                                              variant: 'danger' })
  if (t.FT_pct !== null && t.FT_pct < 0.65 && t.FTA >= 10)              notes.push({ title: 'Free Throws',   body: `${_pctText(t.FT_pct)} on ${t.FTA} attempts`,                     variant: 'warn' })
  if (t.Assisted_pct !== null && t.Assisted_pct < 0.40 && t.FGM >= 10)  notes.push({ title: 'Ball Movement', body: `Only ${_pctText(t.Assisted_pct)} of field goals assisted`,        variant: 'warn' })

  // Metrics (4 summary cards)
  const metrics = [
    { label: 'Points',
      main: String(t.PTS),
      sub:  `FG ${t.FGM}/${t.FGA} · 3PT ${t.threePM}/${t.threePA} · FT ${t.FTM}/${t.FTA}` },
    { label: 'Efficiency',
      main: `${_pctText(t.eFG)} eFG`,
      sub:  `${_pctText(t.TS_pct)} TS · ${t.PTS_per_Poss?.toFixed(2) ?? '—'} pts/poss` },
    { label: 'Creation',
      main: `${t.AST} AST`,
      sub:  `${t.Pot_AST} pot · ${t.Adv_Created} ADV · ${t.TOV} TOV` },
    { label: 'Shot Quality',
      main: `${_pctText(t.Open_rate)} open`,
      sub:  `${_pctText(t.Bad_rate)} bad · ${_pctText(t.Light_rate)} light` },
  ]

  // Half splits
  const halfSplits = ['1H', '2H'].map(half => {
    const d = filterStats(data, { half })
    if (!d.shots.length && !d.events.length && !d.freeThrows.length) return null
    const h = _teamStats(d)
    return {
      title: half === '1H' ? '1st Half' : '2nd Half',
      rows: [
        { label: 'PTS',  value: String(h.PTS) },
        { label: 'FG',   value: `${h.FGM}/${h.FGA}`,         secondary: _pctText(h.FG_pct) },
        { label: '3PT',  value: `${h.threePM}/${h.threePA}`, secondary: _pctText(h.threePT_pct) },
        { label: 'FT',   value: `${h.FTM}/${h.FTA}`,         secondary: _pctText(h.FT_pct) },
        { label: 'TS%',  value: _pctText(h.TS_pct) },
        { label: 'AST',  value: String(h.AST) },
        { label: 'TOV',  value: String(h.TOV) },
        { label: 'OREB', value: String(h.OREB) },
        { label: 'DREB', value: String(h.DREB) },
        { label: 'STL',  value: String(h.STL) },
        { label: 'BLK',  value: String(h.BLK) },
        { label: 'Bad%', value: _pctText(h.Bad_rate) },
      ],
    }
  }).filter(Boolean)

  // Team control (4 quick-read cards)
  const teamControl = [
    { label: 'eFG%',      main: _pctText(t.eFG) },
    { label: 'Bad Shot%', main: _pctText(t.Bad_rate) },
    { label: 'Turnovers', main: String(t.TOV) },
    { label: 'Rebounds',  main: String(t.REB) },
  ]

  return { leaders, notes, metrics, halfSplits, teamControl }
}

export function displayGameBoxScore(data, nameMap = {}) {
  const team = _teamStats(data)
  const rows = _uniquePlayers(data).map(pid => {
    const p = _playerStats(data, pid)
    const onStints   = (data.lineupStints ?? []).filter(st =>
      [st.player_1, st.player_2, st.player_3, st.player_4, st.player_5].includes(pid)
    )
    const plus_minus = _sum(onStints, st => _num(st.points_for) - _num(st.points_against))
    const pShots = data.shots.filter(s => s.player === pid)
    const openP  = pShots.filter(s => ['wide open','open'].includes(_normalizedContest(s))).length
    const lightP = pShots.filter(s => _normalizedContest(s) === 'light').length
    const badP   = pShots.filter(s => ['heavy','blocked/smothered'].includes(_normalizedContest(s))).length
    return {
      player:                 nameMap[pid] || pid,
      PTS:                    p.PTS,
      Usage_pct:              _pctText(_safe(p.Poss_Used, team.Poss_Used)),
      FG:                     { value: `${p.FGM}/${p.FGA}`,         secondary: _pctText(p.FG_pct) },
      threePoint:             { value: `${p.threePM}/${p.threePA}`, secondary: _pctText(p.threePT_pct) },
      FT:                     { value: `${p.FTM}/${p.FTA}`,         secondary: _pctText(p.FT_pct) },
      AST:                    p.AST,
      Extra_Potential_AST:    p.Pot_AST,
      Advantage_Created:      p.Adv_Created,
      Screen_OppAst_Created:  p.Scr_AST + p.Scr_Opp + p.Scr_Adv,
      REB: p.REB, STL: p.STL, BLK: p.BLK, Deflections: p.Deflections, TOV: p.TOV,
      Open_pct: { value: `${openP}/${pShots.length}`, secondary: _pctText(_safe(openP, pShots.length)) },
      Light_pct: { value: `${lightP}/${pShots.length}`, secondary: _pctText(_safe(lightP, pShots.length)) },
      Bad_pct:   { value: `${badP}/${pShots.length}`,   secondary: _pctText(_safe(badP, pShots.length)) },
      plus_minus: plus_minus > 0 ? `+${plus_minus}` : String(plus_minus),
    }
  }).sort((a, b) => b.PTS - a.PTS)

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

export function displayGameStatLeaders(data, nameMap = {}) {
  const team = _teamStats(data)
  const rows = _uniquePlayers(data).map(pid => {
    const p   = _playerStats(data, pid)
    const TSA = p.FGA + 0.44 * p.FTA
    return {
      player:               nameMap[pid] || pid,
      PTS:                  p.PTS,
      AST:                  p.AST,
      AST_PTS:              p.AST_PTS,
      Pot_AST:              p.Pot_AST,
      TOV:                  p.TOV,
      REB:                  p.REB,
      OR:                   p.OREB,
      DR:                   p.DREB,
      STL:                  p.STL,
      BLK:                  p.BLK,
      Deflections:          p.Deflections,
      Charges:              p.Charges,
      Scr_PTS:              p.Scr_PTS,
      eFG_pct:              _pctText(p.eFG),
      TS_pct:               _pctText(TSA ? p.PTS / (2 * TSA) : null),
      PTS_per_Poss:         p.Poss_Used ? (p.PTS_per_Poss?.toFixed(2) ?? '—') : '—',
      Usage_pct:            _pctText(_safe(p.Poss_Used, team.Poss_Used)),
      ADV_Created:          p.Adv_Created,
      Paint_Touch_Created:  p.PaintTouch,
      Drive_Kick_Created:   p.DriveKick,
      AST_TO:               p.TOV ? (p.AST / p.TOV).toFixed(1) : '—',
      Screen_AST:           p.Scr_AST,
      Screen_Opp_Created:   p.Scr_Opp,
      Screen_Adv_Created:   p.Scr_Adv,
      Screen_Created_Total: p.Scr_AST + p.Scr_Opp + p.Scr_Adv,
      PTS_per_Screen:       (p.Scr_AST + p.Scr_Opp + p.Scr_Adv)
                              ? (p.Scr_PTS / (p.Scr_AST + p.Scr_Opp + p.Scr_Adv)).toFixed(1) : '—',
      Def_Activity:         p.STL + p.BLK + p.Deflections + p.Charges,
      FG:         { value: `${p.FGM}/${p.FGA}`,         secondary: _pctText(p.FG_pct) },
      threePoint: { value: `${p.threePM}/${p.threePA}`, secondary: _pctText(p.threePT_pct) },
      FT:         { value: `${p.FTM}/${p.FTA}`,         secondary: _pctText(p.FT_pct) },
    }
  })

  return {
    scoring: {
      columns: [
        { key: 'player',       type: 'name',   label: 'Player' },
        { key: 'PTS',          type: 'number', label: 'PTS' },
        { key: 'FG',           type: 'ratio',  label: 'FG' },
        { key: 'threePoint',   type: 'ratio',  label: '3PT' },
        { key: 'FT',           type: 'ratio',  label: 'FT' },
        { key: 'eFG_pct',      type: 'pct',    label: 'eFG%' },
        { key: 'TS_pct',       type: 'pct',    label: 'TS%' },
        { key: 'PTS_per_Poss', type: 'number', label: 'PTS/P' },
        { key: 'Usage_pct',    type: 'pct',    label: 'USG%' },
      ],
      rows: [...rows].sort((a, b) => b.PTS - a.PTS),
    },
    creation: {
      columns: [
        { key: 'player',              type: 'name',   label: 'Player' },
        { key: 'AST',                 type: 'number', label: 'AST' },
        { key: 'AST_PTS',             type: 'number', label: 'AST PTS' },
        { key: 'Pot_AST',             type: 'number', label: 'POT AST' },
        { key: 'ADV_Created',         type: 'number', label: 'ADV' },
        { key: 'Paint_Touch_Created', type: 'number', label: 'PAINT' },
        { key: 'Drive_Kick_Created',  type: 'number', label: 'DRV/KCK' },
        { key: 'AST_TO',              type: 'number', label: 'AST/TO' },
        { key: 'TOV',                 type: 'number', label: 'TOV' },
      ],
      rows: [...rows].sort((a, b) => (b.AST + b.Pot_AST) - (a.AST + a.Pot_AST)),
    },
    screening: {
      columns: [
        { key: 'player',               type: 'name',   label: 'Player' },
        { key: 'Screen_Created_Total', type: 'number', label: 'SCR TOT' },
        { key: 'Screen_AST',           type: 'number', label: 'SCR AST' },
        { key: 'Screen_Opp_Created',   type: 'number', label: 'SCR OPP' },
        { key: 'Screen_Adv_Created',   type: 'number', label: 'SCR ADV' },
        { key: 'Scr_PTS',              type: 'number', label: 'SCR PTS' },
        { key: 'PTS_per_Screen',       type: 'number', label: 'PTS/SCR' },
      ],
      rows: [...rows].sort((a, b) => b.Screen_Created_Total - a.Screen_Created_Total),
    },
    defense: {
      columns: [
        { key: 'player',       type: 'name',   label: 'Player' },
        { key: 'REB',          type: 'number', label: 'REB' },
        { key: 'OR',           type: 'number', label: 'OR' },
        { key: 'DR',           type: 'number', label: 'DR' },
        { key: 'STL',          type: 'number', label: 'STL' },
        { key: 'BLK',          type: 'number', label: 'BLK' },
        { key: 'Deflections',  type: 'number', label: 'DEF' },
        { key: 'Charges',      type: 'number', label: 'CHG' },
        { key: 'Def_Activity', type: 'number', label: 'DEF ACT' },
      ],
      rows: [...rows].sort((a, b) => (b.REB + b.Def_Activity) - (a.REB + a.Def_Activity)),
    },
  }
}

export function displayTeamAdvancedStats(data) {
  const t = _teamStats(data)
  const netSign = v => v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)
  return {
    groups: [
      { title: 'Scoring & Efficiency', rows: [
        { label: 'PTS',       value: String(t.PTS) },
        { label: 'eFG%',      value: _pctText(t.eFG) },
        { label: 'TS%',       value: _pctText(t.TS_pct) },
        { label: 'PTS/Poss',  value: t.PTS_per_Poss?.toFixed(2) ?? '—' },
        { label: 'FG',        value: `${t.FGM}/${t.FGA}`,         secondary: _pctText(t.FG_pct) },
        { label: '3PT',       value: `${t.threePM}/${t.threePA}`, secondary: _pctText(t.threePT_pct) },
        { label: '2PT',       value: `${t.twoPM}/${t.twoPA}`,     secondary: _pctText(t.twoPT_pct) },
        { label: 'FT',        value: `${t.FTM}/${t.FTA}`,         secondary: _pctText(t.FT_pct) },
        { label: 'Trans PTS', value: String(t.TransPTS) },
      ]},
      { title: 'Creation & Passing', rows: [
        { label: 'AST',         value: String(t.AST) },
        { label: 'AST PTS',     value: String(t.AST_PTS) },
        { label: 'Pot AST',     value: String(t.Pot_AST) },
        { label: 'Pot AST PTS', value: String(t.Pot_AST_PTS) },
        { label: 'ADV Created', value: String(t.Adv_Created) },
        { label: 'ADV PTS',     value: String(t.Adv_PTS) },
        { label: 'Paint Touch', value: String(t.PaintTouch) },
        { label: 'Drive/Kick',  value: String(t.DriveKick) },
        { label: 'TOV',         value: String(t.TOV) },
      ]},
      { title: 'Screening', rows: [
        { label: 'Screen AST',   value: String(t.Scr_AST) },
        { label: 'Screen Opp',   value: String(t.Scr_Opp) },
        { label: 'Screen Adv',   value: String(t.Scr_Adv) },
        { label: 'Screen Total', value: String(t.Scr_AST + t.Scr_Opp + t.Scr_Adv) },
        { label: 'Screen PTS',   value: String(t.Scr_PTS) },
      ]},
      { title: 'Rebounding & Defense', rows: [
        { label: 'OREB',        value: String(t.OREB) },
        { label: 'DREB',        value: String(t.DREB) },
        { label: 'REB',         value: String(t.REB) },
        { label: 'STL',         value: String(t.STL) },
        { label: 'BLK',         value: String(t.BLK) },
        { label: 'Deflections', value: String(t.Deflections) },
        { label: 'Charges',     value: String(t.Charges) },
        { label: 'Fouls',       value: String(t.Fouls) },
      ]},
      { title: 'Shot Quality', rows: [
        { label: 'Open Shot%',   value: _pctText(t.Open_rate) },
        { label: 'Light%',       value: _pctText(t.Light_rate) },
        { label: 'Bad Shot%',    value: _pctText(t.Bad_rate) },
        { label: 'Assisted FG%', value: _pctText(t.Assisted_pct) },
      ]},
      ...(data.lineupStints?.length
        ? [{ title: 'Lineup Impact', rows: [
            { label: 'Off Rtg', value: t.Off_Rtg?.toFixed(1) ?? '—' },
            { label: 'Def Rtg', value: t.Def_Rtg?.toFixed(1) ?? '—' },
            { label: 'Net Rtg', value: t.Net_Rtg !== null ? netSign(t.Net_Rtg) : '—' },
          ]}]
        : [{ title: 'Lineup Impact', rows: [{ label: 'Note', value: 'No lineup data recorded.' }] }]
      ),
    ],
  }
}

export function displayTeamSummary(data) {
  const t = _teamStats(data)
  const netSign = v => v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)
  return {
    groups: [
      { title: 'Scoring', rows: [
        { label: 'PTS',  value: String(t.PTS) },
        { label: 'FG',   value: `${t.FGM}/${t.FGA}`,         secondary: _pctText(t.FG_pct) },
        { label: 'FG%',  value: _pctText(t.FG_pct) },
        { label: '2PT',  value: `${t.twoPM}/${t.twoPA}`,     secondary: _pctText(t.twoPT_pct) },
        { label: '3PT',  value: `${t.threePM}/${t.threePA}`, secondary: _pctText(t.threePT_pct) },
        { label: '3PT%', value: _pctText(t.threePT_pct) },
        { label: 'FT',   value: `${t.FTM}/${t.FTA}`,         secondary: _pctText(t.FT_pct) },
        { label: 'eFG%', value: _pctText(t.eFG) },
        { label: 'TS%',  value: _pctText(t.TS_pct) },
      ]},
      { title: 'Playmaking', rows: [
        { label: 'AST',            value: String(t.AST) },
        { label: 'AST PTS',        value: String(t.AST_PTS) },
        { label: 'Pot AST',        value: String(t.Pot_AST) },
        { label: 'ADV Created',    value: String(t.Adv_Created) },
        { label: 'Screen Created', value: String(t.Scr_AST + t.Scr_Opp + t.Scr_Adv) },
        { label: 'Screen PTS',     value: String(t.Scr_PTS) },
        { label: 'TOV',            value: String(t.TOV) },
        { label: 'Est Poss Used',  value: String(Math.round(t.Poss_Used)) },
        { label: 'PTS/Poss',       value: t.PTS_per_Poss?.toFixed(2) ?? '—' },
      ]},
      { title: 'Shot Quality', rows: [
        { label: 'Open Shot Rate', value: _pctText(t.Open_rate) },
        { label: 'Light Contest%', value: _pctText(t.Light_rate) },
        { label: 'Bad Shot Rate',  value: _pctText(t.Bad_rate) },
        { label: 'Transition PTS', value: String(t.TransPTS) },
      ]},
      { title: 'Defense & Reb', rows: [
        { label: 'REB',          value: String(t.REB) },
        { label: 'Def Activity', value: String(t.STL + t.BLK + t.Deflections + t.Charges) },
      ]},
      { title: 'Lineup', rows: [
        { label: 'Off Rtg', value: t.Off_Rtg !== null ? t.Off_Rtg.toFixed(1) : '—' },
        { label: 'Def Rtg', value: t.Def_Rtg !== null ? t.Def_Rtg.toFixed(1) : '—' },
        { label: 'Net',     value: t.Net_Rtg !== null ? netSign(t.Net_Rtg) : '—' },
      ]},
    ],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

export function displayPlayerAdvancedStats(data, playerId) {
  if (!data || !playerId) return null
  const p   = _playerStats(data, playerId)
  const TSA = p.FGA + 0.44 * p.FTA
  const TS_pct = TSA ? p.PTS / (2 * TSA) : null

  const pShots    = data.shots.filter(s => s.player === playerId)
  const openP     = pShots.filter(s => ['wide open','open'].includes(_normalizedContest(s))).length
  const lightP    = pShots.filter(s => _normalizedContest(s) === 'light').length
  const badP      = pShots.filter(s => ['heavy','blocked/smothered'].includes(_normalizedContest(s))).length
  const assistedP = pShots.filter(s => _made(s) && s.assisted_by).length
  const netSign   = v => v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)

  return {
    scoring: [
      { title: 'Points & Efficiency', rows: [
        { label: 'PTS',       value: String(p.PTS) },
        { label: 'FG',        value: `${p.FGM}/${p.FGA}`,         secondary: _pctText(p.FG_pct) },
        { label: '2PT',       value: `${p.twoPM}/${p.twoPA}`,     secondary: _pctText(p.twoPT_pct) },
        { label: '3PT',       value: `${p.threePM}/${p.threePA}`, secondary: _pctText(p.threePT_pct) },
        { label: 'FT',        value: `${p.FTM}/${p.FTA}`,         secondary: _pctText(p.FT_pct) },
        { label: 'eFG%',      value: _pctText(p.eFG) },
        { label: 'TS%',       value: _pctText(TS_pct) },
        { label: 'PTS/Poss',  value: p.PTS_per_Poss?.toFixed(2) ?? '—' },
        { label: 'Trans PTS', value: String(p.TransPTS) },
      ]},
      { title: 'Shot Quality', rows: [
        { label: 'Open Shot%',   value: _pctText(_safe(openP, pShots.length)) },
        { label: 'Light%',       value: _pctText(_safe(lightP, pShots.length)) },
        { label: 'Bad Shot%',    value: _pctText(_safe(badP, pShots.length)) },
        { label: 'Assisted FG%', value: _pctText(_safe(assistedP, p.FGM)) },
      ]},
    ],
    creation: [
      { title: 'Creation & Passing', rows: [
        { label: 'AST',         value: String(p.AST) },
        { label: 'AST PTS',     value: String(p.AST_PTS) },
        { label: 'Pot AST',     value: String(p.Pot_AST) },
        { label: 'Pot AST PTS', value: String(p.Pot_AST_PTS) },
        { label: 'ADV Created', value: String(p.Adv_Created) },
        { label: 'ADV PTS',     value: String(p.Adv_PTS) },
        { label: 'Paint Touch', value: String(p.PaintTouch) },
        { label: 'Drive/Kick',  value: String(p.DriveKick) },
        { label: 'TOV',         value: String(p.TOV) },
        { label: 'AST/TO',      value: p.TOV ? (p.AST / p.TOV).toFixed(1) : '—' },
      ]},
    ],
    screening: [
      { title: 'Screening', rows: [
        { label: 'Screen AST',   value: String(p.Scr_AST) },
        { label: 'Screen Opp',   value: String(p.Scr_Opp) },
        { label: 'Screen Adv',   value: String(p.Scr_Adv) },
        { label: 'Screen Total', value: String(p.Scr_AST + p.Scr_Opp + p.Scr_Adv) },
        { label: 'Screen PTS',   value: String(p.Scr_PTS) },
        { label: 'PTS/Screen',   value: (p.Scr_AST + p.Scr_Opp + p.Scr_Adv)
            ? (p.Scr_PTS / (p.Scr_AST + p.Scr_Opp + p.Scr_Adv)).toFixed(1) : '—' },
      ]},
    ],
    defense: [
      { title: 'Rebounding & Defense', rows: [
        { label: 'OREB',        value: String(p.OREB) },
        { label: 'DREB',        value: String(p.DREB) },
        { label: 'REB',         value: String(p.REB) },
        { label: 'STL',         value: String(p.STL) },
        { label: 'BLK',         value: String(p.BLK) },
        { label: 'Deflections', value: String(p.Deflections) },
        { label: 'Charges',     value: String(p.Charges) },
        { label: 'Fouls',       value: String(p.Fouls) },
      ]},
    ],
    lineup: p.onCourtStints > 0
      ? [{ title: 'Lineup Impact', rows: [
          { label: 'Stints On Court', value: String(p.onCourtStints) },
          { label: 'Off Rtg',         value: p.onOff_Rtg?.toFixed(1) ?? '—' },
          { label: 'Def Rtg',         value: p.onDef_Rtg?.toFixed(1) ?? '—' },
          { label: 'Net Rtg',         value: p.onNet_Rtg !== null ? netSign(p.onNet_Rtg) : '—' },
          { label: 'Poss For',        value: String(p.onPossFor) },
          { label: 'Poss Against',    value: String(p.onPossAgainst) },
        ]}]
      : [{ title: 'Lineup Impact', rows: [{ label: 'Note', value: 'No lineup data recorded.' }] }],
  }
}

export function displayPlayerBoxScore(data, playerId, scopeType, games = []) {
  if (!data) return { metrics: [], gameLog: null }

  if (scopeType === 'game') {
    const pShots = data.shots.filter(s => s.player === playerId)
    const pFTs   = data.freeThrows.filter(ft => ft.player === playerId)
    const made   = pShots.filter(_made)
    const made3  = pShots.filter(s => _num(s.points) === 3 && _made(s))
    const att3   = pShots.filter(s => _num(s.points) === 3)
    const FTM    = pFTs.filter(_made).length
    const FTA    = pFTs.length
    const PTS    = _shotPoints(made) + FTM
    return {
      metrics: [
        { label: 'PTS', main: String(PTS) },
        { label: 'FG',  main: `${made.length}/${pShots.length}`, secondary: _pctText(_safe(made.length, pShots.length)) },
        { label: '3PT', main: `${made3.length}/${att3.length}`,  secondary: _pctText(_safe(made3.length, att3.length)) },
        { label: 'FT',  main: `${FTM}/${FTA}`,                   secondary: _pctText(_safe(FTM, FTA)) },
      ],
      gameLog: null,
    }
  }

  // Build game log and compute averages in a single pass
  const pShots  = data.shots.filter(s => s.player === playerId)
  const pEvents = data.events.filter(e => e.player === playerId)
  const pFTs    = data.freeThrows.filter(ft => ft.player === playerId)
  const allStints = data.lineupStints ?? []

  const gameIds = [...new Set([
    ...pShots.map(s => s.game_id),
    ...pEvents.map(e => e.game_id),
    ...pFTs.map(ft => ft.game_id),
  ].filter(Boolean))].sort()

  if (!gameIds.length) return { metrics: [], gameLog: null }

  const gamesMap = Object.fromEntries(games.map(g => [g.id, g]))
  let totFGM=0, totFGA=0, tot3PM=0, tot3PA=0, totFTM=0, totFTA=0
  let totPTS=0, totREB=0, totAST=0, totSTL=0, totBLK=0, totTO=0

  const gameRows = gameIds.map(gid => {
    const gs  = pShots.filter(s => s.game_id === gid)
    const ge  = pEvents.filter(e => e.game_id === gid)
    const gft = pFTs.filter(ft => ft.game_id === gid)
    const fg  = _fgStats(gs)
    const ft  = _ftStats(gft)
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

    totFGM += fg.FGM; totFGA += fg.FGA
    tot3PM += fg.threePM; tot3PA += fg.threePA
    totFTM += ft.FTM;    totFTA += ft.FTA
    totPTS += PTS; totREB += REB; totAST += AST
    totSTL += STL; totBLK += BLK; totTO  += TO

    const g = gamesMap[gid]
    return {
      game_id:    g ? `${g.opponentName} (${g.result ?? ''})` : gid,
      PTS, REB, AST, STL, BLK, TO,
      FG:         { value: `${fg.FGM}/${fg.FGA}`,         secondary: _pctText(fg.FG_pct) },
      threePoint: { value: `${fg.threePM}/${fg.threePA}`, secondary: _pctText(fg.threePT_pct) },
      FT:         { value: `${ft.FTM}/${ft.FTA}`,         secondary: _pctText(ft.FT_pct) },
      pm: pm > 0 ? `+${pm}` : String(pm),
    }
  })

  const GP  = gameIds.length
  const avg = n => (n / GP).toFixed(1)

  return {
    metrics: [
      { label: 'GP',  main: String(GP) },
      { label: 'PPG', main: avg(totPTS) },
      { label: 'RPG', main: avg(totREB) },
      { label: 'APG', main: avg(totAST) },
      { label: 'SPG', main: avg(totSTL) },
      { label: 'BPG', main: avg(totBLK) },
      { label: 'TO',  main: avg(totTO) },
      { label: 'FG%', main: _pctText(_safe(totFGM, totFGA)) },
      { label: '3P%', main: _pctText(_safe(tot3PM, tot3PA)) },
      { label: 'FT%', main: _pctText(_safe(totFTM, totFTA)) },
    ],
    gameLog: {
      columns: [
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
      ],
      rows: gameRows,
    },
  }
}

export function displayShotChart(data, playerId = null) {
  const shots = playerId
    ? data.shots.filter(s => s.player === playerId)
    : data.shots
  const { zone_breakdown, contest_breakdown } = getShotChartData({ ...data, shots })
  const cols = labelText => [
    { key: 'label',  type: 'name',   label: labelText },
    { key: 'FG',     type: 'ratio',  label: 'FG' },
    { key: 'FG_pct', type: 'pct',    label: 'FG%' },
    { key: 'rate',   type: 'pct',    label: 'RATE' },
    { key: 'PTS',    type: 'number', label: 'PTS' },
    { key: 'PPS',    type: 'number', label: 'PPS' },
  ]
  return {
    shots,
    zoneBreakdown:    { columns: cols('Zone'),    rows: zone_breakdown.filter(z => z.FGA > 0) },
    contestBreakdown: { columns: cols('Contest'), rows: contest_breakdown.filter(z => z.FGA > 0) },
  }
}
