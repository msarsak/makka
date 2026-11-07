// Skovalearnings – App-Logik (ohne Frameworks, läuft komplett im Browser)
(() => {
  "use strict";

  // ---------- Speicher ----------
  const DEFAULTS = {
    name: "", theme: "hero", anim: true, comic: true, sound: true,
    autoRead: false, rate: 1, fontSize: "m", images: true, goal: 50,
    quizCount: 10, favs: [], confetti: true, haptics: true
  };
  const load = (k, d) => { try { return { ...d, ...JSON.parse(localStorage.getItem(k) || "{}") }; } catch { return { ...d }; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  let S = load("sk_settings", DEFAULTS);
  let P = load("sk_progress", { xp: 0, done: {}, streak: 0, lastDay: "", todayXp: 0, todayDate: "", last: null, correct: 0, answered: 0 });

  const today = () => new Date().toISOString().slice(0, 10);
  function rollDay() {
    const t = today();
    if (P.todayDate !== t) { P.todayDate = t; P.todayXp = 0; save("sk_progress", P); }
  }
  rollDay();

  // ---------- Helfer ----------
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const allLessons = () => CATEGORIES.flatMap((c) => c.lessons.map((l) => ({ ...l, cat: c })));
  const findLesson = (id) => allLessons().find((l) => l.id === id);
  const findCat = (id) => CATEGORIES.find((c) => c.id === id);
  const level = (xp) => Math.floor(Math.sqrt(xp / 25)) + 1;
  const levelXp = (lv) => (lv - 1) * (lv - 1) * 25;
  const RANKS = ["Rookie", "Schüler-Held", "Wissens-Kämpfer", "Quiz-Ritter", "Fakten-Ninja", "Super-Brain", "Wissens-Legende", "Ultra-Genie"];
  const rank = (lv) => RANKS[Math.min(RANKS.length - 1, Math.floor((lv - 1) / 2))];
  const ytUrl = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  const wikiUrl = (w) => "https://de.wikipedia.org/wiki/" + encodeURIComponent(w);

  // ---------- Einstellungen anwenden ----------
  function applySettings() {
    const b = document.body;
    b.dataset.theme = S.theme;
    b.dataset.font = S.fontSize;
    b.classList.toggle("noanim", !S.anim);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = S.theme === "nacht" ? "#0b1026" : S.theme === "hell" ? "#ffffff" : "#d7263d";
  }

  // ---------- Sound (selbst erzeugt, keine Dateien nötig) ----------
  let actx;
  function beep(type) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { ok: [523, 659, 784], bad: [220, 180], click: [880], lvl: [523, 659, 784, 1047] }[type] || [440];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type === "bad" ? "sawtooth" : "triangle";
        o.frequency.value = f;
        const t = actx.currentTime + i * 0.09;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g).connect(actx.destination);
        o.start(t); o.stop(t + 0.2);
      });
    } catch {}
  }
  const vibrate = (p) => { if (S.haptics && navigator.vibrate) try { navigator.vibrate(p); } catch {} };

  // ---------- Vorlesen ----------
  function speak(text) {
    if (!("speechSynthesis" in window)) return toast("Vorlesen wird hier nicht unterstützt");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE"; u.rate = S.rate;
    const v = speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith("de"));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  const stopSpeak = () => { if ("speechSynthesis" in window) speechSynthesis.cancel(); };

  // ---------- Effekte ----------
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function burst(word, good = true) {
    if (!S.comic || !S.anim) return;
    const b = document.createElement("div");
    b.className = "burst " + (good ? "good" : "bad");
    b.textContent = word;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 900);
  }
  function confetti(n = 60) {
    if (!S.confetti || !S.anim) return;
    const colors = ["#d7263d", "#1b4fd8", "#ffd60a", "#ffffff", "#ff7b00"];
    const box = document.createElement("div");
    box.className = "confetti";
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.5 + "s";
      p.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3600);
  }

  // ---------- XP ----------
  function addXp(n) {
    rollDay();
    const before = level(P.xp);
    P.xp += n; P.todayXp += n;
    const t = today();
    if (P.lastDay !== t) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      P.streak = P.lastDay === y ? P.streak + 1 : 1;
      P.lastDay = t;
    }
    save("sk_progress", P);
    const pop = document.createElement("div");
    pop.className = "xp-pop"; pop.textContent = "+" + n + " XP";
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 1200);
    if (level(P.xp) > before) {
      setTimeout(() => { beep("lvl"); confetti(120); burst("LEVEL " + level(P.xp) + "!"); toast("🎉 Neues Level: " + rank(level(P.xp))); }, 400);
    }
    updateHeader();
  }

  // ---------- Bilder von Wikipedia (kostenlos, ohne Schlüssel) ----------
  const imgCache = load("sk_img", {});
  const pending = {};
  function wikiImage(title) {
    if (title in imgCache) return Promise.resolve(imgCache[title]);
    if (pending[title]) return pending[title];
    pending[title] = fetch("https://de.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        let src = (j && j.thumbnail && j.thumbnail.source) || null;
        if (src) src = src.replace(/\/(\d+)px-/, "/640px-");
        imgCache[title] = src; save("sk_img", imgCache);
        return src;
      })
      .catch(() => null);
    return pending[title];
  }
  function pic(w, emoji, cls = "") {
    return `<div class="pic ${cls}" data-wiki="${esc(w || "")}"><span class="pic-emoji">${emoji || "✨"}</span></div>`;
  }
  function hydratePics(root = app) {
    root.querySelectorAll(".pic[data-wiki]").forEach((el) => {
      const w = el.dataset.wiki;
      if (!w || !S.images || el.dataset.done) return;
      el.dataset.done = 1;
      wikiImage(w).then((src) => {
        if (!src) return;
        const img = new Image();
        img.alt = w.replace(/_/g, " ");
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        img.onload = () => { el.classList.add("has-img"); el.prepend(img); };
        img.src = src;
      });
    });
  }

  // ---------- Kopfzeile ----------
  function updateHeader() {
    const lv = level(P.xp);
    const pct = Math.round(((P.xp - levelXp(lv)) / (levelXp(lv + 1) - levelXp(lv))) * 100);
    $("#hdr-stats").innerHTML =
      `<span class="chip" title="Tage in Folge">🔥 ${P.streak}</span>` +
      `<span class="chip" title="Level">⭐ Lv ${lv}</span>` +
      `<span class="chip xpchip" title="XP"><b style="width:${pct}%"></b><em>${P.xp} XP</em></span>`;
  }

  // ---------- Seiten ----------
  function view(html, cls = "") {
    stopSpeak();
    app.className = "view " + cls;
    app.innerHTML = html;
    window.scrollTo(0, 0);
    hydratePics();
    document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("on", location.hash.startsWith(a.getAttribute("href")) && (a.getAttribute("href") !== "#/" || location.hash === "#/" || location.hash === "")));
  }

  function catCard(c, i) {
    const done = c.lessons.filter((l) => P.done[l.id] != null).length;
    const fav = S.favs.includes(c.id);
    return `<a class="cat pop-in" style="--c:${c.color};--d:${i * 50}ms" href="#/kat/${c.id}">
      <span class="cat-emoji">${c.emoji}</span>
      <span class="cat-name">${esc(c.name)}${fav ? " 💛" : ""}</span>
      <span class="cat-desc">${esc(c.desc)}</span>
      <span class="bar"><b style="width:${(done / c.lessons.length) * 100}%"></b></span>
      <span class="cat-count">${done}/${c.lessons.length} Lektionen</span>
    </a>`;
  }

  function home() {
    const name = S.name ? esc(S.name) : "Held";
    const fact = FACTS[Math.floor(Date.now() / 864e5) % FACTS.length];
    const goalPct = Math.min(100, Math.round((P.todayXp / S.goal) * 100));
    const last = P.last && findLesson(P.last);
    const next = allLessons().find((l) => P.done[l.id] == null);
    const cont = last && P.done[last.id] == null ? last : next;
    const cats = S.favs.length ? [...CATEGORIES].sort((a, b) => S.favs.includes(b.id) - S.favs.includes(a.id)) : CATEGORIES;
    view(`
      <section class="hero-banner fly-in">
        <div class="hero-text">
          <h1>Hey ${name}! <span class="wave">👋</span></h1>
          <p>Bereit, heute dein Gehirn aufzuladen?</p>
          <div class="goal"><div class="goal-ring" style="--p:${goalPct}"><span>${goalPct}%</span></div>
            <div><b>Tagesziel</b><br>${P.todayXp} / ${S.goal} XP</div></div>
        </div>
        <div class="hero-mascot">🦸</div>
      </section>
      ${cont ? `<a class="continue pop-in" href="#/lektion/${cont.id}">
        ${pic(cont.w, cont.emoji, "mini")}
        <div><small>${last && cont === last ? "Weiterlernen" : "Als Nächstes"} · ${esc(cont.cat.name)}</small><b>${esc(cont.title)}</b></div>
        <span class="go">▶</span></a>` : `<div class="continue done">🏆 Du hast alle Lektionen geschafft! Mach ein Schnellquiz.</div>`}
      <div class="fact pop-in"><b>⚡ Fakt des Tages</b><p>${fact}</p></div>
      <h2 class="section-title">Wähle dein Thema</h2>
      <div class="cats">${cats.map(catCard).join("")}</div>
      <a class="big-btn red pop-in" href="#/quiz">🎯 Schnellquiz starten</a>
    `);
  }

  function topics() {
    view(`
      <h1 class="page-title">Alle Themen</h1>
      <input id="search" class="search" type="search" placeholder="🔍 Suche: z. B. Rom, Mond, Euro …" autocomplete="off">
      <div id="results"></div>
      <div class="cats" id="allcats">${CATEGORIES.map(catCard).join("")}</div>
    `);
    const inp = $("#search"), res = $("#results"), cats = $("#allcats");
    inp.addEventListener("input", () => {
      const q = inp.value.trim().toLowerCase();
      if (!q) { res.innerHTML = ""; cats.hidden = false; return; }
      const hits = allLessons().filter((l) => (l.title + " " + l.cat.name + " " + l.cards.map((c) => c.h + " " + c.t).join(" ")).toLowerCase().includes(q));
      cats.hidden = true;
      res.innerHTML = hits.length ? `<div class="lessons">${hits.map(lessonRow).join("")}</div>` : `<p class="empty">Nichts gefunden 🤔</p>`;
      hydratePics(res);
    });
  }

  function lessonRow(l, i = 0) {
    const sc = P.done[l.id];
    return `<a class="lesson pop-in" style="--d:${i * 40}ms" href="#/lektion/${l.id}">
      ${pic(l.w, l.emoji, "mini")}
      <div><b>${esc(l.title)}</b><small>${l.cards.length} Karten · ${l.quiz.length} Fragen</small></div>
      <span class="state">${sc == null ? "▶" : sc === 100 ? "🏆" : "✅"}</span></a>`;
  }

  function category(id) {
    const c = findCat(id);
    if (!c) return go("#/");
    const fav = S.favs.includes(c.id);
    view(`
      <a class="back" href="#/themen">← Themen</a>
      <section class="cat-head fly-in" style="--c:${c.color}">
        <span class="cat-emoji big">${c.emoji}</span>
        <div><h1>${esc(c.name)}</h1><p>${esc(c.desc)}</p></div>
        <button class="fav ${fav ? "on" : ""}" id="fav" aria-label="Favorit">${fav ? "💛" : "🤍"}</button>
      </section>
      <div class="lessons">${c.lessons.map(lessonRow).join("")}</div>
      <h2 class="section-title">📺 Videos zum Thema</h2>
      <div class="yt-list">${c.lessons.flatMap((l) => l.yt).map(ytCard).join("")}</div>
    `);
    $("#fav").onclick = () => {
      S.favs = fav ? S.favs.filter((x) => x !== c.id) : [...S.favs, c.id];
      save("sk_settings", S); beep("click"); category(id);
    };
  }

  function ytCard(q) {
    return `<a class="yt" href="${ytUrl(q)}" target="_blank" rel="noopener"><span class="yt-play">▶</span><span>${esc(q)}</span></a>`;
  }

  // ---------- Lektion ----------
  function lesson(id) {
    const l = findLesson(id);
    if (!l) return go("#/");
    P.last = l.id; save("sk_progress", P);
    const quiz = l.quiz.map((q) => {
      const order = shuffle(q.a.map((_, i) => i));
      return { ...q, a: order.map((i) => q.a[i]), c: order.indexOf(q.c) };
    });
    const total = l.cards.length + quiz.length;
    let step = -1, right = 0;

    const frame = (inner) => view(`
      <div class="lesson-top">
        <a class="close" href="#/kat/${l.cat.id}" aria-label="Schließen">✕</a>
        <div class="progress"><b style="width:${Math.max(0, ((step + 1) / (total + 1)) * 100)}%"></b></div>
      </div>
      <div class="stage">${inner}</div>`, "lesson-view");

    function intro() {
      frame(`
        <div class="card intro slide-in">
          ${pic(l.w, l.emoji, "large")}
          <small class="tag" style="--c:${l.cat.color}">${l.cat.emoji} ${esc(l.cat.name)}</small>
          <h1>${esc(l.title)}</h1>
          <p>${l.cards.length} Lernkarten · ${quiz.length} Quizfragen · ca. ${Math.ceil(total * 0.5)} Min.</p>
          <button class="big-btn blue" id="next">Los geht's! 🚀</button>
        </div>`);
      $("#next").onclick = () => { beep("click"); step = 0; render(); };
    }

    function card() {
      const c = l.cards[step];
      frame(`
        <div class="card learn slide-in">
          ${pic(c.w, c.e, "large")}
          <div class="card-num">Karte ${step + 1} von ${l.cards.length}</div>
          <h2>${c.e} ${esc(c.h)}</h2>
          <p class="card-text">${esc(c.t)}</p>
          <div class="row">
            <button class="icon-btn" id="read" title="Vorlesen">🔊 Vorlesen</button>
            ${c.w ? `<a class="icon-btn" href="${wikiUrl(c.w)}" target="_blank" rel="noopener">📖 Mehr</a>` : ""}
          </div>
          <div class="row nav-row">
            ${step > 0 ? `<button class="big-btn ghost" id="prev">←</button>` : ""}
            <button class="big-btn blue grow" id="next">${step === l.cards.length - 1 ? "Zum Quiz 🎯" : "Weiter →"}</button>
          </div>
        </div>`);
      $("#read").onclick = () => speak(c.h + ". " + c.t);
      if (S.autoRead) speak(c.h + ". " + c.t);
      $("#next").onclick = () => { beep("click"); step++; render(); };
      const p = $("#prev"); if (p) p.onclick = () => { step--; render(); };
      swipe($(".card"), () => $("#next").click(), () => p && p.click());
    }

    function question() {
      const qi = step - l.cards.length, q = quiz[qi];
      frame(`
        <div class="card quiz slide-in">
          <div class="card-num">Frage ${qi + 1} von ${quiz.length}</div>
          <h2>${esc(q.q)}</h2>
          <div class="answers">${q.a.map((a, i) => `<button class="answer" data-i="${i}" style="--d:${i * 60}ms">${esc(a)}</button>`).join("")}</div>
          <div id="feedback"></div>
        </div>`);
      app.querySelectorAll(".answer").forEach((b) => (b.onclick = () => {
        const i = +b.dataset.i, ok = i === q.c;
        app.querySelectorAll(".answer").forEach((x) => { x.disabled = true; if (+x.dataset.i === q.c) x.classList.add("right"); });
        P.answered++;
        if (ok) { right++; P.correct++; b.classList.add("right"); beep("ok"); vibrate(30); burst(["POW!", "BÄM!", "WOW!", "ZACK!", "SUPER!"][Math.floor(Math.random() * 5)]); addXp(10); }
        else { b.classList.add("wrong", "shake"); beep("bad"); vibrate([60, 40, 60]); burst("UPS!", false); }
        save("sk_progress", P);
        $("#feedback").innerHTML = `<div class="fb ${ok ? "ok" : "no"} pop-in"><b>${ok ? "Richtig! 🎉" : "Nicht ganz 😅"}</b><p>${esc(q.x)}</p>
          <button class="big-btn ${ok ? "blue" : "red"}" id="next">${qi === quiz.length - 1 ? "Ergebnis 🏁" : "Weiter →"}</button></div>`;
        $("#next").onclick = () => { step++; render(); };
      }));
    }

    function result() {
      const pct = Math.round((right / quiz.length) * 100);
      const prev = P.done[l.id];
      P.done[l.id] = Math.max(prev || 0, pct);
      save("sk_progress", P);
      if (prev == null) addXp(20);
      if (pct >= 50) confetti(pct === 100 ? 140 : 70);
      const idx = l.cat.lessons.findIndex((x) => x.id === l.id);
      const nxt = l.cat.lessons[idx + 1];
      frame(`
        <div class="card result slide-in">
          <div class="trophy">${pct === 100 ? "🏆" : pct >= 50 ? "🥈" : "💪"}</div>
          <h1>${pct === 100 ? "Perfekt, Superheld!" : pct >= 50 ? "Stark gemacht!" : "Weiter üben!"}</h1>
          <p class="score">${right} / ${quiz.length} richtig · ${pct}%</p>
          ${prev == null ? `<p class="bonus">+20 XP Bonus für die neue Lektion!</p>` : ""}
          <h3>📺 Schau dir Videos dazu an</h3>
          <div class="yt-list">${l.yt.map(ytCard).join("")}</div>
          <div class="row nav-row col">
            ${nxt ? `<a class="big-btn blue" href="#/lektion/${nxt.id}">Nächste Lektion: ${esc(nxt.title)} →</a>` : ""}
            <button class="big-btn ghost" id="again">🔁 Nochmal</button>
            <a class="big-btn ghost" href="#/kat/${l.cat.id}">Zurück zu ${esc(l.cat.name)}</a>
          </div>
        </div>`);
      $("#again").onclick = () => lesson(id);
    }

    function render() {
      if (step < 0) intro();
      else if (step < l.cards.length) card();
      else if (step < total) question();
      else result();
    }
    render();
  }

  function swipe(el, left, right) {
    let x0 = null;
    el.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    el.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (dx < -60) left(); else if (dx > 60) right();
    });
  }

  // ---------- Schnellquiz ----------
  function quizSetup() {
    const sel = load("sk_quizsel", { cats: CATEGORIES.map((c) => c.id) }).cats;
    const acc = P.answered ? Math.round((P.correct / P.answered) * 100) : 0;
    view(`
      <h1 class="page-title">🎯 Schnellquiz</h1>
      <p class="sub">Gemischte Fragen aus deinen Lieblingsthemen. Jede richtige Antwort = +10 XP.</p>
      <div class="stats-row">
        <div class="stat"><b>${P.answered}</b><small>Fragen beantwortet</small></div>
        <div class="stat"><b>${acc}%</b><small>Trefferquote</small></div>
      </div>
      <h2 class="section-title">Themen auswählen</h2>
      <div class="pills">${CATEGORIES.map((c) => `<label class="pill"><input type="checkbox" value="${c.id}" ${sel.includes(c.id) ? "checked" : ""}><span>${c.emoji} ${esc(c.name)}</span></label>`).join("")}</div>
      <button class="big-btn red" id="start">Quiz starten (${S.quizCount} Fragen) ⚡</button>
    `);
    $("#start").onclick = () => {
      const cats = [...app.querySelectorAll(".pill input:checked")].map((i) => i.value);
      if (!cats.length) return toast("Wähle mindestens ein Thema 🙂");
      save("sk_quizsel", { cats });
      runQuiz(cats);
    };
  }

  function runQuiz(cats) {
    const pool = shuffle(allLessons().filter((l) => cats.includes(l.cat.id)).flatMap((l) => l.quiz.map((q) => ({ ...q, l }))))
      .slice(0, S.quizCount)
      .map((q) => { const o = shuffle(q.a.map((_, i) => i)); return { ...q, a: o.map((i) => q.a[i]), c: o.indexOf(q.c) }; });
    let i = 0, right = 0, combo = 0;
    function show() {
      if (i >= pool.length) {
        const pct = Math.round((right / pool.length) * 100);
        if (pct >= 50) confetti(100);
        view(`<div class="card result slide-in"><div class="trophy">${pct >= 80 ? "🏆" : pct >= 50 ? "🥈" : "💪"}</div>
          <h1>Quiz geschafft!</h1><p class="score">${right} / ${pool.length} richtig · ${pct}%</p>
          <div class="row nav-row col"><button class="big-btn red" id="again">🔁 Neues Quiz</button><a class="big-btn ghost" href="#/">Zur Startseite</a></div></div>`);
        $("#again").onclick = () => runQuiz(cats);
        return;
      }
      const q = pool[i];
      view(`
        <div class="lesson-top"><a class="close" href="#/quiz">✕</a><div class="progress"><b style="width:${(i / pool.length) * 100}%"></b></div><span class="combo">${combo > 1 ? "🔥x" + combo : ""}</span></div>
        <div class="stage"><div class="card quiz slide-in">
          <small class="tag" style="--c:${q.l.cat.color}">${q.l.cat.emoji} ${esc(q.l.title)}</small>
          <div class="card-num">Frage ${i + 1} von ${pool.length}</div>
          <h2>${esc(q.q)}</h2>
          <div class="answers">${q.a.map((a, k) => `<button class="answer" data-i="${k}" style="--d:${k * 60}ms">${esc(a)}</button>`).join("")}</div>
          <div id="feedback"></div></div></div>`, "lesson-view");
      app.querySelectorAll(".answer").forEach((b) => (b.onclick = () => {
        const k = +b.dataset.i, ok = k === q.c;
        app.querySelectorAll(".answer").forEach((x) => { x.disabled = true; if (+x.dataset.i === q.c) x.classList.add("right"); });
        P.answered++;
        if (ok) { right++; combo++; P.correct++; b.classList.add("right"); beep("ok"); vibrate(30); burst(combo > 2 ? "COMBO x" + combo + "!" : "POW!"); addXp(10 + (combo > 2 ? 5 : 0)); }
        else { combo = 0; b.classList.add("wrong", "shake"); beep("bad"); vibrate([60, 40, 60]); burst("UPS!", false); }
        save("sk_progress", P);
        $("#feedback").innerHTML = `<div class="fb ${ok ? "ok" : "no"} pop-in"><b>${ok ? "Richtig! 🎉" : "Nicht ganz 😅"}</b><p>${esc(q.x)}</p><button class="big-btn ${ok ? "blue" : "red"}" id="next">Weiter →</button></div>`;
        $("#next").onclick = () => { i++; show(); };
      }));
    }
    show();
  }

  // ---------- Videos ----------
  function videos() {
    view(`
      <h1 class="page-title">📺 Video-Bereich</h1>
      <p class="sub">Tippe auf ein Thema – es öffnet passende Erklärvideos auf YouTube.</p>
      <h2 class="section-title">⭐ Empfohlene Kanäle</h2>
      <div class="yt-list">${CHANNELS.map((c) => `<a class="yt" href="${ytUrl(c.name)}" target="_blank" rel="noopener"><span class="yt-play">▶</span><span><b>${esc(c.name)}</b><br><small>${esc(c.topic)}</small></span></a>`).join("")}</div>
      ${CATEGORIES.map((c) => `
        <details class="vid-group" style="--c:${c.color}">
          <summary>${c.emoji} ${esc(c.name)}</summary>
          ${c.lessons.map((l) => `<div class="vid-lesson"><b>${l.emoji} ${esc(l.title)}</b><div class="yt-list">${l.yt.map(ytCard).join("")}</div></div>`).join("")}
        </details>`).join("")}
      <div class="search-yt">
        <input id="ytq" class="search" placeholder="🔎 Eigenes Thema auf YouTube suchen …">
        <button class="big-btn red" id="ytgo">Suchen</button>
      </div>
    `);
    const goYt = () => { const q = $("#ytq").value.trim(); if (q) window.open(ytUrl(q + " einfach erklärt"), "_blank", "noopener"); };
    $("#ytgo").onclick = goYt;
    $("#ytq").addEventListener("keydown", (e) => e.key === "Enter" && goYt());
  }

  // ---------- Einstellungen ----------
  function settings() {
    const toggle = (k, label, sub) => `<label class="set"><span><b>${label}</b><small>${sub}</small></span><input type="checkbox" data-k="${k}" ${S[k] ? "checked" : ""}><i class="sw"></i></label>`;
    const select = (k, label, opts) => `<label class="set"><span><b>${label}</b></span><select data-k="${k}">${opts.map(([v, t]) => `<option value="${v}" ${String(S[k]) === String(v) ? "selected" : ""}>${t}</option>`).join("")}</select></label>`;
    view(`
      <h1 class="page-title">⚙️ Einstellungen</h1>
      <div class="set-group"><h3>👤 Profil</h3>
        <label class="set"><span><b>Dein Name</b></span><input type="text" data-k="name" maxlength="20" value="${esc(S.name)}" placeholder="Held"></label>
        <div class="profile"><span>⭐ Level ${level(P.xp)} · ${rank(level(P.xp))}</span><span>🔥 ${P.streak} Tage</span><span>✅ ${Object.keys(P.done).length} Lektionen</span></div>
      </div>
      <div class="set-group"><h3>🎨 Aussehen</h3>
        <div class="themes">
          ${[["hero", "Held", "🦸"], ["spinne", "Spinnen-Netz", "🕸️"], ["nacht", "Nacht", "🌙"], ["hell", "Hell", "☀️"]].map(([v, t, e]) => `<button class="theme-btn t-${v} ${S.theme === v ? "on" : ""}" data-theme="${v}"><span>${e}</span>${t}</button>`).join("")}
        </div>
        ${select("fontSize", "Textgröße", [["s", "Klein"], ["m", "Normal"], ["l", "Groß"], ["xl", "Riesig"]])}
        ${toggle("images", "Bilder anzeigen", "Fotos von Wikipedia laden")}
      </div>
      <div class="set-group"><h3>✨ Animationen & Effekte</h3>
        ${toggle("anim", "Animationen", "Bewegungen und Übergänge")}
        ${toggle("comic", "Comic-Effekte", "POW! BÄM! bei Antworten")}
        ${toggle("confetti", "Konfetti", "Bei Erfolgen")}
        ${toggle("sound", "Soundeffekte", "Töne bei Antworten")}
        ${toggle("haptics", "Vibration", "Auf dem Handy")}
      </div>
      <div class="set-group"><h3>🔊 Vorlesen</h3>
        ${toggle("autoRead", "Automatisch vorlesen", "Jede Lernkarte wird vorgelesen")}
        ${select("rate", "Sprechtempo", [["0.75", "Langsam"], ["1", "Normal"], ["1.25", "Schnell"]])}
      </div>
      <div class="set-group"><h3>🎯 Lernen</h3>
        ${select("goal", "Tagesziel", [["20", "Locker – 20 XP"], ["50", "Normal – 50 XP"], ["100", "Ehrgeizig – 100 XP"], ["200", "Superheld – 200 XP"]])}
        ${select("quizCount", "Fragen im Schnellquiz", [["5", "5"], ["10", "10"], ["15", "15"], ["20", "20"]])}
        <div class="set col"><b>Lieblingsthemen</b><small>Werden auf der Startseite zuerst gezeigt</small>
          <div class="pills">${CATEGORIES.map((c) => `<label class="pill"><input type="checkbox" class="favbox" value="${c.id}" ${S.favs.includes(c.id) ? "checked" : ""}><span>${c.emoji} ${esc(c.name)}</span></label>`).join("")}</div>
        </div>
      </div>
      <div class="set-group"><h3>📲 App</h3>
        <button class="big-btn blue" id="install" hidden>📲 Als App installieren</button>
        <p class="sub small">Tipp: Im Browser-Menü „Zum Startbildschirm hinzufügen“ wählen, dann ist Skovalearnings wie eine echte App auf deinem Handy.</p>
        <button class="big-btn ghost danger" id="reset">🗑️ Fortschritt zurücksetzen</button>
      </div>
      <p class="credits">Skovalearnings · Bilder: Wikipedia/Wikimedia Commons · Videos: YouTube</p>
    `);
    app.querySelectorAll("[data-k]").forEach((el) => {
      el.addEventListener(el.type === "text" ? "input" : "change", () => {
        const k = el.dataset.k;
        S[k] = el.type === "checkbox" ? el.checked : typeof DEFAULTS[k] === "number" ? +el.value : el.value;
        save("sk_settings", S); applySettings();
        if (el.type === "checkbox") beep("click");
      });
    });
    app.querySelectorAll(".theme-btn").forEach((b) => (b.onclick = () => { S.theme = b.dataset.theme; save("sk_settings", S); applySettings(); beep("click"); settings(); }));
    app.querySelectorAll(".favbox").forEach((b) => (b.onchange = () => { S.favs = [...app.querySelectorAll(".favbox:checked")].map((x) => x.value); save("sk_settings", S); }));
    $("#reset").onclick = () => {
      if (!confirm("Wirklich alle XP und Lektionen löschen?")) return;
      P = { xp: 0, done: {}, streak: 0, lastDay: "", todayXp: 0, todayDate: today(), last: null, correct: 0, answered: 0 };
      save("sk_progress", P); updateHeader(); toast("Fortschritt zurückgesetzt"); settings();
    };
    if (deferredPrompt) { const ib = $("#install"); ib.hidden = false; ib.onclick = () => { deferredPrompt.prompt(); deferredPrompt = null; ib.hidden = true; }; }
  }

  // ---------- Router ----------
  function go(h) { location.hash = h; }
  function route() {
    const h = location.hash || "#/";
    const [, page, arg] = h.split("/");
    if (!page) return home();
    if (page === "themen") return topics();
    if (page === "kat") return category(arg);
    if (page === "lektion") return lesson(arg);
    if (page === "quiz") return quizSetup();
    if (page === "videos") return videos();
    if (page === "einstellungen") return settings();
    home();
  }

  // ---------- Start ----------
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; });
  window.addEventListener("hashchange", route);
  applySettings();
  updateHeader();
  route();

  // Willkommen beim ersten Start
  if (!localStorage.getItem("sk_welcome")) {
    try { localStorage.setItem("sk_welcome", "1"); } catch {}
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="modal-box pop-in"><div class="hero-mascot">🦸</div><h2>Willkommen bei<br><span class="logo-text">Skovalearnings</span></h2>
      <p>Lerne Politik, Geschichte, Länder, Weltraum und vieles mehr – einfach erklärt, mit Bildern, Quiz und Videos.</p>
      <input class="search" id="wname" maxlength="20" placeholder="Wie heißt du?">
      <button class="big-btn red" id="wgo">Los geht's! ⚡</button></div>`;
    document.body.appendChild(m);
    const done = () => { const n = $("#wname").value.trim(); if (n) { S.name = n.slice(0, 20); save("sk_settings", S); } m.remove(); beep("lvl"); confetti(80); route(); };
    $("#wgo").onclick = done;
    $("#wname").addEventListener("keydown", (e) => e.key === "Enter" && done());
  }

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
