"use client";

import React from "react";
import {
  Building2,
  Crown,
  ShieldCheck,
  User,
  Users,
  ChevronDown,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { trpc } from "@/lib/trpc/client";
import { CreateOrganizationDialog, InviteMemberDialog } from "../dialogs";

export function OrganizationsSection() {
  const { data: organizations, isLoading, refetch } = trpc.organizations.getAll.useQuery();

  const deleteMutation = trpc.organizations.delete.useMutation({ onSuccess: () => refetch() });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"><Crown className="mr-1 h-3 w-3" />{role}</Badge>;
      case "admin":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"><ShieldCheck className="mr-1 h-3 w-3" />{role}</Badge>;
      default:
        return <Badge variant="secondary"><User className="mr-1 h-3 w-3" />{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-t from-primary/5 to-card">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-t from-primary/5 to-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organizations
            </CardTitle>
            <CardDescription>Manage your organizations and team members</CardDescription>
          </div>
          <CreateOrganizationDialog onSuccess={() => refetch()} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {organizations && organizations.length > 0 ? (
          <div className="space-y-3">
            {organizations.map((org) => (
              <Collapsible key={org.id}>
                <div className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                        {org.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">/{org.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(org.role)}
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Users className="mr-2 h-4 w-4" />
                          Members
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      {org.role === "owner" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this organization?")) {
                              deleteMutation.mutate({ id: org.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/30 p-4">
                      <MembersList organizationId={org.id} userRole={org.role} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Building2 className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>No organizations yet</p>
            <p className="text-sm">Create one to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MembersList({ organizationId, userRole }: { organizationId: string; userRole: string }) {
  const { data: members, isLoading, refetch } = trpc.members.getByOrganization.useQuery(
    { organizationId },
    { enabled: !!organizationId, retry: false }
  );

  const removeMutation = trpc.members.remove.useMutation({ onSuccess: () => refetch() });
  const canManage = userRole === "owner" || userRole === "admin";

  if (isLoading) {
    return <div className="py-4 text-center"><RefreshCw className="mx-auto h-4 w-4 animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Members ({members?.length || 0})</p>
        {canManage && <InviteMemberDialog organizationId={organizationId} onSuccess={() => refetch()} />}
      </div>

      {members && members.length > 0 ? (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg bg-background p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{member.user?.name || member.user?.email}</p>
                  {member.user?.name && <p className="text-xs text-muted-foreground">{member.user.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                {canManage && member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Remove ${member.user?.email}?`)) {
                        removeMutation.mutate({ memberId: member.id });
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">No members yet</p>
      )}
    </div>
  );
}
