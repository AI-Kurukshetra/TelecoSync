import { LiveWorkflowDetailPage } from "@/components/live/LiveAdminPages";

export default function WorkflowDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveWorkflowDetailPage id={params.id} />;
}
