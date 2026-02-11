import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { NewColumnModalPortal } from '../modals/NewColumnModalPortal';

// Mock createPortal to render children directly
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

// Mock the lazy-loaded NewColumnModal - needs to be synchronous for tests
vi.mock('../../../../../components/modals/NewColumnModal', () => ({
  NewColumnModal: ({ isOpen, onClose, onSave, fields, isAddNewColumn }: any) => (
    <div data-testid="new-column-modal" data-is-open={isOpen}>
      <span data-testid="fields-count">{fields?.length ?? 0}</span>
      <span data-testid="is-add-new">{String(isAddNewColumn)}</span>
      <button data-testid="close-btn" onClick={onClose}>
        Close
      </button>
      <button data-testid="save-btn" onClick={() => onSave({ name: 'test' })}>
        Save
      </button>
    </div>
  ),
}));

// Mock Loader
vi.mock('../../../../../components/ui/Loader', () => ({
  Loader: ({ size }: any) => <div data-testid="loader" data-size={size}>Loading...</div>,
}));

describe('NewColumnModalPortal', () => {
  const mockOnClose = vi.fn();
  const mockOnAddColumn = vi.fn();

  let addColumnButtonRef: React.RefObject<HTMLButtonElement>;
  let buttonElement: HTMLButtonElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a button element and ref
    buttonElement = document.createElement('button');
    buttonElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      left: 500,
      bottom: 140,
      right: 550,
      width: 50,
      height: 40,
    });
    document.body.appendChild(buttonElement);

    addColumnButtonRef = { current: buttonElement };

    // Mock window scroll
    Object.defineProperty(globalThis, 'scrollX', { value: 0, writable: true });
    Object.defineProperty(globalThis, 'scrollY', { value: 0, writable: true });
  });

  afterEach(() => {
    if (buttonElement.parentNode) {
      buttonElement.remove();
    }
  });

  const getDefaultProps = () => ({
    isOpen: true,
    onClose: mockOnClose,
    addColumnButtonRef,
    onAddColumn: mockOnAddColumn,
  });

  describe('rendering', () => {
    it('should not render when closed', () => {
      render(<NewColumnModalPortal {...getDefaultProps()} isOpen={false} />);

      expect(screen.queryByTestId('new-column-modal')).not.toBeInTheDocument();
    });

    it('should not render without button ref', () => {
      render(
        <NewColumnModalPortal
          {...getDefaultProps()}
          addColumnButtonRef={null}
        />
      );

      expect(screen.queryByTestId('new-column-modal')).not.toBeInTheDocument();
    });

    it('should not render when button ref has no current', () => {
      const emptyRef = { current: null } as unknown as React.RefObject<HTMLButtonElement>;
      render(
        <NewColumnModalPortal
          {...getDefaultProps()}
          addColumnButtonRef={emptyRef}
        />
      );

      expect(screen.queryByTestId('new-column-modal')).not.toBeInTheDocument();
    });
  });

  describe('event listener management', () => {
    it('should add keyboard event listener when open', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      render(<NewColumnModalPortal {...getDefaultProps()} />);

      await waitFor(() => {
        expect(screen.getByTestId('new-column-modal')).toBeInTheDocument();
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should add mousedown event listener when open', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      render(<NewColumnModalPortal {...getDefaultProps()} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should not add listeners when closed', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      render(<NewColumnModalPortal {...getDefaultProps()} isOpen={false} />);

      // Should not have added keydown/mousedown for the modal
      const keydownCalls = addEventListenerSpy.mock.calls.filter(
        ([event]) => event === 'keydown'
      );
      const mousedownCalls = addEventListenerSpy.mock.calls.filter(
        ([event]) => event === 'mousedown'
      );

      // The modal-specific listeners shouldn't be added when closed
      expect(keydownCalls.length).toBe(0);
      expect(mousedownCalls.length).toBe(0);

      addEventListenerSpy.mockRestore();
    });
  });

});
