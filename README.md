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
- [ ] **Phase 2:** Sprache rein und raus + Wake-Word „Hey Hephaestion“ / „Hey Heph“
- [ ] **Phase 3:** Gedächtnis mit deinem Obsidian-Vault
- [ ] **Phase 4:** 3D-Erde, Flüge zu Orten, Street View
- [ ] **Phase 5:** Kamera und Handgesten
- [ ] **Phase 6:** n8n, Recherche, Handy-App (PWA)

---

## 🛠 Für Technik-Neugierige

```
server/      Node-Server: hält den API-Key, spricht mit Claude, Wetter
  index.js     Webserver und Endpunkte (/api/chat, /api/weather, /api/health)
  claude.js    Claude-Anbindung mit Live-Streaming und Demo-Modus
  persona.js   Persönlichkeit (System-Prompt)
  router.js    Auswahl: schnelles oder starkes Modell
src/         Web-App (das HUD)
  orb.js       Energie-Kern (Canvas, 60 FPS)
  sound.js     Sci-Fi-Sounds (Web Audio API, ohne Audiodateien)
  hud.js       Uhr, Wetter, Systemanzeigen
  chat.js      Chat-Verbindung und Anzeige
```

Befehle: `npm run dev` (Entwicklung), `npm start` (fertige Version auf Port 3000), `npm test` (Tests).
