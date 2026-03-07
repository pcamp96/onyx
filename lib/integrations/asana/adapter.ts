import { isOverdue } from "@/lib/utils/time";
import { IntegrationRequestError } from "@/lib/integrations/errors";
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
      throw new IntegrationRequestError("Asana API token is missing");
    }

    const configuredWorkspaceId =
      context.config && typeof (context.config as Record<string, unknown>).workspaceId === "string"
        ? ((context.config as Record<string, unknown>).workspaceId as string).trim()
        : undefined;
    const me = await this.fetchAsana<{
      data?: {
        gid: string;
        workspaces?: Array<{ gid: string; name: string }>;
      };
    }>("https://app.asana.com/api/1.0/users/me?opt_fields=workspaces.gid,workspaces.name", context.secret);
    const workspaces = me.data?.workspaces ?? [];
    const workspaceId = configuredWorkspaceId || workspaces[0]?.gid;

    if (!workspaceId) {
      throw new IntegrationRequestError("Asana workspace ID is missing. Save a workspace ID or use a token with at least one accessible workspace.");
    }

    const params = new URLSearchParams({
      assignee: "me",
      workspace: workspaceId,
      opt_fields: "name,due_on,completed,projects.name",
    });
    const payload = await this.fetchAsana<{
      data?: Array<{ gid: string; name: string; due_on?: string; completed?: boolean; projects?: Array<{ name: string }> }>;
    }>(`https://app.asana.com/api/1.0/tasks?${params.toString()}`, context.secret);

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
      warnings: configuredWorkspaceId ? [] : ["Using the first accessible Asana workspace because no workspace ID is configured."],
      rawPreview: { count: tasks.length, workspaceId },
    };
  }

  private async fetchAsana<T>(url: string, secret: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await this.readAsanaError(response);
      throw new IntegrationRequestError(message, response.status);
    }

    return (await response.json()) as T;
  }

  private async readAsanaError(response: Response) {
    try {
      const payload = (await response.json()) as {
        errors?: Array<{ message?: string }>;
      };
      const message = payload.errors?.map((error) => error.message).filter(Boolean).join("; ");
      return message || `Asana request failed with ${response.status}`;
    } catch {
      return `Asana request failed with ${response.status}`;
    }
  }
}
