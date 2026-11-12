// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeveloperLoginSettings, { DeveloperLoginSettings as NamedLoginSettings } from '../DeveloperLoginSettings';

const CALLBACK = 'https://app.acme.example/auth/callback';

describe('DeveloperLoginSettings', () => {
  it('exports the same component as default and named export', () => {
    expect(DeveloperLoginSettings).toBe(NamedLoginSettings);
  });

  it('renders the heading, description and all sections', () => {
    render(<DeveloperLoginSettings />);

    expect(screen.getByRole('heading', { name: 'Login settings' })).toBeInTheDocument();
    expect(screen.getByText(/separate from SereniBase users/)).toBeInTheDocument();
    ['Sign up', 'Email', 'Passwords & security', 'Allowed redirect addresses', 'Sessions'].forEach((name) => {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    });
  });

  it('offers only Customer and Authenticated as the new user role', () => {
    render(<DeveloperLoginSettings />);

    const select = screen.getByLabelText('Role given to new users') as HTMLSelectElement;
    expect(select.value).toBe('Customer');
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['Customer', 'Authenticated']);

    fireEvent.change(select, { target: { value: 'Authenticated' } });
    expect(select.value).toBe('Authenticated');
  });

  it('toggles the sign up and verification checkboxes', () => {
    render(<DeveloperLoginSettings />);

    const signup = screen.getByLabelText(/Allow new users to sign up/) as HTMLInputElement;
    const verify = screen.getByLabelText(/Require email verification/) as HTMLInputElement;
    expect(signup.checked).toBe(true);
    expect(verify.checked).toBe(true);

    fireEvent.click(signup);
    fireEvent.click(verify);
    expect(signup.checked).toBe(false);
    expect(verify.checked).toBe(false);
  });

  it('edits the sender name and password fields', () => {
    render(<DeveloperLoginSettings />);

    const sender = screen.getByLabelText('Sender name') as HTMLInputElement;
    expect(sender.value).toBe('Acme');
    fireEvent.change(sender, { target: { value: 'Beta' } });
    expect(sender.value).toBe('Beta');

    const min = screen.getByLabelText('Minimum length') as HTMLInputElement;
    const attempts = screen.getByLabelText('Lock account after failed attempts') as HTMLInputElement;
    expect(min.value).toBe('10');
    expect(attempts.value).toBe('5');
    fireEvent.change(min, { target: { value: '12' } });
    expect(min.value).toBe('12');

    const mixed = screen.getByLabelText(/Require at least one number/) as HTMLInputElement;
    fireEvent.click(mixed);
    expect(mixed.checked).toBe(false);
  });

  it('lists the three email templates with Edit buttons', () => {
    render(<DeveloperLoginSettings />);

    ['Verify email', 'Reset password', 'Welcome'].forEach((name) => {
      expect(screen.getByRole('button', { name: `Edit ${name} template` })).toBeInTheDocument();
    });
  });

  it('removes a redirect address', () => {
    render(<DeveloperLoginSettings />);

    fireEvent.click(screen.getByRole('button', { name: `Remove ${CALLBACK}` }));
    expect(screen.queryByText(CALLBACK)).not.toBeInTheDocument();
    expect(screen.getByText('http://localhost:3000/auth/callback')).toBeInTheDocument();
  });

  it('adds a redirect address with the button and Enter, ignoring blanks and duplicates', () => {
    render(<DeveloperLoginSettings />);

    const input = screen.getByLabelText('New address') as HTMLInputElement;
    const add = screen.getByRole('button', { name: 'Add' });

    fireEvent.click(add);
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(2);

    fireEvent.change(input, { target: { value: CALLBACK } });
    fireEvent.click(add);
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(2);

    fireEvent.change(input, { target: { value: ' https://new.example/cb ' } });
    fireEvent.click(add);
    expect(screen.getByText('https://new.example/cb')).toBeInTheDocument();
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: 'https://enter.example/cb' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('https://enter.example/cb')).toBeInTheDocument();
  });

  it('changes the session length and token lifetime', () => {
    render(<DeveloperLoginSettings />);

    const session = screen.getByLabelText('Keep users signed in for up to') as HTMLSelectElement;
    const token = screen.getByLabelText('Login token lifetime') as HTMLSelectElement;
    expect(session.value).toBe('30 days');
    expect(token.value).toBe('15 minutes');

    fireEvent.change(session, { target: { value: '7 days' } });
    fireEvent.change(token, { target: { value: '1 hour' } });
    expect(session.value).toBe('7 days');
    expect(token.value).toBe('1 hour');
    expect(screen.getByText(/SDK renews login tokens automatically/)).toBeInTheDocument();
  });

  it('shows Saved after saving and resets once something changes', () => {
    render(<DeveloperLoginSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Sender name'), { target: { value: 'Gamma' } });
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });
});
