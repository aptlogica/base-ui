// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useCallback, useState } from 'react';
import { useAddImage } from '../../../../hooks/useApi';
import { useToast } from '../../../../components/common/Toast';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// The upload API has returned the hosted URL in several shapes over time
export const extractImageUrl = (response: any): string => {
  const data = response?.data;
  if (typeof data === 'string') return data;
  const candidate = data?.data?.url ?? data?.url ?? data?.data?.[0]?.url ?? data?.[0]?.url ?? data?.data?.[0];
  return typeof candidate === 'string' ? candidate : '';
};

export const getImageFileError = (file: File): { title: string; message: string } | null => {
  if (!file.type.startsWith('image/')) {
    return { title: 'Invalid File Type', message: 'Please select an image file' };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { title: 'File Too Large', message: 'File size must be less than 5MB' };
  }
  return null;
};

export const BANNER_MAX_WIDTH = 800;
export const BANNER_MAX_HEIGHT = 400;

// Resolves with the natural size of the image at src, rejecting if it cannot be loaded
export const loadImageDimensions = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = src;
  });

export const getBannerDimensionError = ({ width, height }: { width: number; height: number }): string | null => {
  if (width <= BANNER_MAX_WIDTH && height <= BANNER_MAX_HEIGHT) return null;
  return `Image is ${width} × ${height}px. Banner images must be at most ${BANNER_MAX_WIDTH} × ${BANNER_MAX_HEIGHT}px.`;
};

// Uploads an image file and returns its hosted URL via onUploaded
export const useImageUpload = (onUploaded: (url: string) => void, successMessage?: string) => {
  const addImageMutation = useAddImage();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (file?: File | null) => {
    if (!file) return;
    const fileError = getImageFileError(file);
    if (fileError) {
      toast.error(fileError.message, { title: fileError.title });
      return;
    }

    setUploading(true);
    try {
      const url = extractImageUrl(await addImageMutation.mutateAsync({ files: [file] }));
      if (!url) {
        toast.error('Failed to get image URL from response', { title: 'Upload Failed' });
        return;
      }
      onUploaded(url);
      if (successMessage) {
        toast.success(successMessage, { title: 'Success' });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload image. Please try again.', { title: 'Upload Failed' });
    } finally {
      setUploading(false);
    }
  }, [addImageMutation, toast, onUploaded, successMessage]);

  return { upload, uploading };
};
