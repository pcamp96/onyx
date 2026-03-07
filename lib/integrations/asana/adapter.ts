import { isOverdue } from "@/lib/utils/time";
import type { IntegrationAdapter, IntegrationSyncResult, SyncContext } from "@/lib/integrations/interfaces";

function pickArea(projectName?: string) {
  const label = (projectName || "").toLowerCase();
  if (label.includes("htg") || label.includes("how-to geek")) {
    return "HTG" as const;
  }
  if (label.includes("laser")) {
    return "TLW" as const;
  }
  if (label.includes("created")) {
    return "CREATED_WORKSHOP" as const;
  }
  return "ADMIN" as const;
}

export class AsanaAdapter implements IntegrationAdapter {
  provider = "asana" as const;
  capabilities = ["tasks"];

  async testConnection(context: SyncContext) {
    const result = await this.sync(context);
    return {
      ok: true,
      message: `Read ${result.tasks.length} Asana tasks`,
      preview: result.tasks.slice(0, 5),
    };
  }

  async sync(context: SyncContext): Promise<IntegrationSyncResult> {
    if (!context.secret) {
      throw new Error("Asana API token is missing");
    }

    const workspaceId =
      context.config && typeof (context.config as Record<string, unknown>).workspaceId === "string"
        ? ((context.config as Record<string, unknown>).workspaceId as string)
        : undefined;
    const response = await fetch("https://app.asana.com/api/1.0/tasks?assignee=me&opt_fields=name,due_on,completed,projects.name", {
      headers: {
        Authorization: `Bearer ${context.secret}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Asana request failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{ gid: string; name: string; due_on?: string; completed?: boolean; projects?: Array<{ name: string }> }>;
    };

    const tasks = (payload.data ?? []).map((task) => {
      const dueAt = task.due_on ? `${task.due_on}T17:00:00.000Z` : undefined;
      const projectName = task.projects?.[0]?.name;

      return {
        id: `asana-${task.gid}`,
        sourceId: task.gid,
        source: "asana" as const,
        sourceUrl: `https://app.asana.com/0/${task.gid}`,
        area: pickArea(projectName),
        title: task.name,
        status: task.completed ? ("done" as const) : ("open" as const),
        dueDate: dueAt,
        isOverdue: isOverdue(dueAt, context.now),
        isBlocked: false,
        projectName,
        projectId: workspaceId,
      };
    });

    return {
      tasks,
      calendarEvents: [],
      articleEntries: [],
      warnings: [],
      rawPreview: { count: tasks.length },
    };
  }
}
