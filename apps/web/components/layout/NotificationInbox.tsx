"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type NotificationInboxProps = {
  tenantId: string;
  userId: string;
};

type NotificationRecord = {
  id: string;
  title: string;
  body: string | null;
  status: string | null;
  created_at: string | null;
};

export function NotificationInbox({
  tenantId,
  userId
}: NotificationInboxProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, status, created_at")
        .eq("tenant_id", tenantId)
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(8);

      setNotifications((data ?? []) as NotificationRecord[]);
    }

    void loadNotifications();

    const channel = supabase
      .channel(`tenant-${tenantId}-notifications-ui`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications"
        },
        () => {
          void loadNotifications();
        }
      )
      .on("broadcast", { event: "notification" }, () => {
        void loadNotifications();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, userId]);

  const unreadCount = notifications.filter(
    (item) => item.status !== "sent" && item.status !== "read"
  ).length;

  return (
    <div className="relative">
      <button
        className="metric-glow flex h-full min-h-[4.625rem] w-full flex-col justify-center rounded-[22px] border border-[var(--border)] px-4 py-3 text-left"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Alerts
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
          {unreadCount} unread
        </p>
      </button>

      {isOpen ? (
        <div className="panel absolute right-0 z-20 mt-3 w-[22rem] p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--ink)]">
              Realtime notifications
            </p>
            <button
              className="text-xs font-semibold text-[var(--accent)]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No notifications for this operator.
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
                  key={notification.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {notification.title}
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      {notification.status ?? "pending"}
                    </span>
                  </div>
                  {notification.body ? (
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                      {notification.body}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
