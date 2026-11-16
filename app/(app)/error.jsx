"use client";

import { useEffect } from "react";
import StatusPage from "@/components/StatusPage";

export default function Error({ error, reset }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <StatusPage
      eyebrow="Workspace error"
      title="This screen hit a problem."
      description="Your workspace is still available. You can retry this screen or go back to the dashboard."
      onRetry={reset}
    />
  );
}
