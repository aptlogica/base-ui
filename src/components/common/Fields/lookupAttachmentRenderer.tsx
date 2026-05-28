// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Maximize2, X } from 'lucide-react';

export interface LookupAttachmentItem {
  name: string;
  url?: string;
  mimeType?: string;
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']);

const getFileExtension = (filename: string): string => {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return '';
  return filename.slice(dot + 1).toLowerCase();
};

const isImageAttachment = (attachment: LookupAttachmentItem): boolean => {
  if (attachment.mimeType?.toLowerCase().startsWith('image/')) return true;
  const ext = getFileExtension(attachment.name);
  return IMAGE_EXTENSIONS.has(ext);
};

const getFileTypeAsset = (attachment: LookupAttachmentItem): string => {
  const mimeType = (attachment.mimeType || '').toLowerCase();
  const ext = getFileExtension(attachment.name);

  if (mimeType.startsWith('application/pdf') || ext === 'pdf') return '/assets/pdf.png';
  if (mimeType.includes('msword') || mimeType.includes('officedocument.word') || ext === 'doc' || ext === 'docx') return '/assets/docx.png';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || ext === 'xls' || ext === 'xlsx' || ext === 'csv') return '/assets/csv.png';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation') || ext === 'ppt' || ext === 'pptx') return '/assets/ppt.png';
  if (ext === 'txt') return '/assets/txt.png';
  if (ext === 'zip' || ext === 'rar' || ext === '7z') return '/assets/zip.png';
  if (ext === 'exe') return '/assets/exe-file.png';
  if (mimeType.startsWith('audio/') || ext === 'mp3' || ext === 'wav' || ext === 'flac' || ext === 'aac') return '/assets/audio.png';
  if (mimeType.startsWith('video/') || ext === 'mp4' || ext === 'avi' || ext === 'mov' || ext === 'wmv') return '/assets/video.png';
  if (ext === 'tiff' || ext === 'tif') return '/assets/tiff.png';

  return '/assets/file.png';
};

export const extractAttachmentItems = (items: any[]): LookupAttachmentItem[] => {
  const result: LookupAttachmentItem[] = [];

  items.forEach((item) => {
    const attachments = Array.isArray(item) ? item : [item];
    attachments.forEach((file: any) => {
      if (!file || typeof file !== 'object') return;
      const name = file.title || file.name || file.file_name || 'Attachment';
      const url = file.url || file.signed_url || file.file_url || file.path || file.preview_url;
      const mimeType = file.mimetype || file.mime_type || file.type;
      result.push({
        name: String(name),
        url: url ? String(url) : undefined,
        mimeType: mimeType ? String(mimeType) : undefined
      });
    });
  });

  return result;
};

export const LookupAttachmentValue: React.FC<{ items: any[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const attachments = useMemo(() => extractAttachmentItems(items), [items]);

  if (attachments.length === 0) return null;

  const visibleAttachments = attachments.slice(0, 4);
  const remaining = attachments.length - visibleAttachments.length;

  return (
    <>
      <div className="inline-flex items-center justify-between gap-1 max-w-full overflow-hidden w-full">
        <div className="flex items-center gap-1 min-h-8 overflow-hidden">
          {visibleAttachments.map((file, index) => {
            const image = isImageAttachment(file);
            return (
              <div
                className="w-8 h-8 rounded-lg bg-card border flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-[var(--color-brand-600)] focus:outline-none flex-shrink-0"
                key={`att-chip-${index}-${file.name}`}
                title={file.name}
                style={{ minWidth: '28px', minHeight: '28px' }}
              >
                {image && file.url ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-contain" />
                ) : (
                  <img
                    src={getFileTypeAsset(file)}
                    alt={file?.name ?? 'file'}
                    className="w-5 h-5 object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 z-10">
          {remaining > 0 ? (
            <span className="w-7 h-7 text-gray-400 flex items-center justify-center rounded-lg border transition-all disabled:opacity-50 text-xs">
              +{remaining}
            </span>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            className="w-7 h-7 text-gray-400 flex items-center justify-center rounded-lg border shadow-xs hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Expand attachments"
            title="Expand attachments"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div >
      </div >
      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <button type="button" className="absolute inset-0 backdrop-blur-sm bg-opacity-40" aria-label="Close modal" tabIndex={-1} onClick={() => setOpen(false)} />
          <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-5xl h-[85vh] p-5 flex flex-col z-10">
            <div className="flex items-center mb-3">
              <span className="text-lg font-medium text-primary">Attachments</span>
              <button onClick={() => setOpen(false)} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto min-h-[360px] bg-background rounded-xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {attachments.map((file, index) => {
                  const image = isImageAttachment(file);
                  return (
                    <div key={`modal-att-${index}-${file.name}`} className="relative bg-card border rounded-xl p-2 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex aspect-square mb-3 rounded-xl items-center justify-center overflow-hidden bg-gray-50">
                        {image && file.url ? (
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={getFileTypeAsset(file)}
                            alt={file?.name ?? 'file'}
                            className="w-16 h-16 object-cover transition-transform duration-200"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                      <div className="px-2 py-2 flex items-center justify-between gap-1">
                        <span className="text-xs text-gray-700 truncate" title={file.name}>{file.name}</span>
                        {file.url ? (
                          <a href={file.url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-700" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
      }
    </>
  );
};
