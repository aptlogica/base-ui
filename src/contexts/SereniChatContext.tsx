// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SereniChatContextType {
  isSereniChatOpen: boolean;
  openSereniChat: () => void;
  closeSereniChat: () => void;
  toggleSereniChat: () => void;
}

const SereniChatContext = createContext<SereniChatContextType | undefined>(undefined);

export const SereniChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSereniChatOpen, setIsSereniChatOpen] = useState(false);

  const openSereniChat = () => setIsSereniChatOpen(true);
  const closeSereniChat = () => setIsSereniChatOpen(false);
  const toggleSereniChat = () => setIsSereniChatOpen((prev) => !prev);

  return (
    <SereniChatContext.Provider value={{ isSereniChatOpen, openSereniChat, closeSereniChat, toggleSereniChat }}>
      {children}
    </SereniChatContext.Provider>
  );
};

export const useSereniChat = () => {
  const context = useContext(SereniChatContext);
  if (context === undefined) {
    throw new Error('useSereniChat must be used within a SereniChatProvider');
  }
  return context;
};
