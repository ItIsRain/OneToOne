/**
 * Simple logger that suppresses debug/info logging in production.
 * Errors are always logged.
 */

const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  /** Debug info — only shown in development */
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /** General info — only shown in development */
  info: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /** Warnings — always shown */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /** Errors — always shown */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
