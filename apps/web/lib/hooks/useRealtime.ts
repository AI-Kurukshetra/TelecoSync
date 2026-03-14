"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type UseRealtimeOptions = {
  channelName: string;
  event: {
    schema?: string;
    table?: string;
    event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  };
  onMessage?: (payload: unknown) => void;
};

export function useRealtime(options?: UseRealtimeOptions) {
  const [status, setStatus] = useState<"idle" | "subscribing" | "subscribed" | "error">("idle");

  useEffect(() => {
    if (!options) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    let channel: RealtimeChannel | null = supabase.channel(options.channelName);

    setStatus("subscribing");

    channel = channel
      .on(
        "postgres_changes",
        {
          schema: options.event.schema ?? "public",
          table: options.event.table,
          event: options.event.event ?? "*"
        },
        (payload) => {
          options.onMessage?.(payload);
        }
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === "SUBSCRIBED") {
          setStatus("subscribed");
          return;
        }

        if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") {
          setStatus("error");
        }
      });

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [options]);

  return { status };
}
