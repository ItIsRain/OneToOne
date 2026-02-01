"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import {
  EntityType,
  WizardStep,
  ParsedFile,
  ColumnMapping,
  ValidationError,
  ImportConfig,
  ImportResult,
} from "@/lib/import/types";
import {
  getFieldDefinitions,
  getDefaultDuplicateKey,
} from "@/lib/import/field-definitions";
import { parseFile, downloadCSVTemplate, downloadExcelTemplate, getFileType } from "@/lib/import/parsers";
import { autoMapColumns, validateMappings, getAvailableFields } from "@/lib/import/mapper";
import { transformRow } from "@/lib/import/validators";

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  onImportComplete?: () => void;
}

const STEP_LABELS: Record<WizardStep, string> = {
  upload: "Upload File",
  mapping: "Map Fields",
  preview: "Preview & Validate",
  options: "Import Options",
  progress: "Import Progress",
};

const STEP_ORDER: WizardStep[] = ["upload", "mapping", "preview", "options", "progress"];

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  entityType,
  onImportComplete,
}) => {
  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedFile | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [config, setConfig] = useState<ImportConfig>({
    duplicateHandling: "skip",
    duplicateKey: getDefaultDuplicateKey(entityType),
    skipInvalidRows: true,
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes or entity type changes
  useEffect(() => {
    if (isOpen) {
      setStep("upload");
      setFile(null);
      setParsedData(null);
      setMappings([]);
      setValidationErrors([]);
      setValidCount(0);
      setInvalidCount(0);
      setDuplicateCount(0);
      setConfig({
        duplicateHandling: "skip",
        duplicateKey: getDefaultDuplicateKey(entityType),
        skipInvalidRows: true,
      });
      setImportResult(null);
      setIsProcessing(false);
      setError(null);
      setProgress(0);
    }
  }, [isOpen, entityType]);

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const currentStepIndex = STEP_ORDER.indexOf(step);

  // File handling
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    const fileType = getFileType(selectedFile);

    if (!fileType) {
      setError("Unsupported file format. Please upload a CSV or Excel file (.csv, .xlsx, .xls).");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("File is too large. Maximum file size is 25MB.");
      return;
    }

    setIsProcessing(true);
    setFile(selectedFile);

    try {
      const parsed = await parseFile(selectedFile);
      setParsedData(parsed);

      // Auto-map columns
      const autoMappings = autoMapColumns(parsed.headers, parsed.rows, entityType);
      setMappings(autoMappings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, [entityType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  // Mapping handling
  const handleMappingChange = useCallback((index: number, dbField: string | null) => {
    setMappings(prev => {
      const newMappings = [...prev];
      newMappings[index] = { ...newMappings[index], dbField };
      return newMappings;
    });
  }, []);

  // Validate data (for preview step)
  const validateData = useCallback(async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Transform rows with current mappings
      const transformedData = parsedData.rows.map(row =>
        transformRow(row, mappings, entityType)
      );

      // Call validation API
      const response = await fetch("/api/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          sample: transformedData.slice(0, 100), // Validate first 100 rows
          duplicateKey: config.duplicateKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Validation failed");
        return;
      }

      setValidCount(result.valid);
      setInvalidCount(result.invalid);
      setDuplicateCount(result.duplicates);
      setValidationErrors(result.errors || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setIsProcessing(false);
    }
  }, [parsedData, mappings, entityType, config.duplicateKey]);

  // Run import
  const runImport = useCallback(async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Transform all rows
      const transformedData = parsedData.rows.map(row =>
        transformRow(row, mappings, entityType)
      );

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          data: transformedData,
          config,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Import failed");
        return;
      }

      setImportResult(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsProcessing(false);
    }
  }, [parsedData, mappings, entityType, config]);

  // Navigation
  const canProceed = useCallback(() => {
    switch (step) {
      case "upload":
        return parsedData !== null;
      case "mapping":
        const { valid } = validateMappings(mappings, entityType);
        return valid;
      case "preview":
        return validCount > 0 || config.skipInvalidRows;
      case "options":
        return true;
      default:
        return false;
    }
  }, [step, parsedData, mappings, entityType, validCount, config.skipInvalidRows]);

  const handleNext = useCallback(async () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];

      if (nextStep === "preview") {
        await validateData();
      } else if (nextStep === "progress") {
        await runImport();
      }

      setStep(nextStep);
    }
  }, [step, validateData, runImport]);

  const handleBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [step]);

  const handleClose = useCallback(() => {
    if (importResult && onImportComplete) {
      onImportComplete();
    }
    onClose();
  }, [importResult, onImportComplete, onClose]);

  // Download error report
  const downloadErrorReport = useCallback(() => {
    if (!importResult?.errors.length) return;

    const csv = [
      "Row,Field,Value,Error",
      ...importResult.errors.map(e =>
        `${e.row},"${e.field}","${String(e.value).replace(/"/g, '""')}","${e.message}"`
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import_errors_${entityType}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [importResult, entityType]);

  const fields = getFieldDefinitions(entityType);
  const mappingValidation = validateMappings(mappings, entityType);

  const selectClassName = "h-10 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Import {entityLabel}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Step {currentStepIndex + 1} of {STEP_ORDER.length}: {STEP_LABELS[step]}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-6 flex items-center gap-2">
        {STEP_ORDER.map((s, idx) => (
          <React.Fragment key={s}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                idx < currentStepIndex
                  ? "bg-brand-500 text-white"
                  : idx === currentStepIndex
                  ? "bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800"
              }`}
            >
              {idx < currentStepIndex ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            {idx < STEP_ORDER.length - 1 && (
              <div
                className={`h-0.5 flex-1 ${
                  idx < currentStepIndex ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                isDragging
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : file
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-300 hover:border-brand-400 dark:border-gray-700 dark:hover:border-brand-600"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <svg className="h-12 w-12 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Parsing file...</p>
                </div>
              ) : file && parsedData ? (
                <div className="flex flex-col items-center text-center">
                  <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-4 text-sm font-medium text-gray-800 dark:text-white">{file.name}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {parsedData.totalRows} rows, {parsedData.headers.length} columns
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setParsedData(null);
                      setMappings([]);
                    }}
                    className="mt-2 text-sm text-brand-500 hover:text-brand-600"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-4 text-sm font-medium text-gray-800 dark:text-white">
                    Drop CSV or Excel file here
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    or click to browse
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Supports: .csv, .xlsx, .xls (max 25MB)
                  </p>
                </div>
              )}
            </div>

            {/* Template downloads */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Download template:</span>
              <button
                type="button"
                onClick={() => downloadCSVTemplate(fields, entityType)}
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => downloadExcelTemplate(fields, entityType)}
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                Excel
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Field Mapping */}
        {step === "mapping" && parsedData && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="col-span-4">CSV Column</div>
                <div className="col-span-1 text-center"></div>
                <div className="col-span-4">Database Field</div>
                <div className="col-span-3">Sample Values</div>
              </div>

              <div className="max-h-[350px] overflow-y-auto">
                {mappings.map((mapping, index) => {
                  const availableFields = getAvailableFields(mappings, entityType, index);
                  const currentField = mapping.dbField
                    ? fields.find(f => f.name === mapping.dbField)
                    : null;

                  return (
                    <div
                      key={mapping.csvColumn}
                      className="grid grid-cols-12 gap-4 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-800"
                    >
                      <div className="col-span-4 flex items-center text-sm text-gray-800 dark:text-white">
                        {mapping.csvColumn}
                      </div>
                      <div className="col-span-1 flex items-center justify-center text-gray-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                      <div className="col-span-4">
                        <select
                          value={mapping.dbField || ""}
                          onChange={(e) => handleMappingChange(index, e.target.value || null)}
                          className={selectClassName}
                        >
                          <option value="">Skip column</option>
                          {currentField && (
                            <option value={currentField.name}>
                              {currentField.label}{currentField.required ? " *" : ""}
                            </option>
                          )}
                          {availableFields.map(field => (
                            <option key={field.name} value={field.name}>
                              {field.label}{field.required ? " *" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3 flex items-center">
                        <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {mapping.sampleValues.slice(0, 2).join(", ")}
                          {mapping.sampleValues.length > 2 && "..."}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mapping status */}
            {!mappingValidation.valid && (
              <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Missing required fields: {mappingValidation.missingFields.join(", ")}
                </div>
              </div>
            )}

            {mappingValidation.valid && (
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All required fields mapped
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview & Validation */}
        {step === "preview" && parsedData && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="rounded-lg bg-green-50 px-4 py-2 dark:bg-green-900/20">
                <span className="text-sm text-green-800 dark:text-green-400">
                  {validCount} valid rows
                </span>
              </div>
              {invalidCount > 0 && (
                <div className="rounded-lg bg-amber-50 px-4 py-2 dark:bg-amber-900/20">
                  <span className="text-sm text-amber-800 dark:text-amber-400">
                    {invalidCount} rows with errors
                  </span>
                </div>
              )}
              {duplicateCount > 0 && (
                <div className="rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-900/20">
                  <span className="text-sm text-blue-800 dark:text-blue-400">
                    {duplicateCount} potential duplicates
                  </span>
                </div>
              )}
            </div>

            {/* Filter toggle */}
            {validationErrors.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowErrorsOnly(false)}
                  className={`text-sm ${!showErrorsOnly ? "font-medium text-brand-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Show all
                </button>
                <button
                  type="button"
                  onClick={() => setShowErrorsOnly(true)}
                  className={`text-sm ${showErrorsOnly ? "font-medium text-brand-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Show errors only
                </button>
              </div>
            )}

            {/* Preview table */}
            <div className="max-h-[300px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Row
                    </th>
                    {mappings
                      .filter(m => m.dbField)
                      .slice(0, 5)
                      .map(m => (
                        <th key={m.dbField} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          {fields.find(f => f.name === m.dbField)?.label || m.dbField}
                        </th>
                      ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {parsedData.rows.slice(0, 20).map((row, idx) => {
                    const rowErrors = validationErrors.filter(e => e.row === idx + 1);
                    const hasErrors = rowErrors.length > 0;

                    if (showErrorsOnly && !hasErrors) return null;

                    return (
                      <tr key={idx} className={hasErrors ? "bg-red-50/50 dark:bg-red-900/10" : ""}>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                          {idx + 1}
                        </td>
                        {mappings
                          .filter(m => m.dbField)
                          .slice(0, 5)
                          .map(m => {
                            const cellError = rowErrors.find(e => e.field === m.dbField);
                            return (
                              <td
                                key={m.dbField}
                                className={`px-4 py-2 text-sm ${
                                  cellError ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-white"
                                }`}
                                title={cellError?.message}
                              >
                                <span className="truncate block max-w-[150px]">
                                  {String(row[m.csvColumn] || "")}
                                </span>
                              </td>
                            );
                          })}
                        <td className="px-4 py-2">
                          {hasErrors ? (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400" title={rowErrors.map(e => e.message).join(", ")}>
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {rowErrors[0].message}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {parsedData.totalRows > 20 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing first 20 of {parsedData.totalRows} rows
              </p>
            )}
          </div>
        )}

        {/* Step 4: Import Options */}
        {step === "options" && (
          <div className="space-y-6">
            {/* Duplicate handling */}
            <div>
              <Label>Duplicate Handling (by {config.duplicateKey})</Label>
              <div className="mt-2 space-y-2">
                {[
                  { value: "skip", label: "Skip duplicates", desc: "Keep existing records, skip new ones" },
                  { value: "update", label: "Update existing records", desc: "Merge new data into existing records" },
                  { value: "create_new", label: "Create new (allow duplicates)", desc: "Import all rows regardless of duplicates" },
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      config.duplicateHandling === option.value
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="duplicateHandling"
                      value={option.value}
                      checked={config.duplicateHandling === option.value}
                      onChange={() => setConfig(prev => ({ ...prev, duplicateHandling: option.value as ImportConfig["duplicateHandling"] }))}
                      className="mt-0.5 h-4 w-4 text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-white">{option.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Skip invalid rows */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="skipInvalidRows"
                checked={config.skipInvalidRows}
                onChange={(e) => setConfig(prev => ({ ...prev, skipInvalidRows: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="skipInvalidRows" className="cursor-pointer">
                <div className="text-sm font-medium text-gray-800 dark:text-white">
                  Skip invalid rows
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Import valid rows and skip those with errors
                </div>
              </label>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <h4 className="text-sm font-medium text-gray-800 dark:text-white">Import Summary</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Total rows: {parsedData?.totalRows || 0}</li>
                <li>Valid rows: {validCount}</li>
                {invalidCount > 0 && <li>Invalid rows: {invalidCount} (will be {config.skipInvalidRows ? "skipped" : "rejected"})</li>}
                {duplicateCount > 0 && <li>Potential duplicates: {duplicateCount}</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Step 5: Progress & Results */}
        {step === "progress" && (
          <div className="flex flex-col items-center justify-center py-8">
            {isProcessing ? (
              <>
                <p className="text-lg font-medium text-gray-800 dark:text-white">
                  Importing... {progress}%
                </p>
                <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : importResult ? (
              <div className="w-full max-w-md space-y-6">
                {/* Result icon */}
                <div className="flex justify-center">
                  {importResult.success ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {importResult.imported}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-500">Imported</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {importResult.updated}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-500">Updated</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {importResult.skipped}
                    </div>
                    <div className="text-xs text-gray-500">Skipped</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {importResult.failed}
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-500">Failed</div>
                  </div>
                </div>

                {/* Download error report */}
                {importResult.errors.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadErrorReport}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download error report
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
        <div>
          {step !== "upload" && step !== "progress" && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isProcessing}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {step === "progress" && importResult ? "Done" : "Cancel"}
          </button>

          {step !== "progress" && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isProcessing}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : step === "options" ? (
                "Import"
              ) : (
                "Next"
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
