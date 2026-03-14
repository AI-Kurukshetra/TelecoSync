import { LiveUserDetailPage } from "@/components/live/LiveAdminPages";

export default function UserDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveUserDetailPage id={params.id} />;
}
