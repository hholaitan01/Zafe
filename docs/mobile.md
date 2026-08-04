# TrustFlow on mobile

TrustFlow ships to phones two ways. Both work from the same codebase.

1. **Installable PWA** — works today, on both iOS and Android, no store account or Mac needed.
2. **Native App Store / Play Store apps** — via Capacitor, built on a Mac.

---

## 1. Installable PWA (already live)

The web app is a full Progressive Web App: manifest, brand icons, standalone
display, a launch splash, and an offline fallback. Nothing to build.

**Install it:**

- **Android (Chrome):** open the site, then the browser shows "Install app", or use the menu → **Install app / Add to Home screen**.
- **iOS (Safari):** open the site, tap **Share**, then **Add to Home Screen**.

Once installed it launches full-screen with the TrustFlow icon and its own
splash, and behaves like a native app. A service worker (`public/sw.js`) caches
static assets and shows an offline page when there is no network. It **never**
caches API or authenticated responses, so it can never serve stale deal or
balance data.

**Put it on the Play Store without a rewrite:** wrap the PWA as a Trusted Web
Activity with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap):

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR-DEPLOYMENT/manifest.webmanifest
bubblewrap build
```

That produces a signed `.aab` you can upload to the Play Console. (iOS has no
PWA-to-store path, so for the App Store use Capacitor below.)

---

## 2. Native apps with Capacitor

Capacitor wraps the **deployed** web app in native iOS and Android shells. Since
TrustFlow is server-rendered (API routes, SSR, auth middleware, ALAT webhooks),
the shell loads the live site over `server.url` rather than a static bundle.

### Prerequisites

- **Android:** Android Studio (any OS).
- **iOS:** a **Mac** with Xcode and CocoaPods (`sudo gem install cocoapods`). iOS
  cannot be built on Linux or Windows.
- Deps are already in `package.json` (`@capacitor/core`, `cli`, `ios`, `android`).

### One-time setup

1. **Point the shell at your deployment.** Edit `capacitor.config.ts` and set
   `server.url` to your real URL (or export `CAP_SERVER_URL`), for example:

   ```ts
   server: { url: "https://trustflow.vercel.app", cleartext: false }
   ```

2. **Add the native projects** (run on your own machine, not in CI):

   ```bash
   npm install
   npx cap add android
   npx cap add ios       # Mac only
   npx cap sync
   ```

   This creates `android/` and `ios/` folders (real Gradle and Xcode projects).

### Build and run

```bash
npm run mobile:android   # cap sync android && cap open android  → Android Studio
npm run mobile:ios       # cap sync ios && cap open ios          → Xcode (Mac)
```

In Android Studio: **Run** to a device/emulator, or **Build → Generate Signed
Bundle** for the Play Store.
In Xcode: set your **Team** under Signing & Capabilities, then **Product →
Archive** for the App Store.

### App identity

- **Bundle id / appId:** `app.trustflow.escrow` (in `capacitor.config.ts`).
  Change it to your own reverse-domain id before publishing.
- **App icon and splash:** drop a 1024×1024 PNG in and run
  [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets)
  (`npx @capacitor/assets generate`) to produce every icon and splash size. The
  source shield lives in `public/icons/`.

### Store review note

Apple guideline 4.2 can reject apps that are only a thin website wrapper. Give
the native build a reason to exist beyond the WebView. Good low-effort adds,
each an official Capacitor plugin:

- `@capacitor/push-notifications` — deal status and payout alerts.
- `@capacitor/biometric` (or a community plugin) — Face ID / fingerprint to
  unlock and to authorise a release.
- `@capacitor/share` — share a receipt to WhatsApp natively.
- `@capacitor/status-bar` + `@capacitor/splash-screen` — native chrome polish.

Wire at least push + biometric unlock before submitting to iOS.

---

## Which one to use

- **Demo / fastest reach:** the PWA. It is installable on both
  platforms right now.
- **App Store + Play Store presence:** Capacitor. Do the Play Store first (no
  Mac needed for Android), then iOS from a Mac.
