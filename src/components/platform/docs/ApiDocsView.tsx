// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Search } from 'lucide-react';
import { getApiOrigin } from '../../../service/clientService';
import { useApplication } from '../useApplications';
import LiveDocsLinks, { liveDocsUrls } from '../LiveDocsLinks';
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
  type DocEndpoint,
  type HttpMethod,
} from './apiDocsContent';
import {
  Bullet,
  Bullets,
  CodePanel,
  CopyButton,
  DocTable,
  EndpointDoc,
  ExamplesPanel,
  InlineCode,
  MethodBadge,
  PanelTitle,
  WarningNote,
  endpointSections,
  sectionDomId,
} from './ApiDocsBlocks';
import type { SnippetLanguage } from './apiDocsSnippets';

interface NavItem {
  id: string;
  label: string;
  group: string;
  method?: HttpMethod;
  endpoint?: DocEndpoint;
}

// Left menu: guide pages, then one page per endpoint, then reference pages
const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: 'Getting started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'live-docs', label: 'Live docs' },
      { id: 'responses', label: 'Responses' },
      { id: 'ids-and-names', label: 'IDs and names' },
    ].map((item) => ({ ...item, group: 'Getting started' })),
  },
  ...ENDPOINT_GROUPS.map((group) => ({
    title: group.title,
    items: group.endpoints.map((e) => ({ id: e.id, label: e.title, group: group.title, method: e.method, endpoint: e })),
  })),
  {
    title: 'Reference',
    items: [
      { id: 'field-values', label: 'Field values' },
      { id: 'safe-retries', label: 'Safe retries' },
      { id: 'errors', label: 'Errors' },
      { id: 'limits', label: 'Limits' },
    ].map((item) => ({ ...item, group: 'Reference' })),
  },
];

const PAGES = NAV.flatMap((group) => group.items);

const SubHeading: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <h3 className="text-lg font-semibold text-primary">{children}</h3>
);

const Text: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <p className="text-[15px] leading-relaxed text-secondary">{children}</p>
);

interface ApiDocsViewProps {
  workspaceId?: string | null;
  // The application whose address the examples use; without one they use a sample address
  applicationId?: string | null;
  onBack: () => void;
  // Accessible name of the back button, e.g. "Back to workspace"
  backLabel: string;
  // Inside the Applications popup, which already has its own heading: the title is not a page heading
  embedded?: boolean;
}

