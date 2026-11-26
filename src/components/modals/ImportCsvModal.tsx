// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useState } from 'react';
import { ImportModal } from './ImportModal';
import { ImportSbaseModal } from './ImportSbaseModal';
import type { ExistingItem } from '../../utils/nameValidation';
import { CsvModeRadio, type CsvImportMode } from './importer/CsvModeRadio';


interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  existingBases?: ExistingItem[];
  existingTables?: any[];
  /** Single: called when the table was imported */
  onSuccess?: () => void;
  /** Multiple: called once the new base exists */
  onImported: (job: any) => void;
}

/**
 * The one CSV import. A radio picks the flow and the matching existing popup is shown below it:
 *  - single (default): ImportModal, the table import API
 *  - multiple: ImportSbaseModal (format csv), the background import job API
 * The radio itself calls no API.
 */
export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ isOpen, onClose, workspaceId, existingBases, existingTables, onSuccess, onImported }) => {
  const [mode, setMode] = useState<CsvImportMode>('single');

  useEffect(() => {
    if (isOpen) setMode('single');
  }, [isOpen]);

  if (!isOpen) return null;
  const switcher = <CsvModeRadio value={mode} onChange={setMode} />;

  return mode === 'single' ? (
    <ImportModal
      isOpen
      onClose={onClose}
      onSuccess={onSuccess}
      importType="csv"
      workspaceId={workspaceId}
      existingTables={existingTables}
      modeSwitcher={switcher}
    />
  ) : (
    <ImportSbaseModal
      isOpen
      format="csv"
      workspaceId={workspaceId}
      existingBases={existingBases}
      onClose={onClose}
      onImported={onImported}
      modeSwitcher={switcher}
    />
  );
};
