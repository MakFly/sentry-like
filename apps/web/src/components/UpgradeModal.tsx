"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Zap, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  currentCount: number;
  maxItems: number;
  resourceType?: "project" | "organization";
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlan,
  currentCount,
  maxItems,
  resourceType = "project",
}: UpgradeModalProps) {
  const resourceLabel = resourceType === "organization" ? "organization" : "project";
  const resourceLabelPlural = resourceType === "organization" ? "organizations" : "projects";
  const createCheckout = trpc.billing.createCheckout.useMutation();

  const handleUpgrade = async () => {
    try {
      const result = await createCheckout.mutateAsync({ plan: "pro" });
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      toast.error("Checkout URL unavailable");
    } catch (e) {
      console.error("Failed to start checkout:", e);
      toast.error("Failed to start checkout");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            You&apos;ve reached the limit of {maxItems} {maxItems > 1 ? resourceLabelPlural : resourceLabel} on
            your {currentPlan} plan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Current usage */}
          <div className="mb-4 rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current usage</span>
              <span className="font-medium">
                {currentCount} / {maxItems} {resourceLabelPlural}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Pro Plan Card */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <span className="font-semibold text-amber-400">Pro Plan</span>
              <Sparkles className="ml-auto h-4 w-4 text-amber-400/50" />
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Unlimited projects & organizations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>100,000 events/month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>30-day data retention</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Advanced alerts & integrations</span>
              </li>
            </ul>
          </div>

          {/* Price */}
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold">
              $29
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Billed monthly. Cancel anytime.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
          <Button
            className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleUpgrade}
            disabled={createCheckout.isPending}
          >
            <Crown className="h-4 w-4" />
            {createCheckout.isPending ? "Starting..." : "Upgrade Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
