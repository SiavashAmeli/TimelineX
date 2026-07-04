// Calendar conversion utilities.
//
// Everything routes through a Julian Day Number (JDN) so the three supported
// calendars stay perfectly in sync with each other and with the internal
// "decimal year" value used to place events on the timeline axis.
//
// - Gregorian <-> JDN uses the standard proleptic-Gregorian algorithm
//   (Fliegel & Van Flandern), which is well-defined for negative
//   (BCE, astronomical numbering) years too.
// - Gregorian <-> Persian (Jalali / Solar Hijri) uses the well known
//   public-domain "jalaali" algorithm (Borkowski / Pournader / Assadi).
// - Gregorian <-> Hijri uses the standard tabular (civil) Islamic calendar.
//   This is an arithmetic approximation, not the observational calendar,
//   so it can differ from a religious authority's declared date by a day
//   or two. That's expected and fine for chronological visualization.

export type CalendarSystem = "gregorian" | "persian" | "hijri";

export interface SimpleDate {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

function div(a: number, b: number): number {
  return ~~(a / b);
}
function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

// ---------- Gregorian <-> JDN ----------

export function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045
  );
}

export function jdnToGregorian(jdn: number): SimpleDate {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d2) / 4);
  const m2 = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m2 + 2) / 5) + 1;
  const month = m2 + 3 - 12 * Math.floor(m2 / 10);
  const year = 100 * b + d2 - 4800 + Math.floor(m2 / 10);
  return { y: year, m: month, d: day };
}

// ---------- Persian (Jalali) <-> JDN ----------

const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
];

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const bl = JALALI_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];
  if (jy < jp || jy >= JALALI_BREAKS[bl - 1]) {
    // Outside the tabulated range (roughly 700 BCE - 2500 CE). Fall back to
    // a simple approximation rather than throwing, so wildly ancient/future
    // dates still place on the timeline (just without exact leap accuracy).
    const approxMarch = 21;
    return { leap: jy % 4 === 3 ? 1 : 0, gy, march: approxMarch };
  }
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = JALALI_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

export function jalaliToJdn(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return (
    gregorianToJdn(r.gy, 3, r.march) +
    (jm - 1) * 31 -
    div(jm, 7) * (jm - 7) +
    jd -
    1
  );
}

export function jdnToJalali(jdn: number): SimpleDate {
  const gy = jdnToGregorian(jdn).y;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = gregorianToJdn(r.gy, 3, r.march);
  let k = jdn - jdn1f;
  let jm: number;
  let jd: number;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { y: jy, m: jm, d: jd };
    } else {
      k -= 186;
    }
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { y: jy, m: jm, d: jd };
}

// ---------- Islamic (tabular civil Hijri) <-> JDN ----------

const ISLAMIC_EPOCH = 1948440; // JDN of 1 Muharram, AH 1 (civil/tabular epoch)

export function islamicToJdn(hy: number, hm: number, hd: number): number {
  return (
    hd +
    Math.ceil(29.5 * (hm - 1)) +
    (hy - 1) * 354 +
    Math.floor((3 + 11 * hy) / 30) +
    ISLAMIC_EPOCH -
    1
  );
}

export function jdnToIslamic(jdn: number): SimpleDate {
  let n = Math.floor(jdn) - ISLAMIC_EPOCH + 10632;
  const cycles = Math.floor((n - 1) / 10631);
  n = n - 10631 * cycles + 354;
  const j =
    Math.floor((10985 - n) / 5316) * Math.floor((50 * n) / 17719) +
    Math.floor(n / 5670) * Math.floor((43 * n) / 15238);
  n =
    n -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const m = Math.floor((24 * n) / 709);
  const d = n - Math.floor((709 * m) / 24);
  const y = 30 * cycles + j - 30;
  return { y, m: m + 1, d };
}

// ---------- Generic helpers ----------

