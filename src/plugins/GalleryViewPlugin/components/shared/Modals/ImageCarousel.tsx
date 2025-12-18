import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, File, FileText, FileSpreadsheet, Archive } from "lucide-react";

interface ImageCarouselProps {
  isOpen: boolean;
  onClose: () => void;
  images: any[];
  initialIndex?: number;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle ESC key to close carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const isImage = (file: any) => String(file?.mime_type || file?.type || '').startsWith('image/');

  const getFileIcon = (file: any, size: 'large' | 'small' = 'large') => {
    const mime: string = file?.mime_type || file?.type || '';
    const name: string = String(file?.name || file?.title || '').toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop() : '';

    const iconSize = size === 'large' ? 'w-16 h-16' : 'w-8 h-8';

    if (mime.startsWith('application/pdf') || ext === 'pdf') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card rounded">
          <img
            src="/assets/pdf.png"
            alt="PDF"
            className={`${iconSize} object-contain`}
          />
        </div>
      );
    }

    if (mime.includes('msword') || mime.includes('officedocument.word') || ext === 'doc' || ext === 'docx') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card rounded">
          <img
            src="/assets/docx.png"
            alt="DOC"
            className={`${iconSize} object-contain`}
          />
        </div>
      );
    }

    if (ext === 'zip' || ext === 'rar' || ext === '7z') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card rounded">
          <img
            src="/assets/zip.png"
            alt="ZIP"
            className={`${iconSize} object-contain`}
          />
        </div>
      );
    }

    if (ext === 'exe') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-card rounded">
          <img
            src="/assets/exe-file.png"
            alt="EXE"
            className={`${iconSize} object-contain`}
          />
        </div>
      );
    }

    // Default for other files
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded">
        <img
          src="/assets/txt.png"
          alt="FILE"
          className={`${iconSize} object-contain`}
        />
      </div>
    );
  };

  const getFilePreview = (file: any, size: 'large' | 'small' = 'large') => {
    const mime: string = file?.mime_type || file?.type || '';
    const name: string = String(file?.name || file?.title || '').toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop() : '';

    const iconSize = size === 'large' ? 'w-16 h-16' : 'w-8 h-8';

    if (mime.startsWith('application/pdf') || ext === 'pdf') {
      return (
       <iframe
          src={file?.url}
          title={file?.name || 'pdf'}
          className="w-full h-full rounded-none shadow-xl"
        />
      );
    }
    // Default for other files
    return getFileIcon(file, size);
  };

  const renderNonImagePreview = (file: any) => {
    return getFilePreview(file, 'large');
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };
  

  return createPortal(
    <div
      className="fixed inset-0 bg-[#1e1d1db8] backdrop-blur-sm transition-all duration-200 flex flex-col gap-3 items-center justify-between z-[9999]"
      onClick={onClose}
    >
      {/* Filename Header */}
      <div className=" text-[16px] text-primary font-medium mt-3">
        {currentImage?.name || "image.jpg"}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-5 w-8 h-8 flex items-center justify-center hover:scale-110 transition-all duration-200"
      >
        <X size={18} className="text-primary"/>
      </button>

      {/* Navigation */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrevious();
        }}
        className="absolute left-5 top-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-200"
      >
        <ChevronLeft size={64} className="text-primary" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="absolute right-5 top-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-200"
      >
        <ChevronRight size={64} className="text-primary" />
      </button>

      {/* Preview Container */}
      <div
        className="w-full max-w-screen-xl h-[80vh] flex items-center justify-center px-20 overflow-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage(currentImage) ? (
          <img
            src={currentImage?.url}
            alt={currentImage?.name}
            className="max-w-full max-h-full rounded-none shadow-xl object-contain"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
              filter: "contrast(1.1) saturate(0.9)",
            }}
          />
        ) : (
          renderNonImagePreview(currentImage)
        )}
      </div>


      {/* Thumbnails */}
      <div className="flex flex-col gap-2 px-2 justify-center items-center py-2 bg-transparent">
        
      {/* Zoom Controls */}
      <div className=" flex items-center justify-center w-fit gap-4 bg-white/70 dark:bg-[var(--color-gray-50)] backdrop-blur-sm rounded-full px-4 py-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(z - 25, 50));
          }}
          className="text-secondary hover:text-black"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-secondary text-sm">{zoom}%</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(z + 25, 300));
          }}
          className="text-secondary hover:text-black"
        >
          <ZoomIn size={18} />
        </button>
      </div>

          <div className="flex  gap-2 px-2 py-2 bg-transparent">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(i);
            }}
            className={`w-14 h-14 rounded overflow-hidden border ${
              i === currentIndex
                ? "border-black shadow-sm"
                : "border-gray-300 opacity-70 hover:opacity-100"
            } transition`}
          >
            {isImage(img) ? (
              <img
                src={img.thumbnail_url || img.url}
                alt={img.name}
                className="w-full h-full object-cover"
              />
            ) : (
              getFileIcon(img, 'small')
            )}
          </button>
        ))}
        </div>
      </div>
    </div>,
    document.body
  );
};