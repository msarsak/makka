// Skovalearnings – Lerninhalte
// Jede Lektion: Karten (einfach erklärt) + Quiz + YouTube-Suchen.
// "w" = Titel eines deutschen Wikipedia-Artikels, daraus wird automatisch ein Bild geladen.

const CATEGORIES = [
  {
    id: "politik", name: "Politik", emoji: "🏛️", color: "#1b4fd8",
    desc: "Wie Länder regiert werden und wer was entscheidet.",
    lessons: [
      {
        id: "demokratie", title: "Was ist Demokratie?", emoji: "🗳️", w: "Demokratie",
        cards: [
          { h: "Das Volk entscheidet", e: "👥", w: "Demokratie", t: "Demokratie kommt aus dem Griechischen und heißt „Herrschaft des Volkes“. Stell dir vor, deine Klasse stimmt ab, wohin der Ausflug geht – die Mehrheit gewinnt. So ähnlich funktioniert ein demokratisches Land." },
          { h: "Wählen gehen", e: "🗳️", w: "Wahl", t: "Weil nicht Millionen Menschen jede Frage selbst klären können, wählen sie Vertreter, zum Beispiel Abgeordnete. Die Wahl ist geheim: Niemand darf sehen, wen du wählst." },
          { h: "Gewaltenteilung", e: "⚖️", w: "Gewaltenteilung", t: "Die Macht wird auf drei Gruppen verteilt: Das Parlament macht Gesetze, die Regierung führt sie aus und Gerichte prüfen, ob alles fair ist. So kann niemand alleine alles bestimmen." },
          { h: "Freiheit & Meinung", e: "📢", w: "Meinungsfreiheit", t: "In einer Demokratie darfst du deine Meinung sagen, Zeitungen dürfen kritisieren und Menschen dürfen demonstrieren. Das ist wichtig, damit Fehler der Regierung auffallen." }
        ],
        quiz: [
          { q: "Was bedeutet „Demokratie“?", a: ["Herrschaft des Volkes", "Herrschaft eines Königs", "Herrschaft der Armee", "Herrschaft der Reichen"], c: 0, x: "Demos = Volk, kratia = Herrschaft." },
          { q: "Wozu gibt es die Gewaltenteilung?", a: ["Damit niemand alle Macht hat", "Damit Wahlen schneller gehen", "Damit es weniger Gesetze gibt", "Damit Steuern sinken"], c: 0, x: "Parlament, Regierung und Gerichte kontrollieren sich gegenseitig." },
          { q: "Wie ist eine demokratische Wahl?", a: ["Geheim", "Öffentlich per Handzeichen", "Nur für Reiche", "Nur für Männer"], c: 0, x: "Die geheime Wahl schützt dich vor Druck." }
        ],
        yt: ["Demokratie einfach erklärt", "Gewaltenteilung einfach erklärt"]
      },
      {
        id: "deutschland-politik", title: "Wie funktioniert Deutschland?", emoji: "🇩🇪", w: "Bundestag",
        cards: [
          { h: "Das Grundgesetz", e: "📜", w: "Grundgesetz_für_die_Bundesrepublik_Deutschland", t: "Das Grundgesetz ist wie das Regelbuch für ganz Deutschland. Es gilt seit 1949. Der erste Satz lautet: „Die Würde des Menschen ist unantastbar.“" },
          { h: "Der Bundestag", e: "🏛️", w: "Bundestag", t: "Im Bundestag in Berlin sitzen die Abgeordneten, die wir alle vier Jahre wählen. Sie beschließen die Gesetze und wählen den Bundeskanzler." },
          { h: "Kanzler & Präsident", e: "👔", w: "Bundeskanzler_(Deutschland)", t: "Der Bundeskanzler oder die Bundeskanzlerin leitet die Regierung – also der „Chef“ der Politik. Der Bundespräsident ist das Staatsoberhaupt und vertritt Deutschland eher feierlich." },
          { h: "16 Bundesländer", e: "🗺️", w: "Land_(Deutschland)", t: "Deutschland besteht aus 16 Bundesländern, zum Beispiel Bayern, Hamburg oder Sachsen. Jedes Land darf bei Dingen wie Schule und Polizei viel selbst entscheiden. Über den Bundesrat reden sie bei Gesetzen mit." }
        ],
        quiz: [
          { q: "Seit wann gilt das Grundgesetz?", a: ["1949", "1871", "1990", "1918"], c: 0, x: "Das Grundgesetz trat am 23. Mai 1949 in Kraft." },
          { q: "Wer wählt den Bundeskanzler?", a: ["Der Bundestag", "Der Bundespräsident direkt", "Die Bundesländer", "Das Militär"], c: 0, x: "Die Abgeordneten im Bundestag wählen den Kanzler." },
          { q: "Wie viele Bundesländer hat Deutschland?", a: ["16", "12", "20", "10"], c: 0, x: "16 Länder – von Schleswig-Holstein bis Bayern." }
        ],
        yt: ["Bundestag einfach erklärt", "Grundgesetz einfach erklärt"]
      },
      {
        id: "eu", title: "Die Europäische Union", emoji: "🇪🇺", w: "Europäische_Union",
        cards: [
          { h: "Ein Team aus Ländern", e: "🤝", w: "Europäische_Union", t: "Die EU ist ein Zusammenschluss von 27 europäischen Ländern. Sie arbeiten zusammen, damit es Frieden gibt und der Handel einfacher wird." },
          { h: "Der Euro", e: "💶", w: "Euro", t: "Viele EU-Länder zahlen mit derselben Währung: dem Euro. Du kannst in Spanien, Italien oder Frankreich mit dem gleichen Geld bezahlen wie in Deutschland." },
          { h: "Reisen ohne Grenzkontrolle", e: "🚗", w: "Schengener_Abkommen", t: "Dank des Schengen-Abkommens kann man zwischen vielen Ländern reisen, ohne an der Grenze anhalten zu müssen. Fast so, als würde man von einem Bundesland ins nächste fahren." },
          { h: "Wo sitzt die EU?", e: "🏢", w: "Brüssel", t: "Viele wichtige EU-Gebäude stehen in Brüssel (Belgien). Das EU-Parlament tagt auch in Straßburg (Frankreich). Alle fünf Jahre wählen die Menschen das EU-Parlament." }
        ],
        quiz: [
          { q: "Wie viele Länder sind in der EU?", a: ["27", "50", "12", "35"], c: 0, x: "Seit dem Brexit (2020) sind es 27 Länder." },
          { q: "Wie heißt die gemeinsame Währung?", a: ["Euro", "Dollar", "Pfund", "Franken"], c: 0, x: "Der Euro wurde 2002 als Bargeld eingeführt." },
          { q: "In welcher Stadt sitzen viele EU-Behörden?", a: ["Brüssel", "Berlin", "Rom", "Wien"], c: 0, x: "Brüssel gilt als „Hauptstadt“ der EU." }
        ],
        yt: ["Europäische Union einfach erklärt", "EU Parlament erklärt"]
      },
      {
        id: "uno", title: "Die Vereinten Nationen", emoji: "🌐", w: "Vereinte_Nationen",
        cards: [
          { h: "Fast alle Länder der Welt", e: "🌍", w: "Vereinte_Nationen", t: "Die UNO (Vereinte Nationen) wurde 1945 nach dem Zweiten Weltkrieg gegründet. Fast alle Länder sind Mitglied – 193 Staaten. Ihr Ziel: Frieden auf der Welt." },
          { h: "Hauptquartier New York", e: "🗽", w: "Hauptquartier_der_Vereinten_Nationen", t: "Das Hauptgebäude der UNO steht in New York. Dort treffen sich Vertreter aller Länder in der Generalversammlung und reden über Probleme der Welt." },
          { h: "Der Sicherheitsrat", e: "🛡️", w: "UN-Sicherheitsrat", t: "Der Sicherheitsrat entscheidet über Krieg und Frieden. Fünf Länder sind immer dabei: USA, Russland, China, Großbritannien und Frankreich. Jedes davon kann eine Entscheidung mit einem „Veto“ blockieren." },
          { h: "Hilfe weltweit", e: "🍞", w: "UNICEF", t: "Zur UNO gehören auch Hilfsorganisationen, zum Beispiel UNICEF für Kinder oder das Welternährungsprogramm gegen Hunger." }
        ],
        quiz: [
          { q: "Wann wurde die UNO gegründet?", a: ["1945", "1918", "1989", "2000"], c: 0, x: "Direkt nach dem Zweiten Weltkrieg." },
          { q: "Wo ist das UNO-Hauptquartier?", a: ["New York", "Genf", "Paris", "London"], c: 0, x: "Am East River in New York." },
          { q: "Was kann ein ständiges Mitglied im Sicherheitsrat?", a: ["Ein Veto einlegen", "Andere Länder verbieten", "Allein Krieg erklären", "Den Generalsekretär absetzen"], c: 0, x: "Ein Veto blockiert einen Beschluss." }
        ],
        yt: ["UNO einfach erklärt", "UN Sicherheitsrat Veto erklärt"]
      }
    ]
  },
  {
    id: "wissen", name: "Allgemeinwissen", emoji: "🧠", color: "#d7263d",
    desc: "Coole Fakten, die jeder kennen sollte.",
    lessons: [
      {
        id: "koerper", title: "Dein Körper", emoji: "🫀", w: "Menschlicher_Körper",
        cards: [
          { h: "206 Knochen", e: "🦴", w: "Skelett_des_Menschen", t: "Ein Erwachsener hat 206 Knochen. Babys haben sogar mehr – manche wachsen später zusammen. Der kleinste Knochen sitzt im Ohr und heißt Steigbügel." },
          { h: "Dein Herz ist ein Motor", e: "❤️", w: "Herz", t: "Dein Herz ist etwa so groß wie deine Faust und schlägt rund 100.000 Mal am Tag. Es pumpt Blut durch den ganzen Körper – ohne Pause, dein ganzes Leben lang." },
          { h: "Die Haut", e: "🖐️", w: "Haut", t: "Die Haut ist dein größtes Organ. Sie schützt dich wie eine Rüstung vor Keimen, Sonne und Kälte." },
          { h: "Das Gehirn", e: "🧠", w: "Gehirn", t: "Dein Gehirn wiegt etwa 1,4 kg und steuert alles: Denken, Fühlen, Bewegen. Es hat rund 86 Milliarden Nervenzellen – das sind mehr als zehnmal so viele, wie Menschen auf der Erde leben!" }
        ],
        quiz: [
          { q: "Wie viele Knochen hat ein Erwachsener?", a: ["206", "100", "350", "52"], c: 0, x: "206 Knochen bilden unser Skelett." },
          { q: "Welches ist das größte Organ?", a: ["Die Haut", "Die Leber", "Das Herz", "Die Lunge"], c: 0, x: "Die Haut ist fast 2 m² groß." },
          { q: "Wie oft schlägt das Herz ungefähr am Tag?", a: ["100.000 Mal", "1.000 Mal", "10 Millionen Mal", "500 Mal"], c: 0, x: "Etwa 60–80 Schläge pro Minute." }
        ],
        yt: ["menschlicher Körper einfach erklärt", "Wie funktioniert das Herz erklärt"]
      },
      {
        id: "erdrekorde", title: "Rekorde der Erde", emoji: "🏔️", w: "Mount_Everest",
        cards: [
          { h: "Höchster Berg", e: "🏔️", w: "Mount_Everest", t: "Der Mount Everest im Himalaya ist mit 8.849 Metern der höchste Berg der Welt. Oben ist die Luft so dünn, dass die meisten Kletterer Sauerstoffflaschen brauchen." },
          { h: "Größter Ozean", e: "🌊", w: "Pazifischer_Ozean", t: "Der Pazifik ist der größte Ozean. Er ist so riesig, dass alle Kontinente zusammen hineinpassen würden!" },
          { h: "Längster Fluss", e: "🏞️", w: "Nil", t: "Der Nil in Afrika gilt als längster Fluss der Welt – etwa 6.650 km. Manche Forscher meinen aber, der Amazonas in Südamerika sei noch etwas länger." },
          { h: "Größte Wüste", e: "🏜️", w: "Sahara", t: "Die Sahara ist die größte heiße Wüste. Aber Achtung: Auch die Antarktis zählt als Wüste, weil es dort kaum Niederschlag gibt – und sie ist noch größer!" }
        ],
        quiz: [
          { q: "Wie hoch ist der Mount Everest?", a: ["8.849 m", "5.000 m", "12.300 m", "2.962 m"], c: 0, x: "8.849 m – der höchste Punkt der Erde." },
          { q: "Welcher ist der größte Ozean?", a: ["Pazifik", "Atlantik", "Indischer Ozean", "Nordpolarmeer"], c: 0, x: "Der Pazifik bedeckt etwa ein Drittel der Erde." },
          { q: "Welche Wüste ist die größte heiße Wüste?", a: ["Sahara", "Gobi", "Atacama", "Kalahari"], c: 0, x: "Die Sahara ist fast so groß wie die USA." }
        ],
        yt: ["Mount Everest Doku deutsch", "größte Rekorde der Erde"]
      },
      {
        id: "erfindungen", title: "Erfindungen, die alles änderten", emoji: "💡", w: "Glühlampe",
        cards: [
          { h: "Das Rad", e: "🛞", w: "Rad", t: "Vor etwa 5.500 Jahren wurde das Rad erfunden. Ohne Rad gäbe es keine Autos, Fahrräder oder Uhren mit Zahnrädern." },
          { h: "Der Buchdruck", e: "📖", w: "Johannes_Gutenberg", t: "Um 1450 erfand Johannes Gutenberg in Mainz den Buchdruck mit beweglichen Buchstaben. Plötzlich konnten Bücher schnell kopiert werden – Wissen verbreitete sich überall." },
          { h: "Die Glühbirne", e: "💡", w: "Glühlampe", t: "Thomas Edison machte die Glühbirne Ende des 19. Jahrhunderts alltagstauglich. Endlich Licht auf Knopfdruck statt Kerzen!" },
          { h: "Das Smartphone", e: "📱", w: "Smartphone", t: "Ein Smartphone ist Telefon, Kamera, Karte und Computer in einem. Heute hat es mehr Rechenpower als die Computer, mit denen Menschen zum Mond geflogen sind." }
        ],
        quiz: [
          { q: "Wer erfand den Buchdruck in Europa?", a: ["Johannes Gutenberg", "Albert Einstein", "Thomas Edison", "Isaac Newton"], c: 0, x: "Gutenberg aus Mainz, um 1450." },
          { q: "Wie alt ist das Rad ungefähr?", a: ["5.500 Jahre", "500 Jahre", "50.000 Jahre", "200 Jahre"], c: 0, x: "Es entstand in der Jungsteinzeit." }
        ],
        yt: ["Erfindungen die die Welt verändert haben", "Gutenberg Buchdruck erklärt"]
      }
    ]
  },
  {
    id: "laender", name: "Länder", emoji: "🌍", color: "#2a9d8f",
    desc: "Kontinente, Hauptstädte und spannende Länder.",
    lessons: [
      {
        id: "kontinente", title: "Die 7 Kontinente", emoji: "🗺️", w: "Kontinent",
        cards: [
          { h: "Sieben riesige Landflächen", e: "🌎", w: "Kontinent", t: "Meistens zählt man 7 Kontinente: Asien, Afrika, Nordamerika, Südamerika, Antarktis, Europa und Australien (Ozeanien)." },
          { h: "Asien – der Riese", e: "🐼", w: "Asien", t: "Asien ist der größte Kontinent. Hier leben über die Hälfte aller Menschen, zum Beispiel in China und Indien." },
          { h: "Afrika – voller Leben", e: "🦁", w: "Afrika", t: "Afrika hat 54 Länder – mehr als jeder andere Kontinent. Hier leben Löwen, Elefanten und Giraffen, und hier entstand vermutlich der Mensch." },
          { h: "Antarktis – die Eiswelt", e: "🐧", w: "Antarktika", t: "Die Antarktis am Südpol ist der kälteste Ort der Erde: bis zu −89 °C wurden gemessen! Dort wohnen keine Menschen dauerhaft, nur Forscher und Pinguine." }
        ],
        quiz: [
          { q: "Welcher Kontinent ist der größte?", a: ["Asien", "Afrika", "Europa", "Nordamerika"], c: 0, x: "Asien ist fast 45 Millionen km² groß." },
          { q: "Welcher Kontinent hat die meisten Länder?", a: ["Afrika", "Europa", "Asien", "Südamerika"], c: 0, x: "Afrika hat 54 Staaten." },
          { q: "Wo ist es am kältesten?", a: ["Antarktis", "Sibirien", "Grönland", "Alaska"], c: 0, x: "In der Antarktis wurden −89 °C gemessen." }
        ],
        yt: ["Kontinente einfach erklärt", "Antarktis Doku deutsch"]
      },
      {
        id: "deutschland", title: "Deutschland", emoji: "🇩🇪", w: "Deutschland",
        cards: [
          { h: "Mitten in Europa", e: "📍", w: "Deutschland", t: "Deutschland liegt in der Mitte Europas und hat 9 Nachbarländer – so viele wie kaum ein anderes Land in Europa. Es leben etwa 84 Millionen Menschen hier." },
          { h: "Hauptstadt Berlin", e: "🐻", w: "Berlin", t: "Berlin ist die Hauptstadt und größte Stadt. Das Brandenburger Tor ist ihr berühmtestes Wahrzeichen. Das Wappentier der Stadt ist ein Bär." },
          { h: "Höchster Berg", e: "⛰️", w: "Zugspitze", t: "Die Zugspitze in Bayern ist mit 2.962 Metern Deutschlands höchster Berg. Von oben kann man in vier Länder schauen." },
          { h: "Bekannt für …", e: "🚗", w: "Neuschwanstein", t: "Deutschland ist bekannt für Autos, Brot (über 3.000 Sorten!), Schlösser wie Neuschwanstein und Erfinder wie Gutenberg oder Carl Benz." }
        ],
        quiz: [
          { q: "Wie viele Nachbarländer hat Deutschland?", a: ["9", "4", "12", "6"], c: 0, x: "Dänemark, Polen, Tschechien, Österreich, Schweiz, Frankreich, Luxemburg, Belgien, Niederlande." },
          { q: "Wie heißt Deutschlands höchster Berg?", a: ["Zugspitze", "Brocken", "Feldberg", "Watzmann"], c: 0, x: "2.962 m hoch, in Bayern." }
        ],
        yt: ["Deutschland einfach erklärt für Kinder", "Bundesländer lernen"]
      },
      {
        id: "weltrekord-laender", title: "Die krassesten Länder", emoji: "🏆", w: "Russland",
        cards: [
          { h: "Das größte Land", e: "🐻", w: "Russland", t: "Russland ist das flächenmäßig größte Land der Welt. Es ist so breit, dass es 11 Zeitzonen hat – wenn im Westen Frühstück ist, ist im Osten schon Abend." },
          { h: "Die meisten Menschen", e: "👨‍👩‍👧‍👦", w: "Indien", t: "Indien hat seit 2023 die meisten Einwohner – über 1,4 Milliarden Menschen. Vorher war es China." },
          { h: "Das kleinste Land", e: "⛪", w: "Vatikanstadt", t: "Der Vatikan in Rom ist das kleinste Land der Welt. Er ist kleiner als ein halber Quadratkilometer – man kann ihn in 15 Minuten umrunden. Dort wohnt der Papst." },
          { h: "Inseln ohne Ende", e: "🏝️", w: "Indonesien", t: "Indonesien besteht aus über 17.000 Inseln. Schweden soll sogar über 200.000 Inseln haben – die meisten davon sind aber winzig." }
        ],
        quiz: [
          { q: "Welches ist das größte Land der Welt?", a: ["Russland", "Kanada", "China", "USA"], c: 0, x: "Russland ist über 17 Millionen km² groß." },
          { q: "Welches ist das kleinste Land?", a: ["Vatikanstadt", "Monaco", "Malta", "Liechtenstein"], c: 0, x: "Nur etwa 0,44 km² groß." },
          { q: "Welches Land hat die meisten Einwohner?", a: ["Indien", "China", "USA", "Brasilien"], c: 0, x: "Seit 2023 hat Indien China überholt." }
        ],
        yt: ["größte Länder der Welt", "Vatikan einfach erklärt"]
      },
      {
        id: "hauptstaedte", title: "Hauptstädte-Training", emoji: "🏙️", w: "Hauptstadt",
        cards: [
          { h: "Was ist eine Hauptstadt?", e: "🏙️", w: "Hauptstadt", t: "In der Hauptstadt sitzt meistens die Regierung eines Landes. Oft ist es die größte Stadt – aber nicht immer! Das macht Hauptstädte zu einem tollen Quiz-Thema." },
          { h: "Fallen: Australien & Kanada", e: "🦘", w: "Canberra", t: "Viele denken, Sydney sei die Hauptstadt von Australien – falsch! Es ist Canberra. Und bei Kanada ist es nicht Toronto, sondern Ottawa." },
          { h: "Weitere Fallen", e: "🇹🇷", w: "Ankara", t: "Die Hauptstadt der Türkei ist Ankara, nicht Istanbul. In Brasilien ist es Brasília, nicht Rio de Janeiro. Und in der Schweiz nennt man Bern „Bundesstadt“." },
          { h: "Die Klassiker", e: "🗼", w: "Paris", t: "Frankreich – Paris, Italien – Rom, Spanien – Madrid, Japan – Tokio, Großbritannien – London, USA – Washington, D.C." }
        ],
        quiz: [
          { q: "Hauptstadt von Australien?", a: ["Canberra", "Sydney", "Melbourne", "Perth"], c: 0, x: "Canberra wurde extra als Hauptstadt gebaut." },
          { q: "Hauptstadt von Kanada?", a: ["Ottawa", "Toronto", "Vancouver", "Montreal"], c: 0, x: "Ottawa liegt in der Provinz Ontario." },
          { q: "Hauptstadt der Türkei?", a: ["Ankara", "Istanbul", "Izmir", "Antalya"], c: 0, x: "Ankara ist seit 1923 die Hauptstadt." },
          { q: "Hauptstadt der USA?", a: ["Washington, D.C.", "New York", "Los Angeles", "Chicago"], c: 0, x: "Dort steht das Weiße Haus." },
          { q: "Hauptstadt von Brasilien?", a: ["Brasília", "Rio de Janeiro", "São Paulo", "Salvador"], c: 0, x: "Brasília wurde 1960 eingeweiht." }
        ],
        yt: ["Hauptstädte der Welt lernen", "Hauptstädte Quiz"]
      }
    ]
  },
  {
    id: "kriege", name: "Kriege", emoji: "⚔️", color: "#6d597a",
    desc: "Was passiert ist – damit es nie wieder passiert.",
    lessons: [
      {
        id: "ww1", title: "Der Erste Weltkrieg", emoji: "🪖", w: "Erster_Weltkrieg",
        cards: [
          { h: "1914 – 1918", e: "📅", w: "Erster_Weltkrieg", t: "Der Erste Weltkrieg dauerte von 1914 bis 1918. Auf der einen Seite standen vor allem Deutschland und Österreich-Ungarn, auf der anderen Frankreich, Großbritannien, Russland und später die USA." },
          { h: "Der Auslöser", e: "💥", w: "Attentat_von_Sarajevo", t: "Im Juni 1914 wurde der österreichische Thronfolger Franz Ferdinand in Sarajevo erschossen. Weil viele Länder Bündnisse hatten, zog ein Land das nächste mit in den Krieg – wie Dominosteine." },
          { h: "Krieg in Schützengräben", e: "🕳️", w: "Schützengraben", t: "Die Soldaten kämpften monatelang in Gräben aus Matsch, oft nur ein paar hundert Meter voneinander entfernt. Neue Waffen wie Maschinengewehre, Panzer und Giftgas machten den Krieg schrecklich." },
          { h: "Das Ende", e: "🕊️", w: "Friedensvertrag_von_Versailles", t: "Etwa 17 Millionen Menschen starben. 1919 wurde der Vertrag von Versailles unterschrieben. Deutschland musste viel bezahlen – das machte viele Menschen wütend und trug später zum Zweiten Weltkrieg bei." }
        ],
        quiz: [
          { q: "Wann war der Erste Weltkrieg?", a: ["1914–1918", "1939–1945", "1870–1871", "1800–1815"], c: 0, x: "Vier Jahre lang, von 1914 bis 1918." },
          { q: "Was löste den Krieg aus?", a: ["Das Attentat von Sarajevo", "Der Mauerfall", "Ein Erdbeben", "Die Mondlandung"], c: 0, x: "Franz Ferdinand wurde am 28. Juni 1914 erschossen." },
          { q: "Wie hieß der Friedensvertrag?", a: ["Vertrag von Versailles", "Vertrag von Rom", "Westfälischer Frieden", "Pariser Klimaabkommen"], c: 0, x: "Unterschrieben 1919 im Schloss Versailles." }
        ],
        yt: ["Erster Weltkrieg einfach erklärt", "Erster Weltkrieg musstewissen"]
      },
      {
        id: "ww2", title: "Der Zweite Weltkrieg", emoji: "✈️", w: "Zweiter_Weltkrieg",
        cards: [
          { h: "1939 – 1945", e: "📅", w: "Zweiter_Weltkrieg", t: "Der Zweite Weltkrieg begann am 1. September 1939, als Deutschland unter Adolf Hitler Polen überfiel. Er war der größte und tödlichste Krieg der Geschichte." },
          { h: "Die Nationalsozialisten", e: "⚠️", w: "Zeit_des_Nationalsozialismus", t: "Ab 1933 regierten in Deutschland die Nationalsozialisten. Sie schafften die Demokratie ab, verfolgten Andersdenkende und wollten mit Krieg Europa beherrschen." },
          { h: "Der Holocaust", e: "🕯️", w: "Holocaust", t: "Die Nationalsozialisten ermordeten rund 6 Millionen Jüdinnen und Juden, außerdem Sinti und Roma, Menschen mit Behinderung und viele andere. Daran erinnern wir, damit so etwas nie wieder geschieht." },
          { h: "Das Ende", e: "🕊️", w: "Ende_des_Zweiten_Weltkrieges_in_Europa", t: "Am 8. Mai 1945 kapitulierte Deutschland. In Asien endete der Krieg im August 1945, nachdem die USA Atombomben auf Hiroshima und Nagasaki abwarfen. Insgesamt starben etwa 60 bis 70 Millionen Menschen." }
        ],
        quiz: [
          { q: "Womit begann der Zweite Weltkrieg?", a: ["Überfall auf Polen", "Angriff auf die USA", "Mauerbau", "Attentat in Sarajevo"], c: 0, x: "Am 1. September 1939." },
          { q: "Wann kapitulierte Deutschland?", a: ["8. Mai 1945", "9. November 1989", "1. September 1939", "3. Oktober 1990"], c: 0, x: "Der 8. Mai gilt als Tag der Befreiung." },
          { q: "Auf welche Städte fielen Atombomben?", a: ["Hiroshima und Nagasaki", "Tokio und Osaka", "Berlin und Dresden", "London und Paris"], c: 0, x: "Im August 1945 in Japan." }
        ],
        yt: ["Zweiter Weltkrieg einfach erklärt", "Holocaust einfach erklärt"]
      },
      {
        id: "kalterkrieg", title: "Der Kalte Krieg", emoji: "🧊", w: "Kalter_Krieg",
        cards: [
          { h: "Ein Krieg ohne Schlacht", e: "🥶", w: "Kalter_Krieg", t: "Nach 1945 stritten die USA und die Sowjetunion um die Macht in der Welt. Sie kämpften nie direkt gegeneinander – darum heißt es „kalter“ Krieg." },
          { h: "Zwei Seiten", e: "↔️", w: "Eiserner_Vorhang", t: "Der Westen (USA, Westeuropa) war demokratisch und kapitalistisch. Der Osten (Sowjetunion und Verbündete) war kommunistisch. Dazwischen lag der „Eiserne Vorhang“." },
          { h: "Die Berliner Mauer", e: "🧱", w: "Berliner_Mauer", t: "Deutschland war geteilt in BRD (West) und DDR (Ost). 1961 baute die DDR die Berliner Mauer, damit niemand mehr in den Westen flüchten konnte." },
          { h: "Wettrennen ins All", e: "🚀", w: "Wettlauf_ins_All", t: "Beide Seiten wollten zeigen, wer besser ist: Die Sowjetunion schickte 1961 den ersten Menschen ins All, die USA landeten 1969 auf dem Mond. 1991 zerfiel die Sowjetunion – der Kalte Krieg war vorbei." }
        ],
        quiz: [
          { q: "Wer waren die Hauptgegner?", a: ["USA und Sowjetunion", "Deutschland und Frankreich", "China und Japan", "England und Spanien"], c: 0, x: "Die zwei „Supermächte“." },
          { q: "Wann wurde die Berliner Mauer gebaut?", a: ["1961", "1945", "1989", "1949"], c: 0, x: "Am 13. August 1961." },
          { q: "Warum „kalter“ Krieg?", a: ["Die Gegner kämpften nie direkt", "Es war immer Winter", "Er fand am Nordpol statt", "Er war sehr kurz"], c: 0, x: "Es gab Spannungen, aber keinen direkten Krieg." }
        ],
        yt: ["Kalter Krieg einfach erklärt", "Berliner Mauer Geschichte erklärt"]
      }
    ]
  },
  {
    id: "geschichte", name: "Geschichte", emoji: "📜", color: "#e76f51",
    desc: "Von Pyramiden bis zum Mauerfall.",
    lessons: [
      {
        id: "aegypten", title: "Das alte Ägypten", emoji: "🐫", w: "Altes_Ägypten",
        cards: [
          { h: "Ein Reich am Nil", e: "🌊", w: "Nil", t: "Vor über 5.000 Jahren entstand am Nil eines der ersten großen Reiche. Der Fluss überschwemmte jedes Jahr die Felder und machte den Boden fruchtbar – ohne Nil kein Ägypten." },
          { h: "Die Pyramiden", e: "🔺", w: "Pyramiden_von_Gizeh", t: "Die Pyramiden von Gizeh sind etwa 4.500 Jahre alt. Die größte, die Cheops-Pyramide, war fast 4.000 Jahre lang das höchste Bauwerk der Welt. Es waren Gräber für Könige." },
          { h: "Pharaonen & Mumien", e: "👑", w: "Tutanchamun", t: "Die Könige hießen Pharaonen und galten als göttlich. Nach dem Tod wurden sie einbalsamiert – zu Mumien –, damit sie im Jenseits weiterleben konnten. Berühmt ist Tutanchamun." },
          { h: "Hieroglyphen", e: "𓂀", w: "Ägyptische_Hieroglyphen", t: "Die Ägypter schrieben mit Bildzeichen, den Hieroglyphen. Erst 1822 konnte man sie wieder lesen – dank des „Steins von Rosette“, auf dem derselbe Text in drei Schriften stand." }
        ],
        quiz: [
          { q: "Wie hießen die Könige Ägyptens?", a: ["Pharaonen", "Kaiser", "Zaren", "Sultane"], c: 0, x: "Sie galten als Götter auf Erden." },
          { q: "Wofür wurden die Pyramiden gebaut?", a: ["Als Gräber", "Als Kornspeicher", "Als Burgen", "Als Tempel für Wahlen"], c: 0, x: "Grabmäler für die Pharaonen." },
          { q: "Was half, Hieroglyphen zu entziffern?", a: ["Der Stein von Rosette", "Die Sphinx", "Ein Papyrus aus Rom", "Die Mumie Tutanchamuns"], c: 0, x: "Der gleiche Text stand dort auf Griechisch." }
        ],
        yt: ["Altes Ägypten einfach erklärt", "Pyramiden Bau Terra X"]
      },
      {
        id: "rom", title: "Das Römische Reich", emoji: "🏟️", w: "Römisches_Reich",
        cards: [
          { h: "Von der Stadt zum Weltreich", e: "🐺", w: "Rom", t: "Der Sage nach wurde Rom 753 v. Chr. von den Zwillingen Romulus und Remus gegründet, die von einer Wölfin großgezogen wurden. Aus der Stadt wurde ein riesiges Reich rund um das Mittelmeer." },
          { h: "Julius Caesar", e: "🏛️", w: "Gaius_Iulius_Caesar", t: "Caesar war ein berühmter Feldherr und Politiker. 44 v. Chr. wurde er im Senat ermordet. Nach ihm wurden später Herrscher „Kaiser“ genannt – das Wort kommt von „Caesar“!" },
          { h: "Geniale Baumeister", e: "🏟️", w: "Kolosseum", t: "Die Römer bauten Straßen, Wasserleitungen (Aquädukte) und das Kolosseum, in dem bis zu 50.000 Zuschauer Gladiatorenkämpfe sahen. Viele Bauwerke stehen heute noch." },
          { h: "Spuren bis heute", e: "🔤", w: "Latein", t: "Die Römer sprachen Latein. Daraus entstanden Italienisch, Spanisch und Französisch. Auch unsere Buchstaben und viele deutsche Wörter wie „Mauer“ (murus) kommen daher. Westrom ging 476 n. Chr. unter." }
        ],
        quiz: [
          { q: "Welches Wort kommt von „Caesar“?", a: ["Kaiser", "König", "Kanzler", "Konsul"], c: 0, x: "Auch der russische „Zar“ stammt davon ab." },
          { q: "Wo kämpften Gladiatoren?", a: ["Im Kolosseum", "Im Pantheon", "Im Senat", "In den Thermen"], c: 0, x: "Das Kolosseum steht noch heute in Rom." },
          { q: "Welche Sprache sprachen die Römer?", a: ["Latein", "Griechisch", "Italienisch", "Englisch"], c: 0, x: "Latein ist die „Mutter“ vieler Sprachen." }
        ],
        yt: ["Römisches Reich einfach erklärt", "Kolosseum Terra X"]
      },
      {
        id: "mittelalter", title: "Das Mittelalter", emoji: "🏰", w: "Mittelalter",
        cards: [
          { h: "1000 Jahre Mittelalter", e: "⏳", w: "Mittelalter", t: "Das Mittelalter dauerte ungefähr von 500 bis 1500 n. Chr. – also etwa tausend Jahre, zwischen der Antike und der Neuzeit." },
          { h: "Ritter & Burgen", e: "🛡️", w: "Ritter", t: "Ritter waren Krieger zu Pferd mit schwerer Rüstung. Adelige lebten in Burgen mit dicken Mauern, Türmen und manchmal einem Wassergraben – zum Schutz vor Angreifern." },
          { h: "Bauern & Stände", e: "🌾", w: "Ständegesellschaft", t: "Die meisten Menschen waren Bauern und mussten für ihren Herrn arbeiten. Die Gesellschaft war in Stände geteilt: Geistliche, Adel und Bauern. Aufsteigen war fast unmöglich." },
          { h: "Die Pest", e: "🐀", w: "Schwarzer_Tod", t: "Ab 1347 wütete die Pest, der „Schwarze Tod“. Etwa ein Drittel der Menschen in Europa starb. Übertragen wurde sie durch Flöhe, die auf Ratten lebten." }
        ],
        quiz: [
          { q: "Wie lange dauerte das Mittelalter ungefähr?", a: ["1000 Jahre", "100 Jahre", "50 Jahre", "3000 Jahre"], c: 0, x: "Von etwa 500 bis 1500 n. Chr." },
          { q: "Wie nannte man die Pest auch?", a: ["Schwarzer Tod", "Rote Grippe", "Weißer Husten", "Graues Fieber"], c: 0, x: "Wegen der dunklen Flecken auf der Haut." }
        ],
        yt: ["Mittelalter einfach erklärt", "Leben im Mittelalter Doku"]
      },
      {
        id: "mauerfall", title: "Mauerfall & Wiedervereinigung", emoji: "🧱", w: "Mauerfall",
        cards: [
          { h: "Ein geteiltes Land", e: "✂️", w: "Innerdeutsche_Grenze", t: "Nach dem Zweiten Weltkrieg wurde Deutschland geteilt: in die BRD im Westen und die DDR im Osten. Familien wurden getrennt, und in der DDR durfte man nicht frei reisen." },
          { h: "Friedliche Revolution", e: "🕯️", w: "Montagsdemonstrationen_in_der_DDR_1989/1990", t: "1989 gingen in der DDR immer mehr Menschen auf die Straße, besonders in Leipzig. Sie riefen: „Wir sind das Volk!“ – ganz friedlich, mit Kerzen statt Waffen." },
          { h: "9. November 1989", e: "🎉", w: "Mauerfall", t: "Am Abend des 9. November 1989 wurde die Grenze überraschend geöffnet. Tausende stürmten zur Mauer, tanzten darauf und lagen sich in den Armen." },
          { h: "Wieder ein Land", e: "🇩🇪", w: "Deutsche_Wiedervereinigung", t: "Am 3. Oktober 1990 wurde Deutschland wiedervereinigt. Deshalb ist der 3. Oktober heute Feiertag: der Tag der Deutschen Einheit." }
        ],
        quiz: [
          { q: "Wann fiel die Berliner Mauer?", a: ["9. November 1989", "3. Oktober 1990", "13. August 1961", "8. Mai 1945"], c: 0, x: "Ein Abend, der die Welt veränderte." },
          { q: "Was riefen die Demonstranten?", a: ["„Wir sind das Volk!“", "„Freibier für alle!“", "„Nieder mit dem Westen!“", "„Ich bin ein Berliner!“"], c: 0, x: "Der Ruf der Montagsdemonstrationen." },
          { q: "Wann ist der Tag der Deutschen Einheit?", a: ["3. Oktober", "9. November", "1. Mai", "17. Juni"], c: 0, x: "Seit 1990 Nationalfeiertag." }
        ],
        yt: ["Mauerfall einfach erklärt", "Wiedervereinigung Deutschland erklärt"]
      }
    ]
  },
  {
    id: "wissenschaft", name: "Wissenschaft", emoji: "🔬", color: "#3a86ff",
    desc: "Wie die Welt im Kleinen und Großen funktioniert.",
    lessons: [
      {
        id: "atome", title: "Alles besteht aus Atomen", emoji: "⚛️", w: "Atom",
        cards: [
          { h: "Winzige Bausteine", e: "🧱", w: "Atom", t: "Alles um dich herum – Luft, Wasser, dein Handy, du selbst – besteht aus winzigen Teilchen: Atomen. Sie sind so klein, dass in einen Punkt am Satzende Millionen davon passen." },
          { h: "Im Inneren", e: "⚛️", w: "Atomkern", t: "Ein Atom hat einen Kern aus Protonen und Neutronen. Drumherum schwirren Elektronen. Stell dir den Kern als Erbse in einem riesigen Fußballstadion vor – der Rest ist fast leer!" },
          { h: "Elemente", e: "🧪", w: "Periodensystem", t: "Es gibt über 100 verschiedene Atomsorten, die Elemente. Zum Beispiel Wasserstoff, Sauerstoff, Gold oder Eisen. Sie sind im Periodensystem geordnet." },
          { h: "Moleküle", e: "💧", w: "Wassermolekül", t: "Atome verbinden sich zu Molekülen. Wasser ist H₂O: zwei Wasserstoff-Atome und ein Sauerstoff-Atom." }
        ],
        quiz: [
          { q: "Woraus besteht ein Atomkern?", a: ["Protonen und Neutronen", "Elektronen", "Wassertropfen", "Licht"], c: 0, x: "Die Elektronen sind außen herum." },
          { q: "Was ist H₂O?", a: ["Wasser", "Sauerstoff", "Salz", "Gold"], c: 0, x: "2 × Wasserstoff + 1 × Sauerstoff." }
        ],
        yt: ["Atom einfach erklärt", "Periodensystem einfach erklärt"]
      },
      {
        id: "schwerkraft", title: "Die Schwerkraft", emoji: "🍎", w: "Gravitation",
        cards: [
          { h: "Warum fällt alles runter?", e: "🍎", w: "Isaac_Newton", t: "Isaac Newton erkannte im 17. Jahrhundert: Dinge ziehen sich gegenseitig an. Die Erde ist so schwer, dass sie alles zu sich zieht – auch den berühmten Apfel." },
          { h: "Mehr Masse = mehr Kraft", e: "🪐", w: "Gravitation", t: "Je schwerer ein Körper, desto stärker zieht er. Auf dem Mond ist die Schwerkraft nur etwa ein Sechstel so stark – dort könntest du sechsmal so hoch springen!" },
          { h: "Der Mond & das Meer", e: "🌊", w: "Gezeiten", t: "Der Mond zieht am Wasser der Ozeane. Dadurch entstehen Ebbe und Flut, also die Gezeiten." },
          { h: "Einstein", e: "🧑‍🔬", w: "Albert_Einstein", t: "Albert Einstein erklärte die Schwerkraft noch genauer: Schwere Dinge verbiegen Raum und Zeit – wie eine Bowlingkugel auf einem Trampolin." }
        ],
        quiz: [
          { q: "Wer beschrieb die Schwerkraft mit dem Apfel?", a: ["Isaac Newton", "Albert Einstein", "Galileo Galilei", "Marie Curie"], c: 0, x: "Newton, 17. Jahrhundert." },
          { q: "Was verursacht Ebbe und Flut?", a: ["Der Mond", "Der Wind", "Fische", "Die Sonne alleine"], c: 0, x: "Hauptsächlich die Anziehungskraft des Mondes." }
        ],
        yt: ["Schwerkraft einfach erklärt", "Gezeiten einfach erklärt"]
      },
      {
        id: "dinos", title: "Dinosaurier", emoji: "🦖", w: "Dinosaurier",
        cards: [
          { h: "Herrscher der Urzeit", e: "🦕", w: "Dinosaurier", t: "Dinosaurier lebten etwa 165 Millionen Jahre lang auf der Erde. Menschen gibt es erst seit ungefähr 300.000 Jahren – wir haben nie mit Dinos gelebt." },
          { h: "Tyrannosaurus rex", e: "🦖", w: "Tyrannosaurus", t: "Der T. rex war bis zu 12 Meter lang und hatte Zähne so groß wie Bananen. Seine Arme waren aber erstaunlich kurz." },
          { h: "Das große Aussterben", e: "☄️", w: "Chicxulub-Krater", t: "Vor 66 Millionen Jahren schlug ein riesiger Asteroid in Mexiko ein. Staub verdunkelte den Himmel, es wurde kalt – die meisten Dinosaurier starben aus." },
          { h: "Dinos gibt es noch!", e: "🐦", w: "Vögel", t: "Vögel stammen von Dinosauriern ab! Wenn du eine Taube oder ein Huhn siehst, siehst du einen entfernten Verwandten des T. rex." }
        ],
        quiz: [
          { q: "Wann starben die Dinosaurier aus?", a: ["Vor 66 Millionen Jahren", "Vor 10.000 Jahren", "Vor 1 Milliarde Jahren", "Vor 2.000 Jahren"], c: 0, x: "Durch einen Asteroideneinschlag." },
          { q: "Welche Tiere stammen von Dinosauriern ab?", a: ["Vögel", "Hunde", "Fische", "Katzen"], c: 0, x: "Vögel sind die letzten lebenden Dinosaurier." }
        ],
        yt: ["Dinosaurier Doku deutsch", "Warum starben die Dinosaurier aus"]
      }
    ]
  },
  {
    id: "weltraum", name: "Weltraum", emoji: "🚀", color: "#5a189a",
    desc: "Planeten, Sterne und Abenteuer im All.",
    lessons: [
      {
        id: "sonnensystem", title: "Unser Sonnensystem", emoji: "🪐", w: "Sonnensystem",
        cards: [
          { h: "Acht Planeten", e: "🪐", w: "Sonnensystem", t: "Um die Sonne kreisen 8 Planeten: Merkur, Venus, Erde, Mars, Jupiter, Saturn, Uranus, Neptun. Merksatz: „Mein Vater erklärt mir jeden Sonntag unseren Nachthimmel.“" },
          { h: "Die Sonne", e: "☀️", w: "Sonne", t: "Die Sonne ist ein Stern – eine riesige Kugel aus heißem Gas. Ihr Licht braucht etwa 8 Minuten bis zur Erde. Über eine Million Erden würden in sie hineinpassen!" },
          { h: "Jupiter, der Gigant", e: "🟠", w: "Jupiter_(Planet)", t: "Jupiter ist der größte Planet. Sein „Großer Roter Fleck“ ist ein Sturm, der größer ist als die ganze Erde und seit Hunderten Jahren tobt." },
          { h: "Saturns Ringe", e: "💍", w: "Saturn_(Planet)", t: "Saturn hat wunderschöne Ringe aus Eis und Gestein. Er ist so leicht, dass er in einer gigantischen Badewanne schwimmen würde!" }
        ],
        quiz: [
          { q: "Wie viele Planeten hat unser Sonnensystem?", a: ["8", "9", "7", "12"], c: 0, x: "Pluto gilt seit 2006 als Zwergplanet." },
          { q: "Welcher ist der größte Planet?", a: ["Jupiter", "Saturn", "Erde", "Neptun"], c: 0, x: "Jupiter ist 11-mal breiter als die Erde." },
          { q: "Wie lange braucht Sonnenlicht zur Erde?", a: ["Etwa 8 Minuten", "1 Sekunde", "1 Tag", "1 Jahr"], c: 0, x: "Rund 150 Millionen km Weg." }
        ],
        yt: ["Sonnensystem einfach erklärt", "Planeten Größenvergleich"]
      },
      {
        id: "mondlandung", title: "Die Mondlandung", emoji: "🌕", w: "Apollo_11",
        cards: [
          { h: "Apollo 11", e: "🚀", w: "Apollo_11", t: "Im Juli 1969 flogen drei US-Astronauten mit der Rakete Saturn V zum Mond. Die Reise dauerte etwa drei Tage." },
          { h: "Der erste Schritt", e: "👣", w: "Neil_Armstrong", t: "Am 20. Juli 1969 betrat Neil Armstrong als erster Mensch den Mond. Er sagte: „Ein kleiner Schritt für einen Menschen, ein riesiger Sprung für die Menschheit.“" },
          { h: "Fußspuren für immer", e: "🌑", w: "Mond", t: "Auf dem Mond gibt es keinen Wind und keinen Regen. Die Fußspuren der Astronauten sind deshalb wahrscheinlich heute noch da!" },
          { h: "Zurück zum Mond", e: "🛰️", w: "Artemis-Programm", t: "Mit dem Artemis-Programm will die NASA wieder Menschen zum Mond bringen – diesmal auch die erste Frau." }
        ],
        quiz: [
          { q: "Wer betrat als erster den Mond?", a: ["Neil Armstrong", "Juri Gagarin", "Buzz Lightyear", "Elon Musk"], c: 0, x: "Am 20. Juli 1969." },
          { q: "Warum sind die Fußspuren noch da?", a: ["Kein Wind und kein Regen", "Sie wurden betoniert", "Der Mond ist aus Käse", "Sie sind gefroren"], c: 0, x: "Der Mond hat keine Atmosphäre." }
        ],
        yt: ["Mondlandung 1969 erklärt", "Apollo 11 Doku deutsch"]
      },
      {
        id: "schwarzeloecher", title: "Schwarze Löcher", emoji: "🕳️", w: "Schwarzes_Loch",
        cards: [
          { h: "Der Staubsauger des Alls", e: "🌀", w: "Schwarzes_Loch", t: "Ein Schwarzes Loch ist ein Ort, an dem so viel Masse auf so kleinem Raum ist, dass nichts entkommen kann – nicht mal Licht. Darum ist es schwarz." },
          { h: "Wie entsteht es?", e: "💥", w: "Supernova", t: "Wenn ein sehr großer Stern stirbt, explodiert er als Supernova. Sein Kern fällt zusammen – und es kann ein Schwarzes Loch entstehen." },
          { h: "Das erste Foto", e: "📸", w: "Event_Horizon_Telescope", t: "2019 gelang das erste Bild eines Schwarzen Lochs: ein dunkler Kreis mit leuchtendem Ring. Dafür arbeiteten Teleskope auf der ganzen Welt zusammen." }
        ],
        quiz: [
          { q: "Was kann einem Schwarzen Loch nicht entkommen?", a: ["Nicht einmal Licht", "Nur Steine", "Nur Raketen", "Nur Wasser"], c: 0, x: "Die Anziehung ist zu stark." },
          { q: "Wann gab es das erste Foto eines Schwarzen Lochs?", a: ["2019", "1969", "1900", "2001"], c: 0, x: "Vom Event Horizon Telescope." }
        ],
        yt: ["Schwarzes Loch einfach erklärt", "Schwarze Löcher Kurzgesagt deutsch"]
      }
    ]
  },
  {
    id: "natur", name: "Natur & Tiere", emoji: "🐾", color: "#2d6a4f",
    desc: "Tiere, Pflanzen und unser Klima.",
    lessons: [
      {
        id: "tierrekorde", title: "Tier-Rekorde", emoji: "🐋", w: "Blauwal",
        cards: [
          { h: "Das größte Tier", e: "🐋", w: "Blauwal", t: "Der Blauwal ist das größte Tier, das je gelebt hat – bis zu 30 Meter lang. Sein Herz ist so groß wie ein kleines Auto." },
          { h: "Der schnellste Läufer", e: "🐆", w: "Gepard", t: "Der Gepard schafft fast 100 km/h – so schnell wie ein Auto auf der Landstraße. Aber nur kurz, dann ist er erschöpft." },
          { h: "Der schnellste Flieger", e: "🦅", w: "Wanderfalke", t: "Der Wanderfalke stürzt sich mit über 300 km/h auf seine Beute. Damit ist er das schnellste Tier der Welt." },
          { h: "Der Langschläfer", e: "🐨", w: "Koala", t: "Koalas schlafen bis zu 20 Stunden am Tag. Ihre Eukalyptus-Blätter liefern wenig Energie – da heißt es: Akku sparen!" }
        ],
        quiz: [
          { q: "Welches ist das größte Tier aller Zeiten?", a: ["Blauwal", "Elefant", "T. rex", "Giraffe"], c: 0, x: "Bis zu 30 m lang und 150 Tonnen schwer." },
          { q: "Welches Tier ist am schnellsten?", a: ["Wanderfalke", "Gepard", "Pferd", "Hai"], c: 0, x: "Über 300 km/h im Sturzflug." }
        ],
        yt: ["Tierrekorde Doku", "Blauwal Doku deutsch"]
      },
      {
        id: "klima", title: "Der Klimawandel", emoji: "🌡️", w: "Globale_Erwärmung",
        cards: [
          { h: "Die Erde wird wärmer", e: "🌡️", w: "Globale_Erwärmung", t: "Seit etwa 150 Jahren wird es auf der Erde im Durchschnitt wärmer. Schon ein, zwei Grad mehr verändern Wetter, Meere und das Leben von Tieren und Menschen." },
          { h: "Der Treibhauseffekt", e: "🏠", w: "Treibhauseffekt", t: "Gase wie CO₂ wirken wie eine Decke um die Erde: Sie halten Wärme fest. Wenn wir Kohle, Öl und Gas verbrennen, wird die Decke immer dicker." },
          { h: "Die Folgen", e: "🧊", w: "Gletscherschmelze", t: "Gletscher schmelzen, der Meeresspiegel steigt, Hitzewellen und Unwetter werden häufiger. Eisbären verlieren ihr Jagdgebiet auf dem Meereis." },
          { h: "Was hilft?", e: "🌱", w: "Erneuerbare_Energie", t: "Strom aus Sonne und Wind, Bahn und Fahrrad statt Auto, weniger Müll und Energie sparen. Viele Länder haben sich im Pariser Abkommen 2015 vorgenommen, die Erwärmung zu begrenzen." }
        ],
        quiz: [
          { q: "Welches Gas trägt stark zum Klimawandel bei?", a: ["CO₂", "Sauerstoff", "Helium", "Stickstoff"], c: 0, x: "Kohlenstoffdioxid entsteht beim Verbrennen." },
          { q: "Was hilft gegen den Klimawandel?", a: ["Strom aus Sonne und Wind", "Mehr Kohle verbrennen", "Wälder abholzen", "Mehr fliegen"], c: 0, x: "Erneuerbare Energie stößt kaum CO₂ aus." }
        ],
        yt: ["Klimawandel einfach erklärt", "Treibhauseffekt einfach erklärt"]
      }
    ]
  },
  {
    id: "geld", name: "Geld & Wirtschaft", emoji: "💰", color: "#e9a400",
    desc: "Wie Geld funktioniert und warum Dinge teurer werden.",
    lessons: [
      {
        id: "geld", title: "Was ist Geld?", emoji: "💶", w: "Geld",
        cards: [
          { h: "Erst gab es Tauschhandel", e: "🔄", w: "Tauschhandel", t: "Früher tauschte man direkt: drei Hühner gegen einen Sack Mehl. Problem: Was, wenn der Müller keine Hühner wollte?" },
          { h: "Münzen & Scheine", e: "🪙", w: "Münze", t: "Darum erfand man Geld. Vor etwa 2.600 Jahren gab es in Lydien (heute Türkei) die ersten Münzen. Papiergeld kam später aus China." },
          { h: "Geld ist Vertrauen", e: "🤝", w: "Geld", t: "Ein 10-Euro-Schein ist eigentlich nur bedrucktes Papier. Er ist wertvoll, weil alle darauf vertrauen, dass man damit etwas kaufen kann." },
          { h: "Inflation", e: "📈", w: "Inflation", t: "Wenn die Preise steigen, kannst du mit demselben Geld weniger kaufen. Das nennt man Inflation. Eine Kugel Eis kostete früher viel weniger als heute." }
        ],
        quiz: [
          { q: "Was gab es vor dem Geld?", a: ["Tauschhandel", "Kreditkarten", "Online-Banking", "Bitcoin"], c: 0, x: "Ware gegen Ware." },
          { q: "Was bedeutet Inflation?", a: ["Preise steigen", "Preise sinken", "Geld wird gedruckt verboten", "Banken schließen"], c: 0, x: "Das Geld verliert an Kaufkraft." }
        ],
        yt: ["Geld einfach erklärt", "Inflation einfach erklärt"]
      },
      {
        id: "angebot", title: "Angebot & Nachfrage", emoji: "⚖️", w: "Angebot_und_Nachfrage",
        cards: [
          { h: "Wer bestimmt den Preis?", e: "🏷️", w: "Preis", t: "Preise entstehen oft durch Angebot (wie viel es gibt) und Nachfrage (wie viele es haben wollen)." },
          { h: "Beispiel Konzertkarten", e: "🎤", w: "Angebot_und_Nachfrage", t: "Ein Superstar gibt ein Konzert mit 1.000 Plätzen, aber 100.000 Fans wollen hin. Die Karten sind knapp – also werden sie teuer." },
          { h: "Beispiel Erdbeeren", e: "🍓", w: "Erdbeere", t: "Im Sommer gibt es Erdbeeren überall – das Angebot ist groß, der Preis sinkt. Im Winter sind sie selten und darum teurer." }
        ],
        quiz: [
          { q: "Viele wollen etwas, aber es gibt wenig davon. Was passiert?", a: ["Der Preis steigt", "Der Preis sinkt", "Nichts", "Es wird verschenkt"], c: 0, x: "Knappheit macht Dinge teurer." }
        ],
        yt: ["Angebot und Nachfrage einfach erklärt", "Wirtschaft einfach erklärt"]
      }
    ]
  },
  {
    id: "technik", name: "Technik", emoji: "🤖", color: "#0077b6",
    desc: "Internet, Computer und Künstliche Intelligenz.",
    lessons: [
      {
        id: "internet", title: "Das Internet", emoji: "🌐", w: "Internet",
        cards: [
          { h: "Ein Netz aus Computern", e: "🕸️", w: "Internet", t: "Das Internet ist ein riesiges Netz, das Milliarden Computer und Handys auf der ganzen Welt verbindet – über Kabel, sogar durch den Meeresboden, und Funk." },
          { h: "Wie alles begann", e: "📡", w: "Arpanet", t: "1969 wurden in den USA die ersten Computer im „ARPANET“ verbunden. Die erste Nachricht sollte „LOGIN“ sein – nach „LO“ stürzte das System ab!" },
          { h: "Das World Wide Web", e: "🖥️", w: "Tim_Berners-Lee", t: "Tim Berners-Lee erfand 1989 am Forschungszentrum CERN das World Wide Web – also Webseiten mit Links. Daher kommt das „www“." },
          { h: "Datenpakete", e: "📦", w: "Datenpaket", t: "Wenn du ein Foto schickst, wird es in viele kleine Pakete zerlegt. Die nehmen verschiedene Wege und werden am Ziel wieder zusammengesetzt – in Sekundenbruchteilen." }
        ],
        quiz: [
          { q: "Wer erfand das World Wide Web?", a: ["Tim Berners-Lee", "Bill Gates", "Steve Jobs", "Mark Zuckerberg"], c: 0, x: "1989 am CERN in der Schweiz." },
          { q: "Wie reisen Daten durchs Internet?", a: ["In kleinen Paketen", "Als ganzer Block", "Per Post", "Nur über Satelliten"], c: 0, x: "Sie werden am Ziel wieder zusammengesetzt." }
        ],
        yt: ["Wie funktioniert das Internet einfach erklärt", "Geschichte des Internets"]
      },
      {
        id: "ki", title: "Künstliche Intelligenz", emoji: "🤖", w: "Künstliche_Intelligenz",
        cards: [
          { h: "Was ist KI?", e: "🤖", w: "Künstliche_Intelligenz", t: "Künstliche Intelligenz (KI) sind Computerprogramme, die Dinge lernen, die sonst Menschen können: Sprache verstehen, Bilder erkennen oder Fragen beantworten." },
          { h: "Lernen aus Beispielen", e: "🐱", w: "Maschinelles_Lernen", t: "Eine KI lernt aus sehr vielen Beispielen. Zeigt man ihr tausende Katzenfotos, erkennt sie irgendwann selbst eine Katze – ohne dass jemand „Ohren, Schnurrhaare“ einprogrammiert." },
          { h: "KI im Alltag", e: "📱", w: "Sprachassistent", t: "KI steckt in Sprachassistenten, Übersetzern, Navi-Apps und Video-Empfehlungen. Auch Chatbots, die Texte schreiben, gehören dazu." },
          { h: "Klug, aber nicht perfekt", e: "⚠️", t: "KI kann Fehler machen und manchmal falsche Dinge sehr überzeugend behaupten. Darum: Wichtige Infos immer noch selbst prüfen!" }
        ],
        quiz: [
          { q: "Wie lernt eine KI?", a: ["Aus vielen Beispielen", "Durch Schlafen", "Gar nicht", "Nur durch Zufall"], c: 0, x: "Das nennt man maschinelles Lernen." },
          { q: "Was sollte man bei KI-Antworten tun?", a: ["Wichtiges selbst prüfen", "Alles blind glauben", "Nie benutzen", "Den Computer ausschalten"], c: 0, x: "KI kann sich irren." }
        ],
        yt: ["Künstliche Intelligenz einfach erklärt", "Wie lernt eine KI erklärt"]
      }
    ]
  }
];

