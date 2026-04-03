#!/usr/bin/env bash
# PLG Voice — Android APK Build Script (TWA via Bubblewrap)
#
# Prerequisites:
#   npm install -g @nicolo-ribaudo/bubblewrap
#   Java JDK 11+ (JAVA_HOME set)
#   Android SDK (ANDROID_HOME set)
#
# Usage:
#   cd android/
#   ./build.sh
#
# Output: app-release-signed.apk

set -euo pipefail
cd "$(dirname "$0")"

echo "=== PLG Voice Android Build ==="

# Check prerequisites
if ! command -v bubblewrap &>/dev/null; then
  echo "[!] bubblewrap not found. Installing..."
  npm install -g @nicolo-ribaudo/bubblewrap
fi

if [ ! -f "android.keystore" ]; then
  echo "[*] Generating signing keystore..."
  keytool -genkeypair \
    -alias plgvoice \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -keystore android.keystore \
    -storepass plgvoice123 \
    -keypass plgvoice123 \
    -dname "CN=PLG Voice, OU=Dev, O=PLGames, L=Moscow, ST=Moscow, C=RU"
  echo "[*] Keystore created: android.keystore"
fi

# Initialize TWA project if not done
if [ ! -d "app" ]; then
  echo "[*] Initializing TWA project..."
  bubblewrap init --manifest="twa-manifest.json"
fi

# Build APK
echo "[*] Building APK..."
bubblewrap build

echo ""
echo "=== Build complete ==="
echo "APK: $(pwd)/app-release-signed.apk"
echo ""
echo "Install on device:"
echo "  adb install app-release-signed.apk"
echo ""
echo "Or distribute via:"
echo "  - GitHub Releases"
echo "  - Direct download from https://plgames-voice.ru/app"
echo "  - Google Play Store (requires Play Console account)"
