// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type RecordNavButtonsProps = {
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
    disabled?: boolean;
    showSeparator?: boolean;
};

const navButtonClass = 'inline-flex items-center justify-center p-2 text-sm rounded-lg border bg-card text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card';

// Previous / Next buttons shown in the record form header, to step through the table's records
export const RecordNavButtons: React.FC<RecordNavButtonsProps> = ({ onPrevious, onNext, hasPrevious = false, hasNext = false, disabled = false, showSeparator = false }) => {
    if (!onPrevious && !onNext) return null;
    return (
        <>
            <button
                type="button"
                className={navButtonClass}
                disabled={disabled || !hasPrevious || !onPrevious}
                onClick={() => onPrevious?.()}
                aria-label="Previous record"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <button
                type="button"
                className={navButtonClass}
                disabled={disabled || !hasNext || !onNext}
                onClick={() => onNext?.()}
                aria-label="Next record"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
            {showSeparator && <span className="w-px h-6 bg-gray-300 mx-1" aria-hidden="true" data-testid="record-nav-separator" />}
        </>
    );
};

export default RecordNavButtons;