export function toGregorian(cal: CalendarSystem, dt: SimpleDate): SimpleDate {
  if (cal === "gregorian") return dt;
  const jdn =
    cal === "persian"
      ? jalaliToJdn(dt.y, dt.m, dt.d)
      : islamicToJdn(dt.y, dt.m, dt.d);
  return jdnToGregorian(jdn);
}

export function fromGregorian(cal: CalendarSystem, g: SimpleDate): SimpleDate {
  if (cal === "gregorian") return g;
  const jdn = gregorianToJdn(g.y, g.m, g.d);
  return cal === "persian" ? jdnToJalali(jdn) : jdnToIslamic(jdn);
}

const GREG_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapGregorian(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * Decimal-year representation used for placing events on the timeline axis
 * (e.g. 1945.35). Uses astronomical year numbering (year 0 = 1 BCE), which
 * is a deliberate, consistent internal convention -- not intended to match
 * a historian's "1 BC" labeling exactly.
 */
export function decimalYearFromGregorian(g: SimpleDate): number {
  let days = g.d;
  for (let i = 0; i < g.m - 1; i++) {
    days += GREG_MONTH_DAYS[i];
    if (i === 1 && isLeapGregorian(g.y)) days += 1;
  }
  const totalDays = isLeapGregorian(g.y) ? 366 : 365;
  return g.y + (days - 1) / totalDays;
}

export function decimalYearToGregorian(dec: number): SimpleDate {
  const jdn = gregorianToJdn(Math.floor(dec), 1, 1);
  const frac = dec - Math.floor(dec);
  const totalDays = isLeapGregorian(Math.floor(dec)) ? 366 : 365;
  return jdnToGregorian(jdn + Math.round(frac * totalDays));
}

export const CALENDAR_LABELS: Record<CalendarSystem, string> = {
  gregorian: "GR",
  persian: "SH",
  hijri: "HQ",
};

export const CALENDAR_FULL_NAMES: Record<CalendarSystem, string> = {
  gregorian: "Gregorian",
  persian: "Hijri Shamsi",
  hijri: "Hijri Qamari",
};

export const CALENDAR_MONTH_NAMES: Record<CalendarSystem, string[]> = {
  gregorian: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
  persian: [
    "Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar",
    "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand",
  ],
  hijri: [
    "Muharram", "Safar", "Rabi I", "Rabi II", "Jumada I", "Jumada II",
    "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
  ],
};

export function formatSimpleDate(cal: CalendarSystem, dt: SimpleDate): string {
  const months = CALENDAR_MONTH_NAMES[cal];
  const monthName = months[Math.min(Math.max(dt.m - 1, 0), 11)];
  return `${dt.d} ${monthName} ${dt.y}`;
}

/**
 * Formats a SimpleDate back into a frontmatter-writable string, e.g.
 * "1945-05-09" or "-531-03-15". Used when a drag/resize interaction on the
 * timeline needs to write a new date back to a note.
 */
export function toFrontmatterDateString(dt: SimpleDate): string {
  const pad = (n: number) => String(Math.max(1, Math.min(99, n))).padStart(2, "0");
  return `${dt.y}-${pad(dt.m)}-${pad(dt.d)}`;
}

export function monthStartJdn(cal: CalendarSystem, y: number, m: number): number {
  if (cal === "gregorian") return gregorianToJdn(y, m, 1);
  if (cal === "persian") return jalaliToJdn(y, m, 1);
  return islamicToJdn(y, m, 1);
}

/**
 * Parses a flexible frontmatter date value: a bare year number, "YYYY",
 * "YYYY-MM", or "YYYY-MM-DD" (leading "-" allowed for negative/BCE years,
 * e.g. "-0531-03-15"). Returns null if it can't be parsed.
 */
export function parseFlexibleDate(raw: unknown): SimpleDate | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "number" && !isNaN(raw)) {
    return { y: raw, m: 1, d: 1 };
  }
  const s = String(raw).trim();
  const match = s.match(/^(-?\d{1,6})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 1;
  const d = match[3] ? parseInt(match[3], 10) : 1;
  return { y, m: Math.min(Math.max(m, 1), 12), d: Math.min(Math.max(d, 1), 31) };
}
