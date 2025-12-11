/** A minimal, shape-agnostic workspace graph used for fast lookups. */
export interface WorkspaceNode { id: string; bases?: BaseNode[] }
export interface BaseNode { id: string; workspace_id?: string; workspaceId?: string; tables?: TableNode[] }
export interface TableNode { id: string; base_id?: string; baseId?: string; views?: { id: string }[] }

export interface WorkspaceIndex {
  baseToWorkspace: Map<string, string>;
  tableToBase: Map<string, string>;
}

/**
 * Build O(1) lookup maps for navigation.
 * - baseToWorkspace: baseId → workspaceId
 * - tableToBase: tableId → baseId
 * Accepts both raw API and processed shapes.
 */
export function buildWorkspaceIndex(workspaces: any[] | WorkspaceNode[] | null | undefined): WorkspaceIndex {
  const baseToWorkspace = new Map<string, string>();
  const tableToBase = new Map<string, string>();
  if (!Array.isArray(workspaces)) return { baseToWorkspace, tableToBase };

  for (const ws of workspaces as WorkspaceNode[]) {
    const wsId = (ws as any).id;
    const bases = (ws as any).bases || [];
    for (const b of bases as BaseNode[]) {
      baseToWorkspace.set((b as any).id, (b as any).workspace_id || (b as any).workspaceId || wsId);
      const tables = (b as any).tables || [];
      for (const t of tables as TableNode[]) {
        tableToBase.set((t as any).id, (t as any).base_id || (t as any).baseId || (b as any).id);
      }
    }
  }
  return { baseToWorkspace, tableToBase };
}

/** Shortcut resolver using the built index (kept for convenience). */
export function resolveWorkspaceIdFromBaseIdFast(baseId: string, workspaces: any[] | WorkspaceNode[]): string | undefined {
  const { baseToWorkspace } = buildWorkspaceIndex(workspaces);
  return baseToWorkspace.get(baseId);
}


