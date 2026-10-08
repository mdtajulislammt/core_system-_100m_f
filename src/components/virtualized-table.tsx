"use client";

import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DataRecord, RecordCategory, RecordStatus } from "@/types/record";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import {
  ArrowUp,
  Edit2,
  Trash2,
  Copy,
  Check,
  Activity,
  AlertTriangle,
  RotateCw,
  Server,
  Database,
  Cpu,
} from "lucide-react";

interface VirtualizedTableProps {
  data: DataRecord[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  onEditRecord: (record: DataRecord) => void;
  onDeleteRecord: (record: DataRecord) => void;
  totalCount?: number;
  queryExecutionMs?: number;
}

export function VirtualizedTable({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  isError,
  error,
  onRetry,
  onEditRecord,
  onDeleteRecord,
  totalCount = 100_000_000,
  queryExecutionMs = 0,
}: VirtualizedTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }, []);

  const getStatusBadge = (status: RecordStatus) => {
    switch (status) {
      case "ACTIVE":
      case "COMPLETED":
        return <Badge variant="success">{status}</Badge>;
      case "PENDING":
      case "PROCESSING":
        return <Badge variant="warning">{status}</Badge>;
      case "FAILED":
        return <Badge variant="destructive">{status}</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: RecordCategory) => {
    switch (category) {
      case "TRANSACTION":
        return <Badge variant="info">TRANSACTION</Badge>;
      case "SECURITY_ALERT":
        return <Badge variant="destructive">SECURITY</Badge>;
      case "AUDIT_LOG":
        return <Badge variant="secondary">AUDIT</Badge>;
      case "TELEMETRY":
        return <Badge variant="default">TELEMETRY</Badge>;
      case "CUSTOMER_EVENT":
        return <Badge variant="warning">CUSTOMER</Badge>;
    }
  };

  // Table column specifications
  const columns = useMemo<ColumnDef<DataRecord>[]>(
    () => [
      {
        accessorKey: "sequenceNumber",
        header: "#",
        size: 80,
        cell: (info) => (
          <span className="font-mono text-xs text-zinc-500">
            {formatNumber(info.getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "identifier",
        header: "Transaction ID",
        size: 160,
        cell: (info) => {
          const id = info.row.original.id;
          const identifier = info.getValue<string>();
          const isCopied = copiedId === id;
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-300">
              <span className="truncate">{identifier}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(identifier, id);
                }}
                className="opacity-60 hover:opacity-100 transition-opacity p-0.5 text-zinc-400 hover:text-zinc-200"
                title="Copy identifier"
                aria-label="Copy identifier"
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Record Title",
        size: 260,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-zinc-100 truncate">
              {info.getValue<string>()}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              ID: {info.row.original.id}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        size: 130,
        cell: (info) => getCategoryBadge(info.getValue<RecordCategory>()),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        cell: (info) => getStatusBadge(info.getValue<RecordStatus>()),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        size: 110,
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-emerald-400">
            {formatCurrency(info.getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "metadata",
        header: "Telemetry / Node",
        size: 170,
        cell: (info) => {
          const meta = info.row.original.metadata;
          return (
            <div className="flex flex-col text-[11px] text-zinc-400 font-mono">
              <span>{meta?.region || "global"} • {meta?.latencyMs ? `${meta.latencyMs}ms` : "N/A"}</span>
              <span className="text-zinc-600">{meta?.ipAddress || "0.0.0.0"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        size: 180,
        cell: (info) => (
          <span className="font-mono text-xs text-zinc-400">
            {formatDate(info.getValue<string>())}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 90,
        cell: (info) => {
          const record = info.row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-indigo-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditRecord(record);
                }}
                title="Edit Record"
                aria-label="Edit Record"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-rose-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRecord(record);
                }}
                title="Delete Record"
                aria-label="Delete Record"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [copiedId, copyToClipboard, onEditRecord, onDeleteRecord]
  );

  // TanStack React Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  // TanStack Virtualizer instance for windowing
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // 52px fixed estimated height per row
    overscan: 8, // Maintain small overscan buffer for smooth 60fps scrolling
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Trigger infinite scroll when scrolling near bottom
  useEffect(() => {
    const lastItem = virtualRows[virtualRows.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= rows.length - 1 - 6 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualRows, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Monitor scroll for scroll-to-top button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setShowScrollTop(target.scrollTop > 300);

    // Fallback infinite scroll trigger on bottom proximity
    if (
      target.scrollHeight - target.scrollTop - target.clientHeight < 350 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  const scrollToTop = () => {
    parentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur-md overflow-hidden relative">
      {/* Realtime Performance Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Database className="h-3.5 w-3.5" />
            <span>Dataset: <strong>{formatNumber(totalCount)}</strong> records</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-emerald-400">
            <Cpu className="h-3.5 w-3.5" />
            <span>Active DOM Rows: <strong>{virtualRows.length}</strong> (Virtual Windowed)</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-zinc-400">
            <Server className="h-3.5 w-3.5" />
            <span>Fetched In Cache: <strong>{formatNumber(rows.length)}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-zinc-400">
          {queryExecutionMs > 0 && (
            <span className="text-[11px] text-zinc-400">
              Query Exec: <span className="text-emerald-400 font-semibold">{queryExecutionMs}ms</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-emerald-400">
            <Activity className="h-3 w-3 animate-pulse" />
            60 FPS VSync
          </span>
        </div>
      </div>

      {/* Main Virtualized Container */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="h-[620px] overflow-auto relative scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
        style={{ contain: "strict" }}
      >
        <table className="w-full border-collapse text-left text-sm">
          {/* Sticky Header Locked with High Z-Index */}
          <thead className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 select-none"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Virtual Window Body */}
          <tbody
            style={{
              height: `${totalSize}px`,
              position: "relative",
              display: "block",
            }}
          >
            {/* Initial Loading Skeleton */}
            {isLoading && rows.length === 0 ? (
              Array.from({ length: 12 }).map((_, idx) => (
                <tr
                  key={idx}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${idx * 52}px)`,
                    height: "52px",
                  }}
                  className="flex items-center px-4 border-b border-zinc-900/60"
                >
                  <td className="w-full flex items-center gap-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-48 flex-1" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 && !isError ? (
              /* Empty Search Results */
              <tr
                style={{
                  position: "absolute",
                  top: "140px",
                  left: 0,
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <AlertTriangle className="h-8 w-8 text-amber-500/70" />
                    <p className="text-base font-medium text-zinc-200">No records found</p>
                    <p className="text-xs text-zinc-500 max-w-sm">
                      Try adjusting your search criteria or filter tags.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              /* Virtualized Dynamic Rows */
              virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="flex items-center border-b border-zinc-900/80 bg-zinc-950/40 hover:bg-zinc-900/60 transition-colors duration-75 group select-text cursor-default"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: `${cell.column.getSize()}px` }}
                        className="px-4 py-2.5 shrink-0 flex items-center overflow-hidden"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Network Error Overlay & Retry Handler */}
        {isError && (
          <div className="sticky bottom-0 z-30 flex items-center justify-between border-t border-rose-800/80 bg-rose-950/90 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-rose-200 text-xs">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>
                <strong>Network Error:</strong> {error?.message || "Failed to stream records from backend."}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 text-xs border-rose-700 bg-rose-900/60 hover:bg-rose-900 text-rose-100"
            >
              <RotateCw className="mr-1.5 h-3 w-3" />
              Retry Stream
            </Button>
          </div>
        )}

        {/* Infinite Scroll Fetching Indicator */}
        {isFetchingNextPage && (
          <div className="sticky bottom-0 z-30 flex items-center justify-center gap-2 border-t border-zinc-800 bg-zinc-950/90 py-2.5 text-xs text-indigo-300 backdrop-blur-md">
            <RotateCw className="h-3.5 w-3.5 animate-spin" />
            <span>Streaming next cursor batch from 100M cluster...</span>
          </div>
        )}
      </div>

      {/* Table Footer with Summary and Scroll-to-Top Helper */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/40 px-4 py-2.5 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong>{rows.length}</strong> loaded of{" "}
            <strong>{formatNumber(totalCount)}</strong> total records
          </span>
          {hasNextPage && (
            <span className="text-[11px] text-zinc-500">
              (Scroll down to continuously load more)
            </span>
          )}
        </div>

        {/* Scroll-To-Top Helper Button */}
        {showScrollTop && (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToTop}
            className="h-7 gap-1 bg-zinc-900/90 text-xs text-zinc-300 border-zinc-700 hover:text-white"
          >
            <ArrowUp className="h-3 w-3" />
            Top
          </Button>
        )}
      </div>
    </div>
  );
}
