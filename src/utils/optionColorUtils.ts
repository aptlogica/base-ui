// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
const OPTION_COLOR_CLASSES = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-orange-100 text-orange-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-cyan-100 text-cyan-800',
  'bg-red-100 text-red-800',
  'bg-yellow-100 text-yellow-800',
  'bg-teal-100 text-teal-800'
];

export const getOptionColorClass = (index: number): string => {
  return OPTION_COLOR_CLASSES[index % OPTION_COLOR_CLASSES.length];
};

export const getReadableTextColor = (hex?: string): string => {
  if (!hex) return '#1f2937';
  const c = hex.replace('#', '');
  if (c.length !== 6) return '#1f2937';
  const r = Number.parseInt(c.slice(0, 2), 16);
  const g = Number.parseInt(c.slice(2, 4), 16);
  const b = Number.parseInt(c.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? '#111827' : '#ffffff';
};
