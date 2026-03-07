"use client";

import { useState, useTransition } from "react";

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
    <form onSubmit={onSubmit} className="space-y-6 rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-lg">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-stone-500">Planning settings</p>
        <h2 className="mt-3 text-3xl font-semibold text-stone-950">Default ranking controls</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Weekly article minimum" value={settings.weeklyArticleMinimum} onChange={(value) => setField("weeklyArticleMinimum", Number(value))} />
        <Input label="Weekly article goal" value={settings.weeklyArticleGoal} onChange={(value) => setField("weeklyArticleGoal", Number(value))} />
        <Input label="Sponsor urgency days" value={settings.sponsorUrgencyDays} onChange={(value) => setField("sponsorUrgencyDays", Number(value))} />
        <Input label="Max today tasks" value={settings.maxTodayTasks} onChange={(value) => setField("maxTodayTasks", Number(value))} />
        <Input label="Timezone" value={settings.timezone} onChange={(value) => setField("timezone", value)} />
        <Input label="Workdays (comma-separated)" value={settings.workdays.join(",")} onChange={(value) => setField("workdays", value.split(",").map((entry) => Number(entry.trim())).filter((entry) => !Number.isNaN(entry)))} />
      </div>
      <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
        <input
          type="checkbox"
          checked={settings.createdWorkshopLowPriorityEnabled}
          onChange={(event) => setField("createdWorkshopLowPriorityEnabled", event.target.checked)}
        />
        Keep Created Workshop low priority by default
      </label>
      <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
        <input
          type="checkbox"
          checked={settings.sundayNoWork}
          onChange={(event) => setField("sundayNoWork", event.target.checked)}
        />
        Sunday is a no-work day
      </label>
      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}

function Input({ label, value, onChange }: { label: string; value: string | number; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-stone-900"
      />
    </label>
  );
}
