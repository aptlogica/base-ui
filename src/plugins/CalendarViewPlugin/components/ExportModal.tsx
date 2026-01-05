import React, { useEffect } from "react";
import { X } from "lucide-react";
import { CalendarEvent } from "../hooks/useCalendarData";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  dateField?: any;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  events,
  dateField,
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

  const exportToJSON = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `calendar-events-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    onClose();
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Title', 'Date', 'Time', 'Description'],
      ...events.map(event => [
        event.title,
        event.date,
        event.dateTime.toLocaleTimeString(),
        event.data?.description || ''
      ])
    ].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

    const exportFileDefaultName = `calendar-events-${new Date().toISOString().split('T')[0]}.csv`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    onClose();
  };

  const exportToExcel = () => {
    // Create CSV content (Excel can open CSV files)
    const csvContent = [
      ['Title', 'Date', 'Time', 'Description'],
      ...events.map(event => [
        event.title,
        event.date,
        event.dateTime.toLocaleTimeString(),
        event.data?.description || ''
      ])
    ].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');

    // Use Excel MIME type and .xlsx extension (though it's actually CSV)
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

    const exportFileDefaultName = `calendar-events-${new Date().toISOString().split('T')[0]}.xlsx`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    onClose();
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
    <div className="bg-modal-backdrop" onClick={onClose}>
      <div
        className="bg-modal rounded-xl shadow-2xl p-6 w-full !max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
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
            {events.length} event{events.length !== 1 ? 's' : ''} available for export
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;