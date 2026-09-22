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

## Syncing the two phones (shared iCloud Drive folder)
One-time setup: on either phone, Files app → iCloud Drive → New Folder (e.g. "Yupu Backups") →
long-press it → Share → add your partner → they accept the invite once.

Ongoing: in the app, Settings → Share backup → Save to Files → the shared folder.
On the other phone, Settings → Import backup → pick the latest file from that folder.
Imports merge by entry: new entries are added, the newer version of an edited entry wins,
deletions carry over. Either phone can back up any time; the other imports whenever convenient.

(AirDrop works the same way too, if you'd rather send the file directly instead of using a shared folder.)

## Backups
iOS can clear web-app storage in rare cases. The app nudges you after 7 days without a backup;
keep the latest .json in iCloud Drive.

## Updating the app
Replace index.html in the repo. The phone picks up the new version on the second launch
while online (first launch downloads it, second one uses it).

## Alternative host
Netlify Drop (app.netlify.com/drop): drag this folder in, get an https link, same steps 4–7.

## Importing from Nara Baby (one time, repeatable)
In Nara: export your data as CSV and save it to Files.
In Yupu baby: Settings → Just import → pick the Nara .csv file.
Feeds, sleep, diapers (with temperatures found in notes), bottles, growth, meds, vaccines,
routines and pumping all come across. Entries already logged in Yupu baby within 5 minutes
of a Nara entry are skipped as duplicates, and importing a newer Nara export later only adds what's new.
Import on one phone, then use Sync now so the other phone gets it too.

## Automatic sync (v2)
Needs: a PRIVATE repo (e.g. `yupu-data`) and one fine-grained token per phone
(Repository access: only `yupu-data`; Contents: Read and write).
On each phone: Settings → Automatic sync → Repository `username/yupu-data` → paste that phone's token → Test and turn on.
Turn it on first on the phone with the full history, then on the second phone.
Data is stored as one file per month in the `yupu/` folder of the private repo.
Syncs on app open, ~15 s after each entry, and every minute while open. iPhone does not allow background sync.
If a token expires: Settings → Turn off or change token → turn on again with a new token.
