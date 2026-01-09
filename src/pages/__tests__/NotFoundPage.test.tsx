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

  it('should render the 404 heading', () => {
    renderComponent();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('404 - Page Not Found');
  });

  it('should render the error message', () => {
    renderComponent();
    const message = screen.getByText('Sorry, the page you are looking for does not exist.');
    expect(message).toBeInTheDocument();
  });

  it('should render a link to homepage', () => {
    renderComponent();
    const link = screen.getByRole('link', { name: /Go to Home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/homepage');
  });

  it('should render with proper styling classes', () => {
    renderComponent();
    const container = screen.getByText('404 - Page Not Found').closest('div');
    expect(container).toHaveClass('text-center');
  });
});
