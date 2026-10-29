"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

// Error boundaries can't read the language cookie on the server, so this screen shows both languages.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong · কিছু ভুল হয়েছে"
        description="Please try again. · অনুগ্রহ করে আবার চেষ্টা করুন।"
        action={<Button onClick={reset}>Try again · আবার চেষ্টা করুন</Button>}
      />
    </div>
  );
}
