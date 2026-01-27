import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ParsedFile } from './types';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export type FileType = 'csv' | 'xlsx' | 'xls';

export function getFileType(file: File): FileType | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'csv';
  if (extension === 'xlsx') return 'xlsx';
  if (extension === 'xls') return 'xls';
  return null;
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const fileType = getFileType(file);

  if (!fileType) {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file (.csv, .xlsx, .xls).');
  }

  if (!validateFileSize(file)) {
    throw new Error('File is too large. Maximum file size is 25MB.');
  }

  if (fileType === 'csv') {
    return parseCSV(file);
  } else {
    return parseExcel(file);
  }
}

async function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const error = results.errors[0];
          reject(new Error(`CSV parsing error at row ${error.row}: ${error.message}`));
          return;
        }

        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, unknown>[];

        if (headers.length === 0) {
          reject(new Error('CSV file has no headers.'));
          return;
        }

        if (rows.length === 0) {
          reject(new Error('CSV file has no data rows.'));
          return;
        }

        resolve({
          headers,
          rows,
          totalRows: rows.length,
          filename: file.name,
          fileType: 'csv',
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

async function parseExcel(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('Excel file has no sheets.'));
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw: false, // Convert all values to strings
        });

        if (jsonData.length === 0) {
          reject(new Error('Excel file has no data.'));
          return;
        }

        const headers = Object.keys(jsonData[0] || {});

        if (headers.length === 0) {
          reject(new Error('Excel file has no headers.'));
          return;
        }

        // Trim headers and values
        const trimmedRows = jsonData.map((row) => {
          const trimmed: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(row)) {
            const trimmedKey = key.trim();
            trimmed[trimmedKey] = typeof value === 'string' ? value.trim() : value;
          }
          return trimmed;
        });

        const trimmedHeaders = headers.map((h) => h.trim());

        resolve({
          headers: trimmedHeaders,
          rows: trimmedRows,
          totalRows: trimmedRows.length,
          filename: file.name,
          fileType: file.name.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'xls',
        });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Generate CSV template content
export function generateCSVTemplate(fields: { name: string; label: string }[]): string {
  const headers = fields.map((f) => f.label);
  return headers.join(',') + '\n';
}

// Generate Excel template as a blob
export function generateExcelTemplate(
  fields: { name: string; label: string }[],
  entityType: string
): Blob {
  const headers = fields.map((f) => f.label);
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  // Set column widths
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 15) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, entityType);

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Helper to download a file
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download CSV template
export function downloadCSVTemplate(
  fields: { name: string; label: string }[],
  entityType: string
): void {
  const content = generateCSVTemplate(fields);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${entityType}_import_template.csv`);
}

// Download Excel template
export function downloadExcelTemplate(
  fields: { name: string; label: string }[],
  entityType: string
): void {
  const blob = generateExcelTemplate(fields, entityType);
  downloadFile(blob, `${entityType}_import_template.xlsx`);
}
