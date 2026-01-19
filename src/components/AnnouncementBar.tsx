import React from 'react';

export interface AnnouncementButton {
  label: string;
  onClick: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface AnnouncementBarProps {
  message: React.ReactNode;
  type?: 'info' | 'warning' | 'error' | 'success';
  buttons?: AnnouncementButton[];
  visible?: boolean;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  message,
  type = 'info',
  buttons = [],
  visible = false,
}) => {
  if (!visible) return null;
  const typeColor = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
  }[type];

  return (
    <div className={`fixed top-0 left-0 right-0 w-screen px-4 py-2 flex items-center justify-between ${typeColor} border-b border-gray-200 z-[9999]`}>
      <div>{message}</div>
      <div className="flex gap-2">
        {buttons.map((btn) => {
          let btnClass = '';
          if (btn.style === 'danger') {
            btnClass = 'bg-red-500 text-white';
          } else if (btn.style === 'primary') {
            btnClass = 'bg-blue-600 text-white';
          } else {
            btnClass = 'bg-gray-200 text-gray-800';
          }
          return (
            <button
              key={btn.label}
              className={`px-3 py-1 rounded ${btnClass}`}
              onClick={btn.onClick}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
