import Link from "next/link";
import { WifiOff, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-sm text-center bg-white rounded-2xl border border-slate-200 p-8">
        <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <WifiOff className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-heading font-bold text-slate-800">You&apos;re Offline</h1>
        <p className="text-slate-500 mt-2 text-sm">
          Check your internet connection and try again. Some features may be available from cache.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button variant="primary">
            <Home className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
