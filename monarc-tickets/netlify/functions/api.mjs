// Monarc Tickets – Server (Netlify Function). Ohne Passwort.
// Daten liegen in Netlify Blobs (Store "monarc-tickets"): Schlüssel "tickets" und "events".
import { getStore } from "@netlify/blobs";
import SEED from "../lib/seed.mjs";

const STATUS_ORDER = ["offen", "angeschrieben", "antwort", "termin", "gewonnen"];
const ALL_STATUS = [...STATUS_ORDER, "kein"];
const NEEDS = ["website", "anrufe", "bewertungen", "termin", "chat"];
const TICKET_FIELDS = ["betrieb", "branche", "ort", "adresse", "email", "telefon", "website", "websiteStatus", "angebot", "quelle", "mail"];

const store = () => getStore({ name: "monarc-tickets", consistency: "strong" });
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const fail = (msg, status = 400) => json({ error: msg }, status);
const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Vienna" });
const now = () => new Date().toISOString();
const str = (v, max = 5000) => String(v ?? "").trim().slice(0, max);
const low = v => str(v, 320).toLowerCase();
const uid = p => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Liest einen Schlüssel, ändert ihn mit fn und speichert nur, wenn niemand dazwischen geschrieben hat.
async function mutate(key, fallback, fn) {
  const s = store();
  for (let i = 0; i < 8; i++) {
    const cur = await s.getWithMetadata(key, { type: "json" });
    const data = cur ? cur.data : structuredClone(fallback);
    const result = await fn(data);
    const opts = cur ? { onlyIfMatch: cur.etag } : { onlyIfNew: true };
    const w = await s.setJSON(key, data, opts);
    if (w.modified !== false) return result;
    await new Promise(r => setTimeout(r, 40 + Math.random() * 120));
  }
  throw new Error("Gerade viel los – bitte nochmal versuchen");
}
async function read(key, fallback) {
  const v = await store().get(key, { type: "json" });
  return v ?? structuredClone(fallback);
}
// Beim allerersten Aufruf die 30 Start-Tickets anlegen.
async function ensureSeed() {
  const s = store();
  if (await s.get("seeded")) return;
  await mutate("tickets", [], list => { if (!list.length) list.push(...SEED); });
  await s.set("seeded", now());
}
const nextNr = list => list.reduce((m, t) => Math.max(m, t.nr || 0), 0) + 1;
const findByEmail = (list, email) => { const e = low(email); return e ? list.find(t => low(t.email) === e) : null; };
const addLog = (t, who, what) => { t.log = Array.isArray(t.log) ? t.log : []; t.log.unshift({ t: now(), who: str(who, 80) || "?", what: str(what, 300) }); t.log = t.log.slice(0, 100); };

