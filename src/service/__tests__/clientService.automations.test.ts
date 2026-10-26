import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  client,
  getAutomationsService,
  createAutomationService,
  updateAutomationService,
  runAutomationService,
  validateAutomationService,
  deleteAutomationService,
  getPrimaryKeyService,
  updatePrimaryKeyService,
  getTableConstraintsService,
  checkTableConstraintService,
  createTableConstraintService,
  updateTableConstraintService,
  deleteTableConstraintService,
  upsertRowService,
} from '../clientService';

const ok = { success: true, data: 'ok' };

describe('automation services', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.spyOn(client.automationService, 'list').mockResolvedValue(ok as any);
    vi.spyOn(client.automationService, 'create').mockResolvedValue(ok as any);
    vi.spyOn(client.automationService, 'update').mockResolvedValue(ok as any);
    vi.spyOn(client.automationService, 'run').mockResolvedValue(ok as any);
    vi.spyOn(client.automationService, 'validate').mockResolvedValue(ok as any);
    vi.spyOn(client.automationService, 'delete').mockResolvedValue(ok as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the automations of a table', async () => {
    await expect(getAutomationsService('t1')).resolves.toEqual(ok);
    expect(client.automationService.list).toHaveBeenCalledWith('t1');
  });

  it('creates an automation', async () => {
    const params = { model_id: 't1', title: 'Log', type: 'trigger' as const, context: 'CREATE TRIGGER x', event: 'AFTER INSERT' };
    await createAutomationService(params);
    expect(client.automationService.create).toHaveBeenCalledWith(params);
  });

  it('updates an automation without sending its id in the body', async () => {
    await updateAutomationService({ id: 'a1', title: 'Log', context: 'q', event: 'AFTER INSERT' });
    expect(client.automationService.update).toHaveBeenCalledWith('a1', { title: 'Log', context: 'q', event: 'AFTER INSERT' });
  });

  it('runs an automation', async () => {
    await runAutomationService('a1');
    expect(client.automationService.run).toHaveBeenCalledWith('a1');
  });

  it('validates a query', async () => {
    const params = { model_id: 't1', id: 'a1', type: 'function' as const, context: 'CREATE FUNCTION f()' };
    await validateAutomationService(params);
    expect(client.automationService.validate).toHaveBeenCalledWith(params);
  });

  it('deletes an automation', async () => {
    await deleteAutomationService('a1');
    expect(client.automationService.delete).toHaveBeenCalledWith('a1');
  });

  it('passes server errors to the caller', async () => {
    const error = Object.assign(new Error('syntax error'), { status: 400 });
    vi.mocked(client.automationService.run).mockRejectedValue(error);
    await expect(runAutomationService('a1')).rejects.toBe(error);
  });
});

describe('primary key services', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gets the primary key of a table', async () => {
    vi.spyOn(client.tableService, 'getPrimaryKey').mockResolvedValue(ok as any);
    await expect(getPrimaryKeyService('t1')).resolves.toEqual(ok);
    expect(client.tableService.getPrimaryKey).toHaveBeenCalledWith('t1');
  });

  it('updates the key fields in key order', async () => {
    vi.spyOn(client.tableService, 'updatePrimaryKey').mockResolvedValue(ok as any);
    await updatePrimaryKeyService({ tableId: 't1', columnIds: ['c2', 'c1'] });
    expect(client.tableService.updatePrimaryKey).toHaveBeenCalledWith('t1', ['c2', 'c1']);
  });

  it('keeps the violation details of PKY_1004 errors', async () => {
    const error = Object.assign(new Error('Code is empty in 1 record'), { code: 'PKY_1004', details: { null_count: 1 } });
    vi.spyOn(client.tableService, 'updatePrimaryKey').mockRejectedValue(error);
    await expect(updatePrimaryKeyService({ tableId: 't1', columnIds: ['c1'] }))
      .rejects.toMatchObject({ code: 'PKY_1004', details: { null_count: 1 } });
  });
});

describe('table constraint services', () => {
  beforeEach(() => {
    vi.spyOn(client.constraintService, 'list').mockResolvedValue(ok as any);
    vi.spyOn(client.constraintService, 'check').mockResolvedValue(ok as any);
    vi.spyOn(client.constraintService, 'create').mockResolvedValue(ok as any);
    vi.spyOn(client.constraintService, 'update').mockResolvedValue(ok as any);
    vi.spyOn(client.constraintService, 'delete').mockResolvedValue(ok as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the constraints of a table by type', async () => {
    await getTableConstraintsService('t1', 'unique');
    expect(client.constraintService.list).toHaveBeenCalledWith('t1', 'unique');
  });

  it('checks existing records against the columns', async () => {
    await checkTableConstraintService({ model_id: 't1', column_ids: ['c1'] });
    expect(client.constraintService.check).toHaveBeenCalledWith({ model_id: 't1', column_ids: ['c1'] });
  });

  it('creates a constraint', async () => {
    const params = { model_id: 't1', type: 'unique' as const, title: 'Email', column_ids: ['c1'] };
    await createTableConstraintService(params);
    expect(client.constraintService.create).toHaveBeenCalledWith(params);
  });

  it('updates a constraint without sending its id in the body', async () => {
    await updateTableConstraintService({ id: 'k1', title: 'Email', column_ids: ['c1', 'c2'] });
    expect(client.constraintService.update).toHaveBeenCalledWith('k1', { title: 'Email', column_ids: ['c1', 'c2'] });
  });

  it('deletes a constraint', async () => {
    await deleteTableConstraintService('k1');
    expect(client.constraintService.delete).toHaveBeenCalledWith('k1');
  });
});

describe('row upsert service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates or updates a record with the SDK upsert', async () => {
    vi.spyOn(client.rowService, 'upsert').mockResolvedValue(ok as any);
    const params = { model_id: 't1', row_id: 4, values: { c1: 'A' } };
    await expect(upsertRowService(params)).resolves.toEqual(ok);
    expect(client.rowService.upsert).toHaveBeenCalledWith(params);
  });
});
