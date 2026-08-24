# Ghost-Ark — Repository Inventory (Artifact Evaluation)

> Audience: USENIX Security AEC reviewers, PhD committee, and independent
> researchers reproducing results on unfamiliar hardware. This document is the
> map produced by the Phase 1 repository audit for the Artifact Evaluation
> pipeline. It is deliberately blunt about what is verified, what is
> aspirational, and what is currently broken.

**Claim boundary (repeated verbatim from `AGENTS.md`).** Ghost-Ark provides
cryptographic receipts and bounded governance evidence. It verifies what was
recorded, signed, policy-bounded, and replayable under Ghost-Ark verifier rules.
It does **not** prove semantic safety, truth, compliance, alignment, production
readiness, or deployment correctness.

This file retains the Phase-1 audit record from 2026-07-15. It is not the
source of current paper figures or release status. For the current, manifest-
bound reviewer route, use `docs/paper/evidence-snapshot.v1.json`,
`docs/paper/README.md`, and `README-AE.md`. The dated material below is kept so
that retractions and failures remain inspectable rather than silently rewritten.

---

## 0. Current reproducibility and runtime boundary

| Surface | Reviewer command | Current boundary |
|-------|---------|------------------|
| Manuscript evidence | `make paper-evidence` | The only reviewer target for E2/E3/E4, TLC, `npm test`, and a tracked-source claim scan. It excludes quarantined `dab/bench/**`. |
| Legacy orchestration | `make reproduce` | Generates a broad AEC report but does not rerun E2/E3/E4 and may record quarantined benchmark smoke output. It is not a paper-evidence command. |
| Formal evidence | `bash scripts/run-proofs.sh` | Six clean baselines and five violating mutants under `tla2tools v1.7.4`, SHA-256 `936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88`. Five baselines are paired; `DAB_ExecutionBoundary` is one-sided. |
| Rust socket prototype | `bash dab/roundtrip/run_socket_e2e.sh` | Local E2E evidence covers decoded-payload binding and the nonce ledger. It does not wire OCC/read-set validation or the semantic gate. |
| Receipt boundary | `cargo test --locked` in `dab/gateway` and `dab/verifier` | The V1 verifier accepts signed `CERTIFIED` receipts. It does not verify signed abort/rejection receipts, and V1 does not bind an execution target. |
| Counts | Commands named in the evidence snapshot | Test and scan counts are commit-relative. A green run not below the snapshot is the required condition; no static count here is an "exact" result. |

The snapshot records an unreleased source revision. Before a public release, a
maintainer must commit the repaired tree and its generated evidence outputs and
create an immutable tag. Fresh proof summaries and logs under `artifacts/` are
generated and ignored; the committed raw TLC logs are the paths and digests
listed in the snapshot.

---

## 1. Language / toolchain surfaces

| Surface | Where | Build / run | Notes |
|---------|-------|-------------|-------|
| TypeScript (root workspace) | `apps/`, `packages/`, `services/`, `infra/cdk`, `tools/`, `tests/` | `npm ci`, `npm run lint` (`tsc --noEmit`), `npm test` (vitest) | Snapshot/reviewer image pin Node `v22.22.3`; `package-lock.json` present. Single root `tsconfig.json`. |
| TypeScript (DAB agent runtime) | `dab/agent-runtime/` | own `package.json` (ESM, Node ≥22), `vitest` | Separate workspace, own lockfile. Not part of the root `npm test`. **This row said "own lockfile" from the start and it was false until 2026-08-12**: the file at that path was a copy of `package.json`, so `npm audit` there returned a false `0 vulnerabilities` while a critical sat in the manifest. A real lockfile now exists and both CI gates cover it. |
| Rust (DAB TCB) | `dab/gateway/`, `dab/verifier/` | `cargo build --locked`, `cargo test --locked` | Both crates have committed lockfiles. The reviewer image and recorded Rust throughput context pin `1.97.1`. |
| TLA+ specs | `proofs/tla/`, `proofs/dab/` | TLC via `tla2tools.jar` (Java 11+) | See §4. Both active families are parsed by the canonical runner under `v1.7.4`; cloud specs remain outside this runner. |
| Python (verifier + Glue) | `verifiers/python/ghost_receipt_verify.py`, `services/transform/glue/jobs/*.py` | `python3` (stdlib only for the verifier) | Used by `tests/differential/pythonVerifierCorpus.test.ts` (skips if no `python3`). |

