# README-AE — Claim-to-Command Map

This file binds every empirical claim in the conference manuscript
(`docs/paper/main.tex`) to the command that regenerates it. It complements
[`ARTIFACT_EVALUATION.md`](ARTIFACT_EVALUATION.md) (reviewer entry point,
environment, troubleshooting) and
[`docs/artifact/repository_inventory.md`](docs/artifact/repository_inventory.md)
(authoritative blocker list). If a claim is not in this table, the paper
should not be making it.

> **Claim boundary.** Ghost-Ark provides cryptographic receipts and bounded
> governance evidence. It verifies what was recorded, signed, policy-bounded,
> and replayable under Ghost-Ark verifier rules. It does **not** prove
> semantic safety, truth, compliance, alignment, production readiness, or
> deployment correctness.

<!-- BEGIN GENERATED PAPER-EVIDENCE SNAPSHOT -->
## Paper-evidence snapshot

This generated block is derived from [`docs/paper/evidence-snapshot.v1.json`](docs/paper/evidence-snapshot.v1.json). Regenerate with `node tools/paper-evidence.mjs --render`; verify with `node tools/paper-evidence.mjs --check`.

- **Recorded source revision:** `7afe3931335439d2e2af39a1e2b977d3e1f8ce66` (2026-08-14); tag status: unreleased. This draft names a clean, reachable evidence revision but no tag. Release uses two commits: first commit and tag the evidence-bearing source revision after a clean replay; then commit this manifest and its generated outputs naming that tagged revision. This file does not claim that a tag exists.
- **Paper gate:** `make paper-evidence` runs E2, E3, E4, the canonical TLC runner, `npm test`, and the tracked-source claim scan. It deliberately does **not** execute `dab/bench/run_all.ts`, `dab/bench/performance.ts`, `dab/bench/formal_games.ts`.
- **Release preflight:** `--check` and `--run` fail before experiment replay if tracked source is dirty, the declared revision is unavailable, a required generated output or proof log is untracked or stale, or a committed proof-log digest drifts. Untracked scratch files do not block this release-style check.
- **Reviewer toolchains:** checksum-verified Node v22.22.3 (npm 10.9.8), Rust 1.97.1, JDK 21, and tla2tools v1.7.4 (SHA-256 `936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88`). The E2 microseconds remain a separately recorded Apple M1 host result.
- **Proof evidence:** 6 clean baselines and 5 paired-mutant verdicts with reproduced violations; `DAB_ExecutionBoundary` is the one-sided baseline with no seeded mutant. A fresh generated summary is `artifacts/proofs/proofs_summary.json`; committed raw logs are `proofs/dab/artifacts/DAB_ExecutionBoundary.tlc.txt`, `proofs/dab/artifacts/DAB_NonceLedger.tlc.txt`, `proofs/dab/artifacts/DAB_NonceLedger_Mutant.tlc.txt`, `proofs/tla/artifacts/ProvenanceLattice.tlc.txt`, `proofs/tla/artifacts/ProvenanceLatticeMutant.tlc.txt`, `proofs/tla/artifacts/SpeculativeCollapse.tlc.txt`, `proofs/tla/artifacts/SpeculativeCollapseMutant.tlc.txt`, `proofs/tla/artifacts/TenantIsolation.tlc.txt`, `proofs/tla/artifacts/TenantIsolationMutant.tlc.txt`, `proofs/tla/artifacts/TransportBoundary.tlc.txt`, `proofs/tla/artifacts/TransportBoundaryMutant.tlc.txt`. Mutant state counts are intentionally not snapshot constants (R11); baseline state counts are.
- **E2:** 6 verifier-cost arms, 5000 measured iterations after 500 warmups on Apple M1, darwin/arm64, 8 CPU, Node v22.22.3; replay checks arm presence and monotonicity, not another machine's microseconds.
- **E3/E4:** verifier-intrinsic 26/26; control arm 3/3; 0 undeclared non-detections; 7 load-bearing checks; all-checks mutant verdict must begin `PASS:`.
- **Test counts (1,434 / 172):** tests must be green and must not fall below this snapshot. The snapshot's deterministic tracked scan opened 942 files and found 0 violations; normal contributor scans may count a different working-tree population.

> **Non-claim:** This snapshot binds recorded local experiments, bounded TLC checks, tests, and claim-scan results to named artifacts and toolchains. It does not prove model safety, semantic truth, compliance, production readiness, deployment correctness, or live AWS behavior.
<!-- END GENERATED PAPER-EVIDENCE SNAPSHOT -->

## Environment

Hermetic path (no host setup beyond Docker):

```bash
docker compose -f docker-compose.reviewer.yml build
docker compose -f docker-compose.reviewer.yml run --rm reviewer make paper-evidence
```

