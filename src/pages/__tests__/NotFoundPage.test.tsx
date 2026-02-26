import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage';
import { describe, it, expect } from 'vitest';

describe('NotFoundPage', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
  };

  it('should render the page not found heading', () => {
    renderComponent();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Page not found');
  });

  it('should render the error message', () => {
    renderComponent();
    const message = screen.getByText(
      "Sorry, we couldn't find the page you're looking for. It may have been moved or no longer exists."
    );
    expect(message).toBeInTheDocument();
  });

  it('should render the illustration image', () => {
    renderComponent();
    const image = screen.getByAltText('Page not found');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/assets/page-not-found.png');
  });

  it('should render a link to homepage', () => {
    renderComponent();
    const link = screen.getByRole('link', { name: /Take me home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/workspace');
  });

  it('should render with proper styling classes', () => {
    renderComponent();
    const container = screen.getByText('Page not found').closest('div');
    expect(container).toHaveClass('text-center');
  });
});
