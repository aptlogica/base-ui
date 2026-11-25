// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, Import } from 'lucide-react';

export interface Flyer {
  id: number;
  kind: 'export' | 'import';
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const SIZE = 36;
export const FLY_MS = 700;

/**
 * A small round icon that flies from where a dialog was (its middle) into the Jobs icon, shrinking as it goes, like the
 * file of a browser's download dropping into its toolbar icon. It removes itself when it has arrived.
 */
export const JobFlyer: React.FC<{ flyer: Flyer; onDone: (flyer: Flyer) => void }> = ({ flyer, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') {
      onDone(flyer);
      return;
    }
    const dx = flyer.to.x - flyer.from.x;
    const dy = flyer.to.y - flyer.from.y;
    const animation = el.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
        // it first lifts a little, then drops into the icon
        { transform: `translate(${dx * 0.3}px, ${dy * 0.3 - 36}px) scale(1.1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.25, offset: 1 },
      ],
      { duration: FLY_MS, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' },
    );
    animation.onfinish = () => onDone(flyer);
    return () => animation.cancel();
  }, [flyer, onDone]);

  const Icon = flyer.kind === 'export' ? Download : Import;
  return createPortal(
    <div
      ref={ref}
      data-testid="jobs-flyer"
      aria-hidden="true"
      className="fixed z-[70] pointer-events-none flex items-center justify-center rounded-full bg-green-600 text-white shadow-lg"
      style={{ left: flyer.from.x - SIZE / 2, top: flyer.from.y - SIZE / 2, width: SIZE, height: SIZE }}
    >
      <Icon className="w-4 h-4" />
    </div>,
    document.body,
  );
};
