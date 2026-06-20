import { useState, useRef } from 'react';
import { isFilterActive } from '../../../lib/deriveFilterOptions';

export function useFilterState({ cutSegments, visibleIndices, filterChoice, onFilterOpen, onFilterClose }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);

  const openFilter = () => {
    if (onFilterOpen) onFilterOpen();
    setFilterOpen(true);
  };

  const closeFilter = () => {
    setFilterOpen(false);
    if (onFilterClose) onFilterClose();
  };

  const filterActive = isFilterActive(filterChoice);
  const total = cutSegments.length;
  const visible = visibleIndices ? visibleIndices.length : total;
  const visibleSet = visibleIndices || cutSegments.map((_, i) => i);

  return { filterOpen, filterBtnRef, openFilter, closeFilter, filterActive, total, visible, visibleSet };
}
