import React from 'react';

interface LoaderProps {
  /**
   * Size of each bouncing dot in pixels
   * @default 16
   */
  size?: number;
  
  /**
   * Color of the bouncing dots
   * @default "var(--color-brand-600)"
   */
  spinnerColor?: string;
  
  /**
   * Text to display alongside the loader
   * If provided, text will be shown. If not provided or empty, no text will be shown.
   */
  text?: string;
  
  /**
   * Position of the text relative to the loader
   * @default "right"
   */
  textPosition?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Text color
   * @default "text-primary"
   */
  textColor?: string;
  
  /**
   * Text size class
   * @default "text-sm"
   */
  textSize?: string;
  
  /**
   * Gap between loader and text
   * @default "0.5rem"
   */
  gap?: string;
  
  /**
   * Gap between dots
   * @default "0.5rem"
   */
  dotGap?: string;
  
  /**
   * Additional className for the container
   */
  className?: string;
}

const LoaderComponent: React.FC<LoaderProps> = ({
  size = 8,
  spinnerColor = "var(--color-brand-600)",
  text,
  textPosition = 'right',
  textColor = "text-primary",
  textSize = 'text-sm',
  gap = '0.5rem',
  dotGap = '0.5rem',
  className = '',
}) => {
  const getContainerClass = () => {
    const baseClass = 'inline-flex items-center';
    switch (textPosition) {
      case 'top':
        return `${baseClass} flex-col-reverse`;
      case 'bottom':
        return `${baseClass} flex-col`;
      case 'left':
        return `${baseClass} flex-row-reverse`;
      case 'right':
      default:
        return `${baseClass} flex-row`;
    }
  };

  return (
    <div className={`${getContainerClass()} ${className}`} style={{ gap }}>
      <output
        className="flex flex-row flex-shrink-0"
        style={{ gap: dotGap }}
        aria-live="polite"
        aria-label="Loading"
      >
        <div
          className="rounded-full animate-bounce"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: spinnerColor,
          }}
        />
        <div
          className="rounded-full animate-bounce"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: spinnerColor,
            animationDelay: '-0.3s',
          }}
        />
        <div
          className="rounded-full animate-bounce"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: spinnerColor,
            animationDelay: '-0.5s',
          }}
        />
      </output>
      {text && (
        <span
          className={`${textSize} ${textColor.startsWith('text-') ? textColor : ''}`}
          style={textColor.startsWith('text-') ? {} : { color: textColor }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export const Loader = React.memo(LoaderComponent);