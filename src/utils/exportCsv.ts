/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Escapes a cell value for standard CSV compatibility.
 * Handles double quotes, commas, newlines, and formula injection mitigation.
 */
function escapeCsvValue(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) {
    return '""';
  }

  let str = String(val);

  // Mitigate CSV Formula Injection (prefixing with apostrophe if starts with =, +, -, @)
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // Replace any internal double quotes with pair of double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Exports data to CSV and triggers a client-side download.
 * Adds UTF-8 BOM so Excel properly opens non-ASCII characters and symbols (₹).
 */
export function exportToCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  data: T[]
): void {
  if (!data || data.length === 0) {
    return;
  }

  const headers = columns.map((col) => escapeCsvValue(col.header)).join(',');
  const rows = data.map((row) =>
    columns.map((col) => escapeCsvValue(col.accessor(row))).join(',')
  );

  // UTF-8 Byte Order Mark (BOM) \uFEFF ensures Excel displays Hindi text and rupee symbols correctly
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const sanitizedFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', sanitizedFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