const FACTS = [
  "🐙 Kraken haben drei Herzen und blaues Blut.",
  "🍯 Honig wird nie schlecht – in ägyptischen Gräbern fand man essbaren Honig.",
  "🌍 Die Erde dreht sich mit etwa 1.670 km/h am Äquator.",
  "🦒 Giraffen haben genauso viele Halswirbel wie Menschen: sieben.",
  "⚡ Ein Blitz ist etwa fünfmal heißer als die Oberfläche der Sonne.",
  "🐌 Manche Schnecken können bis zu drei Jahre schlafen.",
  "🗼 Der Eiffelturm wird im Sommer durch die Hitze bis zu 15 cm größer.",
  "🧠 Dein Gehirn verbraucht etwa 20 % deiner Energie.",
  "🌕 Auf dem Mond würdest du nur ein Sechstel so viel wiegen.",
  "🐝 Bienen können Gesichter erkennen.",
  "🏰 Das Wort „Kaiser“ kommt von Julius Caesar.",
  "🦈 Haie gab es schon vor den Bäumen.",
  "🍌 Bananen sind leicht radioaktiv – aber völlig ungefährlich.",
  "🇫🇷 Frankreich hat die meisten Zeitzonen der Welt – wegen seiner Überseegebiete."
];

// Zusätzliche YouTube-Kanäle (Suchlinks), nach Thema
const CHANNELS = [
  { name: "MrWissen2go", topic: "Politik & Geschichte" },
  { name: "musstewissen Geschichte", topic: "Geschichte für die Schule" },
  { name: "Terra X", topic: "Dokus zu Geschichte & Natur" },
  { name: "Kurzgesagt – In a Nutshell (Deutsch)", topic: "Wissenschaft & Weltraum" },
  { name: "simpleclub", topic: "Schulstoff einfach erklärt" },
  { name: "Simplicissimus", topic: "Spannende Hintergründe" },
  { name: "logo! Nachrichten", topic: "Nachrichten für Kinder" },
  { name: "Wissen macht Ah!", topic: "Allgemeinwissen" }
];

// Kompaktes Format für weitere Lektionen (siehe js/more/*.js):
// [id, titel, emoji, wiki, [[überschrift, emoji, wiki, text], ...], [[frage, richtig, falsch, falsch, falsch, erklärung], ...], [youtube-suchen]?]
function addLessons(catId, list) {
  const c = CATEGORIES.find((x) => x.id === catId);
  list.forEach(([id, title, emoji, w, cards, quiz, yt]) => c.lessons.push({
    id: catId + "-" + id, title, emoji, w,
    cards: cards.map(([h, e, w, t]) => ({ h, e, w, t })),
    quiz: quiz.map((q) => ({ q: q[0], a: q.slice(1, -1), c: 0, x: q[q.length - 1] })),
    yt: yt || [title + " einfach erklärt", title + " Doku deutsch"]
  }));
}

// Erklär-Stufen: pro Lektion für jede Karte [Kinder-Text, Zusatz für Erwachsene] (siehe js/levels/*.js)
var LEVELS = {};
function LV(map) { Object.assign(LEVELS, map); }
