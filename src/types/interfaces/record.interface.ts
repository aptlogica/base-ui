const RECORD_TABLE = "records";

interface RecordBaseInput {
    position: number;
}

interface RecordDB extends RecordBaseInput {
    id: string;
    table_id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}

export { RECORD_TABLE, RecordBaseInput, RecordDB };
