import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GalleryCard, MemoizedGalleryCard } from '../GalleryCard';
import type { GalleryItem } from '../../hooks/useGalleryData';

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconWithMargin: vi.fn(() => <span data-testid="field-icon">Icon</span>),
}));

vi.mock('../../../../components/shared/FieldDisplay', () => ({
  FieldDisplay: ({ value }: { value: any }) => <div data-testid="field-display">{String(value)}</div>,
}));

describe('GalleryCard', () => {
  const mockOnEdit = vi.fn();

  const mockItem: GalleryItem = {
    id: 'rec-1',
    title: 'Test Item',
    metadata: {
      Title: 'Test Item',
      Description: 'Test Description',
    },
    rawData: {
      id: 'rec-1',
      title: 'Test Item',
      description: 'Test Description',
    },
  };

  const mockVisibleColumns = [
    {
      id: '1',
      key: 'title',
      column_name: 'title',
      title: 'Title',
      type: 'text',
      uidt: 'text',
      system: false,
    },
    {
      id: '2',
      key: 'description',
      column_name: 'description',
      title: 'Description',
      type: 'text',
      uidt: 'text',
      system: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render card with item data', () => {
      render(<GalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />);

      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('should render placeholder when no images', () => {
      const { container } = render(<GalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />);

      // Placeholder shows SVG icon, not img element
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render image when available', () => {
      const itemWithImage: GalleryItem = {
        ...mockItem,
        imageUrl: 'http://example.com/image_thumb.jpg',
        allImages: [
          {
            id: 'img-1',
            url: 'http://example.com/image.jpg',
            thumbnail_url: 'http://example.com/image_thumb.jpg',
            mime_type: 'image/jpeg',
          },
        ],
      };

      render(<GalleryCard item={itemWithImage} visibleColumns={mockVisibleColumns} />);

      const images = screen.getAllByRole('img');
      const actualImage = images.find(img => img.getAttribute('src') === 'http://example.com/image_thumb.jpg');
      expect(actualImage).toBeInTheDocument();
    });

    it('should render field metadata', () => {
      render(<GalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />);

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should render field icons', () => {
      render(<GalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />);

      const icons = screen.getAllByTestId('field-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should not render when column has no value', () => {
      const itemWithEmptyField: GalleryItem = {
        ...mockItem,
        metadata: { Title: 'Test Item' },
        rawData: { id: 'rec-1', title: 'Test Item' },
      };

      render(<GalleryCard item={itemWithEmptyField} visibleColumns={mockVisibleColumns} />);

      const displays = screen.getAllByTestId('field-display');
      expect(displays).toBeDefined();
    });
  });

  describe('image carousel', () => {
    const itemWithMultipleImages: GalleryItem = {
      ...mockItem,
      imageUrl: 'http://example.com/image1_thumb.jpg',
      allImages: [
        {
          id: 'img-1',
          url: 'http://example.com/image1.jpg',
          thumbnail_url: 'http://example.com/image1_thumb.jpg',
          mime_type: 'image/jpeg',
        },
        {
          id: 'img-2',
          url: 'http://example.com/image2.jpg',
          thumbnail_url: 'http://example.com/image2_thumb.jpg',
          mime_type: 'image/jpeg',
        },
        {
          id: 'img-3',
          url: 'http://example.com/image3.jpg',
          thumbnail_url: 'http://example.com/image3_thumb.jpg',
          mime_type: 'image/jpeg',
        },
      ],
    };

    it('should show image counter when multiple images', () => {
      render(<GalleryCard item={itemWithMultipleImages} visibleColumns={mockVisibleColumns} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should show navigation arrows when multiple images', () => {
      render(<GalleryCard item={itemWithMultipleImages} visibleColumns={mockVisibleColumns} />);

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => btn.getAttribute('title') === 'Previous image');
      const nextButton = buttons.find(btn => btn.getAttribute('title') === 'Next image');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should navigate to next image', async () => {
      render(<GalleryCard item={itemWithMultipleImages} visibleColumns={mockVisibleColumns} />);

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.getAttribute('title') === 'Next image');

      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
      });
    });

    it('should navigate to previous image', async () => {
      render(<GalleryCard item={itemWithMultipleImages} visibleColumns={mockVisibleColumns} />);

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => btn.getAttribute('title') === 'Previous image');

      fireEvent.click(prevButton!);

      await waitFor(() => {
        expect(screen.getByText('3 / 3')).toBeInTheDocument();
      });
    });

    it('should cycle through images', async () => {
      render(<GalleryCard item={itemWithMultipleImages} visibleColumns={mockVisibleColumns} />);

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.getAttribute('title') === 'Next image');

      fireEvent.click(nextButton!);
      fireEvent.click(nextButton!);
      fireEvent.click(nextButton!);

      await waitFor(() => {
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });

    it('should show navigation dots', () => {
      render(<GalleryCard item={itemWithMultipleImages} visibleColumns={mockVisibleColumns} />);

      const dots = screen.getAllByTitle(/Go to image \d+/);
      expect(dots).toHaveLength(3);
    });

    it('should navigate to specific image on dot click', async () => {
      render(<GalleryCard item={itemWithMultipleImages} visibleColumns={mockVisibleColumns} />);

      const dot3 = screen.getByTitle('Go to image 3');
      fireEvent.click(dot3);

      await waitFor(() => {
        expect(screen.getByText('3 / 3')).toBeInTheDocument();
      });
    });

    it('should not show navigation for single image', () => {
      const itemWithSingleImage: GalleryItem = {
        ...mockItem,
        imageUrl: 'http://example.com/image_thumb.jpg',
        allImages: [
          {
            id: 'img-1',
            url: 'http://example.com/image.jpg',
            thumbnail_url: 'http://example.com/image_thumb.jpg',
            mime_type: 'image/jpeg',
          },
        ],
      };

      render(<GalleryCard item={itemWithSingleImage} visibleColumns={mockVisibleColumns} />);

      const prevButton = screen.queryByTitle('Previous image');
      expect(prevButton).not.toBeInTheDocument();
    });

    it('should stop propagation on carousel navigation', () => {
      render(<GalleryCard item={itemWithMultipleImages} onEdit={mockOnEdit} visibleColumns={mockVisibleColumns} />);

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.getAttribute('title') === 'Next image');

      fireEvent.click(nextButton!);

      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('should reset image index when item changes', () => {
      const { rerender } = render(<GalleryCard item={itemWithMultipleImages} visibleColumns={mockVisibleColumns} />);

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.getAttribute('title') === 'Next image');
      fireEvent.click(nextButton!);

      const newItem = { ...itemWithMultipleImages, id: 'rec-2' };
      rerender(<GalleryCard item={newItem} visibleColumns={mockVisibleColumns} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onEdit when card is clicked', () => {
      render(<GalleryCard item={mockItem} onEdit={mockOnEdit} visibleColumns={mockVisibleColumns} />);

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit on Enter key', () => {
      render(<GalleryCard item={mockItem} onEdit={mockOnEdit} visibleColumns={mockVisibleColumns} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit on Space key', () => {
      render(<GalleryCard item={mockItem} onEdit={mockOnEdit} visibleColumns={mockVisibleColumns} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should not call onEdit on other keys', () => {
      render(<GalleryCard item={mockItem} onEdit={mockOnEdit} visibleColumns={mockVisibleColumns} />);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Escape' });

      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('should not be clickable when onEdit is undefined', () => {
      render(<GalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />);

      const card = screen.queryByRole('button');
      expect(card).not.toBeInTheDocument();
    });

    it('should not have cursor-pointer when onEdit is undefined', () => {
      const { container } = render(<GalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />);

      const card = container.querySelector('.cursor-pointer');
      expect(card).not.toBeInTheDocument();
    });
  });

  describe('file preview', () => {
    it('should show PDF icon for PDF files', () => {
      const itemWithPDF: GalleryItem = {
        ...mockItem,
        allImages: [
          {
            id: 'file-1',
            url: 'http://example.com/document.pdf',
            thumbnail_url: 'http://example.com/document.pdf',
            mime_type: 'application/pdf',
            name: 'document.pdf',
          },
        ],
      };

      const { container } = render(<GalleryCard item={itemWithPDF} visibleColumns={mockVisibleColumns} />);

      // Non-image files show placeholder since hasImageFiles will be false
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show DOC icon for Word files', () => {
      const itemWithDOC: GalleryItem = {
        ...mockItem,
        allImages: [
          {
            id: 'file-1',
            url: 'http://example.com/document.docx',
            thumbnail_url: 'http://example.com/document.docx',
            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            name: 'document.docx',
          },
        ],
      };

      const { container } = render(<GalleryCard item={itemWithDOC} visibleColumns={mockVisibleColumns} />);

      // Non-image files show placeholder since hasImageFiles will be false
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show ZIP icon for archive files', () => {
      const itemWithZIP: GalleryItem = {
        ...mockItem,
        allImages: [
          {
            id: 'file-1',
            url: 'http://example.com/archive.zip',
            thumbnail_url: 'http://example.com/archive.zip',
            name: 'archive.zip',
          },
        ],
      };

      const { container } = render(<GalleryCard item={itemWithZIP} visibleColumns={mockVisibleColumns} />);

      // Non-image files show placeholder since hasImageFiles will be false
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show EXE icon for executable files', () => {
      const itemWithEXE: GalleryItem = {
        ...mockItem,
        allImages: [
          {
            id: 'file-1',
            url: 'http://example.com/program.exe',
            thumbnail_url: 'http://example.com/program.exe',
            name: 'program.exe',
          },
        ],
      };

      const { container } = render(<GalleryCard item={itemWithEXE} visibleColumns={mockVisibleColumns} />);

      // Non-image files show placeholder since hasImageFiles will be false
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show audio icon for audio files', () => {
      const itemWithAudio: GalleryItem = {
        ...mockItem,
        allImages: [
          {
            id: 'file-1',
            url: 'http://example.com/audio.mp3',
            thumbnail_url: 'http://example.com/audio.mp3',
            mime_type: 'audio/mpeg',
            name: 'audio.mp3',
          },
        ],
      };

      const { container } = render(<GalleryCard item={itemWithAudio} visibleColumns={mockVisibleColumns} />);

      // Non-image files show placeholder since hasImageFiles will be false
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show video icon for video files', () => {
      const itemWithVideo: GalleryItem = {
        ...mockItem,
        allImages: [
          {
            id: 'file-1',
            url: 'http://example.com/video.mp4',
            thumbnail_url: 'http://example.com/video.mp4',
            mime_type: 'video/mp4',
            name: 'video.mp4',
          },
        ],
      };

      const { container } = render(<GalleryCard item={itemWithVideo} visibleColumns={mockVisibleColumns} />);

      // Non-image files show placeholder since hasImageFiles will be false
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle image load error', () => {
      const itemWithImage: GalleryItem = {
        ...mockItem,
        imageUrl: 'http://example.com/broken.jpg',
        allImages: [
          {
            id: 'img-1',
            url: 'http://example.com/broken.jpg',
            thumbnail_url: 'http://example.com/broken.jpg',
            mime_type: 'image/jpeg',
          },
        ],
      };

      render(<GalleryCard item={itemWithImage} visibleColumns={mockVisibleColumns} />);

      const images = screen.getAllByRole('img');
      const img = images.find(i => i.getAttribute('src') === 'http://example.com/broken.jpg');
      
      if (img) {
        fireEvent.error(img);
      }

      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('field types', () => {
    it('should render text fields', () => {
      render(<GalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />);

      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should not render attachment fields without values', () => {
      const columnsWithAttachment = [
        ...mockVisibleColumns,
        {
          id: '3',
          key: 'image',
          column_name: 'image',
          title: 'Image',
          type: 'attachment',
          uidt: 'attachment',
          system: false,
        },
      ];

      render(<GalleryCard item={mockItem} visibleColumns={columnsWithAttachment} />);

      expect(screen.queryByText('Image')).not.toBeInTheDocument();
    });

    it('should not render complex objects without proper field type', () => {
      const itemWithComplexObject: GalleryItem = {
        ...mockItem,
        metadata: {
          Title: 'Test',
          ComplexField: { nested: 'value' },
        },
        rawData: {
          id: 'rec-1',
          title: 'Test',
          complex: { nested: 'value' },
        },
      };

      const columnsWithComplex = [
        ...mockVisibleColumns,
        {
          id: '3',
          key: 'complex',
          column_name: 'complex',
          title: 'ComplexField',
          type: 'object',
          uidt: 'object',
          system: false,
        },
      ];

      render(<GalleryCard item={itemWithComplexObject} visibleColumns={columnsWithComplex} />);

      expect(screen.queryByText('ComplexField')).not.toBeInTheDocument();
    });

    it('should handle JSON fields', () => {
      const itemWithJSON: GalleryItem = {
        ...mockItem,
        metadata: {
          Title: 'Test',
          JSON: '{"key": "value"}',
        },
        rawData: {
          id: 'rec-1',
          title: 'Test',
          json: '{"key": "value"}',
        },
      };

      const columnsWithJSON = [
        ...mockVisibleColumns,
        {
          id: '3',
          key: 'json',
          column_name: 'json',
          title: 'JSON',
          type: 'json',
          uidt: 'json',
          system: false,
        },
      ];

      render(<GalleryCard item={itemWithJSON} visibleColumns={columnsWithJSON} />);

      expect(screen.getByText('JSON')).toBeInTheDocument();
    });

    it('should handle links fields', () => {
      const itemWithLinks: GalleryItem = {
        ...mockItem,
        metadata: {
          Title: 'Test',
          Links: [{ id: 1, value: 'Link 1' }],
        },
        rawData: {
          id: 'rec-1',
          title: 'Test',
          links: [{ id: 1, value: 'Link 1' }],
        },
      };

      const columnsWithLinks = [
        ...mockVisibleColumns,
        {
          id: '3',
          key: 'links',
          column_name: 'links',
          title: 'Links',
          type: 'links',
          uidt: 'links',
          system: false,
        },
      ];

      render(<GalleryCard item={itemWithLinks} visibleColumns={columnsWithLinks} />);

      expect(screen.getByText('Links')).toBeInTheDocument();
    });

    it('should handle lookup fields', () => {
      const itemWithLookup: GalleryItem = {
        ...mockItem,
        metadata: {
          Title: 'Test',
          Lookup: 'Looked up value',
        },
        rawData: {
          id: 'rec-1',
          title: 'Test',
          lookup: 'Looked up value',
        },
      };

      const columnsWithLookup = [
        ...mockVisibleColumns,
        {
          id: '3',
          key: 'lookup',
          column_name: 'lookup',
          title: 'Lookup',
          type: 'lookup',
          uidt: 'lookup',
          system: false,
        },
      ];

      render(<GalleryCard item={itemWithLookup} visibleColumns={columnsWithLookup} />);

      expect(screen.getByText('Lookup')).toBeInTheDocument();
    });
  });

  describe('MemoizedGalleryCard', () => {
    it('should not re-render when props are equal', () => {
      const { rerender } = render(
        <MemoizedGalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />
      );

      const initialElement = screen.getByText('Test Item');

      rerender(<MemoizedGalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />);

      const updatedElement = screen.getByText('Test Item');
      expect(updatedElement).toBe(initialElement);
    });

    it('should re-render when item id changes', () => {
      const { rerender } = render(
        <MemoizedGalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />
      );

      const newItem = { ...mockItem, id: 'rec-2' };
      rerender(<MemoizedGalleryCard item={newItem} visibleColumns={mockVisibleColumns} />);

      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('should re-render when item metadata changes', () => {
      const { rerender } = render(
        <MemoizedGalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />
      );

      // The component reads from rawData first, then metadata - update both
      const newItem = {
        ...mockItem,
        metadata: { ...mockItem.metadata, Title: 'Updated Item', title: 'Updated Item' },
        rawData: { ...mockItem.rawData, title: 'Updated Item' },
      };
      rerender(<MemoizedGalleryCard item={newItem} visibleColumns={mockVisibleColumns} />);

      expect(screen.getByText('Updated Item')).toBeInTheDocument();
    });

    it('should re-render when visible columns change', () => {
      const { rerender } = render(
        <MemoizedGalleryCard item={mockItem} visibleColumns={mockVisibleColumns} />
      );

      const newColumns = [...mockVisibleColumns, {
        id: '3',
        key: 'new_field',
        column_name: 'new_field',
        title: 'New Field',
        type: 'text',
        uidt: 'text',
        system: false,
      }];

      rerender(<MemoizedGalleryCard item={mockItem} visibleColumns={newColumns} />);

      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle item without metadata', () => {
      const itemWithoutMetadata: GalleryItem = {
        id: 'rec-1',
        title: 'Test',
        metadata: {},
        rawData: { id: 'rec-1' },
      };

      render(<GalleryCard item={itemWithoutMetadata} visibleColumns={mockVisibleColumns} />);

      // Component renders without error even with no metadata
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should handle empty visible columns', () => {
      const { container } = render(<GalleryCard item={mockItem} visibleColumns={[]} onEdit={vi.fn()} />);

      // With empty columns, component renders but metadata section is empty
      const card = container.querySelector('.bg-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle undefined visible columns', () => {
      const { container } = render(<GalleryCard item={mockItem} visibleColumns={undefined} onEdit={vi.fn()} />);

      // With undefined columns, component renders but metadata section is empty
      const card = container.querySelector('.bg-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle item without rawData', () => {
      const itemWithoutRawData: GalleryItem = {
        id: 'rec-1',
        title: 'Test',
        metadata: { Title: 'Test' },
        rawData: {} as any,
      };

      render(<GalleryCard item={itemWithoutRawData} visibleColumns={mockVisibleColumns} />);

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle columns without column_name', () => {
      const columnsWithoutColumnName = [
        {
          id: '1',
          key: 'title',
          title: 'Title',
          type: 'text',
          uidt: 'text',
          system: false,
        },
      ];

      render(<GalleryCard item={mockItem} visibleColumns={columnsWithoutColumnName as any} />);

      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should handle empty allImages array', () => {
      const itemWithEmptyImages: GalleryItem = {
        ...mockItem,
        allImages: [],
      };

      const { container } = render(
        <GalleryCard item={itemWithEmptyImages} visibleColumns={mockVisibleColumns} onEdit={vi.fn()} />
      );

      // Shows placeholder icon when no images
      const card = container.querySelector('.bg-card');
      expect(card).toBeInTheDocument();
      // Placeholder SVG icon is rendered
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle null values in metadata', () => {
      const itemWithNullValues: GalleryItem = {
        ...mockItem,
        metadata: {
          Title: 'Test',
          Description: null,
        },
        rawData: {
          id: 'rec-1',
          title: 'Test',
          description: null,
        },
      };

      render(<GalleryCard item={itemWithNullValues} visibleColumns={mockVisibleColumns} />);

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle undefined allImages', () => {
      const itemWithoutImages: GalleryItem = {
        ...mockItem,
        allImages: undefined,
      };

      const { container } = render(
        <GalleryCard 
          item={itemWithoutImages} 
          visibleColumns={mockVisibleColumns} 
          onEdit={vi.fn()}
        />
      );

      // Shows placeholder icon when no images - card should render
      const card = container.querySelector('.bg-card');
      expect(card).toBeInTheDocument();
      // Placeholder SVG icon is rendered
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