Native path: Node 22, JDK ≥ 11, `make bootstrap` once. Reference machine for
the paper's latency numbers: Apple M1, 8 GB, macOS (Darwin 24.5.0, arm64),
Node v22.22.3. We have **not** measured a second host, so expect the *ordering*
of the cost arms and their baseline ratios to hold and the absolute microseconds
not to. E3/E4 are exact census results; TLC baseline state counts are exact for
their bounded models; test counts are a green, non-decreasing snapshot rather
than an exact-match requirement.

> **Superseded rows.** Until 2026-08-02 rows 2 and 3 pointed a reviewer at
> `dab/bench/run_all.ts` — a directory whose own README reads "QUARANTINED: not
> evidence about Ghost-Ark", because several of its suites report `detected: true`
> without invoking any component under test. Reproducing those rows would have
> confirmed a number that measured nothing. They are re-sourced below to E2/E3/E4,
> which invoke the real verifier and carry a control arm. Recorded as **R10** in
> `docs/research/EXPERIMENTS.md`.

## The map

| # | Paper claim (section) | Command | Expected signal | Match |
|---|---|---|---|---|
| 1 | Six TLC baselines clean; **five** mutants reproduce violations; distinct-state counts in Table 2 (§5.1) | `bash scripts/run-proofs.sh` | Generated `artifacts/proofs/proofs_summary.json` reports `all_gating_passed: true`; committed raw reference logs are in `proofs/tla/artifacts/` and `proofs/dab/artifacts/`. Baseline `distinct_states`: ProvenanceLattice 403,949 / SpeculativeCollapse 529 / TransportBoundary 64 / TenantIsolation 149,796 / DAB_NonceLedger 1,321 / DAB_ExecutionBoundary 51,106. The five mutants report `VIOLATION_REPRODUCED`. **Do not match mutant `distinct_states` against a constant** — retraction R11: a mutant halts at the first counterexample under `-workers auto`, so its count varies with thread scheduling. The verdict reproduces; the count does not. **`DAB_ExecutionBoundary` has no mutant** — its clean result is one-sided. | baseline counts and mutant verdicts |
| 2 | Corpus detection: 26/26 verifier-intrinsic, 3/3 control arm, 0 undetected, 2 documented boundaries (§5.2) | `npm run experiment:e3` | `verifier-intrinsic: 26/26`, `control arm: 3/3`, `undetected 0`. Census provenance — exact counts, no interval | exact |
| 2b | Those detections are load-bearing, not tautological (§5.2) | `npm run experiment:e4` | `TAUTOLOGY VERDICT: PASS`; 7 load-bearing checks; with every check forced to pass only a parse failure still rejects | exact |
| 3 | Verification cost, p50 with IQR against a parse-only baseline (§5.3, Table 3) | `npm run experiment:e2 -- --json` | six required arms and `monotonicity self-audit: 4/4`; the manifest records the named-host p50/IQR snapshot | ordering and ratios; absolute µs vary by host |
| 4 | 1,434 tests / 172 files is the recorded lower-bound snapshot (§7) | `npm test` | a green suite with test and file totals no lower than 1,434 / 172 | **green, not below** — see note |
| 5 | Claim-language gate: 0 violations in the snapshot's tracked source, manuscript included — `.tex`/`.bib` are scannable (§7) | `node tools/research/check-forbidden-claims.mjs --tracked` | `Checked N tracked scannable files. No forbidden assurance overclaims detected.` | tracked snapshot population; normal working-tree count varies |
| 6 | Semantic gate implements the dependence-free Fréchet union upper bound `min(1, Σ pᵢ)` (§4.2), but is not runtime-wired | `npx vitest run tests/unit/receipt-schema/semanticAuditReceipt.test.ts` | suite passes; tests pin the bound to hand-computed values and the PASSED/FAILED_DRIFT_BOUNDS threshold behavior | unit evidence only |
| 7 | Receipts verify under an independent implementation; negative corpus rejects malformed envelopes (§3.5) | `npm run receipt:verify:independent && npm run receipt:verify:corpus && npm run receipt:verify:agreement` | all pass | exact |
| 8 | **Gateway↔independent-verifier round-trip**: a V1 `CERTIFIED` receipt from the gateway binary verifies against the independent verifier; tamper/mutation/wrong-key variants are rejected (§3.5) | `bash dab/roundtrip/run_in_docker.sh` (or `run_roundtrip.sh` with a host toolchain); unit evidence: `cd dab/gateway && cargo test --locked` and `cd dab/verifier && cargo test --locked` | `ROUND-TRIP: OK`; receipt verification and negative variants pass. This does not claim signed aborts or target binding. Recorded: `dab/roundtrip/RECORDED_ROUNDTRIP.txt` | certified execution only |
| 8b | Kubernetes round-trip example | `bash dab/k8s/run_demo.sh` (needs a cluster; loads the image into the node — no registry) | Job `dab-roundtrip` completes; verifier logs `VERIFIED`. This optional demonstration is not a paper-evidence gate or live-cloud evidence. | local-cluster demonstration |
| 8c | **Full socket transport E2E**: a Rust agent client drives the running gateway through a workspace-local Unix socket; the **wired tombstone ledger** rejects replay and the sink body matches decoded payload bytes (§4.3) | `bash dab/roundtrip/run_socket_e2e.sh` | `SOCKET-E2E: OK` (4/4): certified receipt verifies; replay rejects; mutation halts; certified egress body equals decoded payload bytes. Recorded: `dab/roundtrip/RECORDED_SOCKET_E2E.txt` | local socket subset only |
| 8d | Rust crates are lint-clean | `cd dab/gateway && cargo clippy --locked --all-targets -- -D warnings` (and `dab/verifier`) | clean; run the crate tests rather than matching a fixed test count | green |
| 8e | **The bounded replay window is measured**, not just stated: window $=\max(0,K-C)$ for $K$ tombstones at capacity $C$ (§6 item 6, Fig 4) | `cd dab/gateway && cargo run --locked --bin dab-replay-stress` | `LAW CONFIRMED`; all 11 measured rows carry `yes` in the tab-separated `ok` column (capacity 8–100, tombstones 1–1000), 0 rows `no`. Recorded: `dab/roundtrip/RECORDED_REPLAY_WINDOW.txt` | exact |
| 8f | Historical concurrent Rust TCB throughput record (not a claim about the current serialized replay implementation) | `cd dab/gateway && cargo run --release --bin stress` | A new recorded run is required before quoting throughput for the current code; the old output remains provenance only. | not current evidence |
| 9 | Full paper-evidence roll-up: E2 → E3 → E4 → TLC → tests → tracked claim scan (§7) | `make paper-evidence` (native, or hermetically in the reviewer container) | `artifacts/paper-evidence/report.json` and exit status 0 only when every named paper-evidence stage passes. It deliberately does not run `dab/bench`. | gate status |

