import { describe, it, expect } from 'vitest';
import { expiresIn, formatSize, jobChip, jobTitle, matchesTab, statusPill, timeAgo } from '../jobsFormat';
import type { TransferJob } from '../../../service/baseJobsService';

const job = (o: Partial<TransferJob> = {}): TransferJob => ({ id: 'j', type: 'export', status: 'running', progress: 62, created_at: '2026-11-25T10:00:00Z', ...o });

describe('jobsFormat', () => {
  it('chips say the kind and the format', () => {
    expect(jobChip(job({ format: 'json' }))).toBe('Export · JSON');
    expect(jobChip(job({ type: 'import', format: 'xlsx' }))).toBe('Import · Excel');
    expect(jobChip(job({ type: 'import', format: 'sbase' }))).toBe('Import · Sereni Base');
    expect(jobChip(job({ type: 'import' }))).toBe('Import');
  });

  it('a row is named after the base, then the file', () => {
    expect(jobTitle(job({ base_title: 'Sales', file_name: 'x.zip' }))).toBe('Sales');
    expect(jobTitle(job({ base_title: ' ', file_name: 'x.zip' }))).toBe('x.zip');
    expect(jobTitle(job({ type: 'import' }))).toBe('Import');
  });

  it('says how long ago', () => {
    const now = new Date('2026-11-25T12:00:00Z').getTime();
    expect(timeAgo('2026-11-25T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2026-11-25T11:58:00Z', now)).toBe('2 min ago');
    expect(timeAgo('2026-11-25T09:00:00Z', now)).toBe('3 h ago');
    expect(timeAgo('2026-11-24T12:00:00Z', now)).toBe('1 day ago');
    expect(timeAgo('2026-11-22T12:00:00Z', now)).toBe('3 days ago');
    expect(timeAgo(undefined, now)).toBe('');
  });

  it('writes sizes and expiry', () => {
    expect(formatSize(0)).toBe('');
    expect(formatSize(12)).toBe('12 B');
    expect(formatSize(310 * 1024)).toBe('310 KB');
    expect(formatSize(4.2 * 1024 * 1024)).toBe('4.2 MB');
    const now = new Date('2026-11-25T12:00:00Z').getTime();
    expect(expiresIn('2026-11-26T11:00:00Z', now)).toBe('expires in 23 h');
    expect(expiresIn('2026-11-25T12:12:00Z', now)).toBe('expires in 12 min');
    expect(expiresIn('2026-11-25T11:00:00Z', now)).toBe('');
    expect(expiresIn(null, now)).toBe('');
  });

  it('tabs: running holds queued jobs too', () => {
    expect(matchesTab(job({ status: 'queued' }), 'running')).toBe(true);
    expect(matchesTab(job({ status: 'running' }), 'running')).toBe(true);
    expect(matchesTab(job({ status: 'completed' }), 'completed')).toBe(true);
    expect(matchesTab(job({ status: 'failed' }), 'completed')).toBe(false);
    expect(matchesTab(job({ status: 'failed' }), 'failed')).toBe(true);
    expect(matchesTab(job({ status: 'expired' }), 'all')).toBe(true);
  });

  it('pills', () => {
    expect(statusPill(job({ status: 'running', progress: 61.6 })).label).toBe('Running 62%');
    expect(statusPill(job({ status: 'queued' })).label).toBe('Queued');
    expect(statusPill(job({ status: 'completed' })).label).toBe('Completed');
    expect(statusPill(job({ status: 'completed', skipped_rows: 12 })).label).toBe('Completed · 12 skipped');
    expect(statusPill(job({ status: 'failed' })).label).toBe('Failed');
  });
});
