# Yupu baby – private baby log (offline PWA)

All data stays in the app on each iPhone. Nothing is sent anywhere.

## Install (once, ~10 min)
1. Create a free GitHub account, then a new **public** repository, e.g. `yupu`.
   (The code is public; your baby's data never leaves the phone.)
2. Upload all files from this folder (index.html, sw.js, manifest.webmanifest, the 3 icons).
3. Repo → Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)` → Save.
4. After ~1 minute open `https://<your-username>.github.io/yupu/` in **Safari** on the iPhone.
5. Share button → **Add to Home Screen**. Always open Yupu baby from that icon.
   The home-screen app keeps its own data, separate from Safari.
6. Open it once while online; after that it works in airplane mode.
7. Repeat steps 4–6 on your partner's iPhone.

## Syncing the two phones
Settings → Share backup → AirDrop/WhatsApp the .json file to the other phone →
save to Files → on that phone Settings → Import backup.
Imports merge by entry: new entries are added, the newer version of an edited entry wins,
deletions carry over. Do it in both directions when you want both phones complete.

## Backups
iOS can clear web-app storage in rare cases. The app nudges you after 7 days without a backup;
keep the latest .json in iCloud Drive.

## Updating the app
Replace index.html in the repo. The phone picks up the new version on the second launch
while online (first launch downloads it, second one uses it).

## Alternative host
Netlify Drop (app.netlify.com/drop): drag this folder in, get an https link, same steps 4–7.
