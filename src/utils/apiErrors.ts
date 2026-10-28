// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { UUID_ERROR_MESSAGES } from './uuid';

// The message to show for a failed API call. Errors from the backend carry a code (e.g. PKY_1008) and an exact
// message such as `Code = "HR" is already used by record #4`; anything else (network, unexpected) gets the fallback.
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { code?: unknown; message?: unknown } | null | undefined;
  // UUID field errors (UID_*) get the same wording the cell shows before saving
  if (e && typeof e.code === 'string' && UUID_ERROR_MESSAGES[e.code]) {
    return UUID_ERROR_MESSAGES[e.code];
  }
  if (e && typeof e.code === 'string' && e.code && typeof e.message === 'string' && e.message.trim()) {
    return e.message;
  }
  return fallback;
};
