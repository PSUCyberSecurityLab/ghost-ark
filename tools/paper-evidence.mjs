#!/usr/bin/env node
/**
 * Paper-evidence snapshot renderer and fail-closed replay gate.
 *
 * The manifest is intentionally checked in beside the manuscript. It records a
 * named source revision and the committed proof-log digests, while generated
 * prose and LaTeX macros are derived from that one manifest. `--run` replays
 * E2/E3/E4, TLC, npm test, and the tracked-source claim scan; it never invokes
 * the quarantined dab/bench harnesses.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_RELATIVE = "docs/paper/evidence-snapshot.v1.json";
const MANIFEST_PATH = resolve(ROOT, MANIFEST_RELATIVE);
const GENERATED_START = "<!-- BEGIN GENERATED PAPER-EVIDENCE SNAPSHOT -->";
const GENERATED_END = "<!-- END GENERATED PAPER-EVIDENCE SNAPSHOT -->";

const GENERATED_PATHS = {
  macros: "docs/paper/evidence-macros.tex",
  paperReadme: "docs/paper/README.md",
  reviewerMap: "README-AE.md",
};

// Kept as argv arrays rather than shell strings: the manifest describes the
// reviewer-facing spelling, and this gate executes the same bounded commands
// without allowing a snapshot edit to inject a shell fragment.
const REPLAY_COMMANDS = Object.freeze({
  e2: { display: "npm run experiment:e2 -- --json", executable: "npm", args: ["run", "experiment:e2", "--", "--json"] },
  e3: { display: "npm run experiment:e3 -- --json", executable: "npm", args: ["run", "experiment:e3", "--", "--json"] },
  e4: { display: "npm run experiment:e4 -- --json", executable: "npm", args: ["run", "experiment:e4", "--", "--json"] },
  proofs: { display: "bash scripts/run-proofs.sh", executable: "bash", args: ["scripts/run-proofs.sh"] },
  tests: { display: "npm test", executable: "npm", args: ["test"] },
  claim_scan: { display: "node tools/research/check-forbidden-claims.mjs --tracked", executable: process.execPath, args: ["tools/research/check-forbidden-claims.mjs", "--tracked"] },
});

function fail(message) {
  throw new Error(`paper-evidence: ${message}`);
}

function text(path) {
  return readFileSync(path, "utf8");
}

function json(path) {
  return JSON.parse(text(path));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function gitOutput(args, root = ROOT) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}

function requireString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${name} must be a non-empty string.`);
  }
  return value;
}

function requireInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    fail(`${name} must be a non-negative integer.`);
  }
  return value;
}

function validateManifest(manifest) {
  if (manifest?.schema_version !== "ghost-ark.paper-evidence-snapshot.v1") {
    fail(`unsupported schema_version ${String(manifest?.schema_version)}.`);
  }
  const sourceRevision = requireString(manifest.snapshot?.recorded_source_revision, "snapshot.recorded_source_revision");
  if (!/^[0-9a-f]{40}$/u.test(sourceRevision)) {
    fail("snapshot.recorded_source_revision must be a full lowercase Git revision.");
  }
  requireString(manifest.snapshot?.non_claim, "snapshot.non_claim");
  if (manifest.snapshot.tag !== null && (typeof manifest.snapshot.tag !== "string" || manifest.snapshot.tag.length === 0)) {
    fail("snapshot.tag must be null for an unreleased snapshot or a non-empty tag name.");
  }
  if (manifest.snapshot.tag === null && manifest.snapshot.tag_status !== "unreleased") {
    fail("an untagged snapshot must declare tag_status: unreleased.");
  }
  if (manifest.snapshot.tag !== null && manifest.snapshot.tag_status !== "tagged") {
    fail("a tagged snapshot must declare tag_status: tagged.");
  }
  requireString(manifest.toolchains?.node?.version, "toolchains.node.version");
  requireString(manifest.toolchains?.node?.npm_version, "toolchains.node.npm_version");
  for (const architecture of ["x64", "arm64"]) {
    const archive = manifest.toolchains.node.linux_archives?.[architecture];
    requireString(archive?.filename, `toolchains.node.linux_archives.${architecture}.filename`);
    if (!/^[0-9a-f]{64}$/u.test(requireString(archive?.sha256, `toolchains.node.linux_archives.${architecture}.sha256`))) {
      fail(`toolchains.node.linux_archives.${architecture}.sha256 must be lowercase SHA-256 hex.`);
    }
  }
  requireString(manifest.toolchains?.rust?.version, "toolchains.rust.version");
  requireString(manifest.toolchains?.tla?.version, "toolchains.tla.version");
  const tlaDigest = requireString(manifest.toolchains?.tla?.sha256, "toolchains.tla.sha256");
  if (!/^[0-9a-f]{64}$/u.test(tlaDigest)) {
    fail("toolchains.tla.sha256 must be lowercase SHA-256 hex.");
  }
  if (manifest.reproduction?.target !== "make paper-evidence") {
    fail("reproduction.target must be make paper-evidence.");
  }
  for (const [name, expected] of Object.entries(REPLAY_COMMANDS)) {
    if (manifest.reproduction.commands?.[name] !== expected.display) {
      fail(`reproduction.commands.${name} must be exactly ${expected.display}.`);
    }
  }
  if (!Array.isArray(manifest.reproduction?.quarantined_not_run) || manifest.reproduction.quarantined_not_run.length === 0) {
    fail("reproduction.quarantined_not_run must name the excluded DAB bench commands.");
  }
  if (!Array.isArray(manifest.paths?.committed_proof_logs) || manifest.paths.committed_proof_logs.length !== 11) {
    fail("paths.committed_proof_logs must contain all 11 committed TLC logs.");
  }
  for (const log of manifest.paths.committed_proof_logs) {
    requireString(log?.path, "committed proof-log path");
    if (!/^[0-9a-f]{64}$/u.test(requireString(log?.sha256, `proof-log SHA for ${log?.path ?? "unknown"}`))) {
      fail(`proof-log SHA must be lowercase SHA-256 hex for ${log.path}.`);
    }
  }
  if (!Array.isArray(manifest.e2?.operations) || manifest.e2.operations.length !== 6) {
    fail("e2.operations must describe the six recorded arms.");
  }
  requireInteger(manifest.e3?.verifier_intrinsic?.successes, "e3.verifier_intrinsic.successes");
  requireInteger(manifest.e3?.verifier_intrinsic?.total, "e3.verifier_intrinsic.total");
  requireInteger(manifest.e3?.aggregate?.successes, "e3.aggregate.successes");
  requireInteger(manifest.e3?.aggregate?.total, "e3.aggregate.total");
  requireInteger(manifest.e4?.load_bearing_checks, "e4.load_bearing_checks");
  if (!Array.isArray(manifest.proofs?.results) || manifest.proofs.results.length !== 11) {
    fail("proofs.results must describe six baselines and five mutants.");
  }
  if (manifest.proofs.baseline_count !== 6 || manifest.proofs.mutant_count !== 5) {
    fail("proof snapshot must state six baselines and five mutants.");
  }
  requireInteger(manifest.tests?.minimum_tests, "tests.minimum_tests");
  requireInteger(manifest.tests?.minimum_test_files, "tests.minimum_test_files");
  requireInteger(manifest.claim_scan?.recorded_tracked_scannable_files, "claim_scan.recorded_tracked_scannable_files");
  if (manifest.paths?.macro_include !== GENERATED_PATHS.macros ||
      manifest.paths?.paper_readme !== GENERATED_PATHS.paperReadme ||
      manifest.paths?.reviewer_map !== GENERATED_PATHS.reviewerMap) {
    fail("manifest generated-output paths must match the renderer's tracked paths.");
  }
  return manifest;
}

function loadManifest() {
  return validateManifest(json(MANIFEST_PATH));
}

function formatInteger(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/gu, "{,}");
}

function formatMarkdownInteger(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
}

function operationByName(manifest, name) {
  const operation = manifest.e2.operations.find((entry) => entry.operation === name);
  if (!operation) {
    fail(`e2 snapshot does not include ${name}.`);
  }
  return operation;
}

function renderMacros(manifest) {
  const e2 = (name) => operationByName(manifest, name);
  return `${[
    "% This file is generated by tools/paper-evidence.mjs from evidence-snapshot.v1.json.",
    "% Do not edit it by hand; run: node tools/paper-evidence.mjs --render",
    `% Recorded source revision: ${manifest.snapshot.recorded_source_revision}`,
    `% Recorded snapshot date: ${manifest.snapshot.recorded_at}`,
    "% E2 local verification cost, recorded on one named host; p50 and IQR are microseconds.",
    `\\newcommand{\\evtwoiters}{${formatInteger(manifest.e2.measured_iterations)}}`,
    `\\newcommand{\\evtwohost}{${manifest.e2.host}}`,
    `\\newcommand{\\evtwobasepfifty}{${e2("json-parse-only").p50_us}}`,
    `\\newcommand{\\evtwobaseiqr}{${e2("json-parse-only").iqr_us}}`,
    `\\newcommand{\\evtwocanonpfifty}{${e2("canonicalize-only").p50_us}}`,
    `\\newcommand{\\evtwocanoniqr}{${e2("canonicalize-only").iqr_us}}`,
    `\\newcommand{\\evtwocanonratio}{${e2("canonicalize-only").ratio_to_baseline}}`,
    `\\newcommand{\\evtwodigestpfifty}{${e2("canonicalize-and-digest").p50_us}}`,
    `\\newcommand{\\evtwodigestiqr}{${e2("canonicalize-and-digest").iqr_us}}`,
    `\\newcommand{\\evtwodigestratio}{${e2("canonicalize-and-digest").ratio_to_baseline}}`,
    `\\newcommand{\\evtwohmaconlypfifty}{${e2("hmac-verify").p50_us}}`,
    `\\newcommand{\\evtwohmaconlyiqr}{${e2("hmac-verify").iqr_us}}`,
    `\\newcommand{\\evtwohmaconlyratio}{${e2("hmac-verify").ratio_to_baseline}}`,
    `\\newcommand{\\evtwohmacpfifty}{${e2("verifier-full-hmac").p50_us}}`,
    `\\newcommand{\\evtwohmaciqr}{${e2("verifier-full-hmac").iqr_us}}`,
    `\\newcommand{\\evtwohmacratio}{${e2("verifier-full-hmac").ratio_to_baseline}}`,
    `\\newcommand{\\evtworsapfifty}{${e2("verifier-full-rsa-pss").p50_us}}`,
    `\\newcommand{\\evtworsaiqr}{${e2("verifier-full-rsa-pss").iqr_us}}`,
    `\\newcommand{\\evtworsaratio}{${e2("verifier-full-rsa-pss").ratio_to_baseline}}`,
    "% E3/E4 corpus census: exact within this hand-authored corpus, not a population estimate.",
    `\\newcommand{\\evthreeintrinsic}{${manifest.e3.verifier_intrinsic.successes}/${manifest.e3.verifier_intrinsic.total}}`,
    `\\newcommand{\\evthreeaggregate}{${manifest.e3.aggregate.successes}/${manifest.e3.aggregate.total}}`,
    `\\newcommand{\\evthreecontrol}{${manifest.e3.control_arm.successes}/${manifest.e3.control_arm.total}}`,
    `\\newcommand{\\evthreeundetected}{${manifest.e3.undetected}}`,
    `\\newcommand{\\evthreeboundary}{${manifest.e3.documented_boundaries}}`,
    `\\newcommand{\\evfourloadbearing}{${manifest.e4.load_bearing_checks}}`,
    "% Recorded local Rust stress run; not a cross-machine throughput claim.",
    `\\newcommand{\\stressops}{${formatInteger(manifest.rust_stress.admissions_and_signatures_per_second)}}`,
    `\\newcommand{\\stressrejm}{${manifest.rust_stress.fail_closed_rejections_millions_per_second}}`,
    `% TLC ${manifest.toolchains.tla.version}; generated run output is ${manifest.paths.generated_proof_summary}; raw reference logs are committed under proofs/**/artifacts/.`,
    `\\newcommand{\\tlatoolversion}{${manifest.toolchains.tla.version}}`,
    `\\newcommand{\\plstates}{${formatInteger(manifest.proofs.results.find((entry) => entry.module === "ProvenanceLattice").distinct_states)}}`,
    `\\newcommand{\\scstates}{${formatInteger(manifest.proofs.results.find((entry) => entry.module === "SpeculativeCollapse").distinct_states)}}`,
    `\\newcommand{\\tbstates}{${formatInteger(manifest.proofs.results.find((entry) => entry.module === "TransportBoundary").distinct_states)}}`,
    `\\newcommand{\\tistates}{${formatInteger(manifest.proofs.results.find((entry) => entry.module === "TenantIsolation").distinct_states)}}`,
    `\\newcommand{\\nlstates}{${formatInteger(manifest.proofs.results.find((entry) => entry.module === "DAB_NonceLedger").distinct_states)}}`,
    `\\newcommand{\\ebstates}{${formatInteger(manifest.proofs.results.find((entry) => entry.module === "DAB_ExecutionBoundary").distinct_states)}}`,
    "% Test totals are a lower-bound snapshot: a green suite may legitimately grow.",
    `\\newcommand{\\testcount}{${formatInteger(manifest.tests.minimum_tests)}}`,
    `\\newcommand{\\testfiles}{${formatInteger(manifest.tests.minimum_test_files)}}`,
    "% Claim-scan count is for the tracked source revision only; the normal working-tree scan is broader.",
    `\\newcommand{\\claimfiles}{${formatInteger(manifest.claim_scan.recorded_tracked_scannable_files)}}`,
    "",
  ].join("\n")}`;
}

