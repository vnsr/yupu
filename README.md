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

## v3.0.0 (1 Oct 2026)
- **Timer sync:** a running sleep or feed timer shows on both phones (with the name of the phone that started it); either phone can stop it, move its start, or discard it. Stopping on both phones still gives one entry. Needs automatic sync on both phones, both on v3.
- **Checks tab:** U-checks U1–U9 (G-BA windows) and the STIKO 2026 infant vaccinations, worked out from the birth date. Anything already mentioned in your log counts as done (e.g. "U4" in a note, "Vaccine: RV"). Tap an item to log the date; "Not planned" hides a vaccine from reminders. The Today screen shows one line when something is due.
- **Add to calendar:** Checks → Add to calendar creates an .ics file. Save it to Files, tap it, and choose Add All. Re-exporting later updates the same events in most calendars; delete old ones if you see duplicates.
- **Export names** now include date, time and phone: `yupu-backup-2026-10-01_1504-Viraj.json`, `yupu-export-2026-10-01_1504.csv`.
- **Swipe down** to close Settings and any entry sheet.
- **New icon.** Three options are in `icon-options/` (A is in the app by default). To switch, copy that option's `icon-180.png`, `icon-192.png`, `icon-512.png` over the ones in the app repo. iPhone keeps the old home-screen icon until you remove the app icon and add it again from Safari — back up first, since that also clears the app's data on the phone (or rely on automatic sync).

## v3.1.0 (1 Oct 2026)
- **Visit summary** (Checks → Visit summary): one page for the paediatrician covering the last 7/14/30 days — feeding, sleep, diapers, solids, temperatures, medication, growth with percentiles, vaccinations, U-checks and your questions. Print or save as PDF, share as a file, or share as text. Averages only count days that have entries.
- **German interface**: Settings → Language → Deutsch. Per phone; stored data stays the same, so mixed languages across the two phones are fine.
- **Search** in History across every entry (notes, foods, medication, who logged it).
- **Forgotten-timer guard**: a sleep over 14 h or a feed over 90 min asks "Still going?" and lets you set the real end time.
- **Time since medication** on Today for anything logged as "Medication: …" in the last 48 h, with "Log again". Times only, no dosing advice.
- **Night light on a schedule** (Settings → Night light → On a schedule). At night the main buttons get bigger and move above the clock. The moon button turns it off until the morning.
- **Insights**: longest stretch last night (Today + Trends chart), "usually naps after about …" from the last 7 days, and a last-7-days-vs-previous-7 card in Trends (also on Today on Sundays).
- **Change history**: every edit keeps the previous version (who/when), restorable from the entry. **Recently deleted** (Settings → Data) restores anything deleted in the last 30 days on either phone.
- **Check data** (Settings → Data): finds duplicates, a sleep inside another sleep, overlaps and odd durations, with one-tap fixes (all restorable).
- **Storage moved to IndexedDB**. On first start of 3.1 your data is copied over and checked; the old copy is kept on the phone as a fallback. Settings → Storage shows "saved in IndexedDB".
- **Monthly restore point** in the private sync repo (`yupu/snapshots/`), Settings → Automatic sync → Restore points. Restoring brings back entries that are missing or deleted; it never overwrites newer edits.

Update both phones to 3.1: a phone still on 3.0 can sync fine, but an edit made there won't carry the version history.
