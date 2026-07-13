// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

const triggerAnchorDownload = (link: HTMLAnchorElement): void => {
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadTextContent = (textContent: string, fileName: string): void => {
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  triggerAnchorDownload(link);
  URL.revokeObjectURL(blobUrl);
};

export const downloadLinkedFile = (filePath: string): void => {
  const link = document.createElement('a');
  link.href = filePath;
  link.download = filePath.split('/').pop() || 'import_error_rows.txt';
  link.rel = 'noopener noreferrer';
  triggerAnchorDownload(link);
};
