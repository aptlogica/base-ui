// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { DocExample } from './apiDocsContent';

export type SnippetLanguage = 'curl' | 'javascript';

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

export const statusText = (status: number) => `${status} ${STATUS_TEXT[status] ?? ''}`.trim();

// Pretty JSON, with every line after the first indented to sit under the line that holds it
const indentedJson = (value: unknown, indent: string) => JSON.stringify(value, null, 2).replace(/\n/g, `\n${indent}`);

const requestHeaders = (example: DocExample): Record<string, string> => ({
  ...(example.body === undefined ? {} : { 'Content-Type': 'application/json' }),
  ...example.headers,
});

// A cURL command; -g stops curl from reading the [ ] of filter parameters as ranges
export const toCurl = (baseUrl: string, example: DocExample): string => {
  const flags = `${example.path.includes('[') ? ' -g' : ''}${example.method === 'GET' ? '' : ` -X ${example.method}`}`;
  const lines = [`curl${flags} "${baseUrl}${example.path}"`];
  for (const [name, value] of Object.entries(requestHeaders(example))) {
    lines.push(`  -H "${name}: ${value}"`);
  }
  if (example.body !== undefined) {
    lines.push(`  -d '${indentedJson(example.body, '  ')}'`);
  }
  return lines.join(' \\\n');
};

// The same request with fetch, for browser apps and Node 18+
export const toFetch = (baseUrl: string, example: DocExample): string => {
  const url = `"${baseUrl}${example.path}"`;
  const options: string[] = [];
  if (example.method !== 'GET') {
    options.push(`  method: "${example.method}",`);
  }
  const headers = requestHeaders(example);
  if (Object.keys(headers).length > 0) {
    options.push(`  headers: ${indentedJson(headers, '  ')},`);
  }
  if (example.body !== undefined) {
    options.push(`  body: JSON.stringify(${indentedJson(example.body, '  ')}),`);
  }
  const call = options.length > 0 ? `fetch(${url}, {\n${options.join('\n')}\n})` : `fetch(${url})`;
  return `const res = await ${call};\nconst { data, error, meta } = await res.json();`;
};

export const toSnippet = (language: SnippetLanguage, baseUrl: string, example: DocExample) =>
  language === 'curl' ? toCurl(baseUrl, example) : toFetch(baseUrl, example);

// The response as it arrives: status line, notable headers, then the JSON body
export const toResponse = (example: DocExample): string => {
  const head = [`HTTP/1.1 ${statusText(example.status)}`];
  for (const [name, value] of Object.entries(example.responseHeaders ?? {})) {
    head.push(`${name}: ${value}`);
  }
  return `${head.join('\n')}\n\n${JSON.stringify(example.response, null, 2)}`;
};
