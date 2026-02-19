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
