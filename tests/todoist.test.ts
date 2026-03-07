import { afterEach, describe, expect, it, vi } from "vitest";

import { IntegrationRequestError } from "@/lib/integrations/errors";
import { TodoistAdapter } from "@/lib/integrations/todoist/adapter";

describe("TodoistAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes the configured projectId through to the Todoist tasks request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [{ id: "proj-1", name: "Ops" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              {
                id: "123",
                content: "Ship integration audit",
                project_id: "proj-1",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const adapter = new TodoistAdapter();
    const result = await adapter.sync({
      userId: "user-1",
      secret: "todoist-token",
      config: { projectId: "proj-1" },
      now: new Date("2026-03-06T12:00:00.000Z"),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.todoist.com/api/v1/projects",
      expect.objectContaining({
        headers: { Authorization: "Bearer todoist-token" },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.todoist.com/api/v1/tasks?project_id=proj-1",
      expect.objectContaining({
        headers: { Authorization: "Bearer todoist-token" },
      }),
    );
    expect(result.tasks[0]?.projectId).toBe("proj-1");
    expect(result.tasks[0]?.sourceUrl).toBe("https://app.todoist.com/app/task/123");
  });

  it("surfaces Todoist API errors as request errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const adapter = new TodoistAdapter();

    await expect(
      adapter.sync({
        userId: "user-1",
        secret: "bad-token",
        config: null,
        now: new Date("2026-03-06T12:00:00.000Z"),
      }),
    ).rejects.toEqual(expect.objectContaining<Partial<IntegrationRequestError>>({
      message: "Invalid token",
      status: 401,
    }));
  });

  it("ignores legacy workspaceId hints that are not valid Todoist project ids", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: "proj-1", name: "Inbox" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const adapter = new TodoistAdapter();
    await adapter.sync({
      userId: "user-1",
      secret: " token-with-space \n",
      config: { workspaceId: "personal tasks" },
      now: new Date("2026-03-06T12:00:00.000Z"),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.todoist.com/api/v1/projects",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-with-space" },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.todoist.com/api/v1/tasks",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-with-space" },
      }),
    );
  });
});
