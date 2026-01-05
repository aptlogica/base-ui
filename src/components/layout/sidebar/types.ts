export interface SidebarProps {
  onClose?: () => void;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: number;
  selectedWorkspace?: any;
  onWorkspaceUpdate?: (updatedWorkspace: any) => void;
}

export interface CreateViewPopoverProps {
  anchorRef: React.RefObject<HTMLElement>;
  onOpenModal: (type: string) => void;
  onClose: () => void;
  setPopoverRef?: (ref: HTMLDivElement | null) => void;
}

export interface TableViewsProps {
  table: any;
  views?: any[]; // Add views prop
  navigateToView: (workspaceId: string, baseId: string, tableId: string, viewId: string) => void;
  isViewActive: (baseId: string, tableId: string, viewId: string) => boolean;
  handleViewDeletion: (view: any) => void;
  setShowCreateViewModal: (modal: { tableId: string; viewType: string } | null) => void;
  setEditingViewId: (id: string | null) => void;
  setPopoverRef: (ref: HTMLDivElement | null) => void;
  setViewsRefetchTrigger?: (fn: (prev: number) => number) => void; // Add refetch trigger prop
}

export interface CreateViewButtonProps {
  table: any;
  onOpenModal: (type: string) => void;
  setPopoverRef: (ref: HTMLDivElement | null) => void;
}

