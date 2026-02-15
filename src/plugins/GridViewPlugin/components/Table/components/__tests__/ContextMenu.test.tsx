import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextMenu } from '../ContextMenu';

describe('ContextMenu', () => {
  const onClose = vi.fn();
  const onDelete = vi.fn();
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders edit and delete actions by default', () => {
    render(
      <ContextMenu
        x={100}
        y={200}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText('Edit record')).toBeInTheDocument();
    expect(screen.getByText('Delete record')).toBeInTheDocument();
  });

  it('hides edit action when canEditRecord is false', () => {
    render(
      <ContextMenu
        x={100}
        y={200}
        onClose={onClose}
        onDelete={onDelete}
        canEditRecord={false}
      />
    );

    expect(screen.queryByText('Edit record')).not.toBeInTheDocument();
    expect(screen.getByText('Delete record')).toBeInTheDocument();
  });

  it('hides delete action when canDeleteRecord is false', () => {
    render(
      <ContextMenu
        x={100}
        y={200}
        onClose={onClose}
        onDelete={onDelete}
        canDeleteRecord={false}
      />
    );

    expect(screen.getByText('Edit record')).toBeInTheDocument();
    expect(screen.queryByText('Delete record')).not.toBeInTheDocument();
  });

  it('calls onEdit and onClose when edit is clicked', () => {
    render(
      <ContextMenu
        x={100}
        y={200}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByText('Edit record'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete is clicked', () => {
    render(
      <ContextMenu
        x={100}
        y={200}
        onClose={onClose}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByText('Delete record'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('closes on outside click and Escape key', () => {
    render(
      <ContextMenu
        x={100}
        y={200}
        onClose={onClose}
        onDelete={onDelete}
      />
    );

    fireEvent.mouseDown(document.body);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('adjusts position to stay within viewport', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 300,
      height: 200,
      top: 0,
      left: 0,
      right: 300,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    render(
      <ContextMenu
        x={9999}
        y={9999}
        onClose={onClose}
        onDelete={onDelete}
      />
    );

    const menu = document.querySelector('div.select-none') as HTMLDivElement;
    expect(menu).toBeInTheDocument();
    expect(Number.parseFloat(menu.style.left)).toBeGreaterThanOrEqual(10);
    expect(Number.parseFloat(menu.style.top)).toBeGreaterThanOrEqual(10);

    rafSpy.mockRestore();
    rectSpy.mockRestore();
  });
});
