import { describe, it, expect } from 'vitest';
import { buildFailedImportLog } from '../importErrorLog';

const now = new Date('2026-11-25T10:00:00Z');

describe('buildFailedImportLog', () => {
  it('has the header, the error and the problems, like the log of a failed job', () => {
    const text = buildFailedImportLog({ format: 'csv', fileName: 'Shop.csv.zip', message: 'the base file is not valid', problems: ['a', 'b'], now });
    expect(text.split('\n')).toEqual([
      'Import Issues Report',
      'Generated: 2026-11-25T10:00:00.000Z',
      'Format: CSV      File: Shop.csv.zip',
      'Result: failed (nothing was created)',
      '='.repeat(100),
      '',
      'ERROR:',
      'the base file is not valid',
      '',
      'PROBLEMS (2):',
      '1. a',
      '2. b',
      '',
    ]);
  });

  it('is the Sereni Base format by default, leaves out an unknown file name and a problems section with none', () => {
    const text = buildFailedImportLog({ message: 'boom', now });
    expect(text).toContain('Format: Sereni Base\n');
    expect(text).not.toContain('File:');
    expect(text).not.toContain('PROBLEMS');
  });

  it('lists the first 1000 problems and counts the rest', () => {
    const problems = Array.from({ length: 1005 }, (_, i) => `p${i + 1}`);
    const text = buildFailedImportLog({ message: 'x', problems, now });
    expect(text).toContain('PROBLEMS (1005):');
    expect(text).toContain('1000. p1000');
    expect(text).not.toContain('1001. p1001');
    expect(text).toContain('... and 5 more problems that are not listed.');
  });
});
