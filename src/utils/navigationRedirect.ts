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


