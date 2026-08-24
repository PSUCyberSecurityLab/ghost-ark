# Ghost-Ark Design Observatory

`observatory.html` is a self-contained, interactive **explanatory companion**
to the manuscript. It is not an evidence artifact, a verifier replay, or a
runtime invocation, and it must not be cited as the source for a numerical or
runtime-status claim. Open it directly in a browser — no build step, network,
or external assets are required (all CSS and JavaScript are inline).

For authoritative paper evidence, use these sources instead:

- [`evidence-snapshot.v1.json`](evidence-snapshot.v1.json) binds the recorded
  source revision, toolchains, raw-proof-log paths, and measured values.
- [`README-AE.md`](../../README-AE.md) maps each claim to its command and
  limitation.
- `make paper-evidence` replays E2, E3, E4, the canonical TLC runner, the
  full test suite, and the tracked-source claim scan. It deliberately excludes
  quarantined `dab/bench/` programs.

The sliders calculate the displayed Fréchet and replay-window equations in
the browser. They illustrate the stated models and recorded replay-window law;
they do not execute Ghost-Ark components or regenerate evidence.

## Runtime boundary shown by the page

The specified three-gate architecture is broader than the shipped DAB socket
prototype. The prototype wires payload-byte binding and the nonce ledger. OCC
and semantic helpers are unit-tested but are not wired into the gateway path or
covered by socket E2E evidence. The DAB V1 signer and verifier cover successful
`CERTIFIED` executions only: replay and mutation responses are unsigned status
messages, and malformed or execution-failure paths can return no receipt.

The observatory therefore labels the gate diagram as specified architecture,
not runtime proof, and labels its receipt specimen as an illustration of the
certified path only.

## Non-claims

Nothing in this companion adds an assurance claim. It does not establish model
safety, semantic truth, compliance, production readiness, deployment
correctness, live-cloud behavior, production key custody, or a runtime
three-gate composition. The snapshot's non-claim and the manuscript's
limitations remain controlling.
