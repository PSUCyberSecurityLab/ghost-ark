# Paper-next: bounded JSON receipt-semantics measurement

This directory is an isolated research-note workspace. It neither replaces nor
reinterprets the released transactional-control manuscript in docs/paper/.

## Selected paper

**One Canonical Identity, Different Policy Outcomes: A Bounded Measurement of
JSON Receipt Semantics**

**Publication posture:** the frozen record supports a narrow reproducible
research note or artifact-oriented workshop draft. It does **not** support a
definitive or top-tier systems, security, or AI-agent paper. No candidate in the
twenty-paper tournament clears that gate.

The paper asks:

> For a selected receipt identity and an explicitly declared equality rule, do
> version-pinned policy and validation engines return different outcomes on a
> pair assigned that one identity?

The answer is intentionally narrow. It measures selected structured-data paths;
it does not propose a new canonicalization theory, a new JSON-testing method, a
receipt architecture, or a result about deployed applications.

## Frozen inputs

| Item | Recorded reference | Role in this workspace |
|---|---|---|
| Research-evidence revision | evidence-v1 → 7afe3931335439d2e2af39a1e2b977d3e1f8ce66 | Source of the selected experimental record |
| Public artifact release | v1.0.0 → eb2248d494d5cea583ae4c4ea35aeefd723ec5b5 | Local public-release context |
| Remote observation | origin/HEAD reported eada4e6b16ecd9a5f1c30ba7cce80533aea8cdf2 on 2026-08-24 | Not merged or used as evidence |

The evidence snapshot deliberately names the earlier evidence revision. This
workspace cites evidence-v1 for experiments and v1.0.0 only for release
context; it does not move either tag.

## Evidence boundary that controls the paper

- E12 found **0 selected pathologies in 64 eligible stored intoto payloads**
  from 16 producers, after 3,000 uniform index draws and seven detector
  controls. This is a central ecological null, not a prevalence estimate.
- E16 runs OPA/Rego, CUE, jq, and CPython under **author-supplied equality
  policies**. They are version-pinned third-party engines, not evaluated
  deployed receipt consumers. Its eight split cells are controlled consequence
  evidence only; the stored report records an unrecorded host.
- E12, E13, and E16 generated reports are ignored local artifacts rather than
  release-bundled evidence. Exact statements are consequently tied to tagged
  source anchors and carry that raw-evidence limitation.
- E1/E1-B/E7/E11 use curated or declared-generator inputs. They establish
  selected behavior, not ecosystem frequency.

## Build and evidence checks

    node tools/paper-next-evidence.mjs --check
    npx vitest run tests/unit/repo-hygiene/paperNextEvidence.test.ts
    bash docs/paper-next/build.sh

The dedicated checker validates selected source anchors, numeric macros, and
citation keys. It is narrower than the release replay and does not create a new
experiment or turn a networked replay into a current measurement.

## Non-claims

This package does not estimate deployment incidence, rank third-party engines,
attribute a flaw to DSSE or Rekor, establish semantic truth, make a model-behavior
claim, or make a cloud/deployment claim. It also does not state that strict
admission is universally appropriate.
