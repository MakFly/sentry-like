"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const isDev = process.env.NODE_ENV === "development";

export function DevResetButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (!isDev) return null;

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dev/reset-tables", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset");
      }

      toast.success("Tables reset successfully", {
        description: "All error tracking data has been cleared.",
      });

      setOpen(false);
      // Reload to refresh data
      window.location.reload();
    } catch (error) {
      toast.error("Failed to reset tables", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-500"
        >
          <Trash2 className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Reset Data</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all data?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all error tracking data including events,
            groups, replays, and statistics. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Resetting...
              </>
            ) : (
              "Reset Data"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
