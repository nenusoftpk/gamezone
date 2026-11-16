import StatusPage from "@/components/StatusPage";

export default function NotFound() {
  return (
    <StatusPage
      status="404"
      eyebrow="Page not found"
      title="This page isn't on the map."
      description="The link may be outdated, or the page may have moved. Head back to your workspace to continue."
    />
  );
}
