// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { Check, ChevronRight, Copy } from 'lucide-react';
import type { DocEndpoint, DocExample, HttpMethod } from './apiDocsContent';
import { statusText, toResponse, toSnippet, type SnippetLanguage } from './apiDocsSnippets';

const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: 'badge-brand',
  POST: 'badge-info',
  PATCH: 'badge-warning',
  DELETE: 'badge-error',
};

export const MethodBadge: React.FC<Readonly<{ method: HttpMethod }>> = ({ method }) => (
  <span className={`${METHOD_CLASS[method]} inline-block min-w-[58px] text-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold`}>
    {method}
  </span>
);

const StatusBadge: React.FC<Readonly<{ status: number }>> = ({ status }) => (
  <span className={`${status < 300 ? 'badge-brand' : 'badge-error'} rounded-full px-2 py-0.5 font-mono text-[11px] font-medium`}>
    {statusText(status)}
  </span>
);

// Code with a copy button that shows a tick for a moment
export const CodeBlock: React.FC<Readonly<{ code: string; label: string }>> = ({ code, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available (e.g. insecure context); nothing else to do
    }
  };

  return (
    <div className="relative rounded-xl border bg-gray-50">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-card)] text-[var(--text-color-tertiary)] hover:text-[var(--text-color-primary)]"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="overflow-x-auto p-3 pr-12 font-mono text-xs leading-relaxed text-primary">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const DocTable: React.FC<Readonly<{ head: string[]; rows: React.ReactNode[][] }>> = ({ head, rows }) => (
  <div className="overflow-x-auto rounded-xl border">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left">
        <tr>
          {head.map((h) => (
            <th key={h} className="px-3 py-2 font-medium text-secondary whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Rows are static content, so their position is a stable key */}
        {rows.map((cells, i) => (
          <tr key={i} className="border-t align-top">
            {cells.map((cell, j) => (
              <td key={j} className="px-3 py-2 text-primary">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const InlineCode: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
);

interface ExampleProps {
  example: DocExample;
  baseUrl: string;
  language: SnippetLanguage;
  defaultOpen?: boolean;
}

// One scenario: what to send and what comes back; opens and closes on click
export const ExampleBlock: React.FC<Readonly<ExampleProps>> = ({ example, baseUrl, language, defaultOpen = false }) => (
  <details open={defaultOpen} className="group rounded-xl border bg-card">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-primary [&::-webkit-details-marker]:hidden">
      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-90" />
      <span className="flex-1">{example.title}</span>
      <StatusBadge status={example.status} />
    </summary>
    <div className="space-y-3 px-4 pb-4">
      {example.description && <p className="text-sm text-secondary">{example.description}</p>}
      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-secondary">Request</div>
        <CodeBlock code={toSnippet(language, baseUrl, example)} label="request" />
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-secondary">Response</div>
        <CodeBlock code={toResponse(example)} label="response" />
      </div>
    </div>
  </details>
);

const PARAM_PLACE: Record<string, string> = { path: 'Path', query: 'Query', body: 'Body', header: 'Header' };

// An endpoint: method and path, what it does, its parameters and its scenarios
export const EndpointDoc: React.FC<Readonly<{ endpoint: DocEndpoint; baseUrl: string; language: SnippetLanguage }>> = ({
  endpoint,
  baseUrl,
  language,
}) => (
  <section id={`docs-${endpoint.id}`} className="scroll-mt-4 space-y-4">
    <h3 className="text-lg font-semibold text-primary">{endpoint.title}</h3>
    <div className="flex flex-wrap items-center gap-2">
      <MethodBadge method={endpoint.method} />
      <code className="font-mono text-sm text-primary break-all">{endpoint.path}</code>
    </div>
    <p className="text-sm text-secondary">{endpoint.summary}</p>
    {endpoint.params && (
      <DocTable
        head={['Parameter', 'In', 'Description']}
        rows={endpoint.params.map((p) => [<InlineCode key="n">{p.name}</InlineCode>, PARAM_PLACE[p.in], p.description])}
      />
    )}
    {endpoint.notes && (
      <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
        {endpoint.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    )}
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-primary">Examples</h4>
      {endpoint.examples.map((example, i) => (
        <ExampleBlock
          key={example.title}
          example={example}
          baseUrl={baseUrl}
          language={language}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  </section>
);
