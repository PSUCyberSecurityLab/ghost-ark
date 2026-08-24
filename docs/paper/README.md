# docs/paper — Conference Manuscript

`main.tex` is the systems-track conference manuscript for Ghost-Ark's
transactional control plane (distinct from `docs/dissertation/`, which is the
monograph). It is written under the repository claim boundary and is scanned
by the forbidden-claims gate (`.tex`/`.bib` are scannable extensions).

## Evidence discipline

Every generated empirical macro in the paper comes from
[`evidence-snapshot.v1.json`](evidence-snapshot.v1.json) through the tracked
[`evidence-macros.tex`](evidence-macros.tex) include loaded by `main.tex`.
The claim-to-command map lives in [`README-AE.md`](../../README-AE.md) at the
repository root. If an evidence value changes, update the snapshot and
regenerate its derived outputs; otherwise delete the claim.

<!-- BEGIN GENERATED PAPER-EVIDENCE SNAPSHOT -->
## Evidence snapshot

This generated block is derived from `evidence-snapshot.v1.json`. Regenerate with `node tools/paper-evidence.mjs --render`; verify with `node tools/paper-evidence.mjs --check`.

- **Recorded source revision:** `7afe3931335439d2e2af39a1e2b977d3e1f8ce66` (2026-08-14); tag status: tagged. The annotated tag evidence-v1 points at the recorded evidence revision. Per the two-commit release procedure, the revision was tagged on 2026-08-24 after a clean local replay of make paper-evidence, and this manifest with its regenerated outputs was committed afterward naming that tag. The release check verifies that the tag exists and points at the recorded revision.
- **Paper gate:** `make paper-evidence` runs E2, E3, E4, the canonical TLC runner, `npm test`, and the tracked-source claim scan. It deliberately does **not** execute `dab/bench/run_all.ts`, `dab/bench/performance.ts`, `dab/bench/formal_games.ts`.
- **Release preflight:** `--check` and `--run` fail before experiment replay if tracked source is dirty, the declared revision is unavailable, a required generated output or proof log is untracked or stale, or a committed proof-log digest drifts. Untracked scratch files do not block this release-style check.
- **Reviewer toolchains:** checksum-verified Node v22.22.3 (npm 10.9.8), Rust 1.97.1, JDK 21, and tla2tools v1.7.4 (SHA-256 `936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88`). The E2 microseconds remain a separately recorded Apple M1 host result.
- **Proof evidence:** 6 clean baselines and 5 paired-mutant verdicts with reproduced violations; `DAB_ExecutionBoundary` is the one-sided baseline with no seeded mutant. A fresh generated summary is `artifacts/proofs/proofs_summary.json`; committed raw logs are `proofs/dab/artifacts/DAB_ExecutionBoundary.tlc.txt`, `proofs/dab/artifacts/DAB_NonceLedger.tlc.txt`, `proofs/dab/artifacts/DAB_NonceLedger_Mutant.tlc.txt`, `proofs/tla/artifacts/ProvenanceLattice.tlc.txt`, `proofs/tla/artifacts/ProvenanceLatticeMutant.tlc.txt`, `proofs/tla/artifacts/SpeculativeCollapse.tlc.txt`, `proofs/tla/artifacts/SpeculativeCollapseMutant.tlc.txt`, `proofs/tla/artifacts/TenantIsolation.tlc.txt`, `proofs/tla/artifacts/TenantIsolationMutant.tlc.txt`, `proofs/tla/artifacts/TransportBoundary.tlc.txt`, `proofs/tla/artifacts/TransportBoundaryMutant.tlc.txt`. Mutant state counts are intentionally not snapshot constants (R11); baseline state counts are.
- **E2:** 6 verifier-cost arms, 5000 measured iterations after 500 warmups on Apple M1, darwin/arm64, 8 CPU, Node v22.22.3; replay checks arm presence and monotonicity, not another machine's microseconds.
- **E3/E4:** verifier-intrinsic 26/26; control arm 3/3; 0 undeclared non-detections; 7 load-bearing checks; all-checks mutant verdict must begin `PASS:`.
- **Test counts (1,434 / 172):** tests must be green and must not fall below this snapshot. The snapshot's deterministic tracked scan opened 942 files and found 0 violations; normal contributor scans may count a different working-tree population.

> **Non-claim:** This snapshot binds recorded local experiments, bounded TLC checks, tests, and claim-scan results to named artifacts and toolchains. It does not prove model safety, semantic truth, compliance, production readiness, deployment correctness, or live AWS behavior.
<!-- END GENERATED PAPER-EVIDENCE SNAPSHOT -->

> **`dab/bench/` is quarantined and must not be used to bind a number here.**
> Until 2026-08-02 the bench supplied this paper's advantage, latency, and
> throughput macros; its own README states it is not evidence about Ghost-Ark.
> See §"Superseded evidence" in `main.tex` and retraction **R10** in
> `docs/research/EXPERIMENTS.md`. `tests/unit/repo-hygiene/paperEvidenceSource.test.ts`
> now fails the build if the manuscript cites it without disclosure.

## Build

```bash
bash docs/paper/build.sh
```

The script is fail-closed: it runs the claim-language gate first and refuses
to produce a PDF if the gate is red. It compiles with local `latexmk` if
present, otherwise inside the reviewer container
(`docker compose -f docker-compose.reviewer.yml build` once, first).

## What this paper does not claim

Semantic safety, alignment, compliance, production readiness, verified
implementations (the TLC results are bounded models), live-AWS measurements,
attestation, or any detector's hit rate. Section "Limitations and
Non-Claims" in the manuscript is normative; edits that shrink it should be
treated with the same suspicion as edits that delete tests.
