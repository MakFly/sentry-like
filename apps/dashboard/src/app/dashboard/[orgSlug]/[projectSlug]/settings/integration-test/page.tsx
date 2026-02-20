"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentOrganization } from "@/contexts/OrganizationContext";
import { useCurrentProject } from "@/contexts/ProjectContext";

type Scenario =
  | "ping"
  | "warning"
  | "error"
  | "exception"
  | "throw"
  | "http500"
  | "breadcrumbs"
  | "timeout";

const scenarios: Array<{ id: Scenario; label: string; description: string }> = [
  { id: "ping", label: "Ping config", description: "Vérifie endpoint/API key côté iautos/api." },
  { id: "warning", label: "Monolog warning", description: "Émet un warning via logger." },
  { id: "error", label: "Monolog error", description: "Émet un error via logger." },
  { id: "exception", label: "Log exception", description: "Log avec exception dans le contexte." },
  { id: "throw", label: "Unhandled exception", description: "Lève une exception non catchée (500)." },
  { id: "http500", label: "HTTP 500", description: "Retourne une erreur HTTP 500 contrôlée." },
  { id: "breadcrumbs", label: "Breadcrumb sequence", description: "Émet une séquence info/warn/error." },
  { id: "timeout", label: "Timeout simulation", description: "Simule une latence puis log error." },
];

export default function IntegrationTestPage() {
  const { currentOrgSlug } = useCurrentOrganization();
  const { currentProject } = useCurrentProject();
  const [running, setRunning] = useState<Scenario | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const baseSettingsPath =
    currentOrgSlug && currentProject?.slug
      ? `/dashboard/${currentOrgSlug}/${currentProject.slug}/settings`
      : "/dashboard";

  const runScenario = async (scenario: Scenario) => {
    setRunning(scenario);
    try {
      const res = await fetch("/api/dev/errorwatch/test-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          metadata: {
            orgSlug: currentOrgSlug,
            projectSlug: currentProject?.slug,
            projectId: currentProject?.id,
          },
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ErrorWatch Integration Test</h1>
          <p className="text-sm text-muted-foreground">
            Déclenche des scénarios de test depuis le dashboard vers iautos/api.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={baseSettingsPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{scenario.label}</CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => runScenario(scenario.id)}
                disabled={running !== null}
                className="w-full"
              >
                {running === scenario.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Run {scenario.label}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last Result</CardTitle>
          <CardDescription>Réponse brute du trigger dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[380px] overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

