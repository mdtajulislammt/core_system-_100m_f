import { NextRequest, NextResponse } from "next/server";
import { DataRecord } from "@/types/record";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedItem: Partial<DataRecord> = {
      id,
      title: body.title,
      status: body.status,
      category: body.category,
      amount: body.amount,
      metadata: body.metadata,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        id,
        sequenceNumber: 1,
        title: body.title || "Updated Record",
        identifier: "TXN-UPDATED",
        category: body.category || "AUDIT_LOG",
        status: body.status || "ACTIVE",
        amount: body.amount || 100,
        metadata: body.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updatedItem,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update record" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    success: true,
    id,
    message: "Record marked as deleted",
  });
}
