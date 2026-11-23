# Monarc Visionz – Notizen für Claude

Monarc Visionz (Makka Sarsakova, Salzburg; Team: Amin, Benjamin) verkauft kleinen Betrieben Websites und Automationen:
Website (900 € + 50 €/Monat), Verpasste Anrufe → SMS mit Anfrage-Link (500 € + 100 €/Monat),
Google-Bewertungen automatisch (400 € + 100 €/Monat), Online-Terminbuchung (Preis offen), KI-Chat (800 € + 100 €/Monat).
Kontakt in Mails: +43 699 11178258 · businessmonarcvisionz@gmail.com · monarcvisionz.netlify.app

## Ticket-Board: https://monarcticket.netlify.app
- Eine einzelne Datei: `monarc-tickets/index.html`. Makka zieht sie per Drag-and-Drop auf Netlify. Kein Passwort, kein Server.
- Firmen kommen live aus diesem Repo: Branch `claude/wizardly-pascal-1r8g1u`, `leads/index.json` + `leads/<datum>.json`
  (über raw.githubusercontent.com). Die ersten 30 Firmen (23.11.2026) stecken zusätzlich fest in der Datei.
- Status, Zuständig, Notizen, Termine speichert die Seite nur im Browser (localStorage `mv_state`), nicht geteilt.
- Makka will im Ticket KEINEN E-Mail-Bereich (kein Mailtext, kein Kopieren, kein „In Mail-Programm öffnen“). Mails gibt es nur als PDF.
- Änderungen an der Seite: `monarc-tickets/index.html` bearbeiten, testen, Makka die Datei schicken.
  Keine einzelnen Dateien in eine Netlify-Seite mit Server hochladen lassen (löscht den Server-Teil).
- `monarc-tickets/public/` + `netlify/functions/` = alternative Version mit Server (Netlify Blobs), braucht Git-Deploy. Zurzeit nicht im Einsatz.

## Tägliche Firmensuche
- Geplante Aufgabe „Monarc: 30 neue Firmen + Mails“ (Mo–Sa 6:37 Europe/Vienna): 30 neue Firmen (15 AT, 15 DE),
  `leads/<datum>.json` schreiben, `python3 leads/make_pdf.py leads/<datum>.json` (PDF + Mails in JSON + index.json), pushen, PDF an Makka.
- Keine Firma doppelt; E-Mails nur von echten öffentlichen Quellen; niemals Mails an Firmen selbst senden.

## Stil
- Mit Makka auf Deutsch, kurz und einfach, Handy-tauglich. Mails an Firmen: „Sie“, AT „Grüß Gott,“, DE „Guten Tag,“.
