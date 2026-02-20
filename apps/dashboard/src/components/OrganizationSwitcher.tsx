"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Check, Plus, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function OrganizationSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [orgName, setOrgName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const { organizations, currentOrgSlug, currentOrgId, isLoading, refetch } = useCurrentOrganization();
  const { data: canCreateResult, isLoading: isCheckingSubscription } = trpc.organizations.canCreate.useQuery(undefined, { staleTime: 5 * 60 * 1000 });

  const createMutation = trpc.organizations.create.useMutation({
    onSuccess: (newOrg) => {
      setShowCreateDialog(false);
      setOrgName("");
      refetch();
      toast.success("Organization created successfully");
      // Redirect to the new organization's dashboard
      router.push(`/dashboard/${newOrg.slug}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create organization");
    },
  });

  const currentOrg = organizations.find(o => o.slug === currentOrgSlug);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOrgSelect = (org: { slug: string }) => {
    router.push(`/dashboard/${org.slug}`);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
          {currentOrg?.name?.substring(0, 2).toUpperCase() || "??"}
        </div>
        <span className="flex-1 truncate text-sm font-medium">
          {currentOrg?.name || "Select Organization"}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border/50 bg-popover shadow-lg">
          <div className="p-1">
            {organizations.map((org) => {
              const isSelected = org.id === currentOrgId;
              return (
                <button
                  key={org.id}
                  onClick={() => handleOrgSelect(org)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary",
                    isSelected && "bg-primary/10"
                  )}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-[8px] font-bold text-white">
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate">{org.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-border/50 p-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // Still loading - do nothing
                if (isCheckingSubscription) return;
                // No data yet - allow (backend will validate)
                if (!canCreateResult) {
                  setShowCreateDialog(true);
                  return;
                }
                if (canCreateResult.allowed) {
                  setShowCreateDialog(true);
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              <span>New Organization</span>
              {canCreateResult && !canCreateResult.allowed && (
                <Crown className="ml-auto h-3 w-3 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Create Organization Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage separate projects and teams.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (orgName.trim()) {
                createMutation.mutate({ name: orgName.trim() });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="My Company"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !orgName.trim()}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal for free users */}
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
    </div>
  );
}
