/**
 * Centralized Application Environment Configuration
 * Provides strongly typed access to environment variables with fallback defaults.
 */

export const env = {
  // Public Client-side Variables
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "/api/records",
  defaultPageSize: Number(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE) || 50,
  maxPagesInMemory: Number(process.env.NEXT_PUBLIC_MAX_PAGES_IN_MEMORY) || 30,
  searchDebounceMs: Number(process.env.NEXT_PUBLIC_SEARCH_DEBOUNCE_MS) || 350,
  totalRecordsEstimate: Number(process.env.NEXT_PUBLIC_TOTAL_RECORDS_ESTIMATE) || 100_000_000,

  // Server-side Variables
  backendProxyUrl: process.env.BACKEND_PROXY_URL || "",
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;