## 2. Node/TypeScript packages (workspaces)

`packages/`: `receipt-schema`, `enforcement-runtime`, `policy-compiler`,
`lineage-model`, `research-frontier`, `shared`.
`apps/`: `api`, `console`.
`services/`: `signing`, `ledger`, `search`, `ingest`, `transform`,
`orchestration`, `governance`.
`infra/cdk` (+ `infra/terraform`). `tools/scripts`.

Careful-with paths (from `AGENTS.md`): receipt canonicalization, signer,
emission, verifier, runtime, retrieval, vault, and `infra/cdk/lib/api-stack.ts`.
The AE pipeline does **not** modify any of these.

## 3. Test suites

The test-suite total is intentionally not copied here: it is commit-relative.
The paper evidence snapshot records a lower-bound expectation and the gate
rejects a run below it. The paths below describe scope rather than an exact,
perishable count.

| Category | Path | What it exercises |
|----------|------|-------------------|
| Unit — receipts/signing | `tests/unit/enforcement-runtime/receipts/**`, `tests/unit/signing/**` | canonicalization, hash-chain, sign/verify, KMS receipt verification, checkpoint, key manifest, ledger-anchored revocation |
| Unit — policy | `tests/unit/enforcement-runtime/policy/**`, `tests/unit/policy-compiler/**` | compiler, evaluator, conflicts, strict mode, tenant namespace, counterexample engine |
| Unit — vault / retrieval / runtime | `tests/unit/enforcement-runtime/{vault,retrieval,runtime}/**` | consent, delete/export, TTL, taint filter, fail-closed, governed invoke |
| Unit — research frontier | `tests/unit/research-frontier/**` | provenance lattice, guardrail observation, CC correlation, merkle, witness checkpoint/fraud-proof, zk-receipt (schema-only), nitro manifest, forbidden-claims scanner |
| Differential verifiers | `tests/differential/**` | Node ↔ Python ↔ v2 receipt parity, oracle divergence, M-estimation, manifest replay CLI |
| Integration — API/orchestration | `tests/integration/**` | CDK synth (API Gateway auth/env), governed-invoke lifecycle & custody, ASL orchestration, M-measurement E2E |
| Security | `tests/security/**` | policy fuzzer, receipt negative corpus, tenant-boundary, governed-invoke tenant boundary |

**Adversarial / attack coverage** lives in two places:
- Root `tests/security/**` (policy fuzzing, negative corpus, tenant boundary) — part of `npm test`.
- DAB `dab/bench/**` (mutation, replay, unicode, concurrency, formal games,
  performance) — quarantined programs. They may be recorded by legacy scripts,
  but their output is not evidence and is excluded from `make paper-evidence`.

## 4. Formal specifications (TLA+)

Runner: `scripts/run-proofs.sh` (invoked by `make proof` and the paper gate).
It uses only the stable pin `tla2tools v1.7.4`, SHA-256
`936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88`.

| Scope | Current evidence |
|------|------------------|
| Paired gates | `ProvenanceLattice`, `SpeculativeCollapse`, `TransportBoundary`, `TenantIsolation`, and `DAB_NonceLedger` are clean bounded baselines; their five matched mutants reproduce violations. |
| One-sided baseline | `DAB_ExecutionBoundary` is clean over 51,106 bounded states but has no seeded mutant. It contributes the sixth baseline, not a sixth pair. |
| Paths | Fresh logs and `proofs_summary.json` are generated under `artifacts/proofs/`. The committed raw logs are under `proofs/tla/artifacts/` and `proofs/dab/artifacts/`; every reviewer path and digest is in `docs/paper/evidence-snapshot.v1.json`. |
| Boundary | These are bounded TLC outcomes for models, not a proof of runtime, cloud, or deployment behavior. |

