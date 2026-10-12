// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { QueryClient } from '@tanstack/react-query';

// Invalidate all queries that list bases so they refetch after a base is created, updated or deleted
export function invalidateBaseQueries(queryClient: QueryClient, workspaceId: string | null | undefined): void {
  void queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'bases'] });
  void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
  void queryClient.invalidateQueries({ queryKey: ['allBases'] });
}
