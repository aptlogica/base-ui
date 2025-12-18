import React from 'react';
import {
  Type, FileText, Hash, DecimalsArrowRight, CheckSquare, DollarSign, Percent,
  Clock, Calendar1, Calendar, CalendarClock, Mail, Phone, Link2, List,
  Star, User, UserRoundPen, UserRound,
  Paperclip, TextSearch, Timer,
  LayoutList,
  Braces,
  Calculator,
} from 'lucide-react';

// Local icon component for 'links' using the public/assets/links.svg
const LinksSvgIcon: React.FC<{ className?: string }> = ({ className }) =>
  React.createElement('img', {
    src: '/assets/tableLinks.svg',
    alt: 'Links',
    className: `${className} invert-[0.5]`, //w-4 h-4 text-gray-400
  });

export const FIELD_TYPE_OPTIONS = [
  { value: 'singleLineText', label: 'Single Line text', icon: 'Type' },
  { value: 'longText', label: 'Long text', icon: 'AlignLeft' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'url', label: 'URL', icon: 'Link2' },
  { value: 'phone', label: 'Phone Number', icon: 'Phone' },
  { value: 'number', label: 'Number', icon: 'Hash' },
  { value: 'decimal', label: 'Decimal', icon: 'Percent' },
  { value: 'currency', label: 'Currency', icon: 'DollarSign' },
  { value: 'percent', label: 'Percent', icon: 'Percent' },
  { value: 'duration', label: 'Duration', icon: 'Timer' },
  { value: 'rating', label: 'Rating', icon: 'Star' },
  { value: 'date', label: 'Date', icon: 'Calendar' },
  { value: 'datetime', label: 'DateTime', icon: 'Clock' },
  { value: 'time', label: 'Time', icon: 'Clock' },
  { value: 'year', label: 'Year', icon: 'Calendar' },
  // { value: 'createdTime', label: 'Created Time', icon: 'Clock' },
  // { value: 'lastModifiedTime', label: 'Last Modified Time', icon: 'Clock' },
  { value: 'checkbox', label: 'Checkbox', icon: 'CheckSquare' },
  { value: 'singleSelect', label: 'Single Select', icon: 'List' },
  { value: 'multiSelect', label: 'Multi Select', icon: 'ListChecks' },
  { value: 'user', label: 'User', icon: 'User' },
  { value: 'createdBy', label: 'Created By', icon: 'UserPlus' },
  { value: 'lastModifiedBy', label: 'Last Modified By', icon: 'UserCheck' },
  { value: 'formula', label: 'Formula', icon: 'FunctionSquare' },
  { value: 'lookup', label: 'LookUp', icon: 'Search' },
  // { value: 'rollup', label: 'RollUp', icon: 'Sigma' },
  { value: 'links', label: 'Links', icon: 'Link2' },
  { value: 'attachment', label: 'Attachment', icon: 'Paperclip' },
  { value: 'json', label: 'JSON', icon: 'Code2' },
  // { value: 'geometry', label: 'Geometry', icon: 'Map' },
  // { value: 'barcode', label: 'Barcode', icon: 'ScanBarcode' },
  // { value: 'qrcode', label: 'QR Code', icon: 'QrCode' },
];

