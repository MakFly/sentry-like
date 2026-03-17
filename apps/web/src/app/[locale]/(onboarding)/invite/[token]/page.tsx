import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { InviteClient } from "./invite-client";

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <InviteClient />
    </Suspense>
  );
}
