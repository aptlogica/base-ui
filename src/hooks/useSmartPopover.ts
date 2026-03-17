// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { RefObject, useEffect, useLayoutEffect, useState } from 'react';

type HV = 'left' | 'right' | 'top' | 'bottom';

export interface UseSmartPopoverOptions {
  open: boolean;
  triggerRef: RefObject<HTMLElement>;
  panelRef: RefObject<HTMLElement>;
  margin?: number;
  preferred?: { horizontal?: Exclude<HV, 'top' | 'bottom'>; vertical?: Exclude<HV, 'left' | 'right'> };
  onOutsideClick?: () => void;
  ignoreRefs?: Array<RefObject<HTMLElement>>;
}

export function useSmartPopover({
  open,
  triggerRef,
  panelRef,
  margin = 8,
  preferred,
  onOutsideClick,
  ignoreRefs = []
}: UseSmartPopoverOptions) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const computePosition = () => {
    const btn = triggerRef.current;
    const panel = panelRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelW = panel?.offsetWidth || 384; // default width fallback
    const panelH = panel?.offsetHeight || 240; // default height fallback

    const spaceRight = vw - rect.right;
    const spaceLeft = rect.left;
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;

    const horizPref = preferred?.horizontal;
    const vertPref = preferred?.vertical;

    // Helper function to determine horizontal position
    const getHorizontalPosition = (): 'right' | 'left' => {
      // Check if preferred direction is available and fits
      if (horizPref === 'right' && spaceRight >= panelW) {
        return 'right';
      }
      if (horizPref === 'left' && spaceLeft >= panelW) {
        return 'left';
      }
      
      // Fallback: use whichever side has enough space
      if (spaceRight >= panelW) {
        return 'right';
      }
      if (spaceLeft >= panelW) {
        return 'left';
      }
      
      // Last resort: use side with more space
      if (spaceRight >= spaceLeft) {
        return 'right';
      }
      return 'left';
    };

    // Helper function to determine vertical position
    const getVerticalPosition = (): 'bottom' | 'top' => {
      // Check if preferred direction is available and fits
      if (vertPref === 'bottom' && spaceBelow >= panelH) {
        return 'bottom';
      }
      if (vertPref === 'top' && spaceAbove >= panelH) {
        return 'top';
      }
      
      // Fallback: use whichever side has enough space
      if (spaceBelow >= panelH) {
        return 'bottom';
      }
      if (spaceAbove >= panelH) {
        return 'top';
      }
      
      // Last resort: use side with more space
      if (spaceBelow >= spaceAbove) {
        return 'bottom';
      }
      return 'top';
    };

    const horizontal = getHorizontalPosition();
    const vertical = getVerticalPosition();

    let left: number;
    if (horizontal === 'right') {
      left = rect.left;
    } else {
      left = rect.right - panelW;
    }
    
    let top: number;
    if (vertical === 'bottom') {
      top = rect.bottom + margin;
    } else {
      top = rect.top - panelH - margin;
    }

    left = Math.max(8, Math.min(left, vw - panelW - 8));
    top = Math.max(8, Math.min(top, vh - panelH - 8));

    setPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const raf = requestAnimationFrame(() => computePosition());
    const onResize = () => computePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !onOutsideClick) return;
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      if (ignoreRefs.some(r => r.current?.contains(t))) return;
      
      
      if (onOutsideClick) onOutsideClick();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOutsideClick, panelRef, triggerRef, ignoreRefs]);

  return { position, recompute: computePosition };
}
