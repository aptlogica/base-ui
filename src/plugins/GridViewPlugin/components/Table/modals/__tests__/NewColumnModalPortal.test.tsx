import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('../../../../../components/modals/NewColumnModal', () => ({
  NewColumnModal: ({ isOpen, currentTableId, fields, isAddNewColumn }: any) => (
    <div
      data-testid="new-column-modal"
      data-open={String(isOpen)}
      data-tableid={currentTableId ?? ''}
      data-fields={Array.isArray(fields) ? fields.length : 0}
      data-addnew={String(Boolean(isAddNewColumn))}
    />
  ),
}));

vi.mock('../../../../../components/ui/Loader', () => ({
  Loader: () => <div data-testid="loader">Loading</div>,
}));

describe('NewColumnModalPortal', () => {
  let NewColumnModalPortal: typeof import('../NewColumnModalPortal').NewColumnModalPortal;

  beforeAll(async () => {
    ({ NewColumnModalPortal } = await import('../NewColumnModalPortal'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <NewColumnModalPortal
        isOpen={false}
        onClose={vi.fn()}
        addColumnButtonRef={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders portal with calculated position and passes props', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const ref = { current: button };

    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 5,
      bottom: 20,
      right: 25,
      width: 20,
      height: 10,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    render(
      <NewColumnModalPortal
        isOpen={true}
        onClose={vi.fn()}
        addColumnButtonRef={ref}
        tableId="t1"
        fields={[{ id: 'c1' }]}
        isAddNewColumn={true}
      />
    );

    await screen.findByLabelText('Loading');
    const portalWrapper = document.querySelector('.absolute.z-50') as HTMLElement;
    expect(portalWrapper.style.left).toBe('8px');
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    const button = document.createElement('button');
    document.body.appendChild(button);
    const ref = { current: button };

    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 10,
      bottom: 20,
      right: 30,
      width: 20,
      height: 10,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    render(
      <NewColumnModalPortal
        isOpen={true}
        onClose={onClose}
        addColumnButtonRef={ref}
      />
    );

    await screen.findByLabelText('Loading');
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

});
