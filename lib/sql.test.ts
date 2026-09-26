import { describe, expect, it } from "vitest";
import { setClause } from "./sql";

describe("setClause", () => {
  it("numbers placeholders in key order and returns matching values", () => {
    const set = setClause({ title: "New", order: 3 });
    expect(set).toEqual({ clause: `"title" = $1, "order" = $2`, values: ["New", 3] });
  });

  it("skips undefined entries but keeps nulls, which are meaningful writes", () => {
    const set = setClause({ title: "New", description: undefined, dueDate: null });
    expect(set).toEqual({ clause: `"title" = $1, "dueDate" = $2`, values: ["New", null] });
  });

  it("returns null when there is nothing to set", () => {
    expect(setClause({})).toBeNull();
    expect(setClause({ title: undefined })).toBeNull();
  });

  it("honours a start index so callers can reserve earlier placeholders", () => {
    const set = setClause({ title: "New" }, undefined, 5);
    expect(set).toEqual({ clause: `"title" = $5`, values: ["New"] });
  });

  it("strips anything but word characters from column identifiers", () => {
    const set = setClause({ 'title" = evil, "x': "v" });
    expect(set?.clause).toBe(`"titleevilx" = $1`);
  });

  // Postgres refuses `text` -> enum in an UPDATE ... SET (error 42804), and
  // Prisma binds every JS string as text. Without an explicit cast, saving a
  // task's priority or recurrence fails outright.
  describe("enum casts", () => {
    it("appends a cast to the placeholder for a declared column", () => {
      const set = setClause({ title: "New", priority: "HIGH" }, { priority: "Priority" });
      expect(set).toEqual({
        clause: `"title" = $1, "priority" = $2::"Priority"`,
        values: ["New", "HIGH"],
      });
    });

    it("casts every declared column present, leaving the rest bare", () => {
      const set = setClause(
        { priority: "LOW", recurrence: "WEEKLY", order: 1 },
        { priority: "Priority", recurrence: "Recurrence" },
      );
      expect(set?.clause).toBe(
        `"priority" = $1::"Priority", "recurrence" = $2::"Recurrence", "order" = $3`,
      );
    });

    it("still casts when the value is null, so NULL lands typed", () => {
      const set = setClause({ recurrence: null }, { recurrence: "Recurrence" });
      expect(set).toEqual({ clause: `"recurrence" = $1::"Recurrence"`, values: [null] });
    });

    it("ignores casts for columns absent from the data", () => {
      const set = setClause({ title: "New" }, { priority: "Priority" });
      expect(set).toEqual({ clause: `"title" = $1`, values: ["New"] });
    });

    it("strips anything but word characters from the cast type name", () => {
      const set = setClause({ priority: "HIGH" }, { priority: 'Priority" ; DROP TABLE "Task' });
      expect(set?.clause).toBe(`"priority" = $1::"PriorityDROPTABLETask"`);
    });
  });
  // Every DateTime column is `timestamp without time zone` holding UTC. A bound
  // JS Date arrives as timestamptz, and assigning that to a plain timestamp
  // converts it into the session's zone — so on a database not set to UTC,
  // every raw date write landed hours off.
  describe("dates", () => {
    it("pins a Date value to UTC wall-clock time", () => {
      const d = new Date("2026-10-01T12:00:00Z");
      const set = setClause({ title: "x", dueDate: d });
      expect(set).toEqual({
        clause: `"title" = $1, "dueDate" = ($2::timestamptz AT TIME ZONE 'UTC')`,
        values: ["x", d],
      });
    });

    it("leaves a null date bare, since NULL has no zone to fix", () => {
      const set = setClause({ dueDate: null });
      expect(set).toEqual({ clause: `"dueDate" = $1`, values: [null] });
    });
  });
});
