// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  countBaseApiLogsService,
  getBaseApiLogsService,
  type BaseApiLogFilters,
} from '../../service/clientService';
import { LOG_PAGE_SIZE, timeWindow } from './apiLogs/apiLogsModel';

export const baseApiLogsKey = (baseId: string) => ['base', baseId, 'api', 'logs'];

// The log entries of a base, newest first, a page at a time. filters null means nothing can match: no call is made.
// Older pages carry the cursor of the page before; the filters must stay the same between them.
export const useBaseApiLogs = (baseId: string | null | undefined, filters: BaseApiLogFilters | null) =>
  useInfiniteQuery({
    queryKey: [...baseApiLogsKey(baseId || ''), 'list', filters],
    queryFn: ({ pageParam }) =>
      getBaseApiLogsService(baseId as string, { ...filters, limit: LOG_PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last?.data?.next_cursor || undefined,
    enabled: !!baseId && filters !== null,
  });

// How many entries match the filters
export const useBaseApiLogCount = (baseId: string | null | undefined, filters: BaseApiLogFilters | null) =>
  useQuery({
    queryKey: [...baseApiLogsKey(baseId || ''), 'count', filters],
    queryFn: () => countBaseApiLogsService(baseId as string, filters ?? {}),
    enabled: !!baseId && filters !== null,
    select: (res) => res?.data?.count ?? 0,
  });

// The oldest entry the log service still has for the base (one call: the oldest of the whole retention window)
export const useOldestBaseApiLog = (baseId: string | null | undefined, now: number) =>
  useQuery({
    queryKey: [...baseApiLogsKey(baseId || ''), 'oldest', Math.floor(now / 3_600_000)],
    queryFn: () => getBaseApiLogsService(baseId as string, { ...timeWindow('all', now), direction: 'forward', limit: 1 }),
    enabled: !!baseId,
    select: (res) => res?.data?.entries?.[0]?.timestamp,
  });
