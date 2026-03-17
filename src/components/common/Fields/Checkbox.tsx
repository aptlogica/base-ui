// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Check, Square, Star, Heart, ThumbsUp, ThumbsDown, Flag, Circle, BadgeCheck, ShieldCheck, Award, Trophy, Medal, Zap, Sparkles, Crown, Gem, Diamond } from 'lucide-react';

interface CheckboxProps {
  value: any;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  icon?: string;
  color?: string;
  config?: {
    defaultValue?: boolean;
    icon?: string;
    color?: string;
    [key: string]: any;
  };
}

// Icon mapping - extracted outside component to reduce complexity
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  heart: Heart,
  flag: Flag,
  badge: BadgeCheck,
  shield: ShieldCheck,
  award: Award,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  gem: Gem,
  diamond: Diamond,
  zap: Zap,
  sparkles: Sparkles,
};

// Helper function to render filled icon - extracted to reduce complexity
function renderFilledIcon(IconComponent: React.ComponentType<{ className?: string }>, colorClass: string) {
  return <IconComponent className={`w-5 h-5 ${colorClass} fill-current`} />;
}

// Helper function to render unfilled icon - extracted to reduce complexity
function renderUnfilledIcon(IconComponent: React.ComponentType<{ className?: string }>) {
  return <IconComponent className="w-5 h-5 text-gray-400" />;
}

// Helper function to render check/circle with background - extracted to reduce complexity
function renderCheckWithBackground(displayValue: boolean, isRounded: boolean, colorClass: string) {
  const shapeClass = isRounded ? 'rounded-full' : 'rounded';
  const bgClass = colorClass.replace('text-', 'bg-').replace('-600', '-500');
  
  if (displayValue) {
    return (
      <div className={`w-5 h-5 ${shapeClass} flex items-center justify-center ${bgClass} border-current`}>
        <Check className="w-4 h-4 text-white" />
      </div>
    );
  }
  
  return (
    <div className={`w-5 h-5 ${shapeClass} flex items-center justify-center`}>
      {isRounded ? <Circle className="w-5 h-5 text-gray-400" /> : <Square className="w-5 h-5 text-gray-400" />}
    </div>
  );
}

export const Checkbox: React.FC<CheckboxProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  readOnly = false,
  icon = 'check',
  color = 'green',
  config = {}
}) => {
  const { defaultValue = false, icon: configIcon = icon, color: configColor = color } = config;

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      green: 'text-green-600',
      blue: 'text-blue-600',
      red: 'text-red-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600',
      yellow: 'text-yellow-400'
    };
    return colorMap[color] || 'text-green-600';
  };

  const renderIcon = () => {
    const colorClass = getColorClass(configColor);

    // Special cases for check and circle (with background)
    if (configIcon === 'check') {
      return renderCheckWithBackground(displayValue, false, colorClass);
    }
    
    if (configIcon === 'circle') {
      return renderCheckWithBackground(displayValue, true, colorClass);
    }

    // Special case for thumb (different icons for checked/unchecked)
    if (configIcon === 'thumb') {
      if (displayValue) {
        return <ThumbsUp className={`w-5 h-5 ${colorClass} fill-current`} />;
      }
      return <ThumbsDown className="w-5 h-5 text-gray-400" />;
    }

    // Generic icon rendering for all other cases
    const IconComponent = iconMap[configIcon];
    if (IconComponent) {
      if (displayValue) {
        return renderFilledIcon(IconComponent, colorClass);
      }
      return renderUnfilledIcon(IconComponent);
    }

    // Default case
    if (displayValue) {
      return (
        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('-600', '-500')} border-current`}>
          <Check className="w-3 h-3 text-white" />
        </div>
      );
    }
    
    return (
      <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center bg-white">
        <Square className="w-3 h-3 text-gray-400" />
      </div>
    );
  };

  // Normalize value to boolean - handles old text values when field type was changed
  const normalizeToBoolean = (val: any): boolean => {
    if (val === null || val === undefined) return defaultValue;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      // Only accept explicit boolean strings, treat everything else as invalid (use default)
      const trimmed = val.trim().toLowerCase();
      if (trimmed === 'true' || trimmed === '1') return true;
      if (trimmed === 'false' || trimmed === '0' || trimmed === '' || trimmed === 'null') return defaultValue;
      // For any other string (like old text values "xyz"), treat as invalid and use default
      return defaultValue;
    }
    if (typeof val === 'number') return val !== 0;
    // For other types, convert to boolean
    return Boolean(val);
  };

  const displayValue = normalizeToBoolean(value);

  const handleClick = () => {
    if (!disabled && !readOnly) {
      onChange(!displayValue);
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || readOnly}
        className={`flex items-center justify-center transition-all ${disabled || readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
      >
        {renderIcon()}
      </button>
      {label && (
        <span className={`ml-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </div>
  );
};