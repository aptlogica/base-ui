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

export type TriggerTiming = 'BEFORE' | 'AFTER' | 'INSTEAD OF';
export type TriggerOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';
export const TRIGGER_TIMINGS: TriggerTiming[] = ['BEFORE', 'AFTER', 'INSTEAD OF'];
export const TRIGGER_OPERATIONS: TriggerOperation[] = ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'];

// Timing + events stored in the event column, e.g. "BEFORE INSERT, BEFORE UPDATE"
export const formatEvent = (timing: TriggerTiming, operations: TriggerOperation[]): string =>
  TRIGGER_OPERATIONS.filter(op => operations.includes(op)).map(op => `${timing} ${op}`).join(', ');

export const parseEvent = (event?: string): { timing: TriggerTiming; operations: TriggerOperation[] } | null => {
  if (!event) return null;
  const parts = event.split(',').map(part => part.trim().toUpperCase().split(/\s+/)).filter(words => words.length >= 2);
  if (!parts.length) return null;
  const timing = parts[0].slice(0, -1).join(' ') as TriggerTiming;
  const operations = parts.map(words => words[words.length - 1] as TriggerOperation).filter(op => TRIGGER_OPERATIONS.includes(op));
  return TRIGGER_TIMINGS.includes(timing) ? { timing, operations } : null;
};

// The "BEFORE INSERT OR UPDATE OF col" part of a CREATE TRIGGER query; the events may be missing
const eventClauseRegexp = /(CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+"?\w+"?\s+)(BEFORE|AFTER|INSTEAD\s+OF)\b([\s\S]*?)(\s+ON\s+)/i;

// Timing and events written in a trigger query (used when an older entry has no stored event)
export const parseQueryEvent = (context: string): { timing: TriggerTiming; operations: TriggerOperation[] } | null => {
  const match = eventClauseRegexp.exec(context);
  if (!match) return null;
  const operations = match[3]
    .trim()
    .split(/\s+OR\s+/i)
    .map(part => part.trim().split(/\s+/)[0].toUpperCase() as TriggerOperation)
    .filter(op => TRIGGER_OPERATIONS.includes(op));
  return { timing: match[2].replace(/\s+/g, ' ').toUpperCase() as TriggerTiming, operations };
};

// Writes the chosen timing and events into the trigger query, keeping an existing "UPDATE OF columns"
export const withTriggerEvents = (context: string, timing: TriggerTiming, operations: TriggerOperation[]): string =>
  context.replace(eventClauseRegexp, (_match, head: string, _timing: string, events: string, on: string) => {
    const updatePart = events.trim().split(/\s+OR\s+/i).find(part => /^UPDATE\b/i.test(part.trim())) || '';
    const updateOf = /UPDATE\s+OF\s+([\s\S]+)$/i.exec(updatePart.trim());
    const sorted = TRIGGER_OPERATIONS.filter(op => operations.includes(op));
    return `${head}${timing} ${sorted.map(op => (op === 'UPDATE' && updateOf ? `UPDATE OF ${updateOf[1].trim()}` : op)).join(' OR ')}${on.replace(/^[ \t]+/, ' ')}`;
  });

export const displayTitle = (item: Automation): string => item.title || nameFromContext(item.context);

export const formatDate = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
