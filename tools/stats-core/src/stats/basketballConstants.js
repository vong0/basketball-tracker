export const SHOT_ZONES = [
  'rim', 'paint', 'midrange', 'long midrange',
  'left corner 3', 'right corner 3', 'left wing 3', 'right wing 3',
  'top 3', 'other'
];

export const CONTEST_LEVELS = [
  'wide open', 'open', 'light', 'heavy', 'blocked/smothered'
];

export const SHOT_TYPES = [
  'layup', 'drive', 'cut', 'putback', 'floater', 'post', 'midrange',
  'catch-and-shoot', 'pull-up', 'stepback', 'other'
];

export const SCREEN_TYPES = [
  'on-ball', 'off-ball', 'pin-down', 'flare', 'back screen', 'handoff/DHO', 'slip', 'other'
];

export const EVENT_TYPES = [
  'rebound', 'turnover', 'steal', 'block', 'deflection', 'foul',
  'creation', 'screen', 'charge_drawn', 'other'
];

export const EVENT_SUBTYPES = [
  'offensive', 'defensive', 'bad_pass', 'lost_ball', 'travel',
  'offensive_foul', 'three_seconds', 'double_dribble', 'shooting', 'common',
  'loose_ball', 'technical', 'potential_assist', 'advantage_created',
  'paint_touch_created', 'drive_kick_created', 'screen_assist', 'screen_opportunity',
  'live_ball', 'dead_ball', 'rim_protection', 'perimeter', 'other'
];

export const OPEN_CONTESTS = new Set(['wide open', 'open']);
export const LIGHT_CONTESTS = new Set(['light']);
export const BAD_CONTESTS = new Set(['heavy', 'blocked/smothered']);
