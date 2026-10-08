import {
  CursorApiResponse,
  CursorPayload,
  DataRecord,
  FetchItemsParams,
  CreateRecordInput,
  UpdateRecordInput,
} from "@/types/record";
import { env } from "@/lib/env";

const API_BASE_URL = env.apiUrl;

/**
 * Base64 Cursor Utilities for opaque pagination pointers
 */
export function encodeCursor(payload: CursorPayload): string {
  try {
    const json = JSON.stringify(payload);
    if (typeof window !== "undefined") {
      return btoa(unescape(encodeURIComponent(json)));
    }
    return Buffer.from(json, "utf-8").toString("base64");
  } catch (err) {
    console.error("Failed to encode cursor:", err);
    return "";
  }
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    let json: string;
    if (typeof window !== "undefined") {
      json = decodeURIComponent(escape(atob(cursor)));
    } else {
      json = Buffer.from(cursor, "base64").toString("utf-8");
    }
    return JSON.parse(json) as CursorPayload;
  } catch (err) {
    console.warn("Invalid cursor format received:", err);
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * High-performance fetcher with native AbortSignal integration
 * to immediately discard inflight stale queries on rapid keystrokes.
 */
export async function fetchItems({
  query,
  cursor,
  limit = 50,
  status,
  category,
  signal,
}: FetchItemsParams): Promise<CursorApiResponse<DataRecord>> {
  const url = new URL(API_BASE_URL, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  if (query && query.trim().length > 0) {
    url.searchParams.set("q", query.trim());
  }

  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  if (limit) {
    url.searchParams.set("limit", limit.toString());
  }

  if (status && status !== "ALL") {
    url.searchParams.set("status", status);
  }

  if (category && category !== "ALL") {
    url.searchParams.set("category", category);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    signal, // Native AbortSignal hookup
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.message || `Failed to fetch records: HTTP ${response.status}`,
      errorBody
    );
  }

  return response.json();
}

/**
 * Create a new record
 */
export async function createItem(payload: CreateRecordInput): Promise<DataRecord> {
  const url = new URL(API_BASE_URL, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.message || "Failed to create record",
      errorBody
    );
  }

  const json = await response.json();
  return json.data;
}

/**
 * Update an existing record
 */
export async function updateItem(payload: UpdateRecordInput): Promise<DataRecord> {
  const url = new URL(`${API_BASE_URL}/${payload.id}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.message || "Failed to update record",
      errorBody
    );
  }

  const json = await response.json();
  return json.data;
}

/**
 * Delete a record by ID
 */
export async function deleteItem(id: string): Promise<{ success: boolean; id: string }> {
  const url = new URL(`${API_BASE_URL}/${id}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.message || "Failed to delete record",
      errorBody
    );
  }

  return response.json();
}
