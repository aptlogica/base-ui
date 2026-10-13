import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { extractImageUrl, getImageFileError, useImageUpload } from '../useImageUpload';

const mutateAsyncMock = vi.fn();
vi.mock('../../../../../hooks/useApi', () => ({
  useAddImage: () => ({ mutateAsync: mutateAsyncMock }),
}));

const toastMock = { success: vi.fn(), error: vi.fn() };
vi.mock('../../../../../components/common/Toast', () => ({
  useToast: () => toastMock,
}));

const imageFile = new File(['img'], 'img.png', { type: 'image/png' });

describe('extractImageUrl', () => {
  it.each([
    [{ data: { data: { url: 'a' } } }, 'a'],
    [{ data: { url: 'b' } }, 'b'],
    [{ data: { data: [{ url: 'c' }] } }, 'c'],
    [{ data: [{ url: 'd' }] }, 'd'],
    [{ data: 'e' }, 'e'],
    [{ data: { data: ['f'] } }, 'f'],
    [{ data: { data: [{ name: 'no-url' }] } }, ''],
    [{}, ''],
    [undefined, ''],
  ])('extracts the url from %j', (response, expected) => {
    expect(extractImageUrl(response)).toBe(expected);
  });
});

describe('getImageFileError', () => {
  it('accepts a small image', () => {
    expect(getImageFileError(imageFile)).toBeNull();
  });

  it('rejects non-image files', () => {
    const file = new File(['txt'], 'a.txt', { type: 'text/plain' });
    expect(getImageFileError(file)?.title).toBe('Invalid File Type');
  });

  it('rejects images over 5MB', () => {
    const file = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
    expect(getImageFileError(file)?.title).toBe('File Too Large');
  });
});

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads the file and reports the url with a success toast', async () => {
    mutateAsyncMock.mockResolvedValue({ data: { url: 'https://img/x.png' } });
    const onUploaded = vi.fn();
    const { result } = renderHook(() => useImageUpload(onUploaded, 'Logo uploaded'));

    await act(() => result.current.upload(imageFile));

    expect(mutateAsyncMock).toHaveBeenCalledWith({ files: [imageFile] });
    expect(onUploaded).toHaveBeenCalledWith('https://img/x.png');
    expect(toastMock.success).toHaveBeenCalledWith('Logo uploaded', { title: 'Success' });
    expect(result.current.uploading).toBe(false);
  });

  it('skips the success toast when no message is given', async () => {
    mutateAsyncMock.mockResolvedValue({ data: 'https://img/x.png' });
    const onUploaded = vi.fn();
    const { result } = renderHook(() => useImageUpload(onUploaded));

    await act(() => result.current.upload(imageFile));

    expect(onUploaded).toHaveBeenCalledWith('https://img/x.png');
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it('does nothing without a file', async () => {
    const { result } = renderHook(() => useImageUpload(vi.fn()));
    await act(() => result.current.upload(undefined));
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('rejects invalid files before uploading', async () => {
    const { result } = renderHook(() => useImageUpload(vi.fn()));
    await act(() => result.current.upload(new File(['t'], 'a.txt', { type: 'text/plain' })));
    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith('Please select an image file', { title: 'Invalid File Type' });
  });

  it('reports a response without a url', async () => {
    mutateAsyncMock.mockResolvedValue({ data: {} });
    const onUploaded = vi.fn();
    const { result } = renderHook(() => useImageUpload(onUploaded));

    await act(() => result.current.upload(imageFile));

    expect(onUploaded).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith('Failed to get image URL from response', { title: 'Upload Failed' });
  });

  it('reports upload errors, falling back to a default message', async () => {
    const { result } = renderHook(() => useImageUpload(vi.fn()));

    mutateAsyncMock.mockRejectedValueOnce(new Error('boom'));
    await act(() => result.current.upload(imageFile));
    expect(toastMock.error).toHaveBeenCalledWith('boom', { title: 'Upload Failed' });

    mutateAsyncMock.mockRejectedValueOnce({});
    await act(() => result.current.upload(imageFile));
    expect(toastMock.error).toHaveBeenCalledWith('Failed to upload image. Please try again.', { title: 'Upload Failed' });
    expect(result.current.uploading).toBe(false);
  });
});