async function handle(req, path) {
  const method = req.method;
  const body = method === "POST" ? await req.json().catch(() => ({})) : {};

  if (path === "login") return json({ token: "offen" }); // Altes Login, wird nicht mehr gebraucht.

  if (path === "tickets" && method === "GET") return json({ tickets: await read("tickets", []) });
  if (path === "events" && method === "GET") return json({ events: await read("events", []) });
  if (method !== "POST") return fail("Nicht gefunden", 404);

  if (path === "update") {
    const { id, patch = {}, who, what } = body;
    const ticket = await mutate("tickets", [], list => {
      const t = list.find(x => x.id === id); if (!t) return null;
      if ("status" in patch && ALL_STATUS.includes(patch.status)) t.status = patch.status;
      if ("owner" in patch) t.owner = str(patch.owner, 80);
      if ("notes" in patch) t.notes = str(patch.notes, 5000);
      if ("bedarf" in patch && Array.isArray(patch.bedarf)) t.bedarf = patch.bedarf.filter(k => NEEDS.includes(k));
      t.updatedAt = now();
      addLog(t, who, what || "geändert");
      return t;
    });
    return ticket ? json({ ticket }) : fail("Ticket nicht gefunden", 404);
  }

  if (path === "delete") {
    const ok = await mutate("tickets", [], list => { const i = list.findIndex(x => x.id === body.id); if (i < 0) return false; list.splice(i, 1); return true; });
    return ok ? json({ ok: true }) : fail("Ticket nicht gefunden", 404);
  }

  if (path === "delete-all") {
    if (body.confirm !== "ALLE") return fail("Bitte ALLE zum Bestätigen schicken");
    const deleted = await mutate("tickets", [], list => { const n = list.length; list.length = 0; return n; });
    return json({ deleted });
  }

  if (path === "events/save") {
    const e = body.event || {};
    if (!str(e.title) || !/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) return fail("Titel und Datum fehlen");
    const event = await mutate("events", [], list => {
      let ev = e.id ? list.find(x => x.id === e.id) : null;
      if (!ev) { ev = { id: uid("EV"), createdBy: str(body.who, 80), createdAt: now() }; list.push(ev); }
      else ev.updatedBy = str(body.who, 80);
      Object.assign(ev, { title: str(e.title, 160), date: e.date, time: /^\d{2}:\d{2}$/.test(e.time || "") ? e.time : "",
        ticketId: str(e.ticketId, 40), betrieb: str(e.betrieb, 200), ort: str(e.ort, 200), notes: str(e.notes, 3000) });
      return ev;
    });
    return json({ event });
  }

  if (path === "events/delete") {
    await mutate("events", [], list => { const i = list.findIndex(x => x.id === body.id); if (i >= 0) list.splice(i, 1); });
    return json({ ok: true });
  }

  // ---- Import (Make / tägliche Firmensuche) ----
  if (path === "import") {
    const incoming = Array.isArray(body.tickets) ? body.tickets.slice(0, 200) : [];
    const res = await mutate("tickets", [], list => {
      let added = 0, skipped = 0; const ids = [];
      for (const raw of incoming) {
        const t = {}; for (const f of TICKET_FIELDS) t[f] = str(raw[f], f === "mail" ? 8000 : 500);
        if (!t.betrieb) { skipped++; continue; }
        const dup = list.some(x => (t.email && low(x.email) === low(t.email)) || (low(x.betrieb) === low(t.betrieb) && low(x.ort) === low(t.ort)));
        if (dup) { skipped++; continue; }
        const nr = nextNr(list);
        Object.assign(t, { id: "MV-" + String(nr).padStart(4, "0"), nr, status: "offen", owner: "", notes: "", log: [], createdAt: today() });
        const bedarf = Array.isArray(raw.bedarf) ? raw.bedarf : Array.isArray(raw.needs) ? raw.needs : null;
        if (bedarf) t.bedarf = bedarf.filter(k => NEEDS.includes(k));
        list.push(t); ids.push(t.id); added++;
      }
      return { added, skipped, ids };
    });
    return json(res);
  }

  if (path === "import-status") {
    const updates = Array.isArray(body.updates) ? body.updates.slice(0, 200) : [];
    const res = await mutate("tickets", [], list => {
      let changed = 0, unknown = 0;
      for (const u of updates) {
        const t = findByEmail(list, u.email); if (!t) { unknown++; continue; }
        t.mailRefs = Array.isArray(t.mailRefs) ? t.mailRefs : [];
        if (u.mailRef && t.mailRefs.includes(u.mailRef)) continue;
        if (u.mailRef) t.mailRefs.push(str(u.mailRef, 200));
        const cur = t.status || "offen", nxt = u.status;
        const forward = nxt === "kein" ? cur !== "gewonnen" : STATUS_ORDER.indexOf(nxt) > STATUS_ORDER.indexOf(cur) && cur !== "kein";
        if (ALL_STATUS.includes(nxt) && forward) { t.status = nxt; addLog(t, "Claude", "Status → " + nxt + " (aus E-Mail)"); changed++; }
        if (str(u.note)) t.notes = (t.notes ? t.notes + "\n" : "") + today() + ": " + str(u.note, 500);
      }
      return { changed, unknown };
    });
    return json(res);
  }

  if (path === "import-events") {
    const incoming = Array.isArray(body.events) ? body.events.slice(0, 100) : [];
    const tickets = await read("tickets", []);
    const added = await mutate("events", [], list => {
      let n = 0;
      for (const e of incoming) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) continue;
        if (e.mailRef && list.some(x => x.mailRef === e.mailRef)) continue;
        const t = findByEmail(tickets, e.email);
        list.push({ id: uid("EV"), title: str(e.title, 160) || "Gespräch", date: e.date, time: /^\d{2}:\d{2}$/.test(e.time || "") ? e.time : "",
          ticketId: t ? t.id : "", betrieb: str(e.betrieb, 200) || (t ? t.betrieb : ""), ort: str(e.ort, 200), notes: str(e.notes, 3000),
          quelle: "E-Mail", mailRef: str(e.mailRef, 200), createdBy: "Claude", createdAt: now() });
        n++;
      }
      return n;
    });
    if (added) await mutate("tickets", [], list => {
      for (const e of incoming) { const t = findByEmail(list, e.email);
        if (t && STATUS_ORDER.indexOf(t.status || "offen") < STATUS_ORDER.indexOf("termin") && t.status !== "kein") { t.status = "termin"; addLog(t, "Claude", "Termin aus E-Mail → Status Termin"); } }
    });
    return json({ added });
  }

  return fail("Nicht gefunden", 404);
}

export default async (req) => {
  const path = new URL(req.url).pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  try {
    await ensureSeed();
    return await handle(req, path);
  } catch (e) {
    return fail(e.message || "Serverfehler", 500);
  }
};

export const config = { path: "/api/*" };
