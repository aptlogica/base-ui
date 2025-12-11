  
export interface FieldBaseInput {
    name: string;
    type: FieldType;
    config: FieldConfig;
    position: number;
    required: boolean;
    unique: boolean;
    description?: string;
  }
  
export interface FieldDB extends FieldBaseInput {
    id: string; // UUID
    table_id: string; // UUID
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    is_hidden?: boolean;
  }

export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'year'
  | 'currency'
  | 'percent'
  | 'duration'
  | 'decimal'
  | 'longText'
  | 'email'
  | 'url'
  | 'phoneNumber'
  | 'select'
  | 'multiSelect'
  | 'user'
  | 'button'
  | 'rating'
  | 'attachment'
  | 'json'
  | 'createdTime'
  | 'lastModifiedTime'
  | 'createdBy'
  | 'lastModifiedBy';

// Base config interface
interface BaseFieldConfig {
    defaultValue?: string | number | boolean | string[] | null;
  description?: string;
  [key: string]: any;
}

// Text field config
interface TextFieldConfig extends BaseFieldConfig {
    placeholder?: string;
  maxLength?: number;
}

// Number field config
interface NumberFieldConfig extends BaseFieldConfig {
  showThousands?: boolean;
}

// Decimal field config
interface DecimalFieldConfig extends BaseFieldConfig {
  precision?: number;
  showThousands?: boolean;
}

// Currency field config
interface CurrencyFieldConfig extends BaseFieldConfig {
  currencyType?: string;
  currencyLocale?: string; // Locale for number formatting (e.g., 'en-US', 'de-DE', 'fr-FR')
  precision?: number;
}

// Percent field config
interface PercentFieldConfig extends BaseFieldConfig {
  displayAsProgress?: boolean;
  progressColor?: string;
}

// Duration field config
interface DurationFieldConfig extends BaseFieldConfig {
  durationFormat?: 'h:mm' | 'h:mm:ss' | 'h:mm:ss.s' | 'h:mm:ss.ss' | 'h:mm:ss.sss' | 'd:h:mm';
}

// Date field config
interface DateFieldConfig extends BaseFieldConfig {
  dateFormat?: string;
  min?: string;
  max?: string;
}

// DateTime field config
interface DateTimeFieldConfig extends BaseFieldConfig {
  dateFormat?: string;
  timeFormat?: string;
  hourFormat?: '12' | '24';
  displayTimeZone?: boolean;
  sameTimezone?: boolean;
}

// Time field config
interface TimeFieldConfig extends BaseFieldConfig {
  hourFormat?: '12' | '24';
  timeFormat?: string;
}

// Year field config
interface YearFieldConfig extends BaseFieldConfig {
  // No specific config needed for year
}

// Email field config
interface EmailFieldConfig extends BaseFieldConfig {
  emailValid?: boolean;
}

// URL field config
interface URLFieldConfig extends BaseFieldConfig {
  urlValid?: boolean;
  showIcon?: boolean;
  openInNewTab?: boolean;
}

// Phone field config
interface PhoneFieldConfig extends BaseFieldConfig {
  phoneValid?: boolean;
  countryCode?: string;
  formatDisplay?: boolean;
}

// Select field config
interface SelectFieldConfig extends BaseFieldConfig {
  options?: string[];
  allowCustom?: boolean;
}

// MultiSelect field config
interface MultiSelectFieldConfig extends BaseFieldConfig {
  options?: string[];
  maxSelections?: number;
}

// User field config
interface UserFieldConfig extends BaseFieldConfig {
  allowMultiple?: boolean;
  showAvatar?: boolean;
  defaultUser?: string;
}

// Button field config
interface ButtonFieldConfig extends BaseFieldConfig {
  buttonText?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning';
  action?: string;
}

// Rating field config
interface RatingFieldConfig extends BaseFieldConfig {
  ratingMax?: number;
  ratingIcon?: string;
  ratingColor?: string;
  allowHalf?: boolean;
}

// Attachment field config
interface AttachmentFieldConfig extends BaseFieldConfig {
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}

// JSON field config
interface JSONFieldConfig extends BaseFieldConfig {
  prettyPrint?: boolean;
  collapsible?: boolean;
}

// Checkbox field config
interface CheckboxFieldConfig extends BaseFieldConfig {
  checkboxIcon?: string;
  checkboxColor?: string;
}

// Audit field configs (no specific config needed)
interface AuditFieldConfig extends BaseFieldConfig {
  // No specific config needed for audit fields
}

// Union type for all field configs
export type FieldConfig = 
  | TextFieldConfig
  | NumberFieldConfig
  | DecimalFieldConfig
  | CurrencyFieldConfig
  | PercentFieldConfig
  | DurationFieldConfig
  | DateFieldConfig
  | DateTimeFieldConfig
  | TimeFieldConfig
  | YearFieldConfig
  | EmailFieldConfig
  | URLFieldConfig
  | PhoneFieldConfig
  | SelectFieldConfig
  | MultiSelectFieldConfig
  | UserFieldConfig
  | ButtonFieldConfig
  | RatingFieldConfig
  | AttachmentFieldConfig
  | JSONFieldConfig
  | CheckboxFieldConfig
  | AuditFieldConfig;  