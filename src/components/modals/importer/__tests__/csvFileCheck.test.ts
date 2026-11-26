import { describe, it, expect } from 'vitest';
import { checkCsvFile, pickCsvFiles, pickCsvZip } from '../csvFileCheck';

const file = (name: string, content: BlobPart = 'Name\nAcme\n') => new File([content], name);
const bytes = (...b: number[]) => new Uint8Array(b);

describe('checkCsvFile', () => {
  it('accepts a csv, whatever the letter case of the extension', async () => {
    expect(await checkCsvFile(file('a.csv'))).toBe('');
    expect(await checkCsvFile(file('A.CSV'))).toBe('');
  });

  it('refuses a name that does not end in .csv, naming the file', async () => {
    expect(await checkCsvFile(file('report.xlsx'))).toBe('report.xlsx is not a CSV file. Only .csv files or a .zip are supported.');
  });

  it('refuses an empty file and a name starting with a dot', async () => {
    expect(await checkCsvFile(file('e.csv', ''))).toBe('e.csv is empty.');
    expect(await checkCsvFile(file('.h.csv'))).toBe('.h.csv is not a valid CSV file name.');
  });

  it('refuses a zip or a binary file renamed .csv', async () => {
    expect(await checkCsvFile(file('z.csv', bytes(0x50, 0x4b, 3, 4)))).toBe('z.csv is not a valid CSV file.');
    expect(await checkCsvFile(file('b.csv', bytes(97, 0, 98)))).toBe('b.csv is not a valid CSV file.');
  });

  it('refuses a name that is already in the list, case aside', async () => {
    expect(await checkCsvFile(file('A.csv'), ['a.csv'])).toBe('A.csv was added twice.');
  });
});

describe('pickCsvFiles', () => {
  const none = { csvFiles: [] as File[], zip: null as File | null };

  it('takes several csv files and adds to what is chosen', async () => {
    const first = await pickCsvFiles([file('a.csv'), file('b.csv')], none);
    expect(first.csvFiles.map((f) => f.name)).toEqual(['a.csv', 'b.csv']);
    const more = await pickCsvFiles([file('c.csv')], first);
    expect(more.csvFiles.map((f) => f.name)).toEqual(['a.csv', 'b.csv', 'c.csv']);
    expect(more.error).toBe('');
  });

  it('takes the good files and names the refused one', async () => {
    const r = await pickCsvFiles([file('a.csv'), file('x.txt')], none);
    expect(r.csvFiles.map((f) => f.name)).toEqual(['a.csv']);
    expect(r.error).toContain('x.txt is not a CSV file');
  });

  it('takes one zip at once', () => {
    const r = pickCsvZip([file('all.zip')], none);
    expect(r?.zip?.name).toBe('all.zip');
    expect(r?.error).toBe('');
  });

  it('refuses two zips, and a zip picked together with csv files', async () => {
    expect((await pickCsvFiles([file('a.zip'), file('b.zip')], none)).error).toBe('Choose only one .zip.');
    expect((await pickCsvFiles([file('a.zip'), file('a.csv')], none)).error).toBe('Choose either CSV files or one .zip, not both.');
  });

  it('lets csv files replace a chosen zip, and a zip replace chosen csv files', async () => {
    const withZip = { csvFiles: [], zip: file('a.zip') };
    const toCsv = await pickCsvFiles([file('b.csv')], withZip);
    expect(toCsv.error).toBe('');
    expect(toCsv.zip).toBeNull();
    expect(toCsv.csvFiles.map((f) => f.name)).toEqual(['b.csv']);

    const toZip = await pickCsvFiles([file('c.zip')], toCsv);
    expect(toZip.error).toBe('');
    expect(toZip.zip?.name).toBe('c.zip');
    expect(toZip.csvFiles).toEqual([]);
  });
});
