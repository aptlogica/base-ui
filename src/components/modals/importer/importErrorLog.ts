// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

const FORMAT_LABELS: Record<string, string> = { sbase: 'Sereni Base', csv: 'CSV', xlsx: 'Excel', json: 'JSON' };

/** The most problems the log lists; the rest are counted */
const MAX_LOGGED_PROBLEMS = 1000;

/**
 * The text of the log of an import that failed, written in the browser. An import that the server refuses at once (a
 * bad file) never becomes a job, so the server has no log for it; this one has the same headings as the log the server
 * writes for a failed job: the header, what went wrong, and the problems.
 */
export const buildFailedImportLog = (input: {
  format?: string;
  fileName?: string;
  message: string;
  problems?: string[];
  now?: Date;
}): string => {
  const problems = input.problems ?? [];
  const lines: string[] = [
    'Import Issues Report',
    `Generated: ${(input.now ?? new Date()).toISOString()}`,
    `Format: ${FORMAT_LABELS[input.format ?? 'sbase'] ?? input.format}${input.fileName ? `      File: ${input.fileName}` : ''}`,
    'Result: failed (nothing was created)',
    '='.repeat(100),
    '',
    'ERROR:',
    input.message,
    '',
  ];
  if (problems.length > 0) {
    lines.push(`PROBLEMS (${problems.length}):`);
    problems.slice(0, MAX_LOGGED_PROBLEMS).forEach((problem, index) => lines.push(`${index + 1}. ${problem}`));
    if (problems.length > MAX_LOGGED_PROBLEMS) {
      lines.push(`... and ${problems.length - MAX_LOGGED_PROBLEMS} more problems that are not listed.`);
    }
  }
  return `${lines.join('\n')}\n`;
};
