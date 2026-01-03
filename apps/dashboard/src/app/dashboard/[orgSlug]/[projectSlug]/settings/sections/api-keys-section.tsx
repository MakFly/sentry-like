"use client";

import React, { useState } from "react";
import { Key, Plus, Check, Copy, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

export function ApiKeysSection() {
  const [newKeyName, setNewKeyName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ id: string; key: string } | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  const { currentProjectId } = useCurrentProject();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading, refetch: refetchApiKeys } = trpc.apiKeys.getAll.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const createKeyMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setNewKeyName("");
      setNewlyCreatedKey({ id: data.id, key: data.key! });
      refetchApiKeys();
      toast.success("API key created");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteKeyMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [["apiKeys", "getAll"]] });
      await refetchApiKeys();
      setDeleteKeyId(null);
      toast.success("API key deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  };

  const generateKey = () => {
    if (!newKeyName.trim() || !currentProjectId) return;
    createKeyMutation.mutate({ projectId: currentProjectId, name: newKeyName });
  };

  return (
    <>
      <Card className="bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            API Keys
          </CardTitle>
          <CardDescription>Manage authentication keys for SDK integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create new key */}
          <div className="flex gap-2">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Production SDK)"
              className="max-w-sm"
              onKeyDown={(e) => e.key === "Enter" && generateKey()}
            />
            <Button onClick={generateKey} disabled={createKeyMutation.isPending || !newKeyName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {createKeyMutation.isPending ? "Creating..." : "New Key"}
            </Button>
          </div>

          {/* Newly created key */}
          {newlyCreatedKey && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-emerald-500">Key created successfully</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Copy your key now. You won&apos;t be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 font-mono text-sm">
                  {newlyCreatedKey.key}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newlyCreatedKey.key, "new")}
                >
                  {copied === "new" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setNewlyCreatedKey(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Keys list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : apiKeys && apiKeys.length > 0 ? (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <code className="text-xs text-muted-foreground font-mono">
                        {key.keyPreview || "ew_live_••••"}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Created {new Date(key.createdAt).toLocaleDateString()}</p>
                      <p>Used {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteKeyId(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Key className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p>No API keys yet</p>
              <p className="text-sm">Create one to authenticate your SDK</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteKeyId} onOpenChange={(open) => !open && setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Applications using this key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKeyId && deleteKeyMutation.mutate({ id: deleteKeyId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
