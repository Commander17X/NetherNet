# NetherNet — App Store Connect metadata

Use the iPhone 6.9 inch marketing screenshots in `docs/screenshots/iphone-6.9/` (1320×2868) and the iPad 13 inch set in `docs/screenshots/ipad-13/` (2064×2752).

Bundle ID: `com.cuboagency.nethernet`  
Version: `1.0.0`  
SKU (suggestion): `nethernet-ios`

---

## Name

NetherNet

(30-character limit. This is 9 characters.)

## Subtitle

Join Java from your phone

(30-character limit. This is 25 characters.)

## Promotional text

Live MOTD, player counts, and one-tap join for Java and Bedrock servers. Trix Islands stays featured. Bedrock opens on any port. Java goes through a relay you host.

(170-character limit. This is 164 characters. You can change this later without a new app review.)

## Description

NetherNet is a server browser and launcher for iPhone and iPad. It lists Java and Bedrock servers, shows a live MOTD, player count, version, and ping, and opens the official Bedrock app so you can play with the usual touch controls.

Trix Islands (play.trix-islands.gg) stays pinned at the top of the list as a featured card, with its live status and favicon when the status API provides one. Add any other server as a hostname, a host and port, or an IPv6 address. Choose Java, Bedrock, or Auto. Auto checks both editions and keeps the one that answers. A plain domain follows SRV records; an explicit port always wins.

Bedrock servers open directly, including custom ports and domains with no port at all. Java servers go through a NetherNet relay that you host. The relay starts a short-lived Geyser session, then NetherNet opens a Bedrock link pointed at that session. A three-step join sheet walks through the check, the relay, and opening the game. Set the relay address, and an optional token, under Settings.

Favorite servers and the list you add are stored on the device. Pull to refresh status. Status comes from public server-status APIs (mcsrvstat.us, with mcstatus.io as a fallback).

NetherNet does not include a game client and does not ship official game assets. You need the official Bedrock app installed to play. Java joins also need a relay you run yourself.

Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.

## Keywords

servers,java,bedrock,motd,ping,relay,geyser,multiplayer,join,host,port,status,favorites,launcher

(100-character limit. This is 96 characters. Do not include "Minecraft" or "Mojang".)

## Category

- Primary: Utilities
- Secondary: Entertainment

This app is a server browser and launcher, not a game. Utilities is the safer primary category for App Review.

## What's New (1.0.0)

First release. Browse a featured server and your own list, read a live MOTD and player count, add Java or Bedrock hosts on any port, and join through a three-step sheet — directly on Bedrock, or through a relay you host for Java.

---

## Age rating answers

Answer the age-rating questionnaire for the NetherNet app itself, not for the game it opens. Suggested answers:

| Question | Answer |
| --- | --- |
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Profanity or Crude Humor | None |
| Mature or Suggestive Themes | None |
| Horror or Fear Themes | None |
| Medical or Treatment Information | None |
| Alcohol, Tobacco, or Drug Use or References | None |
| Simulated Gambling | None |
| Sexual Content or Nudity | None |
| Graphic Sexual Content and Nudity | None |
| Gambling and Contests | None |
| Unrestricted Web Access | No |
| User-Generated Content | No (users only type a server address for their own list; nothing is published to other NetherNet users) |
| Messaging and Chat | No (no in-app chat or messaging) |
| Advertising | No |
| Made for Kids | No |

Expected result: 4+. In the review notes, mention that play happens in the official Bedrock app, which has its own age rating, and that users can add any server address.

---

## App Privacy

Based on the code in this branch (`src/lib/statusService.ts`, `src/lib/relayClient.ts`, `src/lib/storage.ts`, `src/lib/joinUrl.ts`, `src/lib/faviconCache.ts`, `app.json`). Nothing is sent to a NetherNet-operated account or analytics backend. The app has no sign-in.

### Data Used to Track You

None. No tracking, no advertising identifier, no analytics SDK.

