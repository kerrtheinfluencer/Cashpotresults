# Yaad Adz Android app

A Capacitor app. Each build copies the current yaadadz.com site code (kerrtheinfluencer/yaadads) into the
APK, so the app's screens load from the phone itself; listings, accounts and search still talk to Supabase live.

- Build: Actions tab -> "Build Yaad Adz app (Android)" -> Run workflow. Output is on the Releases page.
- After you change the website, run the workflow again to ship that change inside the app.
- Needs repo secrets ANDROID_KEYSTORE_BASE64 and ANDROID_KEYSTORE_PASSWORD.
- AdSense is removed from the app copy (Google doesn't allow it in apps).
- For Google-login return and tap-to-open yaadadz.com links, `.well-known/assetlinks.json` must be live on yaadadz.com.
