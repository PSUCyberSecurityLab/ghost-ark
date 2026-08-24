import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "../../..");
const workflow = readFileSync(resolve(REPO_ROOT, ".github/workflows/artifact.yml"), "utf8");

describe("paper evidence workflow", () => {
  it("makes the paper-evidence target a distinct CI gate", () => {
    const start = workflow.indexOf("  paper-evidence:");
    const end = workflow.indexOf("\n  legacy-aec-orchestration:", start);
    const job = start === -1 ? "" : workflow.slice(start, end === -1 ? undefined : end);

    expect(job).toContain("run: make paper-evidence");
    expect(job).not.toContain("make reproduce");
    expect(job).not.toContain("run-attacks.sh");
    expect(job).not.toContain("run-benchmarks.sh");
  });
});
