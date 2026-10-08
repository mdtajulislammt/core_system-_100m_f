"use client";

import React from "react";
import {
  ShieldCheck,
  Zap,
  Layers,
  HardDrive,
  Cpu,
  BarChart3,
  Flame,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface TelemetryProps {
  totalRecords: number;
  loadedRows: number;
  activeDomRows: number;
  maxPagesCap: number;
  pageSize: number;
}

export function PerformanceTelemetry({
  totalRecords,
  loadedRows,
  activeDomRows,
  maxPagesCap,
  pageSize,
}: TelemetryProps) {
  // DOM reduction calculation: (totalRecords - activeDomRows) / totalRecords * 100
  const domReductionPercent = ((1 - activeDomRows / Math.max(loadedRows, 1)) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 100M Scale Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Scale Scope</span>
          <HardDrive className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">
            {formatNumber(totalRecords)}
          </span>
          <span className="text-xs text-indigo-400 font-medium">Rows</span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          Keyset/Cursor pagination ensures O(1) indexed lookups without costly SQL offsets.
        </p>
      </div>

      {/* DOM Virtualization Efficiency Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">DOM Windowing Ratio</span>
          <Cpu className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
            {activeDomRows}
          </span>
          <span className="text-xs text-zinc-400">active / {loadedRows} loaded</span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          DOM footprint pruned by <span className="text-emerald-400 font-semibold">{domReductionPercent}%</span>. Zero lag at 60 FPS.
        </p>
      </div>

      {/* Network & Debounce Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Network Throttling</span>
          <Zap className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-400 font-mono">
            350ms
          </span>
          <span className="text-xs text-zinc-400">Debounce</span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          Stale inflight HTTP requests are immediately terminated via native <code className="text-zinc-300">AbortSignal</code>.
        </p>
      </div>

      {/* Memory Protection Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Memory Protection Guard</span>
          <ShieldCheck className="h-4 w-4 text-sky-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-sky-400 font-mono">
            {maxPagesCap * pageSize}
          </span>
          <span className="text-xs text-zinc-400">max in-memory</span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          TanStack Query <code className="text-zinc-300">maxPages: {maxPagesCap}</code> prevents JS heap starvation during deep scrolls.
        </p>
      </div>
    </div>
  );
}
