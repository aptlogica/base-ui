// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getApiOrigin } from '../service/clientService';
import { useWorkspaceApi } from '../components/platform/useWorkspaceApi';
import LiveDocsLinks, { liveDocsUrls } from '../components/platform/LiveDocsLinks';
import {
  ENDPOINT_GROUPS,
  ENDPOINT_SUMMARY,
  ERROR_CODES,
  FIELD_VALUES,
  ID_PREFIXES,
  IDEMPOTENCY_EXAMPLES,
  RATE_LIMIT_EXAMPLE,
  READ_ONLY_VALUES,
  RESPONSE_EXAMPLES,
  SAMPLE_BASE_PATH,
} from '../components/platform/docs/apiDocsContent';
import {
  CodeBlock,
  DocTable,
  EndpointDoc,
  ExampleBlock,
  InlineCode,
  MethodBadge,
} from '../components/platform/docs/ApiDocsBlocks';
import type { SnippetLanguage } from '../components/platform/docs/apiDocsSnippets';

// Left menu: guide sections, then one entry per endpoint, then reference sections
const NAV: { title: string; items: { id: string; label: string }[] }[] = [
  {
    title: 'Getting started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'live-docs', label: 'Live docs' },
      { id: 'responses', label: 'Responses' },
      { id: 'ids-and-names', label: 'IDs and names' },
    ],
  },
  ...ENDPOINT_GROUPS.map((group) => ({
    title: group.title,
    items: group.endpoints.map((e) => ({ id: e.id, label: e.title })),
  })),
  {
    title: 'Reference',
    items: [
      { id: 'field-values', label: 'Field values' },
      { id: 'safe-retries', label: 'Safe retries' },
      { id: 'errors', label: 'Errors' },
      { id: 'limits', label: 'Limits' },
    ],
  },
];

const SECTION_IDS = NAV.flatMap((group) => group.items.map((item) => item.id));

const LANGUAGES: { key: SnippetLanguage; label: string }[] = [
  { key: 'curl', label: 'cURL' },
  { key: 'javascript', label: 'JavaScript' },
];

const Section: React.FC<Readonly<{ id: string; title: string; children: React.ReactNode }>> = ({ id, title, children }) => (
  <section id={`docs-${id}`} className="scroll-mt-4 space-y-4">
    <h2 className="text-xl font-semibold text-primary">{title}</h2>
    {children}
  </section>
);

const Bullets: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">{children}</ul>
);

const Note: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <div role="note" className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900">
    {children}
  </div>
);

