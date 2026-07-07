export type ImportColumnMapping = {
  sourceName: string;
  include: boolean;
  fieldType: string;
  defaultValue: string;
};

export type ImportColumnPayload = {
  column_name: string;
  title: string;
  uidt: string;
  meta: Record<string, unknown>;
};

export type ImportPreviewColumn = {
  key: string;
  label: string;
  sampleValue?: string;
  inferredFieldType?: string;
  inferredDefaultValue?: string;
};

export type ImportPreview = {
  columns: ImportPreviewColumn[];
  rows: Array<Record<string, unknown>>;
  totalRows?: number;
};

export type ImportPayload = {
  settings: {
    remove_duplicate_records: boolean;
    trim_extra_spaces: boolean;
    remove_empty_rows: boolean;
  };
  columns: ImportColumnPayload[];
};

