import { redirect } from "next/navigation";

// The wallet overview moved to the top of the plans page (/subscription);
// old links and bookmarks land there.
export default function BillingOverviewRedirect() {
  redirect("/subscription");
}
