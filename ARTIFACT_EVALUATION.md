# Ghost-Ark — Artifact Evaluation

This is an AEC-oriented review guide, not a venue selection or a claim that a
particular venue class has been applied. The submission metadata and venue class
remain a maintainer decision.

Ghost-Ark is an AWS-native reference implementation for **bounded governance
receipts and deterministic enforcement primitives** around LLM/agentic AI
applications. DAB (Declarative Action Binding) is its Tier-0
execution-consistency subsystem. The CC-Framework is measurement science for
correlated guardrail failure.

> **Claim boundary.** Ghost-Ark provides cryptographic receipts and bounded
> governance evidence. It verifies what was recorded, signed, policy-bounded,
> and replayable under Ghost-Ark verifier rules. It does **not** prove semantic
> safety, truth, compliance, alignment, production readiness, or deployment
> correctness.

---

## Current reviewer route — read before running anything

The reviewer-facing evidence route is:

```bash
make paper-evidence
```

It fails closed over E2, E3, E4, the canonical TLC runner, `npm test`, and the
tracked-source claim scan. It deliberately does **not** run
`dab/bench/run_all.ts`, `dab/bench/performance.ts`, or
`dab/bench/formal_games.ts`. Its commands, toolchain versions, recorded source
revision, committed raw-TLC-log digests, and generated output paths are defined
in [`docs/paper/evidence-snapshot.v1.json`](docs/paper/evidence-snapshot.v1.json).
The snapshot is currently explicitly **unreleased**: a maintainer must tag the
post-repair committed evidence tree before distribution.

`make reproduce` remains a broader, legacy artifact-orchestration command. It
records build, claim, proof, test, attack, benchmark, dissertation, and report
stages, including quarantined DAB benchmark smoke material. It does **not**
rerun E2/E3/E4, so it is not a reproduction command for any manuscript
headline. Its generated reports are useful diagnostics, not committed evidence.

| Surface | Current status and boundary |
|---|---|
| Paper evidence | `make paper-evidence` is the CI-gated reviewer route. Its recorded figures are snapshot-bound, not timeless properties of a changing tree. |
| Formal evidence | Six clean baselines and five violating mutants are recorded under TLC `v1.7.4`, SHA-256 `936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88`. Five baselines are paired with five mutants; `DAB_ExecutionBoundary` is a clean, one-sided baseline with no mutant. |
| DAB socket prototype | The Rust socket path has local E2E evidence for decoded-payload binding and the nonce ledger. The TypeScript agent runtime remains unwired. OCC/read-set validation and the semantic gate are unit-tested helpers, not runtime gates. |
| DAB receipts | The V1 independent verifier accepts signed `CERTIFIED` receipts. Rejection, malformed-input, oversized-input, and execution-failure paths are not signed independently replayable abort receipts; V1 also does not bind an execution target. |
| Test and claim-scan counts | Counts are commit-relative. The reviewer standard is a green run with tests not below the recorded snapshot and a tracked-source scan, not an alleged exact count. |
| Cloud path | Local/synth/research evidence only. No live-AWS, KMS, Nitro, or deployment evidence is bundled. |

## 1. Requirements

- Node.js `v22.22.3` (the exact reviewer-image archive digests are in the
  evidence snapshot)
- Rust `1.97.1` for the recorded Rust stress context and the reviewer image
- Java 11 or newer for TLC (the reviewer image uses Java 21)
- `git`, `make`, and `python3`
- A TeX runtime only to build a PDF; it is not part of the evidence gate

Both DAB Rust crates commit lockfiles and are tested with `cargo test --locked`.
No AWS credentials or deployment command is required for the local reviewer
route.

## 2. Reproduce the paper evidence

```bash
npm ci
make paper-evidence
```

For the hermetic reviewer image:

```bash
docker compose -f docker-compose.reviewer.yml build
docker compose -f docker-compose.reviewer.yml run --rm reviewer
```

