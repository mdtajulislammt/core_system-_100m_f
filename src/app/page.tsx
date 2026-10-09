"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRecordsInfiniteQuery } from "@/hooks/use-records-query";
import { TableHeaderControls } from "@/components/table-header-controls";
import { VirtualizedTable } from "@/components/virtualized-table";
import { PerformanceTelemetry } from "@/components/performance-telemetry";
import {
  CreateRecordModal,
  EditRecordModal,
  DeleteRecordModal,
} from "@/components/record-crud-dialogs";
import { DataRecord, RecordCategory, RecordStatus } from "@/types/record";
import { env } from "@/lib/env";
import {
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

function RecordsDashboardContent() {
  // Query parameters state
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<RecordStatus | "ALL">("ALL");
  const [category, setCategory] = useState<RecordCategory | "ALL">("ALL");
  const [limit, setLimit] = useState(env.defaultPageSize);

  // Debounced search query configured via environment variables
  const debouncedQuery = useDebounce(searchInput, env.searchDebounceMs);

  // CRUD Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DataRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DataRecord | null>(null);

  // Toast / notification feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // TanStack Infinite Query with cursor pagination & memory guard
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isError,
    error,
  } = useRecordsInfiniteQuery({
    query: debouncedQuery,
    status,
    category,
    limit,
    maxPages: env.maxPagesInMemory,
  });

  // Flatten nested pages from useInfiniteQuery
  const flatData = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  // Extract meta info from the most recent page
  const latestMeta = data?.pages?.[data.pages.length - 1]?.meta;
  const totalEstimatedCount = latestMeta?.totalEstimatedCount ?? env.totalRecordsEstimate;
  const queryExecutionMs = latestMeta?.queryExecutionMs ?? 0;

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[128px]" />
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-violet-600/10 blur-[128px]" />
      </div>

      {/* Floating Action Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-indigo-500/50 bg-indigo-950/90 px-4 py-3 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium text-white">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-indigo-300 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  OmniStream 100M
                </h1>
                <span className="rounded-full bg-indigo-950 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-800/60">
                  Cursor v2
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Next.js App Router • TanStack Table & Virtual • React Query v5
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400 border border-zinc-800 rounded-lg px-3 py-1.5 bg-zinc-900/50">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>O(1) Seek Index Engine</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Performance Architecture Telemetry Banner */}
        <PerformanceTelemetry
          totalRecords={totalEstimatedCount}
          loadedRows={flatData.length}
          activeDomRows={Math.min(16, flatData.length)}
          maxPagesCap={30}
          pageSize={limit}
        />

        {/* Search, Filter & Actions Toolbar */}
        <TableHeaderControls
          onSearchChange={setSearchInput}
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          limit={limit}
          onLimitChange={setLimit}
          onOpenCreateModal={() => setCreateOpen(true)}
          onRefresh={() => refetch()}
          isFetching={isFetching}
          totalEstimatedCount={totalEstimatedCount}
        />

        {/* Virtualized Infinite-Scrolling Table Container */}
        <div className="flex-1">
          <VirtualizedTable
            data={flatData}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isError={isError}
            error={error}
            onRetry={() => refetch()}
            onEditRecord={(record) => setEditingRecord(record)}
            onDeleteRecord={(record) => setDeletingRecord(record)}
            totalCount={totalEstimatedCount}
            queryExecutionMs={queryExecutionMs}
          />
        </div>
      </main>

      {/* CRUD Modals */}
      <CreateRecordModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccessNotice={showToast}
      />

      <EditRecordModal
        record={editingRecord}
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
        onSuccessNotice={showToast}
      />

      <DeleteRecordModal
        record={deletingRecord}
        open={!!deletingRecord}
        onOpenChange={(open) => !open && setDeletingRecord(null)}
        onSuccessNotice={showToast}
      />
    </div>
  );
}

export default function RecordsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-zinc-400">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            Initializing 100M Virtual Engine...
          </div>
        </div>
      }
    >
      <RecordsDashboardContent />
    </Suspense>
  );
}
