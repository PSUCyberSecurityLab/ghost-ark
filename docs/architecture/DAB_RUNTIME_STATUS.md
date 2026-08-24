# DAB V1 Runtime Status

Status: **local Rust socket prototype**. This page is the status source for
the DAB Tier-0 path; it separates a tested primitive, a caller wired into the
running socket handler, and an end-to-end observation. It does not describe the
aspirational three-gate architecture as if it were the shipped path.

## Current boundary

The running `dab-gateway` accepts a DAB V1 declaration over a Unix socket,
consumes its nonce through the Rust replay ledger, derives `c_e` from decoded
payload bytes, posts those bytes to the requested HTTP target, and emits a
DEV-ed25519-signed `CERTIFIED` receipt only after that call returns. The socket
E2E starts the actual gateway and confirms both a replay rejection and that the
sink received the decoded bytes whose digest became `c_e`.

That is narrower than a full execution-governance claim. V1 does not put the
HTTP target in the signed message, so it does not attest the destination or a
target-side effect. Its key is a fixed local development key, not KMS, an HSM,
or runtime attestation.

| Component | Local test evidence | Wired into the Rust socket handler | Socket E2E evidence | Status to use in claims |
| --- | --- | --- | --- | --- |
| Payload declaration and `c_e` derivation | Rust unit tests | Yes | Yes: sink body equals decoded payload | implemented, local E2E |
| Nonce replay ledger | Rust unit tests and TLC model evidence for its bounded abstraction | Yes | Yes: replay returns `REPLAY_REJECTED` | implemented, local E2E |
| `CERTIFIED` receipt signing and independent verification | Gateway and verifier unit tests | Yes | Yes: `CERTIFIED` verifies | implemented for certified path only |
| OCC/read-set projection | `evaluateOCCGate` unit tests | No | No | unit-tested helper; specified runtime integration |
| Semantic cumulative-bound evaluator | `evaluateSemanticGate` unit tests | No | No | unit-tested helper; specified runtime integration |
| Target/effect binding | No V1 field exists in the signed message | No | No | not implemented in V1 |
| Signed rejection receipt | No generic rejection signer or verifier contract | No | No | not implemented in V1 |
| TypeScript `dab/agent-runtime` IPC client | Its own package tests | No | No | not V1-interoperable with the Rust socket handler |

The last row is a protocol fact, not merely a missing integration test: the
TypeScript IPC envelope labels itself `DAB-TIER0`, while the Rust handler
accepts only `DAB-TIER0-V1`. The exercised client is the Rust `dab-agent`.

## Receipt boundary

`build_certified_receipt` is the only DAB V1 signing path, and the independent
`dab-verifier` accepts only a receipt whose status is `CERTIFIED`. The two
current explicit rejection responses — `REPLAY_REJECTED` and
`MUTATION_DETECTED_HALT` — carry an empty signature. Malformed, oversized,
wrong-protocol, invalid-base64, and execution-failure inputs return without a
receipt. Therefore do not say that every abort, rejection, or decision produces
a signed or independently replayable receipt.

The accurate claim is narrower: given a DAB V1 `CERTIFIED` receipt, its public
key, and the verifier's rules, an independent verifier can check the signed
binding of `c_i`, `c_e`, nonce, timestamp, and policy digest. It cannot check a
signed rejection, target identity, target-side effect, OCC decision, or
semantic-gate decision because those are not in the V1 certified receipt path.

## The specified three-gate design

The ledger, OCC, and semantic gates remain a useful **specified design** for
transactional enforcement. The local V1 socket prototype realizes only the
ledger portion of that design plus certified payload receipt issuance. Calling
all three gates "implemented" or "runtime-enforced" would turn an L3
unit-tested primitive or L1 design into an L4 integration claim without
evidence.

To strengthen the claim, a successor protocol needs a target-bound receipt
message, signed rejection receipt variants and verifier support, and a single
runtime caller that invokes the OCC and semantic checks before external
execution. Those are implementation tasks, not properties inferred from the
current tests or formal models.

## Evidence paths

- Socket behavior and its scope: [`dab/roundtrip/README.md`](../../dab/roundtrip/README.md)
  and `bash dab/roundtrip/run_socket_e2e.sh`.
- Certified receipt and rejection implementation:
  [`dab/gateway/src/main.rs`](../../dab/gateway/src/main.rs).
- Independent verifier's status restriction:
  [`dab/verifier/src/lib.rs`](../../dab/verifier/src/lib.rs).
- OCC helper: [`packages/enforcement-runtime/src/gateway/occGate.ts`](../../packages/enforcement-runtime/src/gateway/occGate.ts).
- Semantic helper: [`packages/receipt-schema/src/semanticAuditReceipt.ts`](../../packages/receipt-schema/src/semanticAuditReceipt.ts).
- Repository-level evidence inventory and historical corrections:
  [`docs/artifact/repository_inventory.md`](../artifact/repository_inventory.md).