function renderSnapshotBlock(manifest, audience) {
  const proofLogPaths = manifest.paths.committed_proof_logs.map((entry) => `\`${entry.path}\``).join(", ");
  const heading = audience === "paper" ? "## Evidence snapshot" : "## Paper-evidence snapshot";
  const manifestLink = audience === "paper" ? "`evidence-snapshot.v1.json`" : "[`docs/paper/evidence-snapshot.v1.json`](docs/paper/evidence-snapshot.v1.json)";
  return `${GENERATED_START}
${heading}

This generated block is derived from ${manifestLink}. Regenerate with \`node tools/paper-evidence.mjs --render\`; verify with \`node tools/paper-evidence.mjs --check\`.

- **Recorded source revision:** \`${manifest.snapshot.recorded_source_revision}\` (${manifest.snapshot.recorded_at}); tag status: ${manifest.snapshot.tag_status}. ${manifest.snapshot.tag_note}
- **Paper gate:** \`${manifest.reproduction.target}\` runs E2, E3, E4, the canonical TLC runner, \`npm test\`, and the tracked-source claim scan. It deliberately does **not** execute ${manifest.reproduction.quarantined_not_run.map((entry) => `\`${entry}\``).join(", ")}.
- **Release preflight:** \`--check\` and \`--run\` fail before experiment replay if tracked source is dirty, the declared revision is unavailable, a required generated output or proof log is untracked or stale, or a committed proof-log digest drifts. Untracked scratch files do not block this release-style check.
- **Reviewer toolchains:** checksum-verified Node ${manifest.toolchains.node.version} (npm ${manifest.toolchains.node.npm_version}), Rust ${manifest.toolchains.rust.version}, JDK ${manifest.toolchains.java.reviewer_major}, and tla2tools ${manifest.toolchains.tla.version} (SHA-256 \`${manifest.toolchains.tla.sha256}\`). The E2 microseconds remain a separately recorded Apple M1 host result.
- **Proof evidence:** ${manifest.proofs.baseline_count} clean baselines and ${manifest.proofs.mutant_count} paired-mutant verdicts with reproduced violations; \`DAB_ExecutionBoundary\` is the one-sided baseline with no seeded mutant. A fresh generated summary is \`${manifest.paths.generated_proof_summary}\`; committed raw logs are ${proofLogPaths}. Mutant state counts are intentionally not snapshot constants (R11); baseline state counts are.
- **E2:** ${manifest.e2.operations.length} verifier-cost arms, ${manifest.e2.measured_iterations} measured iterations after ${manifest.e2.warmup_iterations} warmups on ${manifest.e2.host}; replay checks arm presence and monotonicity, not another machine's microseconds.
- **E3/E4:** verifier-intrinsic ${manifest.e3.verifier_intrinsic.successes}/${manifest.e3.verifier_intrinsic.total}; control arm ${manifest.e3.control_arm.successes}/${manifest.e3.control_arm.total}; ${manifest.e3.undetected} undeclared non-detections; ${manifest.e4.load_bearing_checks} load-bearing checks; all-checks mutant verdict must begin \`${manifest.e4.required_tautology_prefix}\`.
- **Test counts (${formatMarkdownInteger(manifest.tests.minimum_tests)} / ${formatMarkdownInteger(manifest.tests.minimum_test_files)}):** tests must be green and must not fall below this snapshot. The snapshot's deterministic tracked scan opened ${manifest.claim_scan.recorded_tracked_scannable_files} files and found ${manifest.claim_scan.required_violations} violations; normal contributor scans may count a different working-tree population.

> **Non-claim:** ${manifest.snapshot.non_claim}
${GENERATED_END}`;
}

