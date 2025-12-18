export type Row = {
  _meta: {
    id: string;
    created_at: string;
    updated_at: string;
    position: number;
    deleted_at: string | null;
  };
  data: { [key: string]: any };
};

export type KanbanStack = {
  id: string;
  name: string;
  color: string;
  position: number;
  cards: Row[];
  isCollapsed: boolean;
};
