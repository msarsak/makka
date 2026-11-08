# ⚡ HEPHAESTION

Dein persönlicher KI-Butler im Hologramm-Look, inspiriert von J.A.R.V.I.S.
Er nennt dich „Boss“, hat Humor und läuft auf deinem Laptop. Später läuft er auch auf dem Handy.

---

## 🚀 Erster Start (Windows)

### 1. Node.js installieren (einmalig)
Node.js ist das Programm, das Hephaestion im Hintergrund ausführt.

- Gehe auf **https://nodejs.org** und lade die Version **„LTS“** herunter.
- Installieren: einfach immer „Weiter“ klicken.
- Prüfen: Öffne **PowerShell** (Windows-Taste → „PowerShell“) und tippe:

```bash
node -v
```

Kommt eine Zahl wie `v22.x.x` heraus, hat es geklappt.

### 2. Projekt herunterladen
- Auf GitHub: grüner Button **„Code“** → **„Download ZIP“**. Danach entpacken.
- Oder mit Git:

```bash
git clone https://github.com/msarsak/makka.git
```

### 3. API-Key eintragen
**Am einfachsten:** Doppelklick auf **`einrichten.bat`** – er fragt dich nach allen Keys und trägt sie richtig ein. Jederzeit wiederholbar.

Oder von Hand:
1. Im Projektordner die Datei **`.env.example`** kopieren und die Kopie in **`.env`** umbenennen.
   (Beim ersten Start macht `start.bat` das automatisch.)
2. `.env` mit dem Editor öffnen und deinen Key eintragen:
   ```
   ANTHROPIC_API_KEY=sk-ant-...dein-key...
   ```
3. Einen Key bekommst du auf **https://console.anthropic.com** → „API Keys“ → „Create Key“.
   Unter „Billing“ brauchst du etwas Guthaben (ein paar Euro reichen lange).

> 🔒 Die `.env` bleibt nur auf deinem Laptop. Sie wird **nie** hochgeladen (steht in `.gitignore`).
> Ohne Key startet Hephaestion im **Demo-Modus**: Design und Sounds laufen, die Antworten sind aber nur Platzhalter.

### 4. Starten
**Doppelklick auf `start.bat`**. Beim ersten Mal installiert er alles (ca. 1 Minute).
Danach öffnet sich der Browser auf **http://localhost:5173**. Klicke dort auf **„SYSTEM AKTIVIEREN“**.

### Key testen
Du weißt nicht, ob dein alter Key noch funktioniert? Öffne im Projektordner die PowerShell
(im Ordner: Shift + Rechtsklick → „PowerShell-Fenster hier öffnen“) und tippe:

```bash
npm run check-key
```

---

## 🎛 Bedienung

| Was | Wie |
|---|---|
| Nachricht senden | Tippen + **Enter** (neue Zeile: Shift + Enter) |
| Antwort abbrechen | **Esc** |
| **TURBO** | Erzwingt das starke Modell (Opus) für schwere Aufgaben |
| 🔊 | Sounds an/aus |
| **NEU** | Neues Gespräch starten |
| 🎙 oder **Klick auf den Kern** | Einmal sprechen (Klick während er spricht = Stopp) |
| **„Hey Hephaestion“ / „Hey Heph“** | Wake-Word: ruft ihn, wenn WAKE-WORD auf **AN** steht |
| **Esc** | Stoppt alles: Antwort, Vorlesen, Zuhören |

### 🎙 Sprache (ab Phase 2)
- Funktioniert in **Edge** und **Chrome**, nicht in Firefox. Edge hat die schönsten deutschen Stimmen (z. B. „Conrad“).
- Beim ersten Mal fragt der Browser, ob er das **Mikrofon** benutzen darf → **Zulassen**.
- Du kannst alles in einem Satz sagen: *„Hey Heph, wie wird das Wetter?“* – oder erst *„Hey Heph“*, warten bis der Kern rot wird, dann sprechen.
- Panel **SPRACHE**: Wake-Word an/aus, **VORLESEN** (*bei Sprache* = nur wenn du sprichst, *immer*, *aus*), Stimme wählen und testen.
- Während er spricht, hört er nicht zu (sonst würde er sich selbst hören). Zum Unterbrechen: auf den Kern klicken oder Esc.
- Die Spracherkennung läuft über den Browser-Dienst (Microsoft/Google) und braucht Internet.
- Am Handy geht das Mikrofon erst mit einer sicheren Verbindung (https). Das richten wir in Phase 6 mit Tailscale ein.

