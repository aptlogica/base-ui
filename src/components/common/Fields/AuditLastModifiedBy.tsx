// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
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
