// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FieldType {
    key: string;
    label: string;
    icon: any;
    isSystem?: boolean;
}

export function FieldTypeDropdown({ selectedType, setSelectedType, fieldTypes, disabled = false }: Readonly<{
    selectedType: FieldType | null;
    setSelectedType: (type: FieldType) => void;
    fieldTypes: FieldType[];
    disabled?: boolean;
}>) {
    const [open, setOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="mb-3 relative" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                className={`w-full flex items-center gap-2 px-3 py-2 border rounded-xl text-sm focus:outline-none ${disabled
                    ? 'btn-disabled'
                    : 'bg-[var(--color-alpha-white)] text-[var(--text-color-primary)] focus:ring-1 focus:ring-[var(--ring-color-brand)]'
                    }`}
                onClick={() => !disabled && setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="mr-2">
                    {(() => {
                        const IconComponent = selectedType?.icon;
                        return IconComponent ? <IconComponent className="w-4 h-4 text-gray-400" /> : null;
                    })()}
                </span>
                <span className="flex-1 text-left">{selectedType?.label}</span>
                {open ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
            </button>
            {open && !disabled && (
                <div className="absolute z-50 mt-1 left-0 p-2 space-y-1 w-full bg-[var(--color-alpha-white)] text-[var(--text-color-tertiary)] border rounded-xl shadow-lg max-h-72 overflow-y-auto transition-all ease">
                    {fieldTypes.map((type) => (
                        <button
                            key={type.key}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-brand-primary)] hover:text-black rounded-xl ${selectedType?.key === type.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold ' : ''}`}
                            onClick={() => {
                                setSelectedType(type);
                                setOpen(false);
                            }}
                            type="button"
                        >
                            <span className="mr-2">
                                {(() => {
                                    const IconComponent = type.icon;
                                    return <IconComponent className="w-4 h-4 text-gray-400" />;
                                })()}
                            </span>
                            <span>{type.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 