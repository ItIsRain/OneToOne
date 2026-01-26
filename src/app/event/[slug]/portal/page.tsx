"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PortalRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    // Redirect to the main event page with #portal hash
    router.replace(`/event/${slug}#portal`);
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Redirecting to event portal...</p>
      </div>
    </div>
  );
}
