#!/bin/bash
set -euo pipefail

echo "=== Dota Companion APK build ==="
echo "NODE=$(node -v)"
echo "ANDROID_HOME=${ANDROID_HOME:-unset}"

mkdir -p /work /src/dist

NEED_SETUP=1
if [ -f /work/android/gradlew ] && [ -d /work/node_modules/expo ]; then
  NEED_SETUP=0
  echo "=== reusing previous /work ==="
fi

if [ "$NEED_SETUP" = "1" ]; then
  rm -rf /work/*
  tar -C /src -cf - \
    --exclude=node_modules \
    --exclude=android \
    --exclude=ios \
    --exclude=.expo \
    --exclude=dist \
    --exclude=scripts \
    --exclude='*.apk' \
    . | tar -C /work -xf -

  cd /work

  if ! command -v git >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y --no-install-recommends git
  fi

  git init >/dev/null
  git config user.email "build@local"
  git config user.name "apk-build"
  git add -A
  git commit -m "apk build" >/dev/null

  echo "=== npm ci ==="
  npm ci --no-audit --no-fund

  echo "=== expo prebuild ==="
  CI=1 npx expo prebuild --platform android --non-interactive
fi

cd /work/android
chmod +x gradlew

python3 - <<'PY'
from pathlib import Path
p = Path("app/build.gradle")
text = p.read_text()
chunk = text.split("release {", 1)[-1][:500]
if "signingConfig signingConfigs.debug" not in chunk:
    text = text.replace(
        "        release {",
        "        release {\n            signingConfig signingConfigs.debug",
        1,
    )
    p.write_text(text)
    print("patched release signing -> debug keystore")
else:
    print("release signing already present")

props = Path("gradle.properties")
content = props.read_text()
lines = [
    "reactNativeArchitectures=arm64-v8a",
    "org.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError",
    "org.gradle.parallel=false",
    "org.gradle.workers.max=2",
    "org.gradle.daemon=false",
]
for line in lines:
    key = line.split("=", 1)[0]
    content = "\n".join(
        existing for existing in content.splitlines() if not existing.startswith(key + "=")
    )
    content += "\n" + line
props.write_text(content.strip() + "\n")
print("limited ABI to arm64-v8a")
PY

echo "=== gradle assembleRelease (arm64-v8a) ==="
export CI=1
./gradlew assembleRelease --no-daemon \
  -PreactNativeArchitectures=arm64-v8a \
  --max-workers=2

APK=$(find app/build/outputs/apk -name "*.apk" | sort | tail -n 1)
if [ -z "$APK" ]; then
  echo "No APK produced" >&2
  find app/build/outputs -type f || true
  exit 1
fi

cp "$APK" /src/dist/DotaCompanion.apk
ls -lh /src/dist/DotaCompanion.apk
echo "=== APK ready: /src/dist/DotaCompanion.apk ==="
