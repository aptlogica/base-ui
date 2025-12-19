import React from 'react';

interface MainCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick?: () => void;
  iconColor?: string;
}

const MainCard: React.FC<MainCardProps> = ({ icon, title, desc, onClick, iconColor = 'text-gray-800' }) => (
  <div
    className="flex flex-col items-start bg-card rounded-xl shadow-sm border px-6 py-5 min-w-[240px] flex-1 cursor-pointer hover:shadow-md transition-all duration-200"
    onClick={onClick}
  >
    <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4 p-2 ${iconColor}`}>
      {icon}
    </div>
    <div className="font-semibold text-base text-gray-900 mb-1">{title}</div>
    <div className="text-gray-600 text-sm leading-relaxed">{desc}</div>
  </div>
);

export default MainCard; 