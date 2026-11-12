// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';

const SIGNUP_ROLES = ['Customer', 'Authenticated'];
const SESSION_LENGTHS = ['1 day', '7 days', '30 days', '90 days'];
const TOKEN_LIFETIMES = ['5 minutes', '15 minutes', '30 minutes', '1 hour'];
const EMAIL_TEMPLATES = [
  { key: 'verify', name: 'Verify email', hint: 'Sent right after signup' },
  { key: 'reset', name: 'Reset password', hint: 'Sent when a user forgets their password' },
  { key: 'welcome', name: 'Welcome', hint: 'Sent after the email is verified' },
];

const CARD_CLASS = 'rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] p-4 space-y-4';
const INPUT_CLASS = 'h-9 w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] px-3 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-green-600';
const BTN_CLASS = 'h-8 px-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] hover:bg-gray-50 text-sm text-gray-700 transition-colors cursor-pointer';
const CHECKBOX_CLASS = 'mt-0.5 h-4 w-4 accent-green-700';

// Sample defaults until the login settings endpoint is available
const INITIAL_REDIRECTS = ['https://app.acme.example/auth/callback', 'http://localhost:3000/auth/callback'];

export const DeveloperLoginSettings: React.FC = () => {
  const [allowSignup, setAllowSignup] = useState(true);
  const [signupRole, setSignupRole] = useState('Customer');
  const [requireVerification, setRequireVerification] = useState(true);
  const [senderName, setSenderName] = useState('Acme');
  const [minLength, setMinLength] = useState('10');
  const [maxAttempts, setMaxAttempts] = useState('5');
  const [requireMixed, setRequireMixed] = useState(true);
  const [redirects, setRedirects] = useState(INITIAL_REDIRECTS);
  const [newRedirect, setNewRedirect] = useState('');
  const [sessionLength, setSessionLength] = useState('30 days');
  const [tokenLifetime, setTokenLifetime] = useState('15 minutes');
  const [saved, setSaved] = useState(false);

  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setSaved(false);
  };

  const addRedirect = () => {
    const value = newRedirect.trim();
    if (!value || redirects.includes(value)) return;
    touch(setRedirects)([...redirects, value]);
    setNewRedirect('');
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-primary">Login settings</h3>
          <p className="text-sm text-secondary">
            How the people who use your app sign up and log in. These are separate from SereniBase users.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSaved(true)}
          className="h-9 px-4 rounded-lg bg-green-700 hover:bg-green-800 text-sm font-medium text-white transition-colors cursor-pointer"
        >
          {saved ? 'Saved' : 'Save changes'}
        </button>
      </div>

      {/* Sign up */}
      <section className={CARD_CLASS} aria-labelledby="login-signup">
        <h4 id="login-signup" className="text-sm font-semibold text-primary">Sign up</h4>
        <label className="flex items-start gap-2">
          <input type="checkbox" className={CHECKBOX_CLASS} checked={allowSignup} onChange={(e) => touch(setAllowSignup)(e.target.checked)} />
          <span>
            <span className="block text-sm font-medium text-primary">Allow new users to sign up</span>
            <span className="block text-xs text-secondary">Turn off to allow only users you add yourself.</span>
          </span>
        </label>
        <label className="block max-w-xs space-y-1 text-xs font-medium text-secondary">
          Role given to new users
          <select value={signupRole} onChange={(e) => touch(setSignupRole)(e.target.value)} className={INPUT_CLASS}>
            {SIGNUP_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </section>

      {/* Email */}
      <section className={CARD_CLASS} aria-labelledby="login-email">
        <h4 id="login-email" className="text-sm font-semibold text-primary">Email</h4>
        <label className="flex items-start gap-2">
          <input type="checkbox" className={CHECKBOX_CLASS} checked={requireVerification} onChange={(e) => touch(setRequireVerification)(e.target.checked)} />
          <span>
            <span className="block text-sm font-medium text-primary">Require email verification</span>
            <span className="block text-xs text-secondary">Users must confirm their email before they can log in.</span>
          </span>
        </label>
        <label className="block max-w-xs space-y-1 text-xs font-medium text-secondary">
          Sender name
          <input value={senderName} onChange={(e) => touch(setSenderName)(e.target.value)} className={INPUT_CLASS} />
        </label>
        <div>
          <p className="text-xs font-medium text-secondary mb-1">Email templates</p>
          {EMAIL_TEMPLATES.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-sm font-medium text-primary">{t.name}</p>
                <p className="text-xs text-secondary">{t.hint}</p>
              </div>
              <button type="button" className={BTN_CLASS} aria-label={`Edit ${t.name} template`}>Edit</button>
            </div>
          ))}
        </div>
      </section>

      {/* Passwords & security */}
      <section className={CARD_CLASS} aria-labelledby="login-passwords">
        <h4 id="login-passwords" className="text-sm font-semibold text-primary">Passwords &amp; security</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1 text-xs font-medium text-secondary">
            Minimum length
            <input type="number" min={6} max={128} value={minLength} onChange={(e) => touch(setMinLength)(e.target.value)} className={INPUT_CLASS} />
          </label>
          <label className="space-y-1 text-xs font-medium text-secondary">
            Lock account after failed attempts
            <input type="number" min={1} max={100} value={maxAttempts} onChange={(e) => touch(setMaxAttempts)(e.target.value)} className={INPUT_CLASS} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-primary">
          <input type="checkbox" className="h-4 w-4 accent-green-700" checked={requireMixed} onChange={(e) => touch(setRequireMixed)(e.target.checked)} />
          Require at least one number and one letter
        </label>
      </section>

      {/* Allowed redirect addresses */}
      <section className={CARD_CLASS} aria-labelledby="login-redirects">
        <div>
          <h4 id="login-redirects" className="text-sm font-semibold text-primary">Allowed redirect addresses</h4>
          <p className="text-xs text-secondary">
            Where users land after verifying their email or resetting a password. Only these addresses are allowed.
          </p>
        </div>
        {redirects.map((url) => (
          <div key={url} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border-primary)] bg-gray-50 px-3 py-2">
            <span className="font-mono text-xs text-primary truncate">{url}</span>
            <button type="button" className={BTN_CLASS} onClick={() => touch(setRedirects)(redirects.filter((u) => u !== url))} aria-label={`Remove ${url}`}>
              Remove
            </button>
          </div>
        ))}
        <div className="space-y-1">
          <label htmlFor="login-new-redirect" className="text-xs font-medium text-secondary">New address</label>
          <div className="flex gap-2">
            <input
              id="login-new-redirect"
              value={newRedirect}
              placeholder="https://app.example.com/auth/callback"
              onChange={(e) => setNewRedirect(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addRedirect(); }}
              className={INPUT_CLASS}
            />
            <button type="button" className={BTN_CLASS} onClick={addRedirect}>Add</button>
          </div>
        </div>
      </section>

      {/* Sessions */}
      <section className={CARD_CLASS} aria-labelledby="login-sessions">
        <h4 id="login-sessions" className="text-sm font-semibold text-primary">Sessions</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1 text-xs font-medium text-secondary">
            Keep users signed in for up to
            <select value={sessionLength} onChange={(e) => touch(setSessionLength)(e.target.value)} className={INPUT_CLASS}>
              {SESSION_LENGTHS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-secondary">
            Login token lifetime
            <select value={tokenLifetime} onChange={(e) => touch(setTokenLifetime)(e.target.value)} className={INPUT_CLASS}>
              {TOKEN_LIFETIMES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <p className="text-xs text-secondary">The SDK renews login tokens automatically, so users stay signed in without noticing.</p>
      </section>
    </div>
  );
};

export default DeveloperLoginSettings;