function replaceBlock(source, path, replacement) {
  const starts = [...source.matchAll(new RegExp(GENERATED_START, "gu"))];
  const ends = [...source.matchAll(new RegExp(GENERATED_END, "gu"))];
  if (starts.length !== 1 || ends.length !== 1 || ends[0].index < starts[0].index) {
    fail(`${path} must contain exactly one well-formed generated paper-evidence block.`);
  }
  const end = ends[0].index + GENERATED_END.length;
  return `${source.slice(0, starts[0].index)}${replacement}${source.slice(end)}`;
}

function generatedOutputs(manifest) {
  return new Map([
    [GENERATED_PATHS.macros, renderMacros(manifest)],
    [GENERATED_PATHS.paperReadme, replaceBlock(text(resolve(ROOT, GENERATED_PATHS.paperReadme)), GENERATED_PATHS.paperReadme, renderSnapshotBlock(manifest, "paper"))],
    [GENERATED_PATHS.reviewerMap, replaceBlock(text(resolve(ROOT, GENERATED_PATHS.reviewerMap)), GENERATED_PATHS.reviewerMap, renderSnapshotBlock(manifest, "reviewer"))],
  ]);
}

function writeGenerated(manifest) {
  for (const [relativePath, output] of generatedOutputs(manifest)) {
    const absolutePath = resolve(ROOT, relativePath);
    writeFileSync(absolutePath, output, "utf8");
  }
}

