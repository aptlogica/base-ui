import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { deps } = vi.hoisted(() => ({ deps: vi.fn() }));
vi.mock('../../../service/clientService', () => ({ getTablesByBaseIdService: vi.fn() }));
vi.mock('../../../service/baseExportService', () => ({ getExportDependencies: deps }));

import { ExportSbaseModal } from '../ExportSbaseModal';

const base = { id: 'b1', title: 'Sales CRM' };

const open = async (format?: 'sbase' | 'csv') => {
  const onExport = vi.fn();
  render(<ExportSbaseModal isOpen base={base} onClose={() => {}} onExport={onExport} format={format} />);
  await screen.findByText('Customers');
  fireEvent.click(screen.getByText('Advanced Options'));
  return onExport;
};

describe('ExportSbaseModal in csv format', () => {
  beforeEach(() => {
    deps.mockReset();
    deps.mockResolvedValue({
      tables: [{ id: 't1', title: 'Customers', fields: [] }, { id: 't2', title: 'Orders', fields: [] }],
      dependencies: [{ table_id: 't2', table_title: 'Orders', depends_on_id: 't1', depends_on_title: 'Customers', kind: 'trigger', item: 'on_insert' }],
    });
  });

  it('shows the delimiter choice and the UTF-8 encoding, and no triggers or system columns', async () => {
    await open('csv');
    // the word "Delimiter" is not shown; the separator is a radio group, visible without opening Advanced Options
    expect(screen.queryByText(/delimiter/i)).toBeNull();
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    for (const label of [/Comma \( , \)/, /Semicolon \( ; \)/, /Tab \( \\t \)/, /Pipe \( \| \)/]) {
      expect(screen.getByRole('radio', { name: label })).toBeTruthy();
    }
    expect((screen.getByRole('radio', { name: /Comma/ }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText('UTF-8')).toBeTruthy();
    expect(screen.queryByText(/Triggers & Functions/)).toBeNull();
    expect(screen.queryByText(/System columns/)).toBeNull();
    expect(screen.getByText('Export CSV')).toBeTruthy();
  });

  it('exports with the chosen delimiter and without automations or system columns', async () => {
    const onExport = await open('csv');
    fireEvent.click(screen.getByRole('radio', { name: /Pipe/ }));
    expect((screen.getByRole('radio', { name: /Pipe/ }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByText('Export CSV'));
    expect(onExport).toHaveBeenCalledWith(expect.objectContaining({
      format: 'csv', delimiter: 'pipe', includeData: true, includeAutomations: false, includeSystemColumns: false,
    }));
  });

  it('puts the descriptions of the csv options behind an info icon', async () => {
    await open('csv');
    for (const name of [/About column separator/, /About encoding/, /About data/, /About attachments/]) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    // a description shows only for the icon that is hovered or focused
    expect(screen.queryByRole('tooltip')).toBeNull();
    const icon = screen.getByRole('button', { name: /About data/ });
    fireEvent.mouseEnter(icon.parentElement as HTMLElement);
    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    expect(screen.getByRole('tooltip').textContent).toMatch(/Off exports headers only/);
    fireEvent.mouseLeave(icon.parentElement as HTMLElement);
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.focus(screen.getByRole('button', { name: /About encoding/ }));
    expect(screen.getByRole('tooltip').textContent).toMatch(/UTF-8/);
  });

  it('does not warn that a trigger would be left out, because a csv has none', async () => {
    await open('csv');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('ExportSbaseModal in the default (sbase) format', () => {
  beforeEach(() => {
    deps.mockReset();
    deps.mockResolvedValue({ tables: [{ id: 't1', title: 'Customers', fields: [] }], dependencies: [] });
  });

  it('keeps triggers and system columns, has no delimiter, and exports as sbase', async () => {
    const onExport = await open();
    expect(screen.getByText(/Triggers & Functions/)).toBeTruthy();
    expect(screen.getByText(/System columns/)).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    fireEvent.click(screen.getByText('Export Base'));
    await waitFor(() => expect(onExport).toHaveBeenCalled());
    expect(onExport.mock.calls[0][0]).toMatchObject({ format: 'sbase', delimiter: undefined });
  });

  it('puts the descriptions of the options behind an info icon', async () => {
    await open();
    for (const name of [/About data/, /About attachments/, /About triggers and functions/, /About system columns/]) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.focus(screen.getByRole('button', { name: /About system columns/ }));
    expect(screen.getByRole('tooltip').textContent).toContain('Adds id, dates and users. Needs Data.');
  });
});
