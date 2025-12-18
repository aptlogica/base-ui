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

    const horizontal: 'right' | 'left' =
      (horizPref && ((horizPref === 'right' && spaceRight >= panelW) || (horizPref === 'left' && spaceLeft >= panelW)))
        ? horizPref
        : (spaceRight >= panelW ? 'right' : (spaceLeft >= panelW ? 'left' : (spaceRight >= spaceLeft ? 'right' : 'left')));

    const vertical: 'bottom' | 'top' =
      (vertPref && ((vertPref === 'bottom' && spaceBelow >= panelH) || (vertPref === 'top' && spaceAbove >= panelH)))
        ? vertPref
        : (spaceBelow >= panelH ? 'bottom' : (spaceAbove >= panelH ? 'top' : (spaceBelow >= spaceAbove ? 'bottom' : 'top')));

    let left = horizontal === 'right' ? rect.left : rect.right - panelW;
    let top = vertical === 'bottom' ? rect.bottom + margin : rect.top - panelH - margin;

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
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      if (ignoreRefs.some(r => r.current && r.current.contains(t))) return;
      
      
      if (onOutsideClick) onOutsideClick();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOutsideClick, panelRef, triggerRef, ignoreRefs]);

  return { position, recompute: computePosition };
}
