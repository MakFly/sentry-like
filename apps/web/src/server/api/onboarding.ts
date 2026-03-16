import { fetchAPI } from './client';
import type { Platform, SdkInstructions } from './types';

export const getStatus = async (): Promise<{
  needsOnboarding: boolean;
  hasOrganization: boolean;
  hasProject: boolean;
}> => {
  return fetchAPI("/onboarding/status");
};

export const setup = async (data: {
  organizationName: string;
  projectName: string;
  environment?: "production" | "staging" | "development";
  platform: Platform;
}): Promise<{
  organization: { id: string; name: string; slug: string };
  project: { id: string; name: string; slug: string; environment: string; platform: Platform };
  apiKey: { id: string; key: string; name: string };
  sdkInstructions: SdkInstructions;
}> => {
  return fetchAPI("/onboarding/setup", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

