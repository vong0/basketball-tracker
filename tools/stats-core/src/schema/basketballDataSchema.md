# Basketball data schema v0.1

Keep the data close to the Excel workbook first, then improve from there. The tracker should save this structure as JSON.

```js
{
  version: 1,
  team: { name: 'Spartans' },
  players: [],
  games: [],
  shots: [],
  events: [],
  freeThrows: [],
  lineupStints: [],
  opponents: [],
  strategies: [],
  clips: []
}
```

## players

```js
{
  player_id: 'Emanuel',
  name: 'Emanuel',
  jersey: '',
  position: 'Guard',
  photo_url: '',
  active: true,
  notes: ''
}
```

## games

```js
{
  game_id: 'G1',
  season: '2026',
  date: '2026-06-12',
  opponent_id: 'wallagah-lakers',
  opponent: 'Wallagah Lakers',
  home_away: 'home',
  team_score: 52,
  opponent_score: 50,
  result: 'W',
  youtube_url: '',
  notes: ''
}
```

## shots

Matches the Excel `Shots` tab columns.

```js
{
  shot_id: 'shot_001',
  game_id: 'G1',
  half: '1H',
  player: 'Adam',
  result: 'make',
  points: 3,
  shot_x: 94,
  shot_y: 29,
  shot_zone: 'right wing 3',
  approx_distance_m: 7.0,
  shot_type: 'pull-up',
  contest: 'light',
  assisted: 'no',
  assisted_by: '',
  screen_assist_by: 'Vong',
  screen_type: 'slip',
  transition: 'no',
  paint_touch: 'no',
  drive_kick: 'no',
  clip_id: '',
  video_time: null,
  notes: ''
}
```

## events

Matches the Excel `Events` tab columns.

```js
{
  event_id: 'evt_001',
  game_id: 'G1',
  half: '1H',
  player: 'Vong',
  event_type: 'screen',
  event_subtype: 'screen_assist',
  count: 1,
  points_created: 3,
  related_player: 'Adam',
  clip_id: '',
  video_time: null,
  notes: 'Wing screen, made 3'
}
```

## freeThrows

Matches the Excel `Free_Throws` tab columns.

```js
{
  ft_id: 'ft_001',
  game_id: 'G1',
  half: '1H',
  player: 'Adam',
  result: 'make',
  ft_type: 'and1',
  clip_id: '',
  video_time: null,
  notes: ''
}
```

## lineupStints

Matches the Excel `Lineup_Stints` tab columns.

```js
{
  stint_id: 'stint_001',
  game_id: 'G1',
  half: '1H',
  lineup_label: 'Emanuel / Matt / Adam / Alex / Vong',
  player_1: 'Emanuel',
  player_2: 'Matt',
  player_3: 'Adam',
  player_4: 'Alex',
  player_5: 'Vong',
  off_poss: 8,
  def_poss: 9,
  points_for: 3,
  points_against: 12,
  time_start: '5:23',
  time_end: '',
  notes: ''
}
```

## opponents and strategies

These are for the future Opponents / Strategies tabs.

```js
{
  opponent_id: 'wallagah-lakers',
  name: 'Wallagah Lakers',
  notes: '',
  tendencies: []
}
```

```js
{
  strategy_id: 'wallagah-zone-press',
  opponent_id: 'wallagah-lakers',
  category: 'offense',
  title: 'Attack their 2-3 zone gaps',
  notes: '',
  linked_clip_ids: []
}
```
