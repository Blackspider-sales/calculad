// Age calculation engine - pure, no dependencies
// All calculations local to browser. No data leaves the device.

(function() {
  'use strict';

  // ---------- Core date math ----------

  function parseDate(input) {
    // input like "1990-05-17" - parse as local date to avoid TZ shift
    const parts = input.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [y, m, d] = parts;
    const date = new Date(y, m - 1, d, 0, 0, 0, 0);
    // Validate the date actually matches input (rejects 2023-02-31 → 2023-03-03)
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }

  function daysBetween(a, b) {
    // Whole days between two local dates
    const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((db - da) / 86400000);
  }

  // Completed calendar units between two local dates
  function completedUnits(from, to) {
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();
    if (days < 0) {
      months -= 1;
      // days in previous month of `to`'s month
      const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  }

  // ---------- Public calculation ----------

  function calculateAge(dobInput, refInput) {
    const dob = parseDate(dobInput);
    const ref = parseDate(refInput);
    if (!dob || !ref) return { ok: false, error: 'Fecha inválida. Usa el formato correcto.' };
    if (ref < dob) return { ok: false, error: 'La fecha de cálculo debe ser posterior a la fecha de nacimiento.' };

    const units = completedUnits(dob, ref);
    const totalDays = daysBetween(dob, ref);
    const totalMonths = dob.getFullYear() * 12 + dob.getMonth() + (ref.getFullYear() * 12 + ref.getMonth() - dob.getMonth()) - units.months;
    // Recalculate total months cleanly
    let tm = (ref.getFullYear() - dob.getFullYear()) * 12 + (ref.getMonth() - dob.getMonth());
    if (ref.getDate() < dob.getDate()) tm -= 1;

    const result = {
      ok: true,
      dob: dobInput,
      ref: refInput,
      refDate: ref,
      dobDate: dob,
      years: units.years,
      months: units.months,
      days: units.days,
      totalMonths: tm,
      totalWeeks: Math.floor(totalDays / 7),
      totalDays: totalDays,
      totalHours: totalDays * 24,
      totalMinutes: totalDays * 1440,
      totalSeconds: totalDays * 86400,
    };

    // Birthday countdown
    const next = new Date(ref.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())) {
      next.setFullYear(next.getFullYear() + 1);
    }
    result.daysUntilBirthday = daysBetween(ref, next);
    result.weeksUntilBirthday = Math.floor(result.daysUntilBirthday / 7);
    result.nextBirthday = next;
    result.ageOnNextBirthday = ref.getFullYear() - dob.getFullYear() + (daysBetween(ref, next) > 0 ? 1 : 0);

    // Day of week of birth (Spanish)
    const dowNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    result.dayOfBirth = dowNames[dob.getDay()];

    return result;
  }

  // ---------- Birth-date insights (cultural and approximate) ----------

  const westernZodiac = [
    { name: 'Aries', symbol: '♈', element: 'Fuego', planet: 'Marte', startMonth: 3, startDay: 21, description: 'Aries se asocia culturalmente con la iniciativa y el impulso de abrir camino. En la tradición astrológica, se le atribuye una energía directa y valiente.' },
    { name: 'Tauro', symbol: '♉', element: 'Tierra', planet: 'Venus', startMonth: 4, startDay: 20, description: 'Tauro se vincula culturalmente con la constancia, el disfrute y la estabilidad. La astrología tradicional le atribuye una forma paciente y práctica de avanzar.' },
    { name: 'Géminis', symbol: '♊', element: 'Aire', planet: 'Mercurio', startMonth: 5, startDay: 21, description: 'Géminis se relaciona con la curiosidad, la conversación y el intercambio de ideas. La tradición astrológica lo describe como adaptable y ágil mentalmente.' },
    { name: 'Cáncer', symbol: '♋', element: 'Agua', planet: 'La Luna', startMonth: 6, startDay: 21, description: 'Cáncer se asocia culturalmente con el cuidado, la memoria y los vínculos cercanos. En la astrología se le atribuye una sensibilidad protectora e intuitiva.' },
    { name: 'Leo', symbol: '♌', element: 'Fuego', planet: 'El Sol', startMonth: 7, startDay: 23, description: 'Leo se vincula con la creatividad, la expresión personal y la generosidad. La tradición astrológica le atribuye calidez y gusto por brillar con autenticidad.' },
    { name: 'Virgo', symbol: '♍', element: 'Tierra', planet: 'Mercurio', startMonth: 8, startDay: 23, description: 'Virgo se relaciona con la observación, el orden y la vocación de servicio. La astrología tradicional lo describe como meticuloso y orientado a mejorar lo cotidiano.' },
    { name: 'Libra', symbol: '♎', element: 'Aire', planet: 'Venus', startMonth: 9, startDay: 23, description: 'Libra se asocia culturalmente con el equilibrio, la cooperación y la estética. En la tradición astrológica se le atribuye diplomacia y atención a la armonía.' },
    { name: 'Escorpio', symbol: '♏', element: 'Agua', planet: 'Plutón y Marte', startMonth: 10, startDay: 23, description: 'Escorpio se vincula con la intensidad, la reserva y la transformación. La astrología tradicional le atribuye profundidad emocional y gran determinación.' },
    { name: 'Sagitario', symbol: '♐', element: 'Fuego', planet: 'Júpiter', startMonth: 11, startDay: 22, description: 'Sagitario se relaciona con la exploración, el aprendizaje y la búsqueda de sentido. En la tradición astrológica se le atribuyen optimismo y franqueza.' },
    { name: 'Capricornio', symbol: '♑', element: 'Tierra', planet: 'Saturno', startMonth: 12, startDay: 22, description: 'Capricornio se asocia culturalmente con la responsabilidad, la perseverancia y las metas a largo plazo. La astrología tradicional le atribuye disciplina y ambición serena.' },
    { name: 'Acuario', symbol: '♒', element: 'Aire', planet: 'Urano y Saturno', startMonth: 1, startDay: 20, description: 'Acuario se vincula con la originalidad, las ideas colectivas y la independencia. En la tradición astrológica se le atribuye una mirada innovadora y poco convencional.' },
    { name: 'Piscis', symbol: '♓', element: 'Agua', planet: 'Neptuno y Júpiter', startMonth: 2, startDay: 19, description: 'Piscis se relaciona con la imaginación, la empatía y la vida interior. La astrología tradicional le atribuye sensibilidad y una fuerte intuición.' },
  ];

  const chineseZodiac = [
    { name: 'Rata', emoji: '🐀', description: 'La Rata se asocia culturalmente con el ingenio y la capacidad de adaptación. En el horóscopo chino tradicional, se le atribuyen iniciativa y sentido de la oportunidad.' },
    { name: 'Buey', emoji: '🐂', description: 'El Buey se vincula con la constancia, la paciencia y el trabajo sostenido. La tradición cultural lo describe como alguien fiable y firme en sus decisiones.' },
    { name: 'Tigre', emoji: '🐅', description: 'El Tigre se relaciona con el coraje, la energía y el espíritu independiente. En la tradición china se le atribuyen entusiasmo y una presencia decidida.' },
    { name: 'Conejo', emoji: '🐇', description: 'El Conejo se asocia con la amabilidad, la prudencia y la búsqueda de armonía. El horóscopo chino tradicional le atribuye tacto y sensibilidad social.' },
    { name: 'Dragón', emoji: '🐉', description: 'El Dragón se vincula con la ambición, el carisma y la imaginación. En la tradición china se le atribuyen confianza y una energía especialmente expansiva.' },
    { name: 'Serpiente', emoji: '🐍', description: 'La Serpiente se relaciona con la reflexión, la intuición y la estrategia. La tradición cultural le atribuye elegancia y una forma reservada de observar.' },
    { name: 'Caballo', emoji: '🐎', description: 'El Caballo se asocia con el movimiento, la libertad y el entusiasmo. En el horóscopo chino tradicional se le atribuyen sociabilidad e iniciativa.' },
    { name: 'Cabra', emoji: '🐐', description: 'La Cabra se vincula con la creatividad, la empatía y la apreciación de la belleza. La tradición china le atribuye una naturaleza serena y considerada.' },
    { name: 'Mono', emoji: '🐒', description: 'El Mono se relaciona con la curiosidad, la agudeza y el juego intelectual. En el horóscopo chino tradicional se le atribuyen ingenio y versatilidad.' },
    { name: 'Gallo', emoji: '🐓', description: 'El Gallo se asocia con la precisión, la seguridad y la expresión franca. La tradición cultural le atribuye atención al detalle y determinación.' },
    { name: 'Perro', emoji: '🐕', description: 'El Perro se vincula con la lealtad, la honestidad y el sentido de la justicia. En el horóscopo chino tradicional se le atribuyen compromiso y protección hacia los suyos.' },
    { name: 'Cerdo', emoji: '🐖', description: 'El Cerdo se relaciona con la generosidad, la sinceridad y el gusto por compartir. La tradición china le atribuye calidez y una disposición conciliadora.' },
  ];

  const chineseElements = ['Metal', 'Metal', 'Agua', 'Agua', 'Madera', 'Madera', 'Fuego', 'Fuego', 'Tierra', 'Tierra'];

  const birthMonthDetails = [
    { month: 'Enero', stone: 'Granate', flower: 'Garofillo', stoneMeaning: 'Simboliza protección, constancia y vínculos duraderos.', flowerMeaning: 'Se asocia con el afecto fiel y la admiración.' },
    { month: 'Febrero', stone: 'Amatista', flower: 'Violero', stoneMeaning: 'Tradicionalmente representa serenidad y claridad.', flowerMeaning: 'Evoca modestia, lealtad y sensibilidad.' },
    { month: 'Marzo', stone: 'Aguamarina', flower: 'Ranunculus', stoneMeaning: 'Se vincula con calma, valentía y comunicación.', flowerMeaning: 'Simboliza encanto y una personalidad radiante.' },
    { month: 'Abril', stone: 'Diamante', flower: 'Siruela', stoneMeaning: 'Se asocia con fortaleza, claridad y compromiso.', flowerMeaning: 'Representa renovación y esperanza.' },
    { month: 'Mayo', stone: 'Esmeralda', flower: 'Rosal', stoneMeaning: 'Tradicionalmente evoca crecimiento, equilibrio y esperanza.', flowerMeaning: 'Se relaciona con el amor y la gratitud.' },
    { month: 'Junio', stone: 'Perla', flower: 'Margarita', stoneMeaning: 'Simboliza pureza, sabiduría y serenidad.', flowerMeaning: 'Evoca sencillez, alegría y nuevos comienzos.' },
    { month: 'Julio', stone: 'Rubí', flower: 'Lirio', stoneMeaning: 'Se asocia con pasión, vitalidad y valor.', flowerMeaning: 'Representa renovación y afecto sincero.' },
    { month: 'Agosto', stone: 'Peridoto', flower: 'Gladiolo', stoneMeaning: 'Tradicionalmente simboliza optimismo y bienestar.', flowerMeaning: 'Evoca integridad, fuerza y recuerdo.' },
    { month: 'Septiembre', stone: 'Zafiro', flower: 'Astelia', stoneMeaning: 'Se vincula con sabiduría, lealtad y serenidad.', flowerMeaning: 'Se asocia con resistencia y distinción natural.' },
    { month: 'Octubre', stone: 'Ópalo', flower: 'Crisantemo', stoneMeaning: 'Representa creatividad, esperanza y transformación.', flowerMeaning: 'Evoca amistad, alegría y larga vida.' },
    { month: 'Noviembre', stone: 'Topacio', flower: 'Cafeto', stoneMeaning: 'Tradicionalmente se asocia con confianza y calidez.', flowerMeaning: 'Simboliza hospitalidad, energía y perseverancia.' },
    { month: 'Diciembre', stone: 'Turquesa', flower: 'Rosita de Navidad', stoneMeaning: 'Se relaciona con protección, amistad y buenos deseos.', flowerMeaning: 'Evoca afecto y celebración en tiempos fríos.' },
  ];

  function getWesternZodiac(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // The source list begins with Aries, so reorder it by calendar start for the comparison.
    const signsByStart = [...westernZodiac.slice(10), ...westernZodiac.slice(0, 10)];
    for (let i = signsByStart.length - 1; i >= 0; i -= 1) {
      const sign = signsByStart[i];
      if (month > sign.startMonth || (month === sign.startMonth && day >= sign.startDay)) return sign;
    }
    return westernZodiac[9]; // Capricornio: del 22 de diciembre al 19 de enero
  }

  function getChineseZodiac(date) {
    let zodiacYear = date.getFullYear();
    // Aproximamos el Año Nuevo chino al 22 de enero; la fecha real varía cada año.
    if (date.getMonth() === 0 && date.getDate() < 22) zodiacYear -= 1;
    const index = ((zodiacYear - 4) % 12 + 12) % 12;
    return { ...chineseZodiac[index], element: chineseElements[((zodiacYear % 10) + 10) % 10], zodiacYear };
  }

  function getMoonPhase(date) {
    const synodicMonth = 29.530588;
    const epoch = Date.UTC(2000, 0, 6, 18, 14, 0); // Known new moon epoch, UTC
    const birthNoonUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    const elapsedDays = (birthNoonUtc - epoch) / 86400000;
    const age = ((elapsedDays % synodicMonth) + synodicMonth) % synodicMonth;
    const illumination = ((1 - Math.cos((2 * Math.PI * age) / synodicMonth)) / 2) * 100;
    const phaseBoundaries = [
      [1.84566175, 'Luna nueva'], [5.53698525, 'Luna creciente'], [9.22830875, 'Cuarto creciente'],
      [12.91963225, 'Gibosa creciente'], [16.61095575, 'Luna llena'], [20.30227925, 'Gibosa menguante'],
      [23.99360275, 'Cuarto menguante'], [27.68492625, 'Luna menguante'],
    ];
    const found = phaseBoundaries.find(([limit]) => age < limit);
    return {
      name: found ? found[1] : 'Luna nueva',
      age,
      illumination,
      direction: age < synodicMonth / 2 ? 'Creciente' : 'Menguante',
    };
  }

  function addDays(date, days) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() + days);
    return result;
  }

  function getMilestones(dob, ref) {
    const oneBillionSeconds = new Date(dob.getTime() + 1000000000 * 1000);
    return [
      { label: '1.000 días', date: addDays(dob, 1000), note: 'Tus primeros mil días de vida.' },
      { label: '1.000 semanas', date: addDays(dob, 7000), note: 'Mil semanas desde tu nacimiento.' },
      { label: '10.000 días', date: addDays(dob, 10000), note: 'Diez mil días desde tu nacimiento.' },
      { label: '1.000 millones de segundos', date: oneBillionSeconds, note: 'Estimado desde el inicio de tu fecha de nacimiento.' },
    ].map(item => ({ ...item, completed: item.date <= ref })).sort((a, b) => a.date - b.date);
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  function moonSvg(moon) {
    const illuminationRatio = moon.illumination / 100;
    const shadowX = moon.direction === 'Creciente' ? 50 - 80 * illuminationRatio : 50 + 80 * illuminationRatio;
    return `<svg class="moon-visual" viewBox="0 0 100 100" role="img" aria-label="Ilustración aproximada de ${moon.name}">
      <defs><clipPath id="moon-clip"><circle cx="50" cy="50" r="40" /></clipPath></defs>
      <circle cx="50" cy="50" r="40" fill="#f6d98b" />
      <circle cx="${shadowX.toFixed(2)}" cy="50" r="40" fill="var(--color-bg)" opacity="0.92" clip-path="url(#moon-clip)" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-border)" stroke-width="2" />
    </svg>`;
  }

  // ---------- FAQ ----------

  const faqs = [
    { q: '¿Cómo calculo mi edad exacta?', a: 'Ingresa tu fecha de nacimiento y la calculadora restará los días de calendario desde tu cumpleaños hasta hoy. No divide entre 365: cuenta años completos, luego meses completos desde tu último cumpleaños, y luego los días restantes.' },
    { q: '¿La calculadora maneja los años bisiestos?', a: 'Sí. Cuenta el 29 de febrero en cada año bisiesto según la regla gregoriana (años divisibles entre 4, excepto siglos no divisibles entre 400).' },
    { q: '¿Qué pasa si nací el 29 de febrero?', a: 'En años no bisiestos, tu cumpleaños se celebra el 28 de febrero. La calculadora lo maneja automáticamente.' },
    { q: '¿Se guarda mi fecha de nacimiento?', a: 'No. Todo el cálculo se realiza en tu navegador. No se envía ningún dato a un servidor.' },
    { q: '¿Puedo calcular mi edad en una fecha del pasado o futuro?', a: 'Sí. Usa el campo "Calcular en la fecha" para cualquier día pasado o futuro.' },
  ];

  // ---------- Render ----------

  function renderResults(r) {
    const el = document.getElementById('results');
    el.classList.remove('hidden');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const big = r.years;
    const small = `${r.months} meses y ${r.days} días`;
    const western = getWesternZodiac(r.dobDate);
    const chinese = getChineseZodiac(r.dobDate);
    const moon = getMoonPhase(r.dobDate);
    const birthDetails = birthMonthDetails[r.dobDate.getMonth()];
    const milestones = getMilestones(r.dobDate, r.refDate);
    el.innerHTML = `
      <div class="card p-6 md:p-8">
        <div class="text-center mb-6">
          <p class="text-sm mb-1" style="color: var(--color-body);">Tu edad exacta es</p>
          <div class="font-display font-extrabold text-5xl md:text-6xl mb-2" style="color: var(--color-primary);">${big}</div>
          <div class="text-lg md:text-xl font-semibold" style="color: var(--color-heading);">${small}</div>
          <div class="text-sm mt-1" style="color: var(--color-body);">Naciste un ${r.dayOfBirth}</div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          ${statCard('Meses', r.totalMonths.toLocaleString('es'))}
          ${statCard('Semanas', r.totalWeeks.toLocaleString('es'))}
          ${statCard('Días', r.totalDays.toLocaleString('es'))}
          ${statCard('Horas', r.totalHours.toLocaleString('es'))}
        </div>
        <div class="rounded-lg p-4" style="background-color: var(--color-highlight);">
          <p class="text-sm font-semibold mb-1" style="color: var(--color-heading);">🎂 Tu próximo cumpleaños</p>
          <p class="text-sm" style="color: var(--color-body);">
            Te quedan <strong>${r.daysUntilBirthday}</strong> días (<strong>${r.weeksUntilBirthday}</strong> semanas).
            Cumplirás <strong>${r.ageOnNextBirthday}</strong> años.
          </p>
        </div>
      </div>
      <section class="mt-6" aria-labelledby="zodiaco-title">
        <h2 id="zodiaco-title" class="text-2xl font-display font-bold mb-3">Tu zodiaco</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${zodiacCard('Zodiaco occidental', western.symbol, western.name, western.element, western.planet, western.description)}
          ${zodiacCard('Zodiaco chino', chinese.emoji, chinese.name, chinese.element, 'No aplica en la tradición china', chinese.description)}
        </div>
        <p class="text-xs mt-3" style="color: var(--color-body);">Las interpretaciones de la astrologia son culturales y de entretenimiento, no cientificas.</p>
      </section>
      <section class="card p-6 mt-6 moon-card" aria-labelledby="luna-title">
        <div class="moon-layout">
          ${moonSvg(moon)}
          <div>
            <p class="text-sm font-semibold mb-1" style="color: var(--color-primary);">Fase lunar al nacer</p>
            <h2 id="luna-title" class="text-2xl font-display font-bold mb-2">${moon.name}</h2>
            <div class="moon-stats">
              <span>Iluminación aproximada: <strong>${Math.round(moon.illumination)} %</strong></span>
              <span>Edad lunar: <strong>${moon.age.toFixed(1)} días</strong></span>
              <span>Estado: <strong>${moon.direction}</strong></span>
            </div>
            <p class="text-xs mt-3" style="color: var(--color-body);">Cálculo astronómico aproximado: al no indicar hora de nacimiento, se usa el mediodía UTC de esa fecha.</p>
          </div>
        </div>
      </section>
      <section class="mt-6" aria-labelledby="nacimiento-title">
        <h2 id="nacimiento-title" class="text-2xl font-display font-bold mb-3">Símbolos de ${birthDetails.month}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${birthCard('Piedra de nacimiento', '💎', birthDetails.stone, birthDetails.stoneMeaning)}
          ${birthCard('Flor de nacimiento', '🌸', birthDetails.flower, birthDetails.flowerMeaning)}
        </div>
      </section>
      <section class="card p-6 mt-6" aria-labelledby="hitos-title">
        <p class="text-sm font-semibold mb-1" style="color: var(--color-primary);">Línea de vida</p>
        <h2 id="hitos-title" class="text-2xl font-display font-bold mb-4">Hitos de tiempo</h2>
        <ol class="milestone-timeline">
          ${milestones.map(milestone => `<li class="milestone ${milestone.completed ? 'is-complete' : 'is-upcoming'}">
            <span class="milestone-dot" aria-hidden="true"></span>
            <div>
              <p class="text-sm font-semibold" style="color: var(--color-heading);">${milestone.label} <span class="milestone-status">${milestone.completed ? 'Completado' : 'Próximo'}</span></p>
              <p class="text-sm" style="color: var(--color-body);">${formatDate(milestone.date)} · ${milestone.note}</p>
            </div>
          </li>`).join('')}
        </ol>
        <p class="text-xs mt-3" style="color: var(--color-body);">El hito de mil millones de segundos es una estimación porque no se indicó la hora de nacimiento.</p>
      </section>
    `;
  }

  function zodiacCard(title, symbol, name, element, planet, description) {
    return `
      <article class="card p-5">
        <div class="flex items-center gap-3 mb-3">
          <span class="zodiac-symbol" aria-hidden="true">${symbol}</span>
          <div><p class="text-xs" style="color: var(--color-body);">${title}</p><h3 class="text-xl font-display font-bold">${name}</h3></div>
        </div>
        <div class="zodiac-details text-sm mb-3" style="color: var(--color-body);">
          <span><strong>Elemento:</strong> ${element}</span>
          <span><strong>Planeta regente:</strong> ${planet}</span>
        </div>
        <p class="text-sm" style="color: var(--color-body);">${description}</p>
      </article>`;
  }

  function birthCard(title, icon, name, meaning) {
    return `
      <article class="card p-5">
        <div class="flex items-center gap-3 mb-2"><span class="birth-icon" aria-hidden="true">${icon}</span><div><p class="text-xs" style="color: var(--color-body);">${title}</p><h3 class="text-xl font-display font-bold">${name}</h3></div></div>
        <p class="text-sm" style="color: var(--color-body);">${meaning}</p>
      </article>`;
  }

  function statCard(label, value) {
    return `
      <div class="card p-4">
        <div class="text-xs mb-1" style="color: var(--color-body);">${label}</div>
        <div class="font-display font-bold text-xl" style="color: var(--color-heading);">${value}</div>
      </div>
    `;
  }

  function renderFAQ() {
    const list = document.getElementById('faq-list');
    list.innerHTML = faqs.map(f => `
      <details class="card p-5">
        <summary class="font-semibold cursor-pointer" style="color: var(--color-heading);">${f.q}</summary>
        <p class="mt-3 text-sm" style="color: var(--color-body);">${f.a}</p>
      </details>
    `).join('');
  }

  // ---------- Init ----------

  document.addEventListener('DOMContentLoaded', function() {
    // Set default ref date to today
    const ref = document.getElementById('ref');
    const today = new Date();
    ref.value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    // Update theme icon
    function updateIcon() {
      const dark = document.documentElement.classList.contains('dark');
      const icon = document.getElementById('theme-icon');
      if (icon) icon.textContent = dark ? '☀️' : '🌙';
      const button = document.querySelector('[data-theme-toggle]');
      if (button) {
        button.setAttribute('aria-pressed', String(dark));
        button.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
      }
    }
    updateIcon();
    window.addEventListener('themechange', updateIcon);

    // Form submit
    document.getElementById('age-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const dob = document.getElementById('dob').value;
      const ref = document.getElementById('ref').value;
      const r = calculateAge(dob, ref);
      if (!r.ok) {
        const el = document.getElementById('results');
        el.classList.remove('hidden');
        el.innerHTML = `<div class="card p-6 text-center" style="color: var(--color-heading);">⚠️ ${r.error}</div>`;
        return;
      }
      renderResults(r);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(event) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', this.getAttribute('href'));
      });
    });

    renderFAQ();
  });

  // Expose for testing
  window.Calculad = {
    calculateAge, parseDate, daysBetween, completedUnits,
    getWesternZodiac, getChineseZodiac, getMoonPhase, getMilestones
  };
})();
