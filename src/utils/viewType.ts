// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
// Shared helpers for view type normalization and matching
export const normalizeViewType = (raw: unknown): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const t = raw.trim().toLowerCase();
  return t.length ? t : undefined;
};

export const matchesViewType = (raw: unknown, validTypes: string[]): boolean => {
  const t = normalizeViewType(raw);
  if (!t) return false;
  return validTypes.includes(t);
};
