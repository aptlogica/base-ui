import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import KanbanStack from '../KanbanStack';
import type { KanbanStack as Stack } from '../types';

vi.mock('../KanbanCard', () => ({
  default: ({ card }: any) => <div>{card.title}</div>,
}));

const columns = [
  { id: '1', key: 'title', title: 'Title', type: 'text', uidt: 'text' },
  { id: '2', key: 'status', title: 'Status', type: 'select', uidt: 'select' },
] as any[];

const stack: Stack = {
  id: 'stack1',
  name: 'To Do',
  color: '#3b82f6',
  position: 0,
  isCollapsed: false,
  cards: [
    { _meta: { id: 'r1', position: 0, created_at: '', updated_at: '', deleted_at: null }, title: 'Task 1', status: 'To Do', data: {} } as any,
    { _meta: { id: 'r2', position: 1, created_at: '', updated_at: '', deleted_at: null }, title: 'Task 2', status: 'To Do', data: {} } as any,
  ],
};

const openMenu = (container: HTMLElement) => {
  const button = container.querySelector('button.p-1.hover\\:bg-gray-200.rounded.transition-colors');
  expect(button).toBeTruthy();
  fireEvent.click(button!);
};

describe('KanbanStack behavior', () => {
  it('triggers collapse action from menu', () => {
    const onStackCollapse = vi.fn();
    const { container } = render(
      <KanbanStack stack={stack} columns={columns} onStackCollapse={onStackCollapse} />
    );

    openMenu(container);
    fireEvent.click(screen.getByText('Collapse stack'));

    expect(onStackCollapse).toHaveBeenCalledWith('stack1');
  });

  it('enters edit mode and saves edited title', () => {
    const onStackEdit = vi.fn();
    const { container } = render(
      <KanbanStack stack={stack} columns={columns} onStackEdit={onStackEdit} />
    );

    openMenu(container);
    fireEvent.click(screen.getByText('Edit stack'));

    const input = screen.getByDisplayValue('To Do');
    fireEvent.change(input, { target: { value: 'In Progress' } });
    fireEvent.blur(input);

    expect(onStackEdit).toHaveBeenCalledWith('To Do', 'In Progress');
  });

  it('opens delete modal and confirms delete from menu', () => {
    const onStackDelete = vi.fn();
    const { container } = render(
      <KanbanStack
        stack={stack}
        columns={columns}
        onStackDelete={onStackDelete}
        groupFieldTitle="Status"
      />
    );

    openMenu(container);
    fireEvent.click(screen.getByText('Delete stack'));

    expect(screen.getByText('Delete Stack')).toBeInTheDocument();
    expect(screen.getByText(/This stack contains 2 cards/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete'));
    expect(onStackDelete).toHaveBeenCalledWith('stack1');
  });
});
