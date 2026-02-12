import { describe, it, expect, vi } from 'vitest';

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() })),
}));

vi.mock('../App.js', () => ({
  default: () => null,
}), { virtual: true });

describe('main.jsx', () => {
  it('creates root and renders App', async () => {
    const rootEl = document.createElement('div');
    rootEl.id = 'root';
    document.body.appendChild(rootEl);

    const { createRoot } = await import('react-dom/client');
    await import('../main.jsx');

    expect(createRoot).toHaveBeenCalledWith(rootEl);
  });
});
