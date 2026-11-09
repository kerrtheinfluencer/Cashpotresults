#!/usr/bin/env python3
"""Customise the generated Capacitor Android project.

usage: patch_android.py <android_dir> <icon_512_png> <version_code> <version_name>

- permissions (camera, location, notifications) and yaadadz.com app links in the manifest
- launcher icon + splash screen from the site's own icon (replaces Capacitor's default artwork)
- version numbers and release signing (reads KEYSTORE_FILE / KEYSTORE_PASSWORD at build time)
"""
import glob
import os
import sys

from PIL import Image, ImageDraw

android, icon_path, version_code, version_name = sys.argv[1:5]
BG_HEX = '#071b13'
res = os.path.join(android, 'app', 'src', 'main', 'res')
manifest_path = os.path.join(android, 'app', 'src', 'main', 'AndroidManifest.xml')

icon = Image.open(icon_path).convert('RGBA')


def hex_of(px):
    return '#%02x%02x%02x' % px[:3]


# Colour just inside the top edge of the icon's rounded square = adaptive-icon background
icon_bg = hex_of(icon.getpixel((icon.width // 2, 20)))


def fit(img, size):
    return img.resize((size, size), Image.LANCZOS)


# ---- launcher icons -------------------------------------------------------
for path in glob.glob(os.path.join(res, 'mipmap-*dpi', 'ic_launcher*.png')):
    size = Image.open(path).size[0]
    name = os.path.basename(path)
    if name == 'ic_launcher_foreground.png':
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        inner = int(size * 0.62)  # keep artwork inside the adaptive-icon safe zone
        canvas.paste(fit(icon, inner), ((size - inner) // 2, (size - inner) // 2))
        canvas.save(path)
    elif name == 'ic_launcher_round.png':
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        mask = Image.new('L', (size, size), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
        base = Image.new('RGBA', (size, size), icon_bg)
        base.alpha_composite(fit(icon, int(size * 0.92)).copy(), (int(size * 0.04), int(size * 0.04)))
        canvas.paste(base, (0, 0), mask)
        canvas.save(path)
    else:
        fit(icon, size).save(path)

with open(os.path.join(res, 'values', 'ic_launcher_background.xml'), 'w') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
            f'    <color name="ic_launcher_background">{icon_bg}</color>\n</resources>\n')

for stale in ('drawable/ic_launcher_background.xml', 'drawable-v24/ic_launcher_foreground.xml'):
    p = os.path.join(res, stale)
    if os.path.exists(p):
        os.remove(p)

adaptive = ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@color/ic_launcher_background"/>\n'
            '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
            '</adaptive-icon>\n')
for n in ('ic_launcher.xml', 'ic_launcher_round.xml'):
    with open(os.path.join(res, 'mipmap-anydpi-v26', n), 'w') as f:
        f.write(adaptive)

# ---- splash screens -------------------------------------------------------
bg_rgb = tuple(int(BG_HEX[i:i + 2], 16) for i in (1, 3, 5))
for path in glob.glob(os.path.join(res, 'drawable*', 'splash.png')):
    w, h = Image.open(path).size
    canvas = Image.new('RGBA', (w, h), bg_rgb + (255,))
    side = int(min(w, h) * 0.34)
    canvas.alpha_composite(fit(icon, side), ((w - side) // 2, (h - side) // 2))
    canvas.convert('RGB').save(path)

styles_path = os.path.join(res, 'values', 'styles.xml')
with open(styles_path) as f:
    styles = f.read()
styles = styles.replace(
    '<item name="android:background">@drawable/splash</item>',
    '<item name="android:background">@drawable/splash</item>\n'
    f'        <item name="windowSplashScreenBackground">{BG_HEX}</item>\n'
    '        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>')
with open(styles_path, 'w') as f:
    f.write(styles)

# ---- manifest -------------------------------------------------------------
with open(manifest_path) as f:
    m = f.read()

permissions = '''
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.location" android:required="false" />
'''
m = m.replace('</manifest>', permissions + '</manifest>', 1)

app_links = '''
            <!-- Open yaadadz.com links (shared listings, login return) inside the app -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="yaadadz.com" />
            </intent-filter>
'''
assert '</activity>' in m
m = m.replace('</activity>', app_links + '        </activity>', 1)

with open(manifest_path, 'w') as f:
    f.write(m)

# ---- version + signing ----------------------------------------------------
gradle_path = os.path.join(android, 'app', 'build.gradle')
with open(gradle_path, 'a') as f:
    f.write(f'''

// ---- added by CI ----
android {{
    defaultConfig {{
        versionCode {int(version_code)}
        versionName "{version_name}"
    }}
    lint {{
        abortOnError false
        checkReleaseBuilds false
    }}
    if (System.getenv('KEYSTORE_FILE')) {{
        signingConfigs {{
            release {{
                storeFile file(System.getenv('KEYSTORE_FILE'))
                storePassword System.getenv('KEYSTORE_PASSWORD')
                keyAlias 'yaadadz'
                keyPassword System.getenv('KEYSTORE_PASSWORD')
            }}
        }}
        buildTypes {{
            release {{
                signingConfig signingConfigs.release
            }}
        }}
    }}
}}
''')

print('android project patched; adaptive icon background', icon_bg)
