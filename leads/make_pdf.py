"""Erzeugt aus leads/<datum>.json eine PDF mit fertigen E-Mails (Monarc Visionz).
Aufruf: python3 leads/make_pdf.py leads/2026-11-23.json
Schreibt außerdem die Mails in die JSON und trägt sie in leads/index.json ein (daraus lädt das Ticket-Board).
"""
import json, sys, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from xml.sax.saxutils import escape

pdfmetrics.registerFont(TTFont("DV", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

SIGNATUR = "Makka Sarsakova\nMonarc Visionz\n+43 699 11178258\nbusinessmonarcvisionz@gmail.com\nmonarcvisionz.netlify.app"
HANDWERK = ("elektri", "install", "schloss", "metall", "dachdeck", "fliesen", "gärtner", "garten", "kfz", "maler", "tischler", "spengler", "boden")

def bullets(t):
    b = (t.get("branche") or "").lower()
    out = []
    for n in t["needs"]:
        if n == "website":
            if "blumen" in b:
                out.append("Eine schöne Website mit Fotos Ihrer Sträuße, die am Handy gut aussieht und bei Google gefunden wird, gerne mit Online-Bestellung")
            elif "immobil" in b:
                out.append("Eine moderne Website mit Ihren aktuellen Objekten, die am Handy gut aussieht und bei Google gefunden wird")
            elif any(k in b for k in HANDWERK):
                out.append("Eine klare Website mit Fotos Ihrer Arbeiten und einem einfachen Anfrageformular, gut auffindbar bei Google in Ihrer Region")
            else:
                out.append("Eine moderne Website mit Ihren Leistungen, Preisen und Öffnungszeiten, die am Handy gut aussieht und bei Google gefunden wird")
        elif n == "anrufe":
            out.append("Verpasste Anrufe automatisch auffangen: Wenn Sie gerade arbeiten und nicht abheben können, bekommt der Anrufer sofort eine SMS mit einem Anfrage-Link. So geht kein Kunde mehr zur Konkurrenz")
        elif n == "bewertungen":
            out.append("Mehr Google-Bewertungen: Nach jedem Auftrag bekommen Ihre Kunden automatisch eine freundliche Bitte um eine Bewertung. Mehr Sterne bringen mehr neue Kunden")
        elif n == "termin":
            out.append("Online-Terminbuchung: Ihre Kunden buchen selbst, auch am Abend, und Sie müssen während der Arbeit nicht mehr ans Telefon")
        elif n == "chat":
            out.append("Ein KI-Assistent auf der Website oder WhatsApp, der Fragen rund um die Uhr beantwortet und Ihnen eine kurze Zusammenfassung schickt")
    return out

def mail(t):
    gruss = "Grüß Gott," if t.get("land") == "AT" else "Guten Tag,"
    subject = f"Kurze Idee für {t['betrieb']}"
    body = (f"{gruss}\n\n"
            "mein Name ist Makka Sarsakova von Monarc Visionz aus Salzburg. Wir bauen für kleine Betriebe Websites und einfache Automationen, die Zeit sparen und neue Kunden bringen.\n\n"
            f"{t['hook']}\n\n"
            f"Für {t['betrieb']} hätte ich konkret diese Ideen:\n"
            + "\n".join("- " + x for x in bullets(t)) +
            "\n\nGerne mache ich Ihnen kostenlos und ganz unverbindlich einen ersten Entwurf, damit Sie sich das gut vorstellen können.\n\n"
            "Hätten Sie diese oder nächste Woche 10 Minuten Zeit für ein kurzes Telefonat?\n\n"
            "Mit freundlichen Grüßen\n" + SIGNATUR)
    return subject, body

NL = {"website":"Website","anrufe":"Verpasste Anrufe","bewertungen":"Google-Bewertungen","termin":"Online-Terminbuchung","chat":"KI-Chat"}

def update_json(path, firms):
    """Schreibt die fertige Mail in die JSON (für das Ticket-Board) und trägt die Datei in leads/index.json ein."""
    for t in firms:
        s, b = mail(t)
        t["mail"] = f"Betreff: {s}\n\n{b}"
        t["angebot"] = ", ".join(NL[n] for n in t["needs"])
    json.dump(firms, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    idx_path = os.path.join(os.path.dirname(path), "index.json")
    idx = json.load(open(idx_path, encoding="utf-8")) if os.path.exists(idx_path) else {"files": []}
    name = os.path.basename(path)
    if name not in idx["files"]:
        idx["files"] = sorted(idx["files"] + [name])
    json.dump(idx, open(idx_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

def main(path):
    firms = json.load(open(path, encoding="utf-8"))
    update_json(path, firms)
    datum = os.path.splitext(os.path.basename(path))[0]
    out = os.path.join(os.path.dirname(path), f"Monarc_Mails_{datum}.pdf")
    accent = colors.HexColor("#5b3fd9")
    H = ParagraphStyle("h", fontName="DVB", fontSize=20, leading=25, spaceAfter=4)
    S = ParagraphStyle("s", fontName="DV", fontSize=10, textColor=colors.HexColor("#615c7a"), leading=14)
    L = ParagraphStyle("l", fontName="DVB", fontSize=8, textColor=colors.HexColor("#615c7a"), leading=11, spaceBefore=8)
    V = ParagraphStyle("v", fontName="DV", fontSize=10.5, leading=15)
    T = ParagraphStyle("t", fontName="DVB", fontSize=15, leading=19)
    C = ParagraphStyle("c", fontName="DV", fontSize=8.5, leading=11)
    box = lambda txt: Table([[Paragraph(escape(txt).replace("\n", "<br/>"), V)]], colWidths=[174*mm],
        style=TableStyle([("BOX", (0,0), (-1,-1), 0.6, colors.HexColor("#d9d4ee")), ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#f8f7fc")),
                          ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8), ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 7)]))
    story = [Paragraph(f"{len(firms)} E-Mails zum Kopieren", H),
             Paragraph(f"Monarc Visionz · Leads vom {datum[8:10]}.{datum[5:7]}.{datum[:4]} · Je Seite eine Firma: Adresse, Betreff und Text einzeln kopieren, einfügen, senden.", S), Spacer(1, 8)]
    rows = [[Paragraph("<b>Nr.</b>", C), Paragraph("<b>Firma</b>", C), Paragraph("<b>Ort</b>", C), Paragraph("<b>E-Mail</b>", C), Paragraph("<b>✓</b>", C)]]
    for t in firms:
        rows.append([Paragraph(t["id"], C), Paragraph(escape(t["betrieb"]), C), Paragraph(escape(t["ort"]), C), Paragraph(escape(t["email"]), C), ""])
    story.append(Table(rows, colWidths=[18*mm, 68*mm, 32*mm, 52*mm, 8*mm], repeatRows=1,
        style=TableStyle([("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#e2dfee")), ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#ece8ff")), ("VALIGN", (0,0), (-1,-1), "MIDDLE")])))
    for t in firms:
        subject, body = mail(t)
        story += [PageBreak(),
                  Paragraph(f'<font color="#5b3fd9">{t["id"]}</font> · {escape(t["branche"])} · {escape(t["ort"])} · Tel. {escape(t.get("telefon",""))}', S),
                  Paragraph(escape(t["betrieb"]), T),
                  Paragraph("AN (E-MAIL-ADRESSE)", L), box(t["email"]),
                  Paragraph("BETREFF", L), box(subject),
                  Paragraph("TEXT", L), box(body)]
    def deco(c, d):
        c.setFillColor(accent); c.rect(0, A4[1]-6, A4[0], 6, fill=1, stroke=0)
        c.setFont("DV", 8); c.setFillColor(colors.HexColor("#8a85a3")); c.drawRightString(A4[0]-18*mm, 10*mm, f"Monarc Visionz · Seite {d.page}")
    SimpleDocTemplate(out, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm,
                      title=f"Monarc Mails {datum}", author="Monarc Visionz").build(story, onFirstPage=deco, onLaterPages=deco)
    print(out)

if __name__ == "__main__":
    main(sys.argv[1])
