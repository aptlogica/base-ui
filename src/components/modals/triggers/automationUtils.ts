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
  const operations = parts.map(words => words.at(-1) as TriggerOperation).filter(op => TRIGGER_OPERATIONS.includes(op));
  return TRIGGER_TIMINGS.includes(timing) ? { timing, operations } : null;
};

// The "BEFORE INSERT OR UPDATE OF col" part of a CREATE TRIGGER query; the events may be missing.
// Matched in two steps to keep each regexp simple: the "CREATE TRIGGER name" head, then the timing,
// events and " ON " right after it. The events are matched word by word (any word but ON), so the
// regexp never backtracks over them.
const triggerHeadRegexp = /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+"?\w+"?\s+/gi;
const eventTailRegexp = /(BEFORE|AFTER|INSTEAD\s+OF)\b(\S*(?:\s+(?!ON\s)\S+)*)(\s+ON\s+)/iy;

type EventClause = { start: number; end: number; head: string; timing: string; events: string; on: string };

// The first CREATE TRIGGER head followed by a timing, events and " ON ", or null
const findEventClause = (context: string): EventClause | null => {
  triggerHeadRegexp.lastIndex = 0;
  for (let head = triggerHeadRegexp.exec(context); head; head = triggerHeadRegexp.exec(context)) {
    eventTailRegexp.lastIndex = head.index + head[0].length;
    const tail = eventTailRegexp.exec(context);
    if (tail) {
      return { start: head.index, end: eventTailRegexp.lastIndex, head: head[0], timing: tail[1], events: tail[2], on: tail[3] };
    }
    // Look for the next head from the character after this one's start
    triggerHeadRegexp.lastIndex = head.index + 1;
  }
  return null;
};

// " OR " between events; the lookbehind starts each match only at the first space of a run
const orSeparatorRegexp = /(?<!\s)\s+OR\s+/i;

// Timing and events written in a trigger query (used when an older entry has no stored event)
export const parseQueryEvent = (context: string): { timing: TriggerTiming; operations: TriggerOperation[] } | null => {
  const match = findEventClause(context);
  if (!match) return null;
  const operations = match.events
    .trim()
    .split(orSeparatorRegexp)
    .map(part => part.trim().split(/\s+/)[0].toUpperCase() as TriggerOperation)
    .filter(op => TRIGGER_OPERATIONS.includes(op));
  return { timing: match.timing.replace(/\s+/g, ' ').toUpperCase() as TriggerTiming, operations };
};

// Writes the chosen timing and events into the trigger query, keeping an existing "UPDATE OF columns"
export const withTriggerEvents = (context: string, timing: TriggerTiming, operations: TriggerOperation[]): string => {
  const match = findEventClause(context);
  if (!match) return context;
  const { head, events, on } = match;
  const updatePart = events.trim().split(orSeparatorRegexp).find(part => /^UPDATE\b/i.test(part.trim())) || '';
  const updateOf = /UPDATE\s+OF\s+(\S[\s\S]*)$/i.exec(updatePart.trim());
  const sorted = TRIGGER_OPERATIONS.filter(op => operations.includes(op));
  const updateEvent = updateOf ? `UPDATE OF ${updateOf[1].trim()}` : 'UPDATE';
  const newEvents = sorted.map(op => (op === 'UPDATE' ? updateEvent : op)).join(' OR ');
  const clause = `${head}${timing} ${newEvents}${on.replace(/^[ \t]+/, ' ')}`;
  return context.slice(0, match.start) + clause + context.slice(match.end);
};

export const displayTitle = (item: Automation): string => item.title || nameFromContext(item.context);

export const formatDate = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
