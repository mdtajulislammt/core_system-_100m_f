/**
 * Types & Schemas for 100M Dataset Cursor-Based Architecture
 */

export type RecordStatus = "ACTIVE" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "ARCHIVED";

export type RecordCategory = "TRANSACTION" | "TELEMETRY" | "AUDIT_LOG" | "CUSTOMER_EVENT" | "SECURITY_ALERT";

export interface DataRecord {
  id: string;
  sequenceNumber: number;
  title: string;
  identifier: string;
  category: RecordCategory;
  status: RecordStatus;
  amount: number;
  metadata: {
    ipAddress?: string;
    region?: string;
    latencyMs?: number;
    clientVersion?: string;
    riskScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CursorPayload {
  id: string;
  createdAt: string;
  sequenceNumber?: number;
}

export interface CursorPaginationMeta {
  hasNextPage: boolean;
  nextCursor: string | null; // Base64 encoded cursor
  previousCursor?: string | null;
  limit: number;
  totalEstimatedCount: number; // e.g. 100,000,000
  queryExecutionMs: number;
}

export interface CursorApiResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
  error?: string;
}

export interface FetchItemsParams {
  query?: string;
  cursor?: string | null;
  limit?: number;
  status?: RecordStatus | "ALL";
  category?: RecordCategory | "ALL";
  signal?: AbortSignal;
}

export interface CreateRecordInput {
  title: string;
  identifier: string;
  category: RecordCategory;
  status: RecordStatus;
  amount: number;
  metadata?: {
    region?: string;
    riskScore?: number;
  };
}

export interface UpdateRecordInput {
  id: string;
  title?: string;
  status?: RecordStatus;
  category?: RecordCategory;
  amount?: number;
  metadata?: {
    region?: string;
    riskScore?: number;
  };
}
