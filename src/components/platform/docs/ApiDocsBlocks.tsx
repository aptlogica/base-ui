// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import type { DocEndpoint, DocExample, HttpMethod } from './apiDocsContent';
import { statusText, toResponse, toSnippet, type SnippetLanguage } from './apiDocsSnippets';

// A warning on the theme's surface, with an amber icon as the app's other warnings have, so it reads well in
// light and dark mode
export const WarningNote: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <div role="note" className="flex items-start gap-2 p-3 rounded-xl border border-[var(--color-border-primary)] bg-gray-50 text-sm text-secondary">
    <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" aria-hidden="true" />
    <div className="min-w-0">{children}</div>
  </div>
);

// Badge colors come from the API docs section of common.css, which has a light and a dark set
const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: 'api-docs-get',
  POST: 'api-docs-post',
  PUT: 'api-docs-patch',
  PATCH: 'api-docs-patch',
  DELETE: 'api-docs-delete',
  QUERY: 'api-docs-query',
};

export const MethodBadge: React.FC<Readonly<{ method: HttpMethod; size?: 'sm' | 'md' }>> = ({ method, size = 'md' }) => (
  <span
    className={`${METHOD_CLASS[method]} inline-block flex-none text-center rounded-md font-mono font-semibold ${
      size === 'sm' ? 'w-[50px] py-px text-[10px]' : 'min-w-[58px] px-2 py-0.5 text-[11px]'
    }`}
  >
    {method}
  </span>
);

export const StatusBadge: React.FC<Readonly<{ status: number }>> = ({ status }) => (
  <span className={`${status < 300 ? 'api-docs-get' : 'api-docs-delete'} flex-none rounded-full px-2 py-px font-mono text-[11px] font-semibold`}>
    {statusText(status)}
  </span>
);

// Copies text and shows a tick for a moment
const useCopy = (): [boolean, (text: string) => void] => {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available (e.g. insecure context); nothing else to do
    }
  };
  return [copied, (text) => void copy(text)];
};

export const CopyButton: React.FC<Readonly<{ text: string; label: string; showText?: boolean; bordered?: boolean }>> = ({
  text,
  label,
  showText = false,
  bordered = false,
}) => {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={label}
      className={`flex flex-none items-center justify-center gap-1.5 rounded-lg text-xs text-secondary hover:text-primary transition-colors ${
        showText ? 'h-7 px-2.5' : 'w-8 h-8'
      } ${bordered ? 'border border-[var(--color-border-primary)] bg-[var(--color-card)]' : 'hover:bg-gray-100'}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 api-docs-accent" /> : <Copy className="w-3.5 h-3.5" />}
      {showText && <span>{copied ? 'Copied' : 'Copy'}</span>}
    </button>
  );
};

// ---- Code highlighting ----

export type CodeKind = 'shell' | 'js' | 'json' | 'http' | 'plain';

interface Token {
  text: string;
  className?: string;
}

const STRING = String.raw`"(?:[^"\\]|\\.)*"`;
const KEYWORDS = /^(?:const|await|curl|new|fetch)$/;

// Strings and keywords stand out in commands; JSON gets keys, strings, numbers, literals and punctuation
const tokenize = (line: string, kind: CodeKind): Token[] => {
  if (kind === 'plain') return [{ text: line }];
  const json = kind === 'json';
  const pattern = json
    ? new RegExp(String.raw`${STRING}|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b(?:true|false|null)\b`, 'g')
    : new RegExp(String.raw`${STRING}|'[^']*'|\b(?:const|await|curl|new|fetch)\b`, 'g');
  const plain = json ? 'api-docs-tok-punct' : undefined;
  const tokens: Token[] = [];
  let last = 0;
  for (const match of line.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) tokens.push({ text: line.slice(last, at), className: plain });
    const text = match[0];
    let className: string;
    if (text.startsWith('"') || text.startsWith("'")) {
      className = json && /^\s*:/.test(line.slice(at + text.length)) ? 'api-docs-tok-key' : 'api-docs-tok-string';
    } else if (KEYWORDS.test(text)) {
      className = 'api-docs-tok-keyword';
    } else if (/^(?:true|false|null)$/.test(text)) {
      className = 'api-docs-tok-literal';
    } else {
      className = 'api-docs-tok-number';
    }
    tokens.push({ text, className });
    last = at + text.length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last), className: plain });
  return tokens;
};

