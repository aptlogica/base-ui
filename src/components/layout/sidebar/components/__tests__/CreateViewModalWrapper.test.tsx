import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateViewModalWrapper } from '../CreateViewModalWrapper';

const mockOnClose = vi.fn();
const mockOnCreate = vi.fn();

const defaultProps = {
  tableId: 'table-1',
  viewType: 'grid',
  fields: [],
  onClose: mockOnClose,
  onCreate: mockOnCreate,
};

const mockExistingViews: unknown[] = [
  { id: 'view-1', title: 'View 1', type: 'grid' },
];

vi.mock('../../../../../hooks/useApi', () => ({
  useTableViews: vi.fn(),
}));

vi.mock('../../../../../components/modals/CreateViewModal', () => ({
  CreateViewModal: (props: {
    isOpen: boolean;
    onClose: () => void;
    tableId: string;
    viewType: string;
    defaultName: string;
    fields: unknown[];
    existingViews: unknown[];
    onCreate: (data: unknown) => Promise<void>;
  }) => (
    <div data-testid="create-view-modal" data-is-open={props.isOpen}>
      <span data-testid="modal-table-id">{props.tableId}</span>
      <span data-testid="modal-view-type">{props.viewType}</span>
      <span data-testid="modal-default-name">{props.defaultName}</span>
      <span data-testid="modal-views-count">{props.existingViews.length}</span>
      <span data-testid="modal-fields-count">{props.fields.length}</span>
      <button type="button" onClick={props.onClose} data-testid="modal-close">
        Close
      </button>
      <button
        type="button"
        data-testid="modal-create"
        onClick={() => props.onCreate({ name: 'New View', description: '', type: props.viewType })}
      >
        Create
      </button>
    </div>
  ),
}));

import { useTableViews } from '../../../../../hooks/useApi';

const useTableViewsMock = vi.mocked(useTableViews);

describe('CreateViewModalWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTableViewsMock.mockReturnValue({
      data: { data: mockExistingViews },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useTableViewsMock>);
  });

  describe('Rendering', () => {
    it('should render CreateViewModal with isOpen true', () => {
      render(<CreateViewModalWrapper {...defaultProps} />);
      expect(screen.getByTestId('create-view-modal')).toBeInTheDocument();
    });

    it('should pass tableId to CreateViewModal', () => {
      render(<CreateViewModalWrapper {...defaultProps} />);
      expect(screen.getByTestId('modal-table-id')).toHaveTextContent('table-1');
    });

    it('should pass viewType to CreateViewModal', () => {
      render(<CreateViewModalWrapper {...defaultProps} />);
      expect(screen.getByTestId('modal-view-type')).toHaveTextContent('grid');
    });

    it('should pass defaultName derived from viewType to CreateViewModal', () => {
      render(<CreateViewModalWrapper {...defaultProps} />);
      expect(screen.getByTestId('modal-default-name')).toHaveTextContent('Grid View');
    });

    it('should pass existing views from useTableViews to CreateViewModal', () => {
      render(<CreateViewModalWrapper {...defaultProps} />);
      expect(screen.getByTestId('modal-views-count')).toHaveTextContent('1');
    });

    it('should pass fields prop to CreateViewModal', () => {
      const fields = [{ id: 'col-1', title: 'Column 1' }];
      render(<CreateViewModalWrapper {...defaultProps} fields={fields} />);
      expect(screen.getByTestId('create-view-modal')).toBeInTheDocument();
    });
  });

  describe('useTableViews', () => {
    it('should call useTableViews with tableId', () => {
      render(<CreateViewModalWrapper {...defaultProps} tableId="table-99" />);
      expect(useTableViewsMock).toHaveBeenCalledWith('table-99');
    });

    it('should pass empty existingViews when useTableViews returns no data', () => {
      useTableViewsMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useTableViewsMock>);
      render(<CreateViewModalWrapper {...defaultProps} />);
      expect(screen.getByTestId('modal-views-count')).toHaveTextContent('0');
    });

    it('should pass empty existingViews when response data is not an array', () => {
      useTableViewsMock.mockReturnValue({
        data: { data: null },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useTableViewsMock>);
      render(<CreateViewModalWrapper {...defaultProps} />);
      expect(screen.getByTestId('modal-views-count')).toHaveTextContent('0');
    });
  });

  describe('Interaction', () => {
    it('should call onClose when modal close button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateViewModalWrapper {...defaultProps} />);
      const closeButton = screen.getByTestId('modal-close');

      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onCreate when modal create button is clicked', async () => {
      mockOnCreate.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<CreateViewModalWrapper {...defaultProps} />);
      const createButton = screen.getByTestId('modal-create');

      await user.click(createButton);

      expect(mockOnCreate).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle viewType with first letter uppercase for defaultName', () => {
      render(<CreateViewModalWrapper {...defaultProps} viewType="kanban" />);
      expect(screen.getByTestId('modal-default-name')).toHaveTextContent('Kanban View');
    });

    it('should handle empty fields array', () => {
      render(<CreateViewModalWrapper {...defaultProps} fields={[]} />);
      expect(screen.getByTestId('create-view-modal')).toBeInTheDocument();
    });
  });
});
