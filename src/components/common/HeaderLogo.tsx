import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';

interface HeaderLogoProps {
  logoUrl?: string;
}

const HeaderLogo: React.FC<HeaderLogoProps> = () => {
  const navigate = useNavigate();
  const { selectedWorkspaceId } = useNavigationStore();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (selectedWorkspaceId) {
      navigate(`/workspace/${selectedWorkspaceId}`);
    } else {
      navigate('/workspace');
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center justify-center transition-all duration-200"
      title="Go to Homepage"
    >
      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 border rounded-xl shadow-xs">
        {isHovered ? (
          <Home className="w-5 h-5 text-primary" />
        ) : (
          <img 
            src="/assets/logo.svg" 
            alt="Logo" 
            className="w-full h-full object-cover rounded-xl"
          />
        )}
      </div>
    </button>
  );
};

export default HeaderLogo;

