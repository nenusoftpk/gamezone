"use client";

import { useEffect } from "react";
import StatusPage from "@/components/StatusPage";

export default function Error({ error, reset }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <StatusPage
      eyebrow="Something went wrong"
      title="We couldn't load this page."
      description="An unexpected issue interrupted this screen. Try again, or return to your workspace."
      onRetry={reset}
    />
  );
}