### Data Linked to You

None. The app does not create an account or attach a user identity to anything it sends.

### Data Not Linked to You

None. Answer **No, we do not collect data from this app**.

Apple counts data as collected only when it leaves the device in a way that lets the developer or its partners keep it longer than needed to answer the request in real time. NetherNet has no backend of its own. The hostnames below go to public status APIs only to answer that one lookup, and the relay is a server the user runs themselves.

What actually leaves the device:

1. **Server status APIs (HTTPS)**  
   `https://api.mcsrvstat.us` (primary) and `https://api.mcstatus.io` (fallback).  
   The app sends the server hostname and optional port, plus the edition (Java or Bedrock), so it can show MOTD, player count, version, favicon, and ping. This happens for the featured server `play.trix-islands.gg` on its own, and for any server the user adds. Pulled on list load, pull-to-refresh, the server detail screen, the join flow, and the Add screen "Check" action. Favicons returned by those APIs are cached on the device.

2. **User-configured relay (HTTP or HTTPS)**  
   Only if the user saves a relay address under Settings. The phone calls that address for:
   - `GET /health` (relay check)
   - `GET /servers` (optional public server list)
   - `POST /sessions` with the Java server's name, host, port, and login mode (`online` or `offline`)
   - `GET /sessions/{id}` while a session starts  
   If the user also saved a relay token, it is sent as an `Authorization: Bearer` header. The token is stored on device only.

3. **On-device storage only**  
   Saved servers, favorite IDs, relay URL, relay token, and cached favicons are written to AsyncStorage on the device. They are not uploaded to a NetherNet service.

4. **Opening the game**  
   After a successful join setup, the app opens a `minecraft://?addExternalServer=...` link so the official Bedrock app can add the host and port. NetherNet does not collect a game account or login.

Privacy Policy URL: https://commander17x.github.io/NetherNet/privacy/
Support URL: https://commander17x.github.io/NetherNet/support/

Hostnames are sent to the status APIs, and to a relay the user configures. Both pages are in `docs/` and published with GitHub Pages.

Privacy label in App Store Connect: **Data Not Collected**.

---

## Export compliance (encryption)

**Does the app use encryption?** Yes, only standard HTTPS (TLS) to the public status APIs, and HTTPS if the user points the relay at an `https://` address.

**Is it exempt?** Yes. This is encryption limited to official operating-system HTTPS / TLS. No custom or proprietary crypto, no end-to-end messaging crypto.

`ITSAppUsesNonExemptEncryption` is already set to `false` in `app.json`. In App Store Connect, choose the exemption for standard encryption in HTTPS. You do not need an ERN.

The app also allows plain HTTP (`NSAllowsArbitraryLoads`) so a relay on a local network can work during setup. Prefer HTTPS once a relay is on the public internet.

---

## Notes for the reviewer

NetherNet is a server browser and launcher. It is not a game client and does not include official game assets or a copy of the game.

To play, the official Minecraft Bedrock Edition app must be installed on the device. Tapping Join opens a three-step sheet. On a Bedrock server the middle step is skipped and a `minecraft://` link adds the host and port (including a custom port, or the default 19132 when only a domain is given) and hands off to that app.

Java servers are not opened directly. They go through a relay the user hosts (the open-source Geyser standalone process managed by the NetherNet relay in this project). The app asks that relay for a short-lived session, then opens the same kind of Bedrock link pointed at the relay. There is no public NetherNet relay bundled for review, so Java join cannot be fully tested on a fresh device without a relay URL. Bedrock join can be tested without a relay:

1. Open the app. The featured server Trix Islands (`play.trix-islands.gg`) is pinned at the top as a hero card and should show a live MOTD, an Online pill, player count, and ping.
2. Go to Add, enter a Bedrock host, optionally with a custom port, set Edition to Bedrock, and save.
3. Open that server and tap Join, then Open Minecraft (requires the official Bedrock app).