function assertTracked(relativePath) {
  try {
    execFileSync("git", ["-C", ROOT, "ls-files", "--error-unmatch", "--", relativePath], { stdio: "ignore" });
  } catch {
    fail(`${relativePath} must be Git-tracked before a release-style evidence check.`);
  }
}

/**
 * A release replay must not execute uncommitted source while reporting a prior
 * Git revision. Untracked scratch files are intentionally allowed here: the
 * scanner's ordinary mode protects contributor drafts, whereas this release
 * gate only admits outputs that are tracked and commits that are clean.
 */
function assertCleanTrackedWorktree(root = ROOT) {
  const status = gitOutput(["status", "--porcelain", "--untracked-files=no"], root);
  if (status.length > 0) {
    fail("release-style evidence check requires a clean tracked worktree; commit or stash tracked changes before --check/--run.");
  }
}

/**
 * The final manifest may be committed after the evidence-bearing source commit
 * it describes. Require that named commit to exist and remain reachable, rather
 * than requiring a self-referential equality with the manifest's own commit.
 */
function assertRecordedEvidenceRevision(manifest, root = ROOT) {
  const revision = manifest.snapshot.recorded_source_revision;
  try {
    execFileSync("git", ["-C", root, "cat-file", "-e", `${revision}^{commit}`], { stdio: "ignore" });
  } catch {
    fail(`snapshot.recorded_source_revision is not an available commit: ${revision}.`);
  }
  const reachable = spawnSync("git", ["-C", root, "merge-base", "--is-ancestor", revision, "HEAD"], { stdio: "ignore" });
  if (reachable.status !== 0) {
    fail(`snapshot.recorded_source_revision is not reachable from HEAD: ${revision}.`);
  }
  if (manifest.snapshot.tag !== null) {
    const tags = gitOutput(["tag", "--points-at", revision], root).split("\n").filter(Boolean);
    if (!tags.includes(manifest.snapshot.tag)) {
      fail(`snapshot tag ${manifest.snapshot.tag} does not point at ${revision}.`);
    }
  }
}

