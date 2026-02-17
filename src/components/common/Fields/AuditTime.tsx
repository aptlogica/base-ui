import React from 'react';
import { DateTime } from './DateTime';

interface AuditTimeProps {
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

export const AuditTime: React.FC<AuditTimeProps> = (props) => {
  return <DateTime {...props} />;
};
