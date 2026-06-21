// TODO (Supabase): implement supabase_* versions of all functions and swap
//   const impl = BACKEND === 'supabase' ? supabase_impl : local_impl
// TODO (Supabase): migrate clips from LLC files to a clips table with game_id FK
// TODO (Supabase): migrate stats.json to shots/events/free_throws/lineup_stints tables
// TODO (Editor): implement write functions — addShot, addEvent, addFt, addLineupStint,
//   addGame, updateGame, addTakeaway, updateTakeaway — using the same local/supabase
//   dispatch pattern. Read functions are complete; write functions slot in below them.
import JSON5 from 'json5'
import { getYouTubeId } from './youtube.js'
import {
  fgStats, ftStats, countEvents, made, num, safe, round,
  zoneFromXY, pctText,
} from './statsCore.js'

// ── Cache ─────────────────────────────────────────────────────────────────────

const _cache = new Map()

async function fetchJson(url) {
  if (_cache.has(url)) return _cache.get(url)
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`)
  const data = await r.json()
  _cache.set(url, data)
  return data
}

async function fetchLlc(url) {
  if (_cache.has(url)) return _cache.get(url)
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`)
  const text = await r.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = JSON5.parse(text)
  }
  _cache.set(url, data)
  return data
}

export function clearCache() { _cache.clear() }

// ── Internal filter helpers ───────────────────────────────────────────────────

