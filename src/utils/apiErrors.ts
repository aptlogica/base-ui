// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

// The message to show for a failed API call. Errors from the backend carry a code (e.g. PKY_1008) and an exact
// message such as `Code = "HR" is already used by record #4`; anything else (network, unexpected) gets the fallback.
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { code?: unknown; message?: unknown } | null | undefined;
  if (e && typeof e.code === 'string' && e.code && typeof e.message === 'string' && e.message.trim()) {
    return e.message;
  }
  return fallback;
};
