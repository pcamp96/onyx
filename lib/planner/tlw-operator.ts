import type { TlwOperatorPlan, TlwOverviewResponse } from "@/lib/core/types";

function toPercent(value?: number | null) {
  if (value === null || value === undefined) {
    return "unknown";
  }

  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
}

function buildThreadsDraft(settingsTotal: number) {
  return [
    "Spent today dialing in new laser material settings for The Laser Workshop.",
    "",
    "Every test gets uploaded to the database so new laser owners do not have to waste material figuring it out.",
    "",
    `${settingsTotal} settings live so far.`,
    "Goal: 100+.",
    "",
    "Slowly turning this into the place you check before you hit Start.",
  ].join("\n");
}

export function buildTlwOperatorPlan(overview: TlwOverviewResponse): TlwOperatorPlan {
  const snapshot = overview.snapshot;
  const analytics = overview.analytics;
  const settingsVelocity = snapshot.settings_velocity_7d ?? snapshot.new_settings_7d ?? 0;
  const newUsers7d = snapshot.new_users_7d ?? 0;
  const activationRate = analytics.activation_rate ?? snapshot.activation_rate ?? null;
  const topChannel = analytics.top_channel ?? snapshot.traffic_sources?.referrers?.[0]?.name ?? "unknown";
  const topReferrerShare = analytics.traffic_sources?.referrers?.[0]?.share ?? snapshot.traffic_sources?.referrers?.[0]?.share ?? null;

  let focus: TlwOperatorPlan["focus"] = "Seed";
  let reason = `settings_velocity_7d = ${settingsVelocity} -> platform content stalled.`;

  if (activationRate !== null && activationRate < 0.15) {
    focus = "Fix";
    reason = `activation_rate = ${toPercent(activationRate)} -> onboarding or conversion is weak.`;
  } else if (typeof topReferrerShare === "number" && topReferrerShare >= 0.45) {
    focus = "Double Down";
    reason = `${topChannel} is driving an outsized share of traffic right now.`;
  } else if (newUsers7d > 0 && settingsVelocity > 0 && settingsVelocity < 3) {
    focus = "Push";
    reason = `new_users_7d = ${newUsers7d} but settings_velocity_7d = ${settingsVelocity} -> demand is ahead of supply.`;
  }

  const topTasksByFocus: Record<TlwOperatorPlan["focus"], TlwOperatorPlan["topTasks"]> = {
    Seed: [
      {
        title: "Add 10-15 material settings today",
        reason: `Settings total is ${snapshot.settings_total} and new settings in the last 7 days is ${snapshot.new_settings_7d ?? 0}. Supply is the main bottleneck.`,
      },
      {
        title: "Upload 3-5 simple projects or quick wins",
        reason: `You have ${snapshot.users_total} users but only ${snapshot.settings_total} settings. The product needs visible proof of life when new users land.`,
      },
      {
        title: "Capture content while testing settings",
        reason: "One shop session can produce short clips, comparisons, failed attempts, and build-in-public updates without extra planning overhead.",
      },
    ],
    Push: [
      {
        title: "Ship 5-10 new settings or project updates tied to current demand",
        reason: `User growth is happening (${newUsers7d} new users in 7 days), but the content supply layer still needs reinforcement.`,
      },
      {
        title: "Tighten the first-run path for new users",
        reason: `Activation is ${toPercent(activationRate)}. Improve clarity around what a new user should look at first.`,
      },
      {
        title: "Publish proof tied to real usage wins",
        reason: `Use current traffic from ${topChannel} to convert curiosity into signups and repeat visits.`,
      },
    ],
    "Double Down": [
      {
        title: `Publish one strong update on ${topChannel}`,
        reason: `${topChannel} is the top source right now, so it deserves a direct daily action instead of spreading effort evenly.`,
      },
      {
        title: "Turn today's shop work into a sharper conversion asset",
        reason: "Use real settings, before/after examples, or troubleshooting clips that match the audience already responding.",
      },
      {
        title: "Add one product update that supports the winning channel",
        reason: "The channel is working, so the product needs a cleaner payoff once people arrive.",
      },
    ],
    Fix: [
      {
        title: "Find the first activation drop-off and tighten it today",
        reason: `Activation is ${toPercent(activationRate)}. The immediate lever is making the first useful outcome easier to reach.`,
      },
      {
        title: "Make one onboarding or landing-page improvement",
        reason: "Focus on the page or flow that should turn interest into the first useful setting or project interaction.",
      },
      {
        title: "Collect user friction from trial or new users",
        reason: "If conversion or activation is weak, direct friction signals are more valuable than adding random surface area.",
      },
    ],
  };

  const marketingAction: TlwOperatorPlan["marketingAction"] = {
    title: `Post a ${topChannel === "threads.net" || topChannel === "Threads" ? "Threads" : topChannel || "social"} build-in-public update`,
    draft: buildThreadsDraft(snapshot.settings_total),
    reason:
      focus === "Double Down"
        ? `${topChannel} is already working, so today's marketing move should reinforce the channel with the clearest existing traction.`
        : `${topChannel} is the current top channel, so use today's work to create one concrete post instead of a vague marketing task.`,
  };

  const quickRead = [
    newUsers7d > 0
      ? `User growth exists (${newUsers7d} new users this week), but the supply side needs more depth.`
      : "User growth is flat, so the product needs stronger signs of life and clearer distribution loops.",
    settingsVelocity <= 0
      ? "Settings velocity is effectively zero, which makes supply the biggest current bottleneck."
      : `Settings velocity is ${settingsVelocity}, so the question is whether it is keeping up with demand.`,
    `Top channel: ${topChannel || "unknown"}. Activation rate: ${toPercent(activationRate)}.`,
  ];

  return {
    focus,
    reason,
    metrics: {
      usersTotal: snapshot.users_total,
      newUsers7d: snapshot.new_users_7d,
      paidUsers: snapshot.paid_users,
      trialUsers: snapshot.trial_users,
      settingsTotal: snapshot.settings_total,
      newSettings7d: snapshot.new_settings_7d,
      settingsVelocity7d: snapshot.settings_velocity_7d,
      settingsPerPaidUser: snapshot.settings_per_paid_user,
      activationRate,
      activationEstimate: analytics.activation_estimate,
      topChannel,
      growthStage: snapshot.growth_stage,
      generatedAt: overview.generated_at,
    },
    topTasks: topTasksByFocus[focus],
    marketingAction,
    quickRead,
  };
}
