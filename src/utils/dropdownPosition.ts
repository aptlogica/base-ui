// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
}

interface DropdownPositionParams {
  rect: DOMRect;
  dropdownMinHeight: number;
  dropdownWidth: number;
  align?: 'left' | 'right';
  offset?: number;
  sideMargin?: number;
  viewportHeight?: number;
  viewportWidth?: number;
}

export function calculateDropdownPosition({
  rect,
  dropdownMinHeight,
  dropdownWidth,
  align = 'left',
  offset = 6,
  sideMargin = 10,
  viewportHeight = window.innerHeight,
  viewportWidth = window.innerWidth,
}: DropdownPositionParams): DropdownPosition {
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  const position: 'below' | 'above' =
    spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow ? 'above' : 'below';

  let left = align === 'right' ? rect.right - dropdownWidth : rect.left;
  if (left < sideMargin) {
    left = sideMargin;
  }
  if (left + dropdownWidth > viewportWidth - sideMargin) {
    left = viewportWidth - dropdownWidth - sideMargin;
  }

  if (position === 'below') {
    return {
      top: rect.bottom + offset,
      left,
      width: dropdownWidth,
    };
  }

  return {
    bottom: viewportHeight - rect.top + offset,
    left,
    width: dropdownWidth,
  };
}
