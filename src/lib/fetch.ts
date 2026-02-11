/**
 * Fetch utility with automatic retry for 401 errors.
 * Handles race conditions after login where the first request might fail
 * before the session is fully established.
 */

export class SessionExpiredError extends Error {
  constructor(shouldRedirect = true) {
    super("Session expired. Please refresh the page.");
    this.name = "SessionExpiredError";

    // Auto-redirect to signin when session expires (client-side only)
    if (shouldRedirect && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isAuthPage = ["/signin", "/signup", "/reset-password", "/update-password"].includes(currentPath);
      if (!isAuthPage) {
        window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
  }
}

export class FetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FetchError";
    this.status = status;
  }
}

interface FetchWithRetryOptions extends RequestInit {
  /** Number of retries for 401 errors (default: 1) */
  retries401?: number;
  /** Delay between retries in ms (default: 500) */
  retryDelay?: number;
}

/**
 * Fetch with automatic retry for 401 errors.
 * Use this for API calls that might fail right after login due to timing issues.
 */
export async function fetchWithRetry<T = unknown>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const { retries401 = 1, retryDelay = 500, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries401; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);

      if (!res.ok) {
        // Check for 401 or HTML response (redirect to login page)
        if (
          res.status === 401 ||
          res.headers.get("content-type")?.includes("text/html")
        ) {
          if (attempt < retries401) {
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          throw new SessionExpiredError();
        }

        const data = await res.json().catch(() => ({}));
        throw new FetchError(
          (data as Record<string, string>).error || `Request failed with status ${res.status}`,
          res.status
        );
      }

      return res.json();
    } catch (error) {
      if (error instanceof SessionExpiredError || error instanceof FetchError) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries401) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
    }
  }

  throw lastError || new Error("Request failed");
}

/**
 * SWR-compatible fetcher with 401 retry logic.
 * Use this as the fetcher in useSWR for API endpoints.
 */
export const swrFetcher = <T = unknown>(url: string): Promise<T> =>
  fetchWithRetry<T>(url);
