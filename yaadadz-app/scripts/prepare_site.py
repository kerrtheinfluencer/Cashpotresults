#!/usr/bin/env python3
"""Copy the yaadadz.com site into the app's www folder.

usage: prepare_site.py <site_dir> <www_dir> <shim_file>

- copies everything the browser needs, skipping repo tooling (CI, scrapers, SQL, node files)
- removes Google AdSense (Google's policy does not allow AdSense inside apps)
- injects the native shim into every top-level page
"""
import os
import re
import shutil
import sys

site, www, shim = sys.argv[1], sys.argv[2], sys.argv[3]

SKIP_DIRS = {'.git', '.github', '.githooks', 'sql', 'node_modules'}
SKIP_FILES = {
    'package.json', 'package-lock.json', 'generate-pages.js', 'enable-rls.js',
    'notify-site-update.js', 'scrape-bussgas.js', 'scrape-gas-stations.js',
    'scrape-petrojam-archive.js', 'todo.md', 'CHANGELOG.md', 'CNAME',
    '.gitignore', '.gitattributes', 'llms.txt', 'robots.txt', 'sitemap.xml',
    'ads.txt', 'create_supabase_rls_functions.sql',
}
SKIP_SUFFIXES = ('.sql',)

if os.path.exists(www):
    shutil.rmtree(www)
os.makedirs(www)

copied = 0
for root, dirs, files in os.walk(site):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    rel = os.path.relpath(root, site)
    dest_dir = www if rel == '.' else os.path.join(www, rel)
    os.makedirs(dest_dir, exist_ok=True)
    for f in files:
        if f in SKIP_FILES or f.endswith(SKIP_SUFFIXES):
            continue
        shutil.copy2(os.path.join(root, f), os.path.join(dest_dir, f))
        copied += 1

shutil.copy2(shim, os.path.join(www, 'yaadadz-native.js'))

adsense = re.compile(r'<script[^>]*pagead2\.googlesyndication\.com[^>]*>\s*</script>', re.I)
stripped = 0
for root, _, files in os.walk(www):
    for f in files:
        if not f.endswith('.html'):
            continue
        p = os.path.join(root, f)
        with open(p, encoding='utf-8', errors='surrogateescape') as fh:
            html = fh.read()
        new = adsense.sub('', html)
        if new != html:
            stripped += 1
        if os.path.dirname(p) == www and f == 'index.html':
            tag = '<script src="/yaadadz-native.js"></script>'
            if '</body>' in new:
                new = new.replace('</body>', tag + '\n</body>', 1)
            else:
                new += '\n' + tag
        with open(p, 'w', encoding='utf-8', errors='surrogateescape') as fh:
            fh.write(new)

if not os.path.exists(os.path.join(www, 'index.html')):
    sys.exit('index.html missing from site copy')
print(f'copied {copied} files, removed AdSense from {stripped} pages')
