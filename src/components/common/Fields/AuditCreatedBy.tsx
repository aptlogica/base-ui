import React from "react";
import { AuditUser } from './AuditUser';

interface AuditCreatedByProps {
  placeholder?: string;
}

export const AuditCreatedBy: React.FC<AuditCreatedByProps> = ({
  placeholder = "Created by...",
}) => {
  return <AuditUser placeholder={placeholder} />;
};
