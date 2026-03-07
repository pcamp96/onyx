"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import type { GptSetupData } from "@/lib/gpt/types";

type Props = {
  initialSetup: GptSetupData;
};

type CredentialResponse = {
  token?: string;
  setup: GptSetupData;
  error?: string;
};

export function GptSetupPanel({ initialSetup }: Props) {
  const [setup, setSetup] = useState(initialSetup);
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [schemaStatus, setSchemaStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(url: string, action: "generate" | "rotate" | "revoke") {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(url, { method: "POST" });
      const payload = (await response.json()) as CredentialResponse;

      if (!response.ok) {
        setMessage(payload.error ?? "Request failed.");
        return;
      }

      setSetup(payload.setup);
      setPlainToken(payload.token ?? null);
      setMessage(
        action === "revoke"
          ? "API key revoked."
          : action === "rotate"
            ? "API key rotated. Save the new token now."
            : "API key generated. Save it now because it will not be shown again.",
      );
    });
  }

  async function testSchemaAvailability() {
    setSchemaStatus("Checking schema URL...");
    try {
      const response = await fetch(setup.schemaUrl, { method: "GET" });
      setSchemaStatus(response.ok ? "Schema URL is reachable." : `Schema check failed with ${response.status}.`);
    } catch {
      setSchemaStatus("Schema URL check failed.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="GPT Setup"
        description="Create a Custom GPT that can call your Onyx API with a canonical schema and a dedicated API key."
      />

      <SectionCard title="Overview" description="What this setup enables and what it intentionally does not do.">
        <div className="grid gap-3 md:grid-cols-2">
          <InfoBlock
            title="What the GPT can do"
            body="Read ranked /today and /week output, capture new items into Onyx, and answer with concise execution guidance grounded in your live priority data."
          />
          <InfoBlock
            title="What it should not do"
            body="It should not invent a new rank order, turn Onyx into a scheduler, or rely on browser session auth."
          />
        </div>
      </SectionCard>

      <SectionCard title="API Details" description="Copy these values into the Custom GPT action setup flow.">
        <div className="space-y-3">
          <ValueRow label="Base URL" value={setup.baseUrl} />
          <ValueRow label="Schema URL" value={setup.schemaUrl} />
          <ValueRow label="YAML URL" value={setup.schemaYamlUrl} />
          <ValueRow label="Auth type" value={setup.authType} />
          <ValueRow label="Header name" value={setup.authHeaderName} />
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
            {setup.authNotes}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Custom Action Setup" description="Use this block for wiring the action schema and auth, separate from the GPT behavior instructions.">
        <LargeTextBlock value={setup.actionInstructions} />
      </SectionCard>

      <SectionCard title="Action Schema" description="This is the canonical action schema the GPT action will import and call.">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-stone-900">YAML</p>
            <LargeTextBlock value={setup.actionSchemaYaml} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-stone-900">JSON</p>
            <LargeTextBlock value={setup.actionSchemaJson} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="API Key"
        description="Generate a dedicated token for Custom GPT actions. Tokens are shown once and stored only as hashes."
        action={
          <div className="flex gap-2">
            {setup.credential.status === "missing" ? (
              <Button disabled={isPending} onClick={() => runAction("/api/gpt/credentials", "generate")}>
                {isPending ? "Working..." : "Generate key"}
              </Button>
            ) : (
              <>
                <Button
                  disabled={isPending}
                  onClick={() => {
                    if (window.confirm("Rotate the API key? Existing GPT setups will stop working until updated.")) {
                      runAction("/api/gpt/credentials/rotate", "rotate");
                    }
                  }}
                >
                  {isPending ? "Working..." : "Rotate key"}
                </Button>
                <Button
                  variant="danger"
                  disabled={isPending || setup.credential.status !== "active"}
                  onClick={() => {
                    if (window.confirm("Revoke the API key? Existing GPT setups will stop working immediately.")) {
                      runAction("/api/gpt/credentials/revoke", "revoke");
                    }
                  }}
                >
                  Revoke key
                </Button>
              </>
            )}
          </div>
        }
      >
        {setup.credential.status === "missing" ? (
          <EmptyState title="No GPT API key yet" description="Generate one to connect a Custom GPT to your Onyx instance." />
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoBlock title="Status" body={setup.credential.status === "active" ? "Active" : "Revoked"} />
              <InfoBlock title="Last four" body={setup.credential.tokenLastFour ? `••••${setup.credential.tokenLastFour}` : "Unavailable"} />
              <InfoBlock title="Created" body={formatTimestamp(setup.credential.createdAt)} />
              <InfoBlock title="Last used" body={formatTimestamp(setup.credential.lastUsedAt)} />
            </div>
            {plainToken ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-900">Save this token now</p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      This plaintext token will not be shown again after you leave or refresh this page.
                    </p>
                    <pre className="mt-3 overflow-x-auto rounded-lg border border-amber-200 bg-white px-3 py-3 text-sm text-stone-900">
                      {plainToken}
                    </pre>
                  </div>
                  <CopyButton value={plainToken} />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
                The plaintext token is not stored. Rotate the key if you need a new value.
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Custom GPT Instructions" description="Paste this into the GPT instructions field.">
        <LargeTextBlock value={setup.instructions} />
      </SectionCard>

      <SectionCard title="Suggested Conversation Starters" description="Useful prompts for validating the GPT behavior.">
        <div className="space-y-2">
          {setup.conversationStarters.map((starter) => (
            <div key={starter} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-sm text-stone-800">{starter}</p>
              <CopyButton value={starter} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Setup Checklist" description="Use this order to avoid broken action imports or missing auth.">
        <ol className="space-y-3 text-sm text-stone-700">
          {setup.checklist.map((item, index) => (
            <li key={item} className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
              <span className="font-medium text-stone-950">{index + 1}.</span> {item}
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        title="Test / Validation"
        description="Verify that the schema is reachable and that the expected /today response shape matches what your GPT should read."
        action={
          <Button variant="secondary" onClick={testSchemaAvailability}>
            Test API availability
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
            {schemaStatus ?? "Test the public schema URL here. End-to-end authenticated action testing must use the freshly issued token because plaintext tokens are not stored."}
          </div>
          <LargeTextBlock value={JSON.stringify(setup.sampleTodayResponse, null, 2)} />
        </div>
      </SectionCard>

      <p className="text-sm text-stone-500">{message ?? "Generate a key, configure the action, then validate /today before relying on the GPT."}</p>
    </div>
  );
}

function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">{label}</p>
        <p className="mt-1 truncate text-sm text-stone-900">{value}</p>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

function LargeTextBlock({ value }: { value: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CopyButton value={value} />
      </div>
      <textarea
        readOnly
        value={value}
        className="min-h-64 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-sm leading-6 text-stone-900"
      />
    </div>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-800">{body}</p>
    </div>
  );
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString();
}