The target writes fresh TLC and summary output under `artifacts/`, which is
generated and ignored. Reviewers should inspect the committed raw TLC logs
listed with digests in the evidence snapshot (for example,
`proofs/dab/artifacts/DAB_NonceLedger.tlc.txt`), then compare a fresh generated
run to them. Do not treat `artifacts/proofs/logs/` as a committed path.

### What the target checks

1. E2 measures verification cost on the declared host with p50 and IQR.
2. E3 exercises the real standalone verifier with its control arm.
3. E4 checks that E3 detections stop when their mechanism is deliberately
   broken.
4. TLC checks the bounded models under the snapshot’s pinned toolchain.
5. `npm test` must be green and must not fall below the recorded test snapshot.
6. The claim scan runs over tracked scannable source, so generated files do not
   silently alter the denominator.

The gate is intentionally narrow. It provides no evidence for live AWS
behavior, semantic correctness, execution-target binding, or unsigned aborts.

## 3. Formal evidence

Run the canonical runner directly if a focused TLC replay is useful:

```bash
bash scripts/run-proofs.sh
```

The runner fetches only the stable `tla2tools v1.7.4` pin above and rejects a
digest mismatch. It creates fresh output in `artifacts/proofs/logs/` and a
generated summary in `artifacts/proofs/proofs_summary.json`; neither is a
committed evidence path. The committed raw logs are under
`proofs/tla/artifacts/` and `proofs/dab/artifacts/`, with file digests in the
evidence snapshot.

The 6/5 total is not a claim that every baseline has a mutant. The five paired
baseline/mutant checks gate two-sided invariants. `DAB_ExecutionBoundary` is
clean over its bounded model but has no seeded mutant, so its evidence is
one-sided and must be reported as such.

## 4. Quarantined benchmark material

`dab/bench/` is retained for forensic and historical purposes. It is
quarantined because several historical "detection" results did not invoke the
component they purported to measure. No latency, throughput, attacker-advantage,
or detection result from that directory is evidence about Ghost-Ark. Retraction
R10 in [`docs/research/EXPERIMENTS.md`](docs/research/EXPERIMENTS.md) preserves
the history and explains the replacement E2/E3/E4 evidence.

`make reproduce`, `make attack`, and `make benchmark` may still execute or
record this material as non-evidential diagnostics. That does not make it part
of the paper-evidence gate.

## 5. Legacy artifact report (not paper evidence)

For an audit of the historical broad orchestration only:

```bash
make reproduce
```

It writes generated status and report files under `artifacts/`. These outputs
describe what that orchestration observed on the current machine; they neither
replace the snapshot nor establish manuscript claims. In particular, its attack
and benchmark stages are not substitutes for E2/E3/E4.

## 6. Historical record and open limitations

The Phase-1 audit history is intentionally retained in the repository rather
than erased. Read [`docs/artifact/STATUS_AND_LIMITATIONS.md`](docs/artifact/STATUS_AND_LIMITATIONS.md),
[`docs/artifact/REVIEWER_ATTACK_SHEET.md`](docs/artifact/REVIEWER_ATTACK_SHEET.md),
and the retractions in `docs/research/EXPERIMENTS.md` for historical failures
and their correction dates.

The active limitations that matter before distribution are:

- OCC and semantic gating are not wired into the runtime execution path.
- V1 supplies no signed, verifier-accepted rejection receipts and does not bind
  an execution target.
- The socket E2E uses a local Rust driver and sink; it is not a full cloud or
  TypeScript-agent deployment path.
- Formal checks are bounded models, not a proof of implementation or deployment
  behavior.
- The evidence snapshot is not yet associated with an immutable release tag.

## 7. Troubleshooting

- **TLC cannot start** — install a JDK 11+ and run `bash scripts/run-proofs.sh`;
  it verifies the pinned jar before use.
- **Paper-evidence check says outputs are untracked** — render the snapshot
  outputs, review them, add them to the intended release commit, and tag that
  immutable commit. Do not bypass the tracking check.
- **A count differs from the document** — re-run the named command. Test and
  scan counts are commit-relative; an unexplained decrease is the problem.
- **A PDF tool is absent** — use the reviewer image or the bundled TeX path.
  A successful PDF build does not expand runtime evidence.
