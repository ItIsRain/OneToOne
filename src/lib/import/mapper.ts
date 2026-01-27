import { ColumnMapping, EntityType, FieldDefinition } from './types';
import { getFieldDefinitions } from './field-definitions';

// Normalize string for comparison
function normalize(str: string): string {
  return str.toLowerCase().replace(/[_\-\s]+/g, '').trim();
}

// Calculate similarity score between two strings (0-1)
function similarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);

  if (normA === normB) return 1;
  if (normA.includes(normB) || normB.includes(normA)) return 0.8;

  // Levenshtein distance-based similarity
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(normA, normB);
  return 1 - distance / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Find the best matching field for a CSV column header
function findBestMatch(
  csvHeader: string,
  fields: FieldDefinition[],
  usedFields: Set<string>
): { field: FieldDefinition | null; score: number } {
  let bestMatch: FieldDefinition | null = null;
  let bestScore = 0;
  const THRESHOLD = 0.6; // Minimum score to consider a match

  for (const field of fields) {
    if (usedFields.has(field.name)) continue;

    // Check exact match with field name
    if (normalize(csvHeader) === normalize(field.name)) {
      return { field, score: 1 };
    }

    // Check exact match with field label
    if (normalize(csvHeader) === normalize(field.label)) {
      return { field, score: 1 };
    }

    // Check aliases
    for (const alias of field.aliases) {
      const aliasScore = similarity(csvHeader, alias);
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
        bestMatch = field;
      }
    }

    // Check against field name and label
    const nameScore = similarity(csvHeader, field.name);
    const labelScore = similarity(csvHeader, field.label);
    const maxScore = Math.max(nameScore, labelScore);

    if (maxScore > bestScore) {
      bestScore = maxScore;
      bestMatch = field;
    }
  }

  // Only return match if score is above threshold
  if (bestScore >= THRESHOLD) {
    return { field: bestMatch, score: bestScore };
  }

  return { field: null, score: 0 };
}

// Auto-map CSV headers to database fields
export function autoMapColumns(
  headers: string[],
  rows: Record<string, unknown>[],
  entityType: EntityType
): ColumnMapping[] {
  const fields = getFieldDefinitions(entityType);
  const usedFields = new Set<string>();
  const mappings: ColumnMapping[] = [];

  // Get sample values for each header
  const getSampleValues = (header: string): string[] => {
    const values: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const val = rows[i][header];
      if (val !== null && val !== undefined && val !== '') {
        const strVal = String(val).trim();
        if (strVal && !seen.has(strVal)) {
          seen.add(strVal);
          values.push(strVal);
          if (values.length >= 3) break;
        }
      }
    }

    return values;
  };

  // First pass: find all matches with their scores
  const matchResults: Array<{
    header: string;
    field: FieldDefinition | null;
    score: number;
    sampleValues: string[];
  }> = [];

  for (const header of headers) {
    const { field, score } = findBestMatch(header, fields, usedFields);
    const sampleValues = getSampleValues(header);

    matchResults.push({ header, field, score, sampleValues });

    if (field && score >= 0.8) {
      // High confidence match, mark as used
      usedFields.add(field.name);
    }
  }

  // Second pass: resolve conflicts for lower confidence matches
  for (const result of matchResults) {
    if (result.field && !usedFields.has(result.field.name) && result.score >= 0.6) {
      usedFields.add(result.field.name);
    }
  }

  // Create final mappings
  for (const result of matchResults) {
    const dbField = result.field && usedFields.has(result.field.name) ? result.field.name : null;
    mappings.push({
      csvColumn: result.header,
      dbField,
      sampleValues: result.sampleValues,
    });
  }

  return mappings;
}

// Check if all required fields are mapped
export function validateMappings(
  mappings: ColumnMapping[],
  entityType: EntityType
): { valid: boolean; missingFields: string[] } {
  const fields = getFieldDefinitions(entityType);
  const requiredFields = fields.filter((f) => f.required);
  const mappedFields = new Set(mappings.filter((m) => m.dbField).map((m) => m.dbField));

  const missingFields: string[] = [];
  for (const reqField of requiredFields) {
    if (!mappedFields.has(reqField.name)) {
      missingFields.push(reqField.label);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

// Get unmapped available fields (for dropdown)
export function getAvailableFields(
  mappings: ColumnMapping[],
  entityType: EntityType,
  currentMappingIndex?: number
): FieldDefinition[] {
  const fields = getFieldDefinitions(entityType);
  const mappedFields = new Set(
    mappings
      .filter((m, i) => m.dbField && i !== currentMappingIndex)
      .map((m) => m.dbField)
  );

  return fields.filter((f) => !mappedFields.has(f.name));
}
