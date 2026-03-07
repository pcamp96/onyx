import { describe, expect, it } from "vitest";

import { stripUndefinedDeep } from "@/lib/firebase/repositories/base";

describe("stripUndefinedDeep", () => {
  it("removes undefined fields recursively", () => {
    expect(
      stripUndefinedDeep({
        enabled: true,
        optional: undefined,
        values: {
          weekStartDate: undefined,
          layout: "table",
          columnMapping: {
            title: "Headline",
            source_url: undefined,
          },
        },
      }),
    ).toEqual({
      enabled: true,
      values: {
        layout: "table",
        columnMapping: {
          title: "Headline",
        },
      },
    });
  });
});
