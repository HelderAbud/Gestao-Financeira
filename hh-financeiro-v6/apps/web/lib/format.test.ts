import { describe, expect, it } from "vitest";
import { formatBrl } from "./format";

describe("formatBrl", () => {
  it("returns em dash for undefined or null", () => {
    expect(formatBrl(undefined)).toBe("—");
    expect(formatBrl(null)).toBe("—");
  });

  it("formats BRL with pt-BR locale", () => {
    expect(formatBrl(1234.56)).toMatch(/1\.234,56/);
  });
});
