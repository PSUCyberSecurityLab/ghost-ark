import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { check, loadManifest, renderMacros } from "../../../tools/paper-next-evidence.mjs";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("paper-next evidence binding", () => {
  it("binds the new paper to the frozen release/evidence tags and source anchors", () => {
    expect(() => check()).not.toThrow();
  });

  it("keeps the generated numerical macro surface derived from the manifest", () => {
    const manifest = loadManifest();
    expect(read("docs/paper-next/evidence-macros.tex")).toBe(renderMacros(manifest));
  });

  it("records the raw-artifact boundary instead of treating ignored reports as a release bundle", () => {
    const manifest = loadManifest();
    expect(manifest.raw_evidence_boundary.status).toBe("limited");
    expect(manifest.raw_evidence_boundary.statement).toMatch(/ignored local artifacts/u);
  });

  it("keeps E12's ecological null and E16's supplied-policy scope in the paper", () => {
    const tex = read("docs/paper-next/main.tex");
    expect(tex).toContain("0/\\pnETwelveEligible");
    expect(tex).toMatch(/author-supplied/u);
    expect(tex).toMatch(/not a prevalence/u);
  });
});
