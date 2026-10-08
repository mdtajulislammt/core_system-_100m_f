"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataRecord, RecordCategory, RecordStatus } from "@/types/record";
import {
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
} from "@/hooks/use-records-query";
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccessNotice?: (msg: string) => void;
}

export function CreateRecordModal({
  open,
  onOpenChange,
  onSuccessNotice,
}: CreateDialogProps) {
  const createMutation = useCreateRecordMutation();

  const [title, setTitle] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [category, setCategory] = useState<RecordCategory>("TRANSACTION");
  const [status, setStatus] = useState<RecordStatus>("ACTIVE");
  const [amount, setAmount] = useState("250.00");
  const [region, setRegion] = useState("us-east-1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Title is required");
      return;
    }

    setErrorMessage(null);
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        identifier: identifier.trim() || `TXN-${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
        category,
        status,
        amount: parseFloat(amount) || 0,
        metadata: {
          region,
          riskScore: Math.floor(Math.random() * 20),
        },
      });

      onSuccessNotice?.(`Record "${title}" queued with optimistic update!`);
      onOpenChange(false);
      setTitle("");
      setIdentifier("");
      setAmount("250.00");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create record");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create High-Scale Record</DialogTitle>
            <DialogDescription>
              Add a new record to the 100,000,000 dataset stream. Optimistic UI applies instantly.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid gap-3 py-4 text-sm">
            <div>
              <label className="text-xs font-medium text-zinc-300">Title</label>
              <Input
                placeholder="e.g. Inbound Wire Transfer #9842"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300">Transaction Identifier</label>
              <Input
                placeholder="Auto-generated if left empty (e.g. TXN-8F3A29)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RecordCategory)}
                  aria-label="Category"
                  className="mt-1 flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="TRANSACTION">TRANSACTION</option>
                  <option value="TELEMETRY">TELEMETRY</option>
                  <option value="AUDIT_LOG">AUDIT_LOG</option>
                  <option value="CUSTOMER_EVENT">CUSTOMER_EVENT</option>
                  <option value="SECURITY_ALERT">SECURITY_ALERT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RecordStatus)}
                  aria-label="Status"
                  className="mt-1 flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="FAILED">FAILED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Region</label>
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Save Record"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditDialogProps {
  record: DataRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccessNotice?: (msg: string) => void;
}

export function EditRecordModal({
  record,
  open,
  onOpenChange,
  onSuccessNotice,
}: EditDialogProps) {
  const updateMutation = useUpdateRecordMutation();

  const [title, setTitle] = useState(record?.title || "");
  const [category, setCategory] = useState<RecordCategory>(record?.category || "TRANSACTION");
  const [status, setStatus] = useState<RecordStatus>(record?.status || "ACTIVE");
  const [amount, setAmount] = useState(record?.amount?.toString() || "0");
  const [region, setRegion] = useState(record?.metadata?.region || "us-east-1");

  // Keep state synced when selected record changes
  React.useEffect(() => {
    if (record) {
      setTitle(record.title);
      setCategory(record.category);
      setStatus(record.status);
      setAmount(record.amount.toString());
      setRegion(record.metadata.region || "us-east-1");
    }
  }, [record]);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: record.id,
        title: title.trim(),
        category,
        status,
        amount: parseFloat(amount) || 0,
        metadata: {
          ...record.metadata,
          region,
        },
      });

      onSuccessNotice?.(`Record ${record.identifier} updated optimistically!`);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              Editing ID <span className="font-mono text-zinc-200">{record.id}</span> ({record.identifier})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4 text-sm">
            <div>
              <label className="text-xs font-medium text-zinc-300">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RecordCategory)}
                  aria-label="Category"
                  className="mt-1 flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="TRANSACTION">TRANSACTION</option>
                  <option value="TELEMETRY">TELEMETRY</option>
                  <option value="AUDIT_LOG">AUDIT_LOG</option>
                  <option value="CUSTOMER_EVENT">CUSTOMER_EVENT</option>
                  <option value="SECURITY_ALERT">SECURITY_ALERT</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RecordStatus)}
                  aria-label="Status"
                  className="mt-1 flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="FAILED">FAILED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Region</label>
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  record: DataRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccessNotice?: (msg: string) => void;
}

export function DeleteRecordModal({
  record,
  open,
  onOpenChange,
  onSuccessNotice,
}: DeleteDialogProps) {
  const deleteMutation = useDeleteRecordMutation();

  if (!record) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(record.id);
      onSuccessNotice?.(`Record ${record.identifier} removed optimistically!`);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/70 border border-rose-800/50">
            <Trash2 className="h-6 w-6 text-rose-400" />
          </div>
          <DialogTitle className="text-center text-lg mt-2">Delete Record?</DialogTitle>
          <DialogDescription className="text-center text-sm text-zinc-400">
            Are you sure you want to delete <span className="font-semibold text-zinc-200">{record.title}</span> (
            <span className="font-mono text-zinc-300">{record.identifier}</span>)?
            <br />
            This row will be removed instantly from the virtualized window.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, Delete Record"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
