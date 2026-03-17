// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useEffect, useState } from 'react';

interface UseContextMenuPositionOptions {
  menuHeightFallback?: number;
  menuWidthFallback?: number;
  margin?: number;
}

export const useContextMenuDismiss = (
  menuRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void
) => {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [menuRef, onClose]);
};

export const useContextMenuPosition = (
  x: number,
  y: number,
  menuRef: React.RefObject<HTMLDivElement | null>,
  options: UseContextMenuPositionOptions = {}
) => {
  const { menuHeightFallback = 200, menuWidthFallback = 180, margin = 10 } = options;
  const [position, setPosition] = useState({ top: y, left: x });

  useEffect(() => {
    if (!menuRef.current) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Use requestAnimationFrame to ensure menu is rendered before measuring
    requestAnimationFrame(() => {
      if (!menuRef.current) return;

      const menuRect = menuRef.current.getBoundingClientRect();
      const menuHeight = menuRect.height || menuHeightFallback;
      const menuWidth = menuRect.width || menuWidthFallback;

      let adjustedTop = y;
      let adjustedLeft = x;

      const spaceBelow = viewportHeight - y;
      const spaceAbove = y;

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        adjustedTop = y - menuHeight;
      }

      if (adjustedTop < margin) {
        adjustedTop = margin;
      }

      if (adjustedTop + menuHeight > viewportHeight - margin) {
        adjustedTop = viewportHeight - menuHeight - margin;
      }

      if (x + menuWidth > viewportWidth - margin) {
        adjustedLeft = viewportWidth - menuWidth - margin;
      }

      if (adjustedLeft < margin) {
        adjustedLeft = margin;
      }

      setPosition({ top: adjustedTop, left: adjustedLeft });
    });
  }, [menuRef, x, y, menuHeightFallback, menuWidthFallback, margin]);

  return position;
};