### 🧠 Gedächtnis (ab Phase 3)
- Trag in der `.env` den Pfad zu deinem Obsidian-Vault ein (ohne Anführungszeichen):
  ```
  OBSIDIAN_VAULT=C:\Users\DeinName\Documents\Obsidian\MeinVault
  ```
  Leer gelassen, legt er im Projektordner einen eigenen Vault `vault` an. Den kannst du in Obsidian mit „Ordner als Vault öffnen“ öffnen.
- Er schreibt **nur** in den Unterordner **`Hephaestion/`** und löscht nie etwas:
  - `Boss/` – Über mich, Vorlieben, Projekte, Ziele, Wie der Boss redet, Menschen
  - `Projekte/` – eine Notiz pro Projekt, verlinkt von „Projekte“
  - `Tagebuch/` – was er an welchem Tag gelernt hat (mit Links)
- **Vor jedem Gespräch** liest er diese Notizen. Eigene Notizen, die er immer lesen soll: `OBSIDIAN_CORE_NOTES=Über mich.md,Projekte/Mein Business.md`
- **Nach jeder Antwort** lernt er still dazu. Neues erscheint im Chat als „🧠 GEMERKT“.
- „**Merk dir, dass …**“ speichert sofort. „**Was steht in meinen Notizen über …**“ durchsucht den ganzen Vault.
- Du kannst alles in Obsidian selbst bearbeiten oder löschen – er liest beim nächsten Gespräch den neuen Stand.
- Passwörter, PINs, Bankdaten oder Keys speichert er nie.

### 🌍 3D-Erde (ab Phase 4)
- „**Zeig mir die Erde**“ öffnet die Hologramm-Erde. „**Geh nach New York**“, „**Flieg zum Eiffelturm**“ lässt die Kamera hinfliegen – mit goldenem Bogen von deinem Standort.
- „**Zeig mir die Straße**“ öffnet Street View am aktuellen Ort. „**Schließ die Erde**“ / „**Schließ alles**“ schließt die Fenster.
- Mit der Maus: ziehen = drehen, Mausrad = zoomen, Klick = Ort wählen. Fenster an der Titelleiste verschieben, ✕ schließt.
- **Street View eingebettet** braucht einen Google-Maps-Key in der `.env` (`GOOGLE_MAPS_API_KEY=`). Ohne Key gibt es einen Link zu Google Maps.

**Google-Maps-Key einrichten (ca. 10 Minuten, für dich kostenlos):**
1. https://console.cloud.google.com → oben „Projekt auswählen“ → „Neues Projekt“ (Name z. B. Hephaestion).
2. Links „APIs & Dienste“ → „Bibliothek“ → **„Maps Embed API“** aktivieren, dann **„Street View Static API“** aktivieren.
3. „APIs & Dienste“ → „Anmeldedaten“ → „Anmeldedaten erstellen“ → „API-Schlüssel“ → kopieren.
4. Key einschränken (wichtig!): Auf den Key klicken → „Anwendungseinschränkungen: Websites“ → `http://localhost:5173/*` und `http://localhost:3000/*` eintragen → „API-Einschränkungen“: nur die zwei APIs oben → Speichern.
5. In die `.env`: `GOOGLE_MAPS_API_KEY=dein-key` und Hephaestion neu starten.

Google verlangt beim ersten Mal eine Kreditkarte zur Identifizierung. Die Maps Embed API ist kostenlos, die Street-View-Abfragen auch – du zahlst dafür nichts.

### ✋ Kamera & Handgesten (ab Phase 5)
- Unten auf den **Hand-Knopf** klicken (oder sagen: „**Mach die Kamera an**“). Edge fragt nach der Kamera → **Zulassen**.
- Beim ersten Mal lädt er das Handmodell (ca. 8 MB, einmalig). Alles läuft **lokal** – das Kamerabild verlässt den Laptop nie.
- **Zeigefinger** = Cursor · **Daumen + Zeigefinger kurz zusammen** = Klick
- **Greifen + ziehen** = Fenster verschieben (an der Titelleiste) oder die Erde drehen
- **Mit beiden Händen greifen und auseinanderziehen** = Erde zoomen
- **Zeichenmodus** („Zeichenmodus“ sagen oder Knopf ZEICHNEN): greifen + malen → **Rechteck, Kreis, Linie** werden erkannt und als Hologramm angezeigt
- **Offene Hand ca. 1 Sekunde halten** (im Zeichenmodus) = alles löschen
- Tipp: Hand ca. 40–70 cm vor der Kamera, gutes Licht.

