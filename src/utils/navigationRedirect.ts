// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { To, NavigateFunction } from 'react-router-dom';

/**
 * Replace-style navigation used for programmatic redirects (recovery, validation, deletions).
 * Prevents polluting browser history so the back button does not return to invalid pages.
 */
export function replaceNavigate(navigate: NavigateFunction, to: To) {
  navigate(to, { replace: true });
}

/**
 * Push-style navigation used for user-initiated actions (e.g., sidebar/menu clicks).
 * Preserves history so the back button behaves as users expect.
 */
export function pushNavigate(navigate: NavigateFunction, to: To) {
  navigate(to);
}