## What a reviewer cannot reproduce here (deliberately listed)

- **Any live-AWS behavior.** KMS-mode signing, cloud latency, the deployment
  sketch of the paper's §5.5 — design targets; no live evidence is bundled
  or claimed.
- **The TypeScript `dab/agent-runtime/` library.** The Unix-socket transport
  is now exercised (row 8c) by a **Rust** agent client (`dab-agent`); the
  TypeScript agent library still has no runnable entrypoint and is not on any
  claimed path. `receipts.rs` and `gateway/src/verifier.rs` likewise remain
  orphaned parallel surfaces (dead code; the live paths are `GatewayReceipt` in
  `main.rs` and the `dab-verifier` crate).
- **Live-cloud key custody and attestation.** The signing key is a local DEV
  ed25519 key; KMS asymmetric keys by immutable ARN, and any hardware
  attestation, remain unimplemented and unclaimed.
- **Anything semantic.** No command here measures truthfulness, alignment,
  or safety of model output. The corpus results are rejection counts from the
  real standalone verifier over a hand-authored census, with the coverage
  boundary stated in EXPERIMENTS.md §E3 (no compromised-signer, chain-level,
  omission, timing, or key-rotation fixtures).
- **Anything from `dab/bench/`.** That directory is quarantined and is not
  evidence about this system; see the superseded-rows note above.

## Badge targeting (ACM/USENIX)

- **Artifacts Available** — requires a public, immutable, citable snapshot:
  tag a release and archive it (e.g., Zenodo DOI). *Author action; a GitHub
  URL alone does not qualify as immutable.*
- **Artifacts Evaluated — Functional** — target: `make paper-evidence` runs
  rows 1–5 and 9 green from the reviewer container; its reported runtime
  subset is deliberately narrower than the specified three-gate design.
> **On row 4's match column.** A test count is commit-relative: it changes the
> moment anyone adds a test, including the three hygiene guards added on
> 2026-08-02. Demanding an exact match would make the row fail for the healthiest
> possible reason. The reproducible claim is **the suite is green and the count
> is at least the recorded figure**; a *lower* count means tests were removed and
> is the case worth investigating. The figure is dated so the direction of any
> difference is checkable.

- **Results Reproduced** — target: paper-evidence reports rows 1, 2, 2b, and
  the tracked claim scan with their declared verdicts; row 4 green with a
  count ≥ the recorded figure; row 3 by ordering and ratio only (the paper
  claims microsecond *scale* on one named host, not a universal constant, and
  no second host has been measured).

## Regenerating the paper

```bash
bash docs/paper/build.sh   # claim gate (fail-closed) → latexmk
```

The build refuses to emit a PDF if the claim-language gate is red.
