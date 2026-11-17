// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createApplicationService,
  deleteApplicationService,
  getApplicationService,
  listApplicationsService,
  setApplicationBasesService,
  updateApplicationService,
  type Application,
  type CreateApplicationInput,
  type UpdateApplicationInput,
} from '../../service/clientService';

export const applicationsQueryKey = (workspaceId: string) => ['workspace', workspaceId, 'applications'];
export const applicationQueryKey = (workspaceId: string, applicationId: string) => [
  ...applicationsQueryKey(workspaceId),
  applicationId,
];

// The workspace's applications, each with its API address and bases
export const useApplications = (workspaceId: string | null | undefined) =>
  useQuery({
    queryKey: applicationsQueryKey(workspaceId || ''),
    queryFn: () => listApplicationsService(workspaceId as string),
    enabled: !!workspaceId,
    select: (res): Application[] => res?.data ?? [],
  });

// One application, e.g. for the docs page of its address
export const useApplication = (workspaceId: string | null | undefined, applicationId: string | null | undefined) =>
  useQuery({
    queryKey: applicationQueryKey(workspaceId || '', applicationId || ''),
    queryFn: () => getApplicationService(workspaceId as string, applicationId as string),
    enabled: !!workspaceId && !!applicationId,
    select: (res): Application | undefined => res?.data,
  });

// Every change answers with the application as it now is; the lists are refetched so they show it too
const useApplicationMutation = <V>(workspaceId: string, call: (vars: V) => Promise<{ data?: Application | null } | undefined>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: call,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationsQueryKey(workspaceId) }),
  });
};

export const useCreateApplication = (workspaceId: string) =>
  useApplicationMutation(workspaceId, (input: CreateApplicationInput) => createApplicationService(workspaceId, input));

export const useUpdateApplication = (workspaceId: string) =>
  useApplicationMutation(workspaceId, ({ id, input }: { id: string; input: UpdateApplicationInput }) =>
    updateApplicationService(workspaceId, id, input));

export const useSetApplicationBases = (workspaceId: string) =>
  useApplicationMutation(workspaceId, ({ id, baseIds }: { id: string; baseIds: string[] }) =>
    setApplicationBasesService(workspaceId, id, baseIds));

export const useDeleteApplication = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteApplicationService(workspaceId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationsQueryKey(workspaceId) }),
  });
};
