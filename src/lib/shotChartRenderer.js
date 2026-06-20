// Spartans Shot Chart Renderer v0.5.2
// Browser-only SVG renderer for Spartans shot charts.
// Use with report.shot_chart from spartans-stats-core.js, or with raw shot rows.

export const COURT_WIDTH = 15;
export const COURT_HEIGHT = 14;
export const COURT_VIEWBOX = '-0.25 -0.25 15.5 14.5';

export const ZONES = [
  'rim', 'paint', 'left midrange', 'middle midrange', 'right midrange',
  'left corner 3', 'right corner 3', 'left wing 3', 'right wing 3', 'top 3', 'other'
];

export const ZONE_LABEL_POS = {
  rim: [7.5, 1.05],
  paint: [7.5, 3.9],
  'left midrange': [3.4, 6.85],
  'middle midrange': [7.5, 6.85],
  'right midrange': [11.6, 6.85],
  'left corner 3': [1.65, 1.15],
  'right corner 3': [13.35, 1.15],
  'left wing 3': [2.45, 5.9],
  'right wing 3': [12.55, 5.9],
  'top 3': [7.5, 10.9],
  other: [7.5, 13.15]
};

const STYLE_ID = 'spartans-shot-chart-renderer-styles';

export function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function made(shot) {
  return String(shot?.result || '').toLowerCase() === 'make';
}

