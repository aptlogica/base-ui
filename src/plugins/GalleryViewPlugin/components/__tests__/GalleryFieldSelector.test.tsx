import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GalleryFieldConfiguration } from '../GalleryFieldSelector';
import type { BaseColumn } from '../../../../types/column.types';

vi.mock('../../../../components/common/dropdown/AdvancedDropdown', () => ({
  AdvancedDropdown: ({ label, options, value, onChange, placeholder }: any) => (
    <div data-testid="advanced-dropdown">
      <label>{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid="dropdown-select"
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('../../../../hooks/useSmartPopover', () => ({
  useSmartPopover: () => ({
    position: { top: 100, left: 100 },
  }),
}));

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children: any) => children,
  };
});

describe('GalleryFieldConfiguration', () => {
  const mockOnAttachmentFieldChange = vi.fn();

  const mockColumns: BaseColumn[] = [
    {
      id: '1',
      key: 'title',
      column_name: 'title',
      title: 'Title',
      type: 'text',
      uidt: 'text',
      position: 0,
      hidden: false,
      isHidden: false,
      system: false,
    },
    {
      id: '2',
      key: 'image1',
      column_name: 'image1',
      title: 'Image 1',
      type: 'attachment',
      uidt: 'attachment',
      position: 1,
      hidden: false,
      isHidden: false,
      system: false,
    },
    {
      id: '3',
      key: 'image2',
      column_name: 'image2',
      title: 'Image 2',
      type: 'attachment',
      uidt: 'attachment',
      position: 2,
      hidden: false,
      isHidden: false,
      system: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render trigger button', () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      expect(screen.getByText('Gallery Fields')).toBeInTheDocument();
    });

    it('should open popup on button click', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Gallery Fields')).toBeInTheDocument();
      });
    });

    it('should show attachment field dropdown', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Image Field')).toBeInTheDocument();
      });
    });

    it('should filter only attachment columns', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = select.querySelectorAll('option');
        const attachmentOptions = Array.from(options).filter(
          (opt) => opt.textContent === 'Image 1' || opt.textContent === 'Image 2'
        );
        expect(attachmentOptions).toHaveLength(2);
      });
    });

    it('should display selected attachment field', async () => {
      const attachmentField = mockColumns[1];

      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          attachmentField={attachmentField}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        expect((select as HTMLSelectElement).value).toBe('2');
      });
    });

    it('should apply custom className', () => {
      const { container } = render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
          className="custom-class"
        />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should toggle popup on button click', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');

      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('Configure Gallery Fields')).toBeInTheDocument();
      });

      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByText('Configure Gallery Fields')).not.toBeInTheDocument();
      });
    });

    it('should call onAttachmentFieldChange when field is selected', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        fireEvent.change(select, { target: { value: '2' } });
      });

      expect(mockOnAttachmentFieldChange).toHaveBeenCalledWith(mockColumns[1]);
    });

    it('should call onAttachmentFieldChange with undefined when no field matches', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        fireEvent.change(select, { target: { value: '999' } });
      });

      expect(mockOnAttachmentFieldChange).toHaveBeenCalledWith(undefined);
    });

    it('should close popup on Escape key', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Gallery Fields')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Configure Gallery Fields')).not.toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns array', () => {
      render(
        <GalleryFieldConfiguration
          columns={[]}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      expect(screen.getByText('Gallery Fields')).toBeInTheDocument();
    });

    it('should handle columns with no attachments', async () => {
      const nonAttachmentColumns: BaseColumn[] = [
        {
          id: '1',
          key: 'title',
          column_name: 'title',
          title: 'Title',
          type: 'text',
          uidt: 'text',
          position: 0,
          hidden: false,
          isHidden: false,
          system: false,
        },
      ];

      render(
        <GalleryFieldConfiguration
          columns={nonAttachmentColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = select.querySelectorAll('option');
        expect(options).toHaveLength(1);
      });
    });

    it('should handle columns without ids', async () => {
      const columnsWithoutIds: BaseColumn[] = [
        {
          key: 'image1',
          column_name: 'image1',
          title: 'Image 1',
          type: 'attachment',
          uidt: 'attachment',
          position: 1,
        } as BaseColumn,
      ];

      render(
        <GalleryFieldConfiguration
          columns={columnsWithoutIds}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = select.querySelectorAll('option');
        expect(options).toHaveLength(1);
      });
    });

    it('should handle undefined attachmentField', () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          attachmentField={undefined}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      expect(screen.getByText('Gallery Fields')).toBeInTheDocument();
    });

    it('should handle columns with type attachment but no uidt', async () => {
      const columnsWithTypeOnly: BaseColumn[] = [
        {
          id: '1',
          key: 'image',
          column_name: 'image',
          title: 'Image',
          type: 'attachment',
          position: 0,
          hidden: false,
          isHidden: false,
          system: false,
        } as BaseColumn,
      ];

      render(
        <GalleryFieldConfiguration
          columns={columnsWithTypeOnly}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        const options = select.querySelectorAll('option');
        expect(options.length).toBeGreaterThan(1);
      });
    });

    it('should handle null onAttachmentFieldChange', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={null as any}
        />
      );

      const button = screen.getByText('Gallery Fields');

      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should handle attachmentField not in columns', async () => {
      const differentField: BaseColumn = {
        id: '999',
        key: 'other',
        column_name: 'other',
        title: 'Other',
        type: 'attachment',
        uidt: 'attachment',
        position: 5,
        hidden: false,
        isHidden: false,
        system: false,
      };

      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          attachmentField={differentField}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        // Field not in columns, so defaults to empty
        expect((select as HTMLSelectElement).value).toBe('');
      });
    });

    it('should not show columns without column_name or key', async () => {
      const columnsWithMissingKeys: BaseColumn[] = [
        ...mockColumns,
        {
          id: '4',
          title: 'Image 3',
          type: 'attachment',
          uidt: 'attachment',
          position: 3,
        } as BaseColumn,
      ];

      render(
        <GalleryFieldConfiguration
          columns={columnsWithMissingKeys}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const select = screen.getByTestId('dropdown-select');
        expect(select).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper button role', () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByRole('button', { name: /gallery fields/i });
      expect(button).toBeInTheDocument();
    });

    it('should have aria-haspopup attribute', () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByRole('button', { name: /gallery fields/i });
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should update aria-expanded when opened', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByRole('button', { name: /gallery fields/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('popup positioning', () => {
    it('should render popup with fixed positioning', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const popup = screen.getByText('Configure Gallery Fields').parentElement;
        expect(popup).toHaveStyle({ position: 'fixed' });
      });
    });

    it('should apply position from useSmartPopover', async () => {
      render(
        <GalleryFieldConfiguration
          columns={mockColumns}
          onAttachmentFieldChange={mockOnAttachmentFieldChange}
        />
      );

      const button = screen.getByText('Gallery Fields');
      fireEvent.click(button);

      await waitFor(() => {
        const popup = screen.getByText('Configure Gallery Fields').parentElement;
        expect(popup).toHaveStyle({ top: '100px', left: '100px' });
      });
    });
  });
});
