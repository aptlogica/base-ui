import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

const WIDTH = 256; // w-64

// A help icon that shows a short description on hover or keyboard focus. It has the look of the formula help tooltip:
// a card under the icon, drawn in the page body so that a modal does not cut it off.
export const InfoTip: React.FC<{ label: string; text: string }> = ({ label, text }) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  const show = useCallback(() => {
    const el = iconRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.left, window.innerWidth - WIDTH - 8)) });
  }, []);
  const hide = useCallback(() => setPos(null), []);

  // keep the card next to the icon when the page scrolls or resizes
  useEffect(() => {
    if (!pos) return;
    window.addEventListener('scroll', show, true);
    window.addEventListener('resize', show);
    return () => {
      window.removeEventListener('scroll', show, true);
      window.removeEventListener('resize', show);
    };
  }, [pos, show]);

  return (
    <span className="relative inline-flex align-middle" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={iconRef}
        type="button"
        aria-label={`About ${label}`}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => { if (e.key === 'Escape' && pos) { e.stopPropagation(); hide(); } }}
        className="focus:outline-none cursor-help"
      >
        <HelpCircle className="w-4 h-4 text-gray-400" />
      </button>
      {pos && createPortal(
        <div
          role="tooltip"
          className="fixed w-64 bg-card border rounded-xl shadow-lg p-4 text-sm z-10000 pointer-events-none"
          style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
        >
          <h4 className="mb-1 text-primary font-semibold capitalize">{label}</h4>
          <p className="text-gray-600 font-normal">{text}</p>
        </div>,
        document.body
      )}
    </span>
  );
};
