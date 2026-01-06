import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const STYLE_ID = 'skeleton-shimmer-style';

describe('Skeleton components', () => {
  beforeEach(() => {
    document.getElementById(STYLE_ID)?.remove();
    vi.resetModules();
  });

  it('injects shimmer keyframes style once on import', async () => {
    expect(document.getElementById(STYLE_ID)).toBeNull();

    await import('../Skeleton/Skeleton');

    const style = document.getElementById(STYLE_ID);
    expect(style).not.toBeNull();
    expect(style?.tagName.toLowerCase()).toBe('style');

    // Import again should not duplicate the style tag
    await import('../Skeleton/Skeleton');
    expect(document.head.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);
  });

  it('renders a status element with sizing and variant classes', async () => {
    const { Skeleton } = await import('../Skeleton/Skeleton');

    render(
      <Skeleton
        width={123}
        height={45}
        variant="circular"
        animation="pulse"
        className="extra"
      />
    );

    const el = screen.getByRole('status', { name: 'Loading...' });
    expect(el).toHaveClass('rounded-full');
    expect(el).toHaveClass('animate-pulse');
    expect(el).toHaveClass('extra');
    expect(el).toHaveStyle({ width: '123px', height: '45px' });
  });

  it('SidebarTableSkeleton renders nested view skeletons by default', async () => {
    const { SidebarTableSkeleton } = await import('../Skeleton/SidebarTableSkeleton');

    render(<SidebarTableSkeleton />);

    // Table row: 3 skeletons, plus 3 nested rows * 2 skeletons each = 6
    expect(screen.getAllByRole('status', { name: 'Loading...' })).toHaveLength(9);
  });

  it('SidebarSkeleton uses itemCount and hides nested views after first 3', async () => {
    const { SidebarSkeleton } = await import('../Skeleton/SidebarSkeleton');

    render(<SidebarSkeleton itemCount={5} />);

    // 1 create-view skeleton + (first 3 tables with views: 9 each) + (remaining 2 tables no views: 3 each)
    expect(screen.getAllByRole('status', { name: 'Loading...' })).toHaveLength(34);
  });
});
