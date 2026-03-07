import { isOverdue } from "@/lib/utils/time";
import type { IntegrationAdapter, IntegrationSyncResult, SyncContext } from "@/lib/integrations/interfaces";

function pickArea(projectName?: string) {
  const label = (projectName || "").toLowerCase();
  if (label.includes("htg")) {
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

export class TodoistAdapter implements IntegrationAdapter {
  provider = "todoist" as const;
  capabilities = ["tasks"];

  async testConnection(context: SyncContext) {
    const result = await this.sync(context);
    return {
      ok: true,
      message: `Read ${result.tasks.length} Todoist tasks`,
      preview: result.tasks.slice(0, 5),
    };
  }

  async sync(context: SyncContext): Promise<IntegrationSyncResult> {
    if (!context.secret) {
      throw new Error("Todoist API token is missing");
    }

    const response = await fetch("https://api.todoist.com/rest/v2/tasks", {
      headers: {
        Authorization: `Bearer ${context.secret}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Todoist request failed with ${response.status}`);
    }

    const tasksPayload = (await response.json()) as Array<{
      id: string;
      content: string;
      due?: { date?: string; datetime?: string };
      project_id?: string;
      description?: string;
      labels?: string[];
      priority?: number;
    }>;

    const tasks = tasksPayload.map((task) => {
      const dueAt = task.due?.datetime ?? (task.due?.date ? `${task.due.date}T17:00:00.000Z` : undefined);
      const area = pickArea(task.labels?.[0] ?? task.description);

      return {
        id: `todoist-${task.id}`,
        sourceId: task.id,
        provider: "todoist" as const,
        area,
        title: task.content,
        notes: task.description,
        status: "open" as const,
        dueAt,
        isOverdue: isOverdue(dueAt, context.now),
        projectId: task.project_id,
        labels: task.labels,
        priority: task.priority,
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
