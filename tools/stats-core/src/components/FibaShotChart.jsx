import React from 'react';
import { SHOT_ZONES } from '../stats/basketballConstants.js';

function pctToCourt(x, y) {
  return {
    cx: (Number(x) / 100) * 15,
    cy: (Number(y) / 100) * 14
  };
}

export default function FibaShotChart({ shots = [], onCourtClick, onShotClick, width = '100%' }) {
  const handleClick = (event) => {
    if (!onCourtClick) return;
    const svg = event.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const shot_x = Math.round((p.x / 15) * 100);
    const shot_y = Math.round((p.y / 14) * 100);
    onCourtClick({ shot_x: clamp(shot_x, 0, 100), shot_y: clamp(shot_y, 0, 100) });
  };

  return (
    <svg viewBox="-0.25 -0.25 15.5 14.5" width={width} onClick={handleClick} style={{ background: '#fff', border: '1px solid #d9d4c7' }}>
      <rect x="0" y="0" width="15" height="14" fill="#fff" />
      <path d="M0 0H15V14H0Z" fill="none" stroke="#111" strokeWidth="0.08" />
      <path d="M5.05 0V5.8H9.95V0" fill="none" stroke="#111" strokeWidth="0.08" />
      <circle cx="7.5" cy="1.575" r="0.225" fill="none" stroke="#111" strokeWidth="0.08" />
      <path d="M6.7 1.2H8.3" stroke="#111" strokeWidth="0.08" />
      <path d="M0.9 0V2.99M14.1 0V2.99" stroke="#111" strokeWidth="0.08" />
      <path d="M0.9 2.99A6.75 6.75 0 0 0 14.1 2.99" fill="none" stroke="#111" strokeWidth="0.08" />
      <text x="7.5" y="13.5" fontSize="0.35" textAnchor="middle" fill="#777">FIBA half court</text>
      {shots.map((s, i) => {
        const { cx, cy } = pctToCourt(s.shot_x, s.shot_y);
        const isMake = String(s.result).toLowerCase() === 'make';
        return isMake ? (
          <circle key={s.shot_id || i} cx={cx} cy={cy} r="0.15" fill="#2f7d4f" stroke="#111" strokeWidth="0.035" onClick={(e) => { e.stopPropagation(); onShotClick?.(s); }} />
        ) : (
          <g key={s.shot_id || i} onClick={(e) => { e.stopPropagation(); onShotClick?.(s); }}>
            <line x1={cx-0.16} y1={cy-0.16} x2={cx+0.16} y2={cy+0.16} stroke="#b8392b" strokeWidth="0.07" strokeLinecap="round" />
            <line x1={cx+0.16} y1={cy-0.16} x2={cx-0.16} y2={cy+0.16} stroke="#b8392b" strokeWidth="0.07" strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
