// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { AppWindow } from 'lucide-react';
import { ApplicationsModal } from './ApplicationsModal';

interface ApplicationsCardProps {
  disabled: boolean;
  hasWorkspace: boolean;
}

/** Home banner quick-action card that opens the Applications popup. */
export const ApplicationsCard: React.FC<ApplicationsCardProps> = ({ disabled, hasWorkspace }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`rounded-xl bg-card border p-5 flex items-start gap-3 transition-all duration-200 w-full sm:w-auto sm:min-w-[300px] max-w-[300px] text-left ${!disabled ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-60'
          }`}
      >
        <div className="w-12 h-12 p-3 rounded-xl bg-card border flex items-center justify-center">
          <AppWindow className="w-6 h-6 text-gray-900" />
        </div>
        <div>
          <div className="font-semibold text-md text-gray-900">Applications</div>
          <div className="text-[10px] text-gray-600">
            {hasWorkspace ? 'Give your own apps, websites and scripts an API to the bases you choose.' : 'Select a workspace first.'}
          </div>
        </div>
      </button>

      <ApplicationsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
