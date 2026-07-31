#!/usr/bin/env bash
# ============================================================
# DEPRECATED — superseded by setup.sh.
#
# This file is kept as a thin compatibility shim. Existing docs and
# runbooks call `./generate_config.sh <domain>`, which keeps working —
# the domain argument is forwarded as PLG_DOMAIN to setup.sh.
#
# The original script was removed because it was unsafe and stale:
#   - regenerated FILES_ENCRYPTION_KEY on every run, making every
#     previously uploaded file permanently unreadable;
#   - wrote a partial Revolt.toml (no [database]/[files.s3]/[rabbit]/
#     [messages] sections) and a broken .env.web (HOSTNAME was a URL
#     instead of a Caddy listen address);
#   - used BSD-only `base64 -i` (silently wrong on Linux) and disabled
#     TURN, breaking WebRTC for clients behind symmetric NAT.
#
# setup.sh is idempotent, reuses every secret already present in .env,
# and never rotates FILES_ENCRYPTION_KEY. Use it directly.
# ============================================================
set -euo pipefail

if [ -n "${1:-}" ]; then
  export PLG_DOMAIN="$1"
fi
echo "[generate_config.sh] DEPRECATED — forwarding to setup.sh" >&2
exec ./setup.sh
