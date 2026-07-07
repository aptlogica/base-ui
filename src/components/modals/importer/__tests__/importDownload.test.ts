import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadLinkedFile, downloadTextContent } from '../importDownload';

describe('importDownload', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  afterEach(() => {
    clickSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should download text content as a blob file', () => {
    downloadTextContent('row 1 error', 'import_error_rows_report.txt');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should download a linked file from a file path', () => {
    downloadLinkedFile('/reports/import_error_rows.txt');

    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