// An HTTP response: the status line and headers, then the JSON body
const highlightLines = (code: string, kind: CodeKind): Token[][] => {
  const lines = code.split('\n');
  if (kind !== 'http') return lines.map((line) => tokenize(line, kind));
  const blank = lines.indexOf('');
  return lines.map((line, i) =>
    blank === -1 || i < blank ? [{ text: line, className: 'api-docs-tok-meta' }] : tokenize(line, 'json')
  );
};

interface CodePanelProps {
  code: string;
  kind: CodeKind;
  // What the copy button copies, e.g. "request"
  label: string;
  // Left side of the panel's bar: a title, tabs
  header?: React.ReactNode;
  lineNumbers?: boolean;
}

// Code with a bar (title, tabs, copy), line numbers and highlighting
export const CodePanel: React.FC<Readonly<CodePanelProps>> = ({ code, kind, label, header, lineNumbers = true }) => {
  const lines = highlightLines(code, kind);
  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--color-border-primary)] bg-gray-50">
        <div className="flex flex-1 min-w-0 flex-wrap items-center gap-1.5">{header}</div>
        <CopyButton text={code} label={`Copy ${label}`} showText />
      </div>
      <pre className="overflow-x-auto py-3 font-mono text-[13px] leading-[21px] text-primary">
        <code className="block min-w-max">
          {lines.map((tokens, i) => (
            // Lines are static content, so their position is a stable key
            <div key={i} className="flex min-h-[21px]">
              {/* The number is drawn by CSS, so it is never part of the code's text or a selection */}
              {lineNumbers && (
                <span
                  data-line={i + 1}
                  className="api-docs-line-no flex-none w-11 pr-3.5 text-right select-none before:content-[attr(data-line)]"
                  aria-hidden="true"
                />
              )}
              <span className={`whitespace-pre pr-4 ${lineNumbers ? '' : 'pl-4'}`}>
                {tokens.map((t, j) => (
                  <span key={j} className={t.className}>{t.text}</span>
                ))}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

// A panel title in the code bar
export const PanelTitle: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <span className="px-1.5 text-xs font-semibold text-secondary">{children}</span>
);

// ---- Text blocks ----

export const DocTable: React.FC<Readonly<{ head: string[]; rows: React.ReactNode[][] }>> = ({ head, rows }) => (
  <div className="overflow-x-auto rounded-xl border border-[var(--color-border-primary)]">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left">
        <tr>
          {head.map((h) => (
            <th key={h} className="px-3.5 py-2.5 text-xs font-semibold text-secondary whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Rows are static content, so their position is a stable key */}
        {rows.map((cells, i) => (
          <tr key={i} className="border-t border-[var(--color-border-primary)] align-top">
            {cells.map((cell, j) => (
              <td key={j} className="px-3.5 py-3 leading-relaxed text-secondary">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const InlineCode: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <code className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-primary">{children}</code>
);

// A list with small round markers
export const Bullets: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <ul className="space-y-2.5 text-sm leading-relaxed text-secondary">{children}</ul>
);

export const Bullet: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <li className="flex gap-2.5">
    <span className="flex-none w-1.5 h-1.5 mt-2 rounded-full bg-gray-400" aria-hidden="true" />
    <span className="min-w-0">{children}</span>
  </li>
);

// ---- Examples ----

const LANGUAGES: { key: SnippetLanguage; label: string }[] = [
  { key: 'curl', label: 'cURL' },
  { key: 'javascript', label: 'JavaScript' },
];

interface ExamplesPanelProps {
  examples: DocExample[];
  baseUrl: string;
  language: SnippetLanguage;
  onLanguage: (language: SnippetLanguage) => void;
}

// Scenarios to pick from, then the request (cURL or JavaScript) and the response of the one picked
export const ExamplesPanel: React.FC<Readonly<ExamplesPanelProps>> = ({ examples, baseUrl, language, onLanguage }) => {
  const [picked, setPicked] = useState(0);
  const example = examples[Math.min(picked, examples.length - 1)];
  if (!example) return null;

  return (
    <div className="space-y-3">
      {examples.length > 1 ? (
        <div role="group" aria-label="Examples" className="flex flex-wrap gap-2">
          {examples.map((ex, i) => {
            const on = ex === example;
            return (
              <button
                key={ex.title}
                type="button"
                onClick={() => setPicked(i)}
                aria-pressed={on}
                className={`flex items-center gap-2 min-h-[34px] py-1 pl-1.5 pr-3 rounded-lg border text-left text-[13px] font-medium transition-colors ${
                  on ? 'border-gray-400 bg-[var(--color-card)] text-primary shadow-xs' : 'border-[var(--color-border-primary)] text-secondary hover:bg-gray-50'
                }`}
              >
                <StatusBadge status={ex.status} />
                {ex.title}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <StatusBadge status={example.status} />
          {example.title}
        </div>
      )}
      {example.description && <p className="text-sm leading-relaxed text-secondary">{example.description}</p>}
      <CodePanel
        code={toSnippet(language, baseUrl, example)}
        kind={language === 'curl' ? 'shell' : 'js'}
        label="request"
        header={
          <>
            <PanelTitle>Request</PanelTitle>
            {LANGUAGES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={language === key}
                onClick={() => onLanguage(key)}
                className={`h-7 px-2.5 rounded-md border text-xs font-medium transition-colors ${
                  language === key ? 'border-[var(--color-border-primary)] bg-[var(--color-card)] text-primary shadow-xs' : 'border-transparent text-secondary hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </>
        }
      />
      <CodePanel
        code={toResponse(example)}
        kind="http"
        label="response"
        header={
          <>
            <PanelTitle>Response</PanelTitle>
            <StatusBadge status={example.status} />
          </>
        }
      />
    </div>
  );
};

// ---- Endpoint page ----

// The method and path, with {table}, {record} and the like picked out, and a copy button
const EndpointBar: React.FC<Readonly<{ method: HttpMethod; path: string; baseUrl: string }>> = ({ method, path, baseUrl }) => (
  <div className="flex items-center gap-3 py-2 pl-3 pr-2 rounded-xl border border-[var(--color-border-primary)] bg-gray-50">
    <MethodBadge method={method} />
    <code className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap font-mono text-sm text-primary">
      {path.split(/(\{[^}]+\})/).map((part, i) =>
        part.startsWith('{') ? (
          <span key={i} className="api-docs-param">{part}</span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </code>
    <CopyButton text={`${baseUrl}${path}`} label="Copy the endpoint URL" bordered />
  </div>
);

// Section ids on an endpoint page, for On this page
export const endpointSections = (endpoint: DocEndpoint): { id: string; label: string }[] => [
  { id: 'endpoint', label: 'Endpoint' },
  ...(endpoint.params ? [{ id: 'parameters', label: 'Parameters' }] : []),
  ...(endpoint.notes ? [{ id: 'notes', label: 'Good to know' }] : []),
  { id: 'examples', label: 'Examples' },
];

export const sectionDomId = (id: string) => `docs-section-${id}`;

const PARAM_PLACE: Record<string, string> = { path: 'Path', query: 'Query', body: 'Body', header: 'Header' };

const SubHeading: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <h3 className="text-lg font-semibold text-primary">{children}</h3>
);

interface EndpointDocProps {
  endpoint: DocEndpoint;
  baseUrl: string;
  language: SnippetLanguage;
  onLanguage: (language: SnippetLanguage) => void;
}

// An endpoint: method and path, what it does, its parameters, notes and scenarios
export const EndpointDoc: React.FC<Readonly<EndpointDocProps>> = ({ endpoint, baseUrl, language, onLanguage }) => (
  <div className="space-y-9">
    <section id={sectionDomId('endpoint')} className="scroll-mt-6 space-y-4">
      <p className="text-[15px] leading-relaxed text-secondary">{endpoint.summary}</p>
      <EndpointBar method={endpoint.method} path={endpoint.path} baseUrl={baseUrl} />
    </section>
    {endpoint.params && (
      <section id={sectionDomId('parameters')} className="scroll-mt-6 space-y-3">
        <SubHeading>Parameters</SubHeading>
        <DocTable
          head={['Parameter', 'In', 'Description']}
          rows={endpoint.params.map((p) => [<InlineCode key="n">{p.name}</InlineCode>, PARAM_PLACE[p.in], p.description])}
        />
      </section>
    )}
    {endpoint.notes && (
      <section id={sectionDomId('notes')} className="scroll-mt-6 space-y-3">
        <SubHeading>Good to know</SubHeading>
        <Bullets>
          {endpoint.notes.map((note) => (
            <Bullet key={note}>{note}</Bullet>
          ))}
        </Bullets>
      </section>
    )}
    <section id={sectionDomId('examples')} className="scroll-mt-6 space-y-3">
      <SubHeading>Examples</SubHeading>
      {/* A new endpoint starts on its first scenario */}
      <ExamplesPanel key={endpoint.id} examples={endpoint.examples} baseUrl={baseUrl} language={language} onLanguage={onLanguage} />
    </section>
  </div>
);
