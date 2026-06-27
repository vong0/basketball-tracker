import { parseLabel, segmentMatchesFilter } from './parseLabel.js'

// Preset definitions — key is used in URLs (?preset=goodOffense)
export const PLAYLISTS = [
  { key: 'all',         label: 'All Clips',    filter: null },
  { key: 'goodOffense', label: 'Good Offense', filter: { quality: 'G', type: 'O' } },
  { key: 'badOffense',  label: 'Bad Offense',  filter: { quality: 'B', type: 'O' } },
  { key: 'goodDefense', label: 'Good Defense', filter: { quality: 'G', type: 'D' } },
  { key: 'badDefense',  label: 'Bad Defense',  filter: { quality: 'B', type: 'D' } },
]

// Builds a filter for a preset + player combination.
// Uses 'players' (array) directly so team-wide clips tagged 'all' are included alongside
// the named player. This is intentional at the preset level — the Playlist's own user-
// selected player filter should NOT include 'all' (that's why _resolve doesn't add it).
export function presetFilter(preset, clipName) {
  const f = preset?.filter ? { ...preset.filter } : {}
  if (clipName) f.players = [clipName, 'all']
  return Object.keys(f).length ? f : null
}

// Extended filter shape (superset of segmentMatchesFilter):
//   player?:   string        — clips where that player appears (use 'players' to also include 'all')
//   players?:  string[]      — explicit array (used internally or for opponents)
//   quality?:  'G' | 'B'
//   type?:     'O' | 'D'
//   team?:     'U' | 'O'
//   text?:     string

// 'player' shorthand → 'players' array. Does NOT add 'all' — that is the caller's
// responsibility if team-wide clips should be included (e.g. preset-level fetch).
function _resolve(filter) {
  if (!filter || !filter.player) return filter
  const { player, ...rest } = filter
  return { ...rest, players: [player] }
}

export function filterClips(clips, filter) {
  const f = _resolve(filter)
  if (!f || !Object.keys(f).length) return clips
  return clips.filter(c => segmentMatchesFilter(parseLabel(c.name), f))
}

export function countClips(clips, filter) {
  return filterClips(clips, filter).length
}

// Translates FilterPopover UI choice to clip filter shape.
// choice: { player: string|null, rating: 'G'|'B'|null, possession: 'offense'|'defense'|null }
export function buildFilter(choice) {
  if (!choice) return null
  const f = {}
  if (choice.player === 'opponents') f.team = 'O'
  else if (choice.player)            f.players = [choice.player, 'all']
  if (choice.rating)                 f.quality = choice.rating
  if (choice.possession === 'offense') f.type = 'O'
  else if (choice.possession === 'defense') f.type = 'D'
  return Object.keys(f).length ? f : null
}
