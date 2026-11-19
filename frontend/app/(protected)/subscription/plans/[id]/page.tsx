import { redirect } from "next/navigation";

// The plan builder is part of checkout now (feature switches + coupon on one
// page); old links land there with the same plan and kept features.
export default async function PlanBuilderRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ groups?: string }>;
}) {
  const { id } = await params;
  const { groups } = await searchParams;
  const query = new URLSearchParams({ bundleId: id });
  if (groups) query.set("groups", groups);
  redirect(`/subscription/checkout?${query.toString()}`);
}
