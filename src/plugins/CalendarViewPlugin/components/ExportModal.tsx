// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { CalendarEvent } from "../hooks/useCalendarData";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  events,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  if (!isOpen) return null;

  const downloadFile = (
    data: string,
    mimeType: string,
    extension: string
  ) => {
    const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(data)}`;
    const fileName = `calendar-events-${new Date().toISOString().split('T')[0]}.${extension}`;

    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    link.click();

    onClose();
  };

  const generateCSV = () =>
    [
      ['Title', 'Date', 'Time', 'Description'],
      ...events.map(event => [
        event.title,
        event.date,
        event.dateTime.toLocaleTimeString(),
        event.data?.description || ''
      ])
    ]
      .map(row =>
        row.map(field => `"${String(field).replaceAll('"', '""')}"`).join(',')
      )
      .join('\n');


  const exportToJSON = () => {
    downloadFile(
      JSON.stringify(events, null, 2),
      'application/json',
      'json'
    );
  };

  const exportToCSV = () => {
    downloadFile(
      generateCSV(),
      'text/csv',
      'csv'
    );
  };

  const exportToExcel = () => {
    // Still CSV, but named for Excel
    downloadFile(
      generateCSV(),
      'text/csv',
      'xlsx'
    );
  };

  const exportOptions = [
    {
      id: 'json',
      label: 'JSON',
      description: 'Structured data format',
      iconPath: '/assets/json.png',
      onClick: exportToJSON,
    },
    {
      id: 'csv',
      label: 'CSV',
      description: 'Comma-separated values',
      iconPath: '/assets/csv.png',
      onClick: exportToCSV,
    },
    {
      id: 'excel',
      label: 'Excel',
      description: 'Spreadsheet format',
      iconPath: '/assets/excel.png',
      onClick: exportToExcel,
    },
  ];

  return (
    <div //NOSONAR
    className="bg-modal-backdrop" onClick={onClose}>
      <div //NOSONAR
        className="bg-modal rounded-xl shadow-2xl p-6 w-full !max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();   // prevent page scroll on Space
            e.stopPropagation();
          }
        }}  
      >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-primary">
            Export Calendar
          </h2>
          <p className="text-sm text-primary mt-1">
            Choose a format to export your events
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-primary" />
        </button>
      </div>

      {/* Content */}
      <div className="bg-modal-content">
        <div className="grid grid-cols-3 gap-3">
          {exportOptions.map((option) => {
            return (
              <button
                key={option.id}
                onClick={option.onClick}
                className="group relative flex flex-col items-center justify-center p-5 rounded-xl border hover:border-[var(--color-bg-brand-primary)] transition-all hover:shadow-md bg-card"
              >
                <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center mb-3 group-hover:scale-110 transition-transform p-2">
                  <img
                    src={option.iconPath}
                    alt={option.label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="font-semibold text-primary mb-1">
                  {option.label}
                </div>
                <div className="text-xs text-primary text-center">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t flex-shrink-0">
        <div className="text-sm text-primary text-center">
          {events.length} event{events.length === 1 ? '' : 's'} available for export
        </div>
      </div>
    </div>
    </div >
  );
};

export default ExportModal;