import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Keeps public DAB documentation from promoting a tested helper or specified
 * protocol to a runtime claim. The underlying behavior belongs to Rust tests
 * and the socket E2E; this test guards the prose boundary those results support.
 */
const REPO_ROOT = resolve(__dirname, "../../..");

function read(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

const STATUS = "docs/architecture/DAB_RUNTIME_STATUS.md";
const CURRENT_SURFACES = [
  "README.md",
  "docs/defense/DEFENSE_ANCHOR.md",
  "docs/research/STM_ISOLATION_MAPPING.md",
  "docs/research/COMMITTEE_REBUTTAL.md",
  "docs/research/PRIOR_ART_AND_NOVELTY.md",
  "docs/research/NITRO_ENCLAVE_ISOLATION_ARCHITECTURE.md",
  "docs/research/TEMPORAL_ONTOLOGY_DRAFT.md"
] as const;

describe("public DAB runtime-status documentation", () => {
  it("names the certified-only receipt boundary and unwired gates", () => {
    const status = read(STATUS);

    expect(status).toContain("CERTIFIED");
    expect(status).toContain("accepts only a receipt whose status is `CERTIFIED`");
    expect(status).toContain("unit-tested helper; specified runtime integration");
    expect(status).toContain("not implemented in V1");
    expect(status).toContain("DAB-TIER0");
    expect(status).toContain("DAB-TIER0-V1");
  });

  it("makes every current public explanation defer to the runtime-status source", () => {
    for (const surface of CURRENT_SURFACES) {
      expect(read(surface), `${surface} must link to the DAB status source`).toContain(
        "DAB_RUNTIME_STATUS.md"
      );
    }
  });

  it("does not restore the specific runtime overclaims found in audit", () => {
    expect(read("README.md")).not.toContain("three-gate validation before any commit");
    expect(read("docs/defense/DEFENSE_ANCHOR.md")).not.toContain(
      "every\n> decision — commit or abort — leaves a signed"
    );
    expect(read("docs/research/STM_ISOLATION_MAPPING.md")).not.toContain(
      "The framework implements Optimistic Concurrency Control"
    );
    expect(read("docs/research/PRIOR_ART_AND_NOVELTY.md")).not.toContain(
      "ledger + semantic gates enforced"
    );
  });
});
