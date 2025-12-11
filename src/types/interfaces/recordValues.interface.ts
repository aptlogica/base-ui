const RECORD_VALUES_TABLE = "record_values";


interface RecordValuesBaseInput {
    value: string;
}


interface RecordValuesDB extends RecordValuesBaseInput {
    id: string;
    record_id: string;
    field_id: string;
    created_at: Date;
    updated_at: Date;
}

export { RECORD_VALUES_TABLE, RecordValuesBaseInput, RecordValuesDB };