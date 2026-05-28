// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
type FilePreviewSize = "large" | "small";

const getFileMeta = (file: any) => {
  const mimeType: string = file?.mime_type || file?.type || "";
  const fileName: string = String(file?.name || file?.title || "").toLowerCase();
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";

  return { mimeType, ext };
};

const getIconSize = (size: FilePreviewSize) => (size === "large" ? "w-16 h-16" : "w-8 h-8");

export const renderFileIcon = (file: any, size: FilePreviewSize = "large") => {
  const { mimeType, ext } = getFileMeta(file);
  const iconSize = getIconSize(size);

  if (mimeType.startsWith("application/pdf") || ext === "pdf") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/pdf.png" alt="PDF" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (mimeType.includes("msword") || mimeType.includes("officedocument.word") || ext === "doc" || ext === "docx") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/docx.png" alt="DOC" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (mimeType.includes("excel") || mimeType.includes("spreadsheet") || ext === "xls" || ext === "xlsx") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/csv.png" alt="Excel" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (mimeType.includes("powerpoint") || mimeType.includes("presentation") || ext === "ppt" || ext === "pptx") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/ppt.png" alt="PPT" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (ext === "csv") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/csv.png" alt="CSV" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (ext === "txt") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/txt.png" alt="TXT" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (ext === "zip" || ext === "rar" || ext === "7z") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/zip.png" alt="ZIP" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (ext === "exe") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/exe-file.png" alt="EXE" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (mimeType.startsWith("audio/") || ["mp3", "wav", "flac", "aac", "mpeg"].includes(String(ext))) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/audio.png" alt="Audio" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (mimeType.startsWith("video/") || ["mp4", "avi", "mov", "wmv"].includes(String(ext))) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/video.png" alt="Video" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  if (ext === "tiff" || ext === "tif") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img src="/assets/tiff.png" alt="TIFF" className={`${iconSize} object-contain`} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-card rounded">
      <img src="/assets/file.png" alt="FILE" className={`${iconSize} object-contain`} />
    </div>
  );
};
