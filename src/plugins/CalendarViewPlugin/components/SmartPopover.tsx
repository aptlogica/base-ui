import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SmartPopoverProps {
  anchorEl: HTMLElement | null;
  placement?: "top" | "bottom" | "left" | "right";
  offset?: number;
  className?: string;
  children: React.ReactNode;
}

const SmartPopover: React.FC<SmartPopoverProps> = ({
  anchorEl,
  placement = "top",
  offset = 8,
  className = "",
  children,
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!anchorEl) {
      setRect(null);
      return;
    }
    const update = () => setRect(anchorEl.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorEl]);

  if (!anchorEl || !rect) return null;

  // compute a basic fixed position centered horizontally on the anchor
  const centerX = rect.left + rect.width / 2;
  let top = 0;
  let left = centerX;
  let transform = "translateX(-50%)";

  if (placement === "top") {
    top = rect.top - offset;
    transform = "translateX(-50%) translateY(-100%)";
  } else if (placement === "bottom") {
    top = rect.bottom + offset;
    transform = "translateX(-50%) translateY(0)";
  } else if (placement === "left") {
    left = rect.left - offset;
    top = rect.top + rect.height / 2;
    transform = "translateX(-100%) translateY(-50%)";
  } else if (placement === "right") {
    left = rect.right + offset;
    top = rect.top + rect.height / 2;
    transform = "translateX(0) translateY(-50%)";
  }

  const style: React.CSSProperties = {
    position: "fixed",
    left,
    top,
    transform,
    zIndex: 9999,
  };

  return createPortal(
    <div style={style} className={className}>
      {children}
    </div>,
    document.body
  );
};

export default SmartPopover;
