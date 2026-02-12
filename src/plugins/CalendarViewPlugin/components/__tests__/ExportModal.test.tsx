import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportModal from '../ExportModal';

describe('ExportModal', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Event 1',
      date: '2026-01-30',
      dateTime: new Date('2026-01-30T14:30:00'),
      data: { description: 'First event' },
      color: 'blue'
    },
    {
      id: '2',
      title: 'Event 2',
      date: '2026-02-15',
      dateTime: new Date('2026-02-15T10:00:00'),
      data: { description: 'Second event' },
      color: 'green'
    }
  ];

  const mockDateField = {
    id: '1',
    key: 'start_date',
    title: 'Start Date',
    type: 'datetime'
  };

  let createElementSpy: ReturnType<typeof vi.spyOn> | undefined;
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.classList.remove('overflow-hidden');
    // Only mock createElement for anchor tags so React's DOM creation is unchanged
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: unknown) => {
      if ((tagName as string).toLowerCase() === 'a') {
        const a = originalCreateElement('a');
        a.setAttribute = vi.fn();
        a.click = vi.fn();
        return a;
      }
      return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
    }) as any;
  });

  afterEach(() => {
    createElementSpy?.mockRestore();
  });

  describe('rendering', () => {
    it('should not render when closed', () => {
      render(
        <ExportModal
          isOpen={false}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      expect(screen.queryByText('Export Calendar')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      expect(screen.getByText('Export Calendar')).toBeInTheDocument();
    });

    it('should display event count', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      expect(screen.getByText('2 events available for export')).toBeInTheDocument();
    });

    it('should display singular event text', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={[mockEvents[0]]}
          dateField={mockDateField}
        />
      );

      expect(screen.getByText('1 event available for export')).toBeInTheDocument();
    });

    it('should show export format options', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
    });

    it('should display format descriptions', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      expect(screen.getByText('Structured data format')).toBeInTheDocument();
      expect(screen.getByText('Comma-separated values')).toBeInTheDocument();
      expect(screen.getByText('Spreadsheet format')).toBeInTheDocument();
    });
  });

  describe('close functionality', () => {
    it('should call onClose when close button clicked', async () => {
      const mockOnClose = vi.fn();

      render(
        <ExportModal
          isOpen={true}
          onClose={mockOnClose}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop clicked', async () => {
      const mockOnClose = vi.fn();

      const { container } = render(
        <ExportModal
          isOpen={true}
          onClose={mockOnClose}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const backdrop = container.querySelector('.bg-modal-backdrop');
      expect(backdrop).toBeTruthy();
      if (backdrop) await userEvent.click(backdrop as HTMLElement);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when modal content clicked', async () => {
      const mockOnClose = vi.fn();

      render(
        <ExportModal
          isOpen={true}
          onClose={mockOnClose}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const modalContent = screen.getByText('Export Calendar').closest('div');
      expect(modalContent).toBeTruthy();
      if (modalContent) await userEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('JSON export', () => {
    it('should export to JSON when JSON button clicked', async () => {
      const mockClick = vi.fn();
      createElementSpy!.mockImplementation((tagName: unknown) => {
        if ((tagName as string).toLowerCase() === 'a') {
          const a = originalCreateElement('a');
          a.setAttribute = vi.fn();
          a.click = mockClick;
          return a;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as any;

      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const jsonButton = screen.getByText('JSON').closest('button');
      expect(jsonButton).toBeTruthy();
      if (jsonButton) await userEvent.click(jsonButton);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should close modal after JSON export', async () => {
      const mockOnClose = vi.fn();
      const mockClick = vi.fn();
      createElementSpy!.mockImplementation((tagName: unknown) => {
        if ((tagName as string).toLowerCase() === 'a') {
          const a = originalCreateElement('a');
          a.setAttribute = vi.fn();
          a.click = mockClick;
          return a;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as any;

      render(
        <ExportModal
          isOpen={true}
          onClose={mockOnClose}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const jsonButton = screen.getByText('JSON').closest('button');
      expect(jsonButton).toBeTruthy();
      if (jsonButton) await userEvent.click(jsonButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('CSV export', () => {
    it('should export to CSV when CSV button clicked', async () => {
      const mockClick = vi.fn();
      createElementSpy!.mockImplementation((tagName: unknown) => {
        if ((tagName as string).toLowerCase() === 'a') {
          const a = originalCreateElement('a');
          a.setAttribute = vi.fn();
          a.click = mockClick;
          return a;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as any;

      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const csvButton = screen.getByText('CSV').closest('button');
      expect(csvButton).toBeTruthy();
      if (csvButton) await userEvent.click(csvButton);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should close modal after CSV export', async () => {
      const mockOnClose = vi.fn();
      const mockClick = vi.fn();
      createElementSpy!.mockImplementation((tagName: unknown) => {
        if ((tagName as string).toLowerCase() === 'a') {
          const a = originalCreateElement('a');
          a.setAttribute = vi.fn();
          a.click = mockClick;
          return a;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as any;

      render(
        <ExportModal
          isOpen={true}
          onClose={mockOnClose}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const csvButton = screen.getByText('CSV').closest('button');
      expect(csvButton).toBeTruthy();
      if (csvButton) await userEvent.click(csvButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Excel export', () => {
    it('should export to Excel when Excel button clicked', async () => {
      const mockClick = vi.fn();
      createElementSpy!.mockImplementation((tagName: unknown) => {
        if ((tagName as string).toLowerCase() === 'a') {
          const a = originalCreateElement('a');
          a.setAttribute = vi.fn();
          a.click = mockClick;
          return a;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as any;

      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const excelButton = screen.getByText('Excel').closest('button');
      expect(excelButton).toBeTruthy();
      if (excelButton) await userEvent.click(excelButton);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should close modal after Excel export', async () => {
      const mockOnClose = vi.fn();
      const mockClick = vi.fn();
      createElementSpy!.mockImplementation((tagName: unknown) => {
        if ((tagName as string).toLowerCase() === 'a') {
          const a = originalCreateElement('a');
          a.setAttribute = vi.fn();
          a.click = mockClick;
          return a;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as any;

      render(
        <ExportModal
          isOpen={true}
          onClose={mockOnClose}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const excelButton = screen.getByText('Excel').closest('button');
      expect(excelButton).toBeTruthy();
      if (excelButton) await userEvent.click(excelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('body scroll behavior', () => {
    it('should add overflow-hidden class to body when opened', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      expect(document.body.classList.contains('overflow-hidden')).toBe(true);
    });

    it('should remove overflow-hidden class when closed', () => {
      const { rerender } = render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      rerender(
        <ExportModal
          isOpen={false}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      expect(document.body.classList.contains('overflow-hidden')).toBe(false);
    });

    it('should cleanup overflow-hidden on unmount', () => {
      const { unmount } = render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      unmount();

      expect(document.body.classList.contains('overflow-hidden')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty events array', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={[]}
          dateField={mockDateField}
        />
      );

      expect(screen.getByText('0 events available for export')).toBeInTheDocument();
    });

    it('should handle missing dateField', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
        />
      );

      expect(screen.getByText('Export Calendar')).toBeInTheDocument();
    });

    it('should handle events with missing data', async () => {
      const eventsWithMissingData = [
        { ...mockEvents[0], data: undefined }
      ];

      const mockClick = vi.fn();
      createElementSpy!.mockImplementation((tagName: unknown) => {
        if ((tagName as string).toLowerCase() === 'a') {
          const a = originalCreateElement('a');
          a.setAttribute = vi.fn();
          a.click = mockClick;
          return a;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as any;

      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={eventsWithMissingData as any}
          dateField={mockDateField}
        />
      );

      const jsonButton = screen.getByText('JSON').closest('button');
      expect(jsonButton).toBeTruthy();
      if (jsonButton) await userEvent.click(jsonButton);

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper close button label', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have accessible export buttons', () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          events={mockEvents}
          dateField={mockDateField}
        />
      );

      const jsonButton = screen.getByText('JSON').closest('button');
      const csvButton = screen.getByText('CSV').closest('button');
      const excelButton = screen.getByText('Excel').closest('button');

      expect(jsonButton).toBeInTheDocument();
      expect(csvButton).toBeInTheDocument();
      expect(excelButton).toBeInTheDocument();
    });
  });
});