// Field type definitions with icons and metadata
// Note: button, formula, and uuid are hidden from user selection but kept for system/internal use
export const FIELD_TYPES = [
  { key: 'links', label: 'Links', icon: LinksSvgIcon },
  { key: 'lookup', label: 'Lookup', icon: TextSearch },
  { key: 'text', label: 'Single line text', icon: Type },
  { key: 'longText', label: 'Long text', icon: FileText },
  { key: 'number', label: 'Number', icon: Hash },
  { key: 'decimal', label: 'Decimal', icon: DecimalsArrowRight },
  { key: 'formula', label: 'Formula', icon: Calculator },
  { key: 'attachment', label: 'Attachment', icon: Paperclip },
  { key: 'boolean', label: 'Checkbox', icon: CheckSquare },
  { key: 'currency', label: 'Currency', icon: DollarSign },
  { key: 'percent', label: 'Percent', icon: Percent },
  { key: 'duration', label: 'Duration', icon: Timer },
  { key: 'year', label: 'Year', icon: Calendar1 },
  { key: 'date', label: 'Date', icon: Calendar },
  { key: 'datetime', label: 'DateTime', icon: CalendarClock },
  { key: 'time', label: 'Time', icon: Clock },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'phoneNumber', label: 'Phone number', icon: Phone },
  { key: 'url', label: 'URL', icon: Link2 },
  { key: 'select', label: 'Single select', icon: List },
  { key: 'multiSelect', label: 'Multi select', icon: LayoutList },
  { key: 'rating', label: 'Rating', icon: Star },
  { key: 'user', label: 'User', icon: User },
  // { key: 'button', label: 'Button', icon: Plus },
  { key: 'json', label: 'JSON', icon: Braces },
  { key: 'uuid', label: 'UUID', icon: Hash, hidden: true },
  // { key: 'createdTime', label: 'Created Time', icon: ClockArrowUpIcon },
  // { key: 'lastModifiedTime', label: 'Last Modified Time', icon: ClockArrowDownIcon },
  { key: 'createdBy', label: 'Created By', icon: UserRound },
  { key: 'lastModifiedBy', label: 'Last Modified By', icon: UserRoundPen },
];

// Field type enum for type safety
export enum FieldType {
  Text = 'text',
  LongText = 'longText',
  Number = 'number',
  Decimal = 'decimal',
  Boolean = 'boolean',
  Currency = 'currency',
  Percent = 'percent',
  Duration = 'duration',
  Year = 'year',
  Date = 'date',
  DateTime = 'datetime',
  Time = 'time',
  Email = 'email',
  PhoneNumber = 'phoneNumber',
  URL = 'url',
  Select = 'select',
  MultiSelect = 'multiSelect',
  Rating = 'rating',
  User = 'user',
  Button = 'button',
  JSON = 'json',
  UUID = 'uuid',
  Attachment = 'attachment',
  Links = 'links',
  Lookup = 'lookup',
  CreatedTime = 'createdTime',
  LastModifiedTime = 'lastModifiedTime',
  CreatedBy = 'createdBy',
  LastModifiedBy = 'lastModifiedBy',
  Formula = 'formula',
}


// Helper function to get field type info
export const getFieldTypeInfo = (type: string) => {
  return FIELD_TYPES.find(ft => ft.key === type) || FIELD_TYPES[0];
};

// Helper function to get field type icon
export const getFieldTypeIcon = (type: string) => {
  const fieldType = getFieldTypeInfo(type);
  return fieldType.icon;
};

// Helper function to get field type icon component with consistent styling
export const getFieldTypeIconComponent = (type: string, className: string = "w-4 h-4 text-gray-400") => {
  const fieldType = getFieldTypeInfo(type);
  const IconComponent = fieldType.icon;
  return IconComponent ? React.createElement(IconComponent, { className }) : null;
};

// Helper function to get field type icon component with margin
export const getFieldTypeIconWithMargin = (type: string) => {
  return getFieldTypeIconComponent(type, "w-4 h-4 mr-2 text-gray-400");
};

// Helper function to check if field type exists
export const isValidFieldType = (type: string): boolean => {
  return FIELD_TYPES.some(ft => ft.key === type) || FIELD_TYPE_OPTIONS.some(fo => fo.value === type);
};

// Helper function to get field type label
export const getFieldTypeLabel = (type: string): string => {
  const fieldType = getFieldTypeInfo(type);
  return fieldType.label;
};

// Helper to map between different field type naming conventions
export const normalizeFieldType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'singleLineText': 'text',
    'longText': 'longText',
    'singleSelect': 'select',
    'multiSelect': 'multiSelect',
    'phoneNumber': 'phone',
    'boolean': 'checkbox',
  };

  return typeMap[type] || type;
};