function checkGenerated(manifest) {
  assertCleanTrackedWorktree();
  assertRecordedEvidenceRevision(manifest);
  assertTracked(MANIFEST_RELATIVE);
  for (const [relativePath, expected] of generatedOutputs(manifest)) {
    assertTracked(relativePath);
    const absolutePath = resolve(ROOT, relativePath);
    if (!existsSync(absolutePath)) {
      fail(`generated output is missing: ${relativePath}. Run --render.`);
    }
    if (text(absolutePath) !== expected) {
      fail(`generated output is stale: ${relativePath}. Run --render and review the diff.`);
    }
  }
  for (const log of manifest.paths.committed_proof_logs) {
    assertTracked(log.path);
    const absolutePath = resolve(ROOT, log.path);
    if (!existsSync(absolutePath)) {
      fail(`committed proof log is missing: ${log.path}.`);
    }
    const actual = sha256(absolutePath);
    if (actual !== log.sha256) {
      fail(`committed proof-log digest drift for ${log.path}: ${actual} != ${log.sha256}.`);
    }
  }
}

function execute(label, executable, args) {
  process.stdout.write(`\n[paper-evidence] ${label}\n`);
  const result = spawnSync(executable, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    fail(`${label} exited ${String(result.status)}.`);
  }
  return result.stdout;
}

