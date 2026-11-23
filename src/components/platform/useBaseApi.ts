// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enableBaseApiService, getBaseApiService, updateBaseApiSettingsService } from '../../service/clientService';

export const baseApiQueryKey = (baseId: string) => ['base', baseId, 'api'];

// Whether the base API is on, and its public ID and base path once it has been turned on
export const useBaseApi = (baseId: string | null | undefined) =>
  useQuery({
    queryKey: baseApiQueryKey(baseId || ''),
    queryFn: () => getBaseApiService(baseId as string),
    enabled: !!baseId,
    select: (res) => res?.data,
  });

// Turns the base API on; the response is the new status, so it replaces the cached one
export const useEnableBaseApi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (baseId: string) => enableBaseApiService(baseId),
    onSuccess: (res, baseId) => {
      queryClient.setQueryData(baseApiQueryKey(baseId), res);
      // refresh base lists so the card's API badge updates
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

// Turns base management (the schema write APIs) on or off; the response is the new status
export const useUpdateBaseApiSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ baseId, enabled }: { baseId: string; enabled: boolean }) =>
      updateBaseApiSettingsService(baseId, { base_management: { enabled } }),
    onSuccess: (res, { baseId }) => {
      queryClient.setQueryData(baseApiQueryKey(baseId), res);
    },
  });
};
