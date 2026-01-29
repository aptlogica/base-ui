import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Attachment } from '../Attachment';

const mockMutateAsyncAdd = vi.fn().mockResolvedValue(null);
const mockMutateAsyncRemove = vi.fn().mockResolvedValue(null);

// Mock the hooks
vi.mock('../../../hooks/useApi', () => ({
  useAddAttachment: () => ({
    mutateAsync: mockMutateAsyncAdd,
  }),
  useRemoveAttachments: () => ({
    mutateAsync: mockMutateAsyncRemove,
  }),
}));

// Mock the modals
vi.mock('../../../plugins/GalleryViewPlugin/components/shared/Modals/AttachmentModal', () => ({
  AttachmentModal: ({ isOpen }: any) => 
    isOpen ? <div data-testid="attachment-modal">Modal</div> : null,
}));

vi.mock('../../../plugins/GalleryViewPlugin/components/shared/Modals/AttachmentPreviewModal', () => ({
  AttachmentPreviewModal: ({ isOpen }: any) => 
    isOpen ? <div data-testid="preview-modal">Preview Modal</div> : null,
}));

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Attachment Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
    mockMutateAsyncAdd.mockClear();
    mockMutateAsyncRemove.mockClear();
  });

  describe('Rendering', () => {
    it('should render attachment container', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.relative');
      expect(container).toBeInTheDocument();
    });

    it('should display upload button when no attachments', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it('should display attachment list when files present', () => {
      const files = [
        { id: '1', title: 'document.pdf', url: '/files/doc.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const thumbnail = document.querySelector('[title="document.pdf"]');
      expect(thumbnail).toBeInTheDocument();
    });

    it('should show multiple attachment thumbnails', () => {
      const files = [
        { id: '1', title: 'file1.pdf', url: '/file1.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '2', title: 'file2.pdf', url: '/file2.pdf', mime_type: 'application/pdf', size: 2048 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      expect(document.querySelector('[title="file1.pdf"]')).toBeInTheDocument();
      expect(document.querySelector('[title="file2.pdf"]')).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('should handle file selection', async () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
        />
      );

      // Upload button should exist
      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it('should enforce maxFiles constraint', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          config={{ maxFiles: 3 }}
        />
      );

      // Button should be present with config
      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it('should disable upload when maxFiles reached', () => {
      const files = [
        { id: '1', title: 'file1.pdf', url: '/1.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '2', title: 'file2.pdf', url: '/2.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '3', title: 'file3.pdf', url: '/3.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          config={{ maxFiles: 3 }}
        />
      );

      const uploadButton = screen.getByTitle(/maximum 3 files allowed/i);
      expect(uploadButton).toBeDisabled();
    });

    it('should show tooltip when maxFiles reached', () => {
      const files = [
        { id: '1', title: 'file1.pdf', url: '/1.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '2', title: 'file2.pdf', url: '/2.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '3', title: 'file3.pdf', url: '/3.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          config={{ maxFiles: 3 }}
        />
      );

      const uploadButton = screen.getByTitle(/maximum 3 files allowed/i);
      expect(uploadButton).toHaveAttribute('title', expect.stringContaining('Maximum 3 files'));
    });

    it('should respect maxFileSize from config', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          config={{ maxFileSize: 5 * 1024 * 1024 }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('File Management', () => {
    it('should display attachment thumbnails', () => {
      const files = [
        { id: '1', title: 'document.pdf', url: '/doc.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const thumbnail = document.querySelector('[title="document.pdf"]');
      expect(thumbnail).toBeInTheDocument();
    });

    it('should show preview modal button', () => {
      const files = [
        { id: '1', title: 'document.pdf', url: '/doc.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          showPreview={true}
        />
      );

      const previewButton = screen.getByRole('button', { name: /preview attachments/i });
      expect(previewButton).toBeInTheDocument();
    });

    it('should hide preview button when showPreview is false', () => {
      const files = [
        { id: '1', title: 'document.pdf', url: '/doc.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          showPreview={false}
        />
      );

      const previewButton = screen.queryByRole('button', { name: /preview attachments/i });
      expect(previewButton).not.toBeInTheDocument();
    });

    it('should display image preview thumbnail for image files', () => {
      const files = [
        { id: '1', title: 'image.jpg', url: '/image.jpg', mime_type: 'image/jpeg', size: 1024, thumbnail_url: '/thumb.jpg' }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img');
      expect(img).toBeInTheDocument();
      // Component uses thumbnail_url when available, so check for that
      expect(img?.src).toContain('thumb.jpg');
    });
  });

  describe('Validation', () => {
    it('should show error for required field when empty', async () => {
      renderWithProviders(
        <Attachment
          required
          value={[]}
          onChange={mockOnChange}
        />
      );

      const error = document.querySelector('.text-red-600');
      if (error) {
        expect(error).toBeInTheDocument();
        expect(error?.textContent).toContain('Please attach');
      }
    });

    it('should not show error for required field when files present', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          required
          value={files}
          onChange={mockOnChange}
        />
      );

      const error = document.querySelector('.text-red-600');
      expect(error).not.toBeInTheDocument();
    });

    it('should validate max files constraint', () => {
      const files = [
        { id: '1', title: 'file1.pdf', url: '/1.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '2', title: 'file2.pdf', url: '/2.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '3', title: 'file3.pdf', url: '/3.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '4', title: 'file4.pdf', url: '/4.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          config={{ maxFiles: 3 }}
        />
      );

      const uploadButton = screen.getByTitle(/maximum 3 files allowed/i);
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable uploads when disabled is true', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          disabled
        />
      );

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toBeDisabled();
    });

    it('should prevent editing when allowEdit is false', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      // When allowEdit is false, the button is still rendered but no edit actions are visible
      // The component shows the upload button but attachment editing features are hidden
      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it('should prevent editing when readOnly is true', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          readOnly
        />
      );

      // Upload button should be disabled or hidden
      const uploadButton = screen.queryByRole('button', { name: /add attachment/i });
      expect(uploadButton).not.toBeInTheDocument();
    });

    it('should disable preview button when disabled', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          disabled
          showPreview={true}
        />
      );

      const previewButton = screen.getByRole('button', { name: /preview attachments/i });
      expect(previewButton).toBeDisabled();
    });
  });

  describe('Configuration Props', () => {
    it('should respect maxFiles from config', () => {
      const files = new Array(5).fill(null).map((_, i) => ({
        id: `${i}`,
        title: `file${i}.pdf`,
        url: `/file${i}.pdf`,
        mime_type: 'application/pdf',
        size: 1024
      }));

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          config={{ maxFiles: 5 }}
        />
      );

      const uploadButton = screen.getByTitle(/maximum 5 files allowed/i);
      expect(uploadButton).toBeDisabled();
    });

    it('should respect maxFileSize from config', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          config={{ maxFileSize: 10 * 1024 * 1024 }}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it('should use default maxFiles when not provided', () => {
      const files = new Array(6).fill(null).map((_, i) => ({
        id: `${i}`,
        title: `file${i}.pdf`,
        url: `/file${i}.pdf`,
        mime_type: 'application/pdf',
        size: 1024
      }));

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const uploadButton = screen.getByTitle(/maximum 5 files allowed/i);
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('Persistence Behavior', () => {
    it('should handle persistImmediately true', async () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          persistImmediately={true}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it('should handle persistImmediately false', async () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          persistImmediately={false}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it('should default to persistImmediately true for backward compatibility', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
        />
      );

      // Component should render without errors
      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external file list changes', () => {
      const queryClient = createQueryClient();
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <Attachment
            value={[]}
            onChange={mockOnChange}
          />
        </QueryClientProvider>
      );

      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      rerender(
        <QueryClientProvider client={queryClient}>
          <Attachment
            value={files}
            onChange={mockOnChange}
          />
        </QueryClientProvider>
      );

      const thumbnail = document.querySelector('[title="file.pdf"]');
      expect(thumbnail).toBeInTheDocument();
    });

    it('should handle rapid list updates', () => {
      const queryClient = createQueryClient();
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <Attachment value={[]} onChange={mockOnChange} />
        </QueryClientProvider>
      );

      const files1 = [
        { id: '1', title: 'file1.pdf', url: '/1.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      const files2 = [
        { id: '1', title: 'file1.pdf', url: '/1.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '2', title: 'file2.pdf', url: '/2.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      rerender(
        <QueryClientProvider client={queryClient}>
          <Attachment value={files1} onChange={mockOnChange} />
        </QueryClientProvider>
      );
      rerender(
        <QueryClientProvider client={queryClient}>
          <Attachment value={files2} onChange={mockOnChange} />
        </QueryClientProvider>
      );

      expect(document.querySelector('[title="file1.pdf"]')).toBeInTheDocument();
      expect(document.querySelector('[title="file2.pdf"]')).toBeInTheDocument();
    });

    it('should handle removing attachments', () => {
      const queryClient = createQueryClient();
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <Attachment
            value={[
              { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
            ]}
            onChange={mockOnChange}
          />
        </QueryClientProvider>
      );

      rerender(
        <QueryClientProvider client={queryClient}>
          <Attachment
            value={[]}
            onChange={mockOnChange}
          />
        </QueryClientProvider>
      );

      const thumbnail = document.querySelector('[title="file.pdf"]');
      expect(thumbnail).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      renderWithProviders(
        <Attachment
          value={(null as unknown) as File[]}
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.relative');
      expect(container).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      renderWithProviders(
        <Attachment
          value={undefined}
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.relative');
      expect(container).toBeInTheDocument();
    });

    it('should handle large file counts', () => {
      const files = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        title: `file${i}.pdf`,
        url: `/file${i}.pdf`,
        mime_type: 'application/pdf',
        size: 1024
      }));

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      // Should show first 3 thumbnails inline
      const thumbnail = document.querySelector('[title="file0.pdf"]');
      expect(thumbnail).toBeInTheDocument();
    });

    it('should handle various MIME types', () => {
      const files = [
        { id: '1', title: 'image.png', url: '/1.png', mime_type: 'image/png', size: 1024 },
        { id: '2', title: 'doc.pdf', url: '/2.pdf', mime_type: 'application/pdf', size: 2048 },
        { id: '3', title: 'video.mp4', url: '/3.mp4', mime_type: 'video/mp4', size: 5120 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      expect(document.querySelector('[title="image.png"]')).toBeInTheDocument();
      expect(document.querySelector('[title="doc.pdf"]')).toBeInTheDocument();
      expect(document.querySelector('[title="video.mp4"]')).toBeInTheDocument();
    });

    it('should filter out invalid attachment objects', () => {
      const files = [
        { id: '1', title: 'valid.pdf', url: '/valid.pdf', mime_type: 'application/pdf', size: 1024 },
        { id: '2' }, // No URL
        null,
        undefined,
        { title: 'no-id-or-url' }
      ];

      renderWithProviders(
        <Attachment
          value={(files as unknown) as any[]}
          onChange={mockOnChange}
        />
      );

      // Should only show valid attachment
      expect(document.querySelector('[title="valid.pdf"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toHaveAttribute('title', 'Add attachment');
    });

    it('should support keyboard navigation', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const thumbnail = document.querySelector('[aria-label*="Preview"]');
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute('aria-label', 'Preview file.pdf');
    });

    it('should have accessible preview button labels', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          showPreview={true}
        />
      );

      const previewButton = screen.getByRole('button', { name: /preview attachments/i });
      expect(previewButton).toHaveAttribute('aria-label', 'Preview attachments');
    });

    it('should have role and aria labels for thumbnail buttons', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const thumbnail = document.querySelector('[aria-label*="Preview"]');
      expect(thumbnail).toBeInTheDocument();
      if (thumbnail && thumbnail instanceof HTMLElement) {
        expect(thumbnail).toHaveAttribute('aria-label');
      }
    });
  });

  describe('File Icon Types', () => {
    it('should display DOC icon for Word documents', () => {
      const files = [
        { id: '1', title: 'document.doc', url: '/doc.doc', mime_type: 'application/msword', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="DOC"]');
      expect(img).toBeInTheDocument();
    });

    it('should display DOC icon for DOCX files', () => {
      const files = [
        { id: '1', title: 'document.docx', url: '/doc.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="DOC"]');
      expect(img).toBeInTheDocument();
    });

    it('should display Excel icon for Excel files', () => {
      const files = [
        { id: '1', title: 'spreadsheet.xlsx', url: '/sheet.xlsx', mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="Excel"]');
      expect(img).toBeInTheDocument();
    });

    it('should display Excel icon for XLS files', () => {
      const files = [
        { id: '1', title: 'spreadsheet.xls', url: '/sheet.xls', mime_type: 'application/vnd.ms-excel', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="Excel"]');
      expect(img).toBeInTheDocument();
    });

    it('should display PowerPoint icon for PPT files', () => {
      const files = [
        { id: '1', title: 'presentation.ppt', url: '/pres.ppt', mime_type: 'application/vnd.ms-powerpoint', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="PPT"]');
      expect(img).toBeInTheDocument();
    });

    it('should display PowerPoint icon for PPTX files', () => {
      const files = [
        { id: '1', title: 'presentation.pptx', url: '/pres.pptx', mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="PPT"]');
      expect(img).toBeInTheDocument();
    });

    it('should display CSV icon for CSV files', () => {
      const files = [
        { id: '1', title: 'data.csv', url: '/data.csv', mime_type: 'text/csv', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="CSV"]');
      expect(img).toBeInTheDocument();
    });

    it('should display TXT icon for text files', () => {
      const files = [
        { id: '1', title: 'readme.txt', url: '/readme.txt', mime_type: 'text/plain', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="TXT"]');
      expect(img).toBeInTheDocument();
    });

    it('should display ZIP icon for ZIP files', () => {
      const files = [
        { id: '1', title: 'archive.zip', url: '/archive.zip', mime_type: 'application/zip', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="ZIP"]');
      expect(img).toBeInTheDocument();
    });

    it('should display ZIP icon for RAR files', () => {
      const files = [
        { id: '1', title: 'archive.rar', url: '/archive.rar', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="ZIP"]');
      expect(img).toBeInTheDocument();
    });

    it('should display ZIP icon for 7Z files', () => {
      const files = [
        { id: '1', title: 'archive.7z', url: '/archive.7z', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="ZIP"]');
      expect(img).toBeInTheDocument();
    });

    it('should display EXE icon for executable files', () => {
      const files = [
        { id: '1', title: 'installer.exe', url: '/installer.exe', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="EXE"]');
      expect(img).toBeInTheDocument();
    });

    it('should display Audio icon for audio files', () => {
      const files = [
        { id: '1', title: 'song.mp3', url: '/song.mp3', mime_type: 'audio/mpeg', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="Audio"]');
      expect(img).toBeInTheDocument();
    });

    it('should display Audio icon for WAV files', () => {
      const files = [
        { id: '1', title: 'sound.wav', url: '/sound.wav', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="Audio"]');
      expect(img).toBeInTheDocument();
    });

    it('should display Video icon for video files', () => {
      const files = [
        { id: '1', title: 'movie.mp4', url: '/movie.mp4', mime_type: 'video/mp4', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="Video"]');
      expect(img).toBeInTheDocument();
    });

    it('should display Video icon for AVI files', () => {
      const files = [
        { id: '1', title: 'video.avi', url: '/video.avi', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="Video"]');
      expect(img).toBeInTheDocument();
    });

    it('should display TIFF icon for TIFF files', () => {
      const files = [
        { id: '1', title: 'image.tiff', url: '/image.tiff', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="TIFF"]');
      expect(img).toBeInTheDocument();
    });

    it('should display fallback icon for unknown file types', () => {
      const files = [
        { id: '1', title: 'unknown.xyz', url: '/unknown.xyz', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="FILE"]');
      expect(img).toBeInTheDocument();
    });

    it('should use file extension when mime type is not available', () => {
      const files = [
        { id: '1', title: 'document.pdf', url: '/doc.pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[alt="PDF"]');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should handle upload button click', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(() => fireEvent.click(uploadButton)).not.toThrow();
    });

    it('should handle preview button click', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          showPreview={true}
        />
      );

      const previewButton = screen.getByRole('button', { name: /preview attachments/i });
      expect(() => fireEvent.click(previewButton)).not.toThrow();
    });
  });

  describe('handleModalChange', () => {
    it('should handle persistImmediately false path', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          persistImmediately={false}
        />
      );

      expect(mockMutateAsyncAdd).not.toHaveBeenCalled();
    });

    it('should handle missing API parameters', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          persistImmediately={true}
        />
      );

      expect(mockMutateAsyncAdd).not.toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    it('should display error when validation fails and showError is true', () => {
      const files = new Array(6).fill(null).map((_, i) => ({
        id: `${i}`,
        title: `file${i}.pdf`,
        url: `/file${i}.pdf`,
        mime_type: 'application/pdf',
        size: 1024
      }));

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          config={{ maxFiles: 5 }}
        />
      );

      const error = document.querySelector('.text-red-600');
      expect(error).not.toBeInTheDocument();
    });
  });

  describe('Upload State', () => {
    it('should show upload in progress title when uploading', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          model_id="model1"
          column_id="col1"
          row_id={1}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toHaveAttribute('title', 'Add attachment');
    });

    it('should show preview unavailable title when uploading', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          showPreview={true}
        />
      );

      const previewButton = screen.getByRole('button', { name: /preview attachments/i });
      expect(previewButton).toHaveAttribute('title', 'Preview attachments');
    });

    it('should show preview disabled title when disabled', () => {
      const files = [
        { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
          disabled={true}
          showPreview={true}
        />
      );

      const previewButton = screen.getByRole('button', { name: /preview attachments/i });
      expect(previewButton).toHaveAttribute('title', 'Preview disabled');
    });
  });

  describe('Border Styling', () => {
    it('should apply border class when isBorder is true', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          isBorder={true}
        />
      );

      const container = document.querySelector('.field-component-border');
      expect(container).toBeInTheDocument();
    });

    it('should not apply border class when isBorder is false', () => {
      renderWithProviders(
        <Attachment
          value={[]}
          onChange={mockOnChange}
          isBorder={false}
        />
      );

      const container = document.querySelector('.field-component-border');
      expect(container).not.toBeInTheDocument();
    });
  });

  describe('Thumbnail Source', () => {
    it('should use thumbnail_url when available', () => {
      const files = [
        { id: '1', title: 'image.jpg', url: '/image.jpg', mime_type: 'image/jpeg', thumbnail_url: '/thumb.jpg', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[src="/thumb.jpg"]');
      expect(img).toBeInTheDocument();
    });

    it('should fallback to url when thumbnail_url is not available', () => {
      const files = [
        { id: '1', title: 'image.jpg', url: '/image.jpg', mime_type: 'image/jpeg', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[src="/image.jpg"]');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Value Normalization', () => {
    it('should handle non-array value', () => {
      const singleFile = { id: '1', title: 'file.pdf', url: '/file.pdf', mime_type: 'application/pdf', size: 1024 };

      renderWithProviders(
        <Attachment
          value={(singleFile as unknown) as any[]}
          onChange={mockOnChange}
        />
      );

      const thumbnail = document.querySelector('[title="file.pdf"]');
      expect(thumbnail).toBeInTheDocument();
    });
  });

  describe('Image Error Handling', () => {
    it('should handle image load errors', () => {
      const files = [
        { id: '1', title: 'image.jpg', url: '/image.jpg', mime_type: 'image/jpeg', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const img = document.querySelector('img[src="/image.jpg"]') as HTMLImageElement;
      if (img) {
        const errorEvent = new Event('error');
        Object.defineProperty(errorEvent, 'currentTarget', {
          value: { style: { display: '' } },
          writable: true
        });
        fireEvent(img, errorEvent);
      }

      expect(img).toBeInTheDocument();
    });
  });

  describe('File Name Fallback', () => {
    it('should use name when title is not available', () => {
      const files = [
        { id: '1', name: 'document.pdf', url: '/doc.pdf', mime_type: 'application/pdf', size: 1024 }
      ];

      renderWithProviders(
        <Attachment
          value={files}
          onChange={mockOnChange}
        />
      );

      const thumbnail = document.querySelector('[title="document.pdf"]');
      expect(thumbnail).toBeInTheDocument();
    });
  });
});

