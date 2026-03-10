import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AsanaAdapter } from "@/lib/integrations/asana/adapter";

describe("asana adapter", () => {
  const adapter = new AsanaAdapter();

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps only incomplete tasks with due dates and approved HTG status", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: {
          gid: "me",
          workspaces: [{ gid: "workspace-1", name: "Main" }],
        },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [
          {
            gid: "1",
            name: "Approved HTG task",
            due_on: "2026-03-10",
            completed: false,
            projects: [{ name: "HTG PC HARDWARE" }],
            custom_fields: [{ name: "HTG Status", display_value: "Approved" }],
          },
          {
            gid: "2",
            name: "Submitted HTG task",
            due_on: "2026-03-10",
            completed: false,
            projects: [{ name: "HTG PC HARDWARE" }],
            custom_fields: [{ name: "HTG Status", display_value: "Submitted" }],
          },
          {
            gid: "3",
            name: "Undated HTG task",
            completed: false,
            projects: [{ name: "HTG PC HARDWARE" }],
            custom_fields: [{ name: "HTG Status", display_value: "Approved" }],
          },
          {
            gid: "4",
            name: "Completed HTG task",
            due_on: "2026-03-10",
            completed: true,
            projects: [{ name: "HTG PC HARDWARE" }],
            custom_fields: [{ name: "HTG Status", display_value: "Approved" }],
          },
          {
            gid: "5",
            name: "TLW task with due date",
            due_on: "2026-03-11",
            completed: false,
            projects: [{ name: "The Laser Workshop" }],
            custom_fields: [],
          },
        ],
      }), { status: 200 }));

    const result = await adapter.sync({
      userId: "user-1",
      config: { workspaceId: "workspace-1" },
      secret: "secret",
      now: new Date("2026-03-08T00:00:00.000Z"),
    });

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks.map((task) => task.title)).toEqual([
      "Approved HTG task",
      "TLW task with due date",
    ]);
    expect(result.tasks[0]?.dueDate).toBe("2026-03-10");
  });
});
