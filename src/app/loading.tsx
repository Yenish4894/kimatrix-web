import { PageLoader } from "@/components/ui/loader";

// Root-level loading.tsx — shown during route transitions before the route's
// layout is ready. Each protected segment also has DashboardShell's PageLoader
// during session resolution, but this catches the brief gap between route
// changes when no layout has rendered yet.
export default function Loading() {
  return <PageLoader />;
}
