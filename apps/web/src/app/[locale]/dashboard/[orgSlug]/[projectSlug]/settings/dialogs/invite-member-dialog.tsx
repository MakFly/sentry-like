"use client";

import React, { useState } from "react";
import { Plus, Check, Copy, Send, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { useTranslations } from "next-intl";

export function InviteMemberDialog({ organizationId, onSuccess }: { organizationId: string; onSuccess?: () => void }) {
  const t = useTranslations("settings.dialogs.inviteMember");

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"token" | "direct">("token");
  const [inviteResult, setInviteResult] = useState<{ inviteUrl?: string; message?: string; tempPassword?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteMutation = trpc.members.invite.useMutation({
    onSuccess: (data) => {
      if (method === "direct") {
        setInviteResult({
          message: data.tempPassword
            ? `User ${email} added. Temp password: ${data.tempPassword}`
            : data.message || `User ${email} added as member`,
          tempPassword: data.tempPassword || ""
        });
      } else {
        setInviteResult({ inviteUrl: data.inviteUrl });
      }
      onSuccess?.();
    },
    onError: (_error) => {
      // error is displayed via inviteMutation.error in the form
    },
  });

  const resetAndClose = () => {
    setOpen(false);
    setEmail("");
    setInviteResult(null);
    inviteMutation.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : resetAndClose()}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t("triggerButton")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {!inviteResult ? (
          <form onSubmit={(e) => { e.preventDefault(); inviteMutation.mutate({ organizationId, email, method }); }} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("emailLabel")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("inviteMethodLabel")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={method === "token" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMethod("token")}
                  className="flex-1"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {t("methodToken")}
                </Button>
                <Button
                  type="button"
                  variant={method === "direct" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMethod("direct")}
                  className="flex-1"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t("methodDirect")}
                </Button>
              </div>
              {method === "direct" && (
                <p className="text-xs text-muted-foreground">
                  {t("directNote")}
                </p>
              )}
            </div>

            {inviteMutation.error && (
              <p className="text-sm text-destructive">{inviteMutation.error.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetAndClose}>{t("cancel")}</Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? t("sending") : method === "token" ? t("sendInvite") : t("addMember")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {inviteResult.inviteUrl ? (
              <>
                <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-500">
                  {t("invitationSentTo", { email })}
                </div>
                <div className="flex gap-2">
                  <Input value={inviteResult.inviteUrl} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.inviteUrl!);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-500">
                  {inviteResult.message || t("userAddedSuccess")}
                </div>
                {inviteResult.tempPassword && inviteResult.tempPassword.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t("tempPasswordLabel")}</p>
                    <div className="flex gap-2">
                      <Input value={inviteResult.tempPassword} readOnly className="font-mono text-xs" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(inviteResult.tempPassword!);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            <Button onClick={resetAndClose} className="w-full">{t("done")}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
