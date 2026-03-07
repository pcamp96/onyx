"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { SectionCard } from "@/components/ui/section-card";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import type { PlannerSettings } from "@/lib/core/types";

type Props = {
  initialSettings: PlannerSettings;
};

export function SettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField<Key extends keyof PlannerSettings>(key: Key, value: PlannerSettings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      setMessage(response.ok ? "Settings saved." : "Failed to save settings.");
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Planning defaults, working cadence, and calendar rules that shape how Onyx schedules around your week."
      />
      <form onSubmit={onSubmit} className="space-y-6">
        <SectionCard title="Planning targets" description="Publishing targets and urgency inputs used during ranking.">
          <div className="grid gap-4 md:grid-cols-2">
            <NumericField
              label="Weekly article minimum"
              value={settings.weeklyArticleMinimum}
              onChange={(value) => setField("weeklyArticleMinimum", Number(value))}
            />
            <NumericField
              label="Weekly article goal"
              value={settings.weeklyArticleGoal}
              onChange={(value) => setField("weeklyArticleGoal", Number(value))}
            />
            <NumericField
              label="Sponsor urgency days"
              value={settings.sponsorUrgencyDays}
              onChange={(value) => setField("sponsorUrgencyDays", Number(value))}
            />
            <NumericField
              label="Max today tasks"
              value={settings.maxTodayTasks}
              onChange={(value) => setField("maxTodayTasks", Number(value))}
            />
          </div>
        </SectionCard>
        <SectionCard title="Working cadence" description="Define your work week and the days Onyx should treat as available.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Timezone" value={settings.timezone} onChange={(value) => setField("timezone", value)} />
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-700">Workdays</p>
              <DayPicker
                selected={settings.workdays}
                onToggle={(day) => {
                  const nextWorkdays = settings.workdays.includes(day)
                    ? settings.workdays.filter((entry) => entry !== day)
                    : [...settings.workdays, day].sort((left, right) => left - right);

                  setSettings((current) => ({
                    ...current,
                    workdays: nextWorkdays,
                    sundayNoWork: !nextWorkdays.includes(0),
                  }));
                }}
              />
              <p className="text-xs leading-5 text-stone-500">Click the days you typically work. Selecting Sunday automatically allows Sunday work.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <ToggleRow
              label="Keep Created Workshop low priority by default"
              description="Preserve the current ranking bias toward more urgent operating work."
              checked={settings.createdWorkshopLowPriorityEnabled}
              onChange={(checked) => setField("createdWorkshopLowPriorityEnabled", checked)}
            />
          </div>
        </SectionCard>
        <SectionCard
          title="Calendar blocking"
          description="Choose which calendar events should count as real scheduling constraints when Onyx ranks your week."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Blocking mode"
              hint="Use owner-only mode if your calendar contains events that should not consume founder capacity."
            >
              <Select
                value={settings.calendarEventHandling}
                onChange={(event) =>
                  setField("calendarEventHandling", event.target.value as PlannerSettings["calendarEventHandling"])
                }
              >
                <option value="all_busy">Block all busy events</option>
                <option value="owned_only">Only block appointments that look like mine</option>
              </Select>
            </FormField>
            <FormField
              label="Owner identifiers"
              hint="Comma-separated names, emails, or calendar labels. Example: patrick@..., Patrick Campanale."
            >
              <Textarea
                value={settings.calendarOwnerIdentifiers.join(", ")}
                rows={4}
                onChange={(event) =>
                  setField(
                    "calendarOwnerIdentifiers",
                    event.target.value
                      .split(",")
                      .map((entry) => entry.trim())
                      .filter(Boolean),
                  )
                }
              />
            </FormField>
          </div>
          <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
            In owner-only mode, Google Calendar events block time when Google marks you as the organizer/creator/attendee or
            when the event matches one of your identifiers.
          </div>
        </SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-500">{message ?? "Changes are saved directly to the current founder profile."}</p>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

const dayOptions = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

function DayPicker({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (day: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {dayOptions.map((day) => {
        const active = selected.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => onToggle(day.value)}
            className={
              active
                ? "inline-flex h-9 items-center rounded-md border border-stone-900 bg-stone-950 px-3 text-sm font-medium text-white"
                : "inline-flex h-9 items-center rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-600 hover:border-stone-300 hover:bg-stone-50"
            }
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string | number;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label} hint={hint}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

function NumericField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return <TextField label={label} value={value} onChange={onChange} />;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50 px-4 py-4">
      <div>
        <p className="text-sm font-medium text-stone-900">{label}</p>
        <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