Settings is where a reviewer would paste a relay base URL (for example `http://192.168.1.20:8787`) and an optional token, then use Save and check.

NetherNet is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

## Screenshot set

Marketing images are editorial product shots: Inter typography, a small NetherNet wordmark, a dark background with amber glow and soft block shapes, and a realistic black-titanium device frame (Dynamic Island on iPhone, front camera on iPad) with a 9:41 status bar, shadow, and a light glass reflection. Headlines do not use the word Minecraft and do not include any Mojang or Microsoft marks.

iPhone 6.9" (1320×2868):

1. `docs/screenshots/iphone-6.9/01-server-list.png` — Panoramic hero. “Any Java server. One tap away.” Featured Trix Islands card, live MOTD and status pills.
2. `docs/screenshots/iphone-6.9/02-server-detail.png` — Tilted device. “See who’s on before you join.”
3. `docs/screenshots/iphone-6.9/03-add-server.png` — Straight premium mockup. “Any host. Any port.” Bedrock edition, custom port 19142.
4. `docs/screenshots/iphone-6.9/04-join.png` — Two overlapping devices. “Relay on. Ready to join.” Front phone shows the three-step join sheet in the ready state.
5. `docs/screenshots/iphone-6.9/05-settings.png` — Opposite tilt. “Your relay. Your rules.”

iPad 13" (2064×2752): not in this repository yet. Only the iPhone 6.9 inch marketing images were added, under `docs/screenshots/iphone-6.9/`.

### How these were captured

The Expo web build was run and captured with headless Chromium at the official point sizes (iPhone 440×956 @3x, iPad 1032×1376 @2x). The redesigned web UI rendered fully (system typography, amber accent, blurred icon tab bar, hero card, status pills, three-step join sheet). No native-only screen failed.

A web-only React hydration toast (`#error-toast`, from a nested `<button>` in the hero card) was hidden before capture. That toast is not part of the iOS app.

Live data:

- Status for `play.trix-islands.gg` was fetched from the real status APIs at capture time (morning of 19 November 2026, Europe/Amsterdam). The server was online with MOTD “TRIX-ISLANDS.GG | Lobby · BoxPvP · Party · Creators”, version Lattice 26.3, and 0/1000 players. That 0 is real, not mocked.
- The status APIs (mcsrvstat.us, mcstatus.io) did not return a favicon for Trix Islands. A direct Java Server List Ping was also tried against the resolved host 151.243.241.250:2788 (hostname play.trix-islands.gg, protocol versions 47–773, via python mcstatus). The status JSON included version, players, and description/MOTD, but no favicon field. The hero and detail screens therefore show the app’s letter-tile fallback (“T”). A real icon was not invented. The app will show a favicon when the server or a status API provides a PNG one.

Mocked only so the Join and Settings screens could show a healthy relay (no relay was running on the capture machine):

- Browser-intercepted `http://192.168.1.20:8787` `/health` and `/sessions` responses. Health: Geyser installed, public host 192.168.1.20, 1 open session. The join sheet for Trix Islands therefore shows all three steps done and the relay Bedrock address `192.168.1.20:19132`.
- Settings were seeded with that relay URL, then “Save and check” was tapped so the green health line is visible.
- Trix Islands was marked as a favorite (detail shows Unfavorite).
- The Add screen was filled (not saved) with a sample Bedrock host `play.weekend-realm.gg:19142` and Edition set to Bedrock, to show a custom port.

A 9:41 status bar, Dynamic Island (iPhone), and home indicator were drawn only on the marketing frames, not in the raw captures.

Still needed from you before submit: an Apple Developer Program account, and an App Store Connect API key (or Expo login that can upload). Privacy and support URLs are https://commander17x.github.io/NetherNet/privacy/ and https://commander17x.github.io/NetherNet/support/. `ITSAppUsesNonExemptEncryption` is already false in the app.
