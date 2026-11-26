// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

/** How much of a file is read to tell a text file from a renamed binary one (the server reads the same amount) */
export const CSV_SNIFF_BYTES = 8192;

const isZip = (name: string): boolean => name.toLowerCase().endsWith('.zip');

/** Reads the first bytes of a file */
const readHead = async (file: File): Promise<Uint8Array> => {
  const slice = file.slice(0, CSV_SNIFF_BYTES);
  if (typeof slice.arrayBuffer === 'function') return new Uint8Array(await slice.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(slice);
  });
};

/**
 * Says why a file is not a usable CSV file, or '' when it is. The same rules the server applies:
 * a name ending in .csv, not empty, not a name starting with a dot, real text (it does not start with the zip
 * signature and has no NUL byte), and not a name that is already in the list (case does not matter).
 */
export async function checkCsvFile(file: File, existingNames: string[] = []): Promise<string> {
  const name = file.name;
  if (!name.toLowerCase().endsWith('.csv')) return `${name} is not a CSV file. Only .csv files or a .zip are supported.`;
  if (file.size === 0) return `${name} is empty.`;
  if (name.startsWith('.')) return `${name} is not a valid CSV file name.`;
  const head = await readHead(file);
  const startsWithZip = head.length >= 2 && head[0] === 0x50 && head[1] === 0x4b; // "PK"
  if (startsWithZip || head.includes(0)) return `${name} is not a valid CSV file.`;
  if (existingNames.some((n) => n.toLowerCase() === name.toLowerCase())) return `${name} was added twice.`;
  return '';
}

export interface CsvPickResult {
  /** What the list of chosen files is after the pick: loose CSV files, or one zip */
  csvFiles: File[];
  zip: File | null;
  /** One message for the files that were refused; '' when all were taken */
  error: string;
}

type CsvChoice = { csvFiles: File[]; zip: File | null };

/**
 * The part of a pick that involves a .zip, which needs no reading of files and so is answered at once: one zip, two zips,
 * or a zip mixed with .csv files. Returns null when the pick has no zip (then pickCsvFiles checks the .csv files).
 */
export function pickCsvZip(picked: File[], current: CsvChoice): CsvPickResult | null {
  const zips = picked.filter((f) => isZip(f.name));
  const others = picked.filter((f) => !isZip(f.name));
  if (zips.length === 0) return null;
  if (zips.length > 1) return { ...current, error: 'Choose only one .zip.' };
  // a zip and .csv files picked together is refused; a zip picked after .csv files replaces them
  if (others.length > 0) return { ...current, error: 'Choose either CSV files or one .zip, not both.' };
  return { csvFiles: [], zip: zips[0], error: '' };
}

/**
 * Applies a pick or drop of files to what is already chosen, by the rules of the Multiple CSV option:
 * several .csv files, or one .zip, never both at once and never two zips; a new pick of the other kind replaces what was
 * chosen (a zip, then .csv files: the zip is dropped). Every .csv is checked with checkCsvFile.
 * Files that fail are left out and named in the message; the ones that pass are taken.
 */
export async function pickCsvFiles(picked: File[], current: CsvChoice): Promise<CsvPickResult> {
  const withZip = pickCsvZip(picked, current);
  if (withZip) return withZip;
  if (picked.length === 0) return { ...current, error: '' };

  // .csv files picked after a zip replace the zip
  const accepted = current.zip ? [] : [...current.csvFiles];
  const errors: string[] = [];
  for (const file of picked) {
    const problem = await checkCsvFile(file, accepted.map((f) => f.name));
    if (problem) errors.push(problem);
    else accepted.push(file);
  }
  return { csvFiles: accepted, zip: null, error: errors.join(' ') };
}
