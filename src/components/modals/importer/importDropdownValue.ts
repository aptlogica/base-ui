// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

export const getSingleDropdownValue = (value: string | string[]): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value;
};
