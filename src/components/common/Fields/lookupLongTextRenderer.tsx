// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, X } from 'lucide-react';

const stripHtml = (value: string): string => {
  if (!value) return '';
  const div = document.createElement('div');
  div.innerHTML = value;
  return div.textContent || div.innerText || '';
};

const normalizeLongTextItems = (items: any[]): string[] => {
  return items
    .map((item) => stripHtml(String(item ?? '')).trim())
    .filter((text) => text.length > 0);
};

const previewText = (value: string): string => {
  const single = value.replaceAll(/\s+/g, ' ');
  return single.length > 56 ? `${single.slice(0, 53)}...` : single;
};

export const LookupLongTextValue: React.FC<{ items: any[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const textItems = useMemo(() => normalizeLongTextItems(items), [items]);
  const preview = textItems.length > 0 ? previewText(textItems[0]) : '';

  if (!preview) return null;

  return (
    <>
      <div className="inline-flex items-center gap-1 max-w-full">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 max-w-64 rounded-full text-sm bg-background text-gray-700 border whitespace-nowrap">
          <span className="truncate max-w-[200px]" title={textItems[0]}>{preview}</span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="w-7 h-7 text-gray-400 flex items-center justify-center rounded-lg border shadow-xs hover:bg-gray-200 transition-all"
          aria-label="Expand long text"
          title="Expand long text"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <button type="button" className="absolute inset-0 backdrop-blur-sm bg-opacity-40" aria-label="Close modal" tabIndex={-1} onClick={() => setOpen(false)} />
          <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-4xl h-[80vh] p-5 flex flex-col z-10">
            <div className="flex items-center mb-3">
              <span className="text-lg font-medium text-primary">Long Text</span>
              <button onClick={() => setOpen(false)} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto min-h-[320px] bg-background border rounded-xl p-3 text-sm space-y-2">
              {textItems.map((text, index) => (
                <div key={`lookup-long-text-${index}`} //NOSONAR
                  className="px-3 py-2 border rounded-lg whitespace-pre-wrap break-words text-gray-700">
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

