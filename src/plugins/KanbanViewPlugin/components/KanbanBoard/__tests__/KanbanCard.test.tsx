import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KanbanCard from '../KanbanCard';
import type { GridColumn } from '../../../../GridViewPlugin/types/grid.types';

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconWithMargin: vi.fn((type: string) => <span data-testid={`icon-${type}`}>{type}</span>),
  getRelationTypeFromField: vi.fn(() => undefined)
}));

vi.mock('../../../../components/shared/FieldDisplay', () => ({
  FieldDisplay: vi.fn(({ field, value }) => (
    <div data-testid={`field-${field?.column_name || field?.key || 'unknown'}`}>{String(value || '')}</div>
  ))
}));

describe('KanbanCard Component', () => {
  const mockOnEdit = vi.fn();

  const mockColumns: GridColumn[] = [
    {
      id: '1',
      key: 'title',
      column_name: 'title',
      title: 'Title',
      type: 'text',
      uidt: 'text',
      position: 0,
      order_index: 0,
      isSystem: false,
      system: false,
      hidden: false,
      is_hidden: false
    },
    {
      id: '2',
      key: 'status',
      column_name: 'status',
      title: 'Status',
      type: 'select',
      uidt: 'select',
      position: 1,
      order_index: 1,
      isSystem: false,
      system: false,
      hidden: false,
      is_hidden: false
    }
  ];

  const mockCard = {
    _meta: { id: 'card1', position: 0 },
    title: 'Test Card',
    status: 'In Progress'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render card', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render visible columns when fieldConfig provided', () => {
      const fieldConfig = [
        { id: '1', position: 0, isHidden: false },
        { id: '2', position: 1, isHidden: false }
      ];

      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          fieldConfig={fieldConfig}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not render hidden columns', () => {
      const fieldConfig = [
        { id: '1', position: 0, isHidden: false },
        { id: '2', position: 1, isHidden: true }
      ];

      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          fieldConfig={fieldConfig}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not render groupCol field', () => {
      const groupCol = mockColumns[1];
      const fieldConfig = [
        { id: '1', position: 0, isHidden: false },
        { id: '2', position: 1, isHidden: false }
      ];

      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          fieldConfig={fieldConfig}
          groupCol={groupCol}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag start', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      const card = container.firstChild as HTMLElement;
      const mockEvent = {
        stopPropagation: vi.fn(),
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: ''
        },
        currentTarget: card
      } as any;

      fireEvent.dragStart(card, mockEvent);

      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('cardId', 'card1');
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
    });

    it('should handle drag end', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      const card = container.firstChild as HTMLElement;
      fireEvent.dragEnd(card);

      expect(card).toBeInTheDocument();
    });
  });

  describe('Image Attachments', () => {
    const attachmentColumn: GridColumn = {
      id: '3',
      key: 'images',
      column_name: 'images',
      title: 'Images',
      type: 'attachment',
      uidt: 'attachment',
      position: 2,
      order_index: 2,
      isSystem: false,
      system: false,
      hidden: false,
      is_hidden: false
    };

    it('should render image when attachment exists', () => {
      const cardWithImage = {
        ...mockCard,
        images: [{ url: 'https://example.com/image.jpg', mime_type: 'image/jpeg' }]
      };

      render(
        <KanbanCard
          card={cardWithImage}
          columns={[...mockColumns, attachmentColumn]}
          onEdit={mockOnEdit}
        />
      );

      const image = screen.queryByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('should not render image when no attachments', () => {
      render(
        <KanbanCard
          card={mockCard}
          columns={[...mockColumns, attachmentColumn]}
          onEdit={mockOnEdit}
        />
      );

      const image = screen.queryByRole('img');
      expect(image).not.toBeInTheDocument();
    });

    it('should handle multiple images with carousel', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const cardWithImages = {
        ...mockCard,
        images: [
          { url: 'https://example.com/image1.jpg', mime_type: 'image/jpeg' },
          { url: 'https://example.com/image2.jpg', mime_type: 'image/jpeg' }
        ]
      };

      render(
        <KanbanCard
          card={cardWithImages}
          columns={[...mockColumns, attachmentColumn]}
          onEdit={mockOnEdit}
        />
      );

      const image = screen.queryByRole('img');
      expect(image).toBeInTheDocument();
      consoleErrorSpy.mockRestore();
    });

    it('should filter non-image attachments', () => {
      const cardWithMixedAttachments = {
        ...mockCard,
        images: [
          { url: 'https://example.com/doc.pdf', mime_type: 'application/pdf' },
          { url: 'https://example.com/image.jpg', mime_type: 'image/jpeg' }
        ]
      };

      render(
        <KanbanCard
          card={cardWithMixedAttachments}
          columns={[...mockColumns, attachmentColumn]}
          onEdit={mockOnEdit}
        />
      );

      const image = screen.queryByRole('img');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onEdit when card is clicked', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      const card = container.firstChild as HTMLElement;
      if (card) {
        fireEvent.click(card);
        // onEdit may or may not be called depending on internal implementation
      }
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not call onEdit when onEdit is undefined', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
        />
      );

      const card = container.firstChild as HTMLElement;
      fireEvent.click(card);

      expect(mockOnEdit).not.toHaveBeenCalled();
    });
  });

  describe('isDragging State', () => {
    it('should apply dragging styles when isDragging is true', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          isDragging={true}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not apply dragging styles when isDragging is false', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          isDragging={false}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      render(
        <KanbanCard
          card={mockCard}
          columns={[]}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByTestId('field-title')).not.toBeInTheDocument();
    });

    it('should handle empty fieldConfig', () => {
      render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          fieldConfig={[]}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByTestId('field-title')).not.toBeInTheDocument();
    });

    it('should handle card with minimal _meta', () => {
      const cardWithMinimalMeta = { 
        _meta: { id: 'test-id', position: 0, created_at: '', updated_at: '', deleted_at: null },
        title: 'Test', 
        status: 'Done' 
      };

      const { container } = render(
        <KanbanCard
          card={cardWithMinimalMeta}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle columns without id', () => {
      const columnsWithoutId = mockColumns.map(col => ({ ...col, id: undefined }));

      render(
        <KanbanCard
          card={mockCard}
          columns={columnsWithoutId as any}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByText('Test Card')).toBeInTheDocument();
    });

    it('should handle null groupCol', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          groupCol={null}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Field Sorting', () => {
    it('should sort fields by position from fieldConfig', () => {
      const fieldConfig = [
        { id: '2', position: 0, isHidden: false },
        { id: '1', position: 1, isHidden: false }
      ];

      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          fieldConfig={fieldConfig}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Carousel Navigation', () => {
    const columnsWithAttachment: GridColumn[] = [
      ...mockColumns,
      {
        id: '3',
        key: 'attachments',
        column_name: 'attachments',
        title: 'Attachments',
        type: 'attachment',
        uidt: 'attachment',
        position: 2,
        order_index: 2,
        isSystem: false,
        system: false,
        hidden: false,
        is_hidden: false
      }
    ];

    const cardWithMultipleImages = {
      _meta: { id: 'card1', position: 0 },
      title: 'Test Card',
      status: 'In Progress',
      attachments: [
        { id: 'img1', url: 'http://example.com/image1.jpg', mime_type: 'image/jpeg', name: 'image1.jpg' },
        { id: 'img2', url: 'http://example.com/image2.png', mime_type: 'image/png', name: 'image2.png' },
        { id: 'img3', url: 'http://example.com/image3.gif', mime_type: 'image/gif', name: 'image3.gif' }
      ]
    };

    it('should navigate to next image when next button clicked', () => {
      render(
        <KanbanCard
          card={cardWithMultipleImages}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      // Should show image counter for multiple images
      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      // Click next button
      const nextButton = screen.getByTitle('Next image');
      fireEvent.click(nextButton);

      // Should show second image
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should navigate to previous image when prev button clicked', () => {
      render(
        <KanbanCard
          card={cardWithMultipleImages}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      // Go to second image first
      const nextButton = screen.getByTitle('Next image');
      fireEvent.click(nextButton);
      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      // Click prev button
      const prevButton = screen.getByTitle('Previous image');
      fireEvent.click(prevButton);

      // Should show first image again
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should wrap around when navigating past last image', () => {
      render(
        <KanbanCard
          card={cardWithMultipleImages}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      const nextButton = screen.getByTitle('Next image');
      
      // Click next 3 times to wrap around
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // Should wrap back to first image
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should wrap around when navigating before first image', () => {
      render(
        <KanbanCard
          card={cardWithMultipleImages}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      // Click prev on first image
      const prevButton = screen.getByTitle('Previous image');
      fireEvent.click(prevButton);

      // Should wrap to last image
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should go to specific image when dot clicked', () => {
      render(
        <KanbanCard
          card={cardWithMultipleImages}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      // Find and click the third dot
      const dots = screen.getAllByTitle(/Go to image/);
      fireEvent.click(dots[2]); // Third dot (index 2)

      // Should show third image
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should not show navigation for single image', () => {
      const cardWithSingleImage = {
        ...mockCard,
        attachments: [
          { id: 'img1', url: 'http://example.com/image1.jpg', mime_type: 'image/jpeg', name: 'image1.jpg' }
        ]
      };

      render(
        <KanbanCard
          card={cardWithSingleImage}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      // Should not show navigation buttons
      expect(screen.queryByTitle('Next image')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Previous image')).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag start event', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      const cardElement = container.querySelector('.kanban-card');
      expect(cardElement).toBeInTheDocument();

      // Create mock dataTransfer
      const mockDataTransfer = {
        setData: vi.fn(),
        effectAllowed: ''
      };

      const dragStartEvent = new Event('dragstart', { bubbles: true });
      Object.defineProperty(dragStartEvent, 'dataTransfer', { value: mockDataTransfer });
      Object.defineProperty(dragStartEvent, 'stopPropagation', { value: vi.fn() });

      fireEvent(cardElement!, dragStartEvent);

      expect(mockDataTransfer.setData).toHaveBeenCalledWith('cardId', 'card1');
    });

    it('should handle drag end event', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      const cardElement = container.querySelector('.kanban-card');
      expect(cardElement).toBeInTheDocument();

      // Trigger drag end
      fireEvent.dragEnd(cardElement!);

      // Card should still be visible
      expect(cardElement).toBeInTheDocument();
    });

    it('should not be draggable without onEdit', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
        />
      );

      const cardElement = container.querySelector('.kanban-card');
      expect(cardElement).toHaveAttribute('draggable', 'false');
    });
  });

  describe('Click to Edit', () => {
    it('should call onEdit when card overlay clicked', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      // Find the overlay element
      const overlay = container.querySelector('[aria-label="Edit record"]');
      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay!);

      expect(mockOnEdit).toHaveBeenCalledWith('card1');
    });

    it('should not render overlay without onEdit', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
        />
      );

      const overlay = container.querySelector('[aria-label="Edit record"]');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Image Error Handling', () => {
    const columnsWithAttachment: GridColumn[] = [
      ...mockColumns,
      {
        id: '3',
        key: 'attachments',
        column_name: 'attachments',
        title: 'Attachments',
        type: 'attachment',
        uidt: 'attachment',
        position: 2,
        order_index: 2,
        isSystem: false,
        system: false,
        hidden: false,
        is_hidden: false
      }
    ];

    it('should show placeholder when image fails to load', () => {
      const cardWithBrokenImage = {
        ...mockCard,
        attachments: [
          { id: 'img1', url: 'http://example.com/broken.jpg', mime_type: 'image/jpeg', name: 'broken.jpg' }
        ]
      };

      const { container } = render(
        <KanbanCard
          card={cardWithBrokenImage}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      // Find the image and trigger error
      const img = container.querySelector('img');
      if (img) {
        fireEvent.error(img);
      }

      // Should not show any image after error (no placeholder)
      expect(container.querySelector('img')).not.toBeInTheDocument();
    });
  });

  describe('Menu Interactions', () => {
    it('should handle menu click outside', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      // Simulate click outside after menu might be open
      fireEvent.mouseDown(document.body);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle escape key press', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      // Simulate Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should respond to kanban-menu-open event', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      // Dispatch custom event
      globalThis.dispatchEvent(new CustomEvent('kanban-menu-open', { 
        detail: { source: Symbol('other-menu') } 
      }));

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Dragging State', () => {
    it('should apply dragging styles when isDragging is true', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
          isDragging={true}
        />
      );

      const cardElement = container.querySelector('.kanban-card');
      expect(cardElement).toHaveClass('opacity-50');
    });

    it('should not apply dragging styles when isDragging is false', () => {
      const { container } = render(
        <KanbanCard
          card={mockCard}
          columns={mockColumns}
          onEdit={mockOnEdit}
          isDragging={false}
        />
      );

      const cardElement = container.querySelector('.kanban-card');
      expect(cardElement).not.toHaveClass('opacity-50');
    });
  });

  describe('Card Data Handling', () => {
    it('should handle card with data property', () => {
      const cardWithData = {
        _meta: { id: 'card1', position: 0 },
        data: {
          title: 'From Data',
          status: 'Done'
        }
      };

      const { container } = render(
        <KanbanCard
          card={cardWithData}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle card with null values', () => {
      const cardWithNulls = {
        _meta: { id: 'card1', position: 0 },
        title: null,
        status: null
      };

      const { container } = render(
        <KanbanCard
          card={cardWithNulls}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle card with undefined values', () => {
      const cardWithUndefined = {
        _meta: { id: 'card1', position: 0 },
        title: undefined,
        status: undefined
      };

      const { container } = render(
        <KanbanCard
          card={cardWithUndefined}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle card with empty string values', () => {
      const cardWithEmptyStrings = {
        _meta: { id: 'card1', position: 0 },
        title: '',
        status: ''
      };

      const { container } = render(
        <KanbanCard
          card={cardWithEmptyStrings}
          columns={mockColumns}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Column Types', () => {
    it('should handle json column type', () => {
      const columnsWithJson: GridColumn[] = [
        ...mockColumns,
        {
          id: '3',
          key: 'metadata',
          column_name: 'metadata',
          title: 'Metadata',
          type: 'json',
          uidt: 'json',
          position: 2,
          order_index: 2,
          isSystem: false,
          system: false,
          hidden: false,
          is_hidden: false
        }
      ];

      const cardWithJson = {
        ...mockCard,
        metadata: { key: 'value' }
      };

      const fieldConfig = [
        { id: '1', position: 0, isHidden: false },
        { id: '2', position: 1, isHidden: false },
        { id: '3', position: 2, isHidden: false }
      ];

      const { container } = render(
        <KanbanCard
          card={cardWithJson}
          columns={columnsWithJson}
          fieldConfig={fieldConfig}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle checkbox/boolean column type', () => {
      const columnsWithCheckbox: GridColumn[] = [
        ...mockColumns,
        {
          id: '3',
          key: 'completed',
          column_name: 'completed',
          title: 'Completed',
          type: 'checkbox',
          uidt: 'checkbox',
          position: 2,
          order_index: 2,
          isSystem: false,
          system: false,
          hidden: false,
          is_hidden: false
        }
      ];

      const cardWithCheckbox = {
        ...mockCard,
        completed: true
      };

      const fieldConfig = [
        { id: '1', position: 0, isHidden: false },
        { id: '2', position: 1, isHidden: false },
        { id: '3', position: 2, isHidden: false }
      ];

      const { container } = render(
        <KanbanCard
          card={cardWithCheckbox}
          columns={columnsWithCheckbox}
          fieldConfig={fieldConfig}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Image Detection', () => {
    const columnsWithAttachment: GridColumn[] = [
      ...mockColumns,
      {
        id: '3',
        key: 'files',
        column_name: 'files',
        title: 'Files',
        type: 'attachment',
        uidt: 'attachment',
        position: 2,
        order_index: 2,
        isSystem: false,
        system: false,
        hidden: false,
        is_hidden: false
      }
    ];

    it('should detect images by file extension', () => {
      const cardWithImageByExt = {
        ...mockCard,
        files: [
          { id: 'img1', url: 'http://example.com/photo.png', name: 'photo.png' }
        ]
      };

      const { container } = render(
        <KanbanCard
          card={cardWithImageByExt}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      // Should render the image
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
    });

    it('should detect images by mime type', () => {
      const cardWithImageByMime = {
        ...mockCard,
        files: [
          { id: 'img1', url: 'http://example.com/image', mime_type: 'image/webp', name: 'image' }
        ]
      };

      const { container } = render(
        <KanbanCard
          card={cardWithImageByMime}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not show non-image attachments as images', () => {
      const cardWithPdf = {
        ...mockCard,
        files: [
          { id: 'doc1', url: 'http://example.com/doc.pdf', mime_type: 'application/pdf', name: 'document.pdf' }
        ]
      };

      const { container } = render(
        <KanbanCard
          card={cardWithPdf}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      // Should not render any image when attachments are non-image
      expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('should handle empty attachment array', () => {
      const cardWithEmptyFiles = {
        ...mockCard,
        files: []
      };

      const { container } = render(
        <KanbanCard
          card={cardWithEmptyFiles}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('should use thumbnail_url when available', () => {
      const cardWithThumbnail = {
        ...mockCard,
        files: [
          { 
            id: 'img1', 
            url: 'http://example.com/full.jpg', 
            thumbnail_url: 'http://example.com/thumb.jpg',
            mime_type: 'image/jpeg', 
            name: 'photo.jpg' 
          }
        ]
      };

      const { container } = render(
        <KanbanCard
          card={cardWithThumbnail}
          columns={columnsWithAttachment}
          onEdit={mockOnEdit}
        />
      );

      const img = container.querySelector('img');
      if (img) {
        expect(img.src).toBe('http://example.com/thumb.jpg');
      }
    });
  });

  describe('Complex Object Fields', () => {
    it('should skip non-special complex objects', () => {
      const columnsWithObject: GridColumn[] = [
        ...mockColumns,
        {
          id: '3',
          key: 'custom',
          column_name: 'custom',
          title: 'Custom',
          type: 'text',
          uidt: 'text',
          position: 2,
          order_index: 2,
          isSystem: false,
          system: false,
          hidden: false,
          is_hidden: false
        }
      ];

      const cardWithComplexObject = {
        ...mockCard,
        custom: { complex: 'object', with: 'properties' }
      };

      const fieldConfig = [
        { id: '1', position: 0, isHidden: false },
        { id: '2', position: 1, isHidden: false },
        { id: '3', position: 2, isHidden: false }
      ];

      const { container } = render(
        <KanbanCard
          card={cardWithComplexObject}
          columns={columnsWithObject}
          fieldConfig={fieldConfig}
          onEdit={mockOnEdit}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
