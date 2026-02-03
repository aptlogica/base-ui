import React from 'react';
import {
  Type, FileText, Hash, DecimalsArrowRight, CheckSquare, DollarSign, Percent,
  Clock, Calendar1, Calendar, CalendarClock, Mail, Phone, Link2, List,
  Star, User, Paperclip, TextSearch, Timer,
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
  { key: 'json', label: 'JSON', icon: Braces },
  // { key: 'createdTime', label: 'Created Time', icon: ClockArrowUpIcon },
  // { key: 'lastModifiedTime', label: 'Last Modified Time', icon: ClockArrowDownIcon },
  // { key: 'createdBy', label: 'Created By', icon: UserRound },
  // { key: 'lastModifiedBy', label: 'Last Modified By', icon: UserRoundPen },
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
  Attachment = 'attachment',
  Links = 'links',
  Lookup = 'lookup',
  // CreatedTime = 'createdTime',
  // LastModifiedTime = 'lastModifiedTime',
  // CreatedBy = 'createdBy',
  // LastModifiedBy = 'lastModifiedBy',
  Formula = 'formula',
}


// Helper function to get field type info
export const getFieldTypeInfo = (type: string) => {
  return FIELD_TYPES.find(ft => ft.key === type) || FIELD_TYPES[0];
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
