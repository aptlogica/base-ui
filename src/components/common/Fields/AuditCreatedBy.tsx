// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from "react";
import { AuditUser } from './AuditUser';

interface AuditCreatedByProps {
  placeholder?: string;
  /** Id of the user stored in the record */
  value?: unknown;
}

export const AuditCreatedBy: React.FC<AuditCreatedByProps> = ({
  placeholder = "Created by...",
  value,
}) => {
  return <AuditUser placeholder={placeholder} value={value} />;
};
