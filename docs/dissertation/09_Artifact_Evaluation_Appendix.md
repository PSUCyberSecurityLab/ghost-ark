# APPENDIX A: ARTIFACT EVALUATION GUIDE

This appendix retains an AEC-oriented route for the dissertation. It is not a
venue selection. The current reviewer route and its release-bound metadata are
defined by `docs/paper/evidence-snapshot.v1.json`; that snapshot is currently
unreleased and must be tagged after the repaired evidence tree is committed.

## 1. Reproducing the bounded formal evidence (TLA+)

Prerequisite: Java 11 or newer. Run the canonical runner from the repository
root:

```bash
bash scripts/run-proofs.sh
```

The runner verifies the stable `tla2tools v1.7.4` pin (SHA-256
`936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88`) before
TLC starts. It checks six clean bounded baselines and five mutants expected to
violate. Five baselines are paired with mutants; `DAB_ExecutionBoundary` is the
sixth clean baseline and has no mutant, so its result is one-sided.

`DAB_NonceLedger` checks `NoReplays` and `EventualGC` over its bounded tombstone
model (1,321 distinct states in the recorded configuration). Its TOCTOU mutant
must produce a counterexample. These outcomes concern the finite model, not the
runtime implementation or a deployment.

The runner writes fresh logs to `artifacts/proofs/logs/` and a generated summary
to `artifacts/proofs/proofs_summary.json`. Those paths are generated and ignored.
The committed raw logs live under `proofs/tla/artifacts/` and
`proofs/dab/artifacts/`; their exact paths and SHA-256 digests are listed in the
evidence snapshot.

## 2. Reproducing the paper evidence

Prerequisite: the snapshot’s Node toolchain (currently Node `v22.22.3`) and the
repository dependencies.

```bash
npm ci
make paper-evidence
```

This fail-closed gate runs:

1. E2, which reports cost with p50 and IQR on its declared host;
2. E3, a malicious corpus against the real standalone verifier with a control
   arm;
3. E4, which confirms the E3 detections depend on the mechanism under test;
4. the canonical TLC runner, `npm test`, and a tracked-source claim scan.

It deliberately excludes `dab/bench/**`. Retraction R10 records why the old
benchmark aggregate is not evidence for any empirical, runtime, or security
claim. Run `make reproduce` only to inspect the legacy broad artifact report;
it does not rerun E2/E3/E4 and is not a manuscript-evidence command.

## 3. DAB socket prototype boundary

The local Rust socket harness can be exercised separately:

```bash
bash dab/roundtrip/run_socket_e2e.sh
```

It supplies local E2E evidence for decoded-payload binding, the nonce ledger,
and verification of a signed `CERTIFIED` V1 receipt. It does not exercise
OCC/read-set validation or the semantic gate, which remain unit-tested helpers,
and it does not establish signed/replayable rejection receipts or an
execution-target binding. The manuscript runtime-status matrix states the full
component/test/runtime/E2E distinction.
