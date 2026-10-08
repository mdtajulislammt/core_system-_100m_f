"use client";

import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CursorApiResponse,
  DataRecord,
  FetchItemsParams,
  CreateRecordInput,
  UpdateRecordInput,
  RecordStatus,
  RecordCategory,
} from "@/types/record";
import { fetchItems, createItem, updateItem, deleteItem } from "@/lib/api";
import { env } from "@/lib/env";

export interface RecordsQueryParams {
  query?: string;
  status?: RecordStatus | "ALL";
  category?: RecordCategory | "ALL";
  limit?: number;
  maxPages?: number;
}

export const RECORDS_QUERY_KEY = "records";

/**
 * Infinite query hook for cursor-based pagination
 * Integrates native AbortSignal from React Query's queryFn context.
 */
export function useRecordsInfiniteQuery({
  query = "",
  status = "ALL",
  category = "ALL",
  limit = env.defaultPageSize,
  maxPages = env.maxPagesInMemory, // Memory guard: configured via .env
}: RecordsQueryParams = {}) {
  return useInfiniteQuery<
    CursorApiResponse<DataRecord>,
    Error,
    InfiniteData<CursorApiResponse<DataRecord>>,
    [string, { query: string; status: string; category: string; limit: number }],
    string | null
  >({
    queryKey: [RECORDS_QUERY_KEY, { query, status, category, limit }],
    queryFn: async ({ pageParam, signal }) => {
      return fetchItems({
        query,
        status,
        category,
        limit,
        cursor: pageParam,
        signal, // React Query automatically aborts this signal when query key changes or component unmounts
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta && lastPage.meta.hasNextPage && lastPage.meta.nextCursor) {
        return lastPage.meta.nextCursor;
      }
      return undefined;
    },
    maxPages, // Prevents memory leak / tab crashes on massive infinite scrolls
  });
}

/**
 * Optimistic Create Mutation
 */
export function useCreateRecordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecordInput) => createItem(input),
    onMutate: async (newRecordInput) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: [RECORDS_QUERY_KEY] });

      // Snapshot all current queries for rollback
      const previousQueries = queryClient.getQueriesData<
        InfiniteData<CursorApiResponse<DataRecord>>
      >({ queryKey: [RECORDS_QUERY_KEY] });

      // Synthetic optimistic record
      const optimisticRecord: DataRecord = {
        id: `optimistic-${Date.now()}`,
        sequenceNumber: 100_000_001,
        title: newRecordInput.title,
        identifier: newRecordInput.identifier,
        category: newRecordInput.category,
        status: newRecordInput.status,
        amount: newRecordInput.amount,
        metadata: newRecordInput.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update all matching infinite query caches (prepending to page 0)
      queryClient.setQueriesData<InfiniteData<CursorApiResponse<DataRecord>>>(
        { queryKey: [RECORDS_QUERY_KEY] },
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) => {
              if (index === 0) {
                return {
                  ...page,
                  data: [optimisticRecord, ...page.data],
                  meta: {
                    ...page.meta,
                    totalEstimatedCount: (page.meta.totalEstimatedCount || 0) + 1,
                  },
                };
              }
              return page;
            }),
          };
        }
      );

      return { previousQueries };
    },
    onError: (err, newRecord, context) => {
      // Gracefully rollback on network error or server rejection
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      // Re-sync with backend authority
      queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
    },
  });
}

/**
 * Optimistic Update Mutation
 */
export function useUpdateRecordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRecordInput) => updateItem(input),
    onMutate: async (updatedInput) => {
      await queryClient.cancelQueries({ queryKey: [RECORDS_QUERY_KEY] });

      const previousQueries = queryClient.getQueriesData<
        InfiniteData<CursorApiResponse<DataRecord>>
      >({ queryKey: [RECORDS_QUERY_KEY] });

      // Optimistically mutate the item in place across all cached pages
      queryClient.setQueriesData<InfiniteData<CursorApiResponse<DataRecord>>>(
        { queryKey: [RECORDS_QUERY_KEY] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((item) => {
                if (item.id === updatedInput.id) {
                  return {
                    ...item,
                    title: updatedInput.title ?? item.title,
                    status: updatedInput.status ?? item.status,
                    category: updatedInput.category ?? item.category,
                    amount: updatedInput.amount ?? item.amount,
                    metadata: {
                      ...item.metadata,
                      ...(updatedInput.metadata || {}),
                    },
                    updatedAt: new Date().toISOString(),
                  };
                }
                return item;
              }),
            })),
          };
        }
      );

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
    },
  });
}

/**
 * Optimistic Delete Mutation
 */
export function useDeleteRecordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onMutate: async (idToDelete) => {
      await queryClient.cancelQueries({ queryKey: [RECORDS_QUERY_KEY] });

      const previousQueries = queryClient.getQueriesData<
        InfiniteData<CursorApiResponse<DataRecord>>
      >({ queryKey: [RECORDS_QUERY_KEY] });

      // Optimistically remove item from pages
      queryClient.setQueriesData<InfiniteData<CursorApiResponse<DataRecord>>>(
        { queryKey: [RECORDS_QUERY_KEY] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.filter((item) => item.id !== idToDelete),
              meta: {
                ...page.meta,
                totalEstimatedCount: Math.max(0, (page.meta.totalEstimatedCount || 0) - 1),
              },
            })),
          };
        }
      );

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_QUERY_KEY] });
    },
  });
}
