// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export type Row = {
  _meta: {
    id: string;
    created_at: string;
    updated_at: string;
    position: number;
    deleted_at: string | null;
  };
  data: { [key: string]: any };
};

export type KanbanStack = {
  id: string;
  name: string;
  color: string;
  position: number;
  cards: Row[];
  isCollapsed: boolean;
};
