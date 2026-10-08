import { NextRequest, NextResponse } from "next/server";
import { CursorApiResponse, DataRecord, RecordCategory, RecordStatus } from "@/types/record";
import { env } from "@/lib/env";

// In-memory delta store for session mutations (create, edit, delete)
// Combined with deterministic generator for remaining 100M records
const sessionCreatedRecords: Map<string, DataRecord> = new Map();
const sessionUpdatedRecords: Map<string, Partial<DataRecord>> = new Map();
const sessionDeletedIds: Set<string> = new Set();

const TOTAL_100M_COUNT = env.totalRecordsEstimate;

const CATEGORIES: RecordCategory[] = [
  "TRANSACTION",
  "TELEMETRY",
  "AUDIT_LOG",
  "CUSTOMER_EVENT",
  "SECURITY_ALERT",
];

const STATUSES: RecordStatus[] = [
  "ACTIVE",
  "COMPLETED",
  "PENDING",
  "PROCESSING",
  "FAILED",
  "ARCHIVED",
];

const REGIONS = ["us-east-1", "us-west-2", "eu-central-1", "ap-southeast-1", "sa-east-1"];

function generateDeterministicRecord(sequence: number): DataRecord {
  // Deterministic PRNG based on sequence index
  const catIdx = (sequence * 3) % CATEGORIES.length;
  const statIdx = (sequence * 7) % STATUSES.length;
  const regIdx = (sequence * 11) % REGIONS.length;
  const amount = parseFloat(((sequence * 17.37) % 5000 + 10).toFixed(2));
  const latency = (sequence * 13) % 250 + 5;
  const risk = (sequence * 23) % 100;

  // Timestamps descending backwards from 2026-10-08
  const baseTime = 1791439200000; // ~2026-10-08
  const timestamp = new Date(baseTime - sequence * 60000).toISOString();

  const id = `rec_${sequence.toString().padStart(9, "0")}`;

  return {
    id,
    sequenceNumber: sequence,
    title: `Record #${sequence.toLocaleString()} - Cluster ${regIdx + 1}`,
    identifier: `TXN-${(sequence * 99991).toString(16).toUpperCase().padStart(8, "0")}`,
    category: CATEGORIES[catIdx],
    status: STATUSES[statIdx],
    amount,
    metadata: {
      ipAddress: `192.168.${(sequence % 254) + 1}.${((sequence * 3) % 254) + 1}`,
      region: REGIONS[regIdx],
      latencyMs: latency,
      clientVersion: `v${((sequence % 5) + 1)}.${sequence % 9}.0`,
      riskScore: risk,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get("q")?.toLowerCase() || "";
  const status = searchParams.get("status") || "ALL";
  const category = searchParams.get("category") || "ALL";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 10), 200);
  const cursor = searchParams.get("cursor");

  // Determine starting sequence number from Base64 cursor
  let startingSequence = 1;
  if (cursor) {
    try {
      const decodedJson = Buffer.from(cursor, "base64").toString("utf-8");
      const cursorObj = JSON.parse(decodedJson);
      if (typeof cursorObj.sequenceNumber === "number") {
        startingSequence = cursorObj.sequenceNumber + 1;
      }
    } catch (e) {
      console.warn("Invalid cursor passed to API, defaulting to start", e);
      startingSequence = 1;
    }
  }

  const items: DataRecord[] = [];
  let currentSeq = startingSequence;
  let inspectedCount = 0;
  const maxInspect = limit * 20; // Bound search scan iterations to avoid CPU spikes

  // If page 1, first add any session created records matching filters
  if (startingSequence === 1) {
    for (const record of sessionCreatedRecords.values()) {
      if (sessionDeletedIds.has(record.id)) continue;
      if (status !== "ALL" && record.status !== status) continue;
      if (category !== "ALL" && record.category !== category) continue;
      if (
        query &&
        !record.title.toLowerCase().includes(query) &&
        !record.identifier.toLowerCase().includes(query)
      ) {
        continue;
      }
      items.push(record);
      if (items.length >= limit) break;
    }
  }

  // Generate deterministic records for the 100M stream
  while (items.length < limit && currentSeq <= TOTAL_100M_COUNT && inspectedCount < maxInspect) {
    inspectedCount++;
    const id = `rec_${currentSeq.toString().padStart(9, "0")}`;

    if (!sessionDeletedIds.has(id)) {
      let record = generateDeterministicRecord(currentSeq);

      // Apply any session mutations
      if (sessionUpdatedRecords.has(id)) {
        record = { ...record, ...sessionUpdatedRecords.get(id) };
      }

      // Filter checks
      const matchesStatus = status === "ALL" || record.status === status;
      const matchesCategory = category === "ALL" || record.category === category;
      const matchesQuery =
        !query ||
        record.title.toLowerCase().includes(query) ||
        record.identifier.toLowerCase().includes(query) ||
        record.id.toLowerCase().includes(query);

      if (matchesStatus && matchesCategory && matchesQuery) {
        items.push(record);
      }
    }

    currentSeq++;
  }

  const hasNextPage = currentSeq <= TOTAL_100M_COUNT && items.length > 0;
  const lastItem = items[items.length - 1];

  let nextCursor: string | null = null;
  if (hasNextPage && lastItem) {
    const cursorPayload = {
      id: lastItem.id,
      sequenceNumber: lastItem.sequenceNumber,
      createdAt: lastItem.createdAt,
    };
    nextCursor = Buffer.from(JSON.stringify(cursorPayload), "utf-8").toString("base64");
  }

  const queryExecutionMs = parseFloat((performance.now() - startTime).toFixed(2));

  const response: CursorApiResponse<DataRecord> = {
    data: items,
    meta: {
      hasNextPage,
      nextCursor,
      limit,
      totalEstimatedCount: TOTAL_100M_COUNT - sessionDeletedIds.size + sessionCreatedRecords.size,
      queryExecutionMs,
    },
  };

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newSeq = 100_000_000 + sessionCreatedRecords.size + 1;
    const newId = `rec_${newSeq}`;

    const newRecord: DataRecord = {
      id: newId,
      sequenceNumber: newSeq,
      title: body.title || `New Record #${newSeq}`,
      identifier: body.identifier || `TXN-CUSTOM-${Date.now().toString(16).toUpperCase()}`,
      category: body.category || "AUDIT_LOG",
      status: body.status || "ACTIVE",
      amount: typeof body.amount === "number" ? body.amount : 0,
      metadata: body.metadata || { region: "us-east-1", riskScore: 10 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sessionCreatedRecords.set(newId, newRecord);

    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
