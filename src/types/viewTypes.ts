// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { Grid2x2, ClipboardList, Image, SquareKanban, Calendar, ChartNetwork } from 'lucide-react';

// View type definitions with icons, colors, and metadata
export const VIEW_TYPES = [
  { type: 'grid', label: 'Grid', icon: 'Grid2x2', color: '#38bdf8' },
  { type: 'form', label: 'Form', icon: 'ClipboardList', color: '#6366f1' },
  { type: 'gallery', label: 'Gallery', icon: 'Image', color: '#ec4899' },
  { type: 'kanban', label: 'Kanban', icon: 'SquareKanban', color: '#f59e42' },
  { type: 'calendar', label: 'Calendar', icon: 'Calendar', color: '#a21caf' },
  { type: 'ganttChart', label: 'Gantt Chart', icon: 'ChartNetwork', color: '#9929EA' },
];

// Icon mapping for easy access
export const VIEW_ICONS = {
  grid: { icon: Grid2x2, color: '#38bdf8', bgColor: 'bg-sky-100' },
  form: { icon: ClipboardList, color: '#6366f1', bgColor: 'bg-indigo-100' },
  gallery: { icon: Image, color: '#ec4899', bgColor: 'bg-pink-100' },
  kanban: { icon: SquareKanban, color: '#f59e42', bgColor: 'bg-orange-100' },
  calendar: { icon: Calendar, color: '#a21caf', bgColor: 'bg-purple-100' },
  ganttChart: { icon: ChartNetwork, color: '#9929EA', bgColor: 'bg-violet-100' },
};

// View type enum for type safety
export enum ViewType {
  Grid = 'grid',
  Form = 'form',
  Gallery = 'gallery',
  Kanban = 'kanban',
  Calendar = 'calendar',
  GanttChart = 'ganttChart',
}

// Helper function to get view icon info
export const getViewIconInfo = (type: string) => {
  return VIEW_ICONS[type as keyof typeof VIEW_ICONS] || VIEW_ICONS.grid;
}; 