function parseJsonOutput(label, output) {
  const start = output.indexOf("{");
  if (start === -1) {
    fail(`${label} did not emit JSON.`);
  }
  try {
    return JSON.parse(output.slice(start));
  } catch (error) {
    fail(`${label} emitted invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateE2(report, manifest) {
  if (!Array.isArray(report.operations) || report.operations.length !== manifest.e2.runtime_requirements.operation_count) {
    fail(`E2 reported ${report.operations?.length ?? "no"} operations, expected ${manifest.e2.runtime_requirements.operation_count}.`);
  }
  if (manifest.e2.runtime_requirements.require_no_dropped_operations && report.droppedOperations?.length !== 0) {
    fail(`E2 dropped ${report.droppedOperations.length} required operation(s).`);
  }
  if (!Array.isArray(report.monotonicityAudit) || report.monotonicityAudit.length !== manifest.e2.runtime_requirements.monotonicity_orderings) {
    fail("E2 monotonicity self-audit did not cover the declared relations.");
  }
  if (!report.monotonicityAudit.every((entry) => entry.holds === true)) {
    fail("E2 monotonicity self-audit reported an ordering violation; do not publish this run.");
  }
  for (const expected of manifest.e2.operations) {
    if (!report.operations.some((entry) => entry.operation === expected.operation)) {
      fail(`E2 omitted required operation ${expected.operation}.`);
    }
  }
}

function validateE3(report, manifest) {
  const aggregate = report.detection;
  const intrinsic = report.verifier_intrinsic_detection;
  const control = report.base_fixture_control;
  if (aggregate?.successes !== manifest.e3.aggregate.successes || aggregate?.total !== manifest.e3.aggregate.total) {
    fail("E3 aggregate detection result differs from the snapshot; regenerate manuscript evidence before publishing.");
  }
  if (intrinsic?.successes !== manifest.e3.verifier_intrinsic.successes || intrinsic?.total !== manifest.e3.verifier_intrinsic.total) {
    fail("E3 verifier-intrinsic result differs from the snapshot; regenerate manuscript evidence before publishing.");
  }
  if (control?.successes !== manifest.e3.control_arm.successes || control?.total !== manifest.e3.control_arm.total) {
    fail("E3 control arm differs from the snapshot; regenerate manuscript evidence before publishing.");
  }
  if (report.strata?.undetected !== manifest.e3.undetected || report.strata?.["documented-boundary"] !== manifest.e3.documented_boundaries) {
    fail("E3 boundary or undeclared non-detection count differs from the snapshot.");
  }
}

function validateE4(report, manifest) {
  if (report.loadBearingChecks?.length !== manifest.e4.load_bearing_checks) {
    fail("E4 load-bearing check count differs from the snapshot.");
  }
  if (!String(report.tautology_verdict).startsWith(manifest.e4.required_tautology_prefix)) {
    fail("E4 tautology discriminator did not pass.");
  }
  if (!Array.isArray(report.survivesAllChecksMutant) || report.survivesAllChecksMutant.length > manifest.e4.maximum_all_checks_survivors) {
    fail("E4 all-checks mutant has too many surviving detections.");
  }
  if (!report.mutants?.every((entry) => entry.controlArmIntact === true)) {
    fail("E4 mutated a control arm; the discriminator result is not interpretable.");
  }
}

function validateProofs(report, manifest) {
  if (!Array.isArray(report.results) || report.results.length !== manifest.proofs.results.length || report.all_gating_passed !== true) {
    fail("TLC proof runner did not meet every declared expectation.");
  }
  for (const expected of manifest.proofs.results) {
    const actual = report.results.find((entry) => entry.module === expected.module);
    if (!actual || actual.expect !== expected.expect || actual.status !== expected.status || actual.met !== true) {
      fail(`TLC result differs for ${expected.module}.`);
    }
    if (expected.distinct_states !== undefined && actual.distinct_states !== expected.distinct_states) {
      fail(`TLC baseline state count differs for ${expected.module}.`);
    }
  }
}

function parseVitestTotals(output) {
  const testFiles = /Test Files\s+[^\n]*\((\d+)\)/u.exec(output)?.[1];
  const tests = /Tests\s+[^\n]*\((\d+)\)/u.exec(output)?.[1];
  if (!testFiles || !tests) {
    fail("npm test did not emit parseable Vitest totals.");
  }
  return { files: Number(testFiles), tests: Number(tests) };
}

function parseTrackedScanCount(output) {
  const count = /Checked\s+(\d+)\s+tracked scannable files\./u.exec(output)?.[1];
  if (!count) {
    fail("tracked claim scan did not emit a deterministic file count.");
  }
  return Number(count);
}

function runEvidence(manifest) {
  checkGenerated(manifest);
  const e2 = parseJsonOutput("E2", execute("E2 verification cost", REPLAY_COMMANDS.e2.executable, REPLAY_COMMANDS.e2.args));
  validateE2(e2, manifest);
  const e3 = parseJsonOutput("E3", execute("E3 corpus detection", REPLAY_COMMANDS.e3.executable, REPLAY_COMMANDS.e3.args));
  validateE3(e3, manifest);
  const e4 = parseJsonOutput("E4", execute("E4 metamorphic guard", REPLAY_COMMANDS.e4.executable, REPLAY_COMMANDS.e4.args));
  validateE4(e4, manifest);

  execute("TLC proofs", REPLAY_COMMANDS.proofs.executable, REPLAY_COMMANDS.proofs.args);
  validateProofs(json(resolve(ROOT, manifest.paths.generated_proof_summary)), manifest);

  const tests = parseVitestTotals(execute("npm test", REPLAY_COMMANDS.tests.executable, REPLAY_COMMANDS.tests.args));
  if (tests.tests < manifest.tests.minimum_tests || tests.files < manifest.tests.minimum_test_files) {
    fail(`npm test counts fell below the snapshot: ${tests.tests}/${tests.files} < ${manifest.tests.minimum_tests}/${manifest.tests.minimum_test_files}.`);
  }

  const scanOutput = execute("tracked-source claim scan", REPLAY_COMMANDS.claim_scan.executable, REPLAY_COMMANDS.claim_scan.args);
  const trackedFiles = parseTrackedScanCount(scanOutput);
  if (trackedFiles < manifest.claim_scan.recorded_tracked_scannable_files) {
    fail(`tracked claim-scan population fell below snapshot: ${trackedFiles} < ${manifest.claim_scan.recorded_tracked_scannable_files}.`);
  }

  const report = {
    schema_version: "ghost-ark.paper-evidence-report.v1",
    executed_head_revision: gitOutput(["rev-parse", "HEAD"]),
    declared_evidence_revision: manifest.snapshot.recorded_source_revision,
    generated_at: new Date().toISOString(),
    e2: { operations: e2.operations.length, monotonicity_orderings: e2.monotonicityAudit.length },
    e3: { verifier_intrinsic: e3.verifier_intrinsic_detection, control_arm: e3.base_fixture_control },
    e4: { load_bearing_checks: e4.loadBearingChecks.length, tautology_verdict: e4.tautology_verdict },
    proofs: { result_count: manifest.proofs.results.length, generated_summary: manifest.paths.generated_proof_summary },
    tests,
    tracked_claim_scan: { files: trackedFiles, violations: manifest.claim_scan.required_violations },
    quarantined_not_run: manifest.reproduction.quarantined_not_run,
    non_claim: manifest.snapshot.non_claim,
  };
  const reportPath = resolve(ROOT, manifest.paths.generated_report);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`\n[paper-evidence] PASS: report written to ${relative(ROOT, reportPath)}\n`);
}

function usage() {
  process.stderr.write("Usage: node tools/paper-evidence.mjs --render | --check | --run\n");
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1 || !new Set(["--render", "--check", "--run"]).has(argv[0])) {
    usage();
    return 1;
  }
  const manifest = loadManifest();
  if (argv[0] === "--render") {
    writeGenerated(manifest);
    process.stdout.write("paper-evidence: rendered generated snapshot outputs.\n");
    return 0;
  }
  if (argv[0] === "--check") {
    checkGenerated(manifest);
    process.stdout.write("paper-evidence: tracked generated snapshot outputs are in sync.\n");
    return 0;
  }
  runEvidence(manifest);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

export {
  GENERATED_END,
  GENERATED_PATHS,
  GENERATED_START,
  REPLAY_COMMANDS,
  checkGenerated,
  assertCleanTrackedWorktree,
  assertRecordedEvidenceRevision,
  generatedOutputs,
  loadManifest,
  main,
  renderMacros,
  validateE2,
  validateE3,
  validateE4,
  validateProofs,
};
