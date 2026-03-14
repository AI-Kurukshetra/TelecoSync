"use client";

import { useEffect } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type LiveQueryInvalidationOptions = {
  channelName: string;
  queryKeys: QueryKey[];
  table: string;
  schema?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
};

export function useLiveQueryInvalidation({
  channelName,
  queryKeys,
  table,
  schema = "public",
  event = "*"
}: LiveQueryInvalidationOptions) {
  const queryClient = useQueryClient();
  const queryKeysHash = JSON.stringify(queryKeys);

  useEffect(() => {
    const parsedQueryKeys = JSON.parse(queryKeysHash) as QueryKey[];
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          schema,
          table,
          event
        },
        () => {
          parsedQueryKeys.forEach((queryKey) => {
            void queryClient.invalidateQueries({ queryKey });
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, event, queryClient, queryKeysHash, schema, table]);
}
