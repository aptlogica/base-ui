// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { Code } from 'lucide-react';

// Small pill shown on a base card when the base API is turned on
export const ApiEnabledBadge = () => (
  <span
    className="badge-brand inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
    aria-label="API enabled"
    title="API enabled"
  >
    <Code className="w-3 h-3" aria-hidden="true" />
    API
  </span>
);

export default ApiEnabledBadge;
