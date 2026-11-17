// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { disableBaseApiService, enableBaseApiService, getBaseApiService } from '../../service/clientService';

export const baseApiQueryKey = (baseId: string) => ['bases', baseId, 'api'];

// Whether the base's API is on, and its public ID and base path once it has been turned on
export const useBaseApi = (baseId: string | null | undefined) =>
  useQuery({
    queryKey: baseApiQueryKey(baseId || ''),
    queryFn: () => getBaseApiService(baseId as string),
    enabled: !!baseId,
    select: (res) => res?.data,
  });

// Turns the base's API on or off; the response is the new status, so it replaces the cached one
const useSetBaseApi = (call: (baseId: string) => ReturnType<typeof getBaseApiService>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: call,
    onSuccess: (res, baseId) => {
      queryClient.setQueryData(baseApiQueryKey(baseId), res);
    },
  });
};

export const useEnableBaseApi = () => useSetBaseApi(enableBaseApiService);

export const useDisableBaseApi = () => useSetBaseApi(disableBaseApiService);