## 5. Quarantined benchmark material (`dab/bench/`)

The exported attack, game, and performance programs remain in the repository as
forensic material. They are quarantined because their historical detection
results could succeed without exercising the component under test. No output
from this directory is a Ghost-Ark measurement, a paper figure, or a replacement
for E2/E3/E4. Retraction R10 in `docs/research/EXPERIMENTS.md` preserves the
history. The paper gate excludes the directory by construction.

## 6. Documentation, CI, infra

- **Dissertation**: `docs/dissertation/00_*.md … 10_*.md` (11 chapters, ~4,620
  words). Compiled by `docs/dissertation/build_paper.sh` (this pipeline).
- **Existing CI**: `.github/workflows/{ci,deploy-dev,deploy-prod,docs,infra-plan,release-provenance}.yml`.
  `ci.yml` runs `npm run validate` + CodeQL + Semgrep + gitleaks + terraform validate.
  `artifact.yml` explicitly gates `make paper-evidence`; the retained legacy
  artifact report is marked non-paper evidence.
- **Infra**: `infra/cdk` (synthesizable: `npm run infra:synth`), `infra/terraform`.
- **Claim scanner**: `tools/research/check-forbidden-claims.mjs` (Unicode/line-split
  hardened; fail-closed). `npm run scan:claims`.

## 7. Historical Phase-1 findings and retractions

The entries below retain their original dates and describe what was found then.
Where they conflict with Sections 0–6, the current, manifest-bound status above
controls. They are retained so the history of failures is auditable.

