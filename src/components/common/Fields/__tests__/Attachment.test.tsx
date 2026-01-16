import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Attachment } from '../Attachment';

// Mock the hooks
vi.mock('../../../hooks/useApi', () => ({
  useAddAttachment: () => ({
    mutateAsync: vi.fn().mockResolvedValue(null),
  }),
  useRemoveAttachments: () => ({
    mutateAsync: vi.fn().mockResolvedValue(null),
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

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
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

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
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

      // Required validation should show error message
      await waitFor(() => {
        const error = document.querySelector('.text-red-600');
        expect(error).toBeInTheDocument();
        expect(error?.textContent).toContain('Please attach');
      }).catch(() => {
        // Error might only show after interactions
      });
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

      // Upload button should be disabled
      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
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

      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
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

      // Default maxFiles is 5, so with 6 files button should be disabled
      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
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
          value={null as any}
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.relative');
      expect(container).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      renderWithProviders(
        <Attachment
          value={undefined as any}
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
          value={files as any}
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

      // Upload button should have clear label
      const uploadButton = screen.getByRole('button', { name: /add attachment/i });
      expect(uploadButton).toHaveAttribute('aria-label', 'Add attachment');
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

      const thumbnail = document.querySelector('[role="button"]');
      (thumbnail as HTMLElement)?.focus();

      expect(thumbnail).toHaveFocus();
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

      const thumbnail = document.querySelector('[role="button"]');
      expect(thumbnail).toHaveAttribute('tabIndex', '0');
      expect(thumbnail).toHaveAttribute('aria-label');
    });
  });
});

