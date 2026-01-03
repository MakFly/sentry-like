"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, type Platform, type SdkInstructions as SdkInstructionsType } from "@/server/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  FolderKanban,
  Key,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Sparkles,
  Layers,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { PlatformSelector } from "@/components/PlatformSelector";
import { SdkInstructions } from "@/components/SdkInstructions";

type Step = "setup" | "platform" | "apikey";

interface SetupResult {
  organization: { id: string; name: string; slug: string };
  project: { id: string; name: string; slug: string; environment: string; platform: Platform };
  apiKey: { id: string; key: string; name: string };
  sdkInstructions: SdkInstructionsType;
}

// Zod schema with validation: org name ≠ project name
const setupSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").max(100),
  projectName: z.string().min(1, "Project name is required").max(100),
  environment: z.enum(["production", "staging", "development"]),
}).refine(
  (data) => data.organizationName.toLowerCase() !== data.projectName.toLowerCase(),
  {
    message: "Project name cannot be the same as organization name",
    path: ["projectName"],
  }
);

type SetupFormData = z.infer<typeof setupSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("setup");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      organizationName: "",
      projectName: "",
      environment: "production",
    },
  });

  const setupMutation = trpc.onboarding.setup.useMutation();

  // Si l'utilisateur a déjà une organisation, rediriger vers le dashboard
  useEffect(() => {
    api.organizations.getAll().then((organizations) => {
      if (organizations.length > 0) {
        router.replace(`/dashboard/${organizations[0].slug}`);
      }
    });
  }, [router]);

  const handleContinueToPlatform = form.handleSubmit(() => {
    setStep("platform");
  });

  const handleSetup = async () => {
    if (!platform) return;
    setError(null);
    setIsLoading(true);

    const values = form.getValues();

    try {
      const result = await setupMutation.mutateAsync({
        organizationName: values.organizationName.trim(),
        projectName: values.projectName.trim(),
        environment: values.environment,
        platform,
      });
      setSetupResult(result);
      setStep("apikey");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = () => {
    if (setupResult?.apiKey.key) {
      navigator.clipboard.writeText(setupResult.apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goToDashboard = () => {
    if (setupResult?.organization?.slug) {
      router.push(`/dashboard/${setupResult.organization.slug}`);
    } else {
      router.push("/dashboard/_");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3">
          <StepIndicator
            number={1}
            label="Workspace"
            active={step === "setup"}
            completed={step === "platform" || step === "apikey"}
          />
          <div className="h-px w-6 bg-border" />
          <StepIndicator
            number={2}
            label="Platform"
            active={step === "platform"}
            completed={step === "apikey"}
          />
          <div className="h-px w-6 bg-border" />
          <StepIndicator
            number={3}
            label="Setup"
            active={step === "apikey"}
            completed={false}
          />
        </div>

        {/* Step 1: Setup */}
        {step === "setup" && (
          <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <Sparkles className="h-8 w-8 text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome to ErrorWatch</h1>
              <p className="mt-2 text-muted-foreground">
                Let&apos;s set up your workspace to start monitoring errors
              </p>
            </div>

            <form onSubmit={handleContinueToPlatform} className="space-y-5">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="orgName" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Organization Name
                </Label>
                <Input
                  id="orgName"
                  placeholder="My Company"
                  {...form.register("organizationName")}
                  className={`h-11 ${form.formState.errors.organizationName ? "border-destructive" : ""}`}
                  autoFocus
                />
                {form.formState.errors.organizationName ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.organizationName.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This is your team or company name
                  </p>
                )}
              </div>

              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="projectName" className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  placeholder="My App"
                  {...form.register("projectName")}
                  className={`h-11 ${form.formState.errors.projectName ? "border-destructive" : ""}`}
                />
                {form.formState.errors.projectName ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.projectName.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    The application you want to monitor
                  </p>
                )}
              </div>

              {/* Environment */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-muted-foreground" />
                  Environment
                </Label>
                <Select
                  value={form.watch("environment")}
                  onValueChange={(v) => form.setValue("environment", v as "production" | "staging" | "development")}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={!form.watch("organizationName")?.trim() || !form.watch("projectName")?.trim()}
                className="w-full h-11 gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: Platform Selection */}
        {step === "platform" && (
          <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Layers className="h-8 w-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Select Your Platform</h1>
              <p className="mt-2 text-muted-foreground">
                Choose the framework or platform for your project
              </p>
            </div>

            <div className="space-y-5">
              <PlatformSelector value={platform} onChange={setPlatform} />

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("setup")}
                  className="h-11 gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSetup}
                  disabled={isLoading || !platform}
                  className="flex-1 h-11 gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: API Key & Instructions */}
        {step === "apikey" && setupResult && (
          <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                <Key className="h-8 w-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">You&apos;re All Set!</h1>
              <p className="mt-2 text-muted-foreground">
                Follow these steps to integrate ErrorWatch
              </p>
            </div>

            {/* Success Banner */}
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-400">Workspace created!</p>
                  <p className="text-muted-foreground">
                    <strong>{setupResult.organization.name}</strong> / <strong>{setupResult.project.name}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* API Key Display */}
            <div className="mb-6 space-y-3">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                Your API Key
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-secondary/50 px-4 py-3 font-mono text-sm break-all">
                  {setupResult.apiKey.key}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyApiKey}
                  className="shrink-0 h-11 w-11"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-amber-500">
                Save this key now - you won&apos;t be able to see it again!
              </p>
            </div>

            {/* SDK Instructions */}
            <SdkInstructions
              instructions={setupResult.sdkInstructions}
              apiKey={setupResult.apiKey.key}
            />

            <Button
              onClick={goToDashboard}
              className="w-full h-11 gap-2 mt-6"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-primary" : completed ? "text-emerald-400" : "text-muted-foreground"}`}>
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : completed
              ? "border-emerald-400 bg-emerald-400 text-white"
              : "border-muted-foreground"
        }`}
      >
        {completed ? <Check className="h-4 w-4" /> : number}
      </div>
      <span className="text-sm font-medium hidden sm:block">{label}</span>
    </div>
  );
}