export function pctText(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function shotKey(shot) {
  return shot?.id || shot?.shot_id || `${shot?.game_id || ''}|${shot?.half || ''}|${shot?.player || ''}|${shot?.x ?? shot?.shot_x ?? ''}|${shot?.y ?? shot?.shot_y ?? ''}|${shot?.result || ''}|${shot?.points || ''}`;
}

export function normalizeShotZone(zone, xPct, yPct) {
  const current = String(zone || '').toLowerCase();
  if (current === 'deep top 3') return 'top 3';
  if (['midrange', 'long midrange', 'left midrange', 'middle midrange', 'right midrange', ''].includes(current) && xPct !== undefined && xPct !== null && yPct !== undefined && yPct !== null) {
    return zoneFromXY(xPct, yPct).zone;
  }
  return zone || '';
}

export function normalizeShot(shot) {
  return {
    id: shotKey(shot),
    game_id: shot.game_id || '',
    half: shot.half || '',
    player: shot.player || '',
    result: shot.result || '',
    points: num(shot.points),
    x: num(shot.x ?? shot.shot_x),
    y: num(shot.y ?? shot.shot_y),
    zone: normalizeShotZone(shot.zone || shot.shot_zone || '', shot.x ?? shot.shot_x, shot.y ?? shot.shot_y),
    type: shot.type || shot.shot_type || '',
    contest: shot.contest || '',
    assisted_by: shot.assisted_by || '',
    screen_by: shot.screen_by || shot.screen_assist_by || '',
    screen_type: shot.screen_type || '',
    transition: shot.transition || '',
    paint_touch: shot.paint_touch || '',
    drive_kick: shot.drive_kick || '',
    notes: shot.notes || ''
  };
}

export function normalizeShotChart(input = {}) {
  const rawShots = Array.isArray(input) ? input : (input.shots || []);
  const shots = rawShots.map(normalizeShot).filter(s => Number.isFinite(s.x) && Number.isFinite(s.y));
  const zoneBreakdown = input.zone_breakdown || computeZoneBreakdown(shots);
  const contestBreakdown = input.contest_breakdown || [];
  return {
    ...input,
    shots,
    shot_count: shots.length,
    zone_breakdown: zoneBreakdown,
    contest_breakdown: contestBreakdown
  };
}

export function zoneFromXY(xPct, yPct) {
  const x = num(xPct) / 100 * COURT_WIDTH;
  const y = num(yPct) / 100 * COURT_HEIGHT;
  const dx = x - 7.5;
  const dy = y - 1.575;
  const dist = Math.hypot(dx, dy);
  let zone = 'other';
  if (dist <= 1.35) zone = 'rim';
  else if (x >= 5.05 && x <= 9.95 && y <= 5.8) zone = 'paint';
  else if (dist < 6.75) zone = x < 5.05 ? 'left midrange' : (x > 9.95 ? 'right midrange' : 'middle midrange');
  else {
    if (y < 3.05 && x < 2.2) zone = 'left corner 3';
    else if (y < 3.05 && x > 12.8) zone = 'right corner 3';
    else if (x < 5.2) zone = 'left wing 3';
    else if (x > 9.8) zone = 'right wing 3';
    else zone = 'top 3';
  }
  return { zone, dist: Math.round(dist * 10) / 10 };
}

export function computeZoneBreakdown(shots = []) {
  return ZONES.map(label => {
    const rows = shots.filter(s => String(s.zone || '') === label);
    const FGA = rows.length;
    const FGM = rows.filter(made).length;
    const PTS = rows.reduce((total, shot) => total + (made(shot) ? num(shot.points) : 0), 0);
    return {
      label,
      FGM,
      FGA,
      FG_pct: FGA ? FGM / FGA : null,
      rate: shots.length ? FGA / shots.length : null,
      PTS,
      PPS: FGA ? PTS / FGA : null
    };
  });
}

export function heatColor(fgPct) {
  if (fgPct >= 0.5) return '#2f7d4f';
  if (fgPct >= 0.35) return '#d4a437';
  return '#b8392b';
}

function cssPx(value) {
  if (value === undefined || value === null || value === '') return '';
  return typeof value === 'number' ? `${value}px` : String(value);
}

export function ensureShotChartStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.spartans-shot-chart{width:100%;max-width:760px;font-family:Inter,Arial,sans-serif;color:#16140f;--spartan-green:#2f7d4f;--spartan-red:#b8392b;--spartan-gold:#d4a437;--spartan-blue:#2563eb;--spartan-line:#d9d4c7;}
.spartans-shot-chart *{box-sizing:border-box;}
.spartans-shot-chart__toolbar{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0 0 8px;}
.spartans-shot-chart__meta{font-size:12px;color:#4a463d;font-weight:800;}
.spartans-shot-chart__button{border:1px solid var(--spartan-line);background:#fff;padding:5px 8px;border-radius:8px;font-size:12px;font-weight:900;cursor:pointer;}
.spartans-shot-chart__button.is-active{background:#16140f;color:#fff;border-color:#16140f;}
.spartans-shot-chart__legend{display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-size:12px;color:#4a463d;margin:0 0 8px;}
.spartans-shot-chart__legend-box{display:inline-block;width:12px;height:12px;border:1px solid rgba(0,0,0,.18);border-radius:3px;margin-right:5px;vertical-align:-2px;}
.spartans-shot-chart__legend-box--make{background:var(--spartan-green);}.spartans-shot-chart__legend-box--miss{background:var(--spartan-red);}.spartans-shot-chart__legend-box--avg{background:var(--spartan-gold);}
.spartans-shot-chart__svg{width:100%;height:auto;display:block;background:#fff;border:1px solid var(--spartan-line);}
.spartans-shot-chart__court-line{fill:none;stroke:#111;stroke-width:.08;}.spartans-shot-chart__court-soft{fill:none;stroke:#111;stroke-width:.035;opacity:.25;}.spartans-shot-chart__zone-heat{stroke:none;pointer-events:none;}.spartans-shot-chart__shot{cursor:pointer;}.spartans-shot-chart__shot.is-not-interactive{cursor:default;}.spartans-shot-chart__shot:hover .spartans-shot-chart__hit{stroke:#2563eb;stroke-width:.07;fill-opacity:.18;}
.spartans-shot-chart__selected-halo{fill:#2563eb;fill-opacity:.16;stroke:#fff;stroke-width:.10;vector-effect:non-scaling-stroke;}.spartans-shot-chart__selected-ring{fill:none;stroke:#2563eb;stroke-width:.135;vector-effect:non-scaling-stroke;}.spartans-shot-chart__selected-ring-outer{fill:none;stroke:#111;stroke-width:.035;stroke-opacity:.75;vector-effect:non-scaling-stroke;}
.spartans-shot-chart__popup-bg{fill:#111827;stroke:#fff;stroke-width:.035;opacity:.97;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25));}.spartans-shot-chart__popup-text{font-size:.34px;fill:#fff;font-weight:900;pointer-events:none;}.spartans-shot-chart__popup-sub{font-size:.275px;fill:#e5e7eb;font-weight:800;pointer-events:none;}
.spartans-shot-chart__region-label{pointer-events:none;}.spartans-shot-chart__region-label rect{fill:rgba(255,255,255,.96);stroke:rgba(17,20,15,.86);stroke-width:.042;filter:drop-shadow(0 .035px .035px rgba(0,0,0,.30));}.spartans-shot-chart__region-label .zone-name{font-size:.285px;font-weight:1000;fill:#0f172a;text-anchor:middle;paint-order:stroke;stroke:#fff;stroke-width:.018px;stroke-linejoin:round;}.spartans-shot-chart__region-label .zone-stats{font-size:.235px;font-weight:1000;fill:#1f2937;text-anchor:middle;paint-order:stroke;stroke:#fff;stroke-width:.014px;stroke-linejoin:round;}
.spartans-shot-chart__empty{padding:14px;border:1px solid var(--spartan-line);background:#fff;color:#8a857a;font-size:13px;}
`;
  document.head.appendChild(style);
}

export function courtBaseSvg() {
  return `
    <rect x="0" y="0" width="15" height="14" fill="#fff"></rect>
    <path class="spartans-shot-chart__court-line" d="M0 0H15V14H0Z"></path>
    <path class="spartans-shot-chart__court-line" d="M5.05 0V5.8H9.95V0"></path>
    <path class="spartans-shot-chart__court-soft" d="M0 4.9H15"></path>
    <circle cx="7.5" cy="1.575" r="0.225" fill="none" stroke="#111" stroke-width="0.08"></circle>
    <path d="M6.7 1.2H8.3" stroke="#111" stroke-width="0.08"></path>
    <path d="M0.9 0V2.99M14.1 0V2.99" stroke="#111" stroke-width="0.08"></path>
    <path d="M0.9 2.99A6.75 6.75 0 0 0 14.1 2.99" fill="none" stroke="#111" stroke-width="0.08"></path>`;
}

export function zoneHeatSvg(shotChart, options = {}) {
  const chart = normalizeShotChart(shotChart);
  const byZone = Object.fromEntries((chart.zone_breakdown || []).map(row => [row.label, row]));
  const cellSize = options.cellSize ?? 0.5;
  let out = '';
  for (let y = 0; y < COURT_HEIGHT; y += cellSize) {
    for (let x = 0; x < COURT_WIDTH; x += cellSize) {
      const zone = zoneFromXY((x + cellSize / 2) / COURT_WIDTH * 100, (y + cellSize / 2) / COURT_HEIGHT * 100).zone;
      const row = byZone[zone];
      if (!row || !row.FGA) continue;
      out += `<rect class="spartans-shot-chart__zone-heat" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize}" height="${cellSize}" fill="${heatColor(row.FG_pct)}" opacity="${options.heatOpacity ?? 0.18}"></rect>`;
    }
  }
  return out;
}

export function regionLabelsSvg(shotChart) {
  const chart = normalizeShotChart(shotChart);
  return (chart.zone_breakdown || [])
    .filter(row => row.FGA > 0)
    .map(row => {
      const p = ZONE_LABEL_POS[row.label] || [7.5, 13.15];
      const w = Math.max(2.80, Math.min(4.35, String(row.label).length * 0.22 + 1.45));
      const h = 0.98;
      const x = Math.min(Math.max(p[0] - w / 2, 0.10), COURT_WIDTH - w - 0.10);
      const y = Math.min(Math.max(p[1] - h / 2, 0.10), COURT_HEIGHT - h - 0.10);
      const cx = x + w / 2;
      return `<g class="spartans-shot-chart__region-label"><rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h}" rx="0.16"></rect><text class="zone-name" x="${cx.toFixed(2)}" y="${(y + 0.38).toFixed(2)}">${escapeHtml(row.label)}</text><text class="zone-stats" x="${cx.toFixed(2)}" y="${(y + 0.72).toFixed(2)}">${row.FGM}/${row.FGA} · ${pctText(row.FG_pct)}</text></g>`;
    })
    .join('');
}

function shortText(value, max = 42) {
  value = String(value || '');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function shotPopupSvg(shot, x, y) {
  const w = 6.25;
  const line1 = shortText(`${shot.player || ''} · ${shot.result || ''} · ${shot.points || ''}PT`, 30);
  const line2 = shortText(`${shot.zone || ''} · ${shot.type || ''}`, 34);
  const detail = [shot.contest || '', shot.assisted_by ? `AST ${shot.assisted_by}` : '', shot.screen_by ? `screen ${shot.screen_by}` : ''].filter(Boolean).join(' · ');
  const line3 = shortText(detail, 34);
  const h = line3 ? 1.38 : 1.04;
  let tx = x > 8.8 ? x - w - 0.36 : x + 0.36;
  tx = Math.min(Math.max(tx, 0.10), COURT_WIDTH - w - 0.10);
  let ty = y > 1.45 ? y - 1.26 : y + 0.40;
  ty = Math.min(Math.max(ty, 0.10), COURT_HEIGHT - h - 0.10);
  return `<g class="spartans-shot-chart__popup"><rect class="spartans-shot-chart__popup-bg" x="${tx}" y="${ty}" width="${w}" height="${h}" rx="0.14"></rect><text class="spartans-shot-chart__popup-text" x="${tx + 0.18}" y="${ty + 0.39}">${escapeHtml(line1)}</text><text class="spartans-shot-chart__popup-sub" x="${tx + 0.18}" y="${ty + 0.76}">${escapeHtml(line2)}</text>${line3 ? `<text class="spartans-shot-chart__popup-sub" x="${tx + 0.18}" y="${ty + 1.10}">${escapeHtml(line3)}</text>` : ''}</g>`;
}

export function shotMarkerSvg(shotInput, options = {}) {
  const shot = normalizeShot(shotInput);
  const x = shot.x / 100 * COURT_WIDTH;
  const y = shot.y / 100 * COURT_HEIGHT;
  const selected = options.selectedShotId && options.selectedShotId === shot.id;
  const interactive = options.interactive !== false;
  const ring = selected
    ? `<circle class="spartans-shot-chart__selected-halo" cx="${x}" cy="${y}" r="0.37"></circle><circle class="spartans-shot-chart__selected-ring-outer" cx="${x}" cy="${y}" r="0.38"></circle><circle class="spartans-shot-chart__selected-ring" cx="${x}" cy="${y}" r="0.30"></circle>`
    : '';
  const popup = selected && options.showPopup !== false ? shotPopupSvg(shot, x, y) : '';
  const classes = `spartans-shot-chart__shot${interactive ? '' : ' is-not-interactive'}${selected ? ' is-selected' : ''}`;
  const attrs = `class="${classes}" data-shot-id="${escapeHtml(shot.id)}" tabindex="${interactive ? 0 : -1}" role="${interactive ? 'button' : 'img'}" aria-label="${escapeHtml(`${shot.player} ${shot.result} ${shot.points} point shot from ${shot.zone}`)}"`;
  if (made(shot)) {
    return `<g ${attrs}>${ring}<circle class="spartans-shot-chart__hit" cx="${x}" cy="${y}" r="0.22" fill="#2f7d4f" fill-opacity="0"></circle><circle cx="${x}" cy="${y}" r="0.15" fill="#2f7d4f" stroke="#111" stroke-width="0.035"></circle>${popup}</g>`;
  }
  return `<g ${attrs}>${ring}<circle class="spartans-shot-chart__hit" cx="${x}" cy="${y}" r="0.24" fill="#b8392b" fill-opacity="0"></circle><line x1="${x - 0.15}" y1="${y - 0.15}" x2="${x + 0.15}" y2="${y + 0.15}" stroke="#b8392b" stroke-width="0.055" stroke-linecap="round"></line><line x1="${x + 0.15}" y1="${y - 0.15}" x2="${x - 0.15}" y2="${y + 0.15}" stroke="#b8392b" stroke-width="0.055" stroke-linecap="round"></line>${popup}</g>`;
}

export function shotChartSvg(shotChartInput, options = {}) {
  const chart = normalizeShotChart(shotChartInput);
  const selectedShotId = options.selectedShotId || '';
  const orderedShots = selectedShotId
    ? [...chart.shots.filter(s => s.id !== selectedShotId), ...chart.shots.filter(s => s.id === selectedShotId)]
    : chart.shots;
  const heat = options.showHeatZones === false ? '' : zoneHeatSvg(chart, options);
  const labels = options.showRegionLabels === false ? '' : regionLabelsSvg(chart);
  const markers = orderedShots.map(shot => shotMarkerSvg(shot, { selectedShotId, interactive: options.interactive, showPopup: options.showPopup })).join('');
  return `<svg class="spartans-shot-chart__svg" viewBox="${COURT_VIEWBOX}" aria-label="Spartans shot chart">${courtBaseSvg()}<g class="spartans-shot-chart__heat-layer">${heat}</g><g class="spartans-shot-chart__labels-layer">${labels}</g><g class="spartans-shot-chart__shots-layer">${markers}</g></svg>`;
}

export function renderShotChart(container, shotChartInput, options = {}) {
  if (!container) throw new Error('renderShotChart requires a container element.');
  ensureShotChartStyles();

  let chart = normalizeShotChart(shotChartInput);
  let selectedShotId = options.selectedShotId || '';
  let showHeatZones = options.showHeatZones !== false;
  let showRegionLabels = options.showRegionLabels !== false;
  const interactive = options.interactive !== false;
  const showToolbar = options.showToolbar !== false;
  const showLegend = options.showLegend !== false;
  const height = cssPx(options.height);

  const notifySelection = shot => {
    if (typeof options.onShotSelect === 'function') options.onShotSelect(shot || null);
  };

  function selectedShot() {
    return chart.shots.find(shot => shot.id === selectedShotId) || null;
  }

  function setSelectedShot(id, silent = false) {
    selectedShotId = selectedShotId === id ? '' : (id || '');
    draw();
    if (!silent) notifySelection(selectedShot());
  }

  function clearSelection(silent = false) {
    if (!selectedShotId) return;
    selectedShotId = '';
    draw();
    if (!silent) notifySelection(null);
  }

  function draw() {
    const meta = `${chart.shot_count || chart.shots.length} shot${(chart.shot_count || chart.shots.length) === 1 ? '' : 's'}`;
    container.classList.add('spartans-shot-chart');
    if (height) container.style.maxWidth = options.maxWidth ? cssPx(options.maxWidth) : container.style.maxWidth;
    container.innerHTML = `
      ${showToolbar ? `<div class="spartans-shot-chart__toolbar"><div class="spartans-shot-chart__meta">${escapeHtml(options.title || meta)}</div><div><button type="button" class="spartans-shot-chart__button${showHeatZones ? ' is-active' : ''}" data-action="toggle-heat">Heat zones</button><button type="button" class="spartans-shot-chart__button${showRegionLabels ? ' is-active' : ''}" data-action="toggle-labels">Zone labels</button></div></div>` : ''}
      ${showLegend ? `<div class="spartans-shot-chart__legend"><span><span class="spartans-shot-chart__legend-box spartans-shot-chart__legend-box--make"></span>Make</span><span><span class="spartans-shot-chart__legend-box spartans-shot-chart__legend-box--miss"></span>Miss</span><span><span class="spartans-shot-chart__legend-box spartans-shot-chart__legend-box--avg"></span>Average zone</span></div>` : ''}
      ${chart.shots.length ? shotChartSvg(chart, { selectedShotId, showHeatZones, showRegionLabels, interactive, showPopup: options.showPopup }) : `<div class="spartans-shot-chart__empty">No shots match these filters.</div>`}`;
    const svg = container.querySelector('.spartans-shot-chart__svg');
    if (svg && height) svg.style.height = height;
  }

  function onClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      const action = actionButton.getAttribute('data-action');
      if (action === 'toggle-heat') showHeatZones = !showHeatZones;
      if (action === 'toggle-labels') showRegionLabels = !showRegionLabels;
      draw();
      return;
    }

    if (!interactive) return;
    const shotEl = event.target.closest('[data-shot-id]');
    if (shotEl) {
      setSelectedShot(shotEl.getAttribute('data-shot-id'));
      return;
    }
    if (event.target.closest('.spartans-shot-chart__svg')) clearSelection();
  }

  function onKeydown(event) {
    if (!interactive) return;
    const shotEl = event.target.closest('[data-shot-id]');
    if (!shotEl) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedShot(shotEl.getAttribute('data-shot-id'));
    }
    if (event.key === 'Escape') clearSelection();
  }

  container.addEventListener('click', onClick);
  container.addEventListener('keydown', onKeydown);
  draw();

  return {
    setData(nextShotChart, nextOptions = {}) {
      chart = normalizeShotChart(nextShotChart);
      if (Object.prototype.hasOwnProperty.call(nextOptions, 'showHeatZones')) showHeatZones = nextOptions.showHeatZones !== false;
      if (Object.prototype.hasOwnProperty.call(nextOptions, 'showRegionLabels')) showRegionLabels = nextOptions.showRegionLabels !== false;
      if (!chart.shots.some(shot => shot.id === selectedShotId)) selectedShotId = '';
      draw();
    },
    setSelectedShot(id) { setSelectedShot(id, true); },
    clearSelection() { clearSelection(true); },
    getSelectedShot() { return selectedShot(); },
    destroy() {
      container.removeEventListener('click', onClick);
      container.removeEventListener('keydown', onKeydown);
      container.innerHTML = '';
      container.classList.remove('spartans-shot-chart');
    }
  };
}

export default {
  renderShotChart,
  shotChartSvg,
  shotMarkerSvg,
  zoneHeatSvg,
  regionLabelsSvg,
  courtBaseSvg,
  normalizeShotChart,
  normalizeShot,
  computeZoneBreakdown,
  zoneFromXY,
  shotKey
};
