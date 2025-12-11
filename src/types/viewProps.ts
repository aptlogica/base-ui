import type { ViewContext } from './viewRuntime';

/**
 * Unified props contract for all view wrappers.
 * Provide either:
 * - context (preferred when wrapped by ViewHost)
 * or
 * - tableId (and optionally viewId)
 */
export interface ViewWrapperProps {
  tableId?: string;
  viewId?: string;
  context?: ViewContext;
}
