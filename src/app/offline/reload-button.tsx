"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReloadButton() {
  return (
    <Button variant="primary" onClick={() => window.location.reload()}>
      <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try Again
    </Button>
  );
}
