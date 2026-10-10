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

  // ---------- Popular calculators (links) ----------

  const popularCalculators = [
    { icon: '🎂', title: 'Calculadora de Edad', desc: 'Edad exacta en años, meses y días', href: '/calculadora-de-edad/' },
    { icon: '⏳', title: 'Cuenta Atrás de Cumpleaños', desc: 'Días, semanas y meses hasta tu cumpleaños', href: '/calculadora-de-cumpleanos/' },
    { icon: '📅', title: 'Diferencia de Edad', desc: 'Compara dos fechas de nacimiento', href: '/diferencia-de-edad/' },
    { icon: '🌗', title: 'Fase Lunar de Nacimiento', desc: 'Cómo estaba la luna el día que naciste', href: '/fase-lunar-de-nacimiento/' },
    { icon: '♈', title: 'Signo Zodiacal', desc: 'Tu signo y sus características', href: '/signo-zodiacal/' },
    { icon: '🐉', title: 'Horóscopo Chino', desc: 'Tu signo según el calendario chino', href: '/horoscopo-chino/' },
    { icon: '💎', title: 'Piedra de Nacimiento', desc: 'La piedra asociada a tu mes', href: '/piedra-de-nacimiento/' },
    { icon: '🌸', title: 'Flor de Nacimiento', desc: 'Tu flor del mes de nacimiento', href: '/flor-de-nacimiento/' },
    { icon: '🔢', title: 'Numerología', desc: 'Número de la vida y del cumpleaños', href: '/numerologia-fecha-nacimiento/' },
  ];

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
    `;
  }

  function statCard(label, value) {
    return `
      <div class="card p-4">
        <div class="text-xs mb-1" style="color: var(--color-body);">${label}</div>
        <div class="font-display font-bold text-xl" style="color: var(--color-heading);">${value}</div>
      </div>
    `;
  }

  function renderPopular() {
    const grid = document.getElementById('popular-grid');
    grid.innerHTML = popularCalculators.map(c => `
      <a href="${c.href}" class="card p-5 hover:shadow-md transition-shadow">
        <div class="text-2xl mb-2">${c.icon}</div>
        <h3 class="font-semibold mb-1">${c.title}</h3>
        <p class="text-sm" style="color: var(--color-body);">${c.desc}</p>
      </a>
    `).join('');
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

    renderPopular();
    renderFAQ();
  });

  // Expose for testing
  window.Calculad = { calculateAge, parseDate, daysBetween, completedUnits };
})();
