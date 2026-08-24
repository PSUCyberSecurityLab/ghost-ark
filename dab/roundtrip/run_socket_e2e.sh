#!/usr/bin/env bash
#
# Ghost-Ark DAB Tier-0 — end-to-end over the REAL Unix-domain socket.
#
# Unlike run_roundtrip.sh (which uses the hermetic emit-receipt mode), this
# drives the full running gateway through a real Unix-domain socket with a real
# agent client, exercising: the wired tombstone ReplayLedger (replay rejection
# across two socket calls), the C_I==C_E mutation halt, and the certified path
# (gateway posts decoded payload bytes to a local sink, then signs) verified by
# the independent verifier. Run inside rust:1-slim
# (see run_socket_e2e_in_docker.sh).
#
# Exit 0 iff every expectation holds.

set -Euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAB="$(cd "$HERE/.." && pwd)"
WORK="$(mktemp -d "$HERE/.socket-e2e.XXXXXX")"
SOCKET_PATH="$WORK/dab.sock"
PUBKEY_PATH="$WORK/gateway.pub"
EGRESS_BODY="$WORK/egress-body.bin"
EXPECTED_BODY="$WORK/expected-egress.bin"
SINK_PID=""
GW_PID=""
PASS=0; FAIL=0
ok(){  PASS=$((PASS+1)); printf 'PASS  %s\n' "$1"; }
bad(){ FAIL=$((FAIL+1)); printf 'FAIL  %s\n' "$1"; }
line(){ printf '%s\n' "------------------------------------------------------------"; }
cleanup(){
  [ -z "$GW_PID" ] || kill "$GW_PID" >/dev/null 2>&1 || true
  [ -z "$SINK_PID" ] || kill "$SINK_PID" >/dev/null 2>&1 || true
  [ -z "$GW_PID" ] || wait "$GW_PID" >/dev/null 2>&1 || true
  [ -z "$SINK_PID" ] || wait "$SINK_PID" >/dev/null 2>&1 || true
  case "$WORK" in
    "$HERE"/.socket-e2e.*) rm -rf -- "$WORK" ;;
    *) printf 'refusing to remove an unexpected E2E work directory\n' >&2 ;;
  esac
}
trap cleanup EXIT

echo "[build] gateway (dab-gateway, dab-agent, dab-sink) + verifier"
( cd "$DAB/gateway"  && cargo build --release --locked --quiet )
( cd "$DAB/verifier" && cargo build --release --locked --quiet )
GW="$DAB/gateway/target/release/dab-gateway"
AGENT="$DAB/gateway/target/release/dab-agent"
SINK="$DAB/gateway/target/release/dab-sink"
VERIFIER="$DAB/verifier/target/release/dab-verifier"

"$SINK" 127.0.0.1:8080 --capture "$EGRESS_BODY" >/dev/null 2>&1 & SINK_PID=$!
DAB_SOCKET_PATH="$SOCKET_PATH" DAB_GATEWAY_PUBLIC_KEY_PATH="$PUBKEY_PATH" \
  "$GW" >/dev/null 2>&1 & GW_PID=$!

# Wait for the gateway to bind the socket and publish its key.
for _ in $(seq 1 100); do
  [ -S "$SOCKET_PATH" ] && [ -s "$PUBKEY_PATH" ] && break
  sleep 0.1
done
[ -S "$SOCKET_PATH" ] || { echo "gateway did not bind its Unix socket"; exit 1; }
PUBKEY="$(cat "$PUBKEY_PATH")"
echo "gateway up; public key = $PUBKEY"
line

PAYLOAD_B64="$(printf 'hello-over-socket' | base64 | tr -d '\n')"
printf 'hello-over-socket' > "$EXPECTED_BODY"

# ---- 1. Certified over the socket, then independently verified -------------
echo "[1] agent -> gateway (certified) -> independent verifier"
"$AGENT" --payload-b64 "$PAYLOAD_B64" --nonce sock-n1 --target http://127.0.0.1:8080 --socket "$SOCKET_PATH" \
  > "$WORK/sock_certified.json"
cat "$WORK/sock_certified.json"
if grep -q '"status":"CERTIFIED"' "$WORK/sock_certified.json" && \
   "$VERIFIER" "$WORK/sock_certified.json" "$PUBKEY" ; then
  ok "certified-over-socket -> VERIFIED"
else
  bad "certified-over-socket should verify"
fi
line

# ---- 1b. The certified digest must bind the literal outbound HTTP bytes -----
echo "[1b] certified gateway egress equals decoded payload bytes"
if cmp -s "$EXPECTED_BODY" "$EGRESS_BODY"; then
  ok "certified egress body equals decoded payload bytes"
else
  bad "certified egress body should equal decoded payload bytes"
fi
line

# ---- 2. Replay of the same nonce is rejected by the WIRED ledger -----------
echo "[2] replay same nonce sock-n1 -> expect REPLAY_REJECTED (tombstone ledger)"
"$AGENT" --payload-b64 "$PAYLOAD_B64" --nonce sock-n1 --target http://127.0.0.1:8080 --socket "$SOCKET_PATH" \
  > "$WORK/sock_replay.json"
cat "$WORK/sock_replay.json"
grep -q '"status":"REPLAY_REJECTED"' "$WORK/sock_replay.json" \
  && ok "replay -> REPLAY_REJECTED (wired ReplayLedger.consume returned false)" \
  || bad "replay should have been rejected by the ledger"
line

# ---- 3. Declared != executed bytes -> mutation halt ------------------------
echo "[3] --mutate (c_i != c_e), fresh nonce -> expect MUTATION_DETECTED_HALT"
"$AGENT" --payload-b64 "$PAYLOAD_B64" --nonce sock-n2 --target http://127.0.0.1:8080 --mutate --socket "$SOCKET_PATH" \
  > "$WORK/sock_mutate.json"
cat "$WORK/sock_mutate.json"
grep -q '"status":"MUTATION_DETECTED_HALT"' "$WORK/sock_mutate.json" \
  && ok "mutation -> MUTATION_DETECTED_HALT" \
  || bad "mutation should halt"
line

echo "SUMMARY: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && echo "SOCKET-E2E: OK" || { echo "SOCKET-E2E: FAILED"; exit 1; }
