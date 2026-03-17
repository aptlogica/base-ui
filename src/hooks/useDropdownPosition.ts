// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useCallback, useEffect, useState } from 'react';
import { calculateDropdownPosition } from '../utils/dropdownPosition';

interface DropdownPositionConfig {
  dropdownMinHeight?: number;
  dropdownWidthMax?: number;
  offset?: number;
  sideMargin?: number;
}

export const useDropdownPosition = (
  triggerRef: React.RefObject<HTMLElement>,
  isOpen: boolean,
  {
    dropdownMinHeight = 200,
    dropdownWidthMax = 384,
    offset = 6,
    sideMargin = 10,
  }: DropdownPositionConfig = {}
) => {
  const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return null;

    const rect = trigger.getBoundingClientRect();
    const dropdownWidth = Math.min(dropdownWidthMax, rect.width);

    return calculateDropdownPosition({
      rect,
      dropdownMinHeight,
      dropdownWidth,
      offset,
      sideMargin,
    });
  }, [triggerRef, dropdownMinHeight, dropdownWidthMax, offset, sideMargin]);

  useEffect(() => {
    if (isOpen) {
      setPosition(computePosition());
    } else {
      setPosition(null);
    }
  }, [isOpen, computePosition]);

  return position;
};
