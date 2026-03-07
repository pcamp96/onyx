"use client";

import { useState, useTransition } from "react";

import type { GoogleSheetConfig, IntegrationProvider, IntegrationRecord } from "@/lib/core/types";
import { PROVIDER_LABELS } from "@/lib/config/constants";

type Props = {
  integrations: IntegrationRecord[];
  googleSheetsConfig: GoogleSheetConfig | null;
  configs: Partial<Record<IntegrationProvider, Record<string, unknown>>>;
};

export function IntegrationsPanel({ integrations, googleSheetsConfig, configs }: Props) {
  const [items, setItems] = useState(integrations);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig | null>(googleSheetsConfig);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function updateIntegration(provider: IntegrationProvider, payload: Record<string, unknown>) {
    const response = await fetch(`/api/integrations/${provider}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to update integration");
    }

    const updated = (await response.json()) as { integration: IntegrationRecord; config?: Record<string, unknown> | GoogleSheetConfig | null };
    if ("integration" in updated) {
      setItems((current) => current.map((item) => (item.provider === provider ? updated.integration : item)));
      if (provider === "google-sheets" && updated.config) {
        setSheetConfig(updated.config as GoogleSheetConfig);
      }
    }
  }

  async function trigger(provider: IntegrationProvider, action: "test" | "sync") {
    setStatus(null);
    const response = await fetch(`/api/integrations/${provider}/${action}`, {
      method: "POST",
    });
    const payload = await response.json();
    setStatus(response.ok ? payload.message : payload.error);
  }

  async function saveSecret(provider: IntegrationProvider, secret: string) {
    setStatus(null);
    const response = await fetch(`/api/integrations/${provider}/secret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    const payload = await response.json();
    setStatus(response.ok ? payload.message : payload.error);
  }

  return (
    <div className="space-y-6">
      {status ? <div className="rounded-2xl bg-stone-950 px-4 py-3 text-sm text-stone-50">{status}</div> : null}
      {items.map((integration) => (
        <IntegrationCard
          key={integration.provider}
          integration={integration}
          googleSheetsConfig={sheetConfig}
          initialConfig={configs[integration.provider] ?? null}
          busy={isPending}
          onSave={(payload) =>
            startTransition(async () => {
              await updateIntegration(integration.provider, payload);
            })
          }
          onSecretSave={(secret) =>
            startTransition(async () => {
              await saveSecret(integration.provider, secret);
            })
          }
          onAction={(action) =>
            startTransition(async () => {
              await trigger(integration.provider, action);
            })
          }
        />
      ))}
    </div>
  );
}

function IntegrationCard({
  integration,
  googleSheetsConfig,
  initialConfig,
  busy,
  onSave,
  onSecretSave,
  onAction,
}: {
  integration: IntegrationRecord;
  googleSheetsConfig: GoogleSheetConfig | null;
  initialConfig: Record<string, unknown> | null;
  busy: boolean;
  onSave: (payload: Record<string, unknown>) => void;
  onSecretSave: (secret: string) => void;
  onAction: (action: "test" | "sync") => void;
}) {
  const [secret, setSecret] = useState("");
  const record = (initialConfig ?? {}) as Record<string, unknown>;
  const [localConfig, setLocalConfig] = useState<Record<string, string>>(() => {
    if (integration.provider === "google-sheets") {
      return {
        calendarId: "",
        workspaceId: "",
        icsUrl: "",
        spreadsheetId: googleSheetsConfig?.spreadsheetId ?? "",
        worksheetName: googleSheetsConfig?.worksheetName ?? "",
        sourceUrl: googleSheetsConfig?.sourceUrl ?? "",
        submitted_at: googleSheetsConfig?.columnMapping.submitted_at ?? "submitted_at",
        title: googleSheetsConfig?.columnMapping.title ?? "title",
        word_count: googleSheetsConfig?.columnMapping.word_count ?? "word_count",
        pay: googleSheetsConfig?.columnMapping.pay ?? "pay",
        status: googleSheetsConfig?.columnMapping.status ?? "status",
        outlet: googleSheetsConfig?.columnMapping.outlet ?? "outlet",
      };
    }

    return {
      spreadsheetId: "",
      worksheetName: "",
      sourceUrl: "",
      submitted_at: "",
      title: "",
      word_count: "",
      pay: "",
      status: "",
      outlet: "",
      calendarId: String(record.calendarId ?? ""),
      workspaceId: String(record.workspaceId ?? ""),
      icsUrl: String(record.icsUrl ?? ""),
    };
  });

  const providerLabel = PROVIDER_LABELS[integration.provider];

  return (
    <section className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-stone-500">{providerLabel}</p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-950">{integration.enabled ? "Enabled" : "Disabled"}</h2>
          <p className="mt-2 text-sm text-stone-600">
            Last sync: {integration.lastSyncAt ?? "never"} | Last error: {integration.lastError ?? "none"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onAction("test")}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
          >
            Test
          </button>
          <button
            type="button"
            onClick={() => onAction("sync")}
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-stone-50"
          >
            Sync
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
          <input
            type="checkbox"
            checked={integration.enabled}
          onChange={(event) => onSave({ enabled: event.target.checked })}
          />
          Enable integration
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Secret / token / service account JSON</span>
          <div className="flex gap-2">
            <input
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Paste a replacement secret"
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none"
            />
            <button
              type="button"
              disabled={!secret || busy}
              onClick={() => onSecretSave(secret)}
              className="rounded-full bg-stone-200 px-4 py-3 text-sm font-semibold text-stone-900"
            >
              Save
            </button>
          </div>
        </label>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {integration.provider === "google-sheets" ? (
          <>
            <Field label="Spreadsheet ID" value={localConfig.spreadsheetId ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, spreadsheetId: value }))} />
            <Field label="Worksheet" value={localConfig.worksheetName ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, worksheetName: value }))} />
            <Field label="Paste full URL" value={localConfig.sourceUrl ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, sourceUrl: value }))} />
            <Field label="Submitted column" value={localConfig.submitted_at ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, submitted_at: value }))} />
            <Field label="Title column" value={localConfig.title ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, title: value }))} />
            <Field label="Word count column" value={localConfig.word_count ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, word_count: value }))} />
            <Field label="Pay column" value={localConfig.pay ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, pay: value }))} />
            <Field label="Status column" value={localConfig.status ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, status: value }))} />
            <Field label="Outlet column" value={localConfig.outlet ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, outlet: value }))} />
          </>
        ) : integration.provider === "apple-calendar" ? (
          <Field label="ICS URL" value={localConfig.icsUrl ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, icsUrl: value }))} />
        ) : integration.provider === "google-calendar" ? (
          <Field label="Calendar ID" value={localConfig.calendarId ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, calendarId: value }))} />
        ) : integration.provider === "asana" ? (
          <Field label="Workspace ID (optional)" value={localConfig.workspaceId ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, workspaceId: value }))} />
        ) : (
          <Field label="Project/workspace hint" value={localConfig.workspaceId ?? ""} onChange={(value) => setLocalConfig((current) => ({ ...current, workspaceId: value }))} />
        )}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (integration.provider === "google-sheets") {
            onSave({
              googleSheetConfig: {
                spreadsheetId: localConfig.spreadsheetId,
                worksheetName: localConfig.worksheetName,
                sourceUrl: localConfig.sourceUrl,
                columnMapping: {
                  submitted_at: localConfig.submitted_at,
                  title: localConfig.title,
                  word_count: localConfig.word_count,
                  pay: localConfig.pay,
                  status: localConfig.status,
                  outlet: localConfig.outlet,
                },
              },
            });
            return;
          }

          onSave({ config: localConfig });
        }}
        className="mt-6 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50"
      >
        Save config
      </button>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none"
      />
    </label>
  );
}
