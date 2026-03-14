import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "",
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (request) => {
	const body = await request.json().catch(() => ({}));
	const alarmId = body.alarmId as string | undefined;

	if (!alarmId) {
		return Response.json({ error: "alarmId is required." }, { status: 400 });
	}

	const { data: alarm, error: alarmError } = await supabase
		.from("alarms")
		.select("id, tenant_id, network_element_id, severity, description")
		.eq("id", alarmId)
		.maybeSingle();

	if (alarmError || !alarm) {
		return Response.json(
			{ error: alarmError?.message ?? "Alarm not found." },
			{ status: 404 },
		);
	}

	const { data: existingTicket } = await supabase
		.from("trouble_tickets")
		.select("id")
		.eq("tenant_id", alarm.tenant_id)
		.eq("network_element_id", alarm.network_element_id)
		.eq("status", "open")
		.maybeSingle();

	if (existingTicket) {
		return Response.json({ created: false, ticketId: existingTicket.id });
	}

	const { data: ticket, error: ticketError } = await supabase
		.from("trouble_tickets")
		.insert({
			tenant_id: alarm.tenant_id,
			ticket_number: `TT-${Date.now()}`,
			title: `Auto ticket for alarm ${alarm.id}`,
			description: alarm.description,
			severity: alarm.severity,
			status: "open",
			network_element_id: alarm.network_element_id,
		})
		.select("id, ticket_number")
		.single();

	if (ticketError || !ticket) {
		return Response.json(
			{ error: ticketError?.message ?? "Unable to create ticket." },
			{ status: 500 },
		);
	}

	await supabase.from("event_log").insert({
		tenant_id: alarm.tenant_id,
		event_type: "fault.raised",
		entity_type: "trouble_ticket",
		entity_id: ticket.id,
		payload_json: ticket,
		source_service: "fault-detector",
	});

	await supabase.from("notifications").insert({
		tenant_id: alarm.tenant_id,
		channel: "in_app",
		title: `Critical fault ${alarm.severity}`,
		body: `Auto-created ticket ${ticket.ticket_number} for alarm ${alarm.id}.`,
		status: "pending",
	});

	const escalationTargets = [];
	if (Deno.env.get("FAULT_ONCALL_EMAIL")?.length) {
		escalationTargets.push("email");
	}
	if (Deno.env.get("FAULT_ONCALL_SMS")?.length) {
		escalationTargets.push("sms");
	}

	if (escalationTargets.length > 0) {
		await supabase.from("notifications").insert(
			escalationTargets.map((channel) => ({
				tenant_id: alarm.tenant_id,
				channel,
				title: `On-call escalation ${alarm.severity}`,
				body: `Alarm ${alarm.id} escalated with ticket ${ticket.ticket_number}.`,
				status: "pending",
			})),
		);
	}

	const { data: workflows } = await supabase
		.from("workflows")
		.select("id")
		.eq("tenant_id", alarm.tenant_id)
		.eq("status", "active")
		.in("trigger_type", ["alarm.raised", "fault.raised"]);

	if ((workflows ?? []).length > 0) {
		await supabase.from("workflow_instances").insert(
			(workflows ?? []).map((workflow) => ({
				tenant_id: alarm.tenant_id,
				workflow_id: workflow.id,
				entity_type: "alarm",
				entity_id: alarm.id,
				current_step: 0,
				state_json: {
					alarmId: alarm.id,
					ticketId: ticket.id,
					ticketNumber: ticket.ticket_number,
				},
				status: "running",
			})),
		);
	}

	return Response.json({ created: true, ticketId: ticket.id });
});
