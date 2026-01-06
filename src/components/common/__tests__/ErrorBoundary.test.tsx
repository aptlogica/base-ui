import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>OK</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders fallback when provided and child throws', () => {
    const Boom = () => {
      throw new Error('boom');
    };

    render(
      <ErrorBoundary fallback={<div>Fallback UI</div>}>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText('Fallback UI')).toBeInTheDocument();
  });

  it('calls onError when child throws', () => {
    const onError = vi.fn();
    const Boom = () => {
      throw new Error('boom');
    };

    render(
      <ErrorBoundary onError={onError}>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('reload button triggers window.location.reload', async () => {
    const user = userEvent.setup();

    const reload = vi.fn();
    // jsdom location.reload may be non-writable, so redefine
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });

    const Boom = () => {
      throw new Error('boom');
    };

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    await user.click(screen.getByRole('button', { name: 'Reload Application' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
