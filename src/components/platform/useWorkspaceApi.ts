// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enableWorkspaceApiService, getWorkspaceApiService } from '../../service/clientService';

export const workspaceApiQueryKey = (workspaceId: string) => ['workspace', workspaceId, 'api'];

// Whether the workspace API is on, and its public ID and base path once it has been turned on
export const useWorkspaceApi = (workspaceId: string | null | undefined) =>
  useQuery({
    queryKey: workspaceApiQueryKey(workspaceId || ''),
    queryFn: () => getWorkspaceApiService(workspaceId as string),
    enabled: !!workspaceId,
    select: (res) => res?.data,
  });

// Turns the workspace API on; the response is the new status, so it replaces the cached one
export const useEnableWorkspaceApi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => enableWorkspaceApiService(workspaceId),
    onSuccess: (res, workspaceId) => {
      queryClient.setQueryData(workspaceApiQueryKey(workspaceId), res);
    },
  });
};
