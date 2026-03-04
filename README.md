# Braze Web SDK Page

A webpage that collects a Braze User ID, a Braze SDK Endpoint and a Braze Web SDK key, initializes the Braze Web SDK for that user, and displays Braze messaging surfaces including In-Browser Messages, Content Cards, and Banners.

## Pages

- `index.html`: collects the Braze `external_id`, SDK endpoint, and Web SDK key.
- `viewer.html`: blank page that initializes the Braze Web SDK and lets Braze render supported surfaces.

## Behavior

- The form stores the Braze configuration in `localStorage` and redirects to `viewer.html`.
- The form includes a `Start over` action that clears the stored config and requests a Braze SDK reset for the next viewer session.
- The viewer initializes the Braze Web SDK, calls `changeUser(...)`, opens a session, and requests:
  - in-app messages via the native Braze display behavior
  - Content Cards via Braze's default UI
  - Banners for the fixed placement ID `demo-banner`
- Banner rendering is enabled with Braze's `allowUserSuppliedJavascript` initialization option, which this test page turns on intentionally so Braze banner creatives can display.
- For easier QA of `session_start` campaigns, the viewer uses `sessionTimeoutInSeconds: 1` and `minimumIntervalBetweenTriggerActionsInSeconds: 0` so a restarted test session can trigger again almost immediately.
- For Content Cards QA, the viewer logs the cached card state immediately, performs an explicit refresh, and retries once after 3 seconds if the first refresh still returns no cards.
- The page contains a hidden `div#demo-banner`; it stays hidden when no banner is returned.
- All diagnostic output is written to the browser console.
- Before each new viewer session, the page attempts to clear previous Braze browser state using SDK reset methods when they are exposed by the loaded SDK build.

## Assumption

This implementation assumes your Braze banner placement ID is `demo-banner`. If your Braze dashboard uses a different placement ID, update `BANNER_PLACEMENT_ID` in `/src/config.js`.

## Run locally

Serve the repository with any static file server. For example:

```bash
python3 -m http.server 3000
```

Then open [http://localhost:3000](http://localhost:3000).
