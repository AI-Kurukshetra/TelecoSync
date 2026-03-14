import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function sendEmail(title: string, body: string | null) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");

  if (!apiKey || !from) {
    throw new Error("Missing Resend configuration.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [from],
      subject: title,
      text: body ?? ""
    })
  });

  if (!response.ok) {
    throw new Error(`Resend delivery failed with status ${response.status}.`);
  }
}

async function sendSms(body: string | null) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");

  if (!accountSid || !authToken || !from) {
    throw new Error("Missing Twilio configuration.");
  }

  const target = Deno.env.get("TWILIO_TEST_TO_NUMBER") ?? from;
  const form = new URLSearchParams({
    To: target,
    From: from,
    Body: body ?? ""
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });

  if (!response.ok) {
    throw new Error(`Twilio delivery failed with status ${response.status}.`);
  }
}

async function sendInAppBroadcast(notification: {
  tenant_id: string;
  id: string;
  title: string;
  body: string | null;
  channel: string;
}) {
  const channel = supabase.channel(`tenant-${notification.tenant_id}-notifications`);
  const result = await channel.send({
    type: "broadcast",
    event: "notification",
    payload: notification
  });
  await supabase.removeChannel(channel);

  if (result !== "ok") {
    throw new Error(`Realtime broadcast failed with status ${result}.`);
  }
}

Deno.serve(async (request) => {
  const body = await request.json().catch(() => ({}));
  const notificationId = body.notificationId as string | undefined;

  if (!notificationId) {
    return Response.json({ error: "notificationId is required." }, { status: 400 });
  }

  const { data: notification, error } = await supabase
    .from("notifications")
    .select("id, tenant_id, user_id, channel, title, body, status")
    .eq("id", notificationId)
    .maybeSingle();

  if (error || !notification) {
    return Response.json({ error: error?.message ?? "Notification not found." }, { status: 404 });
  }

  try {
    if (notification.channel === "email") {
      await sendEmail(notification.title, notification.body);
    } else if (notification.channel === "sms") {
      await sendSms(notification.body ?? notification.title);
    } else if (notification.channel === "in_app") {
      await sendInAppBroadcast(notification);
    }

    await supabase
      .from("notifications")
      .update({
        status: "sent",
        sent_at: new Date().toISOString()
      })
      .eq("id", notificationId);

    await supabase.from("event_log").insert({
      tenant_id: notification.tenant_id,
      event_type: "notification.sent",
      entity_type: "notification",
      entity_id: notification.id,
      payload_json: notification,
      source_service: "notification-sender"
    });

    return Response.json({
      delivered: true,
      channel: notification.channel
    });
  } catch (deliveryError) {
    await supabase
      .from("notifications")
      .update({
        status: "failed"
      })
      .eq("id", notificationId);

    return Response.json(
      {
        error: deliveryError instanceof Error ? deliveryError.message : "Delivery failed."
      },
      { status: 500 }
    );
  }
});