### 7.1 DAB TLA+ specs are invalid TLA+ — RESOLVED 2026-07-16 (caveat in §7.2)
At earlier HEADs, `proofs/dab/DAB_NonceLedger.tla` and `_Mutant.tla` used LaTeX
`\setminus` where TLA+ set-difference is a bare `\`. Under TLC they failed:
`Parse Error … Encountered "{" … token "setminus"`. They had never parsed, so no
TLC result could have been produced by those files. Both specs now parse; the
baseline additionally models a `spent` tombstone set and an explicit
`Terminating` step so TLC's deadlock check covers the intended terminal state.
Real recorded runs (committed under `proofs/dab/artifacts/`, regenerated by
`scripts/run-proofs.sh`):
- `DAB_NonceLedger` (3 agents, 5 nonces, MaxLedgerSize 3): `NoReplays` and
  `EventualGC` hold; 1,321 distinct states, complete state space.
- `DAB_NonceLedger_Mutant` (TOCTOU check/commit split, no tombstones):
  `NoReplays` violated — TLC reproduces the two-agent same-nonce counterexample
  transcribed in `docs/dissertation/06_Formal_Verification.md` §3.
- `DAB_ExecutionBoundary`: passes (51,106 distinct states), but its signature
  oracle is abstracted as `IsValidSignature(...) == TRUE` and `DeltaZero` is
  the same predicate as `NoExecutionWithoutVerification` — a pipeline shape
  check, not cryptographic evidence.

### 7.2 The corrected DAB baseline refuted its own claim — spec repaired; implementation divergence CLOSED
Fixing **only** the operator (`\setminus`→`\`) made the specs parse, and the
baseline then **violated `NoReplays`** (TLC: 169 distinct states):
`GarbageCollect(n)` removed a consumed nonce, permitting a second agent to
re-consume it. That violation was a true positive about the shipped design.
The spec has since been repaired with a `spent` tombstone set (consumption
requires `n \notin ledger` AND `n \notin spent`; GC archives instead of
forgetting), and TLC now verifies `NoReplays` over the complete bounded state
space. **This pipeline still does not edit specs to force a pass** — the repair
is committed spec design, and the recorded logs are real runs of it.

**Divergence closed at the module level:** the Rust file
`dab/gateway/src/nonce.rs` implements tombstones matching the TLA+ model.
`consume()` checks both the active `entries` map AND the `spent` HashSet.
`cleanup_expired()` archives evicted nonces into `spent` rather than forgetting
them. A nonce consumed at time T is rejected at T+3601. Capacity pressure fails
closed.

**Correction, then closure (2026-07-16):** for part of this day `nonce.rs` was
**orphaned** — `main.rs` declared no `mod nonce;`, so the verified tombstone
module was not compiled into the shipped gateway binary, which used an inline
monotonic `HashSet` ledger. That gap is now **CLOSED**: `main.rs` declares
`mod nonce;` and the replay check calls `ReplayLedger::consume()` (the
`ConsumeNonce` discipline: reject if the nonce is in the active ledger OR the
spent tombstone set, and fail closed on capacity). `nonce.rs` gained four unit
tests (fresh-accept, within-TTL replay-reject, distinct-coexist, shared-state)
that run under `cargo test`, and the wired behavior is exercised end-to-end
over the real Unix socket: `dab/roundtrip/RECORDED_SOCKET_E2E.txt` shows a
second request with the same nonce answered `REPLAY_REJECTED` by the wired
ledger. The whole gateway crate is `cargo clippy -D warnings` clean. Bounded
caveat, now **measured** (not just stated): `dab-replay-stress` drives the real
ledger and confirms the replay window is exactly `max(0, K - C)` for `K`
tombstones at capacity `C`, with HashSet-arbitrary (not age-ordered) membership
(`dab/roundtrip/RECORDED_REPLAY_WINDOW.txt`). Caps are env-tunable
(`DAB_MAX_SPENT_ENTRIES`, `DAB_NONCE_TTL_SECONDS`); default 500,000; durable
store with time-ordered eviction is the production posture.

**Bounded caveat (stated, not hidden):** the in-process `spent` HashSet is
bounded at `MAX_SPENT_ENTRIES` (500,000). When this limit is reached, oldest
tombstones are pruned, opening a theoretical bounded-replay-window for nonces
older than both the TTL and the tombstone capacity. Production deployments
should use a durable external store (Redis, DynamoDB conditional writes, or
TPM-backed counters) where tombstone capacity is not memory-bound.

### 7.3 Claim gate is RED at HEAD — RESOLVED 2026-07-16
Historical state (2026-07-15): `npm run scan:claims` reported **11 violations**,
all in committed dissertation chapters (`00`, `03`, `05`, `06`, `08`, `10`) —
absolute-assurance phrasing outside the Ghost-Ark claim boundary.
`make dissertation` refused to emit a PDF while the gate was red, and the
pipeline did **not** rewrite the prose.

**Resolution:** the dissertation prose was brought within the claim boundary by
ordinary reviewed edits, and the scanner now reports **0 violations at HEAD**.
Coverage was additionally **extended** (not weakened) on 2026-07-16: `.tex` and
`.bib` are now scannable extensions, so the conference manuscript
(`docs/paper/main.tex`) is inside the same gate — this immediately caught, and
forced the repair of, two blanket-assurance phrases introduced into the
manuscript during author editing. The scanner's own unit suites
(`checkForbiddenClaims.test.ts`, `claimScannerHardening.test.ts`, 57 tests)
pass with the extended coverage.

### 7.4 Full `npm test` is flaky under load
Six CDK-synth integration tests (`tests/integration/api/template-*.test.ts`,
`auth.test.ts`, `createReceipt.test.ts`) time out at the 15 s default under
full-suite import/transform contention (88 s import time), but **pass in isolation**
(8/8). `make unit` runs vitest with `--test-timeout=60000` to remove the false
negative without editing committed test logic. This is an environment accommodation,
not a correctness change.

### 7.5 DAB reproduction plumbing — scope correction (2026-08-13)

The historical repair record correctly established a runnable Rust client,
gateway, sink, and independent verifier. Its old word "closed" was too broad
for the runtime claim later made around it. The current boundary is:

- `bash dab/roundtrip/run_socket_e2e.sh` exercises a local Rust agent and sink.
  It demonstrates decoded-payload byte binding, the live nonce ledger, a
  certified receipt accepted by the independent verifier, replay rejection,
  and mutation halt behavior.
- This socket path is not a generic TypeScript-agent or cloud path. The
  TypeScript IPC surface remains unwired to the Rust protocol.
- The receipt signature claim applies to `CERTIFIED` V1 receipts. Replay and
  mutation responses have no signature, and malformed, oversized, and
  execution-failure paths may produce no receipt at all. The independent
  verifier rejects non-`CERTIFIED` status before signature verification.
- V1 commits the payload-derived binding but does not include a signed execution
  target. The sink evidence does not fill that protocol omission.
- OCC/read-set validation and semantic-gate arithmetic are unit-tested helpers;
  neither is called by the socket gateway. The runtime-status matrix in
  `docs/paper/main.tex` is the reviewer-facing source for that distinction.

Both Rust crates now have lockfiles and support `cargo build --locked` and
`cargo test --locked`. This repairs build reproducibility, not the unsigned
abort or unwired-gate limitations.

### 7.6 Historical DAB benchmark accounting incident — retracted from evidence

> **Supersession (2026-08-13).** The account below is retained as an audit
> history, not a current result. Correcting the benchmark’s accounting did not
> repair its deeper component-under-test defect. R10 withdraws every headline
> latency, throughput, attacker-advantage, and detection claim sourced from
> `dab/bench/`; use E2/E3/E4 through `make paper-evidence` instead.

Historical state: when the suites were actually executed (via the new
`dab/bench/run_all.ts`), the aggregate reported `global_advantage ≈ 0.25` and
`all_passed = false` — contradicting `dab/reproduce.sh`, which hardcodes
`global_advantage == 0`, and the dissertation's "100% detection." The cause was
**inverted accounting in the benchmark, not a real defense failure**:
- `formal_games.ts::replayGame` sets `replayAccepted = ledger.has(nonce)` and counts
  that as attacker `success`. But a nonce already in the ledger means the replay was
  **detected**; the game scores a detected replay as an attacker win, yielding
  `advantage ≈ 0.998` where correct accounting gives 0.
- `attacks/mutation.ts::attackPrototypePollution` returns `detected: safe === false`
  where `safe = Object.hasOwn(payload, "amount")` is `true` (the own property is
  present and un-shadowed). It labels a safe outcome as "not detected."

The modeled ledger and own-property checks work; the scoring was wrong. The
pipeline did **not** rewrite the game logic — it ran the suites honestly and let
the real (red) result stand until the author's accounting fix landed as an
ordinary reviewed commit (`cd66782`).

**Resolution, with recorded evidence (2026-07-16):**
`node --experimental-strip-types dab/bench/run_all.ts --trials 10000` at HEAD
reports `global_advantage = 0` and `all_passed = true`; all four formal games
(Mutation Resistance, Replay Resistance, Cross Transaction Binding,
Serialization Ambiguity) report `advantage = 0` over 10,000 trials each, and
all nine corpus attacks report `detected = true`. Scope is unchanged and
normative: these are in-suite results under the modeled attacker (see the
non-claim header in `dab/bench/run_all.ts`); the period during which this
repository published its own red result is retained above as methodological
history — see also the manuscript's §5.4 ("A disclosed harness bug").

## 8. Phase-1 pipeline scope (historical)

**Adds (orchestration + docs only):** `Makefile`, `scripts/*.sh`,
`tools/artifact/aec-report.mjs`, `Dockerfile.reviewer`,
`docker-compose.reviewer.yml`, `docs/dissertation/build_paper.sh` + `README.md`,
`.github/workflows/artifact.yml`, `ARTIFACT_EVALUATION.md`, `dab/bench/run_all.ts`,
`tests/integration/artifact/pipeline.test.ts`, `.gitignore` entries.

**Deliberately untouched:** all receipt/enforcement/TCB source, all schemas, all
existing tests' logic, the TLA+ spec semantics, and the dissertation prose. The
integrity items in §7 are the author's to resolve; the pipeline surfaces them, it
does not launder them.