// How to use the workspace API: every endpoint with request and response examples.
// Route: /workspace/:workspaceId/developer/api-docs
const ApiDocsPage: React.FC = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { data: status } = useWorkspaceApi(workspaceId);
  const [language, setLanguage] = useState<SnippetLanguage>('curl');
  const [activeId, setActiveId] = useState(SECTION_IDS[0]);
  const contentRef = useRef<HTMLDivElement>(null);

  // The examples use the workspace's own address once its API is on, and a sample one until then
  const enabled = Boolean(status?.enabled && status.base_path);
  const baseUrl = `${getApiOrigin()}${enabled ? status?.base_path : SAMPLE_BASE_PATH}`;
  const liveDocs = liveDocsUrls(baseUrl);

  const goTo = (id: string) => {
    document.getElementById(`docs-${id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
  };

  // Highlights the last section whose heading has scrolled to the top of the content
  const handleScroll = () => {
    const top = contentRef.current?.getBoundingClientRect().top ?? 0;
    let current = SECTION_IDS[0];
    for (const id of SECTION_IDS) {
      const el = document.getElementById(`docs-${id}`);
      if (el && el.getBoundingClientRect().top - top <= 96) current = id;
    }
    setActiveId(current);
  };

  return (
    <div className="flex flex-col h-screen w-screen min-w-0 bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate(workspaceId ? `/workspace/${workspaceId}` : '/workspace')}
          className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Back to workspace"
        >
          <ArrowLeft className="text-[var(--text-color-tertiary)] h-5 w-5" />
        </button>
        <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
          <BookOpen className="text-green-600 h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-primary truncate">Workspace API docs</h1>
          <p className="text-sm text-secondary truncate">Read and write this workspace's records from your own apps over HTTP</p>
        </div>
        <div role="group" aria-label="Code examples in" className="flex flex-shrink-0 rounded-xl border bg-gray-50 p-0.5">
          {LANGUAGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={language === key}
              onClick={() => setLanguage(key)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${language === key ? 'bg-card shadow-xs font-medium text-primary' : 'text-secondary hover:text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Left menu */}
        <nav className="hidden md:block w-[220px] flex-shrink-0 border-r bg-gray-50 p-2 overflow-y-auto" aria-label="Docs sections">
          {NAV.map((group) => (
            <div key={group.title} className="mb-3">
              <div className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-secondary">{group.title}</div>
              {group.items.map(({ id, label }) => {
                const isActive = activeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => goTo(id)}
                    aria-current={isActive ? 'location' : undefined}
                    className={`relative w-full px-3 py-1.5 rounded-xl text-sm text-left transition-colors duration-200 ${isActive ? 'bg-card shadow-xs font-medium text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-green-600" />}
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div ref={contentRef} onScroll={handleScroll} className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-4xl p-6 space-y-12">
            <Section id="introduction" title="Introduction">
              <p className="text-sm text-secondary">
                The workspace API lets your own apps, sites and scripts read and write the records of this workspace.
                Bases, tables and fields are still set up in SereniBase; the API works with the data inside them.
              </p>
              <div className="space-y-1">
                <div className="text-sm font-medium text-primary">Base URL</div>
                <CodeBlock code={baseUrl} label="base URL" />
                <p className="text-xs text-secondary">
                  {enabled
                    ? 'This is your workspace\'s address; the examples below use it. Every endpoint path is added to it.'
                    : 'The API is not turned on for this workspace yet, so the examples use a sample address. An owner or co-owner can turn it on from Home → Workspace API.'}
                </p>
              </div>
              <Note>
                Development only: there are no API keys yet, so anyone with the base URL can read and change this
                workspace's data. The API answers only on servers started with PUBLIC_API_OPEN_ACCESS=true.
              </Note>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary">Endpoints</h3>
                <DocTable
                  head={['Method', 'Path', 'What it does']}
                  rows={ENDPOINT_SUMMARY.map((e) => [
                    <MethodBadge key="m" method={e.method} />,
                    <code key="p" className="font-mono text-xs break-all">{e.path}</code>,
                    e.does,
                  ])}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary">Every request</h3>
                <Bullets>
                  <li>Send bodies as JSON with the header <InlineCode>Content-Type: application/json</InlineCode>. Every response is JSON.</li>
                  <li>No API key or login is needed yet.</li>
                  <li>Browser apps can call it from any website: CORS is open and no cookies are used.</li>
                  <li>
                    Every response has an <InlineCode>X-Request-Id</InlineCode> header. You can send your own (up to 64
                    letters, digits, _ or -) to find a request in the server logs.
                  </li>
                  <li>The cURL examples are for macOS and Linux terminals. On Windows, run them in Git Bash or WSL, or use the JavaScript examples.</li>
                </Bullets>
              </div>
            </Section>

            <Section id="live-docs" title="Live docs">
              <p className="text-sm text-secondary">
                This page explains the API with sample data. Your workspace also serves docs built from its own bases,
                tables and fields: each table's real field names, types and select options, and what can be written.
                They update within about 10 seconds when a table changes.
              </p>
              <DocTable
                head={['Page', 'Address', 'Use it to']}
                rows={[
                  ['Swagger UI', <code key="a" className="font-mono text-xs break-all">{liveDocs.swagger}</code>, 'Try requests from the browser'],
                  ['ReDoc', <code key="a" className="font-mono text-xs break-all">{liveDocs.redoc}</code>, 'Read the reference for every table'],
                  ['OpenAPI spec', <code key="a" className="font-mono text-xs break-all">{liveDocs.spec}</code>, 'Import into Postman or Insomnia, or generate code'],
                ]}
              />
              <Bullets>
                <li>
                  Add <InlineCode>?base=Sales</InlineCode> (a base name or <InlineCode>bse_…</InlineCode> ID) to any of them to show
                  only one base. It helps when a workspace has many tables.
                </li>
                <li>Swagger UI's "Try it out" sends real requests: changes it makes are saved in your tables.</li>
              </Bullets>
              {enabled ? (
                <LiveDocsLinks baseUrl={baseUrl} />
              ) : (
                <p className="text-xs text-secondary">The addresses above are samples. Turn the API on to open your workspace's live docs.</p>
              )}
            </Section>

            <Section id="responses" title="Responses">
              <p className="text-sm text-secondary">
                Every response has the same three parts: <InlineCode>data</InlineCode> is the result (null on errors),{' '}
                <InlineCode>error</InlineCode> is null on success, and <InlineCode>meta</InlineCode> has the request ID,
                plus paging details on lists. Reads, updates and deletes return 200; creates return 201.
              </p>
              <div className="space-y-1">
                <div className="text-sm font-medium text-primary">One item</div>
                <CodeBlock code={JSON.stringify(RESPONSE_EXAMPLES.one, null, 2)} label="one item response" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-primary">A list of records</div>
                <CodeBlock code={JSON.stringify(RESPONSE_EXAMPLES.list, null, 2)} label="list response" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-primary">An error</div>
                <CodeBlock code={JSON.stringify(RESPONSE_EXAMPLES.error, null, 2)} label="error response" />
              </div>
            </Section>

            <Section id="ids-and-names" title="IDs and names">
              <DocTable
                head={['Prefix', 'Identifies', 'Example']}
                rows={ID_PREFIXES.map((p) => [
                  <InlineCode key="p">{p.prefix}</InlineCode>,
                  p.what,
                  <code key="e" className="font-mono text-xs break-all">{p.example}</code>,
                ])}
              />
              <Bullets>
                <li>Wherever a path has {'{base}'} or {'{table}'}, and wherever you name a field, you can use the name or the ID.</li>
                <li>Names are exact and case-sensitive. Encode them in URLs: <InlineCode>Sales%20Team</InlineCode>, <InlineCode>In%2FOut</InlineCode>.</li>
                <li>If two items share a name you get <InlineCode>409 ambiguous_name</InlineCode> with their IDs. IDs never change, so apps that must survive renames should use them.</li>
              </Bullets>
            </Section>

            {ENDPOINT_GROUPS.map((group) => (
              <div key={group.id} className="space-y-12">
                <h2 className="text-xl font-semibold text-primary border-b pb-2">{group.title}</h2>
                {group.endpoints.map((endpoint) => (
                  <EndpointDoc key={endpoint.id} endpoint={endpoint} baseUrl={baseUrl} language={language} />
                ))}
              </div>
            ))}

            <Section id="field-values" title="Field values">
              <p className="text-sm text-secondary">
                What to send for each field type, and which filter operators it supports. Values come back in the
                same form. <InlineCode>null</InlineCode> empties a field.
              </p>
              <DocTable
                head={['Type', 'Send', 'Example', 'Filter operators']}
                rows={FIELD_VALUES.map((f) => [
                  <InlineCode key="t">{f.type}</InlineCode>,
                  f.write,
                  <code key="e" className="font-mono text-xs whitespace-nowrap">{f.example}</code>,
                  f.filters,
                ])}
              />
              <h3 className="text-sm font-semibold text-primary">Read-only fields</h3>
              <p className="text-sm text-secondary">These come back in records but can't be sent when creating or updating.</p>
              <DocTable
                head={['Type', 'Comes back as']}
                rows={READ_ONLY_VALUES.map((f) => [<InlineCode key="t">{f.type}</InlineCode>, f.read])}
              />
              <Bullets>
                <li>Records can be sorted by any field except multi_select, links, lookup, formula, attachment and json fields.</li>
                <li>User, created_by and last_modified_by fields can be filtered like text; created_time and last_modified_time like dates.</li>
                <li>Formula and lookup fields are calculated when a record is read, so they can&apos;t be used to filter or sort. Attachment and json fields can&apos;t be filtered either.</li>
                <li>search looks in text, long_text, email, url, phone_number and single_select fields.</li>
              </Bullets>
            </Section>

            <Section id="safe-retries" title="Safe retries">
              <p className="text-sm text-secondary">
                If a create or bulk delete times out, you can't tell whether it worked. Send an{' '}
                <InlineCode>Idempotency-Key</InlineCode> header with POST requests: a retry with the same key and body
                gets the first response again instead of writing twice.
              </p>
              <Bullets>
                <li>Use a new key for each new request, up to 255 characters. Keys are kept for 24 hours.</li>
                <li>A retry while the first request is still running gets <InlineCode>409 conflict</InlineCode>; try again shortly.</li>
              </Bullets>
              <div className="space-y-2">
                {IDEMPOTENCY_EXAMPLES.map((example, i) => (
                  <ExampleBlock key={example.title} example={example} baseUrl={baseUrl} language={language} defaultOpen={i === 0} />
                ))}
              </div>
            </Section>

            <Section id="errors" title="Errors">
              <p className="text-sm text-secondary">
                Errors use the same response shape, with a <InlineCode>code</InlineCode> to check in your app, a{' '}
                <InlineCode>message</InlineCode> for people, and sometimes <InlineCode>details</InlineCode>: one entry
                per problem, with the <InlineCode>field</InlineCode>, record <InlineCode>id</InlineCode> or bulk{' '}
                <InlineCode>index</InlineCode> it is about.
              </p>
              <DocTable
                head={['Code', 'HTTP', 'When']}
                rows={ERROR_CODES.map((e) => [<InlineCode key="c">{e.code}</InlineCode>, e.status, e.when])}
              />
            </Section>

            <Section id="limits" title="Limits">
              <Bullets>
                <li>600 requests per minute per workspace by default (the server's PUBLIC_API_RATE_LIMIT_PER_MINUTE). Over that you get 429; wait for the seconds in Retry-After.</li>
                <li>100 records per create, update or delete request.</li>
                <li>200 records per page; 50 when limit is not given.</li>
                <li>Reads (list, find and get one record) stop after 10 seconds with <InlineCode>503 query_timeout</InlineCode>.</li>
                <li>where: groups nested up to 5 deep, 50 conditions in all. search: 200 characters.</li>
                <li>expand: 2 levels, 5 link fields per request, and the first 100 linked records of each link.</li>
              </Bullets>
              <ExampleBlock example={RATE_LIMIT_EXAMPLE} baseUrl={baseUrl} language={language} defaultOpen />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