// How to use the application API: one page per guide section and per endpoint, with request and response
// examples. Shown on its own page (ApiDocsPage) and inside the Applications popup.
const ApiDocsView: React.FC<Readonly<ApiDocsViewProps>> = ({ workspaceId, applicationId, onBack, backLabel, embedded = false }) => {
  const { data: application } = useApplication(workspaceId, applicationId);
  const [language, setLanguage] = useState<SnippetLanguage>('curl');
  const [pageId, setPageId] = useState(PAGES[0].id);
  const [query, setQuery] = useState('');
  const [sectionId, setSectionId] = useState('endpoint');
  const contentRef = useRef<HTMLDivElement>(null);

  // The examples use the application's own address while its API is on, and a sample one otherwise
  const enabled = Boolean(application?.enabled && application.base_path);
  const baseUrl = `${getApiOrigin()}${enabled ? application?.base_path : SAMPLE_BASE_PATH}`;
  const liveDocs = liveDocsUrls(baseUrl);

  const pageIndex = Math.max(0, PAGES.findIndex((p) => p.id === pageId));
  const page = PAGES[pageIndex];
  const previous = PAGES[pageIndex - 1];
  const next = PAGES[pageIndex + 1];
  const sections = page.endpoint ? endpointSections(page.endpoint) : [];

  // The menu, limited to pages whose name or group has the search text
  const menu = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV;
    return NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => `${item.label} ${item.method ?? ''} ${group.title}`.toLowerCase().includes(q)),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const openPage = (id: string) => {
    setPageId(id);
    setSectionId('endpoint');
    contentRef.current?.scrollTo?.({ top: 0 });
  };

  const goToSection = (id: string) => {
    document.getElementById(sectionDomId(id))?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    setSectionId(id);
  };

  // On this page: highlights the last section whose heading has scrolled to the top of the content
  const handleScroll = () => {
    if (sections.length === 0) return;
    const top = contentRef.current?.getBoundingClientRect().top ?? 0;
    let current = sections[0].id;
    for (const s of sections) {
      const el = document.getElementById(sectionDomId(s.id));
      if (el && el.getBoundingClientRect().top - top <= 120) current = s.id;
    }
    setSectionId(current);
  };

  const Title = embedded ? 'div' : 'h1';

  const guidePage = (id: string): React.ReactNode => {
    switch (id) {
      case 'introduction':
        return (
          <>
            <Text>
              An application gives your own apps, sites and scripts an API address for the bases you choose, so they
              can read and write their records. Bases, tables and fields are still set up in SereniBase; the API works
              with the data inside them, and only with the application's own bases.
            </Text>
            <div className="space-y-2">
              <CodePanel code={baseUrl} kind="plain" label="base URL" lineNumbers={false} header={<PanelTitle>Base URL</PanelTitle>} />
              <p className="text-xs text-secondary">
                {enabled
                  ? `This is the address of ${application?.name ?? 'the application'}; the examples below use it. Every endpoint path is added to it.`
                  : 'No application with its API on is chosen, so the examples use a sample address. An owner or co-owner can create an application from Home → Applications.'}
              </p>
            </div>
            <WarningNote>
              Development only: there are no API keys yet, so anyone with the base URL can read and change the data
              of the application's bases. The API answers only on servers started with PUBLIC_API_OPEN_ACCESS=true. Changes to
              tables and fields apply to the next request; after the API is turned back on, it can take up to 10
              seconds to answer again.
            </WarningNote>
            <div className="space-y-3">
              <SubHeading>Endpoints</SubHeading>
              <DocTable
                head={['Method', 'Path', 'What it does']}
                rows={ENDPOINT_SUMMARY.map((e) => [
                  <MethodBadge key="m" method={e.method} />,
                  <code key="p" className="font-mono text-xs text-primary break-all">{e.path}</code>,
                  e.does,
                ])}
              />
            </div>
            <div className="space-y-3">
              <SubHeading>Every request</SubHeading>
              <Bullets>
                <Bullet>Send bodies as JSON with the header <InlineCode>Content-Type: application/json</InlineCode>. Every response is JSON.</Bullet>
                <Bullet>No API key or login is needed yet.</Bullet>
                <Bullet>Browser apps can call it from any website: CORS is open and no cookies are used.</Bullet>
                <Bullet>
                  Every response has an <InlineCode>X-Request-Id</InlineCode> header. You can send your own (up to 64
                  letters, digits, _ or -) to find a request in the server logs.
                </Bullet>
                <Bullet>The cURL examples are for macOS and Linux terminals. On Windows, run them in Git Bash or WSL, or use the JavaScript examples.</Bullet>
              </Bullets>
            </div>
          </>
        );
      case 'live-docs':
        return (
          <>
            <Text>
              This page explains the API with sample data. Each application also serves docs built from its own bases,
              tables and fields: each table's real field names, types and select options, and what can be written.
              They update as soon as a table changes.
            </Text>
            <DocTable
              head={['Page', 'Address', 'Use it to']}
              rows={[
                ['Swagger UI', <code key="a" className="font-mono text-xs text-primary break-all">{liveDocs.swagger}</code>, 'Try requests from the browser'],
                ['ReDoc', <code key="a" className="font-mono text-xs text-primary break-all">{liveDocs.redoc}</code>, 'Read the reference for every table'],
                ['OpenAPI spec', <code key="a" className="font-mono text-xs text-primary break-all">{liveDocs.spec}</code>, 'Import into Postman or Insomnia, or generate code'],
              ]}
            />
            <Bullets>
              <Bullet>
                Add <InlineCode>?base=Sales</InlineCode> (a base name or <InlineCode>bse_…</InlineCode> ID) to any of them to show
                only one base. It helps when an application has many tables.
              </Bullet>
              <Bullet>Swagger UI's "Try it out" sends real requests: changes it makes are saved in your tables.</Bullet>
            </Bullets>
            {enabled ? (
              <LiveDocsLinks baseUrl={baseUrl} />
            ) : (
              <p className="text-xs text-secondary">The addresses above are samples. Open the docs from an application with its API on to see its live docs.</p>
            )}
          </>
        );
      case 'responses':
        return (
          <>
            <Text>
              Every response has the same three parts: <InlineCode>data</InlineCode> is the result (null on errors),{' '}
              <InlineCode>error</InlineCode> is null on success, and <InlineCode>meta</InlineCode> has the request ID,
              plus paging details on lists. Reads, updates and deletes return 200; creates return 201.
            </Text>
            <CodePanel code={JSON.stringify(RESPONSE_EXAMPLES.one, null, 2)} kind="json" label="one item response" header={<PanelTitle>One item</PanelTitle>} />
            <CodePanel code={JSON.stringify(RESPONSE_EXAMPLES.list, null, 2)} kind="json" label="list response" header={<PanelTitle>A list of records</PanelTitle>} />
            <CodePanel code={JSON.stringify(RESPONSE_EXAMPLES.error, null, 2)} kind="json" label="error response" header={<PanelTitle>An error</PanelTitle>} />
          </>
        );
      case 'ids-and-names':
        return (
          <>
            <DocTable
              head={['Prefix', 'Identifies', 'Example']}
              rows={ID_PREFIXES.map((p) => [
                <InlineCode key="p">{p.prefix}</InlineCode>,
                p.what,
                <code key="e" className="font-mono text-xs text-primary break-all">{p.example}</code>,
              ])}
            />
            <Bullets>
              <Bullet>Wherever a path has {'{base}'} or {'{table}'}, and wherever you name a field, you can use the name or the ID.</Bullet>
              <Bullet>Names are exact and case-sensitive. Encode them in URLs: <InlineCode>Sales%20Team</InlineCode>, <InlineCode>In%2FOut</InlineCode>.</Bullet>
              <Bullet>If two items share a name you get <InlineCode>409 ambiguous_name</InlineCode> with their IDs. IDs never change, so apps that must survive renames should use them.</Bullet>
            </Bullets>
          </>
        );
      case 'field-values':
        return (
          <>
            <Text>
              What to send for each field type, and which filter operators it supports. Values come back in the
              same form. <InlineCode>null</InlineCode> empties a field.
            </Text>
            <DocTable
              head={['Type', 'Send', 'Example', 'Filter operators']}
              rows={FIELD_VALUES.map((f) => [
                <InlineCode key="t">{f.type}</InlineCode>,
                f.write,
                <code key="e" className="font-mono text-xs text-primary whitespace-nowrap">{f.example}</code>,
                f.filters,
              ])}
            />
            <div className="space-y-3">
              <SubHeading>Read-only fields</SubHeading>
              <Text>These come back in records but can't be sent when creating or updating.</Text>
              <DocTable
                head={['Type', 'Comes back as']}
                rows={READ_ONLY_VALUES.map((f) => [<InlineCode key="t">{f.type}</InlineCode>, f.read])}
              />
            </div>
            <Bullets>
              <Bullet>Records can be sorted by any field except multi_select, links, lookup, formula, attachment and json fields, and user fields that hold several users.</Bullet>
              <Bullet>A single user, created_by and last_modified_by field filters like text; a user field holding several users takes contains (one user ID) and is_null. created_time and last_modified_time filter like date_time (RFC 3339 with a time zone).</Bullet>
              <Bullet>Lookup fields filter through their link (a record matches when one of its linked records does) but can&apos;t be sorted by. Formula fields aren&apos;t in the API yet. Attachment and json fields can&apos;t be filtered.</Bullet>
              <Bullet>search looks in text, long_text, email, url, phone_number and single_select fields.</Bullet>
            </Bullets>
          </>
        );
      case 'safe-retries':
        return (
          <>
            <Text>
              If a create or bulk delete times out, you can't tell whether it worked. Send an{' '}
              <InlineCode>Idempotency-Key</InlineCode> header with POST /records (create) and POST /records/delete: a retry
              with the same key and body gets the first response again instead of writing twice. Other requests
              ignore the header: reads are safe to retry, and PATCH sets the same values again.
            </Text>
            <Bullets>
              <Bullet>Use a new key for each new request, up to 255 characters. Keys are kept for 24 hours.</Bullet>
              <Bullet>A retry while the first request is still running gets <InlineCode>409 conflict</InlineCode>; try again shortly.</Bullet>
            </Bullets>
            <ExamplesPanel examples={IDEMPOTENCY_EXAMPLES} baseUrl={baseUrl} language={language} onLanguage={setLanguage} />
          </>
        );
      case 'errors':
        return (
          <>
            <Text>
              Errors use the same response shape, with a <InlineCode>code</InlineCode> to check in your app, a{' '}
              <InlineCode>message</InlineCode> for people, and sometimes <InlineCode>details</InlineCode>: one entry
              per problem, with the <InlineCode>field</InlineCode>, record <InlineCode>id</InlineCode> or bulk{' '}
              <InlineCode>index</InlineCode> it is about.
            </Text>
            <DocTable
              head={['Code', 'HTTP', 'When']}
              rows={ERROR_CODES.map((e) => [<InlineCode key="c">{e.code}</InlineCode>, e.status, e.when])}
            />
          </>
        );
      case 'limits':
        return (
          <>
            <Bullets>
              <Bullet>600 requests per minute per application by default (the server's PUBLIC_API_RATE_LIMIT_PER_MINUTE). Over that you get 429; wait for the seconds in Retry-After.</Bullet>
              <Bullet>100 records per create, update or delete request.</Bullet>
              <Bullet>200 records per page; 50 when limit is not given.</Bullet>
              <Bullet>Reads (list, find, aggregate and get one record) stop after 10 seconds with <InlineCode>503 query_timeout</InlineCode>.</Bullet>
              <Bullet>Filters: 50 conditions per request, filter[...] and where together; where groups nested up to 5 deep. An in list takes 100 values (200 for id). A condition on a linked record&apos;s field (Customer.Country) may match at most 1000 linked records. search: 200 characters and 10 words.</Bullet>
              <Bullet>sort: 5 fields, each once (the id tie-breaker added at the end doesn't count; fields after id are ignored).</Bullet>
              <Bullet>Aggregate: 10 metrics, 3 group_by fields (each once, and one link or multi-select field per request), and up to 1000 groups per answer (meta.has_more says there are more).</Bullet>
              <Bullet>A request body can be at most 10 MB (413 payload_too_large).</Bullet>
              <Bullet>expand: 2 levels, 5 link fields per request, the first 100 linked records of each link, and 5,000 linked records per request.</Bullet>
            </Bullets>
            <ExamplesPanel examples={[RATE_LIMIT_EXAMPLE]} baseUrl={baseUrl} language={language} onLanguage={setLanguage} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="api-docs flex flex-col h-full min-h-0 min-w-0 bg-card">
      {/* Header */}
      <div className={`flex flex-wrap items-center gap-3 border-b border-[var(--color-border-primary)] flex-shrink-0 ${embedded ? 'px-4 py-3' : 'p-4'}`}>
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-[var(--color-border-primary)] hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label={backLabel}
        >
          <ArrowLeft className="text-[var(--text-color-tertiary)] h-[18px] w-[18px]" />
        </button>
        {!embedded && (
          <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
            <BookOpen className="text-green-600 h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1 basis-56">
          <Title className={`${embedded ? 'text-[15px]' : 'text-xl'} font-semibold text-primary truncate`}>Application API docs</Title>
          <p className="text-[13px] text-secondary truncate">Read and write the records of an application's bases from your own apps over HTTP</p>
        </div>
        <div className="flex items-center gap-2 h-9 max-w-full min-w-0 pl-3 pr-1 rounded-xl border border-[var(--color-border-primary)] bg-gray-50">
          <span className="text-xs font-medium text-secondary whitespace-nowrap">Base URL</span>
          <code className="min-w-0 truncate font-mono text-[12.5px] text-primary">{baseUrl}</code>
          <CopyButton text={baseUrl} label="Copy base URL" />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Left menu: search, then each page; endpoints show their method */}
        <nav className="hidden md:flex flex-col w-[260px] flex-shrink-0 border-r border-[var(--color-border-primary)] bg-gray-50" aria-label="Docs sections">
          <div className="p-3 pb-2">
            <label className="flex items-center gap-2 h-9 px-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-card)] text-secondary focus-within:border-gray-400">
              <Search className="w-4 h-4 flex-none" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the docs"
                aria-label="Search the docs"
                className="flex-1 min-w-0 bg-transparent text-[13px] text-primary outline-none placeholder:text-[var(--color-text-placeholder)]"
              />
            </label>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {menu.length === 0 && <p className="px-2.5 py-2 text-[13px] text-secondary">No pages match "{query.trim()}".</p>}
            {menu.map((group) => (
              <div key={group.title} className="mb-4">
                <div className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary">{group.title}</div>
                {group.items.map((item) => {
                  const isActive = pageId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openPage(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative w-full min-h-[34px] flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13.5px] text-left transition-colors duration-200 ${
                        isActive ? 'bg-card shadow-xs font-semibold text-primary' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {isActive && <span className="absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-full api-docs-accent-bg" />}
                      {item.method && (
                        <span aria-hidden="true">
                          <MethodBadge method={item.method} size="sm" />
                        </span>
                      )}
                      <span className="min-w-0 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        {/* The page, with On this page beside it on wide screens */}
        <div ref={contentRef} onScroll={handleScroll} className="flex-1 min-w-0 overflow-y-auto">
          <div className="flex gap-10 px-6 md:px-10 pt-9 pb-14">
            <article className="flex-1 min-w-0 max-w-[780px] space-y-7">
              <header className="space-y-2">
                <div className="text-[13px] font-medium api-docs-accent">{page.group}</div>
                <h2 className="text-[28px] leading-9 font-semibold tracking-tight text-primary">{page.label}</h2>
              </header>

              {page.endpoint ? (
                <EndpointDoc endpoint={page.endpoint} baseUrl={baseUrl} language={language} onLanguage={setLanguage} />
              ) : (
                <div className="space-y-6">{guidePage(page.id)}</div>
              )}

              {/* Previous and next page */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-[var(--color-border-primary)]">
                {previous ? (
                  <button
                    type="button"
                    onClick={() => openPage(previous.id)}
                    className="flex-1 basis-52 flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border border-[var(--color-border-primary)] hover:bg-gray-50 text-left transition-colors"
                  >
                    <span className="flex items-center gap-1 text-xs text-secondary">
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      Previous
                    </span>
                    <span className="text-sm font-medium text-primary">{previous.label}</span>
                  </button>
                ) : (
                  <span className="flex-1 basis-52" />
                )}
                {next ? (
                  <button
                    type="button"
                    onClick={() => openPage(next.id)}
                    className="flex-1 basis-52 flex flex-col items-end gap-0.5 px-4 py-3 rounded-xl border border-[var(--color-border-primary)] hover:bg-gray-50 text-right transition-colors"
                  >
                    <span className="flex items-center gap-1 text-xs text-secondary">
                      Next
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-primary">{next.label}</span>
                  </button>
                ) : (
                  <span className="flex-1 basis-52" />
                )}
              </div>
            </article>

            {sections.length > 0 && (
              <aside aria-label="On this page" className="hidden xl:block w-[190px] flex-shrink-0">
                <div className="sticky top-0 space-y-0.5">
                  <div className="pb-2 pl-3.5 text-xs font-semibold text-primary">On this page</div>
                  {sections.map((s) => {
                    const on = s.id === sectionId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => goToSection(s.id)}
                        aria-current={on ? 'location' : undefined}
                        className={`block w-full border-l-2 py-1.5 pl-3 text-left text-[13px] transition-colors ${
                          on ? 'api-docs-accent-border font-medium text-primary' : 'border-[var(--color-border-primary)] text-secondary hover:text-primary'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsView;
