import React, { useState } from 'react';
import { Star, Heart, Circle, ThumbsUp, Flag, CheckCircle, BadgeCheck, ShieldCheck, Award, Trophy, Medal, Zap, Sparkles, Crown, Gem, Diamond } from 'lucide-react';

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean; // true = completely prevent editing
  config?: {
    ratingMax?: number;
    ratingDefault?: number;
    ratingIcon?: string;
    ratingColor?: string;
    [key: string]: any;
  };
}

export const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  max = 5,
  required = false,
  disabled = false,
  readOnly = false,
  config = {}
}) => {
  const { ratingMax = max, ratingDefault = 0, ratingIcon = 'star', ratingColor = 'yellow' } = config;

  // Color mapping (match config modal)
  const getColorClass = (color: string, isFilled: boolean) => {
    const colorMap: Record<string, string> = {
      yellow: isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-200',
      blue: isFilled ? 'text-blue-400 fill-blue-400' : 'text-gray-300 hover:text-blue-200',
      red: isFilled ? 'text-red-400 fill-red-400' : 'text-gray-300 hover:text-red-200',
      green: isFilled ? 'text-green-400 fill-green-400' : 'text-gray-300 hover:text-green-200',
      purple: isFilled ? 'text-purple-400 fill-purple-400' : 'text-gray-300 hover:text-purple-200',
      pink: isFilled ? 'text-pink-400 fill-pink-400' : 'text-gray-300 hover:text-pink-200',
      orange: isFilled ? 'text-orange-400 fill-orange-400' : 'text-gray-300 hover:text-orange-200',
      indigo: isFilled ? 'text-indigo-400 fill-indigo-400' : 'text-gray-300 hover:text-indigo-200',
      teal: isFilled ? 'text-teal-400 fill-teal-400' : 'text-gray-300 hover:text-teal-200',
      gray: isFilled ? 'text-gray-400 fill-gray-400' : 'text-gray-300 hover:text-gray-200',
    };
    return colorMap[color] || colorMap.yellow;
  };

  // Icon mapping (match config modal) - with fill support for filled icons
  const getIcon = (icon: string, isFilled: boolean) => {
    const iconProps = {
      className: "w-5 h-5",
      fill: isFilled ? "currentColor" : "none",
    };

    const iconMap: Record<string, React.ReactNode> = {
      star: <Star {...iconProps} />,
      heart: <Heart {...iconProps} />,
      circle: <Circle {...iconProps} />,
      thumb: <ThumbsUp {...iconProps} />,
      flag: <Flag {...iconProps} />,
      check: <CheckCircle {...iconProps} />,
      badge: <BadgeCheck {...iconProps} />,
      shield: <ShieldCheck {...iconProps} />,
      award: <Award {...iconProps} />,
      trophy: <Trophy {...iconProps} />,
      medal: <Medal {...iconProps} />,
      zap: <Zap {...iconProps} />,
      sparkles: <Sparkles {...iconProps} />,
      crown: <Crown {...iconProps} />,
      gem: <Gem {...iconProps} />,
      diamond: <Diamond {...iconProps} />,
    };
    return iconMap[icon] || iconMap.star;
  };

  // Use default value if value is 0/null/undefined and default value is provided
  const displayValue = (value !== null && value !== undefined && value !== 0) ? value : (ratingDefault || 0);

  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = (val: number) => {
    if (required && val === 0) {
      return 'Please provide a rating';
    }
    if (val < 0 || val > ratingMax) {
      return `Rating must be between 0 and ${ratingMax}`;
    }
    return null;
  };

  const handleStarClick = (starValue: number) => {
    if (disabled || readOnly) return;
    let newValue = starValue;
    // If clicking the same star that's already selected, toggle it off
    if (displayValue === starValue) {
      newValue = 0;
    }
    onChange(newValue);
    const validationError = validate(newValue);
    setError(validationError);
  };

  const handleStarHover = (starValue: number) => {
    if (!disabled && !readOnly) {
      setHoverValue(starValue);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const getStarFill = (starIndex: number) => {
    const currentValue = hoverValue ?? displayValue;
    if (currentValue >= starIndex) {
      return 'full';
    } else {
      return 'empty';
    }
  };

  const renderStar = (starIndex: number) => {
    const fill = getStarFill(starIndex);
    const isFilled = fill === 'full';
    return (
      <button
        key={starIndex}
        type="button"
        onClick={() => handleStarClick(starIndex)}
        onMouseEnter={() => handleStarHover(starIndex)}
        disabled={disabled || readOnly}
        className={`transition-all duration-150 ${disabled || readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
          }`}
      >
        <span className={`transition-colors ${getColorClass(ratingColor, isFilled)}`}>
          {getIcon(ratingIcon, isFilled)}
        </span>
      </button>
    );
  };

  return (
    <div className="w-full">
      <div
        className="w-full flex items-center justify-center gap-1 py-1"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: ratingMax }, (_, index) => renderStar(index + 1))}
      </div>
      {error && (
        <div className="text-xs text-red-600 mt-1 px-2">{error}</div>
      )}
    </div>
  );
};