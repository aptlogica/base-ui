import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageCarousel } from '../ImageCarousel';

vi.mock('react-dom', () => ({
  createPortal: (node: React.ReactNode) => node,
}));

const images = [
  { url: 'http://example.com/1.jpg', name: '1.jpg', mime_type: 'image/jpeg' },
  { url: 'http://example.com/2.jpg', name: '2.jpg', mime_type: 'image/jpeg' },
];

const fileImages = [
  { url: 'http://example.com/file.pdf', name: 'file.pdf', mime_type: 'application/pdf' },
  { url: 'http://example.com/report.docx', name: 'report.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { url: 'http://example.com/archive.zip', name: 'archive.zip', mime_type: 'application/zip' },
  { url: 'http://example.com/app.exe', name: 'app.exe', mime_type: 'application/octet-stream' },
  { url: 'http://example.com/readme.txt', name: 'readme.txt', mime_type: 'text/plain' },
];

describe('ImageCarousel', () => {
  it('returns null when closed', () => {
    const { container } = render(<ImageCarousel isOpen={false} onClose={vi.fn()} images={images} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders current image and handles navigation and close', () => {
    const onClose = vi.fn();
    render(<ImageCarousel isOpen onClose={onClose} images={images} initialIndex={0} />);

    expect(screen.getByText('1.jpg')).toBeInTheDocument();

    const [closeButton, prevButton, nextButton, zoomOutButton, zoomInButton, , secondThumbButton] = screen.getAllByRole('button');

    fireEvent.click(nextButton);
    expect(screen.getAllByAltText('2.jpg')[0]).toBeInTheDocument();

    fireEvent.click(prevButton);
    expect(screen.getAllByAltText('1.jpg')[0]).toBeInTheDocument();

    fireEvent.click(zoomInButton);
    expect(screen.getByText(/125\s*%/)).toBeInTheDocument();

    fireEvent.click(zoomOutButton);
    expect(screen.getByText(/100\s*%/)).toBeInTheDocument();

    fireEvent.click(secondThumbButton);
    expect(screen.getAllByAltText('2.jpg')[0]).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders non-image previews with correct fallbacks', () => {
    render(<ImageCarousel isOpen onClose={vi.fn()} images={fileImages} initialIndex={0} />);

    expect(screen.getByTitle('file.pdf')).toBeInTheDocument();

    const [, , nextButton] = screen.getAllByRole('button');
    fireEvent.click(nextButton);
    expect(screen.getAllByAltText('DOC').length).toBeGreaterThan(0);

    fireEvent.click(nextButton);
    expect(screen.getAllByAltText('ZIP').length).toBeGreaterThan(0);

    fireEvent.click(nextButton);
    expect(screen.getAllByAltText('EXE').length).toBeGreaterThan(0);

    fireEvent.click(nextButton);
    expect(screen.getAllByAltText('FILE').length).toBeGreaterThan(0);
  });

  it('clamps zoom within bounds', () => {
    render(<ImageCarousel isOpen onClose={vi.fn()} images={images} initialIndex={0} />);

    const [, , , zoomOutButton, zoomInButton] = screen.getAllByRole('button');

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(zoomOutButton);
    }
    expect(screen.getByText(/50\s*%/)).toBeInTheDocument();

    for (let i = 0; i < 15; i += 1) {
      fireEvent.click(zoomInButton);
    }
    expect(screen.getByText(/300\s*%/)).toBeInTheDocument();
  });

  it('closes on Escape key press when open', () => {
    const onClose = vi.fn();
    render(<ImageCarousel isOpen onClose={onClose} images={images} initialIndex={0} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
