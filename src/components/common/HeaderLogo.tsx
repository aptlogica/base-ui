import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

interface HeaderLogoProps {
  logoUrl?: string;
}

const HeaderLogo: React.FC<HeaderLogoProps> = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate('/homepage');
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center justify-center transition-all duration-200"
      title="Go to Homepage"
    >
      <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-200 hover:shadow-md">
        {isHovered ? (
          <Home className="w-5 h-5 text-primary" />
        ) : (
          <img 
            src="/assets/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain rounded-lg"
          />
        )}
      </div>
    </button>
  );
};

export default HeaderLogo;

