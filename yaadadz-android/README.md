# Yaad Adz – Android app

A Trusted Web Activity wrapper around https://yaadadz.com (package `com.yaadadz.app`).
It shows the live site full-screen (no browser bar), so every site update appears in the app instantly.
GitHub builds the signed APK for you in the cloud — nothing to install locally.

## One-time setup (about 10 minutes, all in the GitHub website)

1. **Repo.** This project lives in the `yaadadz-android` folder of the Cashpotresults repo. The workflow is `.github/workflows/build-yaadadz-android.yml`.
2. **Add two secrets.** In the Cashpotresults repo: Settings → Secrets and variables → Actions → New repository secret.
   - `ANDROID_KEYSTORE_PASSWORD` = value from `yaadadz-signing-secrets.txt`
   - `ANDROID_KEYSTORE_BASE64` = the long base64 line from the same file
3. **Verify the site link (this removes the URL bar).** In your existing `yaadads` repo, add the file
   `.well-known/assetlinks.json` (copy from `for-yaadads-repo/.well-known/assetlinks.json`).
   Make sure the repo root has an empty `.nojekyll` file, otherwise GitHub Pages hides the `.well-known` folder.
   Confirm https://yaadadz.com/.well-known/assetlinks.json opens in a browser.
   Bump the service worker cache version as usual when you deploy.
4. **Build.** Repo → Actions → "Build Yaad Adz Android app" → Run workflow. After ~4 minutes, open the
   **Releases** page: `YaadAdz.apk` is the installable file, `YaadAdz.aab` is for Google Play.
5. **Install.** Open the release on the Android phone, download `YaadAdz.apk`, allow "install unknown apps".

## Notes
- Until assetlinks.json is live, the app opens with a small browser address bar at the top. It still works.
- Keep the keystore secret safe. Lose it and you can't ship updates under the same signature.
- If you publish on Google Play with Play App Signing, add the SHA-256 shown under
  Play Console → App integrity → App signing to the `sha256_cert_fingerprints` list in assetlinks.json.
- Each build gets a higher version number automatically (the workflow run number).
