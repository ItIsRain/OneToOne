import Papa from 'papaparse';
import ExcelJS from 'exceljs';
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
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Use first sheet
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount === 0) {
      throw new Error('Excel file has no sheets.');
    }

    // Extract headers from the first row
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? '').trim();
    });

    if (headers.length === 0) {
      throw new Error('Excel file has no headers.');
    }

    // Extract data rows
    const rows: Record<string, unknown>[] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      const rowData: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        const cell = row.getCell(index + 1);
        const value = cell.value;
        // Convert all values to strings, handling ExcelJS rich text and formula results
        let stringValue = '';
        if (value === null || value === undefined) {
          stringValue = '';
        } else if (typeof value === 'object' && 'result' in value) {
          // Formula cell — use computed result
          stringValue = String(value.result ?? '');
        } else if (typeof value === 'object' && 'richText' in value) {
          // Rich text — concatenate text fragments
          stringValue = (value as ExcelJS.CellRichTextValue).richText
            .map((rt) => rt.text)
            .join('');
        } else {
          stringValue = String(value);
        }
        rowData[header] = stringValue.trim();
      });
      rows.push(rowData);
    });

    if (rows.length === 0) {
      throw new Error('Excel file has no data.');
    }

    return {
      headers,
      rows,
      totalRows: rows.length,
      filename: file.name,
      fileType: file.name.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'xls',
    };
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Excel file has no') || error.message.includes('no data'))) {
      throw error;
    }
    throw new Error(`Failed to parse Excel file: ${(error as Error).message}`);
  }
}

// Generate CSV template content
export function generateCSVTemplate(fields: { name: string; label: string }[]): string {
  const headers = fields.map((f) => f.label);
  return headers.join(',') + '\n';
}

// Generate Excel template as a blob
export async function generateExcelTemplate(
  fields: { name: string; label: string }[],
  entityType: string
): Promise<Blob> {
  const headers = fields.map((f) => f.label);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(entityType);

  // Add header row
  sheet.addRow(headers);

  // Set column widths
  sheet.columns = headers.map((h) => ({ width: Math.max(h.length + 2, 15) }));

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
export async function downloadExcelTemplate(
  fields: { name: string; label: string }[],
  entityType: string
): Promise<void> {
  const blob = await generateExcelTemplate(fields, entityType);
  downloadFile(blob, `${entityType}_import_template.xlsx`);
}
