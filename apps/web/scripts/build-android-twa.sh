#!/usr/bin/env bash
#
# Build the Android TWA (Trusted Web Activity) APK for Cafe Bazaar.
#
# Full guide: docs/07-deployment/MOBILE_ANDROID_CAFE_BAZAAR.md
#
# Prerequisites (checked below): JDK 17+, Android SDK (ANDROID_HOME), and a
# deployed HTTPS URL for the PWA. First run also needs a signing keystore —
# keep it safe; losing it means you can never update the app again.
#
# Usage:
#   bash apps/web/scripts/build-android-twa.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$APP_DIR/twa-manifest.json"

echo "==> 1/4 Prerequisites"

if ! command -v java >/dev/null 2>&1; then
  echo "✗ JDK not found. Install JDK 17+ (e.g. apt install openjdk-17-jdk)." >&2
  exit 1
fi

if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  echo "✗ ANDROID_HOME is not set. Install the Android SDK command-line tools and:" >&2
  echo "    export ANDROID_HOME=\$HOME/Android/Sdk" >&2
  exit 1
fi

if [ ! -f "$MANIFEST" ]; then
  echo "✗ $MANIFEST not found." >&2
  exit 1
fi
# Refuse to build with placeholder host/icon URLs — the APK would point nowhere.
if grep -q 'app\.example\.com' "$MANIFEST"; then
  echo "✗ twa-manifest.json still contains placeholder values (app.example.com)." >&2
  echo "  Replace host/iconUrl/maskableIconUrl with the real HTTPS domain first." >&2
  exit 1
fi

echo "✓ java:      $(java -version 2>&1 | head -1)"
echo "✓ android:   ${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
echo "✓ manifest:  $MANIFEST"

echo "==> 2/4 Doctor (bubblewrap)"
# npx will fetch @bubblewrap/cli on first use; it stays out of the repo.
npx --yes @bubblewrap/cli doctor

echo "==> 3/4 Init (interactive on first run — keystore + passwords)"
# If apps/web/android already exists, init is skipped and we just rebuild.
if [ ! -d "$APP_DIR/android" ]; then
  npx --yes @bubblewrap/cli init --manifest="$MANIFEST"
else
  echo "android/ already exists — skipping init, running update instead."
  npx --yes @bubblewrap/cli update
fi

echo "==> 4/4 Build"
npx --yes @bubblewrap/cli build

APK="$APP_DIR/android/app/build/outputs/apk/release/app-release-signed.apk"
echo
echo "✓ APK ready: $APK"
echo "  Next: upload it at cafebazaar.ir (developer console) and fill icon,"
echo "  screenshots, and description. Bump appVersionName/appVersionCode in"
echo "  twa-manifest.json for every store release."
