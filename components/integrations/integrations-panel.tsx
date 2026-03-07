"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { MetadataRow } from "@/components/ui/metadata-row";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toggle } from "@/components/ui/toggle";
import type { GoogleSheetConfig, IntegrationProvider, IntegrationRecord } from "@/lib/core/types";
import { PROVIDER_LABELS } from "@/lib/core/constants";

type Props = {
  integrations: IntegrationRecord[];
  googleSheetsConfig: GoogleSheetConfig | null;
  configs: Partial<Record<IntegrationProvider, Record<string, unknown>>>;
};

type BannerState = {
  tone: "success" | "error";
  message: string;
} | null;

type IntegrationLocalConfig = {
  spreadsheetId: string;
  worksheetName: string;
  worksheetNames: string[];
  sourceUrl: string;
  layout: "table" | "weekly_grid";
  headerRow: string;
  dataStartRow: string;
  endRow: string;
  weekStartDate: string;
  submitted_at: string;
  title: string;
  source_url: string;
  word_count: string;
  pay: string;
  status: string;
  outlet: string;
  calendarIds: string[];
  icsUrls: string[];
  workspaceId: string;
  projectId: string;
};

export function IntegrationsPanel({ integrations, googleSheetsConfig, configs }: Props) {
  const [items, setItems] = useState(integrations);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig | null>(googleSheetsConfig);
  const [banner, setBanner] = useState<BannerState>(null);
  const [isPending, startTransition] = useTransition();

  async function updateIntegration(provider: IntegrationProvider, payload: Record<string, unknown>) {
    const response = await fetch(`/api/integrations/${provider}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${PROVIDER_LABELS[provider]}.`);
    }

    const updated = (await response.json()) as {
      integration: IntegrationRecord;
      config?: Record<string, unknown> | GoogleSheetConfig | null;
    };

    setItems((current) => current.map((item) => (item.provider === provider ? updated.integration : item)));

    if (provider === "google-sheets" && updated.config) {
      setSheetConfig(updated.config as GoogleSheetConfig);
    }
  }

  async function trigger(provider: IntegrationProvider, action: "test" | "sync") {
    setBanner(null);
    const response = await fetch(`/api/integrations/${provider}/${action}`, {
      method: "POST",
    });
    const payload = (await response.json()) as { message?: string; error?: string };

    setBanner({
      tone: response.ok ? "success" : "error",
      message: payload.message ?? payload.error ?? `${PROVIDER_LABELS[provider]} request failed.`,
    });
  }

  async function saveSecret(provider: IntegrationProvider, secret: string) {
    setBanner(null);
    const response = await fetch(`/api/integrations/${provider}/secret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    const payload = (await response.json()) as { message?: string; error?: string };

    setBanner({
      tone: response.ok ? "success" : "error",
      message: payload.message ?? payload.error ?? `${PROVIDER_LABELS[provider]} secret update failed.`,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connection health, configuration, and sync controls for task, calendar, and reporting providers."
      />
      {banner ? (
        <div
          className={
            banner.tone === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {banner.message}
        </div>
      ) : null}
      {items.length ? (
        <div className="space-y-3">
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
                  setBanner({
                    tone: "success",
                    message: `${PROVIDER_LABELS[integration.provider]} configuration saved.`,
                  });
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
      ) : (
        <SectionCard>
          <EmptyState
            title="No integrations found"
            description="Onyx expected provider records but none were returned for this founder account."
          />
        </SectionCard>
      )}
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
  const [localConfig, setLocalConfig] = useState<IntegrationLocalConfig>(() => ({
    spreadsheetId: googleSheetsConfig?.spreadsheetId ?? "",
    worksheetName: googleSheetsConfig?.worksheetName ?? "",
    worksheetNames: toStringList(googleSheetsConfig?.worksheetNames, googleSheetsConfig?.worksheetName),
    sourceUrl: googleSheetsConfig?.sourceUrl ?? "",
    layout: googleSheetsConfig?.layout ?? "table",
    headerRow: String(googleSheetsConfig?.headerRow ?? 1),
    dataStartRow: String(googleSheetsConfig?.dataStartRow ?? 2),
    endRow: String(googleSheetsConfig?.endRow ?? ""),
    weekStartDate: googleSheetsConfig?.weekStartDate ?? "",
    submitted_at: googleSheetsConfig?.columnMapping.submitted_at ?? "submitted_at",
    title: googleSheetsConfig?.columnMapping.title ?? "title",
    source_url: googleSheetsConfig?.columnMapping.source_url ?? "",
    word_count: googleSheetsConfig?.columnMapping.word_count ?? "word_count",
    pay: googleSheetsConfig?.columnMapping.pay ?? "pay",
    status: googleSheetsConfig?.columnMapping.status ?? "status",
    outlet: googleSheetsConfig?.columnMapping.outlet ?? "outlet",
    calendarIds: toStringList(record.calendarIds, record.calendarId),
    icsUrls: toStringList(record.icsUrls, record.icsUrl),
    workspaceId: String(record.workspaceId ?? ""),
    projectId: String(record.projectId ?? ""),
  }));

  const providerLabel = PROVIDER_LABELS[integration.provider];
  const testStatus = integration.lastTestStatus ?? "idle";
  const syncStatus = integration.lastSyncStatus ?? "idle";

  return (
    <SectionCard
      className="overflow-hidden"
      contentClassName="px-0 py-0"
      action={<StatusBadge label={integration.enabled ? "Live" : "Inactive"} tone={getIntegrationTone(integration)} />}
    >
      <div className="space-y-0">
        <div className="flex flex-col gap-4 px-4 py-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-stone-950">{providerLabel}</h2>
              <StatusBadge label={integration.enabled ? "Enabled" : "Disabled"} tone={getIntegrationTone(integration)} />
            </div>
            <MetadataRow
              items={[
                { label: "Health", value: integration.status },
                { label: "Last sync", value: integration.lastSyncAt ?? "never" },
                { label: "Sync status", value: syncStatus },
                { label: "Last test", value: integration.lastTestAt ?? "never" },
                { label: "Test status", value: testStatus },
              ]}
            />
            {integration.lastError ? (
              <p className="max-w-3xl text-sm leading-5 text-red-700">{integration.lastError}</p>
            ) : (
              <p className="text-sm leading-5 text-stone-500">
                Configuration remains unchanged until you explicitly save updates.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-2">
              <span className="text-sm font-medium text-stone-700">Enabled</span>
              <Toggle checked={integration.enabled} disabled={busy} onChange={(checked) => onSave({ enabled: checked })} />
            </div>
            <Button variant="secondary" disabled={busy} onClick={() => onAction("test")}>
              Test connection
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => onAction("sync")}>
              Sync now
            </Button>
          </div>
        </div>
        <div className="border-t border-stone-200 bg-stone-50 px-4 py-3">
          {integration.provider === "google-sheets" ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.85fr)]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Spreadsheet ID"
                    value={localConfig.spreadsheetId ?? ""}
                    onChange={(value) => setLocalConfig((current) => ({ ...current, spreadsheetId: value }))}
                  />
                  {localConfig.layout === "weekly_grid" ? (
                    <MultiValueField
                      label="Weekly worksheets"
                      hint="Add each weekly tab in this monthly workbook, for example March 2-6 and March 9-13."
                      values={localConfig.worksheetNames}
                      onChange={(values) =>
                        setLocalConfig((current) => ({
                          ...current,
                          worksheetNames: values,
                          worksheetName: values.find((value) => value.trim()) ?? "",
                        }))
                      }
                      placeholder="March 2-6"
                    />
                  ) : (
                    <Field
                      label="Worksheet"
                      value={localConfig.worksheetName ?? ""}
                      onChange={(value) => setLocalConfig((current) => ({ ...current, worksheetName: value }))}
                    />
                  )}
                </div>
                <Field
                  label="Sheet URL"
                  hint="Optional full source URL for quick verification."
                  value={localConfig.sourceUrl ?? ""}
                  onChange={(value) => setLocalConfig((current) => ({ ...current, sourceUrl: value }))}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <SelectField
                    label="Layout"
                    hint="Use weekly grid for sheets like your day-by-day article tracker."
                    value={localConfig.layout}
                    onChange={(value) =>
                      setLocalConfig((current) => ({
                        ...current,
                        layout: value === "weekly_grid" ? "weekly_grid" : "table",
                        headerRow:
                          value === "weekly_grid"
                            ? current.headerRow === "1"
                              ? "2"
                              : current.headerRow
                            : current.headerRow,
                        dataStartRow:
                          value === "weekly_grid"
                            ? current.dataStartRow === "2"
                              ? "3"
                              : current.dataStartRow
                            : current.dataStartRow,
                      }))
                    }
                    options={[
                      { value: "table", label: "Table" },
                      { value: "weekly_grid", label: "Weekly grid" },
                    ]}
                  />
                  <Field
                    label={localConfig.layout === "weekly_grid" ? "Subheader row" : "Header row"}
                    hint={localConfig.layout === "weekly_grid" ? "The row with Name / Emaki Link / Asana Link." : "The row containing your column names."}
                    value={localConfig.headerRow}
                    onChange={(value) => setLocalConfig((current) => ({ ...current, headerRow: value }))}
                  />
                  <Field
                    label="Data starts on row"
                    hint="Usually the first row that contains actual articles."
                    value={localConfig.dataStartRow}
                    onChange={(value) => setLocalConfig((current) => ({ ...current, dataStartRow: value }))}
                  />
                  <Field
                    label="Stop before row"
                    hint="Optional. Use this to exclude totals and monthly summary rows."
                    value={localConfig.endRow}
                    onChange={(value) => setLocalConfig((current) => ({ ...current, endRow: value }))}
                  />
                </div>
                {localConfig.layout === "weekly_grid" ? (
                  <Field
                    label="Week starts on"
                    hint="Optional shared ISO date like 2026-03-02. Leave blank if each worksheet name starts with a date like March 2-6."
                    value={localConfig.weekStartDate}
                    onChange={(value) => setLocalConfig((current) => ({ ...current, weekStartDate: value }))}
                  />
                ) : null}
                <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-stone-900">Column mapping</h3>
                    <p className="mt-1 text-sm leading-5 text-stone-500">
                      {localConfig.layout === "weekly_grid"
                        ? "Enter the repeated labels Onyx should look for inside each day block. For your screenshot, title should be Name and source URL can be Emaki Link."
                        : "Enter either the header text Onyx should match or a column letter like A, C, or AA."}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {localConfig.layout === "table" ? (
                      <Field
                        label="Submitted date column"
                        value={localConfig.submitted_at}
                        onChange={(value) => setLocalConfig((current) => ({ ...current, submitted_at: value }))}
                      />
                    ) : null}
                    <Field label="Title column" value={localConfig.title} onChange={(value) => setLocalConfig((current) => ({ ...current, title: value }))} />
                    <Field
                      label={localConfig.layout === "weekly_grid" ? "Primary link column" : "Source URL column"}
                      value={localConfig.source_url}
                      onChange={(value) => setLocalConfig((current) => ({ ...current, source_url: value }))}
                    />
                    {localConfig.layout === "table" ? (
                      <>
                        <Field label="Word count column" value={localConfig.word_count} onChange={(value) => setLocalConfig((current) => ({ ...current, word_count: value }))} />
                        <Field label="Pay column" value={localConfig.pay} onChange={(value) => setLocalConfig((current) => ({ ...current, pay: value }))} />
                        <Field label="Status column" value={localConfig.status} onChange={(value) => setLocalConfig((current) => ({ ...current, status: value }))} />
                        <Field label="Outlet column" value={localConfig.outlet} onChange={(value) => setLocalConfig((current) => ({ ...current, outlet: value }))} />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <IntegrationActions
                busy={busy}
                secret={secret}
                setSecret={setSecret}
                onSecretSave={onSecretSave}
                onSave={() =>
                  onSave({
                    googleSheetConfig: {
                      spreadsheetId: localConfig.spreadsheetId,
                      worksheetName: localConfig.layout === "weekly_grid" ? compactList(localConfig.worksheetNames)[0] ?? "" : localConfig.worksheetName,
                      worksheetNames: localConfig.layout === "weekly_grid" ? compactList(localConfig.worksheetNames) : undefined,
                      sourceUrl: localConfig.sourceUrl,
                      layout: localConfig.layout,
                      headerRow: parseOptionalNumber(localConfig.headerRow),
                      dataStartRow: parseOptionalNumber(localConfig.dataStartRow),
                      endRow: parseOptionalNumber(localConfig.endRow),
                      weekStartDate: localConfig.weekStartDate || undefined,
                      columnMapping: {
                        submitted_at: localConfig.submitted_at,
                        title: localConfig.title,
                        source_url: localConfig.source_url || undefined,
                        word_count: localConfig.word_count,
                        pay: localConfig.pay,
                        status: localConfig.status,
                        outlet: localConfig.outlet,
                      },
                    },
                  })
                }
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
                  {integration.provider === "apple-calendar" ? (
                    <MultiValueField
                      label="Apple calendar feeds"
                      hint="Add one ICS URL per calendar you want Onyx to read."
                      values={localConfig.icsUrls}
                      onChange={(values) => setLocalConfig((current) => ({ ...current, icsUrls: values }))}
                      placeholder="https://calendar.icloud.com/..."
                    />
                  ) : integration.provider === "google-calendar" ? (
                    <MultiValueField
                      label="Google Calendar IDs"
                      hint="Add one calendar ID per line item. Example: primary or a shared calendar email address."
                      values={localConfig.calendarIds}
                      onChange={(values) => setLocalConfig((current) => ({ ...current, calendarIds: values }))}
                      placeholder="primary"
                    />
                  ) : integration.provider === "asana" ? (
                    <Field
                      label="Workspace ID"
                      hint="Optional. Leave blank to use the account default."
                      value={localConfig.workspaceId ?? ""}
                      onChange={(value) => setLocalConfig((current) => ({ ...current, workspaceId: value }))}
                    />
                  ) : integration.provider === "todoist" ? (
                    <Field
                      label="Project ID"
                      hint="Optional. Limit sync to a single Todoist project."
                      value={localConfig.projectId ?? ""}
                      onChange={(value) => setLocalConfig((current) => ({ ...current, projectId: value }))}
                    />
                  ) : (
                    <Field
                      label="Project or workspace hint"
                      hint="Used as a lightweight targeting hint for provider sync."
                      value={localConfig.workspaceId ?? ""}
                      onChange={(value) => setLocalConfig((current) => ({ ...current, workspaceId: value }))}
                    />
                  )}
                </div>
                <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-stone-900">Credentials</h3>
                    <p className="mt-1 text-sm leading-5 text-stone-500">
                      Stored secrets are encrypted. Pasting a new value replaces the current secret.
                    </p>
                  </div>
                  <FormField
                    label="Secret or token"
                    hint="Paste a replacement value only when rotating or fixing credentials."
                  >
                    <Input
                      type="password"
                      value={secret}
                      placeholder="Enter a replacement credential"
                      onChange={(event) => setSecret(event.target.value)}
                    />
                  </FormField>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={!secret || busy}
                      onClick={() => {
                        onSecretSave(secret);
                        setSecret("");
                      }}
                    >
                      Replace secret
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={busy}
                  onClick={() =>
                    onSave({
                      config:
                        integration.provider === "google-calendar"
                          ? { calendarIds: compactList(localConfig.calendarIds) }
                          : integration.provider === "apple-calendar"
                            ? { icsUrls: compactList(localConfig.icsUrls) }
                            : integration.provider === "asana"
                              ? { workspaceId: localConfig.workspaceId }
                              : integration.provider === "todoist"
                                ? { projectId: localConfig.projectId }
                                : localConfig,
                    })
                  }
                >
                  {busy ? "Saving..." : "Save config"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function IntegrationActions({
  busy,
  secret,
  setSecret,
  onSecretSave,
  onSave,
}: {
  busy: boolean;
  secret: string;
  setSecret: (value: string) => void;
  onSecretSave: (secret: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-stone-900">Credentials</h3>
          <p className="mt-1 text-sm leading-5 text-stone-500">
            Stored secrets are encrypted. Pasting a new value replaces the current secret.
          </p>
        </div>
        <FormField
          label="Secret or token"
          hint="Paste a replacement value only when rotating or fixing credentials."
        >
          <Input
            type="password"
            value={secret}
            placeholder="Enter a replacement credential"
            onChange={(event) => setSecret(event.target.value)}
          />
        </FormField>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={!secret || busy}
            onClick={() => {
              onSecretSave(secret);
              setSecret("");
            }}
          >
            Replace secret
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
        <h3 className="text-sm font-semibold text-stone-900">Save configuration</h3>
        <p className="mt-1 text-sm leading-5 text-stone-500">
          Save provider-specific settings without changing planner behavior.
        </p>
        <div className="mt-3">
          <Button disabled={busy} onClick={onSave}>
            {busy ? "Saving..." : "Save config"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label} hint={hint}>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </FormField>
  );
}

function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <FormField label={label} hint={hint}>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}

function MultiValueField({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  return (
    <FormField label={label} hint={hint}>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="flex gap-2">
            <Input
              value={value}
              placeholder={placeholder}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => onChange(values.length === 1 ? [""] : values.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => onChange([...values, ""])}>
          Add another
        </Button>
      </div>
    </FormField>
  );
}

function toStringList(values: unknown, legacyValue: unknown) {
  if (Array.isArray(values)) {
    const normalized = values
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim());
    return normalized.length ? normalized : [""];
  }

  if (typeof legacyValue === "string" && legacyValue.trim()) {
    return [legacyValue.trim()];
  }

  return [""];
}

function compactList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function parseOptionalNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getIntegrationTone(integration: IntegrationRecord): "success" | "warning" | "error" | "neutral" {
  if (!integration.enabled || integration.status === "disabled") {
    return "neutral";
  }

  if (integration.status === "error" || integration.lastSyncStatus === "error" || integration.lastTestStatus === "error") {
    return "error";
  }

  if (integration.status === "connected") {
    return "success";
  }

  return "warning";
}
