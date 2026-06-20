// TODO (Supabase): implement supabase_* versions of all functions and swap
//   const impl = BACKEND === 'supabase' ? supabase_impl : local_impl
// TODO (Supabase): migrate clips from LLC files to a clips table with game_id FK
// TODO (Supabase): migrate stats.json to shots/events/free_throws/lineup_stints tables
// TODO (Editor): implement write functions — addShot, addEvent, addFt, addLineupStint,
//   addGame, updateGame, addTakeaway, updateTakeaway — using the same local/supabase
//   dispatch pattern. Read functions are complete; write functions slot in below them.

import JSON5 from 'json5'
import { getYouTubeId } from './youtube.js'

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

// Generic key=value match. Skips keys where filter value is undefined, null, or 'ALL'
function applyFilters(rows, filters = {}) {
  return rows.filter(row => {
    for (const [key, val] of Object.entries(filters)) {
      if (val == null || val === 'ALL') continue
      if (row[key] !== val) return false
    }
    return true
  })
}

// Stats rows use game_id (snake_case). Handles: gameId, season (prefix match), half, player
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

// Derive W/L/T from scores — never stored, always computed
function deriveResult(teamScore, opponentScore) {
  if (teamScore > opponentScore) return 'W'
  if (teamScore < opponentScore) return 'L'
  return 'T'
}

// ── Public utilities ──────────────────────────────────────────────────────────

// Convenience — saves callers importing youtube.js separately
export { getYouTubeId }

// "G1" → "Game 1", "Finals" → "Finals"
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

async function _getGameTakeaways(gameId) {
  const [takeawaysData, players] = await Promise.all([
    fetchJson('./data/takeaways.json'),
    _getPlayers({ active: false }),
  ])

  const entry = takeawaysData.find(t => t.gameId === gameId)
  if (!entry) return null

  return {
    gameId: entry.gameId,
    team: entry.team ?? [],
    players: (entry.players ?? []).map(p => {
      const player = players.find(pl => pl.id === p.playerId)
      return {
        ...p,
        name: player ? player.name : p.playerId,
      }
    }),
  }
}

async function _getPlayerTakeaways(playerId) {
  const [takeawaysData, games] = await Promise.all([
    fetchJson('./data/takeaways.json'),
    _getGames(),
  ])

  const result = []
  for (const entry of takeawaysData) {
    const playerEntry = (entry.players ?? []).find(p => p.playerId === playerId)
    if (!playerEntry) continue
    const game = games.find(g => g.id === entry.gameId)
    result.push({
      gameId: entry.gameId,
      game,
      teamNotes: entry.team ?? [],
      player: playerEntry,
    })
  }

  return result.sort((a, b) => {
    if (!a.game || !b.game) return 0
    return b.game.date.localeCompare(a.game.date)
  })
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
  getGameTakeaways: _getGameTakeaways,
  getPlayerTakeaways: _getPlayerTakeaways,
  getStats: _getStats,
}

// TODO (Supabase): implement supabase_* versions and swap in here
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
  getGameTakeaways,
  getPlayerTakeaways,
  getStats,
} = impl
