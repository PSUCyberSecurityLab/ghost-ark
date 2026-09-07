# Evidence Atlas: What the Frozen Artifact Establishes

**Scope.** This atlas reconstructs the current program from the evidence
revision `evidence-v1` and current public release `v1.0.0`, not from the
transactional manuscript's framing. “Observed” means a committed experiment or
artifact reports it; “derived” means it follows from stated definitions;
“interpreted” is an editorial consequence; and “claimed” is the paper wording
licensed by the preceding rows.

## Release and evidence provenance

| Check | Observation | Consequence |
|---|---|---|
| Local release | `v1.0.0` is an annotated tag at `eb2248d…`; the local worktree was clean at inspection. | Preserve it; this directory is additive. |
| Evidence anchor | Annotated `evidence-v1` peels to `7afe393…`, the revision named by `docs/paper/evidence-snapshot.v1.json`. | Use it for experiment provenance. |
| Remote observation | `git ls-remote` reported `origin/HEAD` at `eada4e6…`, distinct from the local release. | Do not infer or merge remote changes into frozen evidence. |
| Existing paper gate | `node tools/paper-evidence.mjs --check` passes for the transactional paper snapshot. | It does not validate E1/E7/E11/E12/E13/E16, so the new paper has a separate narrow gate. |

## A. Formal evidence

| Finding | Label | Claim type | Evidence | Licensed statement | Not licensed |
|---|---|---|---|---|---|
| Kernel / intended kernel / unintended kernel definitions | **DERIVED** | formal, mechanistic | `docs/research/PROVENANCE_KERNEL_PROBLEM.md` §§2–3; `tests/differential/provenanceKernel.test.ts` | A signing preimage induces equivalence classes, and the meaningful residue depends on a declared consumer population. | A new deep mathematical result. The lemmas are elementary. |
| Soundness is indexed by `(C, Sigma, P)` | **DERIVED** | formal, mechanistic | Same source, Lemmas 1–2 and the non-persistence theorem | A fixed canonicalizer can become unsuitable for a broader alphabet or consumer set. | That all canonicalizers become unsuitable, or that the result gives a population estimate. |
| Downstream separation cannot recover an accepted upstream collapse | **DERIVED + OBSERVED** | formal, mechanistic | E13 finite enumeration: 625 hops, 390,625 ordered compositions; `tools/experiments/e13KernelComposition.ts` | If an upstream function maps a pair to one non-rejected representation, a later function can preserve that identification or refuse it, but cannot distinguish the original pair. | A general deployment prevalence result. |

## B. Controlled empirical evidence

| Experiment | Question and population | Result | Negative or limiting result | Claim licensed |
|---|---|---|---|---|
| E1 | 31 pre-registered, curated JSON pathology classes across five arms | Ghost-Ark's unguarded pipeline has 5 unintended-kernel classes; text-level strict admission has 0 with no rejection asymmetry. | Census of an author-curated alphabet; no prevalence inference. | Selected structured-data pipelines can erase distinctions before receipt code observes them; early admission removes these selected collapses. |
| E1-B | 400 seeded draws per declared operator, under an adversarial generator | 403/767 (52.5%, 95% Wilson [49.0%, 56.1%]) unguarded semantics-changing outcomes collapse; strict admission: 0/767 ([0.0%, 0.5%]). | The generator is adversarial, not production traffic. | The mitigation separates the two arms under that declared generator. |
| E7 | 1,500 seeded JSON inputs through V8, CPython, and jq | 8 structural divergence classes over 4 mechanisms; every arm pair disagrees somewhere. | Pinned versions and one generator; not an ecosystem census. | No one of these three selected pipelines supplies a portable identity relation for all sampled inputs. |
| E11 | Same 31-class census through Rust `serde_json`, Ruby, CPython, and jq pipelines | Every third-party arm has 4 unintended-kernel classes; three duplicate-key classes collapse in all four. | Four arms, not a random ecosystem sample. | The duplicate-key finding is not confined to Ghost-Ark code. |
| E13 | Finite model plus 9x9x31 implementation compositions | 2 real implementation counterexamples; 405 repairs, all by rejection; none by separation. | The demonstrated counterexample relies on a non-default permissive codec; no all-default pair reproduced it. | Placement before normalization is material for the selected composition. |

## C. External-software evidence

