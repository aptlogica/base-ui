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
});
