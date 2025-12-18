import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

// Inject shimmer keyframes if not already present
if (typeof document !== 'undefined' && !document.getElementById('skeleton-shimmer-style')) {
  const style = document.createElement('style');
  style.id = 'skeleton-shimmer-style';
  style.textContent = `
    @keyframes skeleton-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .skeleton-wave {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className = '',
  variant = 'rectangular',
  animation = 'wave',
}) => {
  const baseClasses = 'bg-card';
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: '', // Wave animation applied via inline style
    none: '',
  };

  const waveStyle: React.CSSProperties = animation === 'wave' ? {
    background: `linear-gradient(90deg, var(--color-card) 25%, var(--color-hover-bg) 50%, var(--color-card) 75%)`,
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
  } : {};

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{ width, height, ...waveStyle }}
      aria-label="Loading..."
      role="status"
    />
  );
};

