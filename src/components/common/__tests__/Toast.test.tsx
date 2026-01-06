import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useEffect } from 'react';
import { ToastProvider, useToast } from '../Toast';

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function Trigger({ onId }: { onId?: (id: string) => void }) {
    const toast = useToast();
    useEffect(() => {
      const id = toast.show({ title: 'Hello', message: 'World', duration: 0 });
      onId?.(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
  }

  it('renders a toast via portal', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );

    expect(await screen.findByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('dismiss button removes the toast', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );

    expect(await screen.findByText('World')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => {
      expect(screen.queryByText('World')).not.toBeInTheDocument();
    });
  });

  it('auto dismisses after duration', async () => {
    vi.useFakeTimers();

    function AutoTrigger() {
      const toast = useToast();
      useEffect(() => {
        toast.show({ message: 'Auto', duration: 1000 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }

    render(
      <ToastProvider>
        <AutoTrigger />
      </ToastProvider>
    );

    // Flush the provider's internal setTimeout(0) that schedules auto-dismiss.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText('Auto')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
  });
});
