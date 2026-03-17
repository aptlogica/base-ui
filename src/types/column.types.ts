// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
/**
 * Shared column types for all views (Grid, Kanban, Gallery, etc.)
 * This file contains common column interfaces that can be used across different view plugins
 */

export interface BaseColumn {
  id?: string; // API ID for backend operations
  key: string;
  column_name?: string; // From API
  title: string;
  description?: string; // Column description
  type: string; // Field type
  uidt?: string; // UI Data Type from API
  width?: number;
  position?: number;
  order_index?: number; // From API
  isHidden?: boolean;
  hidden?: boolean;
  is_hidden?: boolean;
  isSystem?: boolean;
  system?: boolean; // From API
  isRequired?: boolean;
  displayAsProgress?: boolean;
  options?: string[] | any[]; // Support both formats
  meta?: any; // Can be object or string in API
  config?: any;
}

// Re-export as ColumnConfig for backward compatibility
export type ColumnConfig = BaseColumn;

// Grid-specific column interface (extends BaseColumn)
export interface GridColumn extends BaseColumn {
  // Grid-specific properties can be added here if needed
}
