export const SHOTS_COLUMNS = [
  'game_id','half','player','result','points','shot_x','shot_y','shot_zone','approx_distance_m',
  'shot_type','contest','assisted','assisted_by','screen_assist_by','screen_type',
  'transition','paint_touch','drive_kick','notes'
];

export const EVENTS_COLUMNS = [
  'game_id','half','player','event_type','event_subtype','count','points_created','related_player','notes'
];

export const FREE_THROWS_COLUMNS = [
  'game_id','half','player','result','ft_type','notes'
];

export const LINEUP_STINTS_COLUMNS = [
  'game_id','half','lineup_label','player_1','player_2','player_3','player_4','player_5',
  'off_poss','def_poss','points_for','points_against','net_points','off_rating','def_rating','net_rating','time_start','time_end'
];

export function rowsToTSV(rows, columns) {
  return rows.map(row => columns.map(c => cleanCell(row[c])).join('\t')).join('\n');
}

export function rowsToCSV(rows, columns) {
  return rows.map(row => columns.map(c => csvCell(row[c])).join(',')).join('\n');
}

function cleanCell(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\r?\n/g, ' ').trim();
}

function csvCell(value) {
  const text = cleanCell(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
