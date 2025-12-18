import { FieldBaseInput, FieldDB } from "./field.interface";
import { ViewDB } from "./view.interface";


export interface TableBaseInput {
    name: string;
    description: string;
    color: string;
    icon: string;
    position: number;
    fields?: FieldBaseInput[];
}

export interface TableDB extends TableBaseInput {
    id: string; // UUID
    base_id: string; // UUID
    created_at: string; // ISO datetime string
    updated_at: string;
    deleted_at: string | null;
    rows?: {[key: string]: any}[];
    fields?: FieldDB[];
    views?: ViewDB[];
  }
  