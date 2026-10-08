"use client";

import React, { useEffect, useState } from "react";
import { Search, X, Plus, Filter, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecordCategory, RecordStatus } from "@/types/record";

interface TableHeaderControlsProps {
  onSearchChange: (query: string) => void;
  status: RecordStatus | "ALL";
  onStatusChange: (status: RecordStatus | "ALL") => void;
  category: RecordCategory | "ALL";
  onCategoryChange: (category: RecordCategory | "ALL") => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  isFetching: boolean;
  totalEstimatedCount?: number;
}

export function TableHeaderControls({
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  limit,
  onLimitChange,
  onOpenCreateModal,
  onRefresh,
  isFetching,
}: TableHeaderControlsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Propagate search changes
  useEffect(() => {
    onSearchChange(searchTerm);
  }, [searchTerm, onSearchChange]);

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 backdrop-blur-md">
      {/* Top row: Search input & Action Buttons */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search across 100,000,000 records (e.g. Cluster 1, TXN-9F3A, rec_000000042)..."
            className="pl-9 pr-9 bg-zinc-900/60 border-zinc-700/60 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            className="h-9 gap-1.5"
            title="Refetch current dataset page"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-indigo-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenCreateModal}
            className="h-9 gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-md shadow-indigo-900/30"
          >
            <Plus className="h-4 w-4" />
            <span>Create Record</span>
          </Button>
        </div>
      </div>

      {/* Bottom row: Filter selectors and Page Limit */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-800/60 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-medium">Filter by:</span>
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as RecordStatus | "ALL")}
            aria-label="Filter status"
            className="h-7 rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-xs text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="FAILED">FAILED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as RecordCategory | "ALL")}
            aria-label="Filter category"
            className="h-7 rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-xs text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="TRANSACTION">TRANSACTION</option>
            <option value="TELEMETRY">TELEMETRY</option>
            <option value="AUDIT_LOG">AUDIT_LOG</option>
            <option value="CUSTOMER_EVENT">CUSTOMER_EVENT</option>
            <option value="SECURITY_ALERT">SECURITY_ALERT</option>
          </select>

          {/* Page Limit Selector */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-zinc-500">Page size:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Page size limit"
              className="h-7 rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-xs text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
            >
              <option value={25}>25 / batch</option>
              <option value={50}>50 / batch</option>
              <option value={100}>100 / batch</option>
              <option value={200}>200 / batch</option>
            </select>
          </div>
        </div>

        {/* AbortController & Debounce Telemetry Badge */}
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="inline-flex items-center gap-1 rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-400 border border-zinc-800">
            <Zap className="h-3 w-3 text-amber-400" />
            Debounce: 350ms + AbortSignal Active
          </span>
        </div>
      </div>
    </div>
  );
}
