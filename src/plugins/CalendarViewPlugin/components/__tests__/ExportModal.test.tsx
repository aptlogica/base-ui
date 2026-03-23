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

  it('exports JSON and triggers download', () => {
    const onClose = vi.fn();
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement(tagName);
        anchor.click = clickSpy;
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    render(<ExportModal isOpen={true} onClose={onClose} events={events} />);
    fireEvent.click(screen.getByText('JSON'));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
