import React from 'react';
import { DateTime } from './DateTime';

interface AuditLastModifiedTimeProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  readOnly?: boolean;
  helperText?: string;
  icon?: string;
  config?: {
    dateFormat?: string;
    timeFormat?: string;
    hourFormat?: '12' | '24';
    timeZone?: string;
    displayTimeZone?: boolean;
    sameTimezone?: boolean;
    defaultValue?: string;
    [key: string]: any;
  };
}

export const AuditLastModifiedTime: React.FC<AuditLastModifiedTimeProps> = (props) => {
  return <DateTime {...props} />;
};
