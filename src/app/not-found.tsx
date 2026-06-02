import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-7xl font-bold font-heading text-primary-600">404</p>
        <h1 className="text-h1 font-heading font-bold text-slate-800 mt-4">Page Not Found</h1>
        <p className="text-slate-500 mt-3 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="inline-block mt-8">
          <Button>
            <Home className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
