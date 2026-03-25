import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportModal from '../ExportModal';

describe('ExportModal', () => {
  const events = [
    {
      id: 'e1',
      title: 'Event 1',
      date: '2024-01-15',
      dateTime: new Date('2024-01-15T10:00:00Z'),
      data: { description: 'desc' },
    },
  ];

  beforeEach(() => {
    document.body.classList.remove('overflow-hidden');
  });

  afterEach(() => {
    document.body.classList.remove('overflow-hidden');
    vi.restoreAllMocks();
  });

  it('returns null when closed', () => {
    const { container } = render(<ExportModal isOpen={false} onClose={vi.fn()} events={events} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('locks body scroll when open', () => {
    render(<ExportModal isOpen={true} onClose={vi.fn()} events={events} />);
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);
  });

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(<ExportModal isOpen={true} onClose={onClose} events={events} />);
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} events={events} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles keydown on modal content without closing', () => {
    const onClose = vi.fn();
    const { container } = render(<ExportModal isOpen={true} onClose={onClose} events={events} />);
    const content = (container.firstChild as HTMLElement).querySelector('.bg-modal') as HTMLElement;
    fireEvent.keyDown(content, { key: 'Enter' });
    fireEvent.keyDown(content, { key: ' ' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('exports JSON and triggers download', () => {
    const onClose = vi.fn();
    const clickSpy = vi.fn();
    const hrefSpy = vi.fn();
    const downloadSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement(tagName);
        anchor.click = clickSpy;
        Object.defineProperty(anchor, 'href', {
          set: (value) => hrefSpy(value),
        });
        Object.defineProperty(anchor, 'download', {
          set: (value) => downloadSpy(value),
        });
        return anchor;
      }
      return originalCreateElement(tagName);
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));

    render(<ExportModal isOpen={true} onClose={onClose} events={events} />);
    fireEvent.click(screen.getByText('JSON'));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(hrefSpy).toHaveBeenCalledWith(expect.stringContaining('application/json'));
    expect(downloadSpy).toHaveBeenCalledWith('calendar-events-2026-03-01.json');
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('exports CSV and escapes quotes', () => {
    const onClose = vi.fn();
    const clickSpy = vi.fn();
    const hrefSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement(tagName);
        anchor.click = clickSpy;
        Object.defineProperty(anchor, 'href', {
          set: (value) => hrefSpy(value),
        });
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    const eventsWithQuotes = [
      {
        id: 'e1',
        title: 'Event "One"',
        date: '2024-01-15',
        dateTime: new Date('2024-01-15T10:00:00Z'),
        data: { description: 'He said "hi"' },
      },
    ];

    render(<ExportModal isOpen={true} onClose={onClose} events={eventsWithQuotes} />);
    fireEvent.click(screen.getByText('CSV'));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    const hrefArg = hrefSpy.mock.calls.at(-1)?.[0] as string;
    expect(hrefArg).toContain('text/csv');
    expect(decodeURIComponent(hrefArg)).toContain('"Event ""One"""');
    expect(decodeURIComponent(hrefArg)).toContain('"He said ""hi"""');
  });

  it('exports Excel and shows singular/plural footer', () => {
    const onClose = vi.fn();
    const clickSpy = vi.fn();
    const downloadSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement(tagName);
        anchor.click = clickSpy;
        Object.defineProperty(anchor, 'download', {
          set: (value) => downloadSpy(value),
        });
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    const { rerender } = render(<ExportModal isOpen={true} onClose={onClose} events={events} />);
    expect(screen.getByText('1 event available for export')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Excel'));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledWith(expect.stringContaining('.xlsx'));

    rerender(<ExportModal isOpen={true} onClose={onClose} events={[...events, { ...events[0], id: 'e2' }]} />);
    expect(screen.getByText('2 events available for export')).toBeInTheDocument();
  });

  it('shows plural footer for zero events', () => {
    render(<ExportModal isOpen={true} onClose={vi.fn()} events={[]} />);
    expect(screen.getByText('0 events available for export')).toBeInTheDocument();
  });
});
