# ⚡ Skovalearnings

Kostenlose Lern-App im Superhelden-Comic-Stil (Rot / Blau / Gelb).
Lerne **Politik, Allgemeinwissen, Länder, Kriege, Geschichte, Wissenschaft, Weltraum, Natur, Geld und Technik** – einfach erklärt, mit Bildern, Animationen, Quiz und YouTube-Videos.

## Funktionen
- 📚 10 Themenbereiche mit 30 Lektionen (Lernkarten + Quiz)
- 🖼️ Echte Bilder automatisch von Wikipedia (kostenlos, ohne Anmeldung)
- 📺 Video-Bereich mit YouTube-Links zu jedem Thema + empfohlene Kanäle
- 🎯 Schnellquiz mit Combo-Bonus, XP, Levels, Tages-Streak und Tagesziel
- 💥 Comic-Effekte (POW! BÄM!), Konfetti, Sounds, Vibration
- 🔊 Vorlesefunktion (deutsche Stimme des Geräts)
- 🔍 Suche über alle Lektionen
- ⚙️ Viele Einstellungen: 4 Designs (Held, Spinnen-Netz, Nacht, Hell), Textgröße, Animationen, Effekte, Sound, Vorlesen, Tagesziel, Lieblingsthemen …
- 📲 Installierbar als App (PWA) und offline nutzbar

## Kostenlos online stellen (GitHub Pages)
1. Auf GitHub im Repo: **Settings → Pages**
2. Bei „Branch“ den Branch mit der App wählen, Ordner `/ (root)` → **Save**
3. Nach 1–2 Minuten ist die App unter `https://<dein-name>.github.io/makka/` erreichbar
4. Auf dem Handy öffnen → Browser-Menü → **„Zum Startbildschirm hinzufügen“**

## Lokal testen
```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Neue Lektionen hinzufügen
Alle Inhalte stehen in `js/data.js`. Einfach eine neue Lektion nach dem gleichen Muster in eine Kategorie kopieren.
