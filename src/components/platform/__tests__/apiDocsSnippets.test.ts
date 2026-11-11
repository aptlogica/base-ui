import { describe, it, expect } from 'vitest';
import { statusText, toCurl, toFetch, toResponse } from '../docs/apiDocsSnippets';
import { ENDPOINT_GROUPS, type DocExample } from '../docs/apiDocsContent';

const BASE = 'http://localhost:8080/api/v1/ws_8f3k2m9qx7';

const get: DocExample = { title: 'List', method: 'GET', path: '/bases', status: 200, response: { data: [] } };

const post: DocExample = {
  title: 'Create',
  method: 'POST',
  path: '/bases/CRM/tables/Orders/records',
  headers: { 'Idempotency-Key': 'order-1' },
  body: { fields: { Name: 'Order 1' } },
  status: 201,
  responseHeaders: { 'Idempotent-Replayed': 'true' },
  response: { data: { id: 'rec_1' } },
};

describe('apiDocsSnippets', () => {
  it('builds a plain cURL GET', () => {
    expect(toCurl(BASE, get)).toBe(`curl "${BASE}/bases"`);
  });

  it('adds -g when the query has filter brackets', () => {
    expect(toCurl(BASE, { ...get, path: '/r?filter[Status]=Active' })).toBe(`curl -g "${BASE}/r?filter[Status]=Active"`);
  });

  it('builds a cURL POST with headers and a JSON body', () => {
    expect(toCurl(BASE, post)).toBe(
      [
        `curl -X POST "${BASE}/bases/CRM/tables/Orders/records" \\`,
        '  -H "Content-Type: application/json" \\',
        '  -H "Idempotency-Key: order-1" \\',
        "  -d '{",
        '    "fields": {',
        '      "Name": "Order 1"',
        '    }',
        "  }'",
      ].join('\n')
    );
  });

  it('builds a cURL DELETE without a body', () => {
    expect(toCurl(BASE, { ...get, method: 'DELETE', path: '/r/rec_1' })).toBe(`curl -X DELETE "${BASE}/r/rec_1"`);
  });

  it('builds QUERY requests like POST, with the method named', () => {
    const query = { ...get, method: 'QUERY' as const, path: '/r/query', body: { where: { field: 'Status', value: 'Open' } } };
    expect(toCurl(BASE, query).split('\n')[0]).toBe(`curl -X QUERY "${BASE}/r/query" \\`);
    expect(toFetch(BASE, query)).toContain('  method: "QUERY",');
  });

  it('builds fetch calls', () => {
    expect(toFetch(BASE, get)).toBe(`const res = await fetch("${BASE}/bases");\nconst { data, error, meta } = await res.json();`);

    const code = toFetch(BASE, post);
    expect(code).toContain('method: "POST",');
    expect(code).toContain('"Idempotency-Key": "order-1"');
    expect(code).toContain('body: JSON.stringify({');
    // The snippet is valid JavaScript
    expect(() => new Function(`return (async () => { ${code} })`)).not.toThrow();
  });

  it('shows the response with its status line and headers', () => {
    expect(toResponse(post)).toBe(
      'HTTP/1.1 201 Created\nIdempotent-Replayed: true\n\n{\n  "data": {\n    "id": "rec_1"\n  }\n}'
    );
    expect(statusText(422)).toBe('422 Unprocessable Entity');
  });

  it('has a status text for every documented example and no apostrophes that break cURL bodies', () => {
    for (const group of ENDPOINT_GROUPS) {
      for (const endpoint of group.endpoints) {
        for (const example of endpoint.examples) {
          expect(statusText(example.status)).not.toBe(String(example.status));
          if (example.body !== undefined) {
            expect(JSON.stringify(example.body)).not.toContain("'");
          }
        }
      }
    }
  });
});
