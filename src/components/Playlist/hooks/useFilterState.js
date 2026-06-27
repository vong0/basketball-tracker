import { useState, useRef, useMemo } from 'react';

function deriveFilterOptions(parsedSegments) {
  const players = new Set();
  let hasOpp = false;

  for (const parsed of (parsedSegments ?? [])) {
    if (!parsed?.actions) continue;
    for (const a of parsed.actions) {
      if (a.team === 'O') hasOpp = true;
      else if (a.team === 'U') {
        for (const p of a.players) {
          if (p && p !== 'all') players.add(p);
        }
      }
    }
  }

  return {
    players:      [...players].sort((a, b) => a.localeCompare(b)),
    hasOpponents: hasOpp,
  };
}

export function useFilterState({
  cutSegments, parsedSegments, visibleIndices, filterChoice, onFilterOpen, onFilterClose,
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);

  const filterOptions = useMemo(
    () => deriveFilterOptions(parsedSegments),
    [parsedSegments]
  );

  const openFilter = () => {
    if (onFilterOpen) onFilterOpen();
    setFilterOpen(true);
  };

  const closeFilter = () => {
    setFilterOpen(false);
    if (onFilterClose) onFilterClose();
  };

  const filterActive = !!(filterChoice && (filterChoice.player || filterChoice.rating || filterChoice.possession));
  const total = cutSegments.length;
  const visible = visibleIndices ? visibleIndices.length : total;
  const visibleSet = visibleIndices || cutSegments.map((_, i) => i);

  return { filterOpen, filterBtnRef, openFilter, closeFilter, filterActive, filterOptions, total, visible, visibleSet };
}
