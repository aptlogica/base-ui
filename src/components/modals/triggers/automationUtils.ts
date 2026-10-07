// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { Zap, Webhook, Braces } from 'lucide-react';
import type { Automation } from '../../../service/clientService';

export type AutomationType = Automation['type'];

export const TYPE_CONFIG: Record<AutomationType, {
  label: string;
  singular: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  queryLabel: string;
  titlePlaceholder: string;
  helperText: string;
}> = {
  trigger: {
    label: 'Triggers',
    singular: 'trigger',
    description: 'Run automatically when records in this table are added, changed or deleted.',
    icon: Zap,
    queryLabel: 'Trigger query',
    titlePlaceholder: 'e.g. Log salary changes',
    helperText: 'Only one CREATE TRIGGER on this table. It calls a function from the Functions tab: EXECUTE FUNCTION name().',
  },
  webhook: {
    label: 'Webhooks',
    singular: 'webhook',
    description: 'Saved with the table. Sending webhooks is not active yet.',
    icon: Webhook,
    queryLabel: 'Webhook context',
    titlePlaceholder: 'e.g. Notify CRM',
    helperText: 'Stored with the table. Webhook delivery is not active yet.',
  },
  function: {
    label: 'Functions',
    singular: 'function',
    description: 'The logic that triggers call. One function can be used by several triggers.',
    icon: Braces,
    queryLabel: 'Function query',
    titlePlaceholder: 'e.g. Set default status',
    helperText: 'One CREATE FUNCTION name() RETURNS trigger. Use it from any trigger with EXECUTE FUNCTION name().',
  },
};

export const placeholderFor = (type: AutomationType, alias: string): string => {
  switch (type) {
    case 'trigger':
      return `CREATE TRIGGER my_trigger\nAFTER INSERT ON "public"."${alias}"\nFOR EACH ROW EXECUTE FUNCTION my_function();`;
    case 'function':
      return `CREATE OR REPLACE FUNCTION my_function()\nRETURNS trigger AS $$\nBEGIN\n  -- your logic, e.g. NEW.status := 'new';\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;`;
    default:
      return '{"url": "https://example.com/webhook"}';
  }
};

// The trigger or function name; also the fallback for entries saved without a title
export const nameFromContext = (context: string): string => {
  const trigger = /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+"?(\w+)"?/i.exec(context);
  if (trigger) return trigger[1];
  const fn = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:"?\w+"?\.)?"?(\w+)"?/i.exec(context);
  return fn ? fn[1] : context.split('\n')[0];
};

// "BEFORE INSERT, BEFORE UPDATE" from a CREATE TRIGGER query
export const triggerEvent = (context: string): string => {
  const match = /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+"?\w+"?\s+(BEFORE|AFTER|INSTEAD\s+OF)\s+([\s\S]+?)\s+ON\s+/i.exec(context);
  if (!match) return '-';
  const timing = match[1].replace(/\s+/g, ' ').toUpperCase();
  return match[2]
    .split(/\s+OR\s+/i)
    .map(event => `${timing} ${event.trim().split(/\s+/)[0].toUpperCase()}`)
    .join(', ');
};

export const displayTitle = (item: Automation): string => item.title || nameFromContext(item.context);

export const formatDate = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
