#!/bin/zsh
# Installs ~/Applications/SPACE.app, a launcher that runs SPACE from this checkout.
# It is Electron's own app bundle, cloned (no extra disk on APFS) and renamed so the
# Dock and menu bar say SPACE. Each launch rebuilds the UI first, so code edits show up.
# Re-run after upgrading Electron. Logs go to ~/Library/Logs/SPACE.log.
set -e
DIR="${0:A:h:h}"
APP="$HOME/Applications/SPACE.app"
SRC="$DIR/node_modules/electron/dist/Electron.app"
[[ -d "$SRC" ]] || { echo "Run npm install in $DIR first."; exit 1; }

# Quit a running copy so the bundle can be replaced.
pkill -f "$APP/Contents/MacOS/Electron" 2>/dev/null && sleep 1 || true
rm -rf "$APP"
mkdir -p "$HOME/Applications"
cp -Rc "$SRC" "$APP" 2>/dev/null || cp -R "$SRC" "$APP"

cat > "$APP/Contents/MacOS/SPACE" <<SH
#!/bin/zsh
export PATH="$(dirname "$(command -v node)"):/opt/homebrew/bin:/usr/local/bin:\$PATH"
LOG="\$HOME/Library/Logs/SPACE.log"
cd "$DIR" || exit 1
{ echo "--- \$(date)"; ./node_modules/.bin/vite build --logLevel error; } >> "\$LOG" 2>&1
exec "$APP/Contents/MacOS/Electron" "$DIR" >> "\$LOG" 2>&1
SH
chmod +x "$APP/Contents/MacOS/SPACE"

PL="$APP/Contents/Info.plist"
plutil -replace CFBundleExecutable -string SPACE "$PL"
plutil -replace CFBundleName -string SPACE "$PL"
plutil -replace CFBundleDisplayName -string SPACE "$PL"
plutil -replace CFBundleIdentifier -string com.andrewblevins.space "$PL"
plutil -replace CFBundleIconFile -string SPACE.icns "$PL"

# Icon from assets/icon.svg, rendered with Quick Look.
TMP=$(mktemp -d)
qlmanage -t -s 1024 -o "$TMP" "$DIR/assets/icon.svg" >/dev/null 2>&1
mkdir "$TMP/SPACE.iconset"
for s in 16 32 128 256 512; do
  sips -z $s $s "$TMP/icon.svg.png" --out "$TMP/SPACE.iconset/icon_${s}x${s}.png" >/dev/null
  sips -z $((s*2)) $((s*2)) "$TMP/icon.svg.png" --out "$TMP/SPACE.iconset/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$TMP/SPACE.iconset" -o "$APP/Contents/Resources/SPACE.icns"
rm -rf "$TMP"

# Ad-hoc re-sign since the bundle changed, then tell Launch Services about it.
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP"
echo "Installed $APP"
