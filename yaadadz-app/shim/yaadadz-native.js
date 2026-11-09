/* Runs only inside the Android app. Adds native behaviour without changing the website's own code. */
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;

  document.documentElement.classList.add('is-native-app');
  var P = C.Plugins || {};

  try {
    if (P.StatusBar) {
      P.StatusBar.setBackgroundColor({ color: '#071b13' });
      P.StatusBar.setStyle({ style: 'DARK' });
    }
  } catch (e) {}

  try { if (P.SplashScreen) P.SplashScreen.hide(); } catch (e) {}

  // yaadadz.com links opened from other apps (WhatsApp shares, Google login return, email confirmation)
  // arrive here. Load them inside the app so the user stays in the app and the session is picked up.
  try {
    if (P.App) {
      P.App.addListener('appUrlOpen', function (ev) {
        try {
          var u = new URL(ev.url);
          if (u.hostname !== 'yaadadz.com') return;
          var target = u.pathname + u.search + u.hash;
          if (target === location.pathname + location.search + location.hash) return;
          var hashOnly = u.pathname === location.pathname && u.search === location.search;
          location.replace(target);
          if (hashOnly) setTimeout(function () { location.reload(); }, 60);
        } catch (e) {}
      });
    }
  } catch (e) {}
})();