function applyStatsFilters(rows, filters = {}) {
  return rows.filter(row => {
    if (filters.gameId != null && filters.gameId !== 'ALL') {
      if (row.game_id !== filters.gameId) return false
    }
    if (filters.season != null && filters.season !== 'ALL') {
      if (!row.game_id.startsWith(filters.season)) return false
    }
    if (filters.half != null && filters.half !== 'ALL') {
      if (row.half !== filters.half) return false
    }
    if (filters.player != null && filters.player !== 'ALL') {
      if (row.player !== filters.player) return false
    }
    return true
  })
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function deriveResult(teamScore, opponentScore) {
  if (teamScore > opponentScore) return 'W'
  if (teamScore < opponentScore) return 'L'
  return 'T'
}

// ── Public utilities ──────────────────────────────────────────────────────────

export { getYouTubeId }

export function gameLabel(game) {
  const m = game.game.match(/^G(\d+)$/)
  return m ? `Game ${m[1]}` : game.game
}

// ── Seasons ───────────────────────────────────────────────────────────────────

async function _getSeasons() {
  const games = await fetchJson('./data/games.json')
  const seen = new Set()
  for (const g of games) seen.add(g.season)
  return [...seen].sort((a, b) => b.localeCompare(a))
}

// ── Games ─────────────────────────────────────────────────────────────────────

function enrichGame(g, opponents) {
  const opp = opponents.find(o => o.id === g.opponentId)
  return {
    ...g,
    result: deriveResult(g.teamScore, g.opponentScore),
    videoId: getYouTubeId(g.youtubeUrl),
    opponentName: opp ? opp.name : g.opponentId,
  }
}

async function _getGames(filters = {}) {
  const [games, opponentsData] = await Promise.all([
    fetchJson('./data/games.json'),
    fetchJson('./data/opponents.json'),
  ])
  const opponents = Array.isArray(opponentsData) ? opponentsData : opponentsData.teams ?? []
  let result = games.map(g => enrichGame(g, opponents))

  if (filters.season && filters.season !== 'ALL') {
    result = result.filter(g => g.season === filters.season)
  }
  if (filters.opponentId && filters.opponentId !== 'ALL') {
    result = result.filter(g => g.opponentId === filters.opponentId)
  }
  if (filters.result && filters.result !== 'ALL') {
    result = result.filter(g => g.result === filters.result)
  }

  return result.sort((a, b) => b.date.localeCompare(a.date))
}

async function _getGame(id) {
  const games = await _getGames()
  const game = games.find(g => g.id === id)
  if (!game) throw new Error('Unknown game id: ' + id)
  return game
}

// ── Clips ─────────────────────────────────────────────────────────────────────

async function _getGameClips(gameId, filters = {}) {
  const game = await _getGame(gameId)
  const llcData = await fetchLlc('./data/' + game.clipsFile)

  let clips = (llcData.cutSegments ?? [])
    .filter(s => typeof s.start === 'number' && typeof s.end === 'number')
    .map(s => ({
      start: Math.floor(s.start),
      end: Math.ceil(s.end),
      name: s.name ?? '',
    }))
    .sort((a, b) => a.start - b.start)

  if (filters.quality || filters.type || filters.player) {
    clips = clips.filter(c => {
      const name = c.name
      if (filters.quality && !name.includes(filters.quality)) return false
      if (filters.type && !name.includes(filters.type)) return false
      if (filters.player && !name.toLowerCase().includes(filters.player.toLowerCase())) return false
      return true
    })
  }

  return {
    youtubeUrl: game.youtubeUrl,
    videoId: game.videoId,
    clips,
  }
}

// ── Players ───────────────────────────────────────────────────────────────────

async function _getPlayers(filters = { active: true }) {
  const players = await fetchJson('./data/players.json')
  if (filters.active === true) return players.filter(p => p.active)
  return players
}

async function _getPlayer(id) {
  const players = await fetchJson('./data/players.json')
  const player = players.find(p => p.id === id)
  if (!player) throw new Error('Unknown player id: ' + id)
  return player
}

// ── Opponents ─────────────────────────────────────────────────────────────────

async function _getOpponents() {
  const data = await fetchJson('./data/opponents.json')
  return Array.isArray(data) ? data : data.teams ?? []
}

async function _getOpponent(id) {
  const opponents = await _getOpponents()
  const opp = opponents.find(o => o.id === id)
  if (!opp) throw new Error('Unknown opponent id: ' + id)
  return opp
}

// ── Strategies ────────────────────────────────────────────────────────────────

async function _getStrategies(filters = {}) {
  const data = await fetchJson('./data/strategies.json')
  let strategies = Array.isArray(data) ? data : data.strategies ?? []

  if (filters.defenseType && filters.defenseType !== 'ALL') {
    strategies = strategies.filter(s => s.defenseType === filters.defenseType)
  }

  return [...strategies].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

// ── Takeaways ─────────────────────────────────────────────────────────────────

// Unified takeaways function. Replaces getGameTakeaways + getPlayerTakeaways.
// filters: { gameId?, season?, playerId? }
// Returns TakeawayEntry[] sorted newest first:
// { gameId, game, team: string[], players: [{ playerId, name, strengths, improvements }] }
async function _getTakeaways(filters = {}) {
  const [takeawaysData, players, games] = await Promise.all([
    fetchJson('./data/takeaways.json'),
    _getPlayers({ active: false }),
    _getGames(),
  ])

  let entries = [...takeawaysData]

  if (filters.gameId) {
    entries = entries.filter(t => t.gameId === filters.gameId)
  }
  if (filters.season) {
    const seasonGameIds = new Set(games.filter(g => g.season === filters.season).map(g => g.id))
    entries = entries.filter(t => seasonGameIds.has(t.gameId))
  }
  if (filters.playerId) {
    entries = entries.filter(t => (t.players ?? []).some(p => p.playerId === filters.playerId))
  }

  return entries
    .map(entry => {
      const game = games.find(g => g.id === entry.gameId) ?? null
      let entryPlayers = (entry.players ?? []).map(p => {
        const player = players.find(pl => pl.id === p.playerId)
        return { ...p, name: player ? player.name : p.playerId }
      })
      if (filters.playerId) {
        entryPlayers = entryPlayers.filter(p => p.playerId === filters.playerId)
      }
      return {
        gameId: entry.gameId,
        game,
        team: entry.team ?? [],
        players: entryPlayers,
      }
    })
    .sort((a, b) => {
      if (!a.game || !b.game) return 0
      return b.game.date.localeCompare(a.game.date)
    })
}

// Returns [{ playerId, name }] for the scope picker in a game detail page.
// Players who appear in takeaways for this game.
async function _getGameScopes(gameId) {
  const [takeawaysData, players] = await Promise.all([
    fetchJson('./data/takeaways.json'),
    _getPlayers({ active: false }),
  ])

  const entry = takeawaysData.find(t => t.gameId === gameId)
  if (!entry) return []

  return (entry.players ?? []).map(p => {
    const player = players.find(pl => pl.id === p.playerId)
    return { playerId: p.playerId, name: player ? player.name : p.playerId }
  })
}

// Returns hierarchical scope data for the player detail page scope picker.
async function _getPlayerScopes(playerId) {
  const [takeawaysData, statsData, games] = await Promise.all([
    fetchJson('./data/takeaways.json'),
    fetchJson('./data/stats.json'),
    _getGames(),
  ])

  const gameIds = new Set()

  for (const t of takeawaysData) {
    if ((t.players ?? []).some(p => p.playerId === playerId)) {
      gameIds.add(t.gameId)
    }
  }

  const allRows = [
    ...(statsData.shots ?? []),
    ...(statsData.events ?? []),
    ...(statsData.freeThrows ?? []),
  ]
  for (const row of allRows) {
    if (row.player === playerId) gameIds.add(row.game_id)
  }

  const playerGames = games.filter(g => gameIds.has(g.id))

  const seasonMap = new Map()
  for (const g of playerGames) {
    if (!seasonMap.has(g.season)) seasonMap.set(g.season, [])
    seasonMap.get(g.season).push(g)
  }

  const seasons = [...seasonMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([season, sGames]) => {
      const sorted = [...sGames].sort((a, b) => b.date.localeCompare(a.date))
      return {
        season,
        gameCount: sorted.length,
        wins: sorted.filter(g => g.result === 'W').length,
        losses: sorted.filter(g => g.result === 'L').length,
        games: sorted.map(g => ({
          id: g.id,
          gameLabel: gameLabel(g),
          date: g.date,
          result: g.result,
          score: `${g.teamScore}–${g.opponentScore}`,
          opponentName: g.opponentName,
        })),
      }
    })

  const career = {
    gameCount: playerGames.length,
    wins: playerGames.filter(g => g.result === 'W').length,
    losses: playerGames.filter(g => g.result === 'L').length,
  }

  return { career, seasons }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

async function _getStats(filters = {}) {
  const data = await fetchJson('./data/stats.json')
  return {
    shots: applyStatsFilters(data.shots ?? [], filters),
    events: applyStatsFilters(data.events ?? [], filters),
    freeThrows: applyStatsFilters(data.freeThrows ?? [], filters),
    lineupStints: applyStatsFilters(data.lineupStints ?? [], filters),
  }
}

// Per-game box score rows for a player in a season, enriched with game metadata.
async function _getPlayerGameLog(playerId, season) {
  const [statsData, games] = await Promise.all([
    _getStats({ season }),
    _getGames(),
  ])

  const gameIds = [...new Set([
    ...statsData.shots.map(s => s.game_id),
    ...statsData.events.map(e => e.game_id),
    ...statsData.freeThrows.map(ft => ft.game_id),
  ])]

  return gameIds
    .map(gameId => {
      const gameData = {
        shots: statsData.shots.filter(s => s.game_id === gameId),
        events: statsData.events.filter(e => e.game_id === gameId),
        freeThrows: statsData.freeThrows.filter(ft => ft.game_id === gameId),
        lineupStints: statsData.lineupStints.filter(st => st.game_id === gameId),
      }

      const pShots = gameData.shots.filter(s => s.player === playerId)
      const pEvents = gameData.events.filter(e => e.player === playerId)
      const pFt = gameData.freeThrows.filter(ft => ft.player === playerId)

      if (!pShots.length && !pEvents.length && !pFt.length) return null

      const fg = fgStats(pShots)
      const ft = ftStats(pFt)
      const AST = gameData.shots.filter(s => made(s) && s.assisted_by === playerId).length
      const REB = countEvents(pEvents, 'rebound')
      const STL = countEvents(pEvents, 'steal')
      const BLK = countEvents(pEvents, 'block')
      const TO = countEvents(pEvents, 'turnover')

      const game = games.find(g => g.id === gameId)
      return {
        gameId,
        gameLabel: game ? gameLabel(game) : gameId,
        date: game?.date ?? '',
        result: game?.result ?? '',
        opponentName: game?.opponentName ?? '',
        PTS: fg.shot_points + ft.ft_points,
        REB,
        AST,
        STL,
        BLK,
        TO,
        FGM: fg.FGM,
        FGA: fg.FGA,
        FG_pct: fg.FG_pct,
        threePM: fg.threePM,
        threePA: fg.threePA,
        threeP_pct: fg.threeP_pct,
        FTM: ft.FTM,
        FTA: ft.FTA,
        FT_pct: ft.FT_pct,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date))
}

// Per-season averages for a player, for the career view table.
async function _getPlayerSeasonSummary(playerId) {
  const [statsData, games] = await Promise.all([
    _getStats({}),
    _getGames(),
  ])

  const seasonMap = new Map()
  for (const game of games) {
    if (!seasonMap.has(game.season)) seasonMap.set(game.season, [])
    seasonMap.get(game.season).push(game)
  }

  return [...seasonMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([season, sGames]) => {
      const sGameIds = new Set(sGames.map(g => g.id))

      const seasonShots = statsData.shots.filter(s => sGameIds.has(s.game_id))
      const seasonEvents = statsData.events.filter(e => sGameIds.has(e.game_id))
      const seasonFt = statsData.freeThrows.filter(ft => sGameIds.has(ft.game_id))

      const pShots = seasonShots.filter(s => s.player === playerId)
      const pEvents = seasonEvents.filter(e => e.player === playerId)
      const pFt = seasonFt.filter(ft => ft.player === playerId)

      const playerGameIds = new Set([
        ...pShots.map(s => s.game_id),
        ...pEvents.map(e => e.game_id),
        ...pFt.map(ft => ft.game_id),
      ])
      const gameCount = playerGameIds.size
      if (!gameCount) return null

      const fg = fgStats(pShots)
      const ft = ftStats(pFt)
      const AST = seasonShots.filter(s => made(s) && s.assisted_by === playerId).length
      const REB = countEvents(pEvents, 'rebound')
      const STL = countEvents(pEvents, 'steal')
      const BLK = countEvents(pEvents, 'block')
      const TO = countEvents(pEvents, 'turnover')
      const PTS = fg.shot_points + ft.ft_points

      const wins = sGames.filter(g => playerGameIds.has(g.id) && g.result === 'W').length
      const losses = sGames.filter(g => playerGameIds.has(g.id) && g.result === 'L').length

      return {
        season,
        gameCount,
        wins,
        losses,
        PTS_avg: round(PTS / gameCount, 1),
        REB_avg: round(REB / gameCount, 1),
        AST_avg: round(AST / gameCount, 1),
        STL_avg: round(STL / gameCount, 1),
        BLK_avg: round(BLK / gameCount, 1),
        TO_avg: round(TO / gameCount, 1),
        FG_pct: fg.FG_pct,
        threeP_pct: fg.threeP_pct,
        FT_pct: ft.FT_pct,
      }
    })
    .filter(Boolean)
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

const local = {
  getSeasons: _getSeasons,
  getGames: _getGames,
  getGame: _getGame,
  getGameClips: _getGameClips,
  getPlayers: _getPlayers,
  getPlayer: _getPlayer,
  getOpponents: _getOpponents,
  getOpponent: _getOpponent,
  getStrategies: _getStrategies,
  getTakeaways: _getTakeaways,
  getGameScopes: _getGameScopes,
  getPlayerScopes: _getPlayerScopes,
  getStats: _getStats,
  getPlayerGameLog: _getPlayerGameLog,
  getPlayerSeasonSummary: _getPlayerSeasonSummary,
}

const impl = local

export const {
  getSeasons,
  getGames,
  getGame,
  getGameClips,
  getPlayers,
  getPlayer,
  getOpponents,
  getOpponent,
  getStrategies,
  getTakeaways,
  getGameScopes,
  getPlayerScopes,
  getStats,
  getPlayerGameLog,
  getPlayerSeasonSummary,
} = impl
