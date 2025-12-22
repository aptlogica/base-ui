import React from 'react';

interface User {
  id: string;
  name: string;
  avatar?: string | null;
  email?: string;
}

interface UserAvatarStackProps {
  users: User[];
  maxVisible?: number; // Default: 3
  size?: 'sm' | 'md' | 'lg'; // Avatar size
  showCount?: boolean; // Show "+N" badge if more users
  onClick?: () => void; // Optional click handler (e.g., to open modal)
  className?: string;
}

export const UserAvatarStack: React.FC<UserAvatarStackProps> = ({
  users,
  maxVisible = 3,
  size = 'md',
  showCount = true,
  onClick,
  className = ''
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-10 h-10 text-base'
  };
  
  // Get visible users and remaining count
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;
  
  // Helper to get initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  // Helper to get avatar color (consistent with existing pattern)
  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-cyan-500'
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  if (users.length === 0) return null;
  
  return (
    <div 
      className={`flex items-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <div
            key={user.id}
            className={`${sizeClasses[size]} rounded-full border-2 border-white flex items-center justify-center flex-shrink-0 relative`}
            style={{ zIndex: maxVisible - index }}
            title={user.name}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className={`w-full h-full ${getAvatarColor(user.id)} rounded-full flex items-center justify-center text-white font-semibold`}>
                {getInitials(user.name)}
              </div>
            )}
          </div>
        ))}
        
        {remainingCount > 0 && showCount && (
          <div
            className={`${sizeClasses[size]} rounded-full border-2 border-white bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-700 font-medium`}
            title={`${remainingCount} more ${remainingCount === 1 ? 'member' : 'members'}`}
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
};

