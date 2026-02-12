import React from "react";
import { AuditUser } from './AuditUser';

interface AuditLastModifiedByProps {
  placeholder?: string;
}

export const AuditLastModifiedBy: React.FC<AuditLastModifiedByProps> = ({
  placeholder = "Last Modified by...",
}) => {
  return <AuditUser placeholder={placeholder} />;
};
