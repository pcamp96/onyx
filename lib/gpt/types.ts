import type { PlannerSettings, PlannerTodayResult } from "@/lib/core/types";

export interface GptApiCredentialRecord {
  id: string;
  userId: string;
  label: string;
  tokenHash: string;
  tokenLastFour: string;
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface GptInstructionTemplateInput {
  baseUrl: string;
  schemaUrl: string;
  authHeaderName: string;
  authTypeLabel: string;
  authNotes: string;
  timezone: PlannerSettings["timezone"];
  displayName?: string;
}

export interface GptSetupData {
  baseUrl: string;
  schemaUrl: string;
  schemaYamlUrl: string;
  authType: string;
  authHeaderName: string;
  authNotes: string;
  actionInstructions: string;
  actionSchemaJson: string;
  actionSchemaYaml: string;
  instructions: string;
  conversationStarters: string[];
  checklist: string[];
  sampleTodayResponse: PlannerTodayResult;
  credential: {
    label: string;
    status: "active" | "revoked" | "missing";
    tokenLastFour?: string;
    createdAt?: string;
    updatedAt?: string;
    lastUsedAt?: string;
    revokedAt?: string;
  };
}
