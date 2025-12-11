import React from 'react';
import { 
  Check, 
  Square, 
  Star, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  Circle,
  CheckCircle,
  BadgeCheck,
  ShieldCheck,
  Award,
  Trophy,
  Medal,
  Zap,
  Sparkles,
  Crown,
  Gem,
  Diamond
} from 'lucide-react';

interface CheckboxProps {
  value: boolean | any; // Allow any type to handle old text values during field type conversion
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  icon?: string;
  color?: string;
  config?: {
    defaultValue?: boolean;
    icon?: string;
    color?: string;
    description?: string;
    [key: string]: any;
  };
}

export const Checkbox: React.FC<CheckboxProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  icon = 'check',
  color = 'green',
  config = {}
}) => {
  const { defaultValue = false, icon: configIcon = icon, color: configColor = color, description = '' } = config;
  
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
    
    switch (configIcon) {
      case 'check':
        return displayValue ? (
          <div className={`w-5 h-5 rounded flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('-600', '-500')} border-current`}>
            <Check className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded flex items-center justify-center">
            <Square className="w-5 h-5 text-gray-400" />
          </div>
        );
      case 'circle':
        return displayValue ? (
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('-600', '-500')} border-current`}>
            <Check className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full flex items-center justify-center">
            <Circle className="w-5 h-5 text-gray-400" />
          </div>
        );
      case 'star':
        return displayValue ? (
          <Star className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Star className="w-5 h-5 text-gray-400" />
        );
      case 'heart':
        return displayValue ? (
          <Heart className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Heart className="w-5 h-5 text-gray-400" />
        );
      case 'thumb':
        return displayValue ? (
          <ThumbsUp className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <ThumbsDown className="w-5 h-5 text-gray-400" />
        );
      case 'flag':
        return displayValue ? (
          <Flag className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Flag className="w-5 h-5 text-gray-400" />
        );
      case 'badge':
        return displayValue ? (
          <BadgeCheck className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <BadgeCheck className="w-5 h-5 text-gray-400" />
        );
      case 'shield':
        return displayValue ? (
          <ShieldCheck className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <ShieldCheck className="w-5 h-5 text-gray-400" />
        );
      case 'award':
        return displayValue ? (
          <Award className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Award className="w-5 h-5 text-gray-400" />
        );
      case 'trophy':
        return displayValue ? (
          <Trophy className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Trophy className="w-5 h-5 text-gray-400" />
        );
      case 'medal':
        return displayValue ? (
          <Medal className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Medal className="w-5 h-5 text-gray-400" />
        );
      case 'crown':
        return displayValue ? (
          <Crown className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Crown className="w-5 h-5 text-gray-400" />
        );
      case 'gem':
        return displayValue ? (
          <Gem className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Gem className="w-5 h-5 text-gray-400" />
        );
      case 'diamond':
        return displayValue ? (
          <Diamond className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Diamond className="w-5 h-5 text-gray-400" />
        );
      case 'zap':
        return displayValue ? (
          <Zap className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Zap className="w-5 h-5 text-gray-400" />
        );
      case 'sparkles':
        return displayValue ? (
          <Sparkles className={`w-5 h-5 ${colorClass} fill-current`} />
        ) : (
          <Sparkles className="w-5 h-5 text-gray-400" />
        );
      default:
        return displayValue ? (
          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('-600', '-500')} border-current`}>
            <Check className="w-3 h-3 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center bg-white">
            <Square className="w-3 h-3 text-gray-400" />
          </div>
        );
    }
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
    if (!disabled) {
      onChange(!displayValue);
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`flex items-center justify-center transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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