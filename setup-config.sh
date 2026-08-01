#!/usr/bin/env bash
# ============================================================
# DEPRECATED — superseded by setup.sh.
#
# Thin compatibility shim. setup.sh renders Revolt.toml (plus livekit.yml,
# egress.yml, ingress.yml, .env.web) idempotently and reuses every secret
# already present in .env. The old script rendered only Revolt.toml and loaded
# .env through a fragile `source <(grep ...)` that broke on values with
# whitespace/quotes. Use setup.sh directly.
# ============================================================
set -euo pipefail
echo "[setup-config.sh] DEPRECATED — forwarding to setup.sh" >&2
exec ./setup.sh
