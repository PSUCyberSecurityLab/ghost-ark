import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  GENERATED_PATHS,
  REPLAY_COMMANDS,
  assertCleanTrackedWorktree,
  assertRecordedEvidenceRevision,
  generatedOutputs,
  loadManifest,
} from "../../../tools/paper-evidence.mjs";

/**
 * The paper is a release-bound artifact, not a collection of independently
 * edited figures. This guard makes the manifest its one source of truth and
 * holds the generator, reviewer image, and checked-in TLC evidence together.
 * `paper-evidence.mjs --check` adds the release-only requirement that all of
 * these outputs are tracked and no tracked source is dirty before replay.
 */

const REPO_ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO_ROOT, path), "utf8");
const sha256 = (path: string) => createHash("sha256").update(readFileSync(resolve(REPO_ROOT, path))).digest("hex");

describe("paper evidence snapshot", () => {
  const manifest = loadManifest();

  it("records a reachable evidence revision without making the manifest commit self-referential", () => {
    const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();
    expect(head).toMatch(/^[0-9a-f]{40}$/u);
    expect(() => assertRecordedEvidenceRevision(manifest)).not.toThrow();
    expect(manifest.snapshot.tag).toBeNull();
    expect(manifest.snapshot.tag_status).toBe("unreleased");
  });

  it("rejects a dirty tracked worktree before a release-style replay", () => {
    const root = mkdtempSync(join(REPO_ROOT, ".paper-evidence-test-"));
    try {
      writeFileSync(join(root, "tracked.md"), "clean\n", "utf8");
      execFileSync("git", ["init", "-q"], { cwd: root });
      execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd: root });
      execFileSync("git", ["config", "user.name", "Paper Evidence Test"], { cwd: root });
      execFileSync("git", ["add", "tracked.md"], { cwd: root });
      execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });

      expect(() => assertCleanTrackedWorktree(root)).not.toThrow();
      writeFileSync(join(root, "tracked.md"), "dirty\n", "utf8");
      expect(() => assertCleanTrackedWorktree(root)).toThrow(/clean tracked worktree/u);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps every generated macro and reviewer block byte-for-byte in sync", () => {
    const expected = generatedOutputs(manifest);
    expect(expected.get(GENERATED_PATHS.macros)).toBeDefined();

    for (const [path, rendered] of expected) {
      expect(read(path), `${path} is stale; run node tools/paper-evidence.mjs --render`).toBe(rendered);
    }
  });

  it("pins the raw committed TLC logs by digest and keeps generated summaries out of the claim", () => {
    expect(manifest.paths.generated_proof_summary).toMatch(/^artifacts\//u);
    for (const log of manifest.paths.committed_proof_logs) {
      expect(sha256(log.path), `proof log drifted: ${log.path}`).toBe(log.sha256);
    }
  });

  it("uses only the declared E2/E3/E4, TLC, test, and tracked-source scan commands", () => {
    expect(manifest.reproduction.target).toBe("make paper-evidence");
    for (const [name, command] of Object.entries(REPLAY_COMMANDS)) {
      expect(manifest.reproduction.commands[name as keyof typeof REPLAY_COMMANDS]).toBe(command.display);
    }

    const makefile = read("Makefile");
    const targetStart = makefile.indexOf("paper-evidence:");
    const targetEnd = makefile.indexOf("\n\n", targetStart);
    const target = targetStart === -1 ? "" : makefile.slice(targetStart, targetEnd === -1 ? undefined : targetEnd);
    expect(target).toContain("node tools/paper-evidence.mjs --run");

    const source = read("tools/paper-evidence.mjs");
    const replayRunner = source.slice(source.indexOf("function runEvidence"), source.indexOf("function usage"));
    expect(replayRunner).not.toMatch(/dab\/bench|run-attacks\.sh|run-benchmarks\.sh/u);
  });

  it("makes the release preflight visible to reviewers", () => {
    const outputs = generatedOutputs(manifest);
    for (const path of [GENERATED_PATHS.paperReadme, GENERATED_PATHS.reviewerMap]) {
      const rendered = outputs.get(path) ?? "";
      expect(rendered).toContain("**Release preflight:**");
      expect(rendered).toContain("fail before experiment replay");
      expect(rendered).toContain("tracked source is dirty");
      expect(rendered).toContain("Untracked scratch files do not block");
    }
  });

  it("aligns the reviewer image's exact Node, Rust, and TLC acquisition with the manifest", () => {
    const dockerfile = read("Dockerfile.reviewer");
    const nodeVersion = manifest.toolchains.node.version.replace(/^v/u, "");

    expect(dockerfile).toContain(`NODE_VERSION=${nodeVersion}`);
    expect(dockerfile).toContain(`NODE_LINUX_X64_SHA256=${manifest.toolchains.node.linux_archives.x64.sha256}`);
    expect(dockerfile).toContain(`NODE_LINUX_ARM64_SHA256=${manifest.toolchains.node.linux_archives.arm64.sha256}`);
    expect(dockerfile).toContain(`RUST_VERSION=${manifest.toolchains.rust.version}`);
    expect(dockerfile).toContain(`TLA_TOOLS_VERSION=${manifest.toolchains.tla.version}`);
    expect(dockerfile).toContain(`TLA_TOOLS_SHA256=${manifest.toolchains.tla.sha256}`);
    expect(dockerfile).toMatch(/nodejs\.org\/dist\/v\$\{NODE_VERSION\}/u);
    expect(dockerfile).toMatch(/sha256sum -c/u);
    expect(dockerfile).not.toContain("setup_22.x");
    expect(dockerfile).toContain('CMD ["make", "paper-evidence"]');

    const compose = read("docker-compose.reviewer.yml");
    expect(compose).toContain('command: ["make", "paper-evidence"]');
  });
});
