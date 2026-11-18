// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApiEnabledBadge } from '../ApiEnabledBadge';

describe('ApiEnabledBadge', () => {
  it('renders an accessible API pill', () => {
    render(<ApiEnabledBadge />);
    const badge = screen.getByLabelText('API enabled');
    expect(badge.textContent).toContain('API');
    expect(badge.className).toContain('badge-brand');
    expect(badge.getAttribute('title')).toBe('API enabled');
  });
});