| Finding | Label | External component | Result | Claim licensed | Not licensed |
|---|---|---|---|---|---|
| E11 | **OBSERVED** | Rust `serde_json`, Ruby `JSON`, CPython `json`, jq | Shared duplicate-key collapse and divergent acceptance behavior. | Heterogeneous implementations can induce different identity relations on the selected alphabet. | A defect ranking or a claim that any library is unsafe. |
| E16 | **OBSERVED** | OPA/Rego, CUE, jq, CPython | 8 cells where a named consumer reaches different decisions for a pair assigned one Ghost-Ark identity; discriminator holds. | A consumer-relevant consequence is executable, not merely hypothetical. | A prevalence claim or a host-performance claim. The stored report says `unrecorded-host`. |
| E14 | **OBSERVED** | CPython libraries and OpenSSL | 31/31 fixture decisions agree in its scoped crypto/encoding arm. | The selected fixture identities and crypto treatments have an additional implementation boundary. | Independent review of rule sequencing or correctness of the overall verifier. |

## D. Ecological evidence

| Experiment | Population and provenance | Result | Interpretation boundary |
|---|---|---|---|
| E12 | 3,000 uniform index draws from Rekor at recorded frame 2,438,317,323; 64 eligible stored `intoto` payloads | 0 observed pathology instances; 64 payload digests matched log records; 7 detector controls fired. | This is a real and unfavorable result for a frequency narrative. The 64 entries came from 16 producers, below the project interval floor; entry-level intervals do not establish a producer-level rate. |
| E15 | npm registry frame probe | A defensible sampling frame is reachable, but 0/40 latest packages held provenance attestations; an E12-sized eligible sample is costed rather than run. | No second-population incidence result exists. |

## E. Consequence evidence

| Finding | Label | Concrete consequence | Boundary |
|---|---|---|---|
| Decimal literal pair | **OBSERVED** | OPA, CUE, and jq split `0.1` from `0.1000000000000000055511151231257827` while the selected receipt path gives them one identity; CPython does not split them. | One natural scalar policy per engine; existence only. |
| Integer pair | **OBSERVED** | Four engines split the selected `2^53` adjacent-integer pair after receipt identity collapse. | The result is about the selected V8-backed receipt path and versions. |
| Duplicate-key pair | **OBSERVED** | CUE distinguishes a pair that last-wins engines do not. | It demonstrates dependence on the consumer model, not a failure by CUE. |

## F. Negative evidence and corrections

| Negative result | Why it changes the paper |
|---|---|
| E12's 0/64 result | The paper cannot tell a widespread-vulnerability story. It instead compares constructive and consequence evidence with a bounded ecological null. |
| E11 preserves exact integers in every third-party arm | The `2^53` issue is a double-backed number-model result, not a property of JSON in general. |
| E13 has no all-default implementation counterexample | Composition belongs as a supporting boundary, not the headline contribution. |
| E16 report host mismatch | Results may be cited as version-pinned decision outcomes, not as a reproducible host-specific observation. |
| R1–R11 retractions | The paper must not revive quarantined DAB benchmark claims, unstable mutant state counts, or unwired transactional claims. |

## G. Artifact evidence

| Artifact | What it makes checkable | Limit |
|---|---|---|
| `kernel-probe` and E1/E1-B harnesses | Classification of declared pathologies, mitigation comparison, seeded reproduction. | An instrument is not an ecosystem census. |
| E4-style discriminators | Selected detection mechanisms cease to report the same result when their load-bearing check is neutralized. | They check the stated mechanisms, not every surrounding interpretation. |
| Evidence tag, manifest, checksums, and new paper manifest | A reader can connect headline numbers to command, source anchor, and figure. | This is author-produced evidence; it is not external review. |

## Paper-ready evidence spine

The smallest coherent story is:

1. Use decision-conditioned receipt identity as operational measurement
   vocabulary, while labeling the formal observations elementary and not a
   theory novelty claim.
2. Measure selected collapse classes across the Ghost-Ark pipeline and four
   independently authored canonicalization arms (E1, E1-B, E7, E11).
3. Demonstrate a decision-level consequence at named engines (E16).
4. Place E12's zero-observation result adjacent to that consequence, rather
   than converting constructibility into prevalence.
5. Show strict admission as a selected mitigation; retain E13's composition
   result only as a bounded placement argument.
