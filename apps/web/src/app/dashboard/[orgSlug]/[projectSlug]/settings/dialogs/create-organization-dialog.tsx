"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Crown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { UpgradeModal } from "@/components/UpgradeModal";
import { toast } from "sonner";

export function CreateOrganizationDialog({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [name, setName] = useState("");

  const { data: canCreateResult, isLoading, isError } = trpc.organizations.canCreate.useQuery();

  const createMutation = trpc.organizations.create.useMutation({
    onSuccess: (newOrg) => {
      setOpen(false);
      setName("");
      toast.success("Organization created successfully");
      onSuccess?.();
      // Redirect to the new organization's dashboard
      router.push(`/dashboard/${newOrg.slug}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create organization");
    },
  });

  const handleButtonClick = () => {
    // Still loading - do nothing
    if (isLoading) return;

    // Error or no data - allow creation (backend will validate)
    if (isError || !canCreateResult) {
      setOpen(true);
      return;
    }

    if (canCreateResult.allowed) {
      setOpen(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  return (
    <>
      <Button onClick={handleButtonClick} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        New Organization
        {canCreateResult && !canCreateResult.allowed && (
          <Crown className="ml-2 h-3 w-3 text-amber-400" />
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Organizations help you group projects and manage team access.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name }); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Company"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {canCreateResult && (
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlan={canCreateResult.plan}
          currentCount={canCreateResult.currentCount}
          maxItems={canCreateResult.maxOrganizations}
          resourceType="organization"
        />
      )}
    </>
  );
}
