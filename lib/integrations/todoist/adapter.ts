import { isOverdue } from "@/lib/utils/time";
import { IntegrationRequestError } from "@/lib/integrations/errors";
import type { IntegrationAdapter, IntegrationSyncResult, SyncContext } from "@/lib/integrations/interfaces";

type TodoistPaginatedResponse<T> = {
  results?: T[];
  next_cursor?: string | null;
};

type TodoistTask = {
  id: string;
  content: string;
  due?: { date?: string; datetime?: string };
  project_id?: string;
  description?: string;
  labels?: string[];
  priority?: number;
  checked?: boolean;
  is_deleted?: boolean;
};

function normalizeToken(secret?: string | null) {
  return secret?.trim() ?? "";
}

function getConfiguredProjectId(config?: Record<string, unknown> | null) {
  const projectId =
    config && typeof config.projectId === "string"
      ? config.projectId.trim()
      : "";
  if (projectId) {
    return projectId;
  }

  // Legacy config used workspaceId as a freeform hint. Only treat it as a Todoist project ID if it looks valid.
  const legacyProjectId =
    config && typeof config.workspaceId === "string"
      ? config.workspaceId.trim()
      : "";
  return /^\d+$/.test(legacyProjectId) ? legacyProjectId : "";
}

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
    const token = normalizeToken(context.secret);
    if (!token) {
      throw new IntegrationRequestError("Todoist API token is missing");
    }

    const configuredProjectId = getConfiguredProjectId(context.config as Record<string, unknown> | null | undefined);
    await this.fetchTodoist("https://api.todoist.com/api/v1/projects", token);

    const params = new URLSearchParams();
    if (configuredProjectId) {
      params.set("project_id", configuredProjectId);
    }

    const tasksPayload = await this.fetchAllTasks(
      `https://api.todoist.com/api/v1/tasks${params.size ? `?${params.toString()}` : ""}`,
      token,
    );

    const tasks = tasksPayload.map((task) => {
      const dueAt = task.due?.datetime ?? task.due?.date;
      const area = pickArea(task.labels?.[0] ?? task.description);

      return {
        id: `todoist-${task.id}`,
        sourceId: task.id,
        source: "todoist" as const,
        sourceUrl: `https://app.todoist.com/app/task/${task.id}`,
        area,
        title: task.content,
        notes: task.description,
        status: task.checked ? ("done" as const) : ("open" as const),
        dueDate: dueAt,
        isOverdue: isOverdue(dueAt, context.now, context.timezone),
        isBlocked: Boolean(task.is_deleted),
        projectId: task.project_id,
        tags: task.labels,
        priority: task.priority,
      };
    });

    return {
      tasks,
      calendarEvents: [],
      articleEntries: [],
      warnings: [],
      rawPreview: { count: tasks.length, projectId: configuredProjectId || undefined },
    };
  }

  private async fetchTodoist(url: string, token: string) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new IntegrationRequestError(await this.readTodoistError(response), response.status);
    }

    return response;
  }

  private async fetchAllTasks(url: string, token: string) {
    const tasks: TodoistTask[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const response = await this.fetchTodoist(nextUrl, token);
      const payload = (await response.json()) as TodoistPaginatedResponse<TodoistTask>;
      tasks.push(...(payload.results ?? []));
      nextUrl = payload.next_cursor ? this.withCursor(url, payload.next_cursor) : null;
    }

    return tasks;
  }

  private withCursor(url: string, cursor: string) {
    const next = new URL(url);
    next.searchParams.set("cursor", cursor);
    return next.toString();
  }

  private async readTodoistError(response: Response) {
    try {
      const payload = (await response.json()) as { error?: string };
      return payload.error || `Todoist request failed with ${response.status}`;
    } catch {
      return `Todoist request failed with ${response.status}`;
    }
  }
}