## 🔄 Updates mit einem Klick
Doppelklick auf **`update.bat`** (vorher Hephaestion schließen). Er holt die neueste Version von GitHub – deine `.env`, dein Gedächtnis und das Handmodell bleiben erhalten.

**Gehirn-Automatik:** Für normale Fragen nimmt er das schnelle, sehr günstige Modell (**Haiku**).
Bei Wörtern wie „analysiere“, „ausführlich“, „Konzept“, „Code“ oder bei langen Texten wechselt er
automatisch auf das starke Modell (**Opus**). Welches Modell gerade arbeitet, siehst du im Panel **SYSTEM**.

---

## 🎨 Anpassen

- **Farben:** `src/styles.css`, ganz oben (`--blue`, `--red`, `--gold` …)
- **Persönlichkeit:** `server/persona.js`
- **Modelle / Wetter-Stadt:** `.env` (`MODEL_FAST`, `MODEL_SMART`, `WEATHER_CITY`)
- **Wann er das starke Modell nimmt:** `server/router.js`

---

## 🗺 Ausbaustufen

- [x] **Phase 1:** HUD-Design, Energie-Kern, Sci-Fi-Sounds, Text-Chat mit Claude
- [x] **Phase 2:** Sprache rein und raus + Wake-Word „Hey Hephaestion“ / „Hey Heph“
- [x] **Phase 3:** Gedächtnis mit deinem Obsidian-Vault
- [x] **Phase 4:** 3D-Erde, Flüge zu Orten, Street View
- [x] **Phase 5:** Kamera und Handgesten
- [ ] **Phase 6:** n8n, Recherche, Handy-App (PWA)

---

## 🛠 Für Technik-Neugierige

```
server/      Node-Server: hält den API-Key, spricht mit Claude, Wetter
  index.js     Webserver und Endpunkte (/api/chat, /api/weather, /api/health)
  claude.js    Claude-Anbindung mit Live-Streaming und Demo-Modus
  persona.js   Persönlichkeit (System-Prompt)
  router.js    Auswahl: schnelles oder starkes Modell
  memory.js    Obsidian-Gedächtnis: lesen, suchen, sicher speichern
  learn.js     Lernt nach jeder Antwort automatisch dazu
  geo.js       Orte finden (OpenStreetMap) und Street View (Google)
  vision.js    Liefert die Handerkennung aus, lädt das Modell einmalig
src/         Web-App (das HUD)
  orb.js       Energie-Kern (Canvas, 60 FPS)
  sound.js     Sci-Fi-Sounds (Web Audio API, ohne Audiodateien)
  hud.js       Uhr, Wetter, Systemanzeigen
  chat.js      Chat-Verbindung und Anzeige
  voice.js     Spracherkennung, Wake-Word, Vorlesen, Mikrofon-Pegel
  voice-utils.js  Wake-Word-Erkennung, Satz-Zerlegung, Stimmenwahl
  earth.js     3D-Hologramm-Erde (globe.gl)
  windows.js   Schwebende, verschiebbare HUD-Fenster
  hands.js     Webcam + Handerkennung (MediaPipe, lokal)
  gestures.js  Gesten-Logik: Cursor, Greifen, Tippen, Zoom, Formerkennung
  gesture-ui.js  Gesten im HUD: Cursor, Kamerafenster, Zeichnungen
```

## 🔄 Neue Version holen
1. Neue ZIP herunterladen und entpacken (wie beim ersten Mal).
2. Deine **`.env`** aus dem alten Ordner in den neuen kopieren (sonst ist der API-Key weg).
3. Im neuen Ordner `start.bat` starten.

Befehle: `npm run dev` (Entwicklung), `npm start` (fertige Version auf Port 3000), `npm test` (Tests).